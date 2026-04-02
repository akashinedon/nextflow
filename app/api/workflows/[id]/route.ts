import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── GET /api/workflows/:id — Load a single workflow ─────────────────────

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const workflow = await prisma.workflow.findFirst({
    where: { id, userId },
    include: {
      _count: { select: { runs: true } },
    },
  });

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  return NextResponse.json({ workflow });
}

// ─── PATCH /api/workflows/:id — Update name / description ────────────────

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.workflow.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  const result = patchSchema.safeParse(await request.json());
  if (!result.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const updated = await prisma.workflow.update({
    where: { id },
    data: { ...result.data, updatedAt: new Date() },
  });

  return NextResponse.json({ workflow: updated });
}

// ─── DELETE /api/workflows/:id — Delete a workflow ───────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.workflow.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  await prisma.workflow.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
