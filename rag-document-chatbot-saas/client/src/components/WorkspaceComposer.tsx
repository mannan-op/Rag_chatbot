import {
  ArrowUp,
  ChevronDown,
  FileText,
  Link2,
  Paperclip,
  ShieldCheck,
} from "lucide-react";
import { useRef, type FormEvent } from "react";
import { agentOptions } from "../lib/agents";

type WorkspaceComposerProps = {
  value: string;
  onChange: (value: string) => void;
  agent: string;
  onAgentChange: (agent: string) => void;
  citations: boolean;
  onCitationsChange: (enabled: boolean) => void;
  challengeMode: boolean;
  onChallengeModeChange: (enabled: boolean) => void;
  knowledgeBase: string;
  knowledgeBaseLabel?: string;
  onKnowledgeBaseChange: (documentId: string) => void;
  onFileSelected: (file: File) => void;
  isUploading?: boolean;
  onSubmit: () => void;
};

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
          checked ? "bg-violet-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
      {label}
    </label>
  );
}

export default function WorkspaceComposer({
  value,
  onChange,
  agent,
  onAgentChange,
  citations,
  onCitationsChange,
  challengeMode,
  onChallengeModeChange,
  knowledgeBase,
  knowledgeBaseLabel,
  onKnowledgeBaseChange,
  onFileSelected,
  isUploading = false,
  onSubmit,
}: WorkspaceComposerProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (value.trim()) {
      onSubmit();
    }
  }

  return (
    <form
      onSubmit={submit}
      className="overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-[0_22px_70px_rgba(39,39,42,0.10)] transition focus-within:border-violet-300 focus-within:shadow-[0_24px_80px_rgba(124,58,237,0.13)]"
    >
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (value.trim()) {
              onSubmit();
            }
          }
        }}
        rows={4}
        placeholder="Ask a question, upload a document, or state a belief to challenge..."
        className="min-h-32 w-full resize-none bg-transparent px-5 pt-5 text-[15px] leading-7 text-gray-900 outline-none placeholder:text-gray-400 sm:px-6 sm:pt-6"
      />

      <div className="border-t border-gray-100 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onFileSelected(file);
              }
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={isUploading}
            className="grid h-9 w-9 place-items-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            aria-label="Attach PDF"
            title="Attach PDF"
          >
            <Paperclip className={`h-[18px] w-[18px] ${isUploading ? "animate-pulse" : ""}`} />
          </button>

          <label className="relative">
            <FileText className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <select
              aria-label="Knowledge base"
              value={knowledgeBase}
              onChange={(event) => onKnowledgeBaseChange(event.target.value)}
              className="h-9 appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-8 text-xs font-medium text-gray-700 outline-none transition hover:border-gray-300 focus:border-violet-400"
            >
              <option value="doc-q4-board-pack">Q4 Board Pack</option>
              <option value="doc-vendor-contract">Vendor Contract</option>
              <option value="all">All knowledge</option>
              {knowledgeBaseLabel &&
              !["doc-q4-board-pack", "doc-vendor-contract", "all"].includes(knowledgeBase) ? (
                <option value={knowledgeBase}>{knowledgeBaseLabel}</option>
              ) : null}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-gray-400" />
          </label>

          <label className="relative">
            <select
              aria-label="Agent mode"
              value={agent}
              onChange={(event) => {
                onAgentChange(event.target.value);
                if (event.target.value === "Socratic Tutor") {
                  onChallengeModeChange(true);
                }
              }}
              className="h-9 appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-8 text-xs font-medium text-gray-700 outline-none transition hover:border-gray-300 focus:border-violet-400"
            >
              {agentOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-gray-400" />
          </label>

          <div className="hidden h-5 w-px bg-gray-200 sm:block" />

          <Toggle checked={citations} onChange={onCitationsChange} label="Citations" />
          <Toggle
            checked={challengeMode}
            onChange={(enabled) => {
              onChallengeModeChange(enabled);
              if (enabled) {
                onAgentChange("Socratic Tutor");
              }
            }}
            label="Challenge me"
          />

          <button
            type="submit"
            disabled={!value.trim()}
            className="ml-auto grid h-10 w-10 place-items-center rounded-xl bg-gray-950 text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            aria-label="Send prompt"
          >
            <ArrowUp className="h-[18px] w-[18px]" />
          </button>
        </div>

        {challengeMode ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs leading-5 text-violet-800">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Socratic mode uses retrieved evidence, tests assumptions, and asks one focused
              follow-up at a time.
            </span>
          </div>
        ) : citations ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <Link2 className="h-3.5 w-3.5" />
            Source references will be included with the answer.
          </div>
        ) : null}
      </div>
    </form>
  );
}
