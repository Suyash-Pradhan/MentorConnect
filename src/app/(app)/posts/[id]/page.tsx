
"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Post } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // Removed CardDescription as it was not explicitly used here for a distinct purpose.
import { Icons } from "@/components/icons";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getPostById } from "@/services/postService"; // Import the service
import { useToast } from "@/hooks/use-toast";

export default function SinglePostPage() {
  const params = useParams();
  const { toast } = useToast();
  const postId = params?.id as string;

  const [post, setPost] = React.useState<Post | null | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setIsLoading(false);
        setPost(null); // No ID, so no post
        return;
      }
      setIsLoading(true);
      try {
        const fetchedPost = await getPostById(postId);
        setPost(fetchedPost);
      } catch (error) {
        console.error(`Failed to fetch post ${postId}:`, error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load the post. Please try again later.",
        });
        setPost(null); // Set to null on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId, toast]);

  if (isLoading || post === undefined) { // Show skeleton if loading or post is undefined (initial state)
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="mb-8">
          <Skeleton className="h-9 w-40" />
        </div>
        <Card className="shadow-lg">
          <CardHeader className="space-y-3 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full md:h-14 md:w-14" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-8 w-3/4 !mt-6" /> {/* Title */}
            <Skeleton className="h-6 w-24 rounded-full" /> {/* Badge */}
          </CardHeader>
          <CardContent className="space-y-4 py-6 p-6 md:p-8">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full mt-4" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter className="border-t p-6 md:p-8">
            <Skeleton className="h-6 w-40" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!post) { // Post is null (not found or error)
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 text-center">
        <Button variant="outline" asChild className="mb-8 inline-flex items-center">
          <Link href="/posts"><Icons.chevronLeft className="mr-2 h-4 w-4" /> Back to All Posts</Link>
        </Button>
        <div className="py-12">
          <Icons.post className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold text-destructive mb-3">Post Not Found</h1>
          <p className="text-lg text-muted-foreground">
            Sorry, we couldn&apos;t find the post you were looking for. It might have been removed or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  const authorInitial = post.authorName ? post.authorName.charAt(0).toUpperCase() : "A";

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" asChild className="mb-8">
        <Link href="/posts"><Icons.chevronLeft className="mr-2 h-4 w-4" /> Back to All Posts</Link>
      </Button>

      <article>
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="space-y-3 p-6 md:p-8">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 md:h-14 md:w-14 border">
                <AvatarImage src={post.authorAvatar || undefined} alt={post.authorName} data-ai-hint="person professional"/>
                <AvatarFallback className="text-xl">{authorInitial}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold text-foreground">{post.authorName}</p>
                <p className="text-sm text-muted-foreground">
                  Posted on {format(new Date(post.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            <CardTitle className="text-3xl md:text-4xl font-bold text-primary !mt-6">{post.title}</CardTitle>
            <Badge variant="secondary" className="w-fit text-sm py-1 px-3">{post.category}</Badge>
          </CardHeader>

          <CardContent className="p-6 md:p-8 text-foreground/90 text-base md:text-lg leading-relaxed">
            <div className="whitespace-pre-wrap">
                {post.content}
            </div>
          </CardContent>

          {post.tags && post.tags.length > 0 && (
            <CardFooter className="border-t p-6 md:p-8 flex flex-col items-start gap-3">
               <h3 className="text-md font-semibold text-muted-foreground">TAGS:</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-sm">{tag}</Badge>
                ))}
              </div>
            </CardFooter>
          )}
        </Card>
      </article>
    </div>
  );
}
