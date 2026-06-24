import { env } from "../config/env.js";
import { llmClient } from "../config/llm.js";

export const INSUFFICIENT_CONTEXT_ANSWER =
  "I could not find enough information in the document to answer that.";

export const RAG_SYSTEM_PROMPT = `You are a document analysis assistant. Answer the user's question using only the provided document context.

Rules:
- Do not use outside knowledge.
- If the answer is not present in the context, say: "I could not find enough information in the document to answer that."
- Always provide citations.
- Keep the answer clear and helpful.
- Cite page numbers when available.`;

export const SOCRATIC_SYSTEM_PROMPT = `You are a rigorous, patient Socratic tutor grounded in an uploaded document. Help the user examine beliefs and reach durable understanding using only the provided document context and conversation history.

Rules:
- Do not use outside knowledge.
- Treat the user's belief as a claim to examine, not something to attack.
- Clearly distinguish document evidence, reasonable inference, and unsupported assumption.
- Identify the strongest document-grounded objection or alternative interpretation.
- Explain the key concept before testing the user's understanding.
- End every response with exactly one focused question that advances the inquiry.
- Do not ask several questions at once.
- If the document lacks enough evidence, say: "I could not find enough information in the document to answer that."
- Always provide citations and cite page numbers when available.
- Be intellectually demanding, respectful, and concise enough for a dialogue.`;

export type ChatMode = "answer" | "socratic";

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type RetrievedChunk = {
  id: string;
  content: string;
  page_number: number | null;
  chunk_index: number | null;
  similarity: number;
};

export type RagCitation = {
  pageNumber: number | null;
  chunkIndex: number | null;
  snippet: string;
};

function normalizeSnippet(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized;
}

export function createCitations(chunks: RetrievedChunk[]): RagCitation[] {
  return chunks.map((chunk) => ({
    pageNumber: chunk.page_number,
    chunkIndex: chunk.chunk_index,
    snippet: normalizeSnippet(chunk.content),
  }));
}

export function buildRagPrompt(question: string, chunks: RetrievedChunk[]) {
  const context = chunks
    .map((chunk, index) => {
      const pageLabel = chunk.page_number ? `page ${chunk.page_number}` : "page unknown";
      return `[Source ${index + 1}, ${pageLabel}, chunk ${chunk.chunk_index ?? "unknown"}]\n${chunk.content}`;
    })
    .join("\n\n");

  return `Document context:

${context}

User question:
${question}

Answer using only the document context. Cite the relevant page numbers in your answer.`;
}

export function getSystemPrompt(mode: ChatMode) {
  return mode === "socratic" ? SOCRATIC_SYSTEM_PROMPT : RAG_SYSTEM_PROMPT;
}

export async function generateRagAnswer(
  question: string,
  chunks: RetrievedChunk[],
  mode: ChatMode = "answer",
  conversationHistory: ConversationMessage[] = [],
) {
  if (chunks.length === 0) {
    return {
      answer: INSUFFICIENT_CONTEXT_ANSWER,
      citations: [] as RagCitation[],
      tokensUsed: 0,
    };
  }

  if (!llmClient) {
    throw new Error("The language model is not configured on the server.");
  }

  const completion = await llmClient.chat.completions.create({
    model: env.llmModel,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: getSystemPrompt(mode),
      },
      ...conversationHistory,
      {
        role: "user",
        content: buildRagPrompt(question, chunks),
      },
    ],
  });

  const answer = completion.choices[0]?.message.content?.trim();

  return {
    answer: answer || INSUFFICIENT_CONTEXT_ANSWER,
    citations: createCitations(chunks),
    tokensUsed: completion.usage?.total_tokens ?? 0,
  };
}
