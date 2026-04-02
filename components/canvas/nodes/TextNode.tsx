"use client";

import { memo, useCallback } from "react";
import { Position } from "@xyflow/react";
import { Type } from "lucide-react";
import NodeCard from "@/components/canvas/NodeCard";
import NodeHandle from "@/components/canvas/handles/NodeHandle";
import { useWorkflowStore } from "@/store/workflowStore";
import type { TextWorkflowNode } from "@/types/workflow";

interface TextNodeProps {
  id: string;
  data: TextWorkflowNode["data"];
}

function TextNode({ id, data }: TextNodeProps) {
  const { updateNodeData, executionStates } = useWorkflowStore();
  const execState = executionStates[id];

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData<TextWorkflowNode>(id, (prev) => ({
        ...prev,
        text: e.target.value,
      }));
    },
    [id, updateNodeData]
  );

  return (
    <NodeCard
      id={id}
      title="Text"
      icon={<Type size={12} />}
      executionStatus={execState?.status ?? "idle"}
      minWidth={280}
    >
      <textarea
        value={data.text}
        onChange={handleTextChange}
        placeholder="Enter text…"
        rows={4}
        className="nodrag nowheel w-full resize-y bg-[#0d0d14] border border-[#2a2a40] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors font-mono leading-relaxed min-h-[80px]"
      />

      {/* Output handle */}
      <div className="flex justify-end mt-2 -mr-3">
        <NodeHandle
          type="source"
          position={Position.Right}
          id="output-text"
          label="text"
          dataType="text"
        />
      </div>
    </NodeCard>
  );
}

export default memo(TextNode);
