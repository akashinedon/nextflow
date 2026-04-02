"use client";

import React from "react";
import { Handle, Position, type HandleProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { HandleDataType } from "@/types/workflow";

const TYPE_COLORS: Record<HandleDataType, string> = {
  text: "!text-blue-400 !border-blue-400 hover:!shadow-[0_0_8px_#60a5fa]",
  image: "!text-emerald-400 !border-emerald-400 hover:!shadow-[0_0_8px_#34d399]",
  video: "!text-amber-400 !border-amber-400 hover:!shadow-[0_0_8px_#f59e0b]",
  number: "!text-pink-400 !border-pink-400 hover:!shadow-[0_0_8px_#f472b6]",
  any: "!text-violet-400 !border-violet-400 hover:!shadow-[0_0_8px_#8b5cf6]",
};

interface NodeHandleProps {
  type: HandleProps["type"];
  position: Position;
  id: string;
  label: string;
  dataType: HandleDataType;
  isConnected?: boolean;
  required?: boolean;
  style?: React.CSSProperties;
}

export default function NodeHandle({
  type,
  position,
  id,
  label,
  dataType,
  isConnected,
  required,
  style,
}: NodeHandleProps) {
  const colorClass = TYPE_COLORS[dataType];

  return (
    <div
      className={cn(
        "relative flex items-center",
        position === Position.Left ? "flex-row ml-0" : "flex-row-reverse mr-0"
      )}
      style={style}
    >
      <Handle
        type={type}
        position={position}
        id={id}
        className={cn(
          "!w-2.5 !h-2.5 !rounded-full !border-2 !bg-[#12121c] transition-all",
          colorClass,
          isConnected && "!bg-current !opacity-80"
        )}
      />
      <span
        className={cn(
          "text-[10px] font-mono text-slate-500 select-none pointer-events-none",
          position === Position.Left ? "ml-2" : "mr-2",
          required && "text-slate-400"
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
    </div>
  );
}
