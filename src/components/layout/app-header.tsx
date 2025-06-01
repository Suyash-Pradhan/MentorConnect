
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { UserNav } from "./user-nav";
import { siteConfig } from "@/config/site";
import { useSidebar } from "@/components/ui/sidebar";
import type { Profile } from "@/types"; // Import Profile type

export function AppHeader({ userProfile }: { userProfile: Profile | null }) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm">
      <div className="flex h-16 items-center w-full">
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

        <div className="flex items-center pl-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Icons.logo className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline font-bold text-primary">
              {siteConfig.name}
            </span>
          </Link>
        </div>

        <div className="flex-grow" />

        <div className="flex items-center space-x-2 sm:space-x-4 pr-4 md:pr-6">
          <UserNav userProfile={userProfile} />
        </div>
      </div>
    </header>
  );
}
