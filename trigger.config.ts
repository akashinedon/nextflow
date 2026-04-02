import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: process.env["NEXT_PUBLIC_TRIGGER_PROJECT_ID"] ?? "proj_nextflow",
  dirs: ["./trigger"],
  maxDuration: 300,
});
