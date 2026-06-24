import { motion } from "framer-motion";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

type QuickStartCardProps = {
  title: string;
  icon: LucideIcon;
  onClick: () => void;
};

export default function QuickStartCard({ title, icon: Icon, onClick }: QuickStartCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      className="group flex min-h-28 w-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-[0_8px_28px_rgba(15,23,42,0.04)] transition-colors hover:border-violet-200 hover:bg-violet-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-gray-300 transition group-hover:text-violet-500" />
      </div>
      <span className="mt-4 max-w-[15rem] text-sm font-medium leading-5 text-gray-700">
        {title}
      </span>
    </motion.button>
  );
}
