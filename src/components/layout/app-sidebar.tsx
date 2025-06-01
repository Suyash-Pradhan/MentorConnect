
"use client";

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

// Mock user data - replace with actual auth context
const mockUser = {
  role: "student" as "student" | "alumni" | null, // Example role
};


export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const userRole = mockUser.role; // Get user role from auth context in real app

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-2 h-12 flex items-center">
        {/* Removed site name and logo link from here to avoid duplication with AppHeader. */}
        {/* This space can be used for a sidebar-specific control or left minimal. */}
        {/* Example: If sidebar had its own internal trigger, it might go here. */}
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
