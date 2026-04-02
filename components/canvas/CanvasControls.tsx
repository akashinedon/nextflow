"use client";

import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { Maximize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CanvasControls() {
  const { fitView, zoomIn, zoomOut, zoomTo } = useReactFlow();

  return (
    <div className="flex items-center gap-1 bg-[#12121c] border border-[#2a2a40] rounded-xl p-1 shadow-xl mb-4">
      <ControlButton onClick={() => zoomOut()} title="Zoom out">
        <ZoomOut size={14} />
      </ControlButton>
      <ControlButton
        onClick={() => fitView({ padding: 0.2, duration: 300 })}
        title="Fit view"
      >
        <Maximize2 size={14} />
      </ControlButton>
      <ControlButton onClick={() => zoomIn()} title="Zoom in">
        <ZoomIn size={14} />
      </ControlButton>
      <div className="w-px h-4 bg-[#2a2a40] mx-0.5" />
      <ControlButton onClick={() => zoomTo(1, { duration: 300 })} title="Reset zoom">
        <RotateCcw size={12} />
      </ControlButton>
    </div>
  );
}

interface ControlButtonProps {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

function ControlButton({ onClick, title, children, className }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1e1e30] transition-colors",
        className
      )}
    >
      {children}
    </button>
  );
}
