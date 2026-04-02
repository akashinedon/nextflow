"use client";

import { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  type: "error" | "info" | "success";
  message: string;
  onDismiss: () => void;
}

const STYLES = {
  error: {
    bg: "bg-red-950/80 border-red-500/40",
    icon: <AlertCircle size={14} className="text-red-400 shrink-0" />,
    text: "text-red-200",
  },
  success: {
    bg: "bg-green-950/80 border-green-500/40",
    icon: <CheckCircle size={14} className="text-green-400 shrink-0" />,
    text: "text-green-200",
  },
  info: {
    bg: "bg-[#17172a]/90 border-violet-500/30",
    icon: <Info size={14} className="text-violet-400 shrink-0" />,
    text: "text-slate-200",
  },
};

export default function Toast({ type, message, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss, message]);

  const s = STYLES[type];

  return (
    <div
      className={cn(
        "absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5",
        "px-4 py-2.5 rounded-xl border backdrop-blur-sm shadow-xl",
        "animate-fade-in",
        s.bg
      )}
    >
      {s.icon}
      <span className={cn("text-xs font-medium", s.text)}>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-1 text-slate-600 hover:text-slate-400 transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  );
}
