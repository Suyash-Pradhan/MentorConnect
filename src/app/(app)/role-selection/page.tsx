
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import type { Role, Profile } from "@/types";
import { getProfile, setProfile, initializeRoleProfile } from "@/services/profileService";

// MOCK: In a real app, this would come from your auth context (e.g., Firebase Auth)
const MOCK_CURRENT_USER_ID = "user123_dev"; // Replace with actual dynamic user ID
const MOCK_CURRENT_USER_EMAIL = "user@example.com"; // Replace with actual dynamic user email


export default function RoleSelectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null);

  const handleRoleSelection = async (role: 'student' | 'alumni') => {
    if (isLoading || !MOCK_CURRENT_USER_ID) {
      toast({ variant: "destructive", title: "Error", description: "User not authenticated or operation in progress." });
      return;
    }
    setSelectedRole(role);
    setIsLoading(true);

    try {
      let userProfile = await getProfile(MOCK_CURRENT_USER_ID);

      if (!userProfile) {
        // If profile doesn't exist, create a basic one
        userProfile = {
          id: MOCK_CURRENT_USER_ID,
          email: MOCK_CURRENT_USER_EMAIL, // TODO: Get from auth
          role: role,
          createdAt: new Date(), // Will be converted to serverTimestamp by setProfile if new
          name: "", // User will fill this in "Edit Profile"
        };
      } else {
        userProfile.role = role;
      }

      // Initialize or update role-specific profile
      if (role === 'student') {
        userProfile.studentProfile = userProfile.studentProfile || initializeRoleProfile('student');
        userProfile.alumniProfile = undefined; // Clear other role's profile
      } else {
        userProfile.alumniProfile = userProfile.alumniProfile || initializeRoleProfile('alumni');
        userProfile.studentProfile = undefined; // Clear other role's profile
      }
      
      await setProfile(MOCK_CURRENT_USER_ID, userProfile);

      toast({
        title: "Role Selected!",
        description: `You are now registered as a ${role}. Redirecting to dashboard...`,
      });
      router.push("/dashboard");

    } catch (error) {
      console.error("Error saving role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your role. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-full py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <Icons.logo className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl">Welcome to MentorConnect!</CardTitle>
          <CardDescription className="text-lg">
            Please select your role to continue. This will help us tailor your experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          <Button
            size="lg"
            className="w-full py-8 text-xl bg-primary hover:bg-primary/90"
            onClick={() => handleRoleSelection("student")}
            disabled={isLoading}
          >
            {isLoading && selectedRole === "student" ? (
              <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Icons.profile className="mr-3 h-6 w-6" />
            )}
            I am a Student
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full py-8 text-xl border-primary text-primary hover:bg-primary/10"
            onClick={() => handleRoleSelection("alumni")}
            disabled={isLoading}
          >
            {isLoading && selectedRole === "alumni" ? (
              <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Icons.myOpportunities className="mr-3 h-6 w-6" />
            )}
            I am an Alumni
          </Button>
        </CardContent>
        <CardFooter className="text-center p-6">
          <p className="text-sm text-muted-foreground">
            Your role selection helps us connect you with the right people and resources.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
