import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { llmRequestSchema } from "@/lib/schemas";

export const maxDuration = 60;

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

  const result = llmRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 422 }
    );
  }

  const { model, systemPrompt, userMessage, imageUrls } = result.data;

  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });

    // Build parts — use the SDK's Part type directly
    type Part =
      | { text: string }
      | { inlineData: { data: string; mimeType: string } };
    const parts: Part[] = [];

    if (systemPrompt) {
      parts.push({ text: `System: ${systemPrompt}\n\n` });
    }

    // Add images if provided
    if (imageUrls && imageUrls.length > 0) {
      for (const url of imageUrls) {
        try {
          const imgRes = await fetch(url);
          const buffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const mimeType =
            (imgRes.headers.get("content-type") as `image/${string}`) ??
            "image/jpeg";
          parts.push({ inlineData: { data: base64, mimeType } });
        } catch {
          // Skip failed image fetches
        }
      }
    }

    parts.push({ text: userMessage });

    // Stream the response
    const streamResult = await geminiModel.generateContentStream(parts);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "LLM request failed", detail: message },
      { status: 500 }
    );
  }
}
