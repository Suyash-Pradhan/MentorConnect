
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
// Removed: onAuthStateChanged, type User as FirebaseUser - AppLayout handles auth state
import { Skeleton } from "@/components/ui/skeleton";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedRoleForUI, setSelectedRoleForUI] = React.useState<Role | null>(null);

  // AppLayout ensures that this page is only rendered for authenticated users.
  // We can directly use auth.currentUser.

  const handleRoleSelection = async (role: 'student' | 'alumni') => {
    if (isLoading) return;

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      toast({ variant: "destructive", title: "Authentication Error", description: "No authenticated user found. Please try logging in again." });
      // AppLayout should handle redirecting to login if auth state is lost.
      router.push("/login"); // Fallback redirect
      return;
    }

    setSelectedRoleForUI(role);
    setIsLoading(true);

    try {
      const userId = firebaseUser.uid;
      const userEmail = firebaseUser.email || "unknown@example.com";

      let userProfile = await getProfile(userId);

      if (!userProfile) {
        userProfile = {
          id: userId,
          email: userEmail,
          role: role,
          createdAt: new Date(),
          name: firebaseUser.displayName || "",
          avatarUrl: firebaseUser.photoURL || "",
        };
      } else {
        userProfile.role = role;
      }

      if (role === 'student') {
        userProfile.studentProfile = userProfile.studentProfile || await initializeRoleProfile('student') as StudentProfile;
        userProfile.alumniProfile = undefined;
      } else {
        userProfile.alumniProfile = userProfile.alumniProfile || await initializeRoleProfile('alumni') as AlumniProfile;
        userProfile.studentProfile = undefined;
      }
      
      await setProfile(userId, userProfile);

      toast({
        title: "Role Selected!",
        description: `You are now registered as a ${role}. Redirecting to complete your profile...`,
      });
      router.push("/profile?edit=true&from=role_selection"); // Redirect to profile page to complete info

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

  // Show loading skeleton or a message if auth.currentUser is somehow not available yet,
  // though AppLayout should prevent this page from rendering in such a state.
  if (!auth.currentUser && !isLoading) {
    return (
         <div className="flex items-center justify-center w-full py-12">
            <Card className="w-full max-w-lg shadow-xl">
                <CardHeader className="text-center space-y-4">
                    <Skeleton className="mx-auto h-16 w-16 rounded-full" />
                    <Skeleton className="h-8 w-3/4 mx-auto" />
                    <Skeleton className="h-6 w-1/2 mx-auto" />
                </CardHeader>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Loading user information...</p>
                    <Button onClick={() => router.push('/login')} className="mt-4">Go to Login</Button>
                </CardContent>
            </Card>
        </div>
    );
  }


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
            disabled={isLoading}
          >
            {isLoading && selectedRoleForUI === "student" ? (
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
            disabled={isLoading}
          >
            {isLoading && selectedRoleForUI === "alumni" ? (
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
