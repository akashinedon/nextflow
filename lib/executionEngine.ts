/**
 * Parallel DAG execution engine.
 *
 * Strategy:
 * - Topologically sort nodes (Kahn's algorithm)
 * - For each node, create a Promise that:
 *     1. Awaits all upstream dependency Promises
 *     2. Executes the node (via nodeExecutor)
 *     3. Resolves with the node's outputs
 * - Root nodes (no deps) start immediately in parallel
 * - Downstream nodes start as soon as ALL their dependencies resolve
 * - This gives true branch-level parallelism, not just level-by-level
 *
 * On partial failure: failed nodes resolve with {} outputs and the
 * failure error is captured. Downstream nodes may fail too (missing inputs)
 * but independent branches continue.
 */

import {
  topologicalSort,
  buildDependencyMap,
  buildHandleRouting,
} from "@/lib/dag";
import { executeNode, type NodeOutputsMap } from "@/lib/nodeExecutor";
import { prisma } from "@/lib/prisma";
import type { WorkflowNode, WorkflowEdge } from "@/types/workflow";

type WorkflowRunStatus = "RUNNING" | "SUCCESS" | "FAILED" | "PARTIAL";

export type ExecutionEventType =
  | "run_started"
  | "node_started"
  | "node_completed"
  | "node_failed"
  | "run_completed"
  | "run_failed";

export interface ExecutionEvent {
  type: ExecutionEventType;
  workflowRunId: string;
  nodeId?: string;
  nodeName?: string;
  outputs?: Record<string, unknown>;
  error?: string;
  timestamp: number;
}

export type OnEventCallback = (event: ExecutionEvent) => void;

interface RunOptions {
  workflowRunId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  userId: string;
  onEvent: OnEventCallback;
}

/**
 * Run the workflow with parallel DAG execution.
 * Returns when all node promises settle (success or failure).
 */
export async function runWorkflowExecution({
  workflowRunId,
  nodes,
  edges,
  userId,
  onEvent,
}: RunOptions): Promise<void> {
  const emit = (event: Omit<ExecutionEvent, "workflowRunId" | "timestamp">) =>
    onEvent({ ...event, workflowRunId, timestamp: Date.now() });

  if (nodes.length === 0) {
    emit({ type: "run_failed", error: "No nodes in workflow" });
    return;
  }

  // ── 1. Topological sort ────────────────────────────────────────────────
  const nodeIds = nodes.map((n) => n.id);
  const topoOrder = topologicalSort(nodeIds, edges);

  if (!topoOrder) {
    emit({ type: "run_failed", error: "Workflow contains a circular dependency" });
    return;
  }

  // ── 2. Build dependency and handle routing maps ────────────────────────
  const depMap = buildDependencyMap(nodeIds, edges);
  const handleRouting = buildHandleRouting(edges);

  // Shared output registry — each node writes its outputs here on completion
  const nodeOutputs: NodeOutputsMap = new Map();

  // ── 3. Create a Promise per node ────────────────────────────────────────
  const nodePromises = new Map<string, Promise<Record<string, unknown>>>();

  for (const nodeId of topoOrder) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    const deps = depMap.get(nodeId) ?? [];
    const routes = handleRouting.get(nodeId) ?? new Map();
    const nodeName = String((node.data as Record<string, unknown>)["label"] ?? node.type ?? nodeId);

    // Create a promise that waits for all deps then executes this node
    const nodePromise: Promise<Record<string, unknown>> = Promise.all(
      deps.map((depId) => nodePromises.get(depId) ?? Promise.resolve({}))
    ).then(async () => {
      // Signal start
      emit({ type: "node_started", nodeId, nodeName });

      // Upsert NodeRun record
      try {
        await prisma.nodeRun.upsert({
          where: { workflowRunId_nodeId: { workflowRunId, nodeId } },
          create: {
            workflowRunId,
            nodeId,
            nodeType: String(node.type ?? "unknown"),
            status: "RUNNING",
            startedAt: new Date(),
          },
          update: { status: "RUNNING", startedAt: new Date() },
        });
      } catch {
        // Non-fatal — continue execution even if DB write fails
      }

      try {
        const outputs = await executeNode(node, routes, nodeOutputs);
        nodeOutputs.set(nodeId, outputs);

        emit({ type: "node_completed", nodeId, nodeName, outputs });

        // Update NodeRun success
        try {
          await prisma.nodeRun.update({
            where: { workflowRunId_nodeId: { workflowRunId, nodeId } },
            data: {
              status: "SUCCESS",
              completedAt: new Date(),
              outputs: outputs as Record<string, never>,
            },
          });
        } catch {
          // Non-fatal
        }

        return outputs;
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);

        emit({ type: "node_failed", nodeId, nodeName, error });

        // Update NodeRun failure
        try {
          await prisma.nodeRun.update({
            where: { workflowRunId_nodeId: { workflowRunId, nodeId } },
            data: {
              status: "FAILED",
              completedAt: new Date(),
              error,
            },
          });
        } catch {
          // Non-fatal
        }

        return {}; // resolve empty so downstream can still try
      }
    });

    nodePromises.set(nodeId, nodePromise);
  }

  // ── 4. Wait for everything ─────────────────────────────────────────────
  const results = await Promise.allSettled([...nodePromises.values()]);

  const anyFailed = results.some((r) => r.status === "rejected");

  // ── 5. Finalize WorkflowRun ────────────────────────────────────────────
  const finalStatus: WorkflowRunStatus = anyFailed ? "FAILED" : "SUCCESS";

  try {
    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: {
        status: finalStatus,
        completedAt: new Date(),
      },
    });
  } catch {
    // Non-fatal
  }

  emit({ type: anyFailed ? "run_failed" : "run_completed" });
}
