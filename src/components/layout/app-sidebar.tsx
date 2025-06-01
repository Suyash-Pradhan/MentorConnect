
"use client";

import * as React from "react"; // Import React for useState and useEffect
import Link from "next/link";
import { siteConfig, type SidebarNavItem } from "@/config/site";
import { Icons } from "@/components/icons";
import { MainNav } from "./main-nav";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton"; // Import Skeleton

// Mock user data - replace with actual auth context
const mockUser = {
  role: "student" as "student" | "alumni" | null, // Example role
};


export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const userRole = mockUser.role; // Get user role from auth context in real app
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a consistent skeleton on the server and for initial client render
    // This skeleton should roughly match the structure (e.g., icon-only if that's a possible state)
    // to minimize layout shifts, but its primary goal is hydration stability.
    return (
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader className="p-0 flex items-center h-auto min-h-[1px]" />
        <SidebarContent className="flex-1 p-2 space-y-1">
          {/* Simulate a few icon placeholders for collapsed view, or full items for expanded */}
          {Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="flex items-center h-8 rounded-md p-2"> {/* Ensure p-2 to match button padding */}
                <Skeleton className="h-5 w-5 rounded-sm bg-sidebar-accent/20" /> 
                {(state === 'expanded' || isMobile ) && <Skeleton className="ml-2 h-4 w-20 rounded-sm bg-sidebar-accent/20" />}
             </div>
          ))}
        </SidebarContent>
        {(state === 'expanded' || isMobile) && (
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <Skeleton className="h-3 w-3/4 bg-sidebar-accent/20" />
          </SidebarFooter>
        )}
      </Sidebar>
    );
  }

  // Actual sidebar content, rendered only after client mount
  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-0 flex items-center h-auto min-h-[1px]">
        {/* This space is minimal if no content is added here. */}
      </SidebarHeader>
      
      <SidebarContent className="flex-1 p-0">
        <MainNav items={siteConfig.sidebarNav} userRole={userRole} />
      </SidebarContent>
      
      {(state === 'expanded' || isMobile) && (
        <SidebarFooter className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/70">
            &copy; {new Date().getFullYear()} {siteConfig.name}
          </p>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
