
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation"; // useRouter for navigation
import Link from "next/link";
import Image from "next/image";
import type { Post, PostComment, Profile } from "@/types"; // Added PostComment, Profile
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { format, formatDistanceToNow } from "date-fns"; // Added formatDistanceToNow
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea"; // For comment input
import { getPostById, getCommentsForPost, addCommentToPost, toggleLikePost } from "@/services/postService";
import { getProfile } from "@/services/profileService"; // To get current user
import { useToast } from "@/hooks/use-toast";

// MOCK: In a real app, this would come from your auth context
const MOCK_CURRENT_USER_ID = "user123_dev"; 

export default function SinglePostPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const postId = params?.id as string;

  const [post, setPost] = React.useState<Post | null | undefined>(undefined);
  const [comments, setComments] = React.useState<PostComment[]>([]);
  const [newCommentText, setNewCommentText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingComments, setIsLoadingComments] = React.useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  const [currentUserProfile, setCurrentUserProfile] = React.useState<Profile | null>(null);

  const fetchPostDetails = React.useCallback(async () => {
    if (!postId) {
      setPost(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const fetchedPost = await getPostById(postId);
      setPost(fetchedPost);
    } catch (error) {
      console.error(`Failed to fetch post ${postId}:`, error);
      toast({ variant: "destructive", title: "Error", description: "Could not load the post." });
      setPost(null);
    } finally {
      setIsLoading(false);
    }
  }, [postId, toast]);

  const fetchCommentsForPost = React.useCallback(async () => {
    if (!postId) {
      setComments([]);
      setIsLoadingComments(false);
      return;
    }
    setIsLoadingComments(true);
    try {
      const fetchedComments = await getCommentsForPost(postId);
      setComments(fetchedComments);
    } catch (error) {
      console.error(`Failed to fetch comments for post ${postId}:`, error);
      toast({ variant: "destructive", title: "Error", description: "Could not load comments." });
    } finally {
      setIsLoadingComments(false);
    }
  }, [postId, toast]);

  React.useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const profile = await getProfile(MOCK_CURRENT_USER_ID);
        setCurrentUserProfile(profile);
      } catch (error) {
        console.error("Failed to fetch current user profile:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load user data for interactions." });
      }
    };
    fetchInitialData();
    fetchPostDetails();
    fetchCommentsForPost();
  }, [postId, fetchPostDetails, fetchCommentsForPost, toast]);

  const handleToggleLike = async () => {
    if (!post || !currentUserProfile) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to like posts." });
      return;
    }

    const originalLikedBy = [...(post.likedBy || [])];
    const originalLikesCount = post.likesCount;
    const isCurrentlyLiked = originalLikedBy.includes(currentUserProfile.id);

    // Optimistic UI Update
    setPost(prevPost => {
      if (!prevPost) return null;
      const newLikedBy = isCurrentlyLiked
        ? prevPost.likedBy.filter(id => id !== currentUserProfile.id)
        : [...(prevPost.likedBy || []), currentUserProfile.id];
      return {
        ...prevPost,
        likedBy: newLikedBy,
        likesCount: isCurrentlyLiked ? Math.max(0, prevPost.likesCount - 1) : prevPost.likesCount + 1,
      };
    });

    try {
      await toggleLikePost(post.id, currentUserProfile.id);
      // Optionally re-fetch post for ultimate consistency, or rely on optimistic update.
      // For now, we'll rely on optimistic. If issues, uncomment: await fetchPostDetails();
    } catch (error) {
      console.error("Failed to toggle like:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update like status." });
      // Revert optimistic update
      setPost(prevPost => {
        if (!prevPost) return null;
        // This ensures we return to the true original state from before the optimistic update
        const revertedPost = { ...prevPost, likedBy: originalLikedBy, likesCount: originalLikesCount };
        // If the current post ID matches, apply the reversion
        return prevPost.id === post.id ? revertedPost : prevPost;
      });
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !post || !currentUserProfile) {
      toast({ variant: "destructive", title: "Error", description: "Cannot post comment. Ensure you are logged in and have entered text."});
      return;
    }
    setIsSubmittingComment(true);

    const commentData: Omit<PostComment, 'id' | 'createdAt'> = {
      postId: post.id,
      authorId: currentUserProfile.id,
      authorName: currentUserProfile.name || "Anonymous",
      authorAvatar: currentUserProfile.avatarUrl,
      authorRole: currentUserProfile.role || 'student',
      content: newCommentText.trim(),
    };
    
    // Basic optimistic update (won't have real ID or server timestamp yet)
    const optimisticComment: PostComment = {
        ...commentData,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
    };
    setComments(prev => [optimisticComment, ...prev]);
    setPost(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
    setNewCommentText("");

    try {
      await addCommentToPost(post.id, commentData);
      toast({ title: "Comment Added!", description: "Your comment has been posted." });
      // Re-fetch comments to get actual IDs and server timestamps
      fetchCommentsForPost();
      // Re-fetch post to ensure commentsCount is accurate from server
      fetchPostDetails(); 
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not post comment." });
      // Revert optimistic update
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      setPost(prev => prev ? { ...prev, commentsCount: prev.commentsCount - 1 } : null);
    } finally {
      setIsSubmittingComment(false);
    }
  };


  if (isLoading || post === undefined) { // Initial loading state for the post itself
    return <SinglePostPageSkeleton />;
  }

  if (!post) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 text-center">
        <Button variant="outline" asChild className="mb-8 inline-flex items-center">
          <Link href="/posts"><Icons.chevronLeft className="mr-2 h-4 w-4" /> Back to All Posts</Link>
        </Button>
        <div className="py-12">
          <Icons.post className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold text-destructive mb-3">Post Not Found</h1>
          <p className="text-lg text-muted-foreground">
            Sorry, we couldn&apos;t find the post you were looking for.
          </p>
        </div>
      </div>
    );
  }

  const authorInitial = post.authorName ? post.authorName.charAt(0).toUpperCase() : "A";
  const isLikedByCurrentUser = !!(currentUserProfile && post.likedBy && post.likedBy.includes(currentUserProfile.id));

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

          {post.imageUrl && (
            <div className="relative w-full h-72 md:h-96 my-4 bg-muted">
              <Image src={post.imageUrl} alt={post.title} layout="fill" objectFit="contain" data-ai-hint="post image content"/>
            </div>
          )}

          <CardContent className="p-6 md:p-8 text-foreground/90 text-base md:text-lg leading-relaxed">
            <div className="whitespace-pre-wrap break-words">
                {post.content}
            </div>
            {post.videoUrl && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">Video:</h3>
                    <a href={post.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2 break-all">
                        <Icons.link className="h-4 w-4" /> {post.videoUrl}
                    </a>
                </div>
            )}
            {post.externalLinkUrl && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">External Link:</h3>
                    <a href={post.externalLinkUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2 break-all">
                        <Icons.link className="h-4 w-4" /> {post.externalLinkText || post.externalLinkUrl}
                    </a>
                </div>
            )}
          </CardContent>

          <CardFooter className="border-t p-6 md:p-8 flex flex-col items-start gap-4">
             <div className="flex items-center gap-6 text-muted-foreground">
                <Button variant="ghost" size="lg" onClick={handleToggleLike} disabled={!currentUserProfile} className={`p-1 h-auto hover:text-primary text-base ${isLikedByCurrentUser ? 'text-primary' : ''}`}>
                    <Icons.thumbsUp className={`mr-2 h-5 w-5 ${isLikedByCurrentUser ? 'fill-primary' : ''}`} /> {post.likesCount} Likes
                </Button>
                {/* Comment count display, actual commenting below */}
                 <div className="flex items-center gap-1 p-1 h-auto text-base">
                    <Icons.discussions className="mr-2 h-5 w-5" /> {post.commentsCount} Comments
                </div>
            </div>
            {post.tags && post.tags.length > 0 && (
                <div className="mt-2">
                    <h3 className="text-md font-semibold text-muted-foreground mb-1">TAGS:</h3>
                    <div className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                        <Link key={tag} href={`/posts?tag=${encodeURIComponent(tag)}`} passHref legacyBehavior>
                            <Badge variant="outline" className="text-sm cursor-pointer hover:bg-accent">{tag}</Badge>
                        </Link>
                        ))}
                    </div>
                </div>
            )}
          </CardFooter>
        </Card>
      </article>

      {/* Comments Section */}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Comments ({comments.length})</h2>
        {currentUserProfile && (
          <Card className="mb-6 shadow-md">
            <CardHeader><CardTitle className="text-lg">Leave a Comment</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write your comment here..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={4}
                className="mb-2"
              />
              <Button onClick={handleAddComment} disabled={isSubmittingComment || !newCommentText.trim()}>
                {isSubmittingComment && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Post Comment
              </Button>
            </CardContent>
          </Card>
        )}
        {!currentUserProfile && (
            <p className="text-muted-foreground text-center p-4 border rounded-md mb-6">
                <Link href="/login" className="text-primary hover:underline font-semibold">Log in</Link> or <Link href="/signup" className="text-primary hover:underline font-semibold">sign up</Link> to post a comment.
            </p>
        )}

        {isLoadingComments ? (
          <CommentsSkeleton />
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map(comment => (
              <CommentCard key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-6">No comments yet. Be the first to share your thoughts!</p>
        )}
      </section>
    </div>
  );
}

function CommentCard({ comment }: { comment: PostComment }) {
  const authorInitial = comment.authorName ? comment.authorName.charAt(0).toUpperCase() : "A";
  return (
    <Card className="p-4 shadow-sm bg-card">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.authorAvatar || undefined} alt={comment.authorName} data-ai-hint="person"/>
          <AvatarFallback>{authorInitial}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-foreground">{comment.authorName}</p>
              {/* <span className="text-xs text-muted-foreground capitalize">({comment.authorRole})</span> */}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
        </div>
      </div>
    </Card>
  );
}

const SinglePostPageSkeleton = () => (
  <div className="container mx-auto py-8 px-4 md:px-6">
    <div className="mb-8"><Skeleton className="h-9 w-40" /></div>
    <Card className="shadow-lg"><CardHeader className="space-y-3 p-6 md:p-8"><div className="flex items-center gap-4 mb-4"><Skeleton className="h-12 w-12 rounded-full md:h-14 md:w-14" /><div className="space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-32" /></div></div><Skeleton className="h-8 w-3/4 !mt-6" /><Skeleton className="h-6 w-24 rounded-full" /></CardHeader><Skeleton className="h-72 w-full mt-4" /><CardContent className="space-y-4 py-6 p-6 md:p-8"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-full mt-4" /><Skeleton className="h-4 w-3/4" /></CardContent><CardFooter className="border-t p-6 md:p-8"><Skeleton className="h-6 w-40" /></CardFooter></Card>
    <div className="mt-10"><Skeleton className="h-8 w-1/3 mb-4" /><Card className="mb-6"><CardContent className="p-4 space-y-2"><Skeleton className="h-20 w-full" /><Skeleton className="h-9 w-28 self-end" /></CardContent></Card><CommentsSkeleton /></div>
  </div>
);

const CommentsSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 2 }).map((_, i) => (
      <Card key={i} className="p-4"><div className="flex items-start gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-1.5"><div className="flex items-center justify-between"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div></div></Card>
    ))}
  </div>
);
