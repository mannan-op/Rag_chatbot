import { FileText, MessageSquare, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { DocumentRecord } from "../types/domain";
import { Button } from "./Button";
import Card from "./Card";
import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";

export default function DocumentTable({ items }: { items: DocumentRecord[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload your first PDF to create a searchable document workspace."
        />
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2 md:hidden">
        {items.map((document) => (
          <Card key={document.id} className="p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{document.title}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {document.pages || "-"} pages · {document.size} · {document.uploadedAt}
                </p>
              </div>
              <StatusBadge status={document.status} />
            </div>
            <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
              {document.status === "ready" ? (
                <Link
                  to={`/documents/${document.id}/chat`}
                  className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium text-violet-700 hover:bg-violet-50"
                >
                  <MessageSquare className="h-4 w-4" />
                  Open chat
                </Link>
              ) : (
                <span className="px-2 text-xs text-gray-400">Chat available when ready</span>
              )}
            </div>
          </Card>
        ))}
      </div>
      <Card className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-5 py-3.5 font-medium">Document</th>
              <th className="px-4 py-3.5 font-medium">Pages</th>
              <th className="px-4 py-3.5 font-medium">Size</th>
              <th className="px-4 py-3.5 font-medium">Status</th>
              <th className="px-4 py-3.5 font-medium">Uploaded</th>
              <th className="px-5 py-3.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((document) => (
              <tr key={document.id} className="text-gray-500 transition hover:bg-violet-50/30">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="max-w-72 truncate font-medium text-gray-800">{document.title}</span>
                  </div>
                </td>
                <td className="px-4 py-4">{document.pages || "-"}</td>
                <td className="px-4 py-4">{document.size}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={document.status} />
                </td>
                <td className="px-4 py-4">{document.uploadedAt}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    {document.status === "ready" ? (
                      <Link
                        to={`/documents/${document.id}/chat`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-violet-50 hover:text-violet-700"
                        aria-label={`Chat with ${document.title}`}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center text-gray-300"
                        title="Chat is available when processing finishes"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${document.title}`}
                      title="Delete is not available yet"
                      disabled
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </Card>
    </>
  );
}
