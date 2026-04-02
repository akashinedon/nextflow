"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  History,
  ChevronDown,
  ChevronRight,
  Layers,
  Zap,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflowStore";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NodeRunRecord {
  id: string;
  nodeId: string;
  nodeType: string;
  status: "SUCCESS" | "FAILED" | "RUNNING" | "SKIPPED";
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  outputs: Record<string, unknown>;
}

interface RunRecord {
  id: string;
  workflowId: string | null;
  status: "SUCCESS" | "FAILED" | "RUNNING" | "PARTIAL";
  scope: "FULL" | "PARTIAL" | "SINGLE";
  nodeCount: number;
  startedAt: string;
  completedAt: string | null;
  workflow: { name: string } | null;
  _count: { nodeRuns: number };
}

interface RunDetail extends RunRecord {
  nodeRuns: NodeRunRecord[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SCOPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  FULL: { label: "Full Workflow", icon: <Layers size={10} /> },
  PARTIAL: { label: "Selected Nodes", icon: <CheckCircle size={10} /> },
  SINGLE: { label: "Single Node", icon: <Zap size={10} /> },
};

const STATUS_CONFIG = {
  SUCCESS: {
    icon: <CheckCircle size={11} />,
    cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    label: "Success",
    dot: "bg-emerald-400",
  },
  FAILED: {
    icon: <XCircle size={11} />,
    cls: "text-red-400 bg-red-500/10 border-red-500/20",
    label: "Failed",
    dot: "bg-red-400",
  },
  RUNNING: {
    icon: <Loader2 size={11} className="animate-spin" />,
    cls: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    label: "Running",
    dot: "bg-violet-400 animate-pulse",
  },
  PARTIAL: {
    icon: <CheckCircle size={11} />,
    cls: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    label: "Partial",
    dot: "bg-amber-400",
  },
  SKIPPED: {
    icon: <Square size={11} />,
    cls: "text-slate-500 bg-slate-500/8 border-slate-500/10",
    label: "Skipped",
    dot: "bg-slate-500",
  },
};

function formatDuration(start: string, end: string | null): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Run Entry Component ──────────────────────────────────────────────────────

interface RunEntryProps {
  run: RunRecord;
  runIndex: number; // used as run number in reverse (latest = highest)
  totalRuns: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function RunEntry({
  run,
  runIndex,
  totalRuns,
  isExpanded,
  onToggle,
}: RunEntryProps) {
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const status = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.FAILED;
  const scope = SCOPE_LABELS[run.scope] ?? SCOPE_LABELS["FULL"]!;
  const runNumber = totalRuns - runIndex;

  const fetchDetail = useCallback(async () => {
    if (detail) return; // already loaded
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/runs/${run.id}`);
      if (res.ok) {
        const data = (await res.json()) as { run: RunDetail };
        setDetail(data.run);
      }
    } finally {
      setLoadingDetail(false);
    }
  }, [run.id, detail]);

  const handleToggle = useCallback(() => {
    onToggle();
    if (!isExpanded) void fetchDetail();
  }, [isExpanded, onToggle, fetchDetail]);

  return (
    <div
      className={cn(
        "border-b border-[#2a2a40] last:border-b-0 transition-colors",
        isExpanded ? "bg-[#15152a]" : "hover:bg-[#17172a]"
      )}
    >
      {/* Run summary row */}
      <button
        onClick={handleToggle}
        className="w-full px-3 py-2.5 text-left flex items-start gap-2.5"
      >
        {/* Expand chevron */}
        <span className="text-slate-600 mt-0.5 shrink-0">
          {isExpanded ? (
            <ChevronDown size={12} />
          ) : (
            <ChevronRight size={12} />
          )}
        </span>

        <div className="flex-1 min-w-0">
          {/* Top row: run# + status + duration */}
          <div className="flex items-center gap-2 mb-1">
            {/* Status dot */}
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                status.dot
              )}
            />
            {/* Run number */}
            <span className="text-[10px] font-mono text-slate-500">
              #{runNumber}
            </span>
            {/* Status badge */}
            <span
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium",
                status.cls
              )}
            >
              {status.icon}
              {status.label}
            </span>
            {/* Duration */}
            <span className="text-[10px] text-slate-600 ml-auto shrink-0">
              {formatDuration(run.startedAt, run.completedAt)}
            </span>
          </div>

          {/* Workflow name */}
          <p className="text-xs text-slate-300 truncate mb-0.5">
            {run.workflow?.name ?? "Unsaved workflow"}
          </p>

          {/* Bottom row: scope + timestamp */}
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-[10px] text-slate-600">
              {scope.icon}
              {scope.label}
              {run.scope !== "FULL" && run._count.nodeRuns > 0 && (
                <span className="text-slate-700">
                  · {run._count.nodeRuns} node{run._count.nodeRuns !== 1 ? "s" : ""}
                </span>
              )}
            </span>
            <span className="text-[10px] text-slate-700 shrink-0">
              {formatTimestamp(run.startedAt)}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded: node-level detail */}
      {isExpanded && (
        <div className="pb-2 px-3">
          {loadingDetail ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 size={11} className="animate-spin text-slate-600" />
              <span className="text-[10px] text-slate-600">Loading…</span>
            </div>
          ) : detail && detail.nodeRuns.length > 0 ? (
            <div className="space-y-1">
              {detail.nodeRuns.map((nr) => {
                const ns =
                  STATUS_CONFIG[nr.status] ?? STATUS_CONFIG.FAILED;
                return (
                  <div
                    key={nr.id}
                    className="flex items-center gap-2 py-1 px-2 rounded-lg bg-[#0d0d14] border border-[#2a2a40]"
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        ns.dot
                      )}
                    />
                    <span className="text-[10px] text-slate-400 flex-1 truncate font-mono">
                      {nr.nodeType.replace(/Node$/, "")}
                      <span className="text-slate-700 ml-1">
                        {nr.nodeId.slice(-6)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        ns.cls.split(" ")[0]
                      )}
                    >
                      {ns.label}
                    </span>
                    <span className="text-[10px] text-slate-700 shrink-0">
                      {formatDuration(nr.startedAt, nr.completedAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-slate-700 py-1.5 pl-1">
              No node data recorded.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function RightSidebar() {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { isRunning, lastRunId } = useWorkflowStore();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/runs");
      if (res.ok) {
        const data = (await res.json()) as { runs: RunRecord[] };
        setRuns(data.runs);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    void fetchRuns();
  }, [fetchRuns]);

  // Poll every 3s while any run is RUNNING; stop when all done
  useEffect(() => {
    const hasRunningRun = runs.some((r) => r.status === "RUNNING") || isRunning;

    if (hasRunningRun && !pollingRef.current) {
      pollingRef.current = setInterval(() => void fetchRuns(), 3000);
    }

    if (!hasRunningRun && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [runs, isRunning, fetchRuns]);

  // Auto-expand latest run when a new one starts
  useEffect(() => {
    if (lastRunId) {
      setExpandedId(lastRunId);
      void fetchRuns();
    }
  }, [lastRunId, fetchRuns]);

  const toggleEntry = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const successCount = runs.filter((r) => r.status === "SUCCESS").length;
  const failedCount = runs.filter((r) => r.status === "FAILED").length;

  return (
    <aside className="w-[258px] shrink-0 bg-[#0d0d14] border-l border-[#2a2a40] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#2a2a40] shrink-0">
        <div className="flex items-center gap-2">
          <History size={13} className="text-violet-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Run History
          </span>
        </div>
        <button
          onClick={() => void fetchRuns()}
          disabled={loading}
          title="Refresh"
          className="p-1 rounded-md text-slate-600 hover:text-slate-400 hover:bg-[#1e1e30] transition-colors"
        >
          <RefreshCw size={11} className={cn(loading && "animate-spin")} />
        </button>
      </div>

      {/* Summary stats */}
      {runs.length > 0 && (
        <div className="flex items-center justify-around px-3 py-2 border-b border-[#2a2a40] bg-[#0a0a12] shrink-0">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-semibold text-white">
              {runs.length}
            </span>
            <span className="text-[9px] text-slate-600 uppercase tracking-wider">
              Total
            </span>
          </div>
          <div className="w-px h-6 bg-[#2a2a40]" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-semibold text-emerald-400">
              {successCount}
            </span>
            <span className="text-[9px] text-slate-600 uppercase tracking-wider">
              Success
            </span>
          </div>
          <div className="w-px h-6 bg-[#2a2a40]" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-semibold text-red-400">
              {failedCount}
            </span>
            <span className="text-[9px] text-slate-600 uppercase tracking-wider">
              Failed
            </span>
          </div>
        </div>
      )}

      {/* Run list */}
      <div className="flex-1 overflow-y-auto">
        {runs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#17172a] border border-[#2a2a40] flex items-center justify-center">
              <Clock size={18} className="text-slate-700" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">No runs yet</p>
              <p className="text-[10px] text-slate-700 mt-0.5">
                Click Run to execute your workflow
              </p>
            </div>
          </div>
        ) : (
          runs.map((run, idx) => (
            <RunEntry
              key={run.id}
              run={run}
              runIndex={idx}
              totalRuns={runs.length}
              isExpanded={expandedId === run.id}
              onToggle={() => toggleEntry(run.id)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[#2a2a40] shrink-0 flex items-center justify-between">
        <span className="text-[10px] text-slate-700">
          {runs.length ? `Last ${Math.min(runs.length, 50)} runs` : "No history"}
        </span>
        {isRunning && (
          <span className="flex items-center gap-1 text-[10px] text-violet-400">
            <Loader2 size={10} className="animate-spin" />
            running
          </span>
        )}
      </div>
    </aside>
  );
}
