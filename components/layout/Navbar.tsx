"use client";

import React, { useCallback, useRef } from "react";
import { UserButton } from "@clerk/nextjs";
import {
  Play,
  Save,
  Loader2,
  Undo2,
  Redo2,
  Download,
  Upload,
  CheckSquare,
} from "lucide-react";
import { useWorkflowStore, useWorkflowHistory } from "@/store/workflowStore";
import { cn } from "@/lib/utils";

interface NavbarProps {
  workflowId: string;
}

export default function Navbar({ workflowId: _workflowId }: NavbarProps) {
  const {
    workflowName,
    setWorkflowName,
    isSaving,
    isRunning,
    selectedNodeIds,
    runWorkflow,
    runSelectedNodes,
    saveWorkflow,
    exportWorkflow,
    importWorkflow,
  } = useWorkflowStore();
  const { undo, redo, pastStates, futureStates } = useWorkflowHistory();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;
  const hasSelection = selectedNodeIds.length > 0;

  const handleRun = useCallback(() => {
    void runWorkflow("full");
  }, [runWorkflow]);

  const handleRunSelected = useCallback(() => {
    void runSelectedNodes();
  }, [runSelectedNodes]);

  const handleSave = useCallback(() => {
    void saveWorkflow();
  }, [saveWorkflow]);

  const handleExport = useCallback(() => {
    exportWorkflow();
  }, [exportWorkflow]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await importWorkflow(file);
      // Reset the input so the same file can be re-imported
      e.target.value = "";
    },
    [importWorkflow]
  );

  return (
    <header className="h-12 bg-[#0d0d14] border-b border-[#2a2a40] flex items-center px-3 gap-2 shrink-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-1">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-sm font-semibold text-white tracking-tight hidden sm:block">
          NextFlow
        </span>
      </div>

      <div className="w-px h-5 bg-[#2a2a40]" />

      {/* Editable workflow name */}
      <input
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        className="bg-transparent text-sm font-medium text-white placeholder-slate-500 outline-none border border-transparent rounded-md px-2 py-1 hover:border-[#2a2a40] focus:border-violet-500/50 focus:bg-[#17172a] transition-colors w-40"
        placeholder="Untitled Workflow"
        maxLength={100}
      />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5" suppressHydrationWarning>
        <NavIconBtn
          onClick={() => undo()}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={13} />
        </NavIconBtn>
        <NavIconBtn
          onClick={() => redo()}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={13} />
        </NavIconBtn>
      </div>

      <div className="w-px h-5 bg-[#2a2a40]" />

      {/* Toolbar: Save · Export · Import */}
      <div className="flex items-center gap-1">
        <NavTextBtn onClick={handleSave} disabled={isSaving} title="Save (Ctrl+S)">
          {isSaving ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <Save size={11} />
          )}
          {isSaving ? "Saving…" : "Save"}
        </NavTextBtn>

        <NavTextBtn onClick={handleExport} title="Export as JSON">
          <Download size={11} />
          Export
        </NavTextBtn>

        <NavTextBtn onClick={handleImportClick} title="Import from JSON">
          <Upload size={11} />
          Import
        </NavTextBtn>

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Run Selected Nodes (visible only when ≥1 node selected) */}
      {hasSelection && (
        <button
          onClick={handleRunSelected}
          disabled={isRunning}
          title={`Run ${selectedNodeIds.length} selected node${selectedNodeIds.length !== 1 ? "s" : ""}`}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
            isRunning
              ? "border-[#2a2a40] text-slate-600 cursor-not-allowed"
              : "border-violet-500/40 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/60"
          )}
        >
          <CheckSquare size={12} />
          {selectedNodeIds.length} selected
        </button>
      )}

      {/* Run Full Workflow */}
      <button
        onClick={handleRun}
        disabled={isRunning}
        title="Run full workflow"
        className={cn(
          "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
          isRunning
            ? "bg-violet-700/50 text-violet-300 cursor-not-allowed"
            : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-violet-500/20"
        )}
      >
        {isRunning ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Play size={13} fill="currentColor" />
        )}
        {isRunning ? "Running…" : "Run"}
      </button>

      {/* User avatar */}
      <UserButton
        appearance={{ elements: { avatarBox: "w-7 h-7" } }}
      />
    </header>
  );
}

// ─── Helper components ─────────────────────────────────────────────────────

function NavIconBtn({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        disabled
          ? "text-slate-700 cursor-not-allowed"
          : "text-slate-400 hover:text-white hover:bg-white/8"
      )}
    >
      {children}
    </button>
  );
}

function NavTextBtn({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
        disabled
          ? "border-[#2a2a40] text-slate-600 cursor-not-allowed"
          : "border-[#2a2a40] text-slate-400 hover:text-white hover:border-violet-500/50 hover:bg-[#17172a]"
      )}
    >
      {children}
    </button>
  );
}
