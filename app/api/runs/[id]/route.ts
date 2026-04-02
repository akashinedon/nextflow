import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/runs/:id — Get a single run with all its NodeRuns
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const run = await prisma.workflowRun.findFirst({
    where: { id, userId },
    include: {
      nodeRuns: {
        orderBy: { startedAt: "asc" },
      },
      workflow: {
        select: { name: true },
      },
    },
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  // Calculate duration
  const duration =
    run.completedAt && run.startedAt
      ? run.completedAt.getTime() - run.startedAt.getTime()
      : null;

  return NextResponse.json({ run: { ...run, durationMs: duration } });
}
