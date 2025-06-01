
"use client";

import React from 'react';
import type { DiscussionThread, Profile } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllDiscussionThreads, createDiscussionThread } from '@/services/discussionService';
import { getProfile } from '@/services/profileService'; // To get current user details

// MOCK: In a real app, this would come from your auth context (e.g., Firebase Auth)
const MOCK_CURRENT_USER_ID = "user123_dev"; 

const newThreadSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100),
  content: z.string().min(10, "Content must be at least 10 characters.").max(2000),
});
type NewThreadFormValues = z.infer<typeof newThreadSchema>;

export default function DiscussionsPage() {
  const [threads, setThreads] = React.useState<DiscussionThread[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [currentUserProfile, setCurrentUserProfile] = React.useState<Profile | null>(null);
  const { toast } = useToast();

  const form = useForm<NewThreadFormValues>({
    resolver: zodResolver(newThreadSchema),
    defaultValues: { title: "", content: "" },
  });

  React.useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [fetchedThreads, userProfile] = await Promise.all([
          getAllDiscussionThreads(),
          getProfile(MOCK_CURRENT_USER_ID)
        ]);
        setThreads(fetchedThreads);
        setCurrentUserProfile(userProfile);
      } catch (error) {
        console.error("Error fetching discussion data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load discussions." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [toast]);

  const filteredThreads = threads
    .filter(thread => thread.title.toLowerCase().includes(searchTerm.toLowerCase()) || thread.content.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCreateThread = async (values: NewThreadFormValues) => {
    if (!currentUserProfile || currentUserProfile.role !== 'alumni') {
      toast({ variant: "destructive", title: "Permission Denied", description: "Only alumni can create new discussion threads." });
      return;
    }
    
    try {
      const newThreadData: Omit<DiscussionThread, 'id' | 'createdAt' | 'lastActivityAt' | 'commentsCount'> = {
        title: values.title,
        content: values.content,
        createdBy: currentUserProfile.id,
        creatorName: currentUserProfile.name || "Anonymous Alumni",
        creatorAvatar: currentUserProfile.avatarUrl,
        creatorRole: 'alumni', // Explicitly set
      };
      const newThreadId = await createDiscussionThread(newThreadData);
      // For immediate UI update, we create a client-side representation.
      // Ideally, re-fetch or get the created object from the service.
      const displayNewThread: DiscussionThread = {
        ...newThreadData,
        id: newThreadId,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        commentsCount: 0,
      };
      setThreads(prev => [displayNewThread, ...prev]);
      toast({ title: "Thread Created!", description: "Your new discussion thread has been posted." });
      setIsCreateDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create thread:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not create thread." });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-5 w-80" />
            </div>
            <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-12 w-full mb-6"/>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <ThreadCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Discussions</h1>
          <p className="text-lg text-muted-foreground">Engage in conversations, ask questions, and share knowledge.</p>
        </div>
        {currentUserProfile?.role === 'alumni' && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Icons.add className="mr-2 h-4 w-4" /> Start New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl">Start a New Discussion Thread</DialogTitle>
                <DialogDescription>
                  Share your thoughts, ask questions, or start a conversation.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateThread)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thread Title</FormLabel>
                        <FormControl><Input placeholder="Enter a clear and concise title" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Message/Question</FormLabel>
                        <FormControl><Textarea placeholder="Start typing your message or question..." rows={5} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                      Create Thread
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="mb-6 p-4 shadow-sm bg-secondary">
         <div className="relative">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder="Search discussions by title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
            />
        </div>
      </Card>

      {filteredThreads.length > 0 ? (
        <div className="space-y-4">
          {filteredThreads.map(thread => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Icons.discussions className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No Discussions Found</h3>
          <p className="text-muted-foreground">Try a different search or be the first to start a new discussion!</p>
        </div>
      )}
    </div>
  );
}

function ThreadCard({ thread }: { thread: DiscussionThread }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg hover:text-primary transition-colors">
           <Link href={`/discussions/${thread.id}`}>{thread.title}</Link>
        </CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar className="h-6 w-6">
            <AvatarImage src={thread.creatorAvatar || `https://placehold.co/24x24.png`} alt={thread.creatorName} data-ai-hint="person"/>
            <AvatarFallback>{thread.creatorName?.charAt(0)?.toUpperCase() || 'A'}</AvatarFallback>
          </Avatar>
          <span>Started by <Link href={`/profile/${thread.createdBy}`} className="font-medium hover:underline">{thread.creatorName}</Link></span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{thread.content}</p>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground flex justify-between items-center pt-3 border-t">
        <div>
          <span>{thread.commentsCount || 0} comments</span>
          <span className="mx-1">•</span>
          <span>Last activity: {formatDistanceToNow(new Date(thread.lastActivityAt), { addSuffix: true })}</span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/discussions/${thread.id}`}>View Discussion <Icons.arrowRight className="ml-1 h-3 w-3" /></Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

const ThreadCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <div className="flex items-center gap-2 text-xs">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </CardHeader>
    <CardContent className="pt-0 pb-3 space-y-1.5">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </CardContent>
    <CardFooter className="text-xs flex justify-between items-center pt-3 border-t">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-32" />
    </CardFooter>
  </Card>
);
