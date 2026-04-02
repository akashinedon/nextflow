import { create } from "zustand";
import { temporal } from "zundo";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import type {
  WorkflowNode,
  WorkflowEdge,
  NodeExecutionState,
  NodeExecutionStatus,
} from "@/types/workflow";
import { wouldCreateCycle } from "@/lib/dag";
import { isConnectionValid } from "@/lib/connectionValidation";
import type { ExecutionEvent } from "@/lib/executionEngine";

export type RunScope = "full" | "partial" | "single";

export interface WorkflowState {
  // Canvas state
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];

  // Selected nodes (for partial run)
  selectedNodeIds: string[];

  // Workflow metadata
  workflowId: string | null;
  workflowName: string;
  isSaving: boolean;
  isRunning: boolean;
  lastRunId: string | null;

  // Per-node execution state
  executionStates: Record<string, NodeExecutionState>;

  // Toast messages
  toastMessage: { type: "error" | "info" | "success"; text: string } | null;

  // ─── React Flow handlers ────────────────────────────────────────────────
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: Connection) => void;

  // ─── Node operations ────────────────────────────────────────────────────
  addNode: (node: WorkflowNode) => void;
  updateNodeData: <T extends WorkflowNode>(
    nodeId: string,
    updater: (data: T["data"]) => T["data"]
  ) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;

  // ─── Execution state ────────────────────────────────────────────────────
  setNodeExecutionStatus: (
    nodeId: string,
    status: NodeExecutionStatus,
    outputs?: Record<string, unknown>,
    errorMsg?: string
  ) => void;
  clearExecutionStates: () => void;

  // ─── Workflow run actions ────────────────────────────────────────────────
  runWorkflow: (scope?: RunScope, nodeIds?: string[]) => Promise<void>;
  runSelectedNodes: () => Promise<void>;
  runSingleNode: (nodeId: string) => Promise<void>;
  saveWorkflow: () => Promise<string | null>;
  exportWorkflow: () => void;
  importWorkflow: (file: File) => Promise<void>;

  // ─── Metadata operations ────────────────────────────────────────────────
  setWorkflowName: (name: string) => void;
  setWorkflowId: (id: string) => void;
  setIsSaving: (isSaving: boolean) => void;
  setIsRunning: (running: boolean) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  showToast: (type: "error" | "info" | "success", text: string) => void;
  clearToast: () => void;

  // ─── Bulk load ────────────────────────────────────────────────────────────
  loadWorkflow: (
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    name: string,
    id: string
  ) => void;
}

// Slice tracked by undo/redo
type TemporalState = Pick<WorkflowState, "nodes" | "edges">;

/** Shared SSE stream consumer — opens /api/execute and processes events */
async function consumeExecutionStream(
  payload: {
    workflowId: string | null;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    scope: RunScope;
    nodeIds?: string[];
  },
  get: () => WorkflowState,
  set: (partial: Partial<WorkflowState> | ((s: WorkflowState) => Partial<WorkflowState>)) => void
): Promise<void> {
  try {
    const response = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflowId: payload.workflowId ?? "unsaved",
        nodes: payload.nodes,
        edges: payload.edges,
        scope: payload.scope,
        nodeIds: payload.nodeIds,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Failed to start workflow (HTTP ${response.status})`;
      try {
        const err = (await response.json()) as { error?: string; detail?: string };
        if (typeof err.error === "string" && err.error.length > 0) {
          errorMessage = err.error;
          if (typeof err.detail === "string" && err.detail.length > 0) {
            errorMessage = `${errorMessage}: ${err.detail}`;
          }
        } else if (typeof err.detail === "string" && err.detail.length > 0) {
          errorMessage = err.detail;
        }
      } catch {
        try {
          const text = await response.text();
          if (text.trim().length > 0) {
            errorMessage = `${errorMessage}: ${text.slice(0, 160)}`;
          }
        } catch {
          // Ignore secondary parse errors
        }
      }
      get().showToast("error", errorMessage);
      set({ isRunning: false });
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      set({ isRunning: false });
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const dataLine = part.split("\n").find((l) => l.startsWith("data: "));
        if (!dataLine) continue;

        try {
          const raw = JSON.parse(dataLine.slice(6)) as ExecutionEvent & {
            type: string;
          };

          switch (raw.type) {
            case "run_started":
              set({ lastRunId: raw.workflowRunId });
              break;

            case "node_started":
              if (raw.nodeId) {
                get().setNodeExecutionStatus(raw.nodeId, "running");
              }
              break;

            case "node_completed":
              if (raw.nodeId) {
                get().setNodeExecutionStatus(raw.nodeId, "success", raw.outputs);
                if (raw.outputs) {
                  const outputValue = raw.outputs["output-output"];
                  if (typeof outputValue === "string") {
                    get().updateNodeData(raw.nodeId, (data) => ({
                      ...data,
                      result: outputValue,
                      outputUrl: outputValue,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    }) as any);
                  }
                }
              }
              break;

            case "node_failed":
              if (raw.nodeId) {
                get().setNodeExecutionStatus(raw.nodeId, "failed", {}, raw.error);
                get().showToast("error", `Node failed: ${raw.error ?? "unknown"}`);
              }
              break;

            case "run_completed":
              get().showToast("success", "Workflow completed successfully ✓");
              set({ isRunning: false });
              break;

            case "run_failed":
              get().showToast("error", `Run failed: ${raw.error ?? "unknown"}`);
              set({ isRunning: false });
              break;
          }
        } catch {
          // Ignore parse errors for individual SSE events
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    get().showToast("error", `Execution error: ${msg}`);
  } finally {
    set({ isRunning: false });
  }
}

export const useWorkflowStore = create<WorkflowState>()(
  temporal(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      workflowId: null,
      workflowName: "Untitled Workflow",
      isSaving: false,
      isRunning: false,
      lastRunId: null,
      executionStates: {},
      toastMessage: null,

      // ─── React Flow handlers ─────────────────────────────────────────────
      onNodesChange: (changes) => {
        // Track selections
        const selectionChanges = changes.filter(
          (c) => c.type === "select"
        ) as Array<{ type: "select"; id: string; selected: boolean }>;

        set((state) => {
          const newNodes = applyNodeChanges(changes, state.nodes) as WorkflowNode[];
          // Rebuild selectedNodeIds from current node.selected flags
          const selectedIds = newNodes
            .filter((n) => n.selected)
            .map((n) => n.id);
          return {
            nodes: newNodes,
            selectedNodeIds: selectionChanges.length > 0 ? selectedIds : state.selectedNodeIds,
          };
        });
      },

      onEdgesChange: (changes) =>
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges) as WorkflowEdge[],
        })),

      onConnect: (connection) => {
        const { nodes, edges } = get();
        if (!isConnectionValid(connection, nodes)) {
          get().showToast("error", "Incompatible handle types — cannot connect");
          return;
        }
        if (wouldCreateCycle(edges, connection.source, connection.target)) {
          get().showToast("error", "Circular connections are not allowed");
          return;
        }
        const dataType =
          connection.sourceHandle?.startsWith("output-image")
            ? "image"
            : connection.sourceHandle?.startsWith("output-video")
            ? "video"
            : "text";
        set((state) => ({
          edges: addEdge(
            {
              ...connection,
              animated: true,
              type: "animatedEdge",
              data: { dataType },
            },
            state.edges
          ) as WorkflowEdge[],
        }));
      },

      // ─── Node operations ──────────────────────────────────────────────────
      addNode: (node) =>
        set((state) => ({ nodes: [...state.nodes, node] })),

      updateNodeData: (nodeId, updater) =>
        set((state) => ({
          nodes: state.nodes.map((n) => {
            if (n.id !== nodeId) return n;
            const newData = (updater as (d: unknown) => unknown)(n.data);
            return { ...n, data: newData as typeof n.data };
          }) as WorkflowNode[],
        })),

      deleteNode: (nodeId) =>
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          edges: state.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          ),
          selectedNodeIds: state.selectedNodeIds.filter((id) => id !== nodeId),
        })),

      deleteEdge: (edgeId) =>
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== edgeId),
        })),

      // ─── Execution state ──────────────────────────────────────────────────
      setNodeExecutionStatus: (nodeId, status, outputs = {}, errorMsg) =>
        set((state) => ({
          executionStates: {
            ...state.executionStates,
            [nodeId]: {
              nodeId,
              status,
              startedAt:
                status === "running"
                  ? Date.now()
                  : (state.executionStates[nodeId]?.startedAt ?? null),
              completedAt:
                status === "success" || status === "failed"
                  ? Date.now()
                  : null,
              error: errorMsg ?? null,
              outputs,
            },
          },
        })),

      clearExecutionStates: () => set({ executionStates: {} }),

      // ─── Run actions ──────────────────────────────────────────────────────
      runWorkflow: async (scope = "full", nodeIds) => {
        const { nodes, edges, workflowId, isRunning } = get();
        if (isRunning) return;
        if (nodes.length === 0) {
          get().showToast("info", "Add some nodes to run the workflow");
          return;
        }
        set({ isRunning: true });
        get().clearExecutionStates();
        await consumeExecutionStream(
          { workflowId, nodes, edges, scope, nodeIds },
          get,
          set
        );
      },

      runSelectedNodes: async () => {
        const { selectedNodeIds, isRunning } = get();
        if (isRunning) return;
        if (selectedNodeIds.length === 0) {
          get().showToast("info", "Select one or more nodes first (click or Shift+click)");
          return;
        }
        await get().runWorkflow("partial", selectedNodeIds);
      },

      runSingleNode: async (nodeId: string) => {
        if (get().isRunning) return;
        await get().runWorkflow("single", [nodeId]);
      },

      // ─── Save workflow ────────────────────────────────────────────────────
      saveWorkflow: async () => {
        const { nodes, edges, workflowId, workflowName } = get();
        set({ isSaving: true });
        try {
          const response = await fetch("/api/workflows", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workflowId: workflowId ?? undefined,
              name: workflowName,
              nodes,
              edges,
            }),
          });

          if (!response.ok) {
            get().showToast("error", "Failed to save workflow");
            return null;
          }

          const data = (await response.json()) as { workflow: { id: string } };
          const savedId = data.workflow.id;
          set({ workflowId: savedId });
          get().showToast("success", "Workflow saved ✓");
          return savedId;
        } catch {
          get().showToast("error", "Failed to save workflow");
          return null;
        } finally {
          set({ isSaving: false });
        }
      },

      // ─── Export JSON ──────────────────────────────────────────────────────
      exportWorkflow: () => {
        const { nodes, edges, workflowName } = get();
        const payload = { name: workflowName, nodes, edges, version: 1 };
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${workflowName.replace(/\s+/g, "_")}.json`;
        a.click();
        URL.revokeObjectURL(url);
        get().showToast("success", "Workflow exported as JSON");
      },

      // ─── Import JSON ──────────────────────────────────────────────────────
      importWorkflow: async (file: File) => {
        try {
          const text = await file.text();
          const data = JSON.parse(text) as {
            name?: string;
            nodes?: WorkflowNode[];
            edges?: WorkflowEdge[];
          };

          if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
            get().showToast("error", "Invalid workflow JSON — missing nodes or edges");
            return;
          }

          set({
            nodes: data.nodes,
            edges: data.edges,
            workflowName: data.name ?? "Imported Workflow",
            workflowId: null, // treat as new workflow
            executionStates: {},
          });
          get().showToast("success", `Imported "${data.name ?? "workflow"}"`);
        } catch {
          get().showToast("error", "Failed to parse JSON file");
        }
      },

      // ─── Metadata ─────────────────────────────────────────────────────────
      setWorkflowName: (name) => set({ workflowName: name }),
      setWorkflowId: (id) => set({ workflowId: id }),
      setIsSaving: (isSaving) => set({ isSaving }),
      setIsRunning: (running) => set({ isRunning: running }),
      setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
      showToast: (type, text) => set({ toastMessage: { type, text } }),
      clearToast: () => set({ toastMessage: null }),

      loadWorkflow: (nodes, edges, name, id) =>
        set({
          nodes,
          edges,
          workflowName: name,
          workflowId: id,
          executionStates: {},
          selectedNodeIds: [],
        }),
    }),
    {
      partialize: (state): TemporalState => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
      limit: 50,
    }
  )
);

export const useWorkflowHistory = () => useWorkflowStore.temporal.getState();
