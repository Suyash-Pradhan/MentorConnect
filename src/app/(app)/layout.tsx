
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
    
    let specificGuidance = "";
    if (error.code && (error.code.includes("permission-denied") || error.code === 'PERMISSION_DENIED' || (error.message && error.message.toLowerCase().includes("firestore api has not been used")))) {
      specificGuidance = `
      This **"PERMISSION_DENIED"** error means the Cloud Firestore API is not enabled for your Firebase project **${configuredProjectId}**, or there's a mismatch with the project you're configuring.

      **Action Required (Ensure you are logged into the CORRECT Google Account for project ${configuredProjectId}):**
      1.  **VERIFY GOOGLE ACCOUNT**: Double-check you are logged into Google Cloud & Firebase consoles with the account that OWNS or has EDITOR permissions on project \`${configuredProjectId}\`.
      2.  **ENABLE API**: Go to: [https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${configuredProjectId}](https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${configuredProjectId})
          *   If it shows an "Enable" button, **CLICK IT**.
      3.  **CREATE DATABASE**: In the Firebase Console for project \`${configuredProjectId}\` ([https://console.firebase.google.com/project/${configuredProjectId}/firestore](https://console.firebase.google.com/project/${configuredProjectId}/firestore)), ensure a Firestore database instance has been **CREATED**. If you see "Create database", click it and follow the prompts (select region, start in "test mode").
      4.  **WAIT**: After enabling/creating, **WAIT 10-20 minutes** for changes to propagate.
      5.  **RESTART SERVER**: Stop and restart your Next.js development server.
      6.  **PROJECT ID CHECK**: Ensure \`NEXT_PUBLIC_FIREBASE_PROJECT_ID\` in your \`.env.local\` file **exactly matches** \`${configuredProjectId}\`. If it says "PROJECT_ID_NOT_CONFIGURED_IN_ENV" above, your .env.local file is not being read correctly or the variable is missing.`;
    } else if (error.code && (error.code.includes("unavailable") || error.code === 'UNAVAILABLE' || (error.message && error.message.toLowerCase().includes("offline")))) {
        specificGuidance = `
        This **"offline" or "unavailable"** error suggests the Firestore service was recently enabled/created and needs more time, or there's a network issue.

        **Action Required:**
        1.  If you recently enabled the Firestore API or created the database for project \`${configuredProjectId}\`, please **WAIT 15-30 minutes** for Google's systems to fully update.
        2.  Ensure your Next.js server environment has stable internet connectivity.
        3.  Verify the Firestore database instance for project \`${configuredProjectId}\` was fully created/initialized in the Firebase Console.
        4.  **After waiting/verifying, RESTART your Next.js development server.**
        5.  **PROJECT ID CHECK**: Ensure \`NEXT_PUBLIC_FIREBASE_PROJECT_ID\` in your \`.env.local\` file **exactly matches** \`${configuredProjectId}\`.`;
    } else if (error.message && error.message.includes("NEXT_PUBLIC_FIREBASE_API_KEY")) {
        specificGuidance = `Firebase Initialization Failed: ${error.message}. Please ensure all NEXT_PUBLIC_FIREBASE_ environment variables are correctly set in your .env.local file and you've restarted your development server. The configured project ID is \`${configuredProjectId}\`.`;
    }

    profileErrorMessage = `**Critical Error Connecting to Firebase/Firestore for Project ID: ${configuredProjectId}**
    The error received is: **${error.message || 'Unknown error'}** (Code: ${error.code || 'N/A'})
    This usually means there's a configuration problem with your Firebase project itself, or your application's environment variables.

    ${specificGuidance || `Please double-check all Firebase project settings, API enablement, and database creation for project \`${configuredProjectId}\`. Ensure your \`.env.local\` file matches the intended project and all Firebase variables are present.`}`;
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
        <div className="bg-card p-8 rounded-lg shadow-2xl max-w-3xl w-full">
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
              {/* DIAGNOSTIC DIV START - Helps confirm AppLayout structure renders */}
              <div style={{ border: '5px solid limegreen', padding: '10px', backgroundColor: '#f0f0f0', marginBlockEnd: '20px', color: 'black' }}>
                <p style={{ fontWeight: 'bold', fontSize: '1.2em' }}>AppLayout Diagnostic Info:</p>
                <p>Current Path: {currentPath || 'N/A'}</p>
                <p>User Profile Fetched: {userProfile ? 'Yes' : 'No'}</p>
                <p>User Name: {userProfile?.name || 'N/A (or not fetched)'}</p>
                <p>User Role: {userProfile?.role || 'N/A (or not fetched)'}</p>
                <p>User Email: {userProfile?.email || 'N/A (or not fetched)'}</p>
                <p>Attempting to render page content (children) below...</p>
              </div>
              {/* DIAGNOSTIC DIV END */}
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
