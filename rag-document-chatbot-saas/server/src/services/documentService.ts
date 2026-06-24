import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Express } from "express";
import { billingPlans, isPlanId } from "../config/billingPlans.js";
import { env } from "../config/env.js";
import { supabaseAdmin } from "../config/supabase.js";
import { chunkPages } from "./chunkingService.js";
import { createEmbeddings } from "./embeddingService.js";
import { extractPdfText } from "./pdfService.js";

type DocumentRow = {
  id: string;
  user_id: string;
  title: string;
  file_path: string;
  file_url: string | null;
  status: "processing" | "ready" | "failed";
  total_pages: number | null;
  created_at: string;
};

type UploadProfileRow = {
  plan: string;
  monthly_upload_limit: number;
};

export type UploadedDocument = {
  id: string;
  title: string;
  filePath: string;
  status: "processing" | "ready" | "failed";
  totalPages: number;
  fileSize: number;
  createdAt: string;
};

const INSERT_BATCH_SIZE = 100;

export class DocumentServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

function isMissingSchemaError(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST205" ||
    error?.code === "PGRST204" ||
    error?.message?.includes("schema cache") === true
  );
}

function schemaSetupError() {
  return new DocumentServiceError(
    "The Supabase database schema is not installed. Run supabase/setup.sql in the Supabase SQL Editor.",
    503,
  );
}

function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new DocumentServiceError("Supabase is not configured on the server.", 503);
  }

  return supabaseAdmin;
}

function monthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

async function assertUploadAllowance(
  userId: string,
  fileSize: number,
) {
  const client = requireSupabaseAdmin();
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("plan, monthly_upload_limit")
    .eq("id", userId)
    .maybeSingle<UploadProfileRow>();

  if (profileError) {
    if (isMissingSchemaError(profileError)) {
      throw schemaSetupError();
    }

    console.error("Could not read the upload allowance.", profileError);
    throw new DocumentServiceError("Could not verify the upload allowance.", 500);
  }

  const planId = isPlanId(profile?.plan) ? profile.plan : "free";
  const plan = billingPlans[planId];
  const uploadLimit = profile?.monthly_upload_limit ?? plan.monthlyUploadLimit;

  if (fileSize > plan.maxPdfSizeMb * 1024 * 1024) {
    throw new DocumentServiceError(
      `The ${plan.id} plan accepts PDFs up to ${plan.maxPdfSizeMb}MB.`,
      413,
    );
  }

  const { count, error: countError } = await client
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStartIso());

  if (countError) {
    if (isMissingSchemaError(countError)) {
      throw schemaSetupError();
    }

    console.error("Could not read monthly upload usage.", countError);
    throw new DocumentServiceError("Could not verify monthly upload usage.", 500);
  }

  if ((count ?? 0) >= uploadLimit) {
    throw new DocumentServiceError("Your monthly PDF upload limit has been reached.", 429);
  }
}

function safeTitle(originalName: string) {
  const normalized = originalName.replaceAll("\\", "/");
  return path.posix.basename(normalized).trim().slice(0, 255) || "document.pdf";
}

function assertPdfSignature(buffer: Buffer) {
  if (buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("The uploaded file does not contain a valid PDF signature.");
  }
}

async function insertChunks(
  rows: Array<{
    document_id: string;
    user_id: string;
    content: string;
    page_number: number;
    chunk_index: number;
    embedding: number[];
    metadata: {
      page_number: number;
      section_title: string | null;
      chunking_strategy: "hybrid-context-aware-v1";
    };
  }>,
) {
  const client = requireSupabaseAdmin();

  for (let index = 0; index < rows.length; index += INSERT_BATCH_SIZE) {
    const { error } = await client
      .from("document_chunks")
      .insert(rows.slice(index, index + INSERT_BATCH_SIZE));

    if (error) {
      if (isMissingSchemaError(error)) {
        throw schemaSetupError();
      }

      throw new Error(`Could not store document chunks: ${error.message}`);
    }
  }
}

export async function processDocumentUpload(
  userId: string,
  file: Express.Multer.File,
): Promise<UploadedDocument> {
  assertPdfSignature(file.buffer);
  await assertUploadAllowance(userId, file.size);

  const client = requireSupabaseAdmin();
  const title = safeTitle(file.originalname);
  const storagePath = `${userId}/${randomUUID()}.pdf`;
  const bucket = client.storage.from(env.supabaseStorageBucket);

  const { error: storageError } = await bucket.upload(storagePath, file.buffer, {
    cacheControl: "3600",
    contentType: "application/pdf",
    upsert: false,
  });

  if (storageError) {
    throw new Error(`Could not store the PDF: ${storageError.message}`);
  }

  const { data: document, error: documentError } = await client
    .from("documents")
    .insert({
      user_id: userId,
      title,
      file_path: storagePath,
      status: "processing",
    })
    .select("*")
    .single<DocumentRow>();

  if (documentError || !document) {
    await bucket.remove([storagePath]);
    throw new Error(
      `Could not create the document record: ${documentError?.message ?? "Unknown error"}`,
    );
  }

  try {
    const extracted = await extractPdfText(file.buffer);
    const chunks = chunkPages(extracted.pages);

    if (chunks.length === 0) {
      throw new Error("No extractable text was found in the PDF.");
    }

    const embeddings = await createEmbeddings(chunks.map((chunk) => chunk.content));

    await insertChunks(
      chunks.map((chunk, index) => ({
        document_id: document.id,
        user_id: userId,
        content: chunk.content,
        page_number: chunk.pageNumber,
        chunk_index: chunk.chunkIndex,
        embedding: embeddings[index],
        metadata: {
          page_number: chunk.pageNumber,
          section_title: chunk.sectionTitle,
          chunking_strategy: "hybrid-context-aware-v1",
        },
      })),
    );

    const { data: readyDocument, error: updateError } = await client
      .from("documents")
      .update({
        status: "ready",
        total_pages: extracted.totalPages,
      })
      .eq("id", document.id)
      .eq("user_id", userId)
      .select("*")
      .single<DocumentRow>();

    if (updateError || !readyDocument) {
      throw new Error(
        `Could not finalize the document: ${updateError?.message ?? "Unknown error"}`,
      );
    }

    return {
      id: readyDocument.id,
      title: readyDocument.title,
      filePath: readyDocument.file_path,
      status: readyDocument.status,
      totalPages: readyDocument.total_pages ?? extracted.totalPages,
      fileSize: file.size,
      createdAt: readyDocument.created_at,
    };
  } catch (error) {
    await client
      .from("documents")
      .update({ status: "failed" })
      .eq("id", document.id)
      .eq("user_id", userId);

    throw error;
  }
}
