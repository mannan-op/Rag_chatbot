import type { ChatResponse } from "../types/api";
import type { ChatMode } from "../types/domain";
import api from "./api";

export async function askDocumentQuestion(
  documentId: string,
  message: string,
  chatId?: string,
  mode: ChatMode = "answer",
) {
  const { data } = await api.post<ChatResponse>(`/api/chat/${documentId}`, {
    message,
    mode,
    ...(chatId ? { chatId } : {}),
  });

  return data;
}
