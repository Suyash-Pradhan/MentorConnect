
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
import { uploadImageAction } from "@/actions/uploadActions";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const commonProfileSchemaBase = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50),
  avatarUrl: z.string().url({ message: "Invalid URL for avatar." }).optional().or(z.literal("")),
  bannerUrl: z.string().url({ message: "Invalid URL for banner." }).optional().or(z.literal("")),
});

const studentSpecificSchema = z.object({
  college: z.string().min(3, "College name is required."),
  year: z.coerce.number().min(1, "Year must be a positive number.").max(8),
  academicInterests: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)), 
  goals: z.string().min(10, "Goals must be at least 10 characters.").max(500),
});

const alumniSpecificSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required."),
  company: z.string().min(2, "Company name is required."),
  skills: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)), 
  experienceYears: z.coerce.number().min(0, "Experience cannot be negative.").max(50),
  education: z.string().min(5, "Education details are required."),
  industry: z.string().min(2, "Industry is required."),
  linkedinUrl: z.string().url({ message: "Please enter a valid LinkedIn URL." }).optional().or(z.literal("")),
});

const studentProfileSchema = commonProfileSchemaBase.merge(studentSpecificSchema);
const alumniProfileSchema = commonProfileSchemaBase.merge(alumniSpecificSchema);


type EditProfileFormValues = z.infer<typeof commonProfileSchemaBase> & 
                             Partial<z.infer<typeof studentSpecificSchema>> & 
                             Partial<z.infer<typeof alumniSpecificSchema>>;

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

  const [isUploadingBanner, setIsUploadingBanner] = React.useState(false);
  const [bannerPreview, setBannerPreview] = React.useState<string | null>(profile.bannerUrl || null);
  const bannerFileRef = React.useRef<HTMLInputElement>(null);

  const currentSchema = profile.role === 'student' ? studentProfileSchema : alumniProfileSchema;

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      name: profile.name || "",
      avatarUrl: profile.avatarUrl || "",
      bannerUrl: profile.bannerUrl || "",
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
    setAvatarPreview(form.getValues("avatarUrl") || null);
  }, [form.watch("avatarUrl")]);

  React.useEffect(() => {
    setBannerPreview(form.getValues("bannerUrl") || null);
  }, [form.watch("bannerUrl")]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setImagePreview: React.Dispatch<React.SetStateAction<string | null>>,
    setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
    formField: "avatarUrl" | "bannerUrl",
    imageType: "Avatar" | "Banner"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await uploadImageAction(formData);
      if (result.url) {
        form.setValue(formField, result.url, { shouldValidate: true });
        setImagePreview(result.url);
        toast({ title: `${imageType} Uploaded`, description: `Your new ${imageType.toLowerCase()} has been uploaded.` });
      } else if (result.error) {
        toast({ variant: "destructive", title: "Upload Failed", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Error", description: `An unexpected error occurred during ${imageType.toLowerCase()} upload.` });
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (event.target) event.target.value = "";
    }
  };

  const onSubmit = async (data: EditProfileFormValues) => {
    setIsLoading(true);
    try {
      const saveData: any = { ...data }; // Use any for temp flexibility
      if (profile.role === 'student' && typeof data.academicInterests === 'string') {
        saveData.academicInterests = data.academicInterests.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (profile.role === 'alumni' && typeof data.skills === 'string') {
        saveData.skills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
      }
      
      await onSave(saveData as EditProfileFormValues);
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update profile. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click();
  };
  
  const avatarInitial = profile.name ? profile.name.charAt(0).toUpperCase() : (profile.email ? profile.email.charAt(0).toUpperCase() : "A");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 p-1">
                {/* Banner Image Upload */}
                <FormItem>
                  <FormLabel>Banner Image</FormLabel>
                  <div className="relative group w-full h-48 rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden">
                    {bannerPreview ? (
                      <Image src={bannerPreview} alt="Banner preview" layout="fill" objectFit="cover" data-ai-hint="profile banner background" />
                    ) : (
                      <span className="text-muted-foreground">No banner image</span>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/70 hover:bg-background"
                      onClick={() => triggerFileInput(bannerFileRef)}
                      disabled={isLoading || isUploadingBanner}
                    >
                      {isUploadingBanner ? <Icons.spinner className="h-4 w-4 animate-spin" /> : <Icons.edit className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    ref={bannerFileRef}
                    onChange={(e) => handleImageUpload(e, setBannerPreview, setIsUploadingBanner, "bannerUrl", "Banner")}
                    style={{ display: 'none' }}
                    disabled={isLoading || isUploadingBanner}
                  />
                  <FormDescription>Upload a banner image for your profile (recommended 1200x300px).</FormDescription>
                  <FormField control={form.control} name="bannerUrl" render={({ field }) => <Input type="hidden" {...field} />} />
                  <FormMessage />
                </FormItem>

                {/* Avatar Upload */}
                <FormItem>
                    <FormLabel>Avatar</FormLabel>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border">
                                <AvatarImage src={avatarPreview || undefined} alt={profile.name || "User Avatar"} data-ai-hint="person professional"/>
                                <AvatarFallback className="text-3xl">{avatarInitial}</AvatarFallback>
                            </Avatar>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/70 hover:bg-background h-8 w-8"
                                onClick={() => triggerFileInput(avatarFileRef)}
                                disabled={isLoading || isUploadingAvatar}
                            >
                               {isUploadingAvatar ? <Icons.spinner className="h-4 w-4 animate-spin" /> : <Icons.edit className="h-4 w-4" />}
                            </Button>
                        </div>
                         <Input 
                            type="file" 
                            accept="image/*" 
                            ref={avatarFileRef}
                            onChange={(e) => handleImageUpload(e, setAvatarPreview, setIsUploadingAvatar, "avatarUrl", "Avatar")}
                            style={{ display: 'none' }}
                            disabled={isLoading || isUploadingAvatar}
                        />
                        <div>
                            {(isUploadingAvatar || isUploadingBanner) && <p className="text-sm text-muted-foreground flex items-center"><Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>Uploading...</p>}
                            <FormDescription>Upload a new profile picture (max 5MB, JPG/PNG/GIF/WebP).</FormDescription>
                        </div>
                    </div>
                    <FormField control={form.control} name="avatarUrl" render={({ field }) => <Input type="hidden" {...field} />} />
                    <FormMessage />
                </FormItem>

                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Your full name" {...field} disabled={isLoading || isUploadingAvatar || isUploadingBanner} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                {profile.role === 'student' && (
                <>
                    <FormField control={form.control} name="college" render={({ field }) => (
                        <FormItem><FormLabel>College</FormLabel><FormControl><Input placeholder="Your college name" {...field} disabled={isLoading || isUploadingAvatar || isUploadingBanner} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="year" render={({ field }) => (
                        <FormItem><FormLabel>Year of Study</FormLabel><FormControl><Input type="number" placeholder="E.g., 3" {...field} disabled={isLoading || isUploadingAvatar || isUploadingBanner}/></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="academicInterests" render={({ field }) => (
                        <FormItem><FormLabel>Academic Interests</FormLabel><FormControl><Input placeholder="e.g., AI, Web Development" {...field} disabled={isLoading || isUploadingAvatar || isUploadingBanner}/></FormControl><FormDescription>Comma-separated list.</FormDescription><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="goals" render={({ field }) => (
                        <FormItem><FormLabel>Career Goals</FormLabel><FormControl><Textarea placeholder="Describe your career aspirations..." {...field} disabled={isLoading || isUploadingAvatar || isUploadingBanner}/></FormControl><FormMessage /></FormItem>
                    )}/>
                </>
                )}

                {profile.role === 'alumni' && (
                <>
                    <FormField control={form.control} name="jobTitle" render={({ field }) => (
                        <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input placeholder="e.g., Software Engineer" {...field} disabled={isLoading || isUploadingAvatar || isUploadingBanner}/></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="company" render={({ field }) => (
                        <FormItem><FormLabel>Company</FormLabel><FormControl><Input placeholder="e.g., Google" {...field} disabled={isLoading || isUploadingAvatar || isUploadingBanner}/></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="skills" render={({ field }) => (
                        <FormItem><FormLabel>Skills</FormLabel><FormControl><Input placeholder="e.g., React, Python" {...field} disabled={isLoading || isUploadingAvatar || isUploadingBanner}/></FormControl><FormDescription>Comma-separated list.</FormDescription><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="experienceYears" render={({ field }) => (
                        <FormItem><FormLabel>Years of Experience</FormLabel><FormControl><Input type="number" placeholder="e.g., 5" {...field} disabled={isLoading || isUploadingAvatar || isUploadingBanner}/></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="education" render={({ field }) => (
                        <FormItem><FormLabel>Education</FormLabel><FormControl><Input placeholder="e.g., B.Tech CSE from IIT Delhi" {...field} disabled={isLoading || isUploadingAvatar || isUploadingBanner}/></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="industry" render={({ field }) => (
                        <FormItem><FormLabel>Industry</FormLabel><FormControl><Input placeholder="e.g., Technology, Finance" {...field} disabled={isLoading || isUploadingAvatar || isUploadingBanner}/></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
                        <FormItem><FormLabel>LinkedIn Profile URL</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/yourprofile" {...field} disabled={isLoading || isUploadingAvatar || isUploadingBanner}/></FormControl><FormMessage /></FormItem>
                    )}/>
                </>
                )}
            </div>
        </ScrollArea>
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading || isUploadingAvatar || isUploadingBanner}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isUploadingAvatar || isUploadingBanner}>
            {(isLoading || isUploadingAvatar || isUploadingBanner) && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
