"use client";

import { memo, useCallback } from "react";
import { Position } from "@xyflow/react";
import { Crop } from "lucide-react";
import NodeCard from "@/components/canvas/NodeCard";
import NodeHandle from "@/components/canvas/handles/NodeHandle";
import { useWorkflowStore } from "@/store/workflowStore";
import type { CropImageWorkflowNode } from "@/types/workflow";
import { cn } from "@/lib/utils";

interface CropImageNodeProps {
  id: string;
  data: CropImageWorkflowNode["data"];
}

interface NumericInputProps {
  label: string;
  value: number;
  connected: boolean;
  onChange: (v: number) => void;
}

function NumericInput({ label, value, connected, onChange }: NumericInputProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] text-slate-600 w-16 shrink-0">{label}</label>
      <input
        type="number"
        min={0}
        max={100}
        step={1}
        value={value}
        disabled={connected}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={connected ? "← connected" : "0–100"}
        className={cn(
          "nodrag flex-1 px-2 py-1 rounded-md text-xs border outline-none transition-colors",
          connected
            ? "bg-[#17172a] border-[#2a2a40] text-slate-600 cursor-not-allowed"
            : "bg-[#0d0d14] border-[#2a2a40] text-slate-200 focus:border-emerald-500/40"
        )}
      />
      <span className="text-[10px] text-slate-700">%</span>
    </div>
  );
}

function CropImageNode({ id, data }: CropImageNodeProps) {
  const { updateNodeData, executionStates } = useWorkflowStore();
  const execState = executionStates[id];

  const update = useCallback(
    (patch: Partial<CropImageWorkflowNode["data"]>) => {
      updateNodeData<CropImageWorkflowNode>(id, (prev) => ({ ...prev, ...patch }));
    },
    [id, updateNodeData]
  );

  return (
    <NodeCard
      id={id}
      title="Crop Image"
      icon={<Crop size={12} />}
      executionStatus={execState?.status ?? "idle"}
      minWidth={260}
    >
      {/* Input handles */}
      <div className="absolute left-0 top-12 flex flex-col gap-3 -ml-1">
        <NodeHandle
          type="target"
          position={Position.Left}
          id="input-image_url"
          label="image_url"
          dataType="image"
          isConnected={data.imageUrlConnected}
          required
        />
        <NodeHandle
          type="target"
          position={Position.Left}
          id="input-x_percent"
          label="x_percent"
          dataType="number"
          isConnected={data.xPercentConnected}
        />
        <NodeHandle
          type="target"
          position={Position.Left}
          id="input-y_percent"
          label="y_percent"
          dataType="number"
          isConnected={data.yPercentConnected}
        />
        <NodeHandle
          type="target"
          position={Position.Left}
          id="input-width_percent"
          label="width_percent"
          dataType="number"
          isConnected={data.widthPercentConnected}
        />
        <NodeHandle
          type="target"
          position={Position.Left}
          id="input-height_percent"
          label="height_percent"
          dataType="number"
          isConnected={data.heightPercentConnected}
        />
      </div>

      <div className="pl-6 space-y-2">
        <NumericInput
          label="X offset"
          value={data.xPercent}
          connected={data.xPercentConnected}
          onChange={(v) => update({ xPercent: v })}
        />
        <NumericInput
          label="Y offset"
          value={data.yPercent}
          connected={data.yPercentConnected}
          onChange={(v) => update({ yPercent: v })}
        />
        <NumericInput
          label="Width"
          value={data.widthPercent}
          connected={data.widthPercentConnected}
          onChange={(v) => update({ widthPercent: v })}
        />
        <NumericInput
          label="Height"
          value={data.heightPercent}
          connected={data.heightPercentConnected}
          onChange={(v) => update({ heightPercent: v })}
        />

        {/* Visual preview of crop region */}
        <div className="relative w-full h-14 bg-[#0d0d14] border border-[#2a2a40] rounded-md overflow-hidden mt-1">
          <div
            className="absolute bg-emerald-500/20 border border-emerald-500/50 rounded-sm"
            style={{
              left: `${data.xPercent}%`,
              top: `${data.yPercent}%`,
              width: `${Math.min(data.widthPercent, 100 - data.xPercent)}%`,
              height: `${Math.min(data.heightPercent, 100 - data.yPercent)}%`,
            }}
          />
          <span className="absolute bottom-1 right-1.5 text-[9px] text-slate-700">
            preview
          </span>
        </div>

        {/* Output image preview */}
        {data.outputUrl && (
          <div className="rounded-md overflow-hidden border border-[#2a2a40]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.outputUrl} alt="Cropped output" className="w-full h-20 object-cover" />
          </div>
        )}

        <p className="text-[10px] text-slate-700 pt-1">
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

export default memo(CropImageNode);
