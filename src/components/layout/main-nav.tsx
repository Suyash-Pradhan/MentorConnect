"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem, SidebarNavItem } from "@/config/site";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar"; // Assuming these are part of shadcn sidebar

interface MainNavProps {
  items?: SidebarNavItem[];
  userRole?: 'student' | 'alumni' | null; // Add userRole prop
}

export function MainNav({ items, userRole }: MainNavProps) {
  const pathname = usePathname();
  const { open, state: sidebarState, isMobile } = useSidebar(); // Get sidebar state

  if (!items?.length) {
    return null;
  }
  
  const filteredItems = items.filter(item => {
    if (!item.roles || item.roles.length === 0) return true; // No role restriction
    return userRole && item.roles.includes(userRole);
  });


  return (
    <ScrollArea className={cn("h-full", {"p-2": sidebarState === 'expanded' || isMobile })}>
      <SidebarMenu>
        {filteredItems.map((item, index) =>
          item.href ? (
            <SidebarMenuItem key={index}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.title}
                  className={cn(
                    "w-full justify-start",
                    {"justify-center": sidebarState === 'collapsed' && !isMobile }
                  )}
                >
                  {item.icon && <item.icon className={cn("h-5 w-5", {"mr-2": sidebarState === 'expanded' || isMobile})} />}
                  {(sidebarState === 'expanded' || isMobile) && <span className="truncate">{item.title}</span>}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ) : (
            item.items && (
              <Accordion type="multiple" className="w-full" key={index}>
                <AccordionItem value={item.title} className="border-none">
                  <AccordionTrigger className="py-0 hover:no-underline">
                    <SidebarMenuButton
                      className={cn(
                        "w-full justify-start",
                        {"justify-center": sidebarState === 'collapsed' && !isMobile }
                      )}
                      asChild
                    >
                      <div> {/* Wrapper div for proper layout */}
                        {item.icon && <item.icon className={cn("h-5 w-5", {"mr-2": sidebarState === 'expanded' || isMobile})} />}
                        {(sidebarState === 'expanded' || isMobile) && <span className="truncate">{item.title}</span>}
                      </div>
                    </SidebarMenuButton>
                  </AccordionTrigger>
                  {(sidebarState === 'expanded' || isMobile) && (
                    <AccordionContent className="pb-0 pl-2"> {/* Ensure content is visible */}
                      <SidebarMenuSub>
                        {item.items.map((subItem, subIndex) => (
                          <SidebarMenuSubItem key={subIndex}>
                             <Link href={subItem.href} legacyBehavior passHref>
                              <SidebarMenuSubButton
                                isActive={pathname === subItem.href}
                                className="w-full justify-start"
                              >
                                {subItem.icon && <subItem.icon className="mr-2 h-4 w-4" />}
                                {subItem.title}
                              </SidebarMenuSubButton>
                            </Link>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </AccordionContent>
                  )}
                </AccordionItem>
              </Accordion>
            )
          )
        )}
      </SidebarMenu>
    </ScrollArea>
  );
}
