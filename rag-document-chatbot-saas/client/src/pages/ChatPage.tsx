import axios from "axios";
import {
  ArrowUp,
  Bot,
  Brain,
  FileText,
  Link2,
  Loader2,
  MessageSquareText,
  Quote,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import FeedbackMessage from "../components/FeedbackMessage";
import { documents } from "../lib/mockData";
import { askDocumentQuestion } from "../services/chat";
import type { ChatMessage, ChatMode } from "../types/domain";

export default function ChatPage() {
  const { documentId } = useParams();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(searchParams.get("prompt") ?? "");
  const [chatId, setChatId] = useState<string>();
  const [mode, setMode] = useState<ChatMode>(
    searchParams.get("mode") === "socratic" ? "socratic" : "answer",
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const conversationEnd = useRef<HTMLDivElement>(null);
  const document = useMemo(
    () =>
      documents.find((item) => item.id === documentId) ?? {
        id: documentId ?? "",
        title: "Document chat",
        pages: 0,
        size: "",
        status: "ready" as const,
        uploadedAt: "",
      },
    [documentId],
  );
  const citations = messages.flatMap((item) => item.citations ?? []);

  useEffect(() => {
    conversationEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [isLoading, messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = message.trim();

    if (!question || !documentId || isLoading) {
      return;
    }

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: question },
    ]);
    setMessage("");
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await askDocumentQuestion(documentId, question, chatId, mode);
      setChatId(response.chatId);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer,
          citations: response.citations,
        },
      ]);
    } catch (error) {
      setErrorMessage(
        axios.isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message ?? "The question could not be answered."
          : "The question could not be answered.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1380px]">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-600">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-violet-600">Document thread</p>
            <h1 className="truncate text-xl font-semibold text-gray-950">{document.title}</h1>
            <p className="mt-0.5 text-xs text-gray-400">
              {document.pages ? `${document.pages} indexed pages` : "Source-aware workspace"}
            </p>
          </div>
        </div>

        <div
          className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm"
          role="group"
          aria-label="Chat mode"
        >
          <button
            type="button"
            onClick={() => setMode("answer")}
            aria-pressed={mode === "answer"}
            className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:flex-none ${
              mode === "answer"
                ? "bg-gray-950 text-white"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <MessageSquareText className="h-4 w-4" />
            Direct answer
          </button>
          <button
            type="button"
            onClick={() => setMode("socratic")}
            aria-pressed={mode === "socratic"}
            className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:flex-none ${
              mode === "socratic"
                ? "bg-violet-600 text-white"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Brain className="h-4 w-4" />
            Challenge me
          </button>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-190px)] overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)] xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex min-h-[680px] flex-col">
          {mode === "socratic" ? (
            <div className="flex items-start gap-2.5 border-b border-violet-100 bg-violet-50/70 px-5 py-3 text-xs leading-5 text-violet-800">
              <Brain className="mt-0.5 h-4 w-4 shrink-0" />
              I’ll question assumptions, test edge cases, and ask one focused follow-up at a
              time using this document as the source of truth.
            </div>
          ) : null}

          <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
            {messages.length === 0 ? (
              <EmptyState
                icon={mode === "socratic" ? Brain : Sparkles}
                title={mode === "socratic" ? "State what you believe" : "Ask your first question"}
                description={
                  mode === "socratic"
                    ? "Explain your current understanding. The tutor will identify assumptions and guide you toward a defensible explanation."
                    : "Answers are grounded in retrieved passages and include page-level source references."
                }
              />
            ) : null}

            {messages.map((item) => (
              <div
                key={item.id}
                className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex max-w-3xl items-start gap-3 ${
                    item.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                      item.role === "user"
                        ? "bg-gray-950 text-white"
                        : "bg-violet-50 text-violet-600"
                    }`}
                  >
                    {item.role === "user" ? "Y" : <Bot className="h-4 w-4" />}
                  </span>
                  <div
                    className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                      item.role === "user"
                        ? "bg-gray-950 text-white"
                        : "border border-gray-200 bg-gray-50/70 text-gray-700"
                    }`}
                  >
                    {item.content}
                  </div>
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-50 text-violet-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
                Retrieving relevant passages and reasoning over them
              </div>
            ) : null}
            {errorMessage ? <FeedbackMessage tone="error">{errorMessage}</FeedbackMessage> : null}
            <div ref={conversationEnd} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-gray-100 p-3 sm:p-4">
            <div className="flex items-end gap-3 rounded-2xl border border-gray-200 bg-gray-50/70 p-2 focus-within:border-violet-300 focus-within:bg-white">
              <textarea
                aria-label="Question"
                rows={2}
                placeholder={
                  mode === "socratic"
                    ? "State a belief or explain your reasoning..."
                    : "Ask about this document..."
                }
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                disabled={isLoading}
                className="max-h-40 min-h-12 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:bg-gray-200 disabled:text-gray-400"
                aria-label="Send message"
              >
                <ArrowUp className="h-[18px] w-[18px]" />
              </button>
            </div>
          </form>
        </section>

        <aside className="border-t border-gray-200 bg-gray-50/70 p-4 xl:border-l xl:border-t-0">
          <div className="flex items-center gap-2">
            <Quote className="h-4 w-4 text-violet-600" />
            <h2 className="text-sm font-semibold text-gray-900">Source citations</h2>
            {citations.length > 0 ? (
              <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                {citations.length}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs leading-5 text-gray-500">
            Evidence retrieved from your knowledge base appears here.
          </p>

          <div className="mt-4 space-y-3">
            {citations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-center">
                <Link2 className="mx-auto h-5 w-5 text-gray-300" />
                <p className="mt-2 text-xs leading-5 text-gray-400">
                  Ask a question to reveal supporting passages.
                </p>
              </div>
            ) : null}
            {citations.map((citation, index) => (
              <div
                key={`${citation.pageNumber}-${citation.chunkIndex}-${index}`}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-gray-800">
                    {citation.pageNumber ? `Page ${citation.pageNumber}` : "Page unavailable"}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {citation.chunkIndex !== null
                      ? `Passage ${citation.chunkIndex}`
                      : "Retrieved source"}
                  </p>
                </div>
                <p className="mt-2 text-xs leading-5 text-gray-500">{citation.snippet}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
