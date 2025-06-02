
"use client";

import React from 'react';
import type { Post } from '@/types'; // Profile type removed as it comes from UserProfileContext
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllPosts } from '@/services/postService';
// import { getProfile } from '@/services/profileService'; // No longer needed for mock user
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserProfile } from "@/contexts/user-profile-context"; // Import useUserProfile

// MOCK_CURRENT_USER_ID removed
const ALL_CATEGORIES_VALUE = "__ALL_CATEGORIES__";

export default function PostsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile, profileLoading } = useUserProfile(); // Use real user profile

  const [allPosts, setAllPosts] = React.useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = React.useState(true); // Renamed for clarity
  const [searchTerm, setSearchTerm] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [activeTagFilter, setActiveTagFilter] = React.useState<string | null>(null);

  React.useEffect(() => {
    const tagFromQuery = searchParams.get('tag');
    setActiveTagFilter(tagFromQuery);
    setIsLoadingPosts(true); // Set loading true when fetching

    const fetchPostsData = async () => {
      try {
        const postsData = await getAllPosts({ tag: tagFromQuery || undefined });
        setAllPosts(postsData);
      } catch (error: any) {
        console.error("Failed to fetch posts data:", error);
        toast({
          variant: "destructive",
          title: "Error Loading Posts",
          description: error.message?.includes("index")
            ? "A Firestore index is required for this query. Please check the console for a link to create it, then refresh."
            : "Could not load posts. Please try again later.",
        });
        if (error.message?.includes("index")) {
            console.error("Firestore index creation link (copy and paste into browser if not clickable):", error.message.substring(error.message.indexOf("https://")));
        }
      } finally {
        setIsLoadingPosts(false); // Set loading false after fetch attempt
      }
    };
    fetchPostsData();
  }, [toast, searchParams]);

  const filteredPostsBySearchAndCategory = allPosts
    .filter(post => post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.content.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(post => categoryFilter && categoryFilter !== ALL_CATEGORIES_VALUE ? post.category === categoryFilter : true);

  const categories = React.useMemo(() => {
    return Array.from(new Set(allPosts.map(p => p.category))).sort();
  }, [allPosts]);


  if (isLoadingPosts || profileLoading) { // Consider profileLoading as well for the Create Post button
    return <PostsPageSkeleton />;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Alumni Posts</h1>
          <p className="text-lg text-muted-foreground">Guidance, job openings, and success stories from our alumni.</p>
        </div>
        {userProfile?.role === 'alumni' && ( // Use actual userProfile role
          <Button asChild>
            <Link href="/posts/create">
              <Icons.add className="mr-2 h-4 w-4" /> Create New Post
            </Link>
          </Button>
        )}
      </div>

      {activeTagFilter && (
        <div className="mb-6 p-4 rounded-md bg-accent/10 border border-accent flex items-center justify-between">
          <p className="text-sm text-accent-foreground">
            Showing posts tagged: <Badge variant="default" className="bg-accent text-accent-foreground">{activeTagFilter}</Badge>
          </p>
          <Button variant="ghost" size="sm" onClick={() => router.push('/posts')} className="text-accent hover:bg-accent/20">
            <Icons.close className="mr-1 h-3 w-3" /> Clear Filter
          </Button>
        </div>
      )}

      <Card className="mb-6 p-4 shadow-sm bg-secondary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="search-posts" className="text-sm font-medium text-foreground block mb-1">Search Posts</label>
            <div className="relative">
               <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-posts"
                type="text"
                placeholder="Search by title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label htmlFor="category-filter" className="text-sm font-medium text-foreground block mb-1">Filter by Category</label>
            <Select
              value={categoryFilter || ALL_CATEGORIES_VALUE}
              onValueChange={(value) => setCategoryFilter(value === ALL_CATEGORIES_VALUE ? "" : value)}
            >
              <SelectTrigger id="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES_VALUE}>All Categories</SelectItem>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>


      {filteredPostsBySearchAndCategory.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPostsBySearchAndCategory.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Icons.posts className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No Posts Found</h3>
          <p className="text-muted-foreground">
            {activeTagFilter
              ? `No posts found for the tag "${activeTagFilter}". Try clearing the filter or searching for something else.`
              : "Try adjusting your search or check back later for new posts."}
          </p>
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.authorAvatar || `https://placehold.co/40x40.png`} alt={post.authorName} data-ai-hint="person professional"/>
            <AvatarFallback>{post.authorName ? post.authorName.charAt(0).toUpperCase() : 'A'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{post.authorName}</p>
            <p className="text-xs text-muted-foreground">
              Posted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <CardTitle className="text-xl hover:text-primary transition-colors">
          <Link href={`/posts/${post.id}`}>{post.title}</Link>
        </CardTitle>
        <Badge variant="outline" className="w-fit">{post.category}</Badge>
      </CardHeader>

      {post.imageUrl && (
        <Link href={`/posts/${post.id}`} passHref legacyBehavior>
          <a className="block relative w-full h-48 overflow-hidden cursor-pointer">
            <Image src={post.imageUrl} alt={post.title} layout="fill" objectFit="cover" data-ai-hint="post image"/>
          </a>
        </Link>
      )}

      <CardContent className="flex-grow pt-4">
        <p className="text-muted-foreground line-clamp-3">{post.content}</p>
        {post.videoUrl && (
            <div className="mt-2">
                <a href={post.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    <Icons.link className="h-3 w-3" /> Watch Video
                </a>
            </div>
        )}
        {post.externalLinkUrl && (
            <div className="mt-2">
                 <a href={post.externalLinkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    <Icons.link className="h-3 w-3" /> {post.externalLinkText || "View Link"}
                </a>
            </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-3 border-t pt-4">
        <div className="flex justify-between w-full items-center">
            <div className="flex items-center gap-4 text-muted-foreground">
                <Button variant="ghost" size="sm" className="p-1 h-auto cursor-default hover:bg-transparent hover:text-muted-foreground">
                    <Icons.thumbsUp className="mr-1.5 h-4 w-4" /> {post.likesCount || 0}
                </Button>
                <Button variant="ghost" size="sm" className="p-1 h-auto cursor-default hover:bg-transparent hover:text-muted-foreground">
                    <Icons.discussions className="mr-1.5 h-4 w-4" /> {post.commentsCount || 0}
                </Button>
            </div>
             <Button variant="link" asChild className="p-0 h-auto text-primary self-end">
                <Link href={`/posts/${post.id}`}>Read More <Icons.arrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
        </div>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 w-full">
            {post.tags.map(tag => (
                <Link key={tag} href={`/posts?tag=${encodeURIComponent(tag)}`} passHref legacyBehavior>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">{tag}</Badge>
                </Link>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

const PostsPageSkeleton = () => (
  <div className="container mx-auto py-8 px-4 md:px-6">
    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
      <div><Skeleton className="h-10 w-48 mb-2" /><Skeleton className="h-5 w-72" /></div>
      <Skeleton className="h-10 w-36" />
    </div>
    <Card className="mb-6 p-4 shadow-sm bg-secondary">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)}
    </div>
  </div>
);

const PostCardSkeleton = () => (
  <Card className="flex flex-col h-full">
    <CardHeader>
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-6 w-3/4 mb-1" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </CardHeader>
    <Skeleton className="h-48 w-full" /> {/* For Image */}
    <CardContent className="flex-grow space-y-2 pt-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </CardContent>
    <CardFooter className="flex flex-col items-start gap-2 border-t pt-4">
       <div className="flex justify-between w-full items-center">
            <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-5 w-24 self-end" />
        </div>
      <div className="flex flex-wrap gap-1 pt-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </CardFooter>
  </Card>
);

