import type { ChatMessage, ChatPreview, DocumentRecord } from "../types/domain";

export const documents: DocumentRecord[] = [
  {
    id: "doc-q4-board-pack",
    title: "Q4 Board Pack.pdf",
    pages: 42,
    size: "8.4 MB",
    status: "ready",
    uploadedAt: "Today, 10:24 AM",
  },
  {
    id: "doc-security-review",
    title: "Security Review.pdf",
    pages: 18,
    size: "3.1 MB",
    status: "processing",
    uploadedAt: "Today, 9:11 AM",
  },
  {
    id: "doc-vendor-contract",
    title: "Vendor Contract.pdf",
    pages: 27,
    size: "5.7 MB",
    status: "ready",
    uploadedAt: "Yesterday",
  },
  {
    id: "doc-damaged-scan",
    title: "Damaged Scan.pdf",
    pages: 0,
    size: "2.2 MB",
    status: "failed",
    uploadedAt: "Jun 18",
  },
];

export const recentChats: ChatPreview[] = [
  {
    id: "chat-1",
    documentTitle: "Q4 Board Pack.pdf",
    question: "Which risks affect enterprise expansion?",
    timestamp: "8 minutes ago",
  },
  {
    id: "chat-2",
    documentTitle: "Vendor Contract.pdf",
    question: "Summarize the renewal obligations.",
    timestamp: "Yesterday",
  },
  {
    id: "chat-3",
    documentTitle: "Q4 Board Pack.pdf",
    question: "What changed in gross margin?",
    timestamp: "Jun 17",
  },
];

export const chatMessages: ChatMessage[] = [
  {
    id: "message-1",
    role: "user",
    content: "What are the biggest concerns in this document?",
  },
  {
    id: "message-2",
    role: "assistant",
    content:
      "The document highlights three main concerns: slower enterprise deal velocity, higher infrastructure costs from increased retrieval volume, and dependency on two strategic channel partners for expansion pipeline.",
    citations: [
      {
        pageNumber: 7,
        chunkIndex: 3,
        snippet:
          "Enterprise cycles expanded by 18 days quarter over quarter, especially in regulated verticals.",
      },
      {
        pageNumber: 12,
        chunkIndex: 8,
        snippet:
          "Inference and retrieval workloads increased faster than forecast, creating pressure on gross margin.",
      },
      {
        pageNumber: 19,
        chunkIndex: 14,
        snippet:
          "Two channel partners account for the majority of qualified expansion pipeline this quarter.",
      },
    ],
  },
];
