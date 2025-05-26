
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers'; // Import headers
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { getProfile } from '@/services/profileService';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


// MOCK: In a real app, this would come from your auth context (e.g., Firebase Auth)
const MOCK_CURRENT_USER_ID = "user123_dev"; // Replace with actual dynamic user ID

export default async function AppLayout({ children }: { children: ReactNode }) {
  let userProfile;
  let profileError = false;

  // This is a conceptual check. In a real app, this would involve server-side checks or middleware.
  // For now, we assume if the user reaches this layout, they are "authenticated" in a mock sense.
  const userIsAuthenticated = MOCK_CURRENT_USER_ID ? true : false;

  if (!userIsAuthenticated) {
    redirect('/login'); // Or use Next.js middleware
  }

  try {
    userProfile = await getProfile(MOCK_CURRENT_USER_ID);
  } catch (error) {
    console.error("AppLayout: Failed to fetch user profile:", error);
    profileError = true;
    // We won't redirect here, but show an error message or degraded experience.
    // Or, if profile is absolutely critical, redirect to an error page.
  }

  const headersList = headers();
  const currentPath = headersList.get('next-url'); // Gets the current internal URL, e.g., /dashboard

  // If profile fetch failed or user exists but has no role, redirect to role selection,
  // unless already on role-selection page.
  if (currentPath !== '/role-selection' && userIsAuthenticated && !profileError && (!userProfile || !userProfile.role)) {
    redirect('/role-selection');
  }

  if (profileError) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4 text-center">
        <Icons.warning className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error Loading Profile</h1>
        <p className="text-muted-foreground max-w-md">
          Could not load essential user data. This might be due to a temporary network issue or if the backend services are still initializing. Please check your internet connection.
        </p>
        <div className="mt-6 space-x-2">
          <Button onClick={() => {
            // This is a client-side refresh. In a server component, this is tricky.
            // For now, we'll link to login as a fallback.
            // Ideally, you'd have a client component button to trigger a refresh.
            if (typeof window !== 'undefined') window.location.reload();
           }}
           variant="outline"
           disabled // Server components can't directly cause a client-side refresh like this easily
          >
            Retry
          </Button>
           <Button asChild>
            <Link href="/login">Try Logging In Again</Link>
          </Button>
        </div>
         <p className="text-sm text-muted-foreground mt-4">If this issue persists after a few minutes, please contact support.</p>
      </div>
    );
  }

  // If user has no role but is on the role-selection page, allow it.
  // If user has no profile data at all (even after !profileError), but is on role-selection, allow it.
  // This covers the case where a new user (MOCK_CURRENT_USER_ID) doesn't have a profile document yet in Firestore.
  if (currentPath === '/role-selection' && (!userProfile || !userProfile.role)) {
     // Allow rendering role-selection page
  } else if (!userProfile || !userProfile.role) {
    // This case should ideally be caught by the redirect above if not on /role-selection
    // Or if somehow profileError was false, but userProfile is still null.
    // Fallback to a message or allow children if role selection is the next step.
    // For safety, if we reach here and currentPath is NOT /role-selection but role is missing, show error.
     return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4 text-center">
        <Icons.userCircle className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-2xl font-semibold text-foreground">Role Selection Needed</h1>
        <p className="text-muted-foreground max-w-md">
          Please complete your role selection to continue.
        </p>
        <Button asChild className="mt-4">
          <Link href="/role-selection">Go to Role Selection</Link>
        </Button>
      </div>
    );
  }


  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
