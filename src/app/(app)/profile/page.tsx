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
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import type { Profile } from "@/types";
import { placeholderUserStudent, placeholderUserAlumni } from "@/lib/placeholders"; // Using placeholder data

// Simulate fetching current user profile. In a real app, this would come from an auth context or API.
// For demonstration, we'll allow switching between a student and alumni profile.
const getMockProfile = (role: 'student' | 'alumni'): Profile => {
  return role === 'student' ? placeholderUserStudent : placeholderUserAlumni;
};


export default function ProfilePage() {
  // Simulate role state, in real app this would come from user session
  const [currentUserRole, setCurrentUserRole] = React.useState<'student' | 'alumni'>('student');
  const [profileData, setProfileData] = React.useState<Profile>(getMockProfile(currentUserRole));
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setProfileData(getMockProfile(currentUserRole));
  }, [currentUserRole]);

  const handleSaveProfile = async (data: any) => {
    // Simulate API call
    console.log("Saving profile:", data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update the local state with the new data
    // This is a simplified update. In a real app, you'd merge carefully or refetch.
    setProfileData(prevProfile => ({
      ...prevProfile,
      name: data.name,
      avatarUrl: data.avatarUrl,
      studentProfile: prevProfile.role === 'student' ? {
        college: data.college,
        year: data.year,
        academicInterests: Array.isArray(data.academicInterests) ? data.academicInterests : data.academicInterests.split(',').map((s:string) => s.trim()).filter(Boolean),
        goals: data.goals,
      } : prevProfile.studentProfile,
      alumniProfile: prevProfile.role === 'alumni' ? {
        jobTitle: data.jobTitle,
        company: data.company,
        skills: Array.isArray(data.skills) ? data.skills : data.skills.split(',').map((s:string) => s.trim()).filter(Boolean),
        experienceYears: data.experienceYears,
        education: data.education,
        industry: data.industry,
      } : prevProfile.alumniProfile,
    }));
    setIsEditDialogOpen(false); // Close dialog on save
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <div className="flex items-center gap-2">
          {/* Temporary role switcher for demo */}
          <span className="text-sm text-muted-foreground">Demo:</span> 
          <Button variant="outline" size="sm" onClick={() => setCurrentUserRole(currentUserRole === 'student' ? 'alumni' : 'student')}>
            Switch to {currentUserRole === 'student' ? 'Alumni' : 'Student'} View
          </Button>
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
                profile={profileData}
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
