
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
import { uploadImageAction } from "@/actions/uploadActions"; // Import the server action
import Image from "next/image"; // For preview

const commonProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50),
  avatarUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
});

const studentProfileSchema = commonProfileSchema.extend({
  college: z.string().min(3, "College name is required."),
  year: z.coerce.number().min(1, "Year must be a positive number.").max(8),
  academicInterests: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)), 
  goals: z.string().min(10, "Goals must be at least 10 characters.").max(500),
});

const alumniProfileSchema = commonProfileSchema.extend({
  jobTitle: z.string().min(2, "Job title is required."),
  company: z.string().min(2, "Company name is required."),
  skills: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)), 
  experienceYears: z.coerce.number().min(0, "Experience cannot be negative.").max(50),
  education: z.string().min(5, "Education details are required."),
  industry: z.string().min(2, "Industry is required."),
  linkedinUrl: z.string().url({ message: "Please enter a valid LinkedIn URL." }).optional().or(z.literal("")),
});

type EditProfileFormValues = z.infer<typeof commonProfileSchema> & 
                             Partial<z.infer<typeof studentProfileSchema>> & 
                             Partial<z.infer<typeof alumniProfileSchema>>;


interface EditProfileFormProps {
  profile: Profile;
  onSave: (data: EditProfileFormValues) => Promise<void>; 
  onCancel: () => void;
}

export function EditProfileForm({ profile, onSave, onCancel }: EditProfileFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(profile.avatarUrl || null);
  const avatarFileRef = React.useRef<HTMLInputElement>(null);


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
        linkedinUrl: profile.alumniProfile.linkedinUrl || "",
      } : {}),
    },
  });

  React.useEffect(() => {
    // Update preview if avatarUrl in form changes (e.g., after successful upload)
    setAvatarPreview(form.getValues("avatarUrl") || null);
  }, [form.watch("avatarUrl")]);


  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await uploadImageAction(formData);
      if (result.url) {
        form.setValue("avatarUrl", result.url, { shouldValidate: true });
        setAvatarPreview(result.url); // Set preview for immediate feedback
        toast({ title: "Avatar Uploaded", description: "Your new avatar has been uploaded." });
      } else if (result.error) {
        toast({ variant: "destructive", title: "Upload Failed", description: result.error });
        if(avatarFileRef.current) avatarFileRef.current.value = ""; // Clear file input
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Error", description: "An unexpected error occurred during upload." });
      if(avatarFileRef.current) avatarFileRef.current.value = ""; // Clear file input
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const onSubmit = async (data: EditProfileFormValues) => {
    setIsLoading(true);
    try {
      const saveData = { ...data };
      if (profile.role === 'student' && typeof data.academicInterests === 'string') {
        saveData.academicInterests = data.academicInterests.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (profile.role === 'alumni' && typeof data.skills === 'string') {
        saveData.skills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
      }
      
      await onSave(saveData); 
      // Toast is handled by the parent onSave completion
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
                        <Input placeholder="Your full name" {...field} disabled={isLoading || isUploadingAvatar} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <FormItem>
                  <FormLabel>Avatar</FormLabel>
                  <div className="flex items-center gap-4">
                    {avatarPreview && (
                      <Image 
                        src={avatarPreview} 
                        alt="Avatar preview" 
                        width={80} 
                        height={80} 
                        className="rounded-full object-cover"
                        data-ai-hint="person avatar" 
                      />
                    )}
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarUpload}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      disabled={isLoading || isUploadingAvatar}
                      ref={avatarFileRef}
                    />
                  </div>
                  {isUploadingAvatar && <p className="text-sm text-muted-foreground flex items-center"><Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>Uploading...</p>}
                  <FormDescription>Upload a new profile picture (max 5MB, JPG/PNG/GIF/WebP).</FormDescription>
                  <FormField
                    control={form.control}
                    name="avatarUrl"
                    render={({ field }) => ( <FormControl><Input type="hidden" {...field} /></FormControl> )}
                  />
                  <FormMessage />
                </FormItem>


                {profile.role === 'student' && (
                <>
                    <FormField
                    control={form.control}
                    name="college"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>College</FormLabel>
                        <FormControl>
                            <Input placeholder="Your college name" {...field} disabled={isLoading || isUploadingAvatar} />
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
                            <Input type="number" placeholder="E.g., 3" {...field} disabled={isLoading || isUploadingAvatar}/>
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
                            <Input placeholder="e.g., AI, Web Development, Data Science" {...field} disabled={isLoading || isUploadingAvatar}/>
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
                            <Textarea placeholder="Describe your career aspirations..." {...field} disabled={isLoading || isUploadingAvatar}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </>
                )}

                {profile.role === 'alumni' && (
                <>
                    <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Software Engineer" {...field} disabled={isLoading || isUploadingAvatar}/>
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
                            <Input placeholder="e.g., Google" {...field} disabled={isLoading || isUploadingAvatar}/>
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
                            <Input placeholder="e.g., React, Python, Project Management" {...field} disabled={isLoading || isUploadingAvatar}/>
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
                            <Input type="number" placeholder="e.g., 5" {...field} disabled={isLoading || isUploadingAvatar}/>
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
                            <Input placeholder="e.g., B.Tech CSE from IIT Delhi" {...field} disabled={isLoading || isUploadingAvatar}/>
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
                            <Input placeholder="e.g., Technology, Finance" {...field} disabled={isLoading || isUploadingAvatar}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>LinkedIn Profile URL</FormLabel>
                        <FormControl>
                            <Input placeholder="https://linkedin.com/in/yourprofile" {...field} disabled={isLoading || isUploadingAvatar}/>
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading || isUploadingAvatar}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isUploadingAvatar}>
            {(isLoading || isUploadingAvatar) && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
