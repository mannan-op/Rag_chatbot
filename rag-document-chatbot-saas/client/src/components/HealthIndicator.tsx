import { useEffect, useState } from "react";
import { getHealth } from "../services/api";

export default function HealthIndicator() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    getHealth()
      .then(() => setIsOnline(true))
      .catch(() => setIsOnline(false));
  }, []);

  return (
    <div className="flex items-center gap-2 px-2 text-xs text-slate-500">
      <span
        className={`h-2 w-2 rounded-full ${
          isOnline ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />
      {isOnline ? "All systems operational" : "API reconnecting"}
    </div>
  );
}
