/**
 * Per-node execution logic.
 * Maps each node type to its Trigger.dev task call.
 * Extracts resolved inputs from upstream outputs via handle routing.
 */

import type { WorkflowNode } from "@/types/workflow";
import type { HandleRoute } from "@/lib/dag";
import type { LLMTaskPayload, LLMTaskOutput } from "@/trigger/llmTask";
import type { CropImagePayload, CropImageOutput } from "@/trigger/cropImageTask";
import type { ExtractFramePayload, ExtractFrameOutput } from "@/trigger/extractFrameTask";

/** Resolved handle outputs from all previously executed nodes */
export type NodeOutputsMap = Map<string, Record<string, unknown>>;

/** Result of executing a single node */
export interface NodeExecutionResult {
  outputs: Record<string, unknown>;
}

/**
 * Resolve a value for a target handle from the upstream node outputs map.
 * Falls back to the node's own static data if no edge routes to this handle.
 */
function resolveInput(
  targetHandleId: string,
  handleRoutes: Map<string, HandleRoute>,
  nodeOutputs: NodeOutputsMap,
  staticData: Record<string, unknown>
): unknown {
  const route = handleRoutes.get(targetHandleId);
  if (route) {
    const upstreamOutputs = nodeOutputs.get(route.sourceNodeId) ?? {};
    return upstreamOutputs[route.sourceHandleId];
  }
  // Fall back to node's static field name (strip "input-" prefix)
  const fieldName = targetHandleId.replace(/^input-/, "");
  return staticData[fieldName];
}

/**
 * Trigger a Trigger.dev task by ID and wait for result.
 * Uses the SDK's tasks.triggerAndWait but bypasses the strict Task generic
 * by using a type-safe wrapper with explicit payload/output types.
 */
async function triggerTask<TPayload extends object, TOutput>(
  taskId: string,
  payload: TPayload
): Promise<TOutput> {
  // Dynamic import to avoid issues when Trigger.dev is not configured
  const { tasks, runs } = await import("@trigger.dev/sdk/v3");

  console.log(`[triggerTask] Triggering task: ${taskId}`, payload);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handle;
  try {
    handle = await (tasks.trigger as any)(taskId, payload);
    console.log(`[triggerTask] Task triggered successfully. Run ID: ${handle.id}`);
  } catch (error) {
    console.error(`[triggerTask] Failed to trigger task "${taskId}":`, error);
    throw error;
  }

  // Poll for completion with 5-minute timeout
  const MAX_WAIT_TIME = 5 * 60 * 1000; // 5 minutes
  const POLL_INTERVAL = 1500; // 1.5 seconds
  const startTime = Date.now();
  let pollCount = 0;

  while (true) {
    try {
      const run = await runs.retrieve(handle.id);
      pollCount++;
      console.log(
        `[triggerTask] Poll #${pollCount}: Task ${taskId} status = ${run.status}`
      );

      if (run.status === "COMPLETED") {
        console.log(`[triggerTask] Task completed:`, run.output);
        return run.output as TOutput;
      } else if (
        run.status === "FAILED" ||
        run.status === "CANCELED" ||
        run.status === "CRASHED"
      ) {
        const errorMsg = `Task "${taskId}" failed: ${
          run.error ? JSON.stringify(run.error) : "unknown error"
        }`;
        console.error(`[triggerTask] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Check timeout
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > MAX_WAIT_TIME) {
        const timeoutMsg = `Task "${taskId}" polling timeout after ${MAX_WAIT_TIME / 1000}s (${pollCount} polls)`;
        console.error(`[triggerTask] ${timeoutMsg}`);
        throw new Error(timeoutMsg);
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    } catch (error) {
      console.error(`[triggerTask] Error polling task:`, error);
      throw error;
    }
  }
}

/**
 * Execute a single node, resolving its inputs from upstream outputs.
 * Returns the node's output map (e.g. { "output-text": "Hello world" }).
 * Throws on failure.
 */
export async function executeNode(
  node: WorkflowNode,
  handleRoutes: Map<string, HandleRoute>,
  nodeOutputs: NodeOutputsMap
): Promise<Record<string, unknown>> {
  const data = node.data as Record<string, unknown>;

  console.log(`[executeNode] Starting execution of node: ${node.id} (type: ${node.type})`);

  try {
    const result = await executeNodeInternal(node, handleRoutes, nodeOutputs);
    console.log(`[executeNode] Node ${node.id} completed successfully:`, result);
    return result;
  } catch (error) {
    console.error(`[executeNode] Node ${node.id} failed:`, error);
    throw error;
  }
}

async function executeNodeInternal(
  node: WorkflowNode,
  handleRoutes: Map<string, HandleRoute>,
  nodeOutputs: NodeOutputsMap
): Promise<Record<string, unknown>> {
  const data = node.data as Record<string, unknown>;

  switch (node.type) {
    // ── Passthrough nodes ──────────────────────────────────────────────────
    case "textNode": {
      return { "output-text": data["text"] ?? "" };
    }

    case "uploadImageNode": {
      const url = data["imageUrl"] ?? data["image_url"];
      if (!url) throw new Error("UploadImageNode has no image uploaded");
      return { "output-image_url": url };
    }

    case "uploadVideoNode": {
      const url = data["videoUrl"] ?? data["video_url"];
      if (!url) throw new Error("UploadVideoNode has no video uploaded");
      return { "output-video_url": url };
    }

    // ── LLM node ────────────────────────────────────────────────────────────
    case "runLLMNode": {
      const model = String(data["model"] ?? "gemini-2.0-flash");
      const systemPrompt = resolveInput("input-system_prompt", handleRoutes, nodeOutputs, data);
      const userMessage = resolveInput("input-user_message", handleRoutes, nodeOutputs, data);
      const imagesValue = resolveInput("input-images", handleRoutes, nodeOutputs, data);

      if (!userMessage) throw new Error("RunLLMNode: user_message is required");

      const images: string[] = [];
      if (imagesValue) {
        if (Array.isArray(imagesValue)) {
          images.push(...imagesValue.filter((v): v is string => typeof v === "string"));
        } else if (typeof imagesValue === "string") {
          images.push(imagesValue);
        }
      }

      const payload: LLMTaskPayload = {
        model,
        system_prompt: systemPrompt ? String(systemPrompt) : undefined,
        user_message: String(userMessage),
        images: images.length > 0 ? images : undefined,
      };

      const output = await triggerTask<LLMTaskPayload, LLMTaskOutput>("run-llm", payload);
      return { "output-output": output.output };
    }

    // ── Crop image node ─────────────────────────────────────────────────────
    case "cropImageNode": {
      const imageUrl = resolveInput("input-image_url", handleRoutes, nodeOutputs, data);
      if (!imageUrl) throw new Error("CropImageNode: image_url is required");

      const payload: CropImagePayload = {
        image_url: String(imageUrl),
        x_percent: Number(resolveInput("input-x_percent", handleRoutes, nodeOutputs, data) ?? data["xPercent"] ?? 0),
        y_percent: Number(resolveInput("input-y_percent", handleRoutes, nodeOutputs, data) ?? data["yPercent"] ?? 0),
        width_percent: Number(resolveInput("input-width_percent", handleRoutes, nodeOutputs, data) ?? data["widthPercent"] ?? 100),
        height_percent: Number(resolveInput("input-height_percent", handleRoutes, nodeOutputs, data) ?? data["heightPercent"] ?? 100),
      };

      const output = await triggerTask<CropImagePayload, CropImageOutput>("crop-image", payload);
      return { "output-output": output.output_url };
    }

    // ── Extract frame node ──────────────────────────────────────────────────
    case "extractFrameNode": {
      const videoUrl = resolveInput("input-video_url", handleRoutes, nodeOutputs, data);
      if (!videoUrl) throw new Error("ExtractFrameNode: video_url is required");

      const timestamp = resolveInput("input-timestamp", handleRoutes, nodeOutputs, data)
        ?? data["timestamp"]
        ?? "0";

      const payload: ExtractFramePayload = {
        video_url: String(videoUrl),
        timestamp: String(timestamp),
      };

      const output = await triggerTask<ExtractFramePayload, ExtractFrameOutput>("extract-frame", payload);
      return { "output-output": output.output_url };
    }

    default: {
      const unknownNode = node as unknown as { type: string };
      throw new Error(`Unknown node type: ${unknownNode.type}`);
    }
  }
}
