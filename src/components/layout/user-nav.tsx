
"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle"; // Import ThemeToggle

// Mock user data - replace with actual auth context
const mockUser = {
  name: "User Name",
  email: "user@example.com",
  avatarUrl: "https://placehold.co/100x100.png",
  role: "student" as "student" | "alumni" | null, // Example role
};


export function UserNav() {
  const router = useRouter();
  const { toast } = useToast();
  // In a real app, you'd get user from an auth context
  const user = mockUser;

  const handleLogout = async () => {
    // Simulate logout
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push("/");
  };
  
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatarUrl} alt={user.name ?? ""} data-ai-hint="profile person" />
              <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              {user.role && <p className="text-xs leading-none text-muted-foreground capitalize pt-1">Role: {user.role}</p>}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href="/profile" passHref legacyBehavior>
              <DropdownMenuItem>
                <Icons.profile className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/dashboard" passHref legacyBehavior>
              <DropdownMenuItem>
                <Icons.dashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/settings" passHref legacyBehavior>
              <DropdownMenuItem disabled> {/* Disabled as settings page not implemented */}
                <Icons.settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                {/* <DropdownMenuShortcut>⌘S</DropdownMenuShortcut> */}
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <Icons.logout className="mr-2 h-4 w-4" />
            <span>Log out</span>
            {/* <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut> */}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

    