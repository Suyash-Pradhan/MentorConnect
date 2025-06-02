
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { setProfile } from "@/services/profileService"; // getProfile removed
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/firebase"; 
import { useUserProfile } from "@/contexts/user-profile-context"; // Import context hook

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile, profileLoading, profileError, refetchUserProfile } = useUserProfile(); // Use context
  
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  // For demo purposes if role is not set, allows toggling form view
  const [displayRoleForForm, setDisplayRoleForForm] = React.useState<'student' | 'alumni'>('student');
  const [isSaving, setIsSaving] = React.useState(false); // Local loading state for save operation


  React.useEffect(() => {
    if (profileLoading) return; // Wait for context to load profile

    if (userProfile) {
      if (userProfile.role) {
        setDisplayRoleForForm(userProfile.role as 'student' | 'alumni');
      }
      
      const editParam = searchParams.get('edit');
      const fromParam = searchParams.get('from');

      if ( (editParam === 'true' && fromParam === 'dashboard_name_missing' && !userProfile.name) ||
           (editParam === 'true' && fromParam === 'role_selection') || // Always open edit after role selection
           (editParam === 'true' && !fromParam && (!userProfile.name || !userProfile.role) )
         ) {
            setIsEditDialogOpen(true);
            if (fromParam === 'role_selection') {
                toast({ title: "Complete Your Profile", description: "Please fill in your details now that your role is selected."});
            } else if (!userProfile.name && !userProfile.role) {
                toast({ title: "Complete Your Profile", description: "Please provide your name, select your role, and fill in other details."});
            } else if (!userProfile.name) {
                toast({ title: "Complete Your Profile", description: "Please provide your name and other relevant details."});
            } else if (!userProfile.role) { 
                toast({ title: "Select Your Role", description: "Please select your role and complete your profile details."});
            }
      } else if (editParam === 'true' && !fromParam) { // Generic edit request
         setIsEditDialogOpen(true);
      }
    } else if (!profileError) { 
      // Profile is not loading, no error, but userProfile is null - means new user or profile doc missing
      const firebaseUser = auth.currentUser;
      if (firebaseUser) { // Should always be true due to AppLayout
          setIsEditDialogOpen(true); 
          toast({ title: "Welcome!", description: "Please complete your profile by selecting a role and filling in your details." });
      }
    }
  }, [userProfile, profileLoading, profileError, searchParams, router, toast]);


  const handleSaveProfile = async (data: Partial<Omit<Profile, 'id' | 'createdAt' | 'email'>>) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      toast({ variant: "destructive", title: "Error", description: "Not authenticated. Cannot save profile."});
      return;
    }
    
    // Use userProfile from context as the base for the update
    // Or create a default new profile structure if userProfile from context is null
    const baseProfile = userProfile || {
        id: firebaseUser.uid,
        email: firebaseUser.email || "email.not.found@example.com",
        role: null,
        name: firebaseUser.displayName || "",
        avatarUrl: firebaseUser.photoURL || "",
        createdAt: new Date(), // This will be converted to serverTimestamp by setProfile if new
    };

    setIsSaving(true);

    const roleToSave = data.role || baseProfile.role || (baseProfile.role === null ? displayRoleForForm : null);
    if (!roleToSave) {
        toast({ variant: "destructive", title: "Role Required", description: "Please select a role (Student/Alumni) before saving." });
        setIsSaving(false);
        return;
    }
    if (!data.name || data.name.trim() === "") {
        toast({ variant: "destructive", title: "Name Required", description: "Please enter your name before saving." });
        setIsSaving(false);
        return;
    }

    const updatedProfileData: Profile = {
      ...baseProfile, // Spread base profile (either from context or new structure)
      id: firebaseUser.uid, // Ensure ID is from firebaseUser
      email: firebaseUser.email || baseProfile.email!, 
      name: data.name || baseProfile.name,
      avatarUrl: data.avatarUrl || baseProfile.avatarUrl,
      role: roleToSave,
      studentProfile: roleToSave === 'student' ? {
        college: data.college || baseProfile.studentProfile?.college || '',
        year: data.year || baseProfile.studentProfile?.year || 1,
        academicInterests: Array.isArray(data.academicInterests) ? data.academicInterests : (typeof data.academicInterests === 'string' ? data.academicInterests.split(',').map(s=>s.trim()).filter(Boolean) : (baseProfile.studentProfile?.academicInterests || [])),
        goals: data.goals || baseProfile.studentProfile?.goals || '',
      } : undefined, 
      alumniProfile: roleToSave === 'alumni' ? {
        jobTitle: data.jobTitle || baseProfile.alumniProfile?.jobTitle || '',
        company: data.company || baseProfile.alumniProfile?.company || '',
        skills: Array.isArray(data.skills) ? data.skills : (typeof data.skills === 'string' ? data.skills.split(',').map(s=>s.trim()).filter(Boolean) : (baseProfile.alumniProfile?.skills || [])),
        experienceYears: data.experienceYears || baseProfile.alumniProfile?.experienceYears || 0,
        education: data.education || baseProfile.alumniProfile?.education || '',
        industry: data.industry || baseProfile.alumniProfile?.industry || '',
        linkedinUrl: data.linkedinUrl || baseProfile.alumniProfile?.linkedinUrl || '',
      } : undefined, 
      createdAt: baseProfile.createdAt, // Preserve original or new Date for setProfile to handle
    };

    try {
      await setProfile(firebaseUser.uid, updatedProfileData);
      await refetchUserProfile(); // Refetch profile to update context
      setIsEditDialogOpen(false);
      toast({ title: "Profile Saved", description: "Your profile has been updated." });
      
      const currentEdit = searchParams.get('edit');
      const currentFrom = searchParams.get('from');
      if (currentEdit || currentFrom) {
        router.replace('/profile', { scroll: false }); 
      }

    } catch (error) {
      console.error("Failed to save profile:", error);
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save profile." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDisplayRoleForForm = () => {
    const newRole = displayRoleForForm === 'student' ? 'alumni' : 'student';
    setDisplayRoleForForm(newRole);
  };


  if (profileLoading && !userProfile) { 
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
  
  if (profileError) {
     return (
      <div className="w-full text-center py-10">
        <Icons.warning className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Error loading profile data.</p>
        <p className="text-sm text-muted-foreground">AppLayout might have more details on the error.</p>
      </div>
    );
  }
  
  // Construct a profile object for the form, using context profile or a default new structure
  // This ensures EditProfileForm always receives a valid Profile-like structure.
  const profileForViewOrForm = userProfile || {
    id: auth.currentUser?.uid || "temp-id", // Should be available from AppLayout
    email: auth.currentUser?.email || "",
    role: null,
    name: "",
    avatarUrl: "",
    createdAt: new Date(), // Placeholder, will be handled by setProfile
  };
  
  const effectiveRoleForFormFields = userProfile?.role || displayRoleForForm;
  const profileForEditForm: Profile = {
      ...profileForViewOrForm,
      role: effectiveRoleForFormFields, 
      studentProfile: effectiveRoleForFormFields === 'student' 
          ? (profileForViewOrForm.studentProfile || { college: '', year: 1, academicInterests: [], goals: '' }) 
          : undefined,
      alumniProfile: effectiveRoleForFormFields === 'alumni' 
          ? (profileForViewOrForm.alumniProfile || { jobTitle: '', company: '', skills: [], experienceYears: 0, education: '', industry: '', linkedinUrl: '' })
          : undefined,
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <div className="flex items-center gap-2">
          {auth.currentUser && isEditDialogOpen && !userProfile?.role && ( // Show toggle only if role is not yet set in DB
            <>
              <span className="text-sm text-muted-foreground">Form View:</span>
              <Button variant="outline" size="sm" onClick={handleToggleDisplayRoleForForm} disabled={isSaving}>
                Show {displayRoleForForm === 'student' ? 'Alumni' : 'Student'} Fields
              </Button>
            </>
          )}
          {auth.currentUser && ( 
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                setIsEditDialogOpen(open);
                if (!open && (searchParams.get('edit') || !userProfile?.name || !userProfile?.role)) { 
                    router.replace('/profile', { scroll: false }); 
                }
            }}>
              <DialogTrigger asChild>
                <Button disabled={isSaving}>
                  <Icons.edit className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] md:max-w-2xl lg:max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Edit Your Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you&apos;re done.
                    {(!userProfile?.name || !userProfile?.role) && " Please start by entering your full name and selecting your role (Student/Alumni)."}
                  </DialogDescription>
                </DialogHeader>
                <EditProfileForm
                  profile={profileForEditForm} 
                  onSave={handleSaveProfile}
                  onCancel={() => {
                    setIsEditDialogOpen(false);
                    if (searchParams.get('edit') || !userProfile?.name || !userProfile?.role) {
                        router.replace('/profile', { scroll: false });
                    }
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      {userProfile ? <ViewProfile profile={userProfile} /> : 
        <p className="text-center text-muted-foreground py-4">
            {profileLoading ? "Loading profile..." : "Profile data is not available. Please complete your profile if prompted."}
        </p>
      }
    </div>
  );
}
