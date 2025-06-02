
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation"; // Added useRouter
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
import type { Profile, StudentProfile, AlumniProfile } from "@/types";
import { getProfile, setProfile } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/firebase"; 
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
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
      if (!user) {
        // If user logs out or is not authenticated, redirect to login
        router.push('/login'); 
      }
    });
    return () => unsubscribe();
  }, [router]);

  React.useEffect(() => {
    if (authLoading) return; // Wait for Firebase auth state

    const fetchProfileData = async () => {
      setIsLoading(true);

      if (!firebaseUser) { 
        toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in to view your profile." });
        setProfileData(null); 
        setIsLoading(false);
        router.push('/login');
        return;
      }

      const userIdToFetch = firebaseUser.uid; 

      try {
        const fetchedProfile = await getProfile(userIdToFetch);
        if (fetchedProfile) {
          setProfileData(fetchedProfile);
          if (fetchedProfile.role) {
            setDisplayRole(fetchedProfile.role as 'student' | 'alumni');
          }
          // Auto-open dialog if name or role is missing for an existing profile
          if ((!fetchedProfile.name || !fetchedProfile.role) && searchParams.get('edit') !== 'false') {
            setIsEditDialogOpen(true);
            if (!fetchedProfile.name && !fetchedProfile.role) {
                 toast({ title: "Complete Your Profile", description: "Please provide your name, select your role, and fill in other details."});
            } else if (!fetchedProfile.name) {
              toast({ title: "Complete Your Profile", description: "Please provide your name and other relevant details."});
            } else { // Only role missing (name must be present)
              toast({ title: "Select Your Role", description: "Please select your role and complete your profile details."});
            }
          } else if (searchParams.get('edit') === 'true') { // Or if URL explicitly requests edit
             setIsEditDialogOpen(true);
          }
        } else { 
          // No profile in Firestore yet (e.g., first login after signup, especially with Google)
          const defaultNewProfile: Profile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "email.not.found@example.com", 
            role: null, 
            name: firebaseUser.displayName || "",
            avatarUrl: firebaseUser.photoURL || "",
            createdAt: new Date(), 
          };
          setProfileData(defaultNewProfile);
          setIsEditDialogOpen(true); 
          toast({ title: "Welcome!", description: "Please complete your profile by selecting a role and filling in your details." });
        }
      } catch (error) {
        console.error("Failed to fetch/create profile:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load your profile." });
        setProfileData(null); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [firebaseUser, authLoading, toast, searchParams, router]);


  const handleSaveProfile = async (data: Partial<Omit<Profile, 'id' | 'createdAt' | 'email'>>) => {
    if (!firebaseUser) {
      toast({ variant: "destructive", title: "Error", description: "Not authenticated. Cannot save profile."});
      return;
    }
    const userIdToSave = firebaseUser.uid;

    if (!profileData) {
        toast({ variant: "destructive", title: "Error", description: "Profile data is missing. Cannot save."});
        return;
    }
    
    setIsLoading(true);

    const roleToSave = data.role || profileData.role || (profileData.role === null ? displayRole : null);
    if (!roleToSave) {
        toast({ variant: "destructive", title: "Role Required", description: "Please select a role (Student/Alumni) before saving." });
        setIsLoading(false);
        return;
    }
    if (!data.name || data.name.trim() === "") {
        toast({ variant: "destructive", title: "Name Required", description: "Please enter your name before saving." });
        setIsLoading(false);
        return;
    }


    const updatedProfileData: Profile = {
      ...profileData,
      id: userIdToSave, 
      email: firebaseUser.email || profileData.email!, 
      name: data.name || profileData.name,
      avatarUrl: data.avatarUrl || profileData.avatarUrl,
      role: roleToSave,
      studentProfile: roleToSave === 'student' ? {
        college: data.college || profileData.studentProfile?.college || '',
        year: data.year || profileData.studentProfile?.year || 1,
        academicInterests: Array.isArray(data.academicInterests) ? data.academicInterests : (typeof data.academicInterests === 'string' ? data.academicInterests.split(',').map(s=>s.trim()).filter(Boolean) : (profileData.studentProfile?.academicInterests || [])),
        goals: data.goals || profileData.studentProfile?.goals || '',
      } : undefined, 
      alumniProfile: roleToSave === 'alumni' ? {
        jobTitle: data.jobTitle || profileData.alumniProfile?.jobTitle || '',
        company: data.company || profileData.alumniProfile?.company || '',
        skills: Array.isArray(data.skills) ? data.skills : (typeof data.skills === 'string' ? data.skills.split(',').map(s=>s.trim()).filter(Boolean) : (profileData.alumniProfile?.skills || [])),
        experienceYears: data.experienceYears || profileData.alumniProfile?.experienceYears || 0,
        education: data.education || profileData.alumniProfile?.education || '',
        industry: data.industry || profileData.alumniProfile?.industry || '',
        linkedinUrl: data.linkedinUrl || profileData.alumniProfile?.linkedinUrl || '',
      } : undefined, 
    };

    try {
      await setProfile(userIdToSave, updatedProfileData);
      setProfileData(updatedProfileData); 
      setDisplayRole(roleToSave as 'student' | 'alumni'); 
      setIsEditDialogOpen(false);
      toast({ title: "Profile Saved", description: "Your profile has been updated." });
      if (searchParams.get('edit') === 'true' || !updatedProfileData.name || !updatedProfileData.role) {
        router.replace('/profile', { scroll: false });
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save profile." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDisplayRole = () => {
    const newRole = displayRole === 'student' ? 'alumni' : 'student';
    setDisplayRole(newRole);
  };


  if (authLoading || (isLoading && !profileData && firebaseUser)) { 
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
  
  if (!firebaseUser && !authLoading) {
    return (
      <div className="w-full text-center py-10">
        <Icons.warning className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">You need to be logged in to view this page.</p>
        <Button onClick={() => router.push('/login')} className="mt-4">Go to Login</Button>
      </div>
    );
  }

  if (!profileData && !isLoading) { 
    return (
      <div className="w-full text-center py-10">
        <Icons.warning className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Profile data could not be loaded.</p>
         <p className="text-sm text-muted-foreground">There might have been an issue fetching your information.</p>
      </div>
    );
  }
  
  if (!profileData) {
      return <Skeleton className="h-[500px] w-full" />; 
  }

  const effectiveRoleForForm = profileData.role || displayRole;
  const profileForForm: Profile = {
      ...profileData,
      role: effectiveRoleForForm, 
      studentProfile: effectiveRoleForForm === 'student' 
          ? (profileData.studentProfile || { college: '', year: 1, academicInterests: [], goals: '' }) 
          : undefined,
      alumniProfile: effectiveRoleForForm === 'alumni' 
          ? (profileData.alumniProfile || { jobTitle: '', company: '', skills: [], experienceYears: 0, education: '', industry: '', linkedinUrl: '' })
          : undefined,
  };


  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <div className="flex items-center gap-2">
          {profileData.role === null && firebaseUser && isEditDialogOpen && (
            <>
              <span className="text-sm text-muted-foreground">Form View:</span>
              <Button variant="outline" size="sm" onClick={handleToggleDisplayRole}>
                Show {displayRole === 'student' ? 'Alumni' : 'Student'} Fields
              </Button>
            </>
          )}
          {firebaseUser && ( 
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                setIsEditDialogOpen(open);
                if (!open && (searchParams.get('edit') || !profileData.name || !profileData.role)) { 
                    router.replace('/profile', { scroll: false }); 
                }
            }}>
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
                    {(profileData.role === null || !profileData.name) && " Please start by entering your full name and selecting your role (Student/Alumni)."}
                  </DialogDescription>
                </DialogHeader>
                <EditProfileForm
                  profile={profileForForm} 
                  onSave={handleSaveProfile}
                  onCancel={() => {
                    setIsEditDialogOpen(false);
                    if (searchParams.get('edit') || !profileData.name || !profileData.role) {
                        router.replace('/profile', { scroll: false });
                    }
                  }}
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
    

    
