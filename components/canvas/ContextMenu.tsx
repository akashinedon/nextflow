"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Trash2, Copy, Play } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useWorkflowStore } from "@/store/workflowStore";
import { cn } from "@/lib/utils";

interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string | null;
  edgeId: string | null;
}

export default function ContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const { deleteNode, deleteEdge, addNode, runSingleNode } = useWorkflowStore();
  const { getNode } = useReactFlow();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const nodeEl = target.closest("[data-id]");
    const edgeEl = target.closest(".react-flow__edge");

    if (nodeEl || edgeEl) {
      e.preventDefault();
      const nodeId = nodeEl?.getAttribute("data-id") ?? null;
      const edgeId = edgeEl?.getAttribute("data-id") ?? null;
      setMenu({ x: e.clientX, y: e.clientY, nodeId, edgeId });
    }
  }, []);

  const close = useCallback(() => setMenu(null), []);

  useEffect(() => {
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", close);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [handleContextMenu, close]);

  if (!menu) return null;

  const handleDelete = () => {
    if (menu.nodeId) deleteNode(menu.nodeId);
    if (menu.edgeId) deleteEdge(menu.edgeId);
    close();
  };

  const handleDuplicate = () => {
    if (!menu.nodeId) return;
    const node = getNode(menu.nodeId);
    if (!node) return;
    addNode({
      ...node,
      id: `${String(node.type)}-${Date.now()}`,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    close();
  };

  const handleRunSingle = () => {
    if (!menu.nodeId) return;
    void runSingleNode(menu.nodeId);
    close();
  };

  // Clamp menu position to viewport
  const safeX = Math.min(menu.x, window.innerWidth - 160);
  const safeY = Math.min(menu.y, window.innerHeight - 160);

  return (
    <div
      ref={menuRef}
      style={{ top: safeY, left: safeX }}
      className={cn(
        "fixed z-50 min-w-[156px] rounded-xl bg-[#17172a] border border-[#2a2a40]",
        "shadow-2xl shadow-black/60 py-1.5 animate-fade-in backdrop-blur-sm"
      )}
    >
      {menu.nodeId && (
        <>
          {/* Run Single Node */}
          <ContextMenuItem
            icon={<Play size={11} fill="currentColor" />}
            label="Run this node"
            onClick={handleRunSingle}
            highlight
          />
          <div className="my-1 border-t border-[#2a2a40]" />
          {/* Duplicate */}
          <ContextMenuItem
            icon={<Copy size={11} />}
            label="Duplicate"
            onClick={handleDuplicate}
          />
        </>
      )}
      {/* Delete */}
      <ContextMenuItem
        icon={<Trash2 size={11} />}
        label={menu.nodeId ? "Delete node" : "Delete edge"}
        onClick={handleDelete}
        danger
      />
    </div>
  );
}

interface ContextMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  highlight?: boolean;
}

function ContextMenuItem({
  icon,
  label,
  onClick,
  danger,
  highlight,
}: ContextMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors text-left",
        danger
          ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
          : highlight
          ? "text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
          : "text-slate-300 hover:bg-[#1e1e30] hover:text-white"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
