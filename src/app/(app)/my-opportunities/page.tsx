"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { placeholderPosts } from '@/lib/placeholders'; // Using placeholder posts for demo
import type { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

// Simulate current alumni user
const currentAlumniId = "alumni456"; 

export default function MyOpportunitiesPage() {
  const [myPosts, setMyPosts] = React.useState<Post[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate fetching posts by current alumni
    setIsLoading(true);
    setTimeout(() => {
      setMyPosts(placeholderPosts.filter(p => p.authorId === currentAlumniId));
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
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
            <Link href="/posts/create"> {/* Assuming a route for creating posts */}
                <Icons.add className="mr-2 h-4 w-4" /> Share New Opportunity
            </Link>
        </Button>
      </div>

      {myPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {myPosts.map(post => (
            <OpportunityCard key={post.id} post={post} />
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

function OpportunityCard({ post }: { post: Post }) {
  // Add a placeholder for views/engagement if available
  const engagementMetric = Math.floor(Math.random() * 200) + 50; // Random views

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
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-3">{post.content}</p>
        <p className="text-sm text-primary mt-2 font-medium">{engagementMetric} views/engagements</p>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/posts/${post.id}/edit`}> {/* Assuming edit route */}
            <Icons.edit className="mr-2 h-4 w-4" /> Edit
          </Link>
        </Button>
        <Button variant="destructive" size="sm" onClick={() => alert(`Delete post ${post.id}? (not implemented)`)}>
          <Icons.trash className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

const OpportunityCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="space-y-1.5">
            <Icons.spinner className="h-5 w-2/3 animate-spin" />
            <Icons.spinner className="h-3 w-24 animate-spin" />
        </div>
        <Icons.spinner className="h-5 w-16 rounded-full animate-spin" />
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      <Icons.spinner className="h-4 w-full animate-spin" />
      <Icons.spinner className="h-4 w-5/6 animate-spin" />
      <Icons.spinner className="h-4 w-1/3 mt-2 animate-spin" />
    </CardContent>
    <CardFooter className="border-t pt-4 flex justify-end gap-2">
      <Icons.spinner className="h-8 w-20 animate-spin" />
      <Icons.spinner className="h-8 w-20 animate-spin" />
    </CardFooter>
  </Card>
);
