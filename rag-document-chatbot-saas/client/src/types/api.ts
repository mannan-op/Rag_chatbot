export type HealthResponse = {
  status: "ok";
  service: string;
  timestamp: string;
};

export type UploadedDocumentDto = {
  id: string;
  title: string;
  filePath: string;
  status: "processing" | "ready" | "failed";
  totalPages: number;
  fileSize: number;
  createdAt: string;
};

export type UploadDocumentResponse = {
  document: UploadedDocumentDto;
};

export type ChatCitationDto = {
  pageNumber: number | null;
  chunkIndex: number | null;
  snippet: string;
};

export type ChatResponse = {
  chatId: string;
  answer: string;
  citations: ChatCitationDto[];
};

export type BillingRedirectResponse = {
  url: string;
};
