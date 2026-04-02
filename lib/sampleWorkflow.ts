/**
 * Pre-built "Product Marketing Kit Generator" sample workflow.
 *
 * Branch A: Upload Image → Crop → LLM #1 (Product Description)
 * Branch B: Upload Video → Extract Frame
 * Convergence: LLM #2 (Tweet Generator) ← LLM #1 + CropImage + ExtractFrame
 */

import type { WorkflowNode, WorkflowEdge } from "@/types/workflow";

// ─── Node IDs ────────────────────────────────────────────────────────────────

const IDS = {
  uploadImage: "sample-upload-image",
  cropImage: "sample-crop-image",
  systemPrompt1: "sample-text-system-1",
  productDetails: "sample-text-product",
  llm1: "sample-llm-1",
  uploadVideo: "sample-upload-video",
  extractFrame: "sample-extract-frame",
  systemPrompt2: "sample-text-system-2",
  llm2: "sample-llm-2",
} as const;

// ─── Column x positions ───────────────────────────────────────────────────────
// Col 0: 60   (sources)
// Col 1: 380  (processors)
// Col 2: 700  (text inputs + LLM #1)
// Col 3: 1030 (final LLM #2)

export const SAMPLE_NODES: WorkflowNode[] = [
  // ── Branch A ──────────────────────────────────────────────────────────────

  {
    id: IDS.uploadImage,
    type: "uploadImageNode",
    position: { x: 60, y: 40 },
    data: {
      imageUrl: null,
      uploadProgress: 0,
      fileName: null,
    },
  },

  {
    id: IDS.cropImage,
    type: "cropImageNode",
    position: { x: 380, y: 40 },
    data: {
      imageUrlConnected: true,
      xPercent: 10,
      yPercent: 10,
      widthPercent: 80,
      heightPercent: 80,
      xPercentConnected: false,
      yPercentConnected: false,
      widthPercentConnected: false,
      heightPercentConnected: false,
      outputUrl: null,
    },
  },

  {
    id: IDS.systemPrompt1,
    type: "textNode",
    position: { x: 700, y: 40 },
    data: {
      text: "You are a professional marketing copywriter. Generate a compelling one-paragraph product description.",
    },
  },

  {
    id: IDS.productDetails,
    type: "textNode",
    position: { x: 700, y: 230 },
    data: {
      text: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.",
    },
  },

  {
    id: IDS.llm1,
    type: "runLLMNode",
    position: { x: 700, y: 420 },
    data: {
      model: "gemini-2.0-flash" as const,
      systemPrompt: "",
      userMessage: "",
      systemPromptConnected: true,
      userMessageConnected: true,
      imagesConnected: true,
      result: null,
    },
  },

  // ── Branch B ──────────────────────────────────────────────────────────────

  {
    id: IDS.uploadVideo,
    type: "uploadVideoNode",
    position: { x: 60, y: 560 },
    data: {
      videoUrl: null,
      uploadProgress: 0,
      fileName: null,
    },
  },

  {
    id: IDS.extractFrame,
    type: "extractFrameNode",
    position: { x: 380, y: 560 },
    data: {
      videoUrlConnected: true,
      timestamp: "50%",
      timestampConnected: false,
      outputUrl: null,
    },
  },

  // ── Convergence ───────────────────────────────────────────────────────────

  {
    id: IDS.systemPrompt2,
    type: "textNode",
    position: { x: 380, y: 760 },
    data: {
      text: "You are a social media manager. Create a tweet-length marketing post based on the product image and video frame.",
    },
  },

  {
    id: IDS.llm2,
    type: "runLLMNode",
    position: { x: 1030, y: 420 },
    data: {
      model: "gemini-2.0-flash" as const,
      systemPrompt: "",
      userMessage: "",
      systemPromptConnected: true,
      userMessageConnected: true,
      imagesConnected: true,
      result: null,
    },
  },
];

// ─── Edges ────────────────────────────────────────────────────────────────────

function makeEdge(
  id: string,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
  dataType: "image" | "video" | "text" = "image"
): WorkflowEdge {
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    animated: true,
    type: "animatedEdge",
    data: { dataType },
  };
}

export const SAMPLE_EDGES: WorkflowEdge[] = [
  // Branch A: UploadImage → CropImage
  makeEdge(
    "e-upload-crop",
    IDS.uploadImage, "output-image_url",
    IDS.cropImage, "input-image_url",
    "image"
  ),

  // Branch A: CropImage → LLM #1 (images)
  makeEdge(
    "e-crop-llm1-img",
    IDS.cropImage, "output-image_url",
    IDS.llm1, "input-images",
    "image"
  ),

  // Branch A: SystemPrompt #1 → LLM #1
  makeEdge(
    "e-sysprompt1-llm1",
    IDS.systemPrompt1, "output-text",
    IDS.llm1, "input-system_prompt",
    "text"
  ),

  // Branch A: ProductDetails → LLM #1 (user message)
  makeEdge(
    "e-product-llm1",
    IDS.productDetails, "output-text",
    IDS.llm1, "input-user_message",
    "text"
  ),

  // Branch B: UploadVideo → ExtractFrame
  makeEdge(
    "e-video-extract",
    IDS.uploadVideo, "output-video_url",
    IDS.extractFrame, "input-video_url",
    "video"
  ),

  // Convergence: SystemPrompt #2 → LLM #2
  makeEdge(
    "e-sysprompt2-llm2",
    IDS.systemPrompt2, "output-text",
    IDS.llm2, "input-system_prompt",
    "text"
  ),

  // Convergence: LLM #1 output → LLM #2 user message
  makeEdge(
    "e-llm1-llm2-msg",
    IDS.llm1, "output-output",
    IDS.llm2, "input-user_message",
    "text"
  ),

  // Convergence: CropImage → LLM #2 (image input)
  makeEdge(
    "e-crop-llm2-img",
    IDS.cropImage, "output-image_url",
    IDS.llm2, "input-images",
    "image"
  ),

  // Convergence: ExtractFrame → LLM #2 (image input)
  makeEdge(
    "e-extract-llm2-img",
    IDS.extractFrame, "output-image_url",
    IDS.llm2, "input-images",
    "image"
  ),
];

export const SAMPLE_WORKFLOW_NAME = "Product Marketing Kit Generator";
