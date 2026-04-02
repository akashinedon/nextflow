"use client";

import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflowStore";
import type { NodeExecutionStatus } from "@/types/workflow";

interface NodeCardProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  executionStatus?: NodeExecutionStatus;
  children: React.ReactNode;
  minWidth?: number;
  className?: string;
}

const STATUS_BADGE: Record<
  NodeExecutionStatus,
  { label: string; cls: string }
> = {
  idle: { label: "", cls: "" },
  running: { label: "Running…", cls: "text-violet-400 bg-violet-500/15" },
  success: { label: "Done ✓", cls: "text-emerald-400 bg-emerald-500/15" },
  failed: { label: "Failed", cls: "text-red-400 bg-red-500/15" },
  skipped: { label: "Skipped", cls: "text-slate-500 bg-slate-500/10" },
};

export default function NodeCard({
  id,
  title,
  icon,
  executionStatus = "idle",
  children,
  minWidth = 260,
  className,
}: NodeCardProps) {
  const { deleteNode, executionStates } = useWorkflowStore();
  const [showErrorTooltip, setShowErrorTooltip] = useState(false);
  const execState = executionStates[id];

  const isRunning = executionStatus === "running";
  const hasFailed = executionStatus === "failed";
  const errorMsg = hasFailed ? (execState?.error ?? "Execution failed") : null;

  return (
    <div
      style={{ minWidth }}
      className={cn(
        "rounded-xl border bg-[#12121c] shadow-node select-none relative",
        isRunning
          ? "border-violet-500/70 node-running shadow-[0_0_20px_rgba(139,92,246,0.25)]"
          : executionStatus === "success"
          ? "border-emerald-500/50 shadow-[0_0_12px_rgba(52,211,153,0.12)]"
          : hasFailed
          ? "border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.12)]"
          : "border-[#2a2a40] hover:border-[#3d3d60]",
        "transition-all duration-300",
        className
      )}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a40] rounded-t-xl bg-[#17172a]">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{icon}</span>
          <span className="text-xs font-semibold text-slate-200 tracking-wide">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          {executionStatus !== "idle" && (
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors",
                STATUS_BADGE[executionStatus]?.cls
              )}
            >
              {STATUS_BADGE[executionStatus]?.label}
            </span>
          )}

          {/* Error tooltip trigger */}
          {hasFailed && errorMsg && (
            <div className="relative">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onMouseEnter={() => setShowErrorTooltip(true)}
                onMouseLeave={() => setShowErrorTooltip(false)}
                className="w-4 h-4 rounded flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
              >
                <AlertCircle size={12} />
              </button>
              {showErrorTooltip && (
                <div className="absolute right-0 top-6 z-50 w-56 bg-[#1e0a0a] border border-red-500/30 rounded-lg px-3 py-2 shadow-xl">
                  <p className="text-[10px] text-red-300 leading-relaxed break-words">
                    {errorMsg}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Delete button */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(id);
            }}
            className="w-4 h-4 rounded flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <X size={10} />
          </button>
        </div>
      </div>

      {/* Running pulse indicator */}
      {isRunning && (
        <div className="absolute inset-0 rounded-xl pointer-events-none">
          <div className="absolute inset-0 rounded-xl border border-violet-500/30 animate-ping" />
        </div>
      )}

      {/* Body */}
      <div className="p-3">{children}</div>
    </div>
  );
}
