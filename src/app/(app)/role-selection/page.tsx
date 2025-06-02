
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import type { Role, Profile, StudentProfile, AlumniProfile } from "@/types";
import { getProfile, setProfile, initializeRoleProfile } from "@/services/profileService";
import { auth } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserProfile } from "@/contexts/user-profile-context";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, profileLoading, profileError, refetchUserProfile } = useUserProfile();
  
  const [isSubmittingRole, setIsSubmittingRole] = React.useState(false); // Renamed from isLoading for clarity
  const [selectedRoleForUISubmit, setSelectedRoleForUISubmit] = React.useState<Role | null>(null); // Renamed

  React.useEffect(() => {
    if (profileLoading) return; // Wait until profile status is known

    if (userProfile && userProfile.role) {
      // User has a profile and a role, they shouldn't be here.
      toast({
        title: "Role Already Selected",
        description: `Redirecting you to the dashboard as your role is already '${userProfile.role}'.`,
      });
      router.push("/dashboard");
    }
    // If profile is loaded but no role, or if there's no profile (new user after auth),
    // the page will render the selection options.
  }, [userProfile, profileLoading, router, toast]);


  const handleRoleSelection = async (role: 'student' | 'alumni') => {
    if (isSubmittingRole) return;

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      toast({ variant: "destructive", title: "Authentication Error", description: "No authenticated user found. Please try logging in again." });
      router.push("/login");
      return;
    }

    setSelectedRoleForUISubmit(role);
    setIsSubmittingRole(true);

    try {
      const userId = firebaseUser.uid;
      const userEmail = firebaseUser.email || "unknown@example.com";

      // Fetch existing profile one more time just before setting, in case context was stale
      // or to ensure we're merging correctly if one was just created by another process.
      let currentProfileData = await getProfile(userId);

      if (!currentProfileData) {
        currentProfileData = {
          id: userId,
          email: userEmail,
          role: role, // Set the new role
          createdAt: new Date(), // Will be converted to serverTimestamp by setProfile logic if new
          name: firebaseUser.displayName || "",
          avatarUrl: firebaseUser.photoURL || "",
          bannerUrl: "",
        };
      } else {
        currentProfileData.role = role; // Update role on existing profile
      }
      
      // Initialize role-specific profile parts
      if (role === 'student') {
        currentProfileData.studentProfile = currentProfileData.studentProfile || await initializeRoleProfile('student') as StudentProfile;
        currentProfileData.alumniProfile = undefined;
      } else { // alumni
        currentProfileData.alumniProfile = currentProfileData.alumniProfile || await initializeRoleProfile('alumni') as AlumniProfile;
        currentProfileData.studentProfile = undefined;
      }
      
      await setProfile(userId, currentProfileData);
      await refetchUserProfile(); // Update the context immediately

      toast({
        title: "Role Selected!",
        description: `You are now registered as a ${role}. Redirecting to complete your profile...`,
      });
      router.push("/profile?edit=true&from=role_selection");

    } catch (error) {
      console.error("Error saving role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your role. Please try again.",
      });
    } finally {
      setIsSubmittingRole(false);
      setSelectedRoleForUISubmit(null);
    }
  };

  // Initial loading state based on context
  if (profileLoading && (!userProfile || !userProfile.role)) {
    return (
      <div className="flex items-center justify-center w-full py-12">
        <Card className="w-full max-w-lg shadow-xl bg-card text-card-foreground">
          <CardHeader className="text-center space-y-4">
            <Icons.logo className="mx-auto h-16 w-16 text-primary mb-4" />
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
          </CardHeader>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Checking your profile status...</p>
            <Skeleton className="h-10 w-32 mx-auto mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileError) {
     return (
      <div className="flex items-center justify-center w-full py-12">
        <Card className="w-full max-w-lg shadow-xl bg-card text-card-foreground">
            <CardHeader className="text-center">
                <Icons.warning className="mx-auto h-12 w-12 text-destructive mb-3"/>
                <CardTitle>Error Loading Profile</CardTitle>
                <CardDescription>We couldn't check your profile status. Please try again or contact support.</CardDescription>
            </CardHeader>
             <CardContent className="p-6 text-center">
                <Button onClick={() => router.push('/login')}>Back to Login</Button>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  // If userProfile exists and has a role, the useEffect above should have redirected.
  // This rendering part is for when profile is loaded but no role, or no profile at all (new user).
  return (
    <div className="flex items-center justify-center w-full py-12"> 
      <Card className="w-full max-w-lg shadow-xl bg-card text-card-foreground">
        <CardHeader className="text-center">
          <Icons.logo className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl">Confirm Your Role</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Please select your role to continue. This will help us tailor your experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          <Button
            size="lg"
            className="w-full py-8 text-xl bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => handleRoleSelection("student")}
            disabled={isSubmittingRole}
          >
            {isSubmittingRole && selectedRoleForUISubmit === "student" ? (
              <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Icons.profile className="mr-3 h-6 w-6" />
            )}
            I am a Student
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full py-8 text-xl border-primary text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => handleRoleSelection("alumni")}
            disabled={isSubmittingRole}
          >
            {isSubmittingRole && selectedRoleForUISubmit === "alumni" ? (
              <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Icons.myOpportunities className="mr-3 h-6 w-6" />
            )}
            I am an Alumni
          </Button>
        </CardContent>
        <CardFooter className="text-center p-6">
          <p className="text-sm text-muted-foreground">
            Your role selection helps us connect you with the right people and resources. You can complete your profile details on the next page.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
