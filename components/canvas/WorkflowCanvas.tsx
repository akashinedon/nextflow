"use client";

import { useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  type NodeTypes,
  type EdgeTypes,
  type Connection,
  type Edge,
  useReactFlow,
} from "@xyflow/react";
import { useWorkflowStore } from "@/store/workflowStore";
import { useWorkflowHistory } from "@/store/workflowStore";
import { isConnectionValid } from "@/lib/connectionValidation";
import { wouldCreateCycle } from "@/lib/dag";
import type { WorkflowNode, NodeType } from "@/types/workflow";
import { NODE_DEFINITIONS } from "@/lib/nodeDefinitions";

// Node components
import TextNode from "@/components/canvas/nodes/TextNode";
import UploadImageNode from "@/components/canvas/nodes/UploadImageNode";
import UploadVideoNode from "@/components/canvas/nodes/UploadVideoNode";
import RunLLMNode from "@/components/canvas/nodes/RunLLMNode";
import CropImageNode from "@/components/canvas/nodes/CropImageNode";
import ExtractFrameNode from "@/components/canvas/nodes/ExtractFrameNode";

// Edge components
import AnimatedEdge from "@/components/canvas/edges/AnimatedEdge";
import CanvasControls from "@/components/canvas/CanvasControls";
import ContextMenu from "@/components/canvas/ContextMenu";
import Toast from "@/components/canvas/Toast";

const NODE_TYPES: NodeTypes = {
  textNode: TextNode as NodeTypes[string],
  uploadImageNode: UploadImageNode as NodeTypes[string],
  uploadVideoNode: UploadVideoNode as NodeTypes[string],
  runLLMNode: RunLLMNode as NodeTypes[string],
  cropImageNode: CropImageNode as NodeTypes[string],
  extractFrameNode: ExtractFrameNode as NodeTypes[string],
};

const EDGE_TYPES: EdgeTypes = {
  animatedEdge: AnimatedEdge as EdgeTypes[string],
};

export default function WorkflowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    showToast,
    toastMessage,
    clearToast,
  } = useWorkflowStore();

  const { undo, redo } = useWorkflowHistory();
  const { screenToFlowPosition } = useReactFlow();
  const _connectingNodeId = useRef<string | null>(null);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Shift+Z / Ctrl+Y
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // ─── Connection validation ────────────────────────────────────────────────

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const conn = connection as Connection;
      // Type check
      if (!isConnectionValid(conn, nodes)) {
        showToast("error", "Incompatible types — connection rejected");
        return false;
      }
      // DAG cycle check
      if (
        conn.source &&
        conn.target &&
        wouldCreateCycle(edges, conn.source, conn.target)
      ) {
        showToast("error", "Circular connections are not allowed");
        return false;
      }
      return true;
    },
    [nodes, edges, showToast]
  );

  // ─── Drag-from-sidebar drop ───────────────────────────────────────────────

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData(
        "application/nextflow-node-type"
      ) as NodeType;

      if (!nodeType) return;

      const def = NODE_DEFINITIONS.find((d) => d.type === nodeType);
      if (!def) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      // Use type assertion to handle the discriminated union
      const newNode = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: { ...def.defaultData },
      } as WorkflowNode;

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        defaultEdgeOptions={{
          type: "animatedEdge",
          animated: true,
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        deleteKeyCode={["Delete", "Backspace"]}
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.15}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        panOnScroll
        zoomOnScroll
        zoomOnPinch
      >
        {/* Dark dot-grid background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="#1f1f35"
          style={{ backgroundColor: "#0a0a0f" }}
        />

        {/* MiniMap */}
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={(node) => {
            const colorMap: Record<string, string> = {
              textNode: "#60a5fa",
              uploadImageNode: "#34d399",
              uploadVideoNode: "#f59e0b",
              runLLMNode: "#8b5cf6",
              cropImageNode: "#34d399",
              extractFrameNode: "#f59e0b",
            };
            return colorMap[node.type ?? ""] ?? "#4b5563";
          }}
          maskColor="rgba(7, 7, 15, 0.7)"
          style={{
            backgroundColor: "#12121c",
            border: "1px solid #2a2a40",
            borderRadius: "8px",
            bottom: 16,
            right: 16,
          }}
        />

        {/* Custom canvas controls panel */}
        <Panel position="bottom-center">
          <CanvasControls />
        </Panel>

        {/* Empty state */}
        {nodes.length === 0 && (
          <Panel position="top-center">
            <div className="mt-32 flex flex-col items-center text-center pointer-events-none select-none">
              <div className="w-16 h-16 rounded-2xl bg-[#12121c] border border-[#2a2a40] flex items-center justify-center mb-4">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-slate-700"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-slate-500 text-sm font-medium">
                Drag nodes from the sidebar or click them to add
              </p>
              <p className="text-slate-700 text-xs mt-1">
                Connect nodes to build your AI workflow
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Context menu (right-click on nodes) */}
      <ContextMenu />

      {/* Toast notifications */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onDismiss={clearToast}
        />
      )}
    </div>
  );
}
