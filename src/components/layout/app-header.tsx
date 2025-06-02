
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { UserNav } from "./user-nav";
import { siteConfig } from "@/config/site";
import { useSidebar } from "@/components/ui/sidebar";
import type { Profile, AppNotification } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/contexts/notifications-context"; // Import useNotifications
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function AppHeader({ userProfile }: { userProfile: Profile | null }) {
  const { toggleSidebar } = useSidebar();
  const { notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useNotifications();
  const router = useRouter();

  const handleNotificationClick = (notification: AppNotification) => {
    if (notification.link) {
      router.push(notification.link);
    }
    if (!notification.isRead) {
        markNotificationAsRead(notification.id);
    }
  };

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
          {userProfile && (
            <DropdownMenu onOpenChange={(open) => { if(!open && unreadCount > 0) markAllNotificationsAsRead(); }}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Icons.bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 px-1.5 py-0.5 text-xs rounded-full h-auto"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 sm:w-96" align="end">
                <DropdownMenuLabel className="flex justify-between items-center">
                  <span>Notifications</span>
                  {notifications.length > 0 && (
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={markAllNotificationsAsRead} disabled={unreadCount === 0}>
                      Mark all as read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                     <DropdownMenuItem disabled className="text-sm text-muted-foreground text-center justify-center py-4">
                       No new notifications
                     </DropdownMenuItem>
                  ) : (
                    notifications.map(notif => (
                      <React.Fragment key={notif.id}>
                        <DropdownMenuItem
                          onClick={() => handleNotificationClick(notif)}
                          className={`flex flex-col items-start !cursor-pointer p-3 ${!notif.isRead ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-accent'}`}
                        >
                          <p className={`font-semibold text-sm ${!notif.isRead ? 'text-primary' : 'text-foreground'}`}>{notif.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notif.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(notif.timestamp, { addSuffix: true })}</p>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="last:hidden" />
                      </React.Fragment>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="justify-center !cursor-pointer">
                        <Link href="/notifications" className="text-sm text-primary">
                            View all notifications (Coming Soon)
                        </Link>
                        </DropdownMenuItem>
                    </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <UserNav userProfile={userProfile} />
        </div>
      </div>
    </header>
  );
}
