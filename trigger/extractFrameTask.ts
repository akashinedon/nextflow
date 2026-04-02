import { task, logger } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import * as tmp from "tmp";
import * as fs from "fs";
import * as path from "path";
import { v2 as cloudinary } from "cloudinary";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
tmp.setGracefulCleanup();

export interface ExtractFramePayload {
  video_url: string;
  /**
   * Timestamp in seconds (e.g. "5.2") or percentage (e.g. "50%").
   * Defaults to "0" (first frame).
   */
  timestamp: string;
  [key: string]: unknown;
}

export interface ExtractFrameOutput {
  output_url: string;
}

/** Get video duration in seconds via ffprobe */
async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`ffprobe failed: ${err.message}`));
        return;
      }
      const duration = metadata.format.duration;
      if (typeof duration !== "number" || isNaN(duration)) {
        reject(new Error("Could not determine video duration"));
        return;
      }
      resolve(duration);
    });
  });
}

/** Resolve timestamp string to seconds */
async function resolveTimestamp(
  rawTimestamp: string,
  videoPath: string
): Promise<number> {
  const trimmed = rawTimestamp.trim();

  if (trimmed.endsWith("%")) {
    const percent = parseFloat(trimmed.slice(0, -1));
    if (isNaN(percent)) {
      throw new Error(`Invalid percentage timestamp: ${rawTimestamp}`);
    }
    const duration = await getVideoDuration(videoPath);
    return (percent / 100) * duration;
  }

  const seconds = parseFloat(trimmed);
  if (isNaN(seconds)) {
    throw new Error(`Invalid timestamp: ${rawTimestamp}`);
  }
  return seconds;
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

export const extractFrameTask = task({
  id: "extract-frame",
  maxDuration: 120,
  run: async (payload: ExtractFramePayload): Promise<ExtractFrameOutput> => {
    logger.info("Starting extract-frame task", payload);

    const { video_url, timestamp = "0" } = payload;

    // Download the source video
    logger.info("Downloading source video", { url: video_url });
    const videoResponse = await fetch(video_url, {
      signal: AbortSignal.timeout(120_000),
    });

    if (!videoResponse.ok) {
      throw new Error(
        `Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`
      );
    }

    const videoFile = tmp.fileSync({ postfix: ".mp4", keep: false });
    const videoBuffer = await videoResponse.arrayBuffer();
    fs.writeFileSync(videoFile.name, Buffer.from(videoBuffer));

    logger.info("Video downloaded", {
      path: videoFile.name,
      bytes: videoBuffer.byteLength,
    });

    // Resolve timestamp
    const seekSeconds = await resolveTimestamp(timestamp, videoFile.name);
    logger.info("Resolved timestamp", { raw: timestamp, seconds: seekSeconds });

    // Output frame as JPEG
    const frameFile = tmp.fileSync({ postfix: ".jpg", keep: false });

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoFile.name)
        .seekInput(seekSeconds)
        .frames(1)
        .output(frameFile.name)
        .outputOptions(["-y", "-q:v 2"]) // high quality JPEG
        .on("start", (cmd) => logger.info("FFmpeg started", { cmd }))
        .on("end", () => {
          logger.info("FFmpeg frame extraction complete");
          resolve();
        })
        .on("error", (err) => {
          logger.error("FFmpeg error", { error: err.message });
          reject(new Error(`FFmpeg frame extraction failed: ${err.message}`));
        })
        .run();
    });

    // Upload to Cloudinary
    logger.info("Uploading frame to Cloudinary");
    const outputUrl = await uploadToCloudinary(frameFile.name);

    // Cleanup
    try {
      videoFile.removeCallback();
      frameFile.removeCallback();
    } catch {
      // Ignore cleanup errors
    }

    logger.info("Extract-frame task complete", { outputUrl });

    return { output_url: outputUrl };
  },
});
