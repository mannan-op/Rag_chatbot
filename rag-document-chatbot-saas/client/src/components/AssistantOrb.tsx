import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function AssistantOrb() {
  return (
    <div className="relative grid h-24 w-24 place-items-center" aria-hidden="true">
      <motion.div
        className="absolute inset-2 rounded-full bg-violet-200/70 blur-xl"
        animate={{ scale: [0.92, 1.12, 0.92], opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="relative grid h-16 w-16 place-items-center rounded-full border border-white/90 bg-[radial-gradient(circle_at_35%_30%,#ffffff_0%,#ddd6fe_28%,#8b5cf6_65%,#5b21b6_100%)] shadow-[0_18px_50px_rgba(124,58,237,0.32)]"
        animate={{ y: [0, -5, 0], rotate: [0, 3, 0, -3, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="h-6 w-6 text-white drop-shadow-sm" />
      </motion.div>
    </div>
  );
}
