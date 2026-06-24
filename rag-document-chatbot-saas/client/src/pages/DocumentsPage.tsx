import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button";
import DocumentTable from "../components/DocumentTable";
import PageHeader from "../components/PageHeader";
import SectionHeader from "../components/SectionHeader";
import UploadCard from "../components/UploadCard";
import { documents } from "../lib/mockData";
import type { UploadedDocumentDto } from "../types/api";
import type { DocumentRecord } from "../types/domain";

export default function DocumentsPage() {
  const [documentItems, setDocumentItems] = useState<DocumentRecord[]>(documents);

  function handleUploaded(document: UploadedDocumentDto) {
    setDocumentItems((current) => [
      {
        id: document.id,
        title: document.title,
        pages: document.totalPages,
        size: `${(document.fileSize / 1024 / 1024).toFixed(1)} MB`,
        status: document.status,
        uploadedAt: "Just now",
      },
      ...current,
    ]);
  }

  function scrollToUpload() {
    document.getElementById("document-upload")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Documents"
        title="PDF knowledge base"
        description="Upload documents, review processing status, and open a chat against any ready file."
        action={
          <Button onClick={scrollToUpload}>
            <Plus className="h-4 w-4" />
            New upload
          </Button>
        }
      />

      <section className="grid gap-7 xl:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.28fr)]">
        <UploadCard onUploaded={handleUploaded} />
        <div>
          <SectionHeader
            title="Documents"
            description={`${documentItems.length} file${documentItems.length === 1 ? "" : "s"} in this workspace`}
          />
          <DocumentTable items={documentItems} />
        </div>
      </section>
    </>
  );
}
