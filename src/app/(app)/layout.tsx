
"use server";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar'; // Import SidebarInset
import type { Profile } from '@/types';
import { getProfile } from '@/services/profileService';

// MOCK: In a real app, this would come from your auth context (e.g., Firebase Auth)
const MOCK_CURRENT_USER_ID = "user123_dev"; // Can be "student123" or "alumni456" etc.

export default async function AppLayout({ children }: { children: ReactNode }) {
  let userProfile: Profile | null = null;
  let profileError: Error | null = null;
  const currentPath = ''; // Cannot get currentPath directly in Server Component layout easily without headers/middleware
                          // For now, this means redirection logic might need refinement if path-dependent.

  try {
    userProfile = await getProfile(MOCK_CURRENT_USER_ID);
  } catch (error: any) {
    console.error("[AppLayout] Error fetching profile:", error);
    profileError = error; // Store the error to display it
  }

  // Handle Firestore connection errors (PERMISSION_DENIED, client offline, etc.)
  if (profileError) {
    const firebaseError = profileError as any; // Cast to any to access potential Firebase error properties
    let errorTitle = "Application Error";
    let errorMessage = "An unexpected error occurred while trying to load your profile.";
    let troubleshootingSteps: React.ReactNode[] = [];
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID_HERE";
    const firestoreApiLink = `https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${projectId}`;
    const firebaseConsoleLink = `https://console.firebase.google.com/project/${projectId}/firestore`;

    if (firebaseError.code === 'permission-denied' || (firebaseError.message && firebaseError.message.includes('PERMISSION_DENIED'))) {
      errorTitle = "Firestore Permission Denied";
      errorMessage = `The application cannot access Cloud Firestore for project "${projectId}". This usually means the Cloud Firestore API has not been enabled for this project, or it's still propagating.`;
      troubleshootingSteps = [
        <li key="step1"><strong>Verify Google Account:</strong> Ensure you are logged into the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-500">Google Cloud Console</a> and <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-500">Firebase Console</a> with the Google account that **owns or has Editor permissions** for the Firebase project <strong><code>{projectId}</code></strong>.</li>,
        <li key="step2"><strong>Enable Firestore API:</strong> Go to <a href={firestoreApiLink} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">Cloud Firestore API Page</a>. If it's not enabled, click "Enable".</li>,
        <li key="step3"><strong>Create Firestore Database:</strong> In the <a href={firebaseConsoleLink} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">Firebase Console for <code>{projectId}</code></a>, go to "Firestore Database" (under Build). If no database exists, click "Create database" (choose a region and start in test mode for development).</li>,
        <li key="step4"><strong>Wait for Propagation:</strong> After enabling the API or creating the database, wait 10-20 minutes for changes to propagate.</li>,
        <li key="step5"><strong>Restart Server:</strong> Stop and restart your Next.js development server.</li>,
        <li key="step6"><strong>Check Project ID:</strong> Ensure <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code> in your <code>.env.local</code> file exactly matches <strong><code>{projectId}</code></strong>.</li>
      ];
    } else if (firebaseError.code === 'unavailable' || (firebaseError.message && firebaseError.message.includes('client is offline'))) {
      errorTitle = "Firestore Client Offline";
      errorMessage = `The application could not connect to Cloud Firestore for project "${projectId}". This might be due to recent API enablement, a network issue, or the Firestore database instance not being fully ready.`;
       troubleshootingSteps = [
        <li key="step1"><strong>If Firestore API was just enabled/Database created:</strong> Please wait 10-20 minutes for the changes to propagate across Google's systems.</li>,
        <li key="step2"><strong>Restart Server:</strong> Stop and restart your Next.js development server.</li>,
        <li key="step3"><strong>Check Network:</strong> Ensure your server has a stable internet connection.</li>,
        <li key="step4"><strong>Verify Setup:</strong> Double-check that the Cloud Firestore API is enabled and a Firestore Database instance exists for project <strong><code>{projectId}</code></strong> using the links above.</li>
      ];
    }


    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-800 p-4 md:p-8">
        <div className="max-w-2xl w-full bg-white shadow-2xl rounded-lg p-6 md:p-10 border-2 border-red-300">
          <div className="flex items-center mb-4">
            <Icons.warning className="h-12 w-12 text-red-500 mr-4" />
            <h1 className="text-2xl md:text-3xl font-bold text-red-700">{errorTitle}</h1>
          </div>
          <p className="text-md mb-3">{errorMessage}</p>
          <p className="text-sm text-red-600 mb-4">
            <strong>Raw Error:</strong> {profileError.message}
          </p>
          {troubleshootingSteps.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-red-700 mb-2">Troubleshooting Steps:</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-red-700">
                {troubleshootingSteps}
              </ul>
            </>
          )}
          <div className="mt-6 text-center">
             <p className="text-sm text-red-600">If the issue persists after trying these steps, please contact support or check the Firebase/Google Cloud status pages.</p>
          </div>
        </div>
      </div>
    );
  }


  // If profile exists but role is not set, and not already on role-selection page, redirect.
  if (userProfile && !userProfile.role && currentPath !== '/role-selection') {
    // The redirect should happen client-side or via middleware for server components.
    // For now, this logic might not work as expected in a pure server component layout.
    // Consider moving role check to middleware or individual pages if this doesn't redirect reliably.
    // console.log("[AppLayout] User profile exists but role not set, redirecting to /role-selection");
    // redirect('/role-selection'); // This will throw an error if called during render of a server component not in a route handler.
    // For now, we will allow rendering and let the RoleSelectionPage handle its logic.
    // If a blank screen occurs, the RoleSelectionPage itself or a component it uses is the likely culprit.
  }

  // If no profile and not on role-selection (e.g., new user flow might be caught here, but auth should ideally handle this)
  if (!userProfile && currentPath !== '/role-selection') {
      // This scenario should ideally be handled by auth. If a user reaches here without a profile,
      // they might need to be redirected to a login or signup page, or role selection if auth is partial.
      // For now, assuming role-selection is the catch-all for new/incomplete profiles.
      // If on any other page, and no profile, redirecting to role-selection might be appropriate.
      // However, this could loop if role-selection also requires a profile that can't be fetched.
      // console.log("[AppLayout] No user profile found, redirecting to /role-selection");
      // redirect('/role-selection');
  }


  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset className="p-4 md:p-6 lg:p-8"> {/* Apply padding directly to SidebarInset */}
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
