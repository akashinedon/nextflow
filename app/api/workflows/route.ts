import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ─── POST /api/workflows — Save / upsert a workflow ────────────────────────

const saveWorkflowSchema = z.object({
  workflowId: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  nodes: z.array(z.record(z.string(), z.unknown())).default([]),
  edges: z.array(z.record(z.string(), z.unknown())).default([]),
  description: z.string().max(500).optional(),
});

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

  const result = saveWorkflowSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 422 }
    );
  }

  const { workflowId, name, nodes, edges, description } = result.data;

  // Upsert: if workflowId is provided and belongs to this user, update it
  let workflow;
  if (workflowId) {
    const existing = await prisma.workflow.findFirst({
      where: { id: workflowId, userId },
    });

    if (existing) {
      workflow = await prisma.workflow.update({
        where: { id: workflowId },
        data: {
          name,
          description,
          nodes: nodes as never,
          edges: edges as never,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create with provided ID
      workflow = await prisma.workflow.create({
        data: {
          id: workflowId,
          userId,
          name,
          description,
          nodes: nodes as never,
          edges: edges as never,
        },
      });
    }
  } else {
    workflow = await prisma.workflow.create({
      data: {
        userId,
        name,
        description,
        nodes: nodes as never,
        edges: edges as never,
      },
    });
  }

  return NextResponse.json({ workflow }, { status: 200 });
}

// ─── GET /api/workflows — List all workflows for the user ─────────────────

export async function GET(_request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { runs: true } },
    },
  });

  return NextResponse.json({ workflows });
}
