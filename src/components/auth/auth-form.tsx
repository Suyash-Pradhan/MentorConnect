
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
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getProfile, setProfile } from "@/services/profileService";
import type { Profile } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

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
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = React.useState("");
  const [isResetLoading, setIsResetLoading] = React.useState(false);

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
          email: firebaseUser.email || data.email,
          role: null,
          name: firebaseUser.displayName || "", 
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
        await signInWithEmailAndPassword(auth, data.email, data.password);
        // On successful Firebase login, redirect to dashboard.
        // DashboardPage and AppLayout will handle fetching profile and further redirection if needed.
        toast({
          title: "Login Successful!",
          description: "Welcome back! Redirecting to your dashboard...",
        });
        router.push("/dashboard");
      }
    } catch (error: any) {
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
            errorMessage = "Email/password accounts are not enabled. Check Firebase console.";
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
          case "auth/invalid-api-key":
            errorMessage = "Firebase API Key is invalid. Please check your app configuration and ensure your .env.local file is correctly set up and the server was restarted.";
            console.error("Authentication error: Firebase API Key is invalid.", error);
            break;
          default:
             if (error.code !== 'auth/popup-closed-by-user') {
                 console.error("Email/Password Auth error:", error);
             }
            errorMessage = error.message || errorMessage;
        }
      } else {
        console.error("Non-Firebase authentication error:", error);
      }
      toast({
        variant: "destructive",
        title: isSignUp ? "Sign Up Failed" : "Login Failed",
        description: errorMessage,
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetRequest = async () => {
    if (!forgotPasswordEmail.trim()) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your email address." });
      return;
    }
    setIsResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotPasswordEmail.trim());
      toast({ title: "Password Reset Email Sent", description: "If an account exists for this email, a reset link has been sent." });
      setIsForgotPasswordOpen(false);
      setForgotPasswordEmail("");
    } catch (error: any) {
      let Fmessage = "Failed to send password reset email. Please try again.";
      if (error.code === "auth/user-not-found") {
          Fmessage = "No user found with this email address.";
      } else if (error.code === "auth/invalid-email") {
          Fmessage = "The email address is not valid.";
      } else {
        console.error("Password reset error:", error);
      }
      toast({ variant: "destructive", title: "Error", description: Fmessage, duration: 7000 });
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      
      toast({
        title: "Signed in with Google!",
        description: "Redirecting to your dashboard...",
      });
      router.push("/dashboard");

    } catch (error: any) {
      let gMessage = "Could not sign in with Google. Please try again.";
      console.error("Google Sign-In detailed error:", error); // Log the full error object

      if (error.code) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            gMessage = "Google Sign-In cancelled by user.";
            break;
          case 'auth/operation-not-allowed':
          case 'auth/unauthorized-domain':
            gMessage = "Google Sign-In is not configured correctly for this app. Please check Firebase console (Authentication providers & Authorized Domains).";
            break;
          case 'auth/cancelled-popup-request':
          case 'auth/popup-blocked':
          case 'auth/popup-blocked-by-browser':
            gMessage = "Google Sign-In popup was blocked or cancelled. Please disable popup blockers for this site and try again.";
            break;
          case 'auth/invalid-credential':
             gMessage = "Invalid credential for Google Sign-In. Check Firebase project setup and API key configurations.";
             break;
          case 'auth/account-exists-with-different-credential':
            gMessage = "An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.";
            break;
          case 'auth/invalid-api-key':
            gMessage = "Firebase API Key is invalid for Google Sign-In. Please check your app configuration and ensure it's correctly set up in Google Cloud Console and .env.local.";
            break;
          default:
            gMessage = `An unexpected error occurred with Google Sign-In: ${error.message || error.code || 'Unknown error'}`;
        }
      }
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: gMessage, duration: 7000 });
    } finally {
      setIsGoogleLoading(false);
    }
  };


  return (
    <>
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
                        disabled={isLoading || isGoogleLoading}
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
                      <Input type="password" placeholder="••••••••" disabled={isLoading || isGoogleLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isSignUp && (
                <div className="text-right text-sm">
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 h-auto font-normal text-muted-foreground hover:text-primary"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    disabled={isLoading || isGoogleLoading}
                  >
                    Forgot Password?
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button disabled={isLoading || isGoogleLoading} className="w-full" type="submit">
                {(isLoading) && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSignUp ? "Sign Up" : "Login"}
              </Button>

              <div className="relative w-full">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">OR</span>
              </div>

              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.google className="mr-2 h-4 w-4" />
                )}
                Sign in with Google
              </Button>

              <p className="mt-2 text-center text-sm text-muted-foreground">
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

      <AlertDialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Your Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your email address associated with your account, and we&apos;ll send you a link to reset your password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <FormLabel htmlFor="forgot-email">Email</FormLabel>
            <Input
              id="forgot-email"
              type="email"
              placeholder="name@example.com"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              disabled={isResetLoading}
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetLoading} onClick={() => { setForgotPasswordEmail(""); setIsForgotPasswordOpen(false); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordResetRequest} disabled={isResetLoading || !forgotPasswordEmail.trim()}>
              {isResetLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
