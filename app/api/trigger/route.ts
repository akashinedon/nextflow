import { handleRequest } from "@/trigger";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return handleRequest(request);
}