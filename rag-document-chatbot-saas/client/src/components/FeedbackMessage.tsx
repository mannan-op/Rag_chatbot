import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

type FeedbackTone = "error" | "success" | "info";

const tones = {
  error: {
    icon: AlertCircle,
    styles: "border-rose-200 bg-rose-50 text-rose-700",
  },
  success: {
    icon: CheckCircle2,
    styles: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  info: {
    icon: Info,
    styles: "border-violet-200 bg-violet-50 text-violet-700",
  },
} satisfies Record<FeedbackTone, { icon: typeof AlertCircle; styles: string }>;

type FeedbackMessageProps = {
  children: ReactNode;
  tone?: FeedbackTone;
  className?: string;
};

export default function FeedbackMessage({
  children,
  tone = "info",
  className = "",
}: FeedbackMessageProps) {
  const { icon: Icon, styles } = tones[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm leading-5 ${styles} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
