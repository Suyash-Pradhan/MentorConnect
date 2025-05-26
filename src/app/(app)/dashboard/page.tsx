
"use client"; // Mark as client component due to hooks and state

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, MessageSquareHeart, UserPlus, Users, BookOpenText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Profile, Post } from "@/types"; // Import Post type
import { getProfile } from "@/services/profileService";
import { getAllPosts, getPostsByAuthor } from "@/services/postService"; // Import post services
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// MOCK: In a real app, this would come from your auth context (e.g., Firebase Auth)
const MOCK_CURRENT_USER_ID = "user123_dev"; // Can be "student123" or "alumni456" etc.
                                          // For testing, use "alumni456" to see alumni dashboard parts

export default function DashboardPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  
  // Student specific data
  const [recommendedAlumni, setRecommendedAlumni] = React.useState<Profile[]>([]); // Placeholder for now
  const [recentPosts, setRecentPosts] = React.useState<Post[]>([]);
  const [isLoadingRecentPosts, setIsLoadingRecentPosts] = React.useState(false);

  // Alumni specific data
  const [myRecentPosts, setMyRecentPosts] = React.useState<Post[]>([]);
  const [isLoadingMyPosts, setIsLoadingMyPosts] = React.useState(false);

  // Mock data for parts not yet connected to DB
  const studentDashboardStats = {
    pendingRequests: 2, // Mock
    upcomingMeetings: 1, // Mock
  };
  const alumniDashboardStats = {
    newMentorshipRequests: 3, // Mock
    activeMentees: 5, // Mock
  };


  React.useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const profile = await getProfile(MOCK_CURRENT_USER_ID);
        setCurrentUser(profile);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load your profile." });
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [toast]);

  React.useEffect(() => {
    if (currentUser?.role === 'student') {
      const fetchRecentPosts = async () => {
        setIsLoadingRecentPosts(true);
        try {
          const posts = await getAllPosts({ limit: 3 }); // Fetch latest 3 posts
          setRecentPosts(posts);
        } catch (error) {
          console.error("Failed to fetch recent posts:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not load recent posts." });
        } finally {
          setIsLoadingRecentPosts(false);
        }
      };
      fetchRecentPosts();
      // TODO: Fetch recommendedAlumni logic
      // For now, setting some placeholder alumni if needed for UI structure
      setRecommendedAlumni([
        // { id: "1", name: "Dr. Alok Sharma", field: "AI Research", avatar: "https://placehold.co/100x100.png?text=AS" },
        // { id: "2", name: "Priya Singh", field: "Software Engineering", avatar: "https://placehold.co/100x100.png?text=PS" },
      ]);
    } else if (currentUser?.role === 'alumni') {
      const fetchMyPosts = async () => {
        setIsLoadingMyPosts(true);
        try {
          const posts = await getPostsByAuthor(MOCK_CURRENT_USER_ID);
          setMyRecentPosts(posts.slice(0, 3)); // Show latest 3 of my posts
        } catch (error) {
          console.error("Failed to fetch my posts:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not load your posts." });
        } finally {
          setIsLoadingMyPosts(false);
        }
      };
      fetchMyPosts();
    }
  }, [currentUser, toast]);

  if (isLoadingProfile) {
    return <DashboardSkeleton />;
  }

  if (!currentUser) {
    return (
      <div className="text-center py-10">
        <p>Could not load user profile. Please try refreshing or logging in again.</p>
      </div>
    );
  }

  const userName = currentUser.name || "User";
  const userRole = currentUser.role;

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-3xl">Welcome back, {userName}!</CardTitle>
          <CardDescription>
            Here&apos;s what&apos;s happening on MentorConnect. You are logged in as a {userRole}.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm hover:shadow-lg transition-shadow">
          <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Users className="text-primary"/> My Profile</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Keep your information up-to-date.</p>
            <Button asChild><Link href="/profile">View/Edit Profile <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-lg transition-shadow">
          <CardHeader><CardTitle className="text-xl flex items-center gap-2"><MessageSquareHeart className="text-primary"/>Mentorships</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{userRole === 'student' ? "View your mentorship requests and connections." : "Manage mentorship requests from students."}</p>
            <Button asChild><Link href="/mentorship">Go to Mentorships <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>
        {userRole === 'student' && (
           <Card className="shadow-sm hover:shadow-lg transition-shadow">
            <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Users className="text-primary"/>Alumni Directory</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Find and connect with experienced alumni.</p>
              <Button asChild><Link href="/alumni-directory">Browse Directory <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </CardContent>
          </Card>
        )}
        {userRole === 'alumni' && (
           <Card className="shadow-sm hover:shadow-lg transition-shadow">
            <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Briefcase className="text-primary"/>Share Opportunities</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Post job openings, guidance, or success stories.</p>
              <Button asChild><Link href="/posts/create">Create New Post <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </CardContent>
          </Card>
        )}
      </div>

      {userRole === 'student' && (
        <Card className="shadow-md">
          <CardHeader><CardTitle className="text-2xl">Student Dashboard</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">You have <span className="font-semibold text-primary">{studentDashboardStats.pendingRequests} pending mentorship requests</span> and <span className="font-semibold text-primary">{studentDashboardStats.upcomingMeetings} upcoming meetings</span>.</p>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Recommended Alumni</h3>
              {/* Recommended Alumni logic needs to be implemented */}
              {recommendedAlumni.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendedAlumni.map(alumni => (
                    <Card key={alumni.id} className="p-4 flex items-center gap-3 shadow-sm">
                      <Image src={alumni.avatarUrl || `https://placehold.co/40x40.png?text=${alumni.name?.charAt(0)}`} alt={alumni.name || 'Alumni'} width={40} height={40} className="rounded-full" data-ai-hint="person professional" />
                      <div>
                        <p className="font-semibold">{alumni.name}</p>
                        <p className="text-sm text-muted-foreground">{alumni.alumniProfile?.industry}</p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto" asChild>
                          <Link href={`/alumni-directory/${alumni.id}`}>View</Link>
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No specific recommendations at this time. Explore the Alumni Directory!</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Recent Posts from Alumni</h3>
              {isLoadingRecentPosts ? <PostListSkeleton /> : recentPosts.length > 0 ? (
                <ul className="space-y-2">
                  {recentPosts.map(post => (
                    <li key={post.id} className="p-3 bg-secondary rounded-md shadow-sm">
                      <Link href={`/posts/${post.id}`} className="font-medium text-primary hover:underline">{post.title}</Link>
                      <p className="text-sm text-muted-foreground">by {post.authorName}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No recent posts from alumni. Check back later!</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {userRole === 'alumni' && (
        <Card className="shadow-md">
          <CardHeader><CardTitle className="text-2xl">Alumni Dashboard</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <p className="text-muted-foreground">You have <span className="font-semibold text-primary">{alumniDashboardStats.newMentorshipRequests} new mentorship requests</span> and are actively mentoring <span className="font-semibold text-primary">{alumniDashboardStats.activeMentees} students</span>.</p>
            <div>
              <h3 className="text-lg font-semibold mb-2">Your Recent Posts</h3>
               {isLoadingMyPosts ? <PostListSkeleton /> : myRecentPosts.length > 0 ? (
                 <ul className="space-y-2">
                  {myRecentPosts.map(post => (
                    <li key={post.id} className="p-3 bg-secondary rounded-md shadow-sm">
                      <Link href={`/posts/${post.id}`} className="font-medium text-primary hover:underline">{post.title}</Link>
                      {/* Add view count if available from DB */}
                    </li>
                  ))}
                </ul>
               ) : (
                 <p className="text-muted-foreground">You haven&apos;t made any posts yet.</p>
               )}
            </div>
            <Button asChild>
              <Link href="/my-opportunities">Manage All Posts <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <Card><CardHeader><Skeleton className="h-8 w-3/5" /><Skeleton className="h-4 w-4/5 mt-2" /></CardHeader></Card>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({length:3}).map((_,i) => (
        <Card key={i}><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-4 w-3/4 mb-4" /><Skeleton className="h-10 w-2/3" /></CardContent></Card>
      ))}
    </div>
    <Card><CardHeader><Skeleton className="h-7 w-1/3" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-5 w-full" /><div><Skeleton className="h-5 w-1/4 mb-2" /><div className="space-y-2">{Array.from({length:2}).map((_,j)=><Skeleton key={j} className="h-10 w-full"/>)}</div></div></CardContent></Card>
  </div>
);

const PostListSkeleton = () => (
  <ul className="space-y-2">
    {Array.from({length:2}).map((_,i) => (
      <li key={i} className="p-3 bg-secondary rounded-md shadow-sm space-y-1.5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </li>
    ))}
  </ul>
);
