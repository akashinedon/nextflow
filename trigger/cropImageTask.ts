import { task, logger } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import * as tmp from "tmp";
import * as fs from "fs";
import * as path from "path";
import { v2 as cloudinary } from "cloudinary";

// Use bundled FFmpeg binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Cleanup temp files on exit
tmp.setGracefulCleanup();

export interface CropImagePayload {
  image_url: string;
  x_percent: number; // 0–100
  y_percent: number;
  width_percent: number;
  height_percent: number;
  [key: string]: unknown;
}

export interface CropImageOutput {
  output_url: string;
}

async function uploadToCloudinary(filePath: string): Promise<string> {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const result = await cloudinary.uploader.upload(filePath, { resource_type: "auto" });
  return result.secure_url;
}

export const cropImageTask = task({
  id: "crop-image",
  maxDuration: 120,
  run: async (payload: CropImagePayload): Promise<CropImageOutput> => {
    logger.info("Starting crop-image task", payload);

    const {
      image_url,
      x_percent,
      y_percent,
      width_percent,
      height_percent,
    } = payload;

    // Download the source image
    logger.info("Downloading source image", { url: image_url });
    const imageResponse = await fetch(image_url, {
      signal: AbortSignal.timeout(60_000),
    });

    if (!imageResponse.ok) {
      throw new Error(
        `Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`
      );
    }

    const contentType = imageResponse.headers.get("content-type") ?? "image/jpeg";
    const ext = contentType.includes("png") ? ".png" : contentType.includes("webp") ? ".webp" : ".jpg";

    // Write to temp file
    const inputFile = tmp.fileSync({ postfix: ext, keep: false });
    const buffer = await imageResponse.arrayBuffer();
    fs.writeFileSync(inputFile.name, Buffer.from(buffer));
    logger.info("Image downloaded", { path: inputFile.name, bytes: buffer.byteLength });

    // Output temp file
    const outputFile = tmp.fileSync({ postfix: ".jpg", keep: false });

    // FFmpeg crop filter
    // crop=out_w:out_h:x:y
    // where all values are expressed as fractions of input dimensions
    const cropFilter = [
      `iw*${width_percent / 100}`, // out_w
      `ih*${height_percent / 100}`, // out_h
      `iw*${x_percent / 100}`,      // x offset
      `ih*${y_percent / 100}`,      // y offset
    ].join(":");

    logger.info("Running FFmpeg crop", { cropFilter });

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputFile.name)
        .videoFilters(`crop=${cropFilter}`)
        .output(outputFile.name)
        .outputOptions(["-y"]) // overwrite output
        .on("start", (cmd) => logger.info("FFmpeg started", { cmd }))
        .on("end", () => {
          logger.info("FFmpeg crop complete");
          resolve();
        })
        .on("error", (err) => {
          logger.error("FFmpeg error", { error: err.message });
          reject(new Error(`FFmpeg crop failed: ${err.message}`));
        })
        .run();
    });

    // Upload to Cloudinary
    logger.info("Uploading cropped image to Cloudinary");
    const outputUrl = await uploadToCloudinary(outputFile.name);

    // Cleanup
    try {
      inputFile.removeCallback();
      outputFile.removeCallback();
    } catch {
      // Ignore cleanup errors
    }

    logger.info("Crop task complete", { outputUrl });

    return { output_url: outputUrl };
  },
});
