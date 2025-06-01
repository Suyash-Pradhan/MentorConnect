
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
  const configuredProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "PROJECT_ID_NOT_CONFIGURED_IN_ENV";


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
    
    const baseErrorMessage = `**Critical Error Connecting to Firebase/Firestore**
    Your application is configured to use Firebase Project ID: **${configuredProjectId}**.
    The error received is: **${error.message || 'Unknown error'}** (Code: ${error.code || 'N/A'})

    **This usually means there's a configuration problem with your Firebase project itself, external to this application's code.**`;

    if (error.code && (error.code.includes("permission-denied") || error.code === 'PERMISSION_DENIED')) {
      profileErrorMessage = `${baseErrorMessage}

      **Action Required: Enable Cloud Firestore API**
      1.  **VERIFY GOOGLE ACCOUNT**: Ensure you are logged into the Google Cloud Console with the **EXACT Google account that owns or has Editor permissions on the Firebase project \`${configuredProjectId}\`**.
      2.  **ENABLE API**: Go to: [https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${configuredProjectId}](https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${configuredProjectId})
          *   If it shows an "Enable" button, **CLICK IT**.
      3.  **CREATE DATABASE**: In the Firebase Console for project \`${configuredProjectId}\` ([https://console.firebase.google.com/project/${configuredProjectId}/firestore](https://console.firebase.google.com/project/${configuredProjectId}/firestore)), ensure a Firestore database instance has been **CREATED**. If you see "Create database", click it and follow the prompts.
      4.  **WAIT**: After enabling/creating, wait 10-20 minutes for changes to propagate.
      5.  **RESTART SERVER**: Stop and restart your Next.js development server.
      6.  **PROJECT ID MISMATCH?**: If you are actively working in a *different* Firebase project in your console, ensure the Project ID above (\`${configuredProjectId}\`) from your app's \`.env.local\` file matches the Project ID you are configuring. If they don't match, update your \`.env.local\` file with the correct Firebase configuration for the project you intend to use.`;
    } else if (error.code && (error.code.includes("unavailable") || error.code === 'UNAVAILABLE' || (error.message && error.message.toLowerCase().includes("offline")))) {
        profileErrorMessage = `${baseErrorMessage}

        **Action Required: Check Firestore & Network**
        This "offline" or "unavailable" error often occurs if:
        1.  The Cloud Firestore API was recently enabled or the database was just created for project \`${configuredProjectId}\`. Please **wait 10-20 minutes** for Google's systems to fully update.
        2.  Your Next.js server environment has lost internet connectivity or cannot reach Google Cloud services.
        3.  The Firestore database instance for project \`${configuredProjectId}\` was not fully created/initialized. Verify this in the Firebase Console ([https://console.firebase.google.com/project/${configuredProjectId}/firestore](https://console.firebase.google.com/project/${configuredProjectId}/firestore)).
        4.  **After waiting/verifying, restart your Next.js development server.**
        5.  **PROJECT ID MISMATCH?**: Ensure the Project ID above (\`${configuredProjectId}\`) from your app's \`.env.local\` file matches the Project ID you are configuring in the Firebase/Google Cloud Console. If they differ, your app is trying to connect to the wrong project. Update \`.env.local\` accordingly.`;
    } else if (error.message && error.message.includes("NEXT_PUBLIC_FIREBASE_API_KEY")) {
        profileErrorMessage = `Firebase Initialization Failed: ${error.message}. Please ensure all NEXT_PUBLIC_FIREBASE_ environment variables are correctly set in your .env.local file and you've restarted your development server.`;
    }
     else {
      profileErrorMessage = `${baseErrorMessage}

      Please double-check all Firebase project settings, API enablement, and database creation for project \`${configuredProjectId}\`. Ensure your \`.env.local\` file matches the intended project.`;
    }
  }

  const headersList = await headers(); 
  const currentPath = headersList.get('next-url');

  if (currentPath !== '/role-selection' && userIsAuthenticated && !profileError && (!userProfile || !userProfile.role)) {
    redirect('/role-selection');
  }


  if (profileError) {
    const firestoreApiLink = `https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=${configuredProjectId === "PROJECT_ID_NOT_CONFIGURED_IN_ENV" ? "" : configuredProjectId}`;
    const firebaseConsoleLink = `https://console.firebase.google.com/project/${configuredProjectId === "PROJECT_ID_NOT_CONFIGURED_IN_ENV" ? "" : configuredProjectId}/firestore`;

    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-6 text-center">
        <div className="bg-card p-8 rounded-lg shadow-2xl max-w-3xl w-full"> {/* Increased max-w for more text */}
          <Icons.warning className="h-20 w-20 text-destructive mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-destructive mb-4">Application Initialization Error</h1>
          <div 
            className="text-muted-foreground whitespace-pre-line text-left leading-relaxed text-sm" 
            dangerouslySetInnerHTML={{ __html: profileErrorMessage.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} 
          />
          
          <div className="mt-6 space-y-3 bg-secondary/30 p-4 rounded-md border border-destructive/20">
              <h2 className="text-lg font-semibold text-foreground">Key Troubleshooting Links:</h2>
              <p className="text-xs text-muted-foreground text-left">
                  Ensure you are logged in with the correct Google account before opening. App configured for Project ID: <strong className="text-primary">{configuredProjectId}</strong>.
              </p>
              <ul className="list-disc list-inside text-xs text-muted-foreground text-left space-y-1 mt-2">
                  <li>
                      <a href={firestoreApiLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Enable Cloud Firestore API in Google Cloud Console</a>
                  </li>
                  <li>
                      <a href={firebaseConsoleLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Create/Check Firestore Database in Firebase Console</a>
                  </li>
                  <li>
                      If \`PROJECT_ID_NOT_CONFIGURED_IN_ENV\` is shown, or if it doesn't match the project you are configuring in the Firebase/Cloud console, check your <code>.env.local</code> file for <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code> and all other Firebase config values. Restart the server after changes.
                  </li>
              </ul>
          </div>
          <Button asChild variant="outline" className="mt-6">
              <Link href="/">Return to Public Homepage</Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-4">This application cannot function without a successful database connection and correct API enablement for the configured Firebase Project.</p>
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
