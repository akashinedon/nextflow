import { z } from "zod";

// ─── Handle / Node schemas ────────────────────────────────────────────────────

export const handleDataTypeSchema = z.enum([
  "text",
  "image",
  "video",
  "number",
  "any",
]);

export const nodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// ─── Per-node data schemas ────────────────────────────────────────────────────

export const textNodeDataSchema = z.object({
  text: z.string(),
});

export const uploadImageNodeDataSchema = z.object({
  imageUrl: z.string().url().nullable(),
  uploadProgress: z.number().min(0).max(100),
  fileName: z.string().nullable(),
});

export const uploadVideoNodeDataSchema = z.object({
  videoUrl: z.string().url().nullable(),
  uploadProgress: z.number().min(0).max(100),
  fileName: z.string().nullable(),
});

export const geminiModelSchema = z.enum([
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
]);

export const runLLMNodeDataSchema = z.object({
  model: geminiModelSchema,
  systemPrompt: z.string(),
  userMessage: z.string(),
  systemPromptConnected: z.boolean(),
  userMessageConnected: z.boolean(),
  imagesConnected: z.boolean(),
  result: z.string().nullable(),
});

export const cropImageNodeDataSchema = z.object({
  imageUrlConnected: z.boolean(),
  xPercent: z.number().min(0).max(100),
  yPercent: z.number().min(0).max(100),
  widthPercent: z.number().min(0).max(100),
  heightPercent: z.number().min(0).max(100),
  xPercentConnected: z.boolean(),
  yPercentConnected: z.boolean(),
  widthPercentConnected: z.boolean(),
  heightPercentConnected: z.boolean(),
  outputUrl: z.string().url().nullable(),
});

export const extractFrameNodeDataSchema = z.object({
  videoUrlConnected: z.boolean(),
  timestamp: z.string(),
  timestampConnected: z.boolean(),
  outputUrl: z.string().url().nullable(),
});

// ─── Workflow node schema (generic) ──────────────────────────────────────────

export const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    "textNode",
    "uploadImageNode",
    "uploadVideoNode",
    "runLLMNode",
    "cropImageNode",
    "extractFrameNode",
  ]),
  position: nodePositionSchema,
  data: z.record(z.string(), z.unknown()),
});

export const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().nullable(),
  targetHandle: z.string().nullable(),
  data: z
    .object({
      dataType: handleDataTypeSchema,
    })
    .optional(),
});

// ─── API request schemas ──────────────────────────────────────────────────────

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(100).default("Untitled Workflow"),
  description: z.string().max(500).optional(),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  nodes: z.array(workflowNodeSchema).optional(),
  edges: z.array(workflowEdgeSchema).optional(),
});

export const llmRequestSchema = z.object({
  model: geminiModelSchema,
  systemPrompt: z.string().optional(),
  userMessage: z.string().min(1),
  imageUrls: z.array(z.string().url()).optional(),
});

export const cropImageRequestSchema = z.object({
  imageUrl: z.string().url(),
  xPercent: z.number().min(0).max(100),
  yPercent: z.number().min(0).max(100),
  widthPercent: z.number().min(0).max(100),
  heightPercent: z.number().min(0).max(100),
});

export const extractFrameRequestSchema = z.object({
  videoUrl: z.string().url(),
  timestamp: z.string(),
});

// ─── Inferred types ──────────────────────────────────────────────────────────

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
export type LLMRequestInput = z.infer<typeof llmRequestSchema>;
export type CropImageRequestInput = z.infer<typeof cropImageRequestSchema>;
export type ExtractFrameRequestInput = z.infer<typeof extractFrameRequestSchema>;

// ─── Array schemas (for execute endpoint) ────────────────────────────────────

export const nodeArraySchema = z.array(workflowNodeSchema);
export const edgeArraySchema = z.array(workflowEdgeSchema);

