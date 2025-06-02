
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { UserNav } from "./user-nav";
import { siteConfig } from "@/config/site";
import { useSidebar } from "@/components/ui/sidebar";
import type { Profile } from "@/types"; // Import Profile type
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader({ userProfile }: { userProfile: Profile | null }) {
  const { toggleSidebar } = useSidebar();

  // Placeholder for unread notifications count
  const unreadNotificationsCount = 0; // Replace with actual count later

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

        <div className="flex items-center space-x-2 sm:space-x-3 pr-4 md:pr-6">
          {userProfile && ( // Only show notifications bell if user is logged in
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Icons.bell className="h-5 w-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {unreadNotificationsCount}
                    </span>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Placeholder notifications */}
                <div className="p-2 max-h-80 overflow-y-auto">
                  {unreadNotificationsCount === 0 ? (
                     <DropdownMenuItem disabled className="text-sm text-muted-foreground text-center justify-center">
                       No new notifications
                     </DropdownMenuItem>
                  ) : (
                    <>
                      {/* Example notification items - replace with dynamic data */}
                      <DropdownMenuItem className="flex flex-col items-start !cursor-default">
                        <p className="font-semibold text-sm">New Mentorship Request</p>
                        <p className="text-xs text-muted-foreground">From John Doe</p>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="flex flex-col items-start !cursor-default">
                        <p className="font-semibold text-sm">New Message in Chat</p>
                        <p className="text-xs text-muted-foreground">With Jane Smith</p>
                      </DropdownMenuItem>
                    </>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center !cursor-pointer">
                  <Link href="/notifications" className="text-sm text-primary">
                    View all notifications
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <UserNav userProfile={userProfile} />
        </div>
      </div>
    </header>
  );
}
