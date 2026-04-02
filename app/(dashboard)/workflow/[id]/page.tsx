import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import WorkflowPageClient from "./WorkflowPageClient";

interface WorkflowPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  return <WorkflowPageClient workflowId={id} />;
}

export function generateMetadata() {
  return {
    title: "Workflow Editor — NextFlow",
  };
}
