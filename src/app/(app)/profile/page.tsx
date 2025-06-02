
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation"; // To read query params
import { ViewProfile } from "@/components/profile/view-profile";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import type { Profile } from "@/types";
import { getProfile, setProfile } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/firebase"; // Import Firebase auth instance
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";

const MOCK_CURRENT_USER_ID = "user123_dev";

export default function ProfilePage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [profileData, setProfileData] = React.useState<Profile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [firebaseUser, setFirebaseUser] = React.useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  // For demo purposes if role is not set, allows toggling form view
  const [displayRole, setDisplayRole] = React.useState<'student' | 'alumni'>('student');

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (authLoading) return; // Wait for Firebase auth state to be determined

    const fetchProfileData = async () => {
      setIsLoading(true);
      // For this example, we'll primarily use MOCK_CURRENT_USER_ID for fetching,
      // but use firebaseUser for defaults if profile is new.
      // In a real app, MOCK_CURRENT_USER_ID would be derived from firebaseUser.uid.
      const userIdToFetch = MOCK_CURRENT_USER_ID;

      if (!userIdToFetch) {
        if (firebaseUser) { // If using actual UID and it's somehow null but firebaseUser exists
             toast({ variant: "destructive", title: "Authentication Error", description: "User ID missing but authenticated." });
        } else {
             toast({ variant: "destructive", title: "Error", description: "User not authenticated." });
        }
        setIsLoading(false);
        return;
      }

      try {
        const fetchedProfile = await getProfile(userIdToFetch);
        if (fetchedProfile) {
          setProfileData(fetchedProfile);
          if (fetchedProfile.role) {
            setDisplayRole(fetchedProfile.role as 'student' | 'alumni');
          }
          if (!fetchedProfile.name || searchParams.get('edit') === 'true') {
            setIsEditDialogOpen(true);
            if (!fetchedProfile.name) {
              toast({ title: "Complete Your Profile", description: "Please provide your name and other details."});
            }
          }
        } else { // Profile not found in Firestore
          if (firebaseUser && firebaseUser.uid === userIdToFetch) { // Ensure MOCK_ID matches current auth user if we create a stub
            const defaultNewProfile: Profile = {
              id: firebaseUser.uid,
              email: firebaseUser.email || "error@example.com", // Use actual email
              role: null,
              name: firebaseUser.displayName || "",
              avatarUrl: firebaseUser.photoURL || "",
              createdAt: new Date(),
            };
            setProfileData(defaultNewProfile);
            setIsEditDialogOpen(true);
            toast({ title: "Welcome!", description: "Please complete your profile." });
          } else if (firebaseUser && firebaseUser.uid !== userIdToFetch) {
            // This case means MOCK_CURRENT_USER_ID might be for a different user
            // than the one currently logged in via Firebase Auth.
            // This would be an inconsistent state in a real app.
            console.warn("ProfilePage: MOCK_CURRENT_USER_ID does not match authenticated Firebase user. Displaying empty state or redirecting might be better.");
            setProfileData(null); // Or handle as an error/redirect
            toast({ variant: "destructive", title: "Profile Mismatch", description: "Logged in user does not match profile ID." });
          }
           else { // No Firestore profile and no authenticated Firebase user (or MOCK_ID mismatch)
            toast({ variant: "destructive", title: "Profile Not Found", description: "Could not load profile data." });
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load profile." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [toast, searchParams, authLoading, firebaseUser]);


  const handleSaveProfile = async (data: Partial<Omit<Profile, 'id' | 'createdAt' | 'email'>>) => {
    // Use firebaseUser.uid if available and matches profileData.id, otherwise stick to profileData.id (which might be MOCK_ID)
    const userIdToSave = (firebaseUser && profileData && firebaseUser.uid === profileData.id) ? firebaseUser.uid : profileData?.id;

    if (!profileData || !userIdToSave) {
      toast({ variant: "destructive", title: "Error", description: "Cannot save profile. User data missing."});
      return;
    }
    setIsLoading(true);

    const updatedProfileData: Profile = {
      ...profileData,
      id: userIdToSave, // Ensure ID is correct
      email: (firebaseUser && firebaseUser.uid === userIdToSave) ? firebaseUser.email! : profileData.email!, // Prioritize auth email
      name: data.name || profileData.name,
      avatarUrl: data.avatarUrl || profileData.avatarUrl,
      role: profileData.role,
      studentProfile: profileData.role === 'student' ? {
        college: data.college || profileData.studentProfile?.college || '',
        year: data.year || profileData.studentProfile?.year || 1,
        academicInterests: Array.isArray(data.academicInterests) ? data.academicInterests : (profileData.studentProfile?.academicInterests || []),
        goals: data.goals || profileData.studentProfile?.goals || '',
      } : profileData.studentProfile,
      alumniProfile: profileData.role === 'alumni' ? {
        jobTitle: data.jobTitle || profileData.alumniProfile?.jobTitle || '',
        company: data.company || profileData.alumniProfile?.company || '',
        skills: Array.isArray(data.skills) ? data.skills : (profileData.alumniProfile?.skills || []),
        experienceYears: data.experienceYears || profileData.alumniProfile?.experienceYears || 0,
        education: data.education || profileData.alumniProfile?.education || '',
        industry: data.industry || profileData.alumniProfile?.industry || '',
        linkedinUrl: data.linkedinUrl || profileData.alumniProfile?.linkedinUrl || '',
      } : profileData.alumniProfile,
    };

    try {
      await setProfile(userIdToSave, updatedProfileData);
      setProfileData(updatedProfileData);
      setIsEditDialogOpen(false);
      toast({ title: "Profile Saved", description: "Your profile has been updated." });
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save profile." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDisplayRole = () => {
    setDisplayRole(prev => prev === 'student' ? 'alumni' : 'student');
  };

  if (authLoading || (isLoading && !profileData)) { // Show skeleton if auth is loading OR if data is loading and not yet available
    return (
      <div className="w-full space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="w-full text-center py-10">
        <Icons.warning className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Profile data could not be loaded.</p>
        <p className="text-sm text-muted-foreground">This might be because you're not authenticated or the profile does not exist.</p>
      </div>
    );
  }

  const effectiveRoleForForm = profileData.role || displayRole;
  const profileForForm: Profile = {
      ...profileData,
      role: effectiveRoleForForm,
      studentProfile: effectiveRoleForForm === 'student' ? (profileData.studentProfile || { college: '', year: 0, academicInterests: [], goals: '' }) : undefined,
      alumniProfile: effectiveRoleForForm === 'alumni' ? (profileData.alumniProfile || { jobTitle: '', company: '', skills: [], experienceYears: 0, education: '', industry: '', linkedinUrl: '' }) : undefined,
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <div className="flex items-center gap-2">
          {!profileData.role && firebaseUser && (
            <>
              <span className="text-sm text-muted-foreground">Demo Form View:</span>
              <Button variant="outline" size="sm" onClick={handleToggleDisplayRole}>
                Show {displayRole === 'student' ? 'Alumni' : 'Student'} Fields
              </Button>
            </>
          )}
          {firebaseUser && ( // Only allow editing if a Firebase user is authenticated
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Icons.edit className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] md:max-w-2xl lg:max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Edit Your Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you&apos;re done.
                    {!profileData.name && " Please start by entering your full name."}
                  </DialogDescription>
                </DialogHeader>
                <EditProfileForm
                  profile={profileForForm}
                  onSave={handleSaveProfile}
                  onCancel={() => setIsEditDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <ViewProfile profile={profileData} />
    </div>
  );
}
    