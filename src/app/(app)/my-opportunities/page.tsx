
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import type { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getPostsByAuthor, deletePost } from '@/services/postService';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUserProfile } from "@/contexts/user-profile-context";

export default function MyOpportunitiesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { userProfile, profileLoading, profileError } = useUserProfile();
  const [myPosts, setMyPosts] = React.useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = React.useState(true);

  const fetchMyPosts = React.useCallback(async (authorId: string) => {
    setIsLoadingPosts(true);
    try {
      const posts = await getPostsByAuthor(authorId);
      setMyPosts(posts);
    } catch (error) {
      console.error("Failed to fetch my posts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load your shared opportunities.",
      });
    } finally {
      setIsLoadingPosts(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (userProfile && userProfile.role === 'alumni') {
      fetchMyPosts(userProfile.id);
    } else if (!profileLoading && userProfile?.role !== 'alumni') {
      // If profile loaded and user is not alumni, effectively stop loading and show appropriate message.
      setIsLoadingPosts(false);
      setMyPosts([]); // Ensure no posts are shown
    }
    // If profile is loading, or there's an error, the outer conditionals will handle it.
  }, [userProfile, profileLoading, fetchMyPosts]);

  const handleDeletePost = async (postId: string) => {
    if (!userProfile) return;
    try {
      await deletePost(postId);
      toast({ title: "Post Deleted", description: "Your opportunity has been deleted." });
      fetchMyPosts(userProfile.id); // Refresh the list
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete the post. Please try again.",
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
         <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <Skeleton className="h-10 w-72 mb-2" />
                <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <OpportunityCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center">
        <Icons.warning className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Error Loading Profile</h1>
        <p className="text-muted-foreground mt-2">Could not load your data for this page.</p>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'alumni') {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center">
        <Icons.warning className="h-16 w-16 mx-auto text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold">Access Restricted</h1>
        <p className="text-muted-foreground mt-2">This page is for alumni to manage their shared opportunities.</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-6">Go to Dashboard</Button>
      </div>
    );
  }

  // User is alumni, now check if posts are loading or empty
  if (isLoadingPosts) {
     return (
      <div className="container mx-auto py-8 px-4 md:px-6">
         <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h1 className="text-4xl font-bold text-foreground">My Shared Opportunities</h1>
                <p className="text-lg text-muted-foreground">Manage the posts, job openings, and guidance you&apos;ve shared.</p>
            </div>
            <Button asChild>
                <Link href="/posts/create">
                    <Icons.add className="mr-2 h-4 w-4" /> Share New Opportunity
                </Link>
            </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <OpportunityCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-4xl font-bold text-foreground">My Shared Opportunities</h1>
            <p className="text-lg text-muted-foreground">Manage the posts, job openings, and guidance you&apos;ve shared.</p>
        </div>
        <Button asChild>
            <Link href="/posts/create">
                <Icons.add className="mr-2 h-4 w-4" /> Share New Opportunity
            </Link>
        </Button>
      </div>

      {myPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {myPosts.map(post => (
            <OpportunityCard key={post.id} post={post} onDeleteConfirm={handleDeletePost} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 shadow-sm">
          <CardHeader>
            <Icons.myOpportunities className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">No Opportunities Shared Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Share job openings, guidance, or success stories to help students.
            </CardDescription>
            <Button asChild>
              <Link href="/posts/create">Share Your First Opportunity</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface OpportunityCardProps {
  post: Post;
  onDeleteConfirm: (postId: string) => void;
}

function OpportunityCard({ post, onDeleteConfirm }: OpportunityCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-xl hover:text-primary transition-colors">
                <Link href={`/posts/${post.id}`}>{post.title}</Link>
            </CardTitle>
            <Badge variant="outline">{post.category}</Badge>
        </div>
        <CardDescription>
          Shared {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          {post.updatedAt && new Date(post.updatedAt).getTime() !== new Date(post.createdAt).getTime() && (
            <span className="text-xs text-muted-foreground italic"> (edited {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })})</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-3">{post.content}</p>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/posts/${post.id}/edit`}>
            <Icons.edit className="mr-2 h-4 w-4" /> Edit
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Icons.trash className="mr-2 h-4 w-4" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this opportunity post.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDeleteConfirm(post.id)} className="bg-destructive hover:bg-destructive/90">
                Yes, delete it
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

const OpportunityCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="space-y-1.5 flex-1">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </CardContent>
    <CardFooter className="border-t pt-4 flex justify-end gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </CardFooter>
  </Card>
);
