"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/icons";
import type { Profile, Role, StudentProfile, AlumniProfile } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const commonProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50),
  // email: z.string().email(), // Email is usually not editable or handled separately
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

const studentProfileSchema = commonProfileSchema.extend({
  college: z.string().min(3, "College name is required."),
  year: z.coerce.number().min(1, "Year must be a positive number.").max(8),
  academicInterests: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)), // comma-separated string to array
  goals: z.string().min(10, "Goals must be at least 10 characters.").max(500),
});

const alumniProfileSchema = commonProfileSchema.extend({
  jobTitle: z.string().min(2, "Job title is required."),
  company: z.string().min(2, "Company name is required."),
  skills: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)), // comma-separated string to array
  experienceYears: z.coerce.number().min(0, "Experience cannot be negative.").max(50),
  education: z.string().min(5, "Education details are required."),
  industry: z.string().min(2, "Industry is required."),
});

type EditProfileFormValues = z.infer<typeof commonProfileSchema> & 
                             Partial<z.infer<typeof studentProfileSchema>> & 
                             Partial<z.infer<typeof alumniProfileSchema>>;


interface EditProfileFormProps {
  profile: Profile;
  onSave: (data: EditProfileFormValues) => Promise<void>; // Simulate save
  onCancel: () => void;
}

export function EditProfileForm({ profile, onSave, onCancel }: EditProfileFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const currentSchema = profile.role === 'student' ? studentProfileSchema : alumniProfileSchema;

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      name: profile.name || "",
      avatarUrl: profile.avatarUrl || "",
      ...(profile.role === 'student' && profile.studentProfile ? {
        ...profile.studentProfile,
        academicInterests: profile.studentProfile.academicInterests.join(', '),
      } : {}),
      ...(profile.role === 'alumni' && profile.alumniProfile ? {
        ...profile.alumniProfile,
        skills: profile.alumniProfile.skills.join(', '),
      } : {}),
    },
  });

  const onSubmit = async (data: EditProfileFormValues) => {
    setIsLoading(true);
    try {
      // Transform comma-separated strings back to arrays for specific fields
      const saveData = { ...data };
      if (profile.role === 'student' && typeof data.academicInterests === 'string') {
        saveData.academicInterests = data.academicInterests.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (profile.role === 'alumni' && typeof data.skills === 'string') {
        saveData.skills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
      }
      
      await onSave(saveData); // Call the passed onSave function
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update profile. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 p-1">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                        <Input placeholder="https://example.com/avatar.png" {...field} />
                    </FormControl>
                    <FormDescription>Link to your profile picture.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {/* Student Specific Fields */}
                {profile.role === 'student' && (
                <>
                    <FormField
                    control={form.control}
                    name="college"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>College</FormLabel>
                        <FormControl>
                            <Input placeholder="Your college name" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Year of Study</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="E.g., 3" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="academicInterests"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Academic Interests</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., AI, Web Development, Data Science" {...field} />
                        </FormControl>
                        <FormDescription>Comma-separated list of interests.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="goals"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Career Goals</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Describe your career aspirations..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </>
                )}

                {/* Alumni Specific Fields */}
                {profile.role === 'alumni' && (
                <>
                    <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Software Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Google" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Skills</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., React, Python, Project Management" {...field} />
                        </FormControl>
                        <FormDescription>Comma-separated list of skills.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="experienceYears"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 5" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Education</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., B.Tech CSE from IIT Delhi" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Technology, Finance" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </>
                )}
            </div>
        </ScrollArea>
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
