import type { LucideIcon } from "lucide-react";

export type DocumentStatus = "processing" | "ready" | "failed";

export type DocumentRecord = {
  id: string;
  title: string;
  pages: number;
  size: string;
  status: DocumentStatus;
  uploadedAt: string;
};

export type ChatPreview = {
  id: string;
  documentTitle: string;
  question: string;
  timestamp: string;
};

export type Citation = {
  pageNumber: number | null;
  chunkIndex: number | null;
  snippet: string;
};

export type ChatMode = "answer" | "socratic";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};
