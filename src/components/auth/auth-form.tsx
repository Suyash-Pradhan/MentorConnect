
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase"; // Import Firebase auth instance
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence 
} from "firebase/auth";
import { getProfile, setProfile } from "@/services/profileService";
import type { Profile } from "@/types";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type UserFormValue = z.infer<typeof formSchema>;

interface AuthFormProps {
  isSignUp?: boolean;
}

export function AuthForm({ isSignUp = false }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: UserFormValue) => {
    setIsLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);

      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const firebaseUser = userCredential.user;

        const newProfile: Profile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || data.email, // Use actual email from auth
          role: null, 
          name: firebaseUser.displayName || "", // Use display name from auth if available, else empty
          avatarUrl: firebaseUser.photoURL || "",
          createdAt: new Date(), 
        };
        await setProfile(firebaseUser.uid, newProfile);

        toast({
          title: "Account Created!",
          description: "You have successfully signed up. Please select your role.",
        });
        router.push("/role-selection");
      } else { // Login
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        const firebaseUser = userCredential.user;

        const userProfile = await getProfile(firebaseUser.uid);

        if (userProfile && userProfile.role) {
          toast({
            title: "Login Successful!",
            description: "Welcome back to MentorConnect.",
          });
          // If name is missing even after login and role is set, guide to profile to complete it.
          if (!userProfile.name) {
            router.push("/profile?edit=true"); // Add a query param to suggest opening edit
          } else {
            router.push("/dashboard");
          }
        } else {
          toast({
            title: "Login Successful!",
            description: "Please select your role to continue.",
          });
           if (!userProfile) {
             const profileToEnsure: Profile = {
                id: firebaseUser.uid,
                email: firebaseUser.email || data.email,
                name: firebaseUser.displayName || "",
                role: null,
                createdAt: new Date(),
             };
             await setProfile(firebaseUser.uid, profileToEnsure);
           }
          router.push("/role-selection");
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code) {
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage = "This email address is already in use.";
            break;
          case "auth/invalid-email":
            errorMessage = "The email address is not valid.";
            break;
          case "auth/operation-not-allowed":
            errorMessage = "Email/password accounts are not enabled.";
            break;
          case "auth/weak-password":
            errorMessage = "The password is too weak.";
            break;
          case "auth/user-disabled":
            errorMessage = "This user account has been disabled.";
            break;
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential":
            errorMessage = "Invalid email or password.";
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      toast({
        variant: "destructive",
        title: isSignUp ? "Sign Up Failed" : "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">{isSignUp ? "Create an Account" : "Welcome Back!"}</CardTitle>
        <CardDescription>
          {isSignUp ? "Enter your email and password to sign up." : "Enter your credentials to access your account."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button disabled={isLoading} className="w-full" type="submit">
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSignUp ? "Sign Up" : "Login"}
            </Button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Login
                  </Link>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="font-medium text-primary hover:underline">
                    Sign Up
                  </Link>
                </>
              )}
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
