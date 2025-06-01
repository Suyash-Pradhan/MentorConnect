
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
  const currentProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "PROJECT_ID_NOT_CONFIGURED_IN_ENV";


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
    // More detailed error messages based on error type
    if (error.code && (error.code.includes("unavailable") || error.code === 'UNAVAILABLE' || (error.message && error.message.toLowerCase().includes("offline")))) {
        profileErrorMessage = `**Connection to Database Failed (Client Offline)** for Project ID: **${currentProjectId}**.
        This often occurs if the Firestore API was recently enabled or the database was just created. Please follow these steps:
        1. Ensure your internet connection is stable.
        2. Wait 10-20 minutes for Firebase changes to propagate.
        3. **Restart your Next.js development server.**`;
    } else if (error.code && (error.code.includes("permission-denied") || error.code === 'PERMISSION_DENIED')) {
      profileErrorMessage = `**Permission Denied Accessing Firestore Database** for Project ID: **${currentProjectId}**.
      This means the Cloud Firestore API is not enabled, or access rules are too restrictive.
      **THIS IS A GOOGLE CLOUD / FIREBASE CONFIGURATION ISSUE, NOT AN APP CODE ISSUE.**

      **Please meticulously verify the following:**
      1.  **Correct Google Account**: Ensure you are logged into the Google Cloud Console & Firebase Console with the **EXACT Google account that owns or has Editor permissions on the Firebase project \`${currentProjectId}\`**. This is the most common cause of this error.
      2.  **Cloud Firestore API Enabled**:
          *   Go to: [https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${currentProjectId}](https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${currentProjectId})
          *   If it shows an "Enable" button, **CLICK IT**. If it says "API Enabled", this step is correct for the logged-in Google account.
      3.  **Firestore Database Instance Created**:
          *   Go to the Firebase Console: [https://console.firebase.google.com/project/${currentProjectId}/firestore](https://console.firebase.google.com/project/${currentProjectId}/firestore)
          *   If you see a "Create database" button, **CLICK IT** and complete the setup (select a region, choose "Start in test mode" for development).
      4.  **Wait 10-20 minutes** after any changes in the consoles for them to take full effect.
      5.  **Restart your Next.js development server** after waiting.
      6.  **Check Project ID in .env.local**: Ensure \`NEXT_PUBLIC_FIREBASE_PROJECT_ID\` in your \`.env.local\` file exactly matches \`${currentProjectId}\`.
      7.  **Check Billing**: Ensure there are no billing issues or holds on your Google Cloud project in the Google Cloud Console.`;
    } else if (error.message && error.message.includes("NEXT_PUBLIC_FIREBASE_API_KEY")) {
        profileErrorMessage = `Firebase Initialization Failed: ${error.message}. Please ensure all NEXT_PUBLIC_FIREBASE_ environment variables are correctly set in your .env.local file and you've restarted your development server.`;
    }
     else {
      profileErrorMessage = `Could not load user profile for Project ID: **${currentProjectId}** due to an unexpected error: ${error.message || 'Unknown error'}. 
      This might be a Firestore connection issue. Please check the troubleshooting steps above for PERMISSION_DENIED or OFFLINE errors.`;
    }
  }

  const headersList = await headers(); // Await the headers() call
  const currentPath = headersList.get('next-url');

  if (currentPath !== '/role-selection' && userIsAuthenticated && !profileError && (!userProfile || !userProfile.role)) {
    redirect('/role-selection');
  }


  if (profileError) {
    const firestoreApiLink = `https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=${currentProjectId === "PROJECT_ID_NOT_CONFIGURED_IN_ENV" ? "" : currentProjectId}`;
    const firebaseConsoleLink = `https://console.firebase.google.com/project/${currentProjectId === "PROJECT_ID_NOT_CONFIGURED_IN_ENV" ? "" : currentProjectId}/firestore`;

    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-6 text-center">
        <div className="bg-card p-8 rounded-lg shadow-2xl max-w-2xl w-full">
          <Icons.warning className="h-20 w-20 text-destructive mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-destructive mb-4">Critical Application Error</h1>
          <p className="text-muted-foreground whitespace-pre-line text-left leading-relaxed" dangerouslySetInnerHTML={{ __html: profileErrorMessage.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          
          <div className="mt-8 space-y-3 bg-secondary/30 p-6 rounded-md border border-destructive/20">
              <h2 className="text-xl font-semibold text-foreground">Key Troubleshooting Links:</h2>
              <p className="text-sm text-muted-foreground text-left">
                  Ensure you are logged in with the correct Google account before opening these links. Your current app is configured for Project ID: <strong className="text-primary">{currentProjectId}</strong>.
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground text-left space-y-2 mt-2">
                  <li>
                      <a href={firestoreApiLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Enable Cloud Firestore API in Google Cloud Console</a>
                  </li>
                  <li>
                      <a href={firebaseConsoleLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Create/Check Firestore Database in Firebase Console</a>
                  </li>
                  <li>
                      If \`PROJECT_ID_NOT_CONFIGURED_IN_ENV\` is shown, check your <code>.env.local</code> file for <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code> and restart the server.
                  </li>
              </ul>
          </div>
          <Button asChild variant="outline" className="mt-8">
              <Link href="/">Return to Public Homepage</Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-6">This application cannot function without a successful database connection and correct API enablement.</p>
        </div>
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
