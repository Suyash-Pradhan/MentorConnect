
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
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            // Removed className="mr-1 sm:mr-2" to make it flush left in its group
          >
            <Icons.menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Icons.logo className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline font-bold text-primary">
              {siteConfig.name}
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search Bar (Optional - can be re-added here if needed) */}
          {/* Example:
          <div className="hidden md:flex items-center space-x-1 border rounded-md px-2">
            <Icons.search className="h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0 !shadow-none" />
          </div>
          */}
          <UserNav />
        </div>
      </div>
    </header>
  );
}
