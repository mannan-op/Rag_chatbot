import type { ChatMode } from "../types/domain";

export const agentOptions = [
  "General RAG",
  "Deep Research",
  "Socratic Tutor",
  "Quiz Mode",
  "Compare Concepts",
  "Summarizer",
] as const;

export function modeFromComposer(challengeMode: boolean): ChatMode {
  return challengeMode ? "socratic" : "answer";
}
