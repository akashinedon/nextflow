import { init } from "@trigger.dev/sdk/v3";

export const { handleRequest } = init({
  project: process.env["NEXT_PUBLIC_TRIGGER_PROJECT_ID"] ?? "proj_nextflow",
  dirs: ["./trigger"],
  maxDuration: 300,
});