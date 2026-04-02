import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden">
      {/* Top navbar */}
      <Navbar workflowId="" />

      {/* Main content with collapsible sidebars */}
      <ResponsiveLayout>{children}</ResponsiveLayout>
    </div>
  );
}

