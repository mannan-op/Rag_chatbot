import { supabaseAdmin } from "../config/supabase.js";
import { createQuestionEmbedding } from "./embeddingService.js";
import {
  generateRagAnswer,
  type ChatMode,
  type ConversationMessage,
  type RagCitation,
  type RetrievedChunk,
} from "./ragService.js";

type DocumentRow = {
  id: string;
  title: string;
  status: "processing" | "ready" | "failed";
};

type ProfileRow = {
  monthly_question_limit: number;
};

type ChatRow = {
  id: string;
};

type MessageRow = {
  role: "user" | "assistant";
  content: string;
};

export class ChatServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new ChatServiceError("Supabase is not configured on the server.", 503);
  }

  return supabaseAdmin;
}

function monthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

async function assertQuestionAllowance(userId: string) {
  const client = requireSupabaseAdmin();
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("monthly_question_limit")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    console.error("Could not read the usage limit.", profileError);
    throw new ChatServiceError("Could not verify the usage limit.", 500);
  }

  const questionLimit = profile?.monthly_question_limit ?? 30;
  const { count, error: usageError } = await client
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", "question")
    .gte("created_at", monthStartIso());

  if (usageError) {
    console.error("Could not read current usage.", usageError);
    throw new ChatServiceError("Could not verify current usage.", 500);
  }

  if ((count ?? 0) >= questionLimit) {
    throw new ChatServiceError("Your monthly question limit has been reached.", 429);
  }
}

async function getOwnedDocument(userId: string, documentId: string) {
  const client = requireSupabaseAdmin();
  const { data, error } = await client
    .from("documents")
    .select("id, title, status")
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle<DocumentRow>();

  if (error) {
    console.error("Could not read the document.", error);
    throw new ChatServiceError("Could not read the document.", 500);
  }

  if (!data) {
    throw new ChatServiceError("Document not found.", 404);
  }

  if (data.status !== "ready") {
    throw new ChatServiceError("The document is not ready for chat.", 409);
  }

  return data;
}

async function retrieveChunks(
  userId: string,
  documentId: string,
  queryEmbedding: number[],
) {
  const client = requireSupabaseAdmin();
  const { data, error } = await client.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_document_id: documentId,
    match_user_id: userId,
    match_count: 5,
  });

  if (error) {
    console.error("Could not retrieve document context.", error);
    throw new ChatServiceError("Could not retrieve document context.", 500);
  }

  return (data ?? []) as RetrievedChunk[];
}

async function resolveChat(
  userId: string,
  documentId: string,
  question: string,
  chatId?: string,
) {
  const client = requireSupabaseAdmin();

  if (chatId) {
    const { data, error } = await client
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", userId)
      .eq("document_id", documentId)
      .maybeSingle<ChatRow>();

    if (error) {
      console.error("Could not read the chat.", error);
      throw new ChatServiceError("Could not read the chat.", 500);
    }

    if (!data) {
      throw new ChatServiceError("Chat not found.", 404);
    }

    return data.id;
  }

  const { data, error } = await client
    .from("chats")
    .insert({
      user_id: userId,
      document_id: documentId,
      title: question.slice(0, 120),
    })
    .select("id")
    .single<ChatRow>();

  if (error || !data) {
    console.error("Could not create the chat.", error);
    throw new ChatServiceError("Could not create the chat.", 500);
  }

  return data.id;
}

async function saveExchange(
  userId: string,
  chatId: string,
  question: string,
  answer: string,
  citations: RagCitation[],
  tokensUsed: number,
) {
  const client = requireSupabaseAdmin();
  const { error: messageError } = await client.from("messages").insert([
    {
      chat_id: chatId,
      role: "user",
      content: question,
      citations: [],
    },
    {
      chat_id: chatId,
      role: "assistant",
      content: answer,
      citations,
    },
  ]);

  if (messageError) {
    console.error("Could not save the chat messages.", messageError);
    throw new ChatServiceError("Could not save the chat messages.", 500);
  }

  const { error: usageError } = await client.from("usage_logs").insert({
    user_id: userId,
    action: "question",
    tokens_used: tokensUsed,
  });

  if (usageError) {
    console.error("Could not save usage.", usageError);
    throw new ChatServiceError("Could not save usage.", 500);
  }
}

async function getConversationHistory(chatId: string): Promise<ConversationMessage[]> {
  const client = requireSupabaseAdmin();
  const { data, error } = await client
    .from("messages")
    .select("role, content")
    .eq("chat_id", chatId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("Could not read chat history.", error);
    throw new ChatServiceError("Could not read chat history.", 500);
  }

  return ((data ?? []) as MessageRow[]).reverse();
}

export async function askDocumentQuestion(
  userId: string,
  documentId: string,
  question: string,
  chatId?: string,
  mode: ChatMode = "answer",
) {
  await getOwnedDocument(userId, documentId);
  await assertQuestionAllowance(userId);

  const resolvedChatId = await resolveChat(userId, documentId, question, chatId);
  const conversationHistory = await getConversationHistory(resolvedChatId);
  const questionEmbedding = await createQuestionEmbedding(question);
  const chunks = await retrieveChunks(userId, documentId, questionEmbedding.embedding);
  const result = await generateRagAnswer(
    question,
    chunks,
    mode,
    conversationHistory,
  );
  const tokensUsed = questionEmbedding.tokensUsed + result.tokensUsed;

  await saveExchange(
    userId,
    resolvedChatId,
    question,
    result.answer,
    result.citations,
    tokensUsed,
  );

  return {
    chatId: resolvedChatId,
    answer: result.answer,
    citations: result.citations,
  };
}
