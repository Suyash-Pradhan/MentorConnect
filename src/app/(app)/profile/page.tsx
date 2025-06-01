
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import type { Profile } from "@/types";
import { getProfile, setProfile } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const MOCK_CURRENT_USER_ID = "user123_dev"; 

export default function ProfilePage() {
  const { toast } = useToast();
  const [profileData, setProfileData] = React.useState<Profile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  
  const [displayRole, setDisplayRole] = React.useState<'student' | 'alumni'>('student'); 

  React.useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      if (!MOCK_CURRENT_USER_ID) {
        toast({ variant: "destructive", title: "Error", description: "User not authenticated." });
        setIsLoading(false);
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
           const defaultNewProfile: Profile = {
            id: MOCK_CURRENT_USER_ID,
            email: "new.user@example.com", 
            role: null, 
            createdAt: new Date(), 
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
    setIsLoading(true); 
    
    const updatedProfileData: Profile = {
      ...profileData, 
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
        linkedinUrl: data.linkedinUrl || profileData.alumniProfile?.linkedinUrl || '', // Save LinkedIn URL
      } : profileData.alumniProfile,
    };

    try {
      await setProfile(MOCK_CURRENT_USER_ID, updatedProfileData);
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
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <div className="flex items-center gap-2">
          {!profileData.role && ( 
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
                profile={profileForForm} 
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
