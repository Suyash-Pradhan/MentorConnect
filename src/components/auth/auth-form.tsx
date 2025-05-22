"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Changed from "next/navigation"

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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);

    // This is where you would integrate with your actual authentication service (e.g., Firebase)
    if (isSignUp) {
      // Handle sign up
      console.log("Sign up data:", data);
      toast({
        title: "Account Created!",
        description: "You have successfully signed up. Redirecting to role selection...",
      });
      // On actual successful signup & login, redirect to role selection if new user, or dashboard
      router.push("/role-selection"); // Simulate new user flow
    } else {
      // Handle login
      console.log("Login data:", data);
      // Simulate a login scenario where role is already selected
      const userHasSelectedRole = Math.random() > 0.5; // Simulate if role is selected
      if (userHasSelectedRole) {
         toast({
          title: "Login Successful!",
          description: "Welcome back to MentorConnect.",
        });
        router.push("/dashboard");
      } else {
        toast({
          title: "Login Successful!",
          description: "Please select your role to continue.",
        });
        router.push("/role-selection");
      }
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
