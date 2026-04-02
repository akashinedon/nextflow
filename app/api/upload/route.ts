import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as string) ?? "image";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];
  const allowed = type === "video" ? allowedVideoTypes : allowedImageTypes;

  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type: ${file.type}` },
      { status: 400 }
    );
  }

  const uploadcareKey = process.env["NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY"];

  if (!uploadcareKey) {
    return NextResponse.json(
      { error: "Uploadcare not configured — using local preview" },
      { status: 503 }
    );
  }

  try {
    const uploadFormData = new FormData();
    uploadFormData.append("UPLOADCARE_PUB_KEY", uploadcareKey);
    uploadFormData.append("file", file);

    const response = await fetch("https://upload.uploadcare.com/base/", {
      method: "POST",
      body: uploadFormData,
    });

    if (!response.ok) {
      throw new Error(`Uploadcare error: ${response.statusText}`);
    }

    const data = (await response.json()) as { file?: string };

    if (!data.file) {
      throw new Error("No file UUID returned from Uploadcare");
    }

    const uploadedUrl = `https://ucarecdn.com/${data.file}/`;

    return NextResponse.json({ url: uploadedUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
