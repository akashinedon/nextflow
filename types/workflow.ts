import { type Node, type Edge } from "@xyflow/react";

// ─── Node Handle Types ────────────────────────────────────────────────────────

export type HandleDataType = "text" | "image" | "video" | "number" | "any";

export interface HandleDef {
  id: string;
  label: string;
  dataType: HandleDataType;
  required?: boolean;
}

// ─── Node Types ───────────────────────────────────────────────────────────────

export type NodeType =
  | "textNode"
  | "uploadImageNode"
  | "uploadVideoNode"
  | "runLLMNode"
  | "cropImageNode"
  | "extractFrameNode";

export type NodeExecutionStatus =
  | "idle"
  | "running"
  | "success"
  | "failed"
  | "skipped";

// ─── Per-node data shapes ─────────────────────────────────────────────────────

export interface TextNodeData extends Record<string, unknown> {
  text: string;
}

export interface UploadImageNodeData extends Record<string, unknown> {
  imageUrl: string | null;
  uploadProgress: number;
  fileName: string | null;
}

export interface UploadVideoNodeData extends Record<string, unknown> {
  videoUrl: string | null;
  uploadProgress: number;
  fileName: string | null;
}

export type GeminiModel =
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite"
  | "gemini-1.5-pro"
  | "gemini-1.5-flash"
  | "gemini-1.5-flash-8b";

export interface RunLLMNodeData extends Record<string, unknown> {
  model: GeminiModel;
  systemPrompt: string;
  userMessage: string;
  systemPromptConnected: boolean;
  userMessageConnected: boolean;
  imagesConnected: boolean;
  result: string | null;
}

export interface CropImageNodeData extends Record<string, unknown> {
  imageUrlConnected: boolean;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  xPercentConnected: boolean;
  yPercentConnected: boolean;
  widthPercentConnected: boolean;
  heightPercentConnected: boolean;
  outputUrl: string | null;
}

export interface ExtractFrameNodeData extends Record<string, unknown> {
  videoUrlConnected: boolean;
  timestamp: string;
  timestampConnected: boolean;
  outputUrl: string | null;
}

// ─── Discriminated union for all node types ───────────────────────────────────

export type TextWorkflowNode = Node<TextNodeData, "textNode">;
export type UploadImageWorkflowNode = Node<UploadImageNodeData, "uploadImageNode">;
export type UploadVideoWorkflowNode = Node<UploadVideoNodeData, "uploadVideoNode">;
export type RunLLMWorkflowNode = Node<RunLLMNodeData, "runLLMNode">;
export type CropImageWorkflowNode = Node<CropImageNodeData, "cropImageNode">;
export type ExtractFrameWorkflowNode = Node<ExtractFrameNodeData, "extractFrameNode">;

export type WorkflowNode =
  | TextWorkflowNode
  | UploadImageWorkflowNode
  | UploadVideoWorkflowNode
  | RunLLMWorkflowNode
  | CropImageWorkflowNode
  | ExtractFrameWorkflowNode;

// ─── Edge types ───────────────────────────────────────────────────────────────

export interface WorkflowEdgeData extends Record<string, unknown> {
  dataType: HandleDataType;
}

export type WorkflowEdge = Edge<WorkflowEdgeData>;

// ─── Node execution state ─────────────────────────────────────────────────────

export interface NodeExecutionState {
  nodeId: string;
  status: NodeExecutionStatus;
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
  outputs: Record<string, unknown>;
}

// ─── Run config ───────────────────────────────────────────────────────────────

export type WorkflowRunScope = "full" | "partial" | "single";

export interface WorkflowRunConfig {
  scope: WorkflowRunScope;
  nodeIds?: string[];
}

// ─── Sidebar node definitions (for Quick Access) ─────────────────────────────

export interface NodeDefinition {
  type: NodeType;
  label: string;
  description: string;
  icon: string;
  defaultData: WorkflowNode["data"];
  outputs: HandleDef[];
  inputs: HandleDef[];
}

// ─── Workflow metadata ────────────────────────────────────────────────────────

export interface WorkflowMeta {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
