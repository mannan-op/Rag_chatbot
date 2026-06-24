import type { LucideIcon } from "lucide-react";
import Card from "./Card";

type MetricCardProps = {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "sky" | "emerald" | "amber" | "slate";
};

const tones = {
  sky: "border-sky-400/15 bg-sky-400/8 text-sky-300",
  emerald: "border-emerald-400/15 bg-emerald-400/8 text-emerald-300",
  amber: "border-amber-400/15 bg-amber-400/8 text-amber-300",
  slate: "border-slate-700 bg-slate-800/70 text-slate-300",
};

export default function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "sky",
}: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-md border ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">{helper}</p>
    </Card>
  );
}
