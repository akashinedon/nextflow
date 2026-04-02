import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Redirect to a new workflow ID
  redirect(`/workflow/${uuidv4()}`);
}
