"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import { cn } from "@/lib/utils";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

/**
 * Client wrapper that adds sidebar collapse toggles to the dashboard layout.
 * The auth check is already done in the parent server component (DashboardLayout).
 */
export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Left sidebar */}
      <div
        className={cn(
          "transition-all duration-200 ease-in-out overflow-hidden",
          leftOpen ? "w-[200px]" : "w-0"
        )}
      >
        <LeftSidebar />
      </div>

      {/* Toggle left sidebar */}
      <button
        onClick={() => setLeftOpen((v) => !v)}
        title={leftOpen ? "Collapse left panel" : "Expand left panel"}
        className={cn(
          "absolute top-3 z-30 flex items-center justify-center",
          "w-6 h-6 rounded-r-lg bg-[#17172a] border border-l-0 border-[#2a2a40]",
          "text-slate-600 hover:text-slate-300 hover:bg-[#1e1e30] transition-colors",
          leftOpen ? "left-[200px]" : "left-0"
        )}
      >
        {leftOpen ? (
          <PanelLeftClose size={12} />
        ) : (
          <PanelLeftOpen size={12} />
        )}
      </button>

      {/* Main canvas */}
      <main className="flex-1 relative overflow-hidden">{children}</main>

      {/* Toggle right sidebar */}
      <button
        onClick={() => setRightOpen((v) => !v)}
        title={rightOpen ? "Collapse right panel" : "Expand right panel"}
        className={cn(
          "absolute top-3 right-0 z-30 flex items-center justify-center",
          "w-6 h-6 rounded-l-lg bg-[#17172a] border border-r-0 border-[#2a2a40]",
          "text-slate-600 hover:text-slate-300 hover:bg-[#1e1e30] transition-colors",
          rightOpen && "right-[258px]"
        )}
      >
        {rightOpen ? (
          <PanelRightClose size={12} />
        ) : (
          <PanelRightOpen size={12} />
        )}
      </button>

      {/* Right sidebar */}
      <div
        className={cn(
          "transition-all duration-200 ease-in-out overflow-hidden",
          rightOpen ? "w-[258px]" : "w-0"
        )}
      >
        <RightSidebar />
      </div>
    </div>
  );
}
