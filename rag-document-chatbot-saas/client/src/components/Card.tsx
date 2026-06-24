import type { HTMLAttributes, ReactNode } from "react";

type CardVariant = "default" | "muted" | "inset" | "dark";

const variants: Record<CardVariant, string> = {
  default: "border-gray-200 bg-white",
  muted: "border-gray-200 bg-gray-50",
  inset: "border-gray-200 bg-gray-50/80",
  dark: "border-slate-800 bg-slate-900/70",
};

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: CardVariant;
};

export default function Card({
  children,
  className = "",
  variant = "default",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border shadow-[0_8px_28px_rgba(15,23,42,0.04)] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
