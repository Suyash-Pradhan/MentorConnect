
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { getProfile } from '@/services/profileService';
import { Icons } from '@/components/icons'; // For potential loading/error display

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

  // If profile fetch failed or user exists but has no role, redirect to role selection.
  // Exception: Don't redirect if already on role-selection page to avoid redirect loop.
  // This requires knowing the current path, which is tricky in server component layouts directly.
  // For now, we assume role-selection page handles its own logic if user already has role.
  if (userIsAuthenticated && !profileError && (!userProfile || !userProfile.role)) {
     // Check if role selection is truly needed (e.g. user has no role set)
     // If userProfile exists but userProfile.role is null, redirect.
     // If userProfile doesn't exist (first time login after auth), also redirect.
    redirect('/role-selection');
  }

  if (profileError) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
        <Icons.warning className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error Loading Profile</h1>
        <p className="text-muted-foreground">Could not load essential user data. Please try again later.</p>
        <a href="/login" className="mt-4 text-primary hover:underline">Try logging in again</a>
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
