import type { Connection } from "@xyflow/react";
import type { HandleDataType, WorkflowNode } from "@/types/workflow";

/**
 * Compatibility matrix: source type → allowed target types.
 * "any" is compatible with everything.
 */
const COMPATIBILITY: Record<HandleDataType, HandleDataType[]> = {
  text: ["text", "any"],
  image: ["image", "any"],
  video: ["video", "any"],
  number: ["number", "any"],
  any: ["text", "image", "video", "number", "any"],
};

/**
 * Map of node type + handle id → its data type.
 * Used to look up what type a specific handle produces/consumes.
 */
const HANDLE_TYPES: Record<string, Record<string, HandleDataType>> = {
  textNode: {
    "output-text": "text",
  },
  uploadImageNode: {
    "output-image_url": "image",
  },
  uploadVideoNode: {
    "output-video_url": "video",
  },
  runLLMNode: {
    "input-system_prompt": "text",
    "input-user_message": "text",
    "input-images": "image",
    "output-output": "text",
  },
  cropImageNode: {
    "input-image_url": "image",
    "input-x_percent": "number",
    "input-y_percent": "number",
    "input-width_percent": "number",
    "input-height_percent": "number",
    "output-output": "image",
  },
  extractFrameNode: {
    "input-video_url": "video",
    "input-timestamp": "text",
    "output-output": "image",
  },
};

/**
 * Get the data type for a specific handle on a node.
 */
export function getHandleDataType(
  nodeType: string,
  handleId: string
): HandleDataType {
  return HANDLE_TYPES[nodeType]?.[handleId] ?? "any";
}

/**
 * Check if a connection is type-compatible.
 * Returns true if the connection is valid.
 */
export function isConnectionValid(
  connection: Connection,
  nodes: WorkflowNode[]
): boolean {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  if (!sourceNode || !targetNode) return false;
  if (!connection.sourceHandle || !connection.targetHandle) return false;

  const sourceType = getHandleDataType(
    sourceNode.type ?? "",
    connection.sourceHandle
  );
  const targetType = getHandleDataType(
    targetNode.type ?? "",
    connection.targetHandle
  );

  const allowed = COMPATIBILITY[sourceType] ?? [];
  return allowed.includes(targetType);
}

/**
 * Get a human-readable rejection message for an invalid connection.
 */
export function getConnectionRejectionMessage(
  sourceType: HandleDataType,
  targetType: HandleDataType
): string {
  return `Cannot connect ${sourceType} output to ${targetType} input`;
}
