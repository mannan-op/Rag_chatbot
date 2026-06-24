import type { UploadDocumentResponse } from "../types/api";
import api from "./api";

export async function uploadDocument(
  file: File,
  onProgress: (progress: number) => void,
) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<UploadDocumentResponse>(
    "/api/documents/upload",
    formData,
    {
      onUploadProgress: (event) => {
        if (!event.total) {
          return;
        }

        onProgress(Math.min(95, Math.round((event.loaded / event.total) * 100)));
      },
    },
  );

  return data.document;
}
