
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import type { Role, Profile, StudentProfile, AlumniProfile } from "@/types";
import { getProfile, setProfile, initializeRoleProfile } from "@/services/profileService";
import { auth } from "@/lib/firebase"; // Import Firebase auth instance
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedRoleForUI, setSelectedRoleForUI] = React.useState<Role | null>(null); // For UI feedback during async op

  const [firebaseUser, setFirebaseUser] = React.useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
      } else {
        setFirebaseUser(null);
        toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in to select a role." });
        router.push("/login"); // Redirect if not authenticated
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router, toast]);

  const handleRoleSelection = async (role: 'student' | 'alumni') => {
    if (isLoading) return; // Prevent multiple submissions
    
    if (!firebaseUser) {
      toast({ variant: "destructive", title: "Authentication Error", description: "No authenticated user found. Please try logging in again." });
      setIsLoading(false);
      router.push("/login");
      return;
    }

    setSelectedRoleForUI(role);
    setIsLoading(true);

    try {
      const userId = firebaseUser.uid;
      const userEmail = firebaseUser.email || "unknown@example.com"; // Fallback

      let userProfile = await getProfile(userId);

      if (!userProfile) {
        // This case should ideally be handled by signup creating a profile
        // But as a fallback, create one now.
        userProfile = {
          id: userId,
          email: userEmail,
          role: role, // Set the role directly
          createdAt: new Date(), 
          name: firebaseUser.displayName || "",
          avatarUrl: firebaseUser.photoURL || "",
        };
      } else {
        // Profile exists, just update the role
        userProfile.role = role;
      }

      // Initialize role-specific profile
      if (role === 'student') {
        userProfile.studentProfile = userProfile.studentProfile || await initializeRoleProfile('student') as StudentProfile;
        userProfile.alumniProfile = undefined; // Clear other role profile
      } else { // alumni
        userProfile.alumniProfile = userProfile.alumniProfile || await initializeRoleProfile('alumni') as AlumniProfile;
        userProfile.studentProfile = undefined; // Clear other role profile
      }
      
      await setProfile(userId, userProfile);

      toast({
        title: "Role Selected!",
        description: `You are now registered as a ${role}. Redirecting to your profile...`,
      });
      router.push("/profile"); // Redirect to profile page to complete info

    } catch (error) {
      console.error("Error saving role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your role. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setSelectedRoleForUI(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center w-full py-12">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center space-y-4">
            <Skeleton className="mx-auto h-16 w-16 rounded-full" />
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
          <CardFooter className="p-6"><Skeleton className="h-4 w-full" /></CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full py-12"> 
      <Card className="w-full max-w-lg shadow-xl bg-card text-card-foreground">
        <CardHeader className="text-center">
          <Icons.logo className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl">Welcome to MentorConnect!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Please select your role to continue. This will help us tailor your experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          <Button
            size="lg"
            className="w-full py-8 text-xl bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => handleRoleSelection("student")}
            disabled={isLoading}
          >
            {isLoading && selectedRoleForUI === "student" ? (
              <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Icons.profile className="mr-3 h-6 w-6" /> // Changed icon to be more generic
            )}
            I am a Student
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full py-8 text-xl border-primary text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => handleRoleSelection("alumni")}
            disabled={isLoading}
          >
            {isLoading && selectedRoleForUI === "alumni" ? (
              <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Icons.myOpportunities className="mr-3 h-6 w-6" /> // Kept Briefcase for Alumni
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
