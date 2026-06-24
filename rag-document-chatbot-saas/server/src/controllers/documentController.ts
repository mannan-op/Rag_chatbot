import type { Request, Response } from "express";
import {
  DocumentServiceError,
  processDocumentUpload,
} from "../services/documentService.js";

export async function uploadDocument(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({
      error: "Unauthorized",
      message: "An authenticated user is required.",
    });
    return;
  }

  if (!request.file) {
    response.status(400).json({
      error: "Invalid upload",
      message: "Attach one PDF using the 'file' form field.",
    });
    return;
  }

  try {
    const document = await processDocumentUpload(request.user.id, request.file);
    response.status(201).json({ document });
  } catch (error) {
    if (error instanceof DocumentServiceError) {
      response.status(error.statusCode).json({
        error: "Document processing failed",
        message: error.message,
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : "The PDF could not be processed.";
    const isConfigurationError =
      message.includes("not configured") || message.includes("authentication unavailable");

    response.status(isConfigurationError ? 503 : 422).json({
      error: isConfigurationError ? "Processing unavailable" : "Document processing failed",
      message,
    });
  }
}
