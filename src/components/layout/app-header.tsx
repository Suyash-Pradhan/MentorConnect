
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { UserNav } from "./user-nav";
import { siteConfig } from "@/config/site";
import { useSidebar } from "@/components/ui/sidebar";

export function AppHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm">
      <div className="flex h-16 items-center w-full"> {/* Ensured w-full here */}
        {/* Sidebar Toggle Section - Fixed width to match collapsed sidebar and vertically center button */}
        <div className="flex h-full w-12 items-center justify-center"> 
          <Button
            variant="ghost"
            size="icon" 
            onClick={toggleSidebar}
            className="h-10 w-10" 
          >
            <Icons.menu className="h-5 w-5" /> 
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </div>

        {/* Logo and Site Name Section */}
        <div className="flex items-center pl-2"> 
          <Link href="/dashboard" className="flex items-center gap-2">
            <Icons.logo className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline font-bold text-primary">
              {siteConfig.name}
            </span>
          </Link>
        </div>

        {/* Spacer to push UserNav to the right */}
        <div className="flex-grow" />

        {/* UserNav Section */}
        <div className="flex items-center space-x-2 sm:space-x-4 pr-4 md:pr-6">
          <UserNav />
        </div>
      </div>
    </header>
  );
}

    