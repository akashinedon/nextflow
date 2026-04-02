"use client";

import React, { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_DEFINITIONS } from "@/lib/nodeDefinitions";
import { useWorkflowStore } from "@/store/workflowStore";
import type { WorkflowNode } from "@/types/workflow";
import {
  Type,
  Image,
  Video,
  Sparkles,
  Crop,
  Film,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Type,
  Image,
  Video,
  Sparkles,
  Crop,
  Film,
};

const HANDLE_COLOR_MAP: Record<string, string> = {
  textNode: "bg-blue-500/20 border-blue-500/40 text-blue-400",
  uploadImageNode: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
  uploadVideoNode: "bg-amber-500/20 border-amber-500/40 text-amber-400",
  runLLMNode: "bg-violet-500/20 border-violet-500/40 text-violet-400",
  cropImageNode: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
  extractFrameNode: "bg-amber-500/20 border-amber-500/40 text-amber-400",
};

export default function LeftSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { addNode } = useWorkflowStore();

  const handleAddNode = useCallback(
    (defIndex: number) => {
      const def = NODE_DEFINITIONS[defIndex];
      if (!def) return;

      const id = `${def.type}-${Date.now()}`;
      const nodeObj = {
        id,
        type: def.type,
        position: {
          x: 200 + Math.random() * 200,
          y: 150 + Math.random() * 200,
        },
        data: { ...def.defaultData },
      };
      addNode(nodeObj as unknown as WorkflowNode);
    },
    [addNode]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, defIndex: number) => {
      const def = NODE_DEFINITIONS[defIndex];
      if (!def) return;
      e.dataTransfer.setData("application/nextflow-node-type", def.type);
      e.dataTransfer.effectAllowed = "copy";
    },
    []
  );

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-[#0d0d14] border-r border-[#2a2a40] transition-all duration-200 shrink-0",
        collapsed ? "w-12" : "w-[260px]"
      )}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-4 z-10 w-6 h-6 rounded-full bg-[#17172a] border border-[#2a2a40] flex items-center justify-center text-slate-400 hover:text-white hover:border-violet-500/50 transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-3 border-b border-[#2a2a40]",
          collapsed ? "justify-center" : ""
        )}
      >
        <Zap size={14} className="text-violet-400 shrink-0" />
        {!collapsed && (
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Quick Access
          </span>
        )}
      </div>

      {/* Node list */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {NODE_DEFINITIONS.map((def, idx) => {
            const IconComp = ICON_MAP[def.icon] ?? Type;
            const colorClass =
              HANDLE_COLOR_MAP[def.type] ??
              "bg-slate-500/20 border-slate-500/40 text-slate-400";

            return (
              <div
                key={def.type}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onClick={() => handleAddNode(idx)}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-grab active:cursor-grabbing hover:bg-[#1e1e30] transition-colors border border-transparent hover:border-[#2a2a40]"
                title={`${def.description} — drag or click to add`}
              >
                {/* Icon badge */}
                <div
                  className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center shrink-0 border",
                    colorClass
                  )}
                >
                  <IconComp size={13} />
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {def.label}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {def.description}
                  </p>
                </div>

                {/* Drag hint */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    width="10"
                    height="14"
                    viewBox="0 0 10 14"
                    fill="none"
                    className="text-slate-600"
                  >
                    <circle cx="3" cy="2" r="1.5" fill="currentColor" />
                    <circle cx="7" cy="2" r="1.5" fill="currentColor" />
                    <circle cx="3" cy="7" r="1.5" fill="currentColor" />
                    <circle cx="7" cy="7" r="1.5" fill="currentColor" />
                    <circle cx="3" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="7" cy="12" r="1.5" fill="currentColor" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Collapsed icons */}
      {collapsed && (
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 flex flex-col items-center">
          {NODE_DEFINITIONS.map((def, idx) => {
            const IconComp = ICON_MAP[def.icon] ?? Type;
            const colorClass =
              HANDLE_COLOR_MAP[def.type] ??
              "bg-slate-500/20 border-slate-500/40 text-slate-400";

            return (
              <button
                key={def.type}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onClick={() => handleAddNode(idx)}
                title={def.label}
                className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center border transition-colors hover:scale-105",
                  colorClass
                )}
              >
                <IconComp size={14} />
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
