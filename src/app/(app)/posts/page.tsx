
"use client";

import React from 'react';
import type { Post } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllPosts } from '@/services/postService'; // Import the service
import { useToast } from '@/hooks/use-toast';

// Simulate current user role - replace with actual auth context
const currentUserRole: 'student' | 'alumni' = 'student'; // Example, would come from auth context

const ALL_CATEGORIES_VALUE = "__ALL_CATEGORIES__";

export default function PostsPage() {
  const { toast } = useToast();
  const [allPosts, setAllPosts] = React.useState<Post[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');

  React.useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const postsData = await getAllPosts();
        setAllPosts(postsData);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load posts. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [toast]);

  const filteredPosts = allPosts
    .filter(post => post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.content.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(post => categoryFilter && categoryFilter !== ALL_CATEGORIES_VALUE ? post.category === categoryFilter : true);

  const categories = React.useMemo(() => {
    return Array.from(new Set(allPosts.map(p => p.category))).sort();
  }, [allPosts]);


  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <Skeleton className="h-10 w-48 mb-2" />
                <Skeleton className="h-5 w-72" />
            </div>
            {currentUserRole === 'alumni' && <Skeleton className="h-10 w-36" />}
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
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Alumni Posts</h1>
          <p className="text-lg text-muted-foreground">Guidance, job openings, and success stories from our alumni.</p>
        </div>
        {currentUserRole === 'alumni' && (
          <Button asChild>
            <Link href="/posts/create"> {/* TODO: Create this page */}
              <Icons.add className="mr-2 h-4 w-4" /> Create New Post
            </Link>
          </Button>
        )}
      </div>

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


      {filteredPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Icons.posts className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No Posts Found</h3>
          <p className="text-muted-foreground">Try adjusting your search or check back later for new posts.</p>
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
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
      <CardContent className="flex-grow">
        <p className="text-muted-foreground line-clamp-4">{post.content}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 border-t pt-4">
        <div className="flex flex-wrap gap-1">
          {post.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
        </div>
         <Button variant="link" asChild className="p-0 h-auto text-primary self-end">
          <Link href={`/posts/${post.id}`}>Read More <Icons.arrowRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

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
    <CardContent className="flex-grow space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </CardContent>
    <CardFooter className="flex flex-col items-start gap-2 border-t pt-4">
      <div className="flex flex-wrap gap-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-5 w-24 self-end" />
    </CardFooter>
  </Card>
);

