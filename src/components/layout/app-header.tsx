
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
      <div className="flex h-16 items-center justify-between"> {/* Removed container, px-4 md:px-6 */}
        <div className="flex items-center gap-2 pl-1 md:pl-2"> {/* Changed: Added pl-1 md:pl-2 for finer control */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
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

        <div className="flex items-center space-x-2 sm:space-x-4 pr-4 md:pr-6"> {/* Added pr-4 md:pr-6 */}
          {/* Search Bar (Optional - can be re-added here if needed) */}
          <UserNav />
        </div>
      </div>
    </header>
  );
}
