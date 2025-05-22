"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Icons } from "@/components/icons";
import { MainNav } from "./main-nav";
import { UserNav } from "./user-nav";
import { siteConfig } from "@/config/site";
import { useSidebar } from "@/components/ui/sidebar"; // Assuming this hook exists and works as per shadcn/ui sidebar

export function AppHeader() {
  const { toggleSidebar, isMobile } = useSidebar(); // Or a similar hook if not using the exact shadcn sidebar provider globally

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0 px-4 md:px-6">
        {/* Mobile sidebar toggle, or desktop toggle if using collapsible sidebar from ui/sidebar */}
         <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar} // UseSidebar hook's toggle function
            className="mr-2 md:hidden" // Only show on mobile if desktop sidebar is persistent
          >
            <Icons.menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        
        <Link href="/dashboard" className="items-center space-x-2 md:flex hidden">
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="font-bold text-primary">{siteConfig.name}</span>
        </Link>

        {/* Desktop Main Navigation (can be empty if sidebar is primary nav) */}
        <div className="flex-1">
           <MainNav items={[]} /> {/* Pass mainNav items if any for header */}
        </div>


        <div className="flex items-center space-x-4">
          {/* Search Bar (Optional) */}
          {/* <div className="hidden md:flex items-center space-x-1 border rounded-md px-2">
            <Icons.search className="h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0 !shadow-none" />
          </div> */}
          <UserNav />
        </div>
      </div>
    </header>
  );
}
