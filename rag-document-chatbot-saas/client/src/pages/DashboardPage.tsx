import {
  BookOpenCheck,
  BrainCircuit,
  FileQuestion,
  GitCompareArrows,
  ListChecks,
  ScanSearch,
} from "lucide-react";
import axios from "axios";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AssistantOrb from "../components/AssistantOrb";
import QuickStartCard from "../components/QuickStartCard";
import WorkspaceComposer from "../components/WorkspaceComposer";
import { useAuth } from "../hooks/useAuth";
import { modeFromComposer } from "../lib/agents";
import { uploadDocument } from "../services/documents";

const examples = [
  { title: "Question my belief about this topic", icon: BrainCircuit, challenge: true },
  { title: "Explain this document until I understand", icon: BookOpenCheck, challenge: true },
  { title: "Find gaps in my reasoning", icon: ScanSearch, challenge: true },
  { title: "Create a quiz from my notes", icon: ListChecks, agent: "Quiz Mode" },
  {
    title: "Compare two concepts from my knowledge base",
    icon: GitCompareArrows,
    agent: "Compare Concepts",
  },
  { title: "Summarize this PDF with citations", icon: FileQuestion, agent: "Summarizer" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const firstName = useMemo(() => {
    const fullName =
      typeof user?.user_metadata.full_name === "string"
        ? user.user_metadata.full_name.trim()
        : "";
    return fullName.split(/\s+/)[0] || "Jason";
  }, [user]);

  const [prompt, setPrompt] = useState("");
  const [agent, setAgent] = useState(
    searchParams.get("mode") === "socratic" ? "Socratic Tutor" : "General RAG",
  );
  const [citations, setCitations] = useState(true);
  const [challengeMode, setChallengeMode] = useState(
    searchParams.get("mode") === "socratic",
  );
  const [knowledgeBase, setKnowledgeBase] = useState("doc-q4-board-pack");
  const [knowledgeBaseLabel, setKnowledgeBaseLabel] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function attachDocument(file: File) {
    setIsUploading(true);
    setUploadError("");
    try {
      const uploaded = await uploadDocument(file, () => undefined);
      setKnowledgeBase(uploaded.id);
      setKnowledgeBaseLabel(uploaded.title);
    } catch (error) {
      setUploadError(
        axios.isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message ?? "The PDF could not be attached."
          : "The PDF could not be attached.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function startThread() {
    const documentId =
      knowledgeBase === "all" ? "doc-q4-board-pack" : knowledgeBase;
    const params = new URLSearchParams({
      prompt: prompt.trim(),
      mode: modeFromComposer(challengeMode),
      citations: String(citations),
    });
    navigate(`/documents/${documentId}/chat?${params.toString()}`);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-[1180px] flex-col px-4 pb-12 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <section className="mx-auto w-full max-w-3xl text-center">
        <AssistantOrb />
        <p className="mt-2 text-sm font-medium text-gray-500">Good Afternoon, {firstName}</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-gray-950 sm:text-4xl">
          What do you want to{" "}
          <span className="text-violet-600">understand deeply?</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
          Ask across your knowledge base, trace every claim to its source, or let the
          Socratic tutor challenge your reasoning.
        </p>

        <div className="mt-8 text-left">
          <WorkspaceComposer
            value={prompt}
            onChange={setPrompt}
            agent={agent}
            onAgentChange={setAgent}
            citations={citations}
            onCitationsChange={setCitations}
            challengeMode={challengeMode}
            onChallengeModeChange={setChallengeMode}
            knowledgeBase={knowledgeBase}
            knowledgeBaseLabel={knowledgeBaseLabel}
            onKnowledgeBaseChange={setKnowledgeBase}
            onFileSelected={(file) => void attachDocument(file)}
            isUploading={isUploading}
            onSubmit={startThread}
          />
          {uploadError ? (
            <p role="alert" className="mt-3 text-sm text-rose-600">
              {uploadError}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto mt-12 w-full">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          Get started with an example below
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {examples.map((example) => (
            <QuickStartCard
              key={example.title}
              title={example.title}
              icon={example.icon}
              onClick={() => {
                setPrompt(example.title);
                if (example.agent) {
                  setAgent(example.agent);
                }
                if (example.challenge) {
                  setChallengeMode(true);
                  setAgent("Socratic Tutor");
                }
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
