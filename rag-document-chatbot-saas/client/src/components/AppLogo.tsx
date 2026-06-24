import { Bot } from "lucide-react";
import { Link } from "react-router-dom";

export default function AppLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="flex w-fit items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      aria-label="DocuMind home"
    >
      <span className="grid h-9 w-9 place-items-center rounded-md border border-sky-300/30 bg-sky-300/10 text-sky-300">
        <Bot className="h-[18px] w-[18px]" />
      </span>
      {!compact ? (
        <span>
          <span className="block text-sm font-semibold text-slate-100">DocuMind</span>
          <span className="block text-[11px] text-slate-500">Document intelligence</span>
        </span>
      ) : null}
    </Link>
  );
}
