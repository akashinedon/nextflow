"use client";

import { memo } from "react";
import {
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";

const EDGE_COLORS: Record<string, string> = {
  text: "#60a5fa",    // blue
  image: "#34d399",   // emerald
  video: "#f59e0b",   // amber
  number: "#f472b6",  // pink
  any: "#8b5cf6",     // violet (default)
};

// Use Edge<Record<string,unknown>> as the generic to satisfy @xyflow/react constraints
function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<Edge<Record<string, unknown>>>) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  // Safely extract dataType from data (may be undefined if edge has no data)
  const dataType =
    typeof data === "object" && data !== null && "dataType" in data
      ? String(data.dataType)
      : "any";

  const color = EDGE_COLORS[dataType] ?? "#8b5cf6";

  return (
    <>
      {/* Glow base layer */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={selected ? 3 : 2}
        strokeOpacity={0.25}
        style={{
          filter: `drop-shadow(0 0 6px ${color})`,
        }}
      />
      {/* Animated dashed overlay */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={selected ? 2.5 : 1.8}
        strokeOpacity={selected ? 1 : 0.85}
        strokeDasharray="8 4"
        className="animated-edge-path"
        style={{
          filter: `drop-shadow(0 0 3px ${color})`,
        }}
      />
    </>
  );
}

export default memo(AnimatedEdge);
