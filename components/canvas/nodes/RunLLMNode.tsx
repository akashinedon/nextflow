"use client";

import { memo, useCallback, useState } from "react";
import { Position } from "@xyflow/react";
import { Sparkles, ChevronDown, Loader2 } from "lucide-react";
import NodeCard from "@/components/canvas/NodeCard";
import NodeHandle from "@/components/canvas/handles/NodeHandle";
import { useWorkflowStore } from "@/store/workflowStore";
import type { RunLLMWorkflowNode, GeminiModel } from "@/types/workflow";
import { cn } from "@/lib/utils";

interface RunLLMNodeProps {
  id: string;
  data: RunLLMWorkflowNode["data"];
}

const GEMINI_MODELS: { value: GeminiModel; label: string }[] = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { value: "gemini-1.5-flash-8b", label: "Gemini 1.5 Flash 8B" },
];

function RunLLMNode({ id, data }: RunLLMNodeProps) {
  const { updateNodeData, executionStates } = useWorkflowStore();
  const execState = executionStates[id];
  const isRunning = execState?.status === "running";
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const update = useCallback(
    (patch: Partial<RunLLMWorkflowNode["data"]>) => {
      updateNodeData<RunLLMWorkflowNode>(id, (prev) => ({ ...prev, ...patch }));
    },
    [id, updateNodeData]
  );

  const handleExecute = useCallback(async () => {
    update({ result: null });
    // Trigger via Zustand store execution state
    const response = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: data.model,
        systemPrompt: data.systemPromptConnected ? undefined : data.systemPrompt,
        userMessage: data.userMessage,
      }),
    });

    if (response.ok) {
      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value, { stream: true });
          update({ result });
        }
      }
    }
  }, [data, update]);

  const selectedModel = GEMINI_MODELS.find((m) => m.value === data.model);

  return (
    <NodeCard
      id={id}
      title="Run LLM"
      icon={<Sparkles size={12} />}
      executionStatus={execState?.status ?? "idle"}
      minWidth={300}
    >
      {/* Input handles on left */}
      <div className="absolute left-0 top-12 flex flex-col gap-4 -ml-1">
        <NodeHandle
          type="target"
          position={Position.Left}
          id="input-system_prompt"
          label="system_prompt"
          dataType="text"
          isConnected={data.systemPromptConnected}
        />
        <NodeHandle
          type="target"
          position={Position.Left}
          id="input-user_message"
          label="user_message"
          dataType="text"
          isConnected={data.userMessageConnected}
          required
        />
        <NodeHandle
          type="target"
          position={Position.Left}
          id="input-images"
          label="images"
          dataType="image"
          isConnected={data.imagesConnected}
        />
      </div>

      <div className="pl-2 space-y-2">
        {/* Model selector */}
        <div className="relative">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setShowModelDropdown((v) => !v)}
            className="nodrag w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#2a2a40] hover:border-violet-500/40 transition-colors text-sm text-slate-300"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={12} className="text-violet-400" />
              {selectedModel?.label ?? "Select model"}
            </span>
            <ChevronDown
              size={12}
              className={cn(
                "text-slate-500 transition-transform",
                showModelDropdown && "rotate-180"
              )}
            />
          </button>

          {showModelDropdown && (
            <div className="absolute z-50 mt-1 w-full rounded-lg bg-[#17172a] border border-[#2a2a40] shadow-xl overflow-hidden">
              {GEMINI_MODELS.map((m) => (
                <button
                  key={m.value}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    update({ model: m.value });
                    setShowModelDropdown(false);
                  }}
                  className={cn(
                    "nodrag w-full text-left px-3 py-2 text-xs transition-colors",
                    m.value === data.model
                      ? "text-violet-400 bg-violet-500/10"
                      : "text-slate-300 hover:bg-[#1e1e30]"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* System prompt */}
        <div>
          <label className="text-[10px] text-slate-600 uppercase tracking-wider mb-1 block">
            System Prompt
          </label>
          <textarea
            value={data.systemPrompt}
            onChange={(e) => update({ systemPrompt: e.target.value })}
            disabled={data.systemPromptConnected}
            placeholder={
              data.systemPromptConnected ? "← Connected" : "Optional system prompt…"
            }
            rows={2}
            className={cn(
              "nodrag nowheel w-full resize-none rounded-lg px-2.5 py-2 text-xs outline-none border transition-colors",
              data.systemPromptConnected
                ? "bg-[#17172a] border-[#2a2a40] text-slate-600 cursor-not-allowed"
                : "bg-[#0d0d14] border-[#2a2a40] text-slate-200 placeholder-slate-700 focus:border-violet-500/40"
            )}
          />
        </div>

        {/* User message */}
        <div>
          <label className="text-[10px] text-slate-600 uppercase tracking-wider mb-1 block">
            User Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={data.userMessage}
            onChange={(e) => update({ userMessage: e.target.value })}
            disabled={data.userMessageConnected}
            placeholder={
              data.userMessageConnected ? "← Connected" : "Enter user message…"
            }
            rows={3}
            className={cn(
              "nodrag nowheel w-full resize-none rounded-lg px-2.5 py-2 text-xs outline-none border transition-colors",
              data.userMessageConnected
                ? "bg-[#17172a] border-[#2a2a40] text-slate-600 cursor-not-allowed"
                : "bg-[#0d0d14] border-[#2a2a40] text-slate-200 placeholder-slate-700 focus:border-violet-500/40"
            )}
          />
        </div>

        {/* Run button */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleExecute}
          disabled={isRunning || (!data.userMessage && !data.userMessageConnected)}
          className={cn(
            "nodrag w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all",
            isRunning || (!data.userMessage && !data.userMessageConnected)
              ? "bg-[#17172a] text-slate-600 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-violet-500/20"
          )}
        >
          {isRunning ? (
            <>
              <Loader2 size={12} className="animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles size={12} /> Generate
            </>
          )}
        </button>

        {/* Inline LLM result */}
        {data.result && (
          <div className="mt-2 rounded-lg bg-[#0d0d14] border border-[#2a2a40] p-2.5 max-h-40 overflow-y-auto nowheel">
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">
              Output
            </p>
            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
              {data.result}
            </p>
          </div>
        )}
      </div>

      {/* Output handle */}
      <div className="flex justify-end mt-2 -mr-3">
        <NodeHandle
          type="source"
          position={Position.Right}
          id="output-output"
          label="output"
          dataType="text"
        />
      </div>
    </NodeCard>
  );
}

export default memo(RunLLMNode);
