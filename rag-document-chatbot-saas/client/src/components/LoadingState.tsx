import { LoaderCircle } from "lucide-react";

type LoadingStateProps = {
  label: string;
  fullScreen?: boolean;
};

export default function LoadingState({ label, fullScreen = false }: LoadingStateProps) {
  return (
    <div
      role="status"
      className={`grid place-items-center bg-[#080b10] text-slate-400 ${
        fullScreen ? "min-h-screen" : "min-h-64"
      }`}
    >
      <div className="flex items-center gap-3 text-sm">
        <LoaderCircle className="h-4 w-4 animate-spin text-sky-400" />
        {label}
      </div>
    </div>
  );
}
