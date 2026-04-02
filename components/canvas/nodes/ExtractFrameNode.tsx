"use client";

import { memo, useCallback } from "react";
import { Position } from "@xyflow/react";
import { Film } from "lucide-react";
import NodeCard from "@/components/canvas/NodeCard";
import NodeHandle from "@/components/canvas/handles/NodeHandle";
import { useWorkflowStore } from "@/store/workflowStore";
import type { ExtractFrameWorkflowNode } from "@/types/workflow";
import { cn } from "@/lib/utils";

interface ExtractFrameNodeProps {
  id: string;
  data: ExtractFrameWorkflowNode["data"];
}

function ExtractFrameNode({ id, data }: ExtractFrameNodeProps) {
  const { updateNodeData, executionStates } = useWorkflowStore();
  const execState = executionStates[id];

  const update = useCallback(
    (patch: Partial<ExtractFrameWorkflowNode["data"]>) => {
      updateNodeData<ExtractFrameWorkflowNode>(id, (prev) => ({
        ...prev,
        ...patch,
      }));
    },
    [id, updateNodeData]
  );

  return (
    <NodeCard
      id={id}
      title="Extract Frame"
      icon={<Film size={12} />}
      executionStatus={execState?.status ?? "idle"}
      minWidth={240}
    >
      {/* Input handles */}
      <div className="absolute left-0 top-12 flex flex-col gap-6 -ml-1">
        <NodeHandle
          type="target"
          position={Position.Left}
          id="input-video_url"
          label="video_url"
          dataType="video"
          isConnected={data.videoUrlConnected}
          required
        />
        <NodeHandle
          type="target"
          position={Position.Left}
          id="input-timestamp"
          label="timestamp"
          dataType="text"
          isConnected={data.timestampConnected}
        />
      </div>

      <div className="pl-6 space-y-3">
        {/* Timestamp input */}
        <div>
          <label className="text-[10px] text-slate-600 uppercase tracking-wider mb-1 block">
            Timestamp
          </label>
          <input
            type="text"
            value={data.timestamp}
            disabled={data.timestampConnected}
            onChange={(e) => update({ timestamp: e.target.value })}
            placeholder={data.timestampConnected ? "← connected" : "e.g. 5, 2.5, 50%"}
            className={cn(
              "nodrag w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none transition-colors",
              data.timestampConnected
                ? "bg-[#17172a] border-[#2a2a40] text-slate-600 cursor-not-allowed"
                : "bg-[#0d0d14] border-[#2a2a40] text-slate-200 placeholder-slate-700 focus:border-amber-500/40"
            )}
          />
          <p className="text-[10px] text-slate-700 mt-1">
            Seconds (e.g. 5.2) or percentage (e.g. 50%)
          </p>
        </div>

        {/* Output frame preview */}
        {data.outputUrl ? (
          <div className="rounded-md overflow-hidden border border-[#2a2a40]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.outputUrl}
              alt="Extracted frame"
              className="w-full h-24 object-cover"
            />
            <p className="text-[10px] text-slate-600 px-2 py-1">
              Frame @ {data.timestamp}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-16 rounded-md bg-[#0d0d14] border border-dashed border-[#2a2a40]">
            <span className="text-[10px] text-slate-700">
              Frame preview here after run
            </span>
          </div>
        )}

        <p className="text-[10px] text-slate-700">
          Executes via FFmpeg on Trigger.dev (Phase 3)
        </p>
      </div>

      {/* Output handle */}
      <div className="flex justify-end mt-2 -mr-3">
        <NodeHandle
          type="source"
          position={Position.Right}
          id="output-output"
          label="output"
          dataType="image"
        />
      </div>
    </NodeCard>
  );
}

export default memo(ExtractFrameNode);
