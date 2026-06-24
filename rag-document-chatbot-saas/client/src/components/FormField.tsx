import { useId, type InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helper?: string;
  theme?: "dark" | "light";
};

export default function FormField({
  label,
  helper,
  className = "",
  theme = "dark",
  id,
  ...props
}: FormFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = helper ? `${inputId}-helper` : undefined;
  const isLight = theme === "light";

  return (
    <label htmlFor={inputId} className="block">
      <span className={`mb-2 block text-sm font-medium ${isLight ? "text-gray-700" : "text-slate-200"}`}>
        {label}
      </span>
      <input
        id={inputId}
        aria-describedby={helperId}
        className={`h-11 w-full rounded-xl border px-3.5 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isLight
            ? "border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
            : "border-slate-700 bg-slate-950/75 text-slate-100 placeholder:text-slate-600 hover:border-slate-600 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15"
        } ${className}`}
        {...props}
      />
      {helper ? (
        <span id={helperId} className={`mt-2 block text-xs leading-5 ${isLight ? "text-gray-500" : "text-slate-500"}`}>
          {helper}
        </span>
      ) : null}
    </label>
  );
}
