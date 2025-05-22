"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import type { Role } from "@/types";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null);

  const handleRoleSelection = async (role: Role) => {
    if (isLoading) return;
    setSelectedRole(role);
    setIsLoading(true);

    // Simulate API call to save role
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Role selected:", role);
    // In a real app, save the role to the database for the current user.

    setIsLoading(false);
    toast({
      title: "Role Selected!",
      description: `You are now registered as a ${role}. Redirecting to dashboard...`,
    });
    router.push("/dashboard");
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
            Your role selection helps us connect you with the right people and resources. This can be changed later if needed (though usually set once).
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
