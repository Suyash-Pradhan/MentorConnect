
"use client"; 

import type { ReactNode } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import type { Profile, ChatSession } from '@/types';
import { getProfile } from '@/services/profileService';
import { getUserChatSessions } from '@/services/chatService';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfileContext } from '@/contexts/user-profile-context';
import { NotificationsProvider, useNotifications } from '@/contexts/notifications-context'; // Import NotificationsProvider
import { collection, query, where, onSnapshot, Timestamp, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


const FullPageSkeleton = () => (
  <SidebarProvider>
    <div className="flex min-h-screen flex-col w-full">
      <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm h-16 flex items-center">
         <Skeleton className="h-8 w-8 ml-4" />
         <Skeleton className="h-6 w-24 ml-4" />
         <div className="flex-grow" />
         <Skeleton className="h-9 w-9 mr-4 rounded-full" />
      </header>
      <div className="flex flex-1 w-full">
        <aside className="hidden md:block w-16 lg:w-64 border-r p-4 space-y-4">
            {Array.from({length: 5}).map((_,i) => <Skeleton key={i} className="h-8 w-full" />)}
        </aside>
        <main className="flex-grow p-6"><Skeleton className="h-64 w-full" /></main>
      </div>
    </div>
  </SidebarProvider>
);

const FirestoreErrorDisplay = ({ error }: { error: any }) => {
    const firebaseError = error as any;
    let errorTitle = "Application Error";
    let errorMessage = "An unexpected error occurred while trying to load your profile.";
    let troubleshootingSteps: React.ReactNode[] = [];
    
    const displayProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "[Project ID Not Found in Env]";
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
        <li key="step5"><strong>Restart Server & Refresh:</strong> Stop and restart your Next.js development server, then hard refresh your browser.</li>,
        <li key="step6"><strong>Check Project ID:</strong> Ensure <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code> in your <code>.env.local</code> file exactly matches <strong><code>{displayProjectId}</code></strong>.</li>
      ];
    } else if (firebaseError.code === 'unavailable' || (firebaseError.message && firebaseError.message.includes('client is offline'))) {
      errorTitle = "Firestore Client Offline";
      errorMessage = `The application could not connect to Cloud Firestore for project "${displayProjectId}". This might be due to recent API enablement, a network issue, or the Firestore database instance not being fully ready.`;
       troubleshootingSteps = [
        <li key="step1"><strong>If Firestore API was just enabled/Database created:</strong> Please wait 10-20 minutes for the changes to propagate across Google's systems.</li>,
        <li key="step2"><strong>Restart Server & Refresh:</strong> Stop and restart your Next.js development server, then hard refresh your browser.</li>,
        <li key="step3"><strong>Check Network:</strong> Ensure your device has a stable internet connection.</li>,
        <li key="step4"><strong>Verify Setup:</strong> Double-check that the Cloud Firestore API is enabled and a Firestore Database instance exists for project <strong><code>{displayProjectId}</code></strong> using the links above.</li>
      ];
    } else if (error.message && error.message.includes("Firebase Initialization Failed")) {
      errorTitle = "Firebase Configuration Error";
      errorMessage = "The application could not start due to missing Firebase configuration. Please check the server logs for details and ensure all NEXT_PUBLIC_FIREBASE_ environment variables are set in your .env.local file.";
      troubleshootingSteps = [
        <li key="env1">Review your <code>.env.local</code> file at the project root.</li>,
        <li key="env2">Ensure all variables like <code>NEXT_PUBLIC_FIREBASE_API_KEY</code>, <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code>, etc., are correctly defined.</li>,
        <li key="env3">Stop and restart your Next.js development server after making changes to <code>.env.local</code>.</li>,
        <li key="env4">Check the terminal output (server logs) for detailed error messages from the Firebase setup script.</li>
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
            <strong>Raw Error:</strong> {error.message}
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
             <Button onClick={() => window.location.reload()} className="mt-4">Try Reloading</Button>
          </div>
        </div>
      </div>
    );
};

function ChatNotificationsManager({ userId }: { userId: string }) {
  const { addNotification } = useNotifications();
  const lastNotificationCheckTimeRef = React.useRef<Timestamp>(Timestamp.now());

  React.useEffect(() => {
    if (!userId) return;

    // This timestamp helps ignore messages that existed before the listener was set up or were already processed.
    const listenerSetupTime = Timestamp.now();
    lastNotificationCheckTimeRef.current = listenerSetupTime;

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participantIds', 'array-contains', userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "modified" || change.type === "added") {
          const chatSession = { id: change.doc.id, ...change.doc.data() } as ChatSession;
          
          if (chatSession.lastMessageSenderId && 
              chatSession.lastMessageSenderId !== userId && 
              chatSession.lastMessageAt &&
              (chatSession.lastMessageAt as Timestamp).toMillis() > lastNotificationCheckTimeRef.current.toMillis()
             ) {
            
            // Fetch sender's profile for name
            let senderName = "Someone";
            if (chatSession.lastMessageSenderId) {
                const senderProfile = await getProfile(chatSession.lastMessageSenderId);
                senderName = senderProfile?.name || "Someone";
            }

            addNotification({
              type: 'new_message',
              title: `New Message from ${senderName}`,
              text: chatSession.lastMessageText?.substring(0, 50) + (chatSession.lastMessageText && chatSession.lastMessageText.length > 50 ? "..." : "") || "View message",
              chatId: chatSession.id,
              senderName: senderName,
              link: `/chat/${chatSession.id}`,
            });
            // Update ref to prevent re-notifying for this specific message if snapshot fires again quickly
            if (chatSession.lastMessageAt) {
                 lastNotificationCheckTimeRef.current = chatSession.lastMessageAt as Timestamp;
            }
          }
        }
      });
    }, (error) => {
      console.error("Error listening to chat sessions for notifications:", error);
    });

    return () => unsubscribe();
  }, [userId, addNotification]);

  return null; // This component does not render anything
}


export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true); 
  const [profileError, setProfileError] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserProfile = useCallback(async (currentFirebaseUser: FirebaseUser | null) => {
    if (!currentFirebaseUser) {
      setUserProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    try {
      const profile = await getProfile(currentFirebaseUser.uid);
      setUserProfile(profile);
    } catch (e) {
      console.error("[AppLayout] Critical error fetching profile:", e);
      setProfileError(e);
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile(firebaseUser);
  }, [firebaseUser, fetchUserProfile]);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      const publicPaths = ['/login', '/signup', '/']; 
      if (!publicPaths.includes(pathname)) {
        router.push('/login');
      }
    }
  }, [authLoading, firebaseUser, pathname, router]);
  
  const refetchUserProfile = useCallback(async () => {
    await fetchUserProfile(firebaseUser);
  }, [firebaseUser, fetchUserProfile]);


  if (authLoading) {
    return <FullPageSkeleton />;
  }

  if (!firebaseUser) {
    const publicPaths = ['/login', '/signup', '/'];
    if (!publicPaths.includes(pathname)) {
        return <FullPageSkeleton />; 
    }
    return <FullPageSkeleton />; 
  }

  const userProfileContextValue = {
    userProfile,
    profileLoading,
    profileError,
    refetchUserProfile
  };

  return (
    <UserProfileContext.Provider value={userProfileContextValue}>
      <NotificationsProvider> {/* Wrap with NotificationsProvider */}
        {userProfile && <ChatNotificationsManager userId={userProfile.id} />}
        <SidebarProvider>
          <div className="flex min-h-screen flex-col w-full">
            <AppHeader userProfile={userProfile} />
            <div className="flex flex-1 w-full">
              <AppSidebar userProfile={userProfile} />
              <SidebarInset className="p-0">
                {profileLoading ? (
                  <div className="p-4 md:p-6 lg:p-8 w-full h-64 flex items-center justify-center">
                    <Icons.spinner className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : profileError ? (
                  <FirestoreErrorDisplay error={profileError} />
                ) : (
                  <div className="p-4 md:p-6 lg:p-8">
                    {children}
                  </div>
                )}
              </SidebarInset>
            </div>
          </div>
        </SidebarProvider>
      </NotificationsProvider>
    </UserProfileContext.Provider>
  );
}
