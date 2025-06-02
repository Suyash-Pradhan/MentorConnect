
"use server";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import type { Profile } from '@/types';
import { getProfile } from '@/services/profileService';

const MOCK_CURRENT_USER_ID = "user123_dev";

export default async function AppLayout({ children }: { children: ReactNode }) {
  let userProfile: Profile | null = null;
  let profileError: Error | null = null;
  const currentPath = ''; // This would ideally be obtained dynamically if needed for server-side redirects

  try {
    userProfile = await getProfile(MOCK_CURRENT_USER_ID);
  } catch (error: any) {
    console.error("[AppLayout] Error fetching profile:", error);
    profileError = error;
  }

  if (profileError) {
    const firebaseError = profileError as any;
    let errorTitle = "Application Error";
    let errorMessage = "An unexpected error occurred while trying to load your profile.";
    let troubleshootingSteps: React.ReactNode[] = [];
    
    const displayProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "[Project ID not found]";
    const firestoreApiLink = `https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${displayProjectId}`;
    const firebaseConsoleLink = `https://console.firebase.google.com/project/${displayProjectId}/firestore`;

    if (firebaseError.code === 'permission-denied' || (firebaseError.message && firebaseError.message.includes('PERMISSION_DENIED'))) {
      errorTitle = "Firestore Permission Denied";
      errorMessage = `The application cannot access Cloud Firestore for project "${displayProjectId}". This usually means the Cloud Firestore API has not been enabled for this project, or it's still propagating.`;
      troubleshootingSteps = [
        <li key="step1"><strong>Verify Google Account:</strong> Ensure you are logged into the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-500">Google Cloud Console</a> and <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-500">Firebase Console</a> with the Google account that **owns or has Editor permissions** for the Firebase project <strong><code>{displayProjectId}</code></strong>.</li>,
        <li key="step2"><strong>Enable Firestore API:</strong> Go to <a href={firestoreApiLink} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">Cloud Firestore API Page</a>. If it's not enabled, click "Enable".</li>,
        <li key="step3"><strong>Create Firestore Database:</strong> In the <a href={firebaseConsoleLink} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">Firebase Console for <code>{displayProjectId}</code></a>, go to "Firestore Database" (under Build). If no database exists, click "Create database" (choose a region and start in test mode for development).</li>,
        <li key="step4"><strong>Wait for Propagation:</strong> After enabling the API or creating the database, wait 10-20 minutes for changes to propagate.</li>,
        <li key="step5"><strong>Restart Server:</strong> Stop and restart your Next.js development server.</li>,
        <li key="step6"><strong>Check Project ID:</strong> Ensure <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code> in your <code>.env.local</code> file exactly matches <strong><code>{displayProjectId}</code></strong>.</li>
      ];
    } else if (firebaseError.code === 'unavailable' || (firebaseError.message && firebaseError.message.includes('client is offline'))) {
      errorTitle = "Firestore Client Offline";
      errorMessage = `The application could not connect to Cloud Firestore for project "${displayProjectId}". This might be due to recent API enablement, a network issue, or the Firestore database instance not being fully ready.`;
       troubleshootingSteps = [
        <li key="step1"><strong>If Firestore API was just enabled/Database created:</strong> Please wait 10-20 minutes for the changes to propagate across Google's systems.</li>,
        <li key="step2"><strong>Restart Server:</strong> Stop and restart your Next.js development server.</li>,
        <li key="step3"><strong>Check Network:</strong> Ensure your server has a stable internet connection.</li>,
        <li key="step4"><strong>Verify Setup:</strong> Double-check that the Cloud Firestore API is enabled and a Firestore Database instance exists for project <strong><code>{displayProjectId}</code></strong> using the links above.</li>
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

  // TODO: Implement proper currentPath detection if server-side redirects are needed for role selection.
  // For now, client-side navigation handles this.
  // if (userProfile && !userProfile.role && currentPath !== '/role-selection') {
  //   redirect('/role-selection');
  // }
  // if (!userProfile && currentPath !== '/role-selection' && currentPath !== '/login' && currentPath !== '/signup') {
  //    Consider redirecting to login or role-selection if no profile and not on an auth page.
  //    redirect('/login'); // Or '/role-selection' depending on flow
  // }


  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col w-full">
        <AppHeader userProfile={userProfile} />
        <div className="flex flex-1 w-full">
          <AppSidebar userProfile={userProfile} />
          <SidebarInset className="p-4 md:p-6 lg:p-8">
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
