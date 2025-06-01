
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { createPost } from "@/services/postService";
import type { Profile, Post } from "@/types";
import { getProfile } from "@/services/profileService"; // To get current user for author details
import { Skeleton } from "@/components/ui/skeleton";

// MOCK: In a real app, this would come from your auth context (e.g., Firebase Auth)
const MOCK_CURRENT_USER_ID = "user123_dev"; // Changed from "alumni456" to align with global mock

const postFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100),
  content: z.string().min(10, "Content must be at least 10 characters.").max(5000),
  category: z.string().min(2, "Category is required.").max(50),
  tags: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
  imageUrl: z.string().url("Invalid URL format for image.").optional().or(z.literal("")),
  videoUrl: z.string().url("Invalid URL format for video.").optional().or(z.literal("")),
  externalLinkUrl: z.string().url("Invalid URL format for external link.").optional().or(z.literal("")),
  externalLinkText: z.string().max(100).optional(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

export default function CreatePostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<Profile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "Guidance", // Default category
      tags: "",
      imageUrl: "",
      videoUrl: "",
      externalLinkUrl: "",
      externalLinkText: "",
    },
  });

  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      setIsCheckingAuth(true);
      try {
        const profile = await getProfile(MOCK_CURRENT_USER_ID);
        setCurrentUser(profile);
      } catch (error) {
        console.error("Failed to fetch current user profile:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load user data." });
      } finally {
        setIsCheckingAuth(false);
      }
    };
    fetchCurrentUser();
  }, [toast]);

  const onSubmit = async (values: PostFormValues) => {
    if (!currentUser || currentUser.role !== 'alumni') {
      toast({ variant: "destructive", title: "Unauthorized", description: "Only alumni can create posts." });
      return;
    }
    setIsLoading(true);
    try {
      const postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount'> = {
        authorId: currentUser.id,
        authorName: currentUser.name || "Alumni User",
        authorAvatar: currentUser.avatarUrl,
        title: values.title,
        content: values.content,
        category: values.category,
        tags: values.tags as string[], // Zod transform ensures it's string[]
        imageUrl: values.imageUrl || undefined,
        videoUrl: values.videoUrl || undefined,
        externalLinkUrl: values.externalLinkUrl || undefined,
        externalLinkText: values.externalLinkText || undefined,
      };
      const postId = await createPost(postData);
      toast({ title: "Post Created!", description: "Your post has been successfully published." });
      router.push(`/posts/${postId}`);
    } catch (error) {
      console.error("Failed to create post:", error);
      toast({ variant: "destructive", title: "Creation Failed", description: "Could not create post." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-24 ml-auto" /></CardFooter>
        </Card>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'alumni') {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center">
        <Icons.warning className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">Only alumni members are allowed to create new posts.</p>
        <Button onClick={() => router.push('/posts')} className="mt-6">Back to Posts</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Create New Post</CardTitle>
          <CardDescription>Share your insights, opportunities, or stories with the community.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input placeholder="Enter a catchy title for your post" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl><Textarea placeholder="Write your post content here..." {...field} rows={8} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl><Input placeholder="e.g., Job Opening, Guidance, Success Story" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl><Input placeholder="e.g., Engineering, Internship, CareerAdvice" {...field} /></FormControl>
                      <FormDescription>Comma-separated list of tags.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl><Input placeholder="https://example.com/image.jpg" {...field} /></FormControl>
                    <FormDescription>Link to an image to display in your post.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL (Optional)</FormLabel>
                    <FormControl><Input placeholder="https://youtube.com/watch?v=your_video_id" {...field} /></FormControl>
                    <FormDescription>Link to a video (e.g., YouTube, Vimeo).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="externalLinkUrl"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>External Link URL (Optional)</FormLabel>
                        <FormControl><Input placeholder="https://example.com/relevant-article" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="externalLinkText"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>External Link Display Text (Optional)</FormLabel>
                        <FormControl><Input placeholder="Read more here" {...field} /></FormControl>
                        <FormDescription>Text for the link if URL is provided.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Publish Post
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
