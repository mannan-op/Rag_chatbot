import type { Request, Response } from "express";
import { askDocumentQuestion, ChatServiceError } from "../services/chatService.js";
import { chatRequestSchema, documentIdSchema } from "../utils/chatValidation.js";

export async function chatWithDocument(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({
      error: "Unauthorized",
      message: "An authenticated user is required.",
    });
    return;
  }

  const parsedBody = chatRequestSchema.safeParse(request.body);
  const parsedDocumentId = documentIdSchema.safeParse(request.params.documentId);

  if (!parsedBody.success || !parsedDocumentId.success) {
    response.status(400).json({
      error: "Invalid request",
      message:
        "Provide a valid document ID, a message between 1 and 4000 characters, and an optional UUID chatId.",
    });
    return;
  }

  try {
    const result = await askDocumentQuestion(
      request.user.id,
      parsedDocumentId.data,
      parsedBody.data.message,
      parsedBody.data.chatId,
      parsedBody.data.mode,
    );

    response.status(200).json(result);
  } catch (error) {
    if (error instanceof ChatServiceError) {
      response.status(error.statusCode).json({
        error: "Chat request failed",
        message: error.message,
      });
      return;
    }

    const message = error instanceof Error ? error.message : "The question could not be answered.";
    const isConfigurationError = message.includes("not configured");

    if (!isConfigurationError) {
      console.error("Unexpected chat error.", error);
    }

    response.status(isConfigurationError ? 503 : 500).json({
      error: isConfigurationError ? "Chat unavailable" : "Chat request failed",
      message: isConfigurationError
        ? "The chat provider is not configured on the server."
        : "The question could not be answered.",
    });
  }
}
