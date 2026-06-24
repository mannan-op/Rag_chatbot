import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  FileSearch,
  LockKeyhole,
  MessageSquareText,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import AppLogo from "../components/AppLogo";
import { ButtonLink } from "../components/Button";
import Card from "../components/Card";

const features = [
  {
    title: "Grounded answers",
    description: "Every response is generated from retrieved document context, not outside knowledge.",
    icon: FileSearch,
    tone: "text-sky-300 bg-sky-400/8",
  },
  {
    title: "Auditable citations",
    description: "Page numbers and source snippets make answers easy to verify and share.",
    icon: MessageSquareText,
    tone: "text-emerald-300 bg-emerald-400/8",
  },
  {
    title: "Built for SaaS",
    description: "Authentication, usage limits, private storage, and billing are already connected.",
    icon: LockKeyhole,
    tone: "text-amber-300 bg-amber-400/8",
  },
];

const steps = [
  { title: "Upload", description: "Add a PDF to private storage.", icon: UploadCloud },
  { title: "Index", description: "Extract, chunk, and embed every page.", icon: BrainCircuit },
  { title: "Ask", description: "Get a concise answer with sources.", icon: Sparkles },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#080b10] text-slate-100">
      <header className="border-b border-slate-800/80">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 sm:px-8">
          <AppLogo />
          <nav className="hidden items-center gap-7 text-sm text-slate-500 md:flex">
            <a href="#features" className="transition hover:text-slate-200">Features</a>
            <a href="#workflow" className="transition hover:text-slate-200">Workflow</a>
            <a href="#pricing" className="transition hover:text-slate-200">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <ButtonLink to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Log in
            </ButtonLink>
            <ButtonLink to="/signup" size="sm">
              Start free
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 text-center sm:px-8 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-xs font-semibold text-sky-400">RAG DOCUMENT CHAT</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-semibold leading-[1.12] text-slate-50 sm:text-5xl lg:text-6xl">
            Turn static PDFs into answers your team can verify.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
            Upload documents, ask precise questions, and get grounded responses with page-level citations.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/signup">
              Create workspace
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink to="/login" variant="secondary">Open your workspace</ButtonLink>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5 }}
          className="mx-auto mt-14 max-w-4xl text-left"
        >
          <Card variant="dark" className="overflow-hidden shadow-2xl shadow-black/25">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/45 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-200">Q4 Board Pack.pdf</p>
                <p className="mt-0.5 text-xs text-slate-600">42 pages indexed</p>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/8 px-2.5 py-1 text-xs font-medium text-emerald-300">
                Ready
              </span>
            </div>
            <div className="grid min-h-80 md:grid-cols-[1fr_260px]">
              <div className="space-y-4 p-4 sm:p-6">
                <div className="ml-auto max-w-sm rounded-lg bg-sky-300 px-4 py-3 text-sm leading-6 text-slate-950">
                  What changed in enterprise risk this quarter?
                </div>
                <div className="max-w-xl rounded-lg border border-slate-800 bg-slate-950/65 px-4 py-3 text-sm leading-6 text-slate-300">
                  Enterprise cycle time increased, while two channel partners now account for most expansion pipeline.
                </div>
              </div>
              <div className="border-t border-slate-800 bg-slate-950/35 p-4 md:border-l md:border-t-0">
                <p className="text-xs font-semibold text-slate-400">Citations</p>
                <div className="mt-3 space-y-2">
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-xs font-medium text-slate-300">Page 7</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Cycle time increased by 18 days.</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-xs font-medium text-slate-300">Page 19</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Partner pipeline concentration increased.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      <section id="features" className="border-y border-slate-800 bg-[#0b0f15]">
        <div className="mx-auto grid max-w-6xl divide-y divide-slate-800 px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="py-10 md:px-8 md:first:pl-0 md:last:pr-0">
                <span className={`grid h-10 w-10 place-items-center rounded-md ${feature.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-5 text-base font-semibold text-slate-100">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold text-sky-400">WORKFLOW</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-50">From PDF to cited answer.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            A focused ingestion and retrieval pipeline keeps the experience simple for users.
          </p>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="border-t border-slate-800 pt-5">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-700">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-slate-200">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="pricing" className="border-y border-slate-800 bg-[#0b0f15]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-14 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-emerald-400">START FREE</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-50">Scale when your document workload does.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              The Free plan includes 3 PDFs and 30 questions each month. Upgrade without moving your data.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
              {["3 PDFs", "30 questions", "10MB files"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <ButtonLink to="/pricing" variant="secondary">
            Compare plans
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-16 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Make your documents useful again.</h2>
          <p className="mt-2 text-sm text-slate-500">Create a workspace and index your first PDF in minutes.</p>
        </div>
        <ButtonLink to="/signup">
          Get started
          <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </section>
    </main>
  );
}
