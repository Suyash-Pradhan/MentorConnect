
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
    if (!MOCK_CURRENT_USER_ID || !MOCK_CURRENT_USER_EMAIL) {
      toast({ variant: "destructive", title: "Configuration Error", description: "Mock user ID or email is not properly configured for this page." });
      setIsLoading(false); // Ensure loading state is reset
      return;
    }
    if (isLoading) { 
      toast({ variant: "destructive", title: "Error", description: "Operation already in progress." });
      return;
    }
    setSelectedRole(role);
    setIsLoading(true);

    try {
      let userProfile = await getProfile(MOCK_CURRENT_USER_ID);

      if (!userProfile) {
        userProfile = {
          id: MOCK_CURRENT_USER_ID,
          email: MOCK_CURRENT_USER_EMAIL, 
          role: role,
          createdAt: new Date(), 
          name: "", 
        };
      } else {
        userProfile.role = role;
      }

      if (role === 'student') {
        userProfile.studentProfile = userProfile.studentProfile || await initializeRoleProfile('student');
        userProfile.alumniProfile = undefined; 
      } else {
        userProfile.alumniProfile = userProfile.alumniProfile || await initializeRoleProfile('alumni');
        userProfile.studentProfile = undefined; 
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
    // Removed debug-like styling from this div (border-4 border-red-500 bg-yellow-100)
    // AuthLayout already provides centering and min-h-screen
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
            className="w-full py-8 text-xl border-primary text-primary hover:bg-primary/10 hover:text-primary"
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
