import { task, logger } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface LLMTaskPayload {
  model: string;
  system_prompt?: string;
  user_message: string;
  images?: string[];
}

export interface LLMTaskOutput {
  output: string;
}

export const llmTask = task({
  id: "run-llm",
  maxDuration: 120, // 2 minutes for large prompts
  run: async (payload: LLMTaskPayload): Promise<LLMTaskOutput> => {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    logger.info("Starting LLM task", {
      model: payload.model,
      hasSystemPrompt: !!payload.system_prompt,
      hasImages: (payload.images?.length ?? 0) > 0,
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: payload.model });

    // Build content parts
    type InlineData = { inlineData: { data: string; mimeType: string } };
    type TextPart = { text: string };
    type Part = TextPart | InlineData;
    const parts: Part[] = [];

    if (payload.system_prompt) {
      parts.push({ text: `System: ${payload.system_prompt}\n\n` });
    }

    // Download and convert images to base64
    if (payload.images && payload.images.length > 0) {
      for (const imageUrl of payload.images) {
        try {
          logger.info("Downloading image for vision", { url: imageUrl });
          const response = await fetch(imageUrl, {
            signal: AbortSignal.timeout(30_000),
          });

          if (!response.ok) {
            logger.warn("Failed to download image, skipping", {
              url: imageUrl,
              status: response.status,
            });
            continue;
          }

          const contentType =
            response.headers.get("content-type") ?? "image/jpeg";
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");

          parts.push({
            inlineData: {
              data: base64,
              mimeType: contentType,
            },
          });

          logger.info("Image converted to base64", {
            url: imageUrl,
            bytes: buffer.byteLength,
          });
        } catch (err) {
          logger.warn("Error downloading image, skipping", {
            url: imageUrl,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    parts.push({ text: payload.user_message });

    logger.info("Calling Gemini API", { partsCount: parts.length });

    const result = await model.generateContent(parts);
    const response = result.response;
    const output = response.text();

    logger.info("LLM task complete", { outputLength: output.length });

    return { output };
  },
});
