import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/runs — List all WorkflowRuns for the current user
export async function GET(_request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runs = await prisma.workflowRun.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 50,
    select: {
      id: true,
      workflowId: true,
      status: true,
      scope: true,
      nodeCount: true,
      startedAt: true,
      completedAt: true,
      workflow: {
        select: { name: true },
      },
      _count: { select: { nodeRuns: true } },
    },
  });

  return NextResponse.json({ runs });
}
