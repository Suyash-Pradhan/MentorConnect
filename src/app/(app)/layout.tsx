
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
// import { AppHeader } from '@/components/layout/app-header'; // Temporarily removed
// import { AppSidebar } from '@/components/layout/app-sidebar'; // Temporarily removed
// import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'; // Temporarily removed
import { getProfile } from '@/services/profileService';
// import { Icons } from '@/components/icons'; // Temporarily removed
// import { Button } from '@/components/ui/button'; // Temporarily removed
// import Link from 'next/link'; // Temporarily removed

// MOCK: In a real app, this would come from your auth context (e.g., Firebase Auth)
const MOCK_CURRENT_USER_ID = "user123_dev"; 

export default async function AppLayout({ children }: { children: ReactNode }) {
  let userProfile;
  let profileError = false;
  let profileErrorMessage = "Could not load essential user data. This might be due to a temporary network issue or if the backend services are still initializing. Please check your internet connection.";
  const configuredProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "PROJECT_ID_NOT_CONFIGURED_IN_ENV";

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
      specificGuidance = `This **"PERMISSION_DENIED"** error means the Cloud Firestore API is not enabled for project **${configuredProjectId}**, or there's a mismatch. 
      **Action Required (Ensure you are logged into the CORRECT Google Account for project ${configuredProjectId}):** 
      1. **VERIFY GOOGLE ACCOUNT**. 
      2. **ENABLE API**: Go to: [https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${configuredProjectId}](https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${configuredProjectId}). Click "Enable" if present. 
      3. **CREATE DATABASE**: In Firebase Console for project \`${configuredProjectId}\`, ensure a Firestore database instance has been **CREATED**. 
      4. **WAIT 10-20 minutes** & **RESTART SERVER**.
      5. **PROJECT ID CHECK**: Ensure \`NEXT_PUBLIC_FIREBASE_PROJECT_ID\` in \`.env.local\` **exactly matches** \`${configuredProjectId}\`. The project ID Firestore console shows you're in MUST match this.`;
    } else if (error.code && (error.code.includes("unavailable") || error.code === 'UNAVAILABLE' || (error.message && error.message.toLowerCase().includes("offline")))) {
        specificGuidance = `This **"offline" or "unavailable"** error suggests a recent Firestore enablement/creation needing more time, or a network issue. 
        **Action Required:** 
        1. If you recently enabled/created Firestore for project \`${configuredProjectId}\`, **WAIT 15-30 minutes**. 
        2. Check server internet connectivity. 
        3. **After waiting, RESTART your Next.js server.**`;
    } else if (error.message && error.message.includes("NEXT_PUBLIC_FIREBASE_API_KEY")) {
        specificGuidance = `Firebase Initialization Failed: ${error.message}. Check .env.local for Firebase variables and restart server. Configured project ID: \`${configuredProjectId}\`.`;
    }

    profileErrorMessage = `**AppLayout: Critical Error Connecting to Firebase/Firestore for Project ID: ${configuredProjectId}**
    The error received is: **${error.message || 'Unknown error'}** (Code: ${error.code || 'N/A'})
    This usually means a Firebase project configuration problem or incorrect .env.local variables.

    ${specificGuidance || `Please double-check all Firebase project settings, API enablement, and database creation for project \`${configuredProjectId}\`. Ensure your \`.env.local\` file matches the intended project.`}`;
  }

  const headersList = await headers(); 
  const currentPath = headersList.get('next-url');

  if (profileError) {
    const firestoreApiLink = `https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=${configuredProjectId === "PROJECT_ID_NOT_CONFIGURED_IN_ENV" ? "" : configuredProjectId}`;
    const firebaseConsoleLink = `https://console.firebase.google.com/project/${configuredProjectId === "PROJECT_ID_NOT_CONFIGURED_IN_ENV" ? "" : configuredProjectId}/firestore`;

    return (
      <div style={{minHeight: '100vh', border: '10px solid red', backgroundColor: 'lightpink', padding: '20px', color: 'black', fontFamily: 'monospace'}}>
        <h1 style={{fontSize: '24px', fontWeight: 'bold', color: 'darkred'}}>AppLayout: Profile Fetch Error Occurred</h1>
        <p>Current Path: {currentPath || 'N/A (Could not get path)'}</p>
        <p>Configured Project ID in .env.local: <strong>{configuredProjectId}</strong></p>
        <hr style={{margin: '10px 0', borderColor: 'darkred'}} />
        <div 
          style={{whiteSpace: 'pre-wrap', lineHeight: '1.6'}}
          dangerouslySetInnerHTML={{ __html: profileErrorMessage.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} 
        />
        <div style={{marginTop: '20px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.05)'}}>
            <h2 style={{fontWeight: 'bold'}}>Key Troubleshooting Links (ensure logged in with correct Google Account):</h2>
            <ul style={{listStyle: 'disc', paddingLeft: '20px'}}>
                <li><a href={firestoreApiLink} target="_blank" rel="noopener noreferrer" style={{color: 'blue'}}>Enable Cloud Firestore API</a> (for project: {configuredProjectId})</li>
                <li><a href={firebaseConsoleLink} target="_blank" rel="noopener noreferrer" style={{color: 'blue'}}>Create/Check Firestore Database in Firebase Console</a> (for project: {configuredProjectId})</li>
                <li>If \`PROJECT_ID_NOT_CONFIGURED_IN_ENV\` or mismatch: Check <code>.env.local</code> for <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code>. Restart server after changes.</li>
            </ul>
        </div>
        <p style={{marginTop: '10px', fontSize: '0.9em'}}>This application cannot function without successful database connection.</p>
      </div>
    );
  }

  if (currentPath !== '/role-selection' && userIsAuthenticated && !profileError && (!userProfile || !userProfile.role)) {
    redirect('/role-selection');
  }

  if (currentPath === '/role-selection' && (!userProfile || !userProfile.role)) {
     // Allow role-selection page to render; it's handled by children.
     // This is a valid state.
  } else if (!userProfile || !userProfile.role) {
     // This state implies we are NOT on /role-selection but profile/role is missing.
     // The redirect above should have caught this. If we reach here, it's an unexpected state.
     // Render a message and a link to role selection.
    return (
      <div style={{minHeight: '100vh', border: '10px solid orange', backgroundColor: 'lightyellow', padding: '20px', color: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
        <h1 style={{fontSize: '24px', fontWeight: 'bold', color: 'darkorange'}}>AppLayout: Role Selection Required or Profile Incomplete</h1>
        <p>Current Path: {currentPath || 'N/A'}</p>
        <p>User Profile Exists: {userProfile ? 'Yes' : 'No'}</p>
        <p>User Role Set: {userProfile?.role || 'No'}</p>
        <p>This page requires a complete profile with a role. You might have been redirected here if your profile is incomplete.</p>
        <p>If you are seeing this on a page other than /role-selection, something is unexpected.</p>
        <a href="/role-selection" style={{marginTop: '20px', padding: '10px 20px', backgroundColor: 'blue', color: 'white', textDecoration: 'none', borderRadius: '5px'}}>Go to Role Selection</a>
      </div>
    );
  }

  // If all checks pass, render the main app structure (highly simplified)
  return (
    <div style={{ border: '10px solid green', padding: '20px', backgroundColor: 'lightgreen', minHeight: '100vh', color: 'black', fontFamily: 'monospace' }}>
      <h1 style={{color: 'black', fontSize: '2em', fontWeight: 'bold'}}>AppLayout Rendered (Simplified)</h1>
      <p style={{color: 'black'}}>Current Path: {currentPath || 'N/A'}</p>
      <p style={{color: 'black'}}>User Profile Fetched: {userProfile ? 'Yes' : 'No'}</p>
      <p style={{color: 'black'}}>User Name: {userProfile?.name || 'N/A (or not fetched)'}</p>
      <p style={{color: 'black'}}>User Role: {userProfile?.role || 'N/A (or not fetched)'}</p>
      <p style={{color: 'black'}}>User Email: {userProfile?.email || 'N/A (or not fetched)'}</p>
      <hr style={{margin: '10px 0', borderColor: 'darkgreen'}} />
      <div style={{ border: '5px solid blue', padding: '10px', marginTop: '10px', backgroundColor: 'lightblue' }}>
        <h2 style={{color: 'black', fontWeight: 'bold'}}>Rendering Children (Actual Page Content) Below:</h2>
        {children}
      </div>
    </div>
  );
}
