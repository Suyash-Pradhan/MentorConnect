
"use client";

import * as React from "react";
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
import { Skeleton } from "../ui/skeleton";
import type { Profile, Role } from "@/types"; // Import Profile and Role type

export function AppSidebar({ userProfile }: { userProfile: Profile | null }) {
  const { state, isMobile } = useSidebar();
  const userRole = userProfile?.role || null;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader className="p-0 flex items-center h-auto min-h-[1px]" />
        <SidebarContent className="flex-1 p-2 space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="flex items-center h-8 rounded-md p-2">
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

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-0 flex items-center h-auto min-h-[1px]">
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
