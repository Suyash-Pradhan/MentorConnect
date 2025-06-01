
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
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
  let profileErrorMessage = "Could not load essential user data. This might be due to a temporary network issue or if the backend services are still initializing. Please check your internet connection.";
  const currentProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "NOT_CONFIGURED";


  // This is a conceptual check. In a real app, this would involve server-side checks or middleware.
  // For now, we assume if the user reaches this layout, they are "authenticated" in a mock sense.
  const userIsAuthenticated = MOCK_CURRENT_USER_ID ? true : false;

  if (!userIsAuthenticated) {
    redirect('/login');
  }

  try {
    userProfile = await getProfile(MOCK_CURRENT_USER_ID);
  } catch (error: any) {
    console.error("AppLayout: Failed to fetch user profile:", error);
    profileError = true;
    if (error.code && (error.code.includes("unavailable") || error.code.includes("offline"))) {
        profileErrorMessage = `**Connection to Database Failed (Client Offline)** for Project ID: **${currentProjectId}**. This often occurs if the Firestore API was recently enabled or the database was just created. Please follow the troubleshooting steps below.`;
    } else if (error.message && error.message.includes("PERMISSION_DENIED")) {
      profileErrorMessage = `**Permission Denied Accessing Database** for Project ID: **${currentProjectId}**. This usually means the Cloud Firestore API is not enabled, or access rules are too restrictive. Please follow the troubleshooting steps below.`;
    } else if (error.message && error.message.includes("NEXT_PUBLIC_FIREBASE_API_KEY")) {
        profileErrorMessage = `Firebase Initialization Failed: ${error.message}. Please ensure all NEXT_PUBLIC_FIREBASE_ environment variables are correctly set in your .env.local file and you've restarted your development server.`;
    }
     else {
      profileErrorMessage = `Could not load user profile for Project ID: **${currentProjectId}** due to an unexpected error: ${error.message || 'Unknown error'}. Please try again later or contact support if the issue persists after checking the troubleshooting steps.`;
    }
  }

  const headersList = await headers();
  const currentPath = headersList.get('next-url');

  if (currentPath !== '/role-selection' && userIsAuthenticated && !profileError && (!userProfile || !userProfile.role)) {
    redirect('/role-selection');
  }


  if (profileError) {
    const firestoreApiLink = `https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=${currentProjectId === "NOT_CONFIGURED" ? "" : currentProjectId}`;
    const firebaseConsoleLink = `https://console.firebase.google.com/project/${currentProjectId === "NOT_CONFIGURED" ? "" : currentProjectId}/firestore`;

    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4 text-center">
        <Icons.warning className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Critical Error: Cannot Load Application</h1>
        <p className="text-muted-foreground max-w-xl whitespace-pre-line mt-2" dangerouslySetInnerHTML={{ __html: profileErrorMessage.replace(/\n/g, '<br />') }} />
        
        <div className="mt-6 space-y-4 bg-secondary/50 p-4 rounded-lg border border-destructive/30 max-w-2xl w-full">
            <h2 className="text-lg font-semibold text-foreground">Troubleshooting Firebase/Firestore Connection:</h2>
            <p className="text-sm text-muted-foreground text-left">
                The application is trying to connect to Firebase Project ID: <strong className="text-primary">{currentProjectId}</strong>.
                Please ensure this is the correct project you are configuring in the Google Cloud & Firebase consoles.
                If this ID is 'NOT_CONFIGURED' or incorrect, check your <code>.env.local</code> file for the <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code> variable and restart the server.
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground text-left space-y-2 mt-3">
                <li>
                    Go to the <a href={firestoreApiLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console (Firestore API page for your project)</a>.
                    Verify that the "Cloud Firestore API" is **ENABLED**. If it shows an "Enable" button, click it.
                </li>
                <li>
                    Go to the <a href={firebaseConsoleLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Firebase Console (Firestore Database page for your project)</a>.
                    Ensure a Firestore Database instance has been **CREATED**. If you see a "Create database" button, click it, select a region, choose "Start in test mode" (for now), and complete the setup.
                </li>
                <li>
                    **Wait 10-20 minutes** after any changes in the consoles for them to take full effect across Google's systems. This propagation time is crucial.
                </li>
                <li>
                    **Restart your application server** (e.g., `npm run dev` or the start script in your environment).
                </li>
                <li>
                    Ensure your internet connection is stable and can reach Google services.
                </li>
            </ol>
        </div>
        <Button asChild variant="outline" className="mt-6">
            <Link href="/">Return to Homepage (Public)</Link>
        </Button>
         <p className="text-xs text-muted-foreground mt-4">This application cannot function without a successful database connection.</p>
      </div>
    );
  }

  if (currentPath === '/role-selection' && (!userProfile || !userProfile.role)) {
     // Allow rendering role-selection page
  } else if (!userProfile || !userProfile.role) {
     return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4 text-center">
        <Icons.userCircle className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-2xl font-semibold text-foreground">Role Selection Needed</h1>
        <p className="text-muted-foreground max-w-md">
          Please complete your role selection to continue. Your profile data might be missing or incomplete.
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
          <div className="flex flex-col flex-1">
            <AppHeader />
            <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
