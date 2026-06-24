import axios from "axios";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadDocument } from "../services/documents";
import type { UploadedDocumentDto } from "../types/api";
import Card from "./Card";
import FeedbackMessage from "./FeedbackMessage";

type UploadCardProps = {
  onUploaded: (document: UploadedDocumentDto) => void;
};

export default function UploadCard({ onUploaded }: UploadCardProps) {
  const [progress, setProgress] = useState(0);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(file: File) {
    setActiveFile(file);
    setErrorMessage("");
    setProgress(1);
    setIsUploading(true);

    try {
      const document = await uploadDocument(file, setProgress);
      setProgress(100);
      onUploaded(document);
    } catch (error) {
      setProgress(0);

      if (axios.isAxiosError<{ message?: string }>(error)) {
        setErrorMessage(
          error.response?.data?.message ?? "The PDF could not be uploaded.",
        );
      } else {
        setErrorMessage("The PDF could not be uploaded.");
      }
    } finally {
      setIsUploading(false);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    disabled: isUploading,
    maxFiles: 1,
    onDropAccepted: ([file]) => {
      if (file) {
        void handleUpload(file);
      }
    },
    onDropRejected: () => {
      setErrorMessage("Choose one valid PDF file.");
    },
  });

  return (
    <Card id="document-upload" className="p-4 sm:p-5">
      <div
        {...getRootProps()}
        className={`flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-violet-400/30 ${
          isDragActive
            ? "border-violet-400 bg-violet-50"
            : "border-gray-300 bg-gray-50/70 hover:border-violet-300 hover:bg-violet-50/40"
        } ${isUploading ? "cursor-wait opacity-70" : "cursor-pointer"}`}
      >
        <input {...getInputProps()} />
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-violet-100 bg-white text-violet-600 shadow-sm">
          <FileUp className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-sm font-semibold text-gray-900">
          {isDragActive ? "Drop PDF to upload" : "Drop a PDF or browse"}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
          One file at a time. Your plan controls maximum file size.
        </p>
      </div>

      {progress > 0 ? (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-gray-700">
              {progress < 100 ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              )}
              <span className="truncate">{activeFile?.name ?? "Queued document.pdf"}</span>
            </span>
            <span className="text-gray-500">
              {progress < 100 && progress >= 95 ? "Processing" : `${progress}%`}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <FeedbackMessage tone="error" className="mt-4">{errorMessage}</FeedbackMessage>
      ) : null}
    </Card>
  );
}
