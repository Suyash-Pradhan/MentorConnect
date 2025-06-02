
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { getPostById, updatePost } from "@/services/postService";
import type { Post } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserProfile } from "@/contexts/user-profile-context";
import { uploadImageAction } from "@/actions/uploadActions";
import Image from "next/image";
import Link from "next/link";

const postFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100),
  content: z.string().min(10, "Content must be at least 10 characters.").max(5000),
  category: z.string().min(2, "Category is required.").max(50),
  tags: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)), // Handle as string for input, then array
  imageUrl: z.string().url("Invalid URL format for image.").optional().or(z.literal("")),
  videoUrl: z.string().url("Invalid URL format for video.").optional().or(z.literal("")),
  externalLinkUrl: z.string().url("Invalid URL format for external link.").optional().or(z.literal("")),
  externalLinkText: z.string().max(100).optional(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;
  const { toast } = useToast();
  const { userProfile, profileLoading } = useUserProfile();

  const [isLoadingPost, setIsLoadingPost] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const imageFileRef = React.useRef<HTMLInputElement>(null);
  const [originalPost, setOriginalPost] = React.useState<Post | null>(null);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
      tags: "",
      imageUrl: "",
      videoUrl: "",
      externalLinkUrl: "",
      externalLinkText: "",
    },
  });

  React.useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      setIsLoadingPost(true);
      try {
        const postData = await getPostById(postId);
        if (postData) {
          setOriginalPost(postData);
          form.reset({
            title: postData.title,
            content: postData.content,
            category: postData.category,
            tags: postData.tags.join(', '), // Convert array to comma-separated string for input
            imageUrl: postData.imageUrl || "",
            videoUrl: postData.videoUrl || "",
            externalLinkUrl: postData.externalLinkUrl || "",
            externalLinkText: postData.externalLinkText || "",
          });
          if (postData.imageUrl) {
            setImagePreview(postData.imageUrl);
          }
        } else {
          toast({ variant: "destructive", title: "Not Found", description: "Post not found." });
          router.push("/my-opportunities");
        }
      } catch (error) {
        console.error("Failed to fetch post:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load post data." });
      } finally {
        setIsLoadingPost(false);
      }
    };
    fetchPost();
  }, [postId, form, router, toast]);

  React.useEffect(() => {
    // Update preview if imageUrl is changed programmatically (e.g., after upload or form reset)
    const currentImageUrl = form.getValues("imageUrl");
    if (currentImageUrl && currentImageUrl !== imagePreview) {
      setImagePreview(currentImageUrl);
    } else if (!currentImageUrl && imagePreview) {
      // If URL is cleared but preview exists, clear preview
      setImagePreview(null);
    }
  }, [form.watch("imageUrl"), imagePreview, form]);


  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    // Don't clear preview immediately, allow user to see current while new one uploads
    // form.setValue("imageUrl", "", { shouldValidate: true }); // Clear previous URL if needed

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await uploadImageAction(formData);
      if (result.url) {
        form.setValue("imageUrl", result.url, { shouldValidate: true });
        setImagePreview(result.url); // Set new preview
        toast({ title: "Image Updated", description: "Post image has been updated." });
      } else if (result.error) {
        toast({ variant: "destructive", title: "Upload Failed", description: result.error });
        // Revert to original image URL if upload fails and there was one
        if (originalPost?.imageUrl) {
            form.setValue("imageUrl", originalPost.imageUrl, { shouldValidate: true });
            setImagePreview(originalPost.imageUrl);
        } else {
            form.setValue("imageUrl", "", { shouldValidate: true });
            setImagePreview(null);
        }
        if(imageFileRef.current) imageFileRef.current.value = "";
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Error", description: "An unexpected error occurred." });
      if(imageFileRef.current) imageFileRef.current.value = "";
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (values: PostFormValues) => {
    if (!userProfile || userProfile.role !== 'alumni' || userProfile.id !== originalPost?.authorId) {
      toast({ variant: "destructive", title: "Unauthorized", description: "You are not authorized to edit this post." });
      return;
    }
    if (!originalPost) {
        toast({ variant: "destructive", title: "Error", description: "Original post data not found." });
        return;
    }

    setIsSubmitting(true);
    try {
      // Explicitly construct the object to be sent to updatePost
      const postUpdateData: Partial<Omit<Post, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'authorAvatar' | 'likesCount' | 'commentsCount' | 'likedBy'>> = {
        title: values.title,
        content: values.content,
        category: values.category,
        tags: values.tags as string[], // Zod transform ensures this is string[]
        imageUrl: values.imageUrl || undefined, // Ensure empty string becomes undefined
        videoUrl: values.videoUrl || undefined,
        externalLinkUrl: values.externalLinkUrl || undefined,
        externalLinkText: values.externalLinkText || undefined,
        // updatedAt will be handled by the service
      };

      await updatePost(postId, postUpdateData);
      toast({ title: "Post Updated!", description: "Your post has been successfully updated." });
      router.push(`/posts/${postId}`);
    } catch (error) {
      console.error("Failed to update post:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update post." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading || isLoadingPost) {
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
  
  if (!originalPost) { // Handles case where post not found after loading attempt
     return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center">
        <Icons.warning className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Post Not Found</h1>
        <p className="text-muted-foreground mt-2">The post you are trying to edit does not exist or could not be loaded.</p>
        <Button onClick={() => router.push('/my-opportunities')} className="mt-6">Back to My Opportunities</Button>
      </div>
    );
  }

  if (userProfile?.id !== originalPost.authorId) {
     return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center">
        <Icons.warning className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You are not authorized to edit this post.</p>
        <Button onClick={() => router.push('/posts')} className="mt-6">Back to Posts</Button>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Edit Post</CardTitle>
          <CardDescription>Make changes to your post. Click save when you&apos;re done.</CardDescription>
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
                    <FormControl><Input placeholder="Enter a catchy title for your post" {...field} disabled={isSubmitting || isUploadingImage} /></FormControl>
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
                    <FormControl><Textarea placeholder="Write your post content here..." {...field} rows={8} disabled={isSubmitting || isUploadingImage} /></FormControl>
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
                      <FormControl><Input placeholder="e.g., Job Opening, Guidance" {...field} disabled={isSubmitting || isUploadingImage} /></FormControl>
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
                      <FormControl><Input placeholder="e.g., Engineering, Internship" {...field} disabled={isSubmitting || isUploadingImage} /></FormControl>
                      <FormDescription>Comma-separated list of tags.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormItem>
                <FormLabel>Post Image (Optional)</FormLabel>
                {imagePreview && (
                  <div className="my-2 relative w-full max-w-md aspect-video">
                    <Image 
                      src={imagePreview} 
                      alt="Post image preview" 
                      layout="fill"
                      objectFit="contain"
                      className="rounded-md border"
                      data-ai-hint="post image"
                    />
                  </div>
                )}
                <FormControl>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    disabled={isSubmitting || isUploadingImage}
                    ref={imageFileRef}
                  />
                </FormControl>
                {isUploadingImage && <p className="text-sm text-muted-foreground flex items-center"><Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>Uploading image...</p>}
                <FormDescription>Upload or change the image for your post (max 5MB, JPG/PNG/GIF/WebP).</FormDescription>
                 <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => ( <FormControl><Input type="hidden" {...field} /></FormControl> )}
                  />
                <FormMessage />
              </FormItem>

               <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL (Optional)</FormLabel>
                    <FormControl><Input placeholder="https://youtube.com/watch?v=your_video_id" {...field} disabled={isSubmitting || isUploadingImage} /></FormControl>
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
                        <FormControl><Input placeholder="https://example.com/relevant-article" {...field} disabled={isSubmitting || isUploadingImage} /></FormControl>
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
                        <FormControl><Input placeholder="Read more here" {...field} disabled={isSubmitting || isUploadingImage} /></FormControl>
                        <FormDescription>Text for the link if URL is provided.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting || isUploadingImage}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploadingImage}>
                {(isSubmitting || isUploadingImage) && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
