import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { runWorkflowExecution, type ExecutionEvent } from "@/lib/executionEngine";
import { nodeArraySchema, edgeArraySchema } from "@/lib/schemas";
import { z } from "zod";
import { randomUUID } from "node:crypto";

export const maxDuration = 300;

const scopeSchema = z.enum(["full", "partial", "single"]).default("full");

/**
 * POST /api/execute
 * Body: {
 *   workflowId: string,
 *   nodes: WorkflowNode[],
 *   edges: WorkflowEdge[],
 *   scope?: "full" | "partial" | "single",
 *   nodeIds?: string[]   // required when scope is "partial" | "single"
 * }
 *
 * Returns Server-Sent Events stream with ExecutionEvent objects.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = body as Record<string, unknown>;
  const workflowId =
    typeof parsed["workflowId"] === "string" ? parsed["workflowId"] : "unsaved";

  // Parse scope + nodeIds
  const scopeResult = scopeSchema.safeParse(parsed["scope"]);
  const scope = scopeResult.success ? scopeResult.data : "full";

  const requestedNodeIds =
    Array.isArray(parsed["nodeIds"]) &&
    parsed["nodeIds"].every((id) => typeof id === "string")
      ? (parsed["nodeIds"] as string[])
      : undefined;

  // Validate nodes + edges
  const nodesResult = nodeArraySchema.safeParse(parsed["nodes"]);
  const edgesResult = edgeArraySchema.safeParse(parsed["edges"] ?? []);

  if (!nodesResult.success || !edgesResult.success) {
    return NextResponse.json(
      {
        error: "Invalid workflow data",
        nodeIssues: nodesResult.error?.issues,
        edgeIssues: edgesResult.error?.issues,
      },
      { status: 422 }
    );
  }

  // For partial/single scope: filter nodes and relevant edges
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let nodesToRun: any[] = nodesResult.data as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let edgesToRun: any[] = edgesResult.data as any[];

  if ((scope === "partial" || scope === "single") && requestedNodeIds?.length) {
    // Only run the specified nodes and edges between them
    const idSet = new Set(requestedNodeIds);
    nodesToRun = nodesToRun.filter((n: { id: string }) => idSet.has(n.id));
    edgesToRun = edgesToRun.filter(
      (e: { source: string; target: string }) =>
        idSet.has(e.source) && idSet.has(e.target)
    );
  }

  const scopeLabel =
    scope === "single"
      ? "SINGLE"
      : scope === "partial"
      ? "PARTIAL"
      : "FULL";

  // Only attach workflowId if it exists for this user.
  // New canvases use client-generated IDs until first save.
  let persistedWorkflowId: string | null = null;
  if (workflowId !== "unsaved") {
    try {
      const existingWorkflow = await prisma.workflow.findFirst({
        where: { id: workflowId, userId },
        select: { id: true },
      });
      persistedWorkflowId = existingWorkflow?.id ?? null;
    } catch {
      // Non-fatal: continue execution without attaching persisted workflow ID
      persistedWorkflowId = null;
    }
  }

  // Create WorkflowRun record
  let workflowRunId: string;
  try {
    const workflowRun = await prisma.workflowRun.create({
      data: {
        workflowId: persistedWorkflowId,
        userId,
        status: "RUNNING",
        startedAt: new Date(),
        nodeCount: nodesToRun.length,
        scope: scopeLabel as "FULL" | "PARTIAL" | "SINGLE",
        nodeIds: requestedNodeIds ?? [],
      },
    });
    workflowRunId = workflowRun.id;
  } catch {
    // If DB is unavailable/misconfigured, still allow execution to proceed.
    // Node/run persistence will be skipped by downstream non-fatal DB writes.
    workflowRunId = `ephemeral_${randomUUID()}`;
  }

  // SSE stream
  const encoder = new TextEncoder();
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller;
    },
    cancel() {
      streamController = null;
    },
  });

  function sendEvent(event: ExecutionEvent) {
    if (!streamController) return;
    try {
      streamController.enqueue(
        encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
      );
    } catch {
      // Client disconnected
    }
  }

  // Send initial event
  sendEvent({ type: "run_started", workflowRunId, timestamp: Date.now() });

  // Run execution (non-blocking — writes to SSE stream)
  runWorkflowExecution({
    workflowRunId,
    nodes: nodesToRun,
    edges: edgesToRun,
    userId,
    onEvent: sendEvent,
  })
    .catch((err) => {
      const error = err instanceof Error ? err.message : String(err);
      sendEvent({ type: "run_failed", workflowRunId, error, timestamp: Date.now() });
    })
    .finally(() => {
      if (streamController) {
        try {
          streamController.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "stream_end", workflowRunId })}\n\n`
            )
          );
          streamController.close();
        } catch {
          /* already closed */
        }
      }
    });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
