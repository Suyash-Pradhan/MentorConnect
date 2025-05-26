
"use client";

import * as React from "react";
import { ViewProfile } from "@/components/profile/view-profile";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import type { Profile } from "@/types";
import { getProfile, setProfile } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton"; // Added Skeleton

// MOCK: In a real app, this would come from your auth context (e.g., Firebase Auth)
const MOCK_CURRENT_USER_ID = "user123_dev"; // Replace with actual dynamic user ID

export default function ProfilePage() {
  const { toast } = useToast();
  const [profileData, setProfileData] = React.useState<Profile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  
  // MOCK: Simulate role state. In a real app, this would primarily come from the fetched profileData.
  // This is only here for the demo "Switch View" button if needed, but profileData.role should be the source of truth.
  const [displayRole, setDisplayRole] = React.useState<'student' | 'alumni'>('student'); 

  React.useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      // TODO: Replace MOCK_CURRENT_USER_ID with actual authenticated user ID
      if (!MOCK_CURRENT_USER_ID) {
        toast({ variant: "destructive", title: "Error", description: "User not authenticated." });
        setIsLoading(false);
        // Potentially redirect to login
        return;
      }
      try {
        const fetchedProfile = await getProfile(MOCK_CURRENT_USER_ID);
        if (fetchedProfile) {
          setProfileData(fetchedProfile);
          if (fetchedProfile.role) {
            setDisplayRole(fetchedProfile.role as 'student' | 'alumni');
          }
        } else {
          // Profile doesn't exist, maybe create a default one or guide user
          // For now, let's assume a new user might not have a full profile yet.
          // We could initialize a default local state or prompt creation.
          // For this example, we'll set a minimal profile if none is found,
          // assuming the user will fill it out.
           const defaultNewProfile: Profile = {
            id: MOCK_CURRENT_USER_ID,
            email: "new.user@example.com", // TODO: Get from auth
            role: null, // Role will be set via role-selection or first edit
            createdAt: new Date(), // Temp, will be serverTimestamp on save
          };
          setProfileData(defaultNewProfile);
          toast({ title: "Welcome!", description: "Please complete your profile." });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load profile." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [toast]);


  const handleSaveProfile = async (data: Partial<Omit<Profile, 'id' | 'createdAt' | 'email'>>) => {
    if (!profileData || !MOCK_CURRENT_USER_ID) {
      toast({ variant: "destructive", title: "Error", description: "Cannot save profile. User data missing."});
      return;
    }
    setIsLoading(true); // For save operation
    
    const updatedProfileData: Profile = {
      ...profileData, // Spread existing profile to retain id, email, createdAt
      name: data.name || profileData.name,
      avatarUrl: data.avatarUrl || profileData.avatarUrl,
      role: profileData.role, // Role shouldn't be changed here, but in role-selection
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
      } : profileData.alumniProfile,
      // Note: 'id' and 'email' are not typically part of the form data sent for update
      // 'createdAt' should be preserved or handled by backend/service layer on first creation
    };

    try {
      await setProfile(MOCK_CURRENT_USER_ID, updatedProfileData);
      setProfileData(updatedProfileData); // Update local state with potentially transformed data (e.g. Timestamps from service)
      setIsEditDialogOpen(false);
      toast({ title: "Profile Saved", description: "Your profile has been updated." });
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save profile." });
    } finally {
      setIsLoading(false); // For save operation
    }
  };

  // Temporary role switcher for demo purposes if profile is not fully loaded or has no role.
  // In a real app, role is part of the profile data and not switched arbitrarily here.
  const handleToggleDisplayRole = () => {
    setDisplayRole(prev => prev === 'student' ? 'alumni' : 'student');
    // This is just for the "Switch View" button for testing the form.
    // Ideally, the form shown is based on profileData.role
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 space-y-6">
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
      <div className="container mx-auto py-8 px-4 md:px-6 text-center">
        <p>No profile data found. You might need to log in or complete initial setup.</p>
         {/* TODO: Add button to go to login or role selection if appropriate */}
      </div>
    );
  }
  
  // Determine which profile type to pass to EditProfileForm based on actual role or displayRole for form structure
  const effectiveRoleForForm = profileData.role || displayRole;
  const profileForForm: Profile = {
      ...profileData,
      role: effectiveRoleForForm, // Ensure the form sees the role we want it to render for
      studentProfile: effectiveRoleForForm === 'student' ? (profileData.studentProfile || { college: '', year: 0, academicInterests: [], goals: '' }) : undefined,
      alumniProfile: effectiveRoleForForm === 'alumni' ? (profileData.alumniProfile || { jobTitle: '', company: '', skills: [], experienceYears: 0, education: '', industry: '' }) : undefined,
  };


  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <div className="flex items-center gap-2">
          {!profileData.role && ( // Show role switcher only if role is not yet set in actual profile
            <>
              <span className="text-sm text-muted-foreground">Demo Form:</span> 
              <Button variant="outline" size="sm" onClick={handleToggleDisplayRole}>
                Switch to {displayRole === 'student' ? 'Alumni' : 'Student'} Form
              </Button>
            </>
          )}
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
                </DialogDescription>
              </DialogHeader>
              <EditProfileForm
                profile={profileForForm} // Pass the potentially adjusted profile for form structure
                onSave={handleSaveProfile}
                onCancel={() => setIsEditDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <ViewProfile profile={profileData} />
    </div>
  );
}
