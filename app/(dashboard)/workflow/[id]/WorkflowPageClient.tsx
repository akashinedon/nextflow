"use client";

import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import WorkflowCanvas from "@/components/canvas/WorkflowCanvas";
import { useEffect, useCallback } from "react";
import { useWorkflowStore } from "@/store/workflowStore";
import {
  SAMPLE_NODES,
  SAMPLE_EDGES,
  SAMPLE_WORKFLOW_NAME,
} from "@/lib/sampleWorkflow";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowPageClientProps {
  workflowId: string;
}

export default function WorkflowPageClient({ workflowId }: WorkflowPageClientProps) {
  const { setWorkflowId } = useWorkflowStore();

  useEffect(() => {
    setWorkflowId(workflowId);
  }, [workflowId, setWorkflowId]);

  return (
    <ReactFlowProvider>
      <WorkflowCanvasWithSample />
    </ReactFlowProvider>
  );
}

/** Inner component — has access to ReactFlow context for fitView */
function WorkflowCanvasWithSample() {
  const { nodes, loadWorkflow, showToast } = useWorkflowStore();
  const { fitView } = useReactFlow();

  const isEmpty = nodes.length === 0;

  const handleLoadSample = useCallback(() => {
    loadWorkflow(SAMPLE_NODES, SAMPLE_EDGES, SAMPLE_WORKFLOW_NAME, "");
    // Fit view after React re-renders the nodes
    setTimeout(() => {
      fitView({ padding: 0.15, duration: 600 });
    }, 100);
    showToast("success", "Sample workflow loaded — Product Marketing Kit Generator");
  }, [loadWorkflow, fitView, showToast]);

  return (
    <div className="relative h-full w-full">
      <WorkflowCanvas />

      {/* Load Sample overlay — only shown when canvas is empty */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={cn(
              "pointer-events-auto flex flex-col items-center gap-4 px-8 py-7",
              "bg-[#12121c]/90 border border-[#2a2a40] rounded-2xl shadow-2xl backdrop-blur-sm",
              "max-w-xs text-center"
            )}
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/20 flex items-center justify-center">
              <Sparkles size={22} className="text-violet-400" />
            </div>

            {/* Text */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">
                Start from scratch or load a sample
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Drag nodes from the left panel, or load the{" "}
                <span className="text-violet-400 font-medium">
                  Product Marketing Kit
                </span>{" "}
                sample workflow to see everything in action.
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={handleLoadSample}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white text-xs font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-opacity"
            >
              <Sparkles size={13} />
              Load Sample Workflow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
