
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { DiscussionThread, Comment as ThreadCommentType, Role, Profile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getDiscussionThreadById, getCommentsForThread, addCommentToThread } from "@/services/discussionService";
import { useUserProfile } from "@/contexts/user-profile-context";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty.").max(1000, "Comment is too long."),
});
type CommentFormValues = z.infer<typeof commentSchema>;

export default function SingleDiscussionPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params?.id as string;
  const { toast } = useToast();

  const [thread, setThread] = React.useState<DiscussionThread | null | undefined>(undefined);
  const [comments, setComments] = React.useState<ThreadCommentType[]>([]);
  const [isLoading, setIsLoading] = React.useState(true); // For thread/comments data
  
  const { userProfile, profileLoading, profileError } = useUserProfile(); // Use context for user info

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "" },
  });

  React.useEffect(() => {
    const fetchThreadData = async () => {
      if (!threadId) {
        setThread(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // User profile now comes from context, so no need to fetch it here for comment form
        const [fetchedThread, fetchedComments] = await Promise.all([
          getDiscussionThreadById(threadId),
          getCommentsForThread(threadId),
        ]);
        setThread(fetchedThread);
        setComments(fetchedComments);
      } catch (error) {
        console.error("Error fetching discussion details:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load discussion." });
        setThread(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchThreadData();
  }, [threadId, toast]);

  const handleAddComment = async (values: CommentFormValues) => {
    if (!userProfile || !userProfile.role || !thread) { // Check role from context's userProfile
      toast({ variant: "destructive", title: "Error", description: "You must be logged in with a valid role to comment or thread is missing." });
      return;
    }
    
    try {
      const newCommentData: Omit<ThreadCommentType, 'id' | 'createdAt'> = {
        threadId: thread.id,
        authorId: userProfile.id,
        authorName: userProfile.name || "Anonymous",
        authorAvatar: userProfile.avatarUrl,
        authorRole: userProfile.role,
        content: values.content,
      };
      const newCommentId = await addCommentToThread(thread.id, newCommentData);
      const displayNewComment: ThreadCommentType = {
        ...newCommentData,
        id: newCommentId,
        createdAt: new Date(),
      };
      setComments(prev => [displayNewComment, ...prev]);
      if(thread) {
        setThread(prev => prev ? {...prev, lastActivityAt: new Date(), commentsCount: (prev.commentsCount || 0) + 1} : null )
      }
      toast({ title: "Comment Added!", description: "Your comment has been posted." });
      form.reset();
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not post comment." });
    }
  };

  if (isLoading || thread === undefined) { // This isLoading is for thread content
    return <DiscussionPageSkeleton />;
  }

  if (!thread) {
    return (
      <div className="w-full text-center">
        <Button variant="outline" asChild className="mb-8 inline-flex items-center">
          <Link href="/discussions"><Icons.chevronLeft className="mr-2 h-4 w-4" /> Back to Discussions</Link>
        </Button>
        <div className="py-12">
          <Icons.discussions className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold text-destructive mb-3">Discussion Not Found</h1>
          <p className="text-lg text-muted-foreground">
            Sorry, we couldn&apos;t find the discussion thread you were looking for.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/discussions"><Icons.chevronLeft className="mr-2 h-4 w-4" /> Back to Discussions</Link>
      </Button>

      <Card className="shadow-lg mb-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl md:text-3xl font-bold text-primary">{thread.title}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={thread.creatorAvatar || `https://placehold.co/32x32.png`} alt={thread.creatorName} data-ai-hint="person"/>
              <AvatarFallback>{thread.creatorName?.charAt(0)?.toUpperCase() || 'A'}</AvatarFallback>
            </Avatar>
            <span>
              Started by <Link href={`/profile/${thread.createdBy}`} className="font-medium text-foreground hover:underline">{thread.creatorName}</Link>
              {thread.creatorRole && <span className="text-xs capitalize"> ({thread.creatorRole})</span>}
            </span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{thread.content}</p>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Comments ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {profileLoading ? (
            <div className="p-4 border rounded-lg bg-secondary/50 text-center text-muted-foreground">Loading user details for commenting...</div>
          ) : userProfile && userProfile.role ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddComment)} className="flex items-start gap-3 p-4 border rounded-lg bg-secondary/50">
                <Avatar className="h-10 w-10 mt-1">
                  <AvatarImage src={userProfile.avatarUrl || `https://placehold.co/40x40.png`} alt={userProfile.name || "User"} data-ai-hint="person"/>
                  <AvatarFallback>{userProfile.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                   <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                            <Textarea 
                                placeholder="Write a comment..." 
                                rows={3} 
                                className="bg-background"
                                {...field} 
                            />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                      Post Comment
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          ) : userProfile && !userProfile.role ? (
            <p className="text-muted-foreground text-center p-4 border rounded-md">
                Please <Link href="/profile?edit=true&from=discussion_comment" className="text-primary hover:underline font-semibold">complete your profile by selecting a role</Link> to post a comment.
            </p>
          ) : (
            <p className="text-muted-foreground text-center p-4 border rounded-md">
                <Link href="/login" className="text-primary hover:underline font-semibold">Log in</Link> or <Link href="/signup" className="text-primary hover:underline font-semibold">sign up</Link> to post a comment.
            </p>
          )}

          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map(comment => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">No comments yet. Be the first to reply!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CommentCard({ comment }: { comment: ThreadCommentType }) {
  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg shadow-sm bg-card">
      <Avatar className="h-10 w-10">
        <AvatarImage src={comment.authorAvatar || `https://placehold.co/40x40.png`} alt={comment.authorName} data-ai-hint="person"/>
        <AvatarFallback>{comment.authorName?.charAt(0)?.toUpperCase() || 'A'}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${comment.authorId}`} className="font-semibold text-sm text-foreground hover:underline">{comment.authorName}</Link>
            <span className="text-xs text-muted-foreground capitalize">({comment.authorRole})</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}

const DiscussionPageSkeleton = () => (
  <div className="w-full">
    <Skeleton className="h-9 w-40 mb-6" />
    <Card className="shadow-lg mb-8">
      <CardHeader className="pb-4">
        <Skeleton className="h-8 w-3/4 mb-3" />
        <div className="flex items-center gap-2 text-sm mt-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
    <Card className="shadow-md">
      <CardHeader>
        <Skeleton className="h-6 w-1/4" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-3 p-4 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full mt-1" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-16 w-full" />
            <div className="flex justify-end">
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-4 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);


    