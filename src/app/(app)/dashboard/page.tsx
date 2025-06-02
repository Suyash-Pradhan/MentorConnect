
"use client"; 

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, MessageSquareHeart, UserPlus, Users, BookOpenText, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Profile, Post, MentorshipRequest } from "@/types";
import { getProfile, getProfilesByRole } from "@/services/profileService";
import { getAllPosts, getPostsByAuthor } from "@/services/postService";
import { getMentorshipRequestsForUser } from "@/services/mentorshipService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getSmartAlumniRecommendations, type SmartAlumniRecommendationsInput } from "@/ai/flows/smart-alumni-recommendations";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
// Removed: onAuthStateChanged, type User as FirebaseUser - AppLayout handles auth state

export default function DashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  
  // Student specific data
  const [recommendedAlumni, setRecommendedAlumni] = React.useState<Profile[]>([]); 
  const [isLoadingRecommendations, setIsLoadingRecommendations] = React.useState(false);
  const [recentPosts, setRecentPosts] = React.useState<Post[]>([]);
  const [isLoadingRecentPosts, setIsLoadingRecentPosts] = React.useState(false);

  // Alumni specific data
  const [myRecentPosts, setMyRecentPosts] = React.useState<Post[]>([]);
  const [isLoadingMyPosts, setIsLoadingMyPosts] = React.useState(false);
  const [newMentorshipRequestsCount, setNewMentorshipRequestsCount] = React.useState(0);
  const [activeMenteesCount, setActiveMenteesCount] = React.useState(0);
  const [isLoadingMentorshipStats, setIsLoadingMentorshipStats] = React.useState(false);

  // Mock data for parts not yet connected to DB for student
  const studentDashboardStats = {
    pendingRequests: 0, 
    upcomingMeetings: 0, 
  };

  React.useEffect(() => {
    // AppLayout ensures auth.currentUser is populated before this page renders.
    const firebaseUser = auth.currentUser; 
    if (!firebaseUser) {
      // This should ideally not happen if AppLayout is working correctly.
      // As a fallback, redirect to login.
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const profile = await getProfile(firebaseUser.uid);
        if (profile) {
          setCurrentUser(profile);
          if (!profile.role) {
            router.push('/role-selection');
          } else if (!profile.name) {
            router.push('/profile?edit=true&from=dashboard');
          }
        } else {
          // This case implies profile document doesn't exist in Firestore for an authenticated user.
          // This could happen if profile creation failed during signup.
          // Redirect to role-selection which should ideally create the profile or guide user.
          router.push('/role-selection'); 
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load your profile." });
        // Fallback to login on catastrophic profile error, though AppLayout might also catch this
        router.push('/login'); 
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [router, toast]); // Removed firebaseUser and authLoading as dependencies

  React.useEffect(() => {
    if (!currentUser) return; // Data fetching depends on currentUser profile

    if (currentUser.role === 'student') {
      const fetchStudentData = async () => {
        setIsLoadingRecentPosts(true);
        setIsLoadingRecommendations(true); // Ensure this is set for student
        try {
          const posts = await getAllPosts({ limit: 3 }); 
          setRecentPosts(posts);
        } catch (error) {
          console.error("Failed to fetch recent posts:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not load recent posts." });
        } finally {
          setIsLoadingRecentPosts(false);
        }

        if (currentUser.studentProfile) {
          try {
            const alumniForAI = await getProfilesByRole('alumni', { limit: 50 }); 
             if (alumniForAI.length === 0) {
              setRecommendedAlumni([]);
              setIsLoadingRecommendations(false); // Ensure loading state is cleared
              return;
            }

            const alumniProfilesString = alumniForAI
              .map(alumni => `Name: ${alumni.name || 'N/A'}, Industry: ${alumni.alumniProfile?.industry || 'N/A'}, Skills: ${(alumni.alumniProfile?.skills || []).join(', ') || 'N/A'}`)
              .join('; ');

            const aiInput: SmartAlumniRecommendationsInput = {
              studentInterests: currentUser.studentProfile.academicInterests.join(', ') || 'General',
              studentGoals: currentUser.studentProfile.goals || 'General career development',
              studentAcademicInfo: `College: ${currentUser.studentProfile.college}, Year: ${currentUser.studentProfile.year}`,
              alumniProfiles: alumniProfilesString,
            };
            
            const recommendationsOutput = await getSmartAlumniRecommendations(aiInput);
            const recommendedNames = recommendationsOutput.recommendedAlumni.split(',').map(name => name.trim().toLowerCase());
            
            const filteredRecommendedAlumni = alumniForAI.filter(alumni => 
              alumni.name && recommendedNames.includes(alumni.name.toLowerCase())
            );
            setRecommendedAlumni(filteredRecommendedAlumni.slice(0,3)); 

          } catch (error) {
            console.error("Failed to fetch smart alumni recommendations:", error);
            toast({ variant: "destructive", title: "AI Error", description: "Could not load alumni recommendations." });
          } finally {
            setIsLoadingRecommendations(false);
          }
        } else {
             setIsLoadingRecommendations(false); // Ensure loading state is cleared if no student profile
        }
      };
      fetchStudentData();

      const fetchStudentMentorshipStats = async () => {
         try {
           const requests = await getMentorshipRequestsForUser(currentUser.id, 'student');
           studentDashboardStats.pendingRequests = requests.filter(req => req.status === 'pending').length;
         } catch (error) {
            console.error("Failed to fetch student mentorship stats:", error);
         }
      };
      fetchStudentMentorshipStats();

    } else if (currentUser.role === 'alumni') {
      const fetchAlumniData = async () => {
        setIsLoadingMyPosts(true);
        setIsLoadingMentorshipStats(true);
        try {
          const posts = await getPostsByAuthor(currentUser.id); 
          setMyRecentPosts(posts.slice(0, 3)); 
        } catch (error) {
          console.error("Failed to fetch my posts:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not load your posts." });
        } finally {
          setIsLoadingMyPosts(false);
        }

        try {
          const requests = await getMentorshipRequestsForUser(currentUser.id, 'alumni');
          const pendingCount = requests.filter(req => req.status === 'pending').length;
          const acceptedCount = requests.filter(req => req.status === 'accepted').length;
          setNewMentorshipRequestsCount(pendingCount);
          setActiveMenteesCount(acceptedCount);
        } catch (error) {
          console.error("Failed to fetch mentorship stats:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not load mentorship statistics." });
        } finally {
          setIsLoadingMentorshipStats(false);
        }
      };
      fetchAlumniData();
    }
  }, [currentUser, toast]); // Fetch data when currentUser profile is loaded/changed

  if (isLoadingProfile || !currentUser) { 
    // AppLayout handles overall auth loading. Dashboard shows skeleton while its specific profile loads.
    return <DashboardSkeleton />;
  }

  const userName = currentUser.name || "User";
  const userRole = currentUser.role;

  return (
    <div className="space-y-6 w-full">
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
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">You have <span className="font-semibold text-primary">{studentDashboardStats.pendingRequests} pending mentorship requests</span> and <span className="font-semibold text-primary">{studentDashboardStats.upcomingMeetings} upcoming meetings</span>.</p>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Sparkles className="text-accent h-5 w-5"/> Recommended Alumni for You</h3>
              {isLoadingRecommendations ? <RecommendedAlumniSkeleton /> : recommendedAlumni.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendedAlumni.map(alumni => (
                    <Card key={alumni.id} className="p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                      <Image src={alumni.avatarUrl || `https://placehold.co/40x40.png?text=${alumni.name?.charAt(0)}`} alt={alumni.name || 'Alumni'} width={40} height={40} className="rounded-full" data-ai-hint="person professional"/>
                      <div>
                        <p className="font-semibold">{alumni.name}</p>
                        <p className="text-sm text-muted-foreground">{alumni.alumniProfile?.industry}</p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto" asChild>
                          <Link href={`/alumni-directory`}>View</Link> 
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
                    <li key={post.id} className="p-3 bg-secondary rounded-md shadow-sm hover:bg-secondary/80 transition-colors">
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
            {isLoadingMentorshipStats ? (
              <Skeleton className="h-5 w-3/4" />
            ) : (
              <p className="text-muted-foreground">
                You have <span className="font-semibold text-primary">{newMentorshipRequestsCount} new mentorship requests</span> and are actively mentoring <span className="font-semibold text-primary">{activeMenteesCount} students</span>.
              </p>
            )}
            <div>
              <h3 className="text-lg font-semibold mb-2">Your Recent Posts</h3>
               {isLoadingMyPosts ? <PostListSkeleton /> : myRecentPosts.length > 0 ? (
                 <ul className="space-y-2">
                  {myRecentPosts.map(post => (
                    <li key={post.id} className="p-3 bg-secondary rounded-md shadow-sm hover:bg-secondary/80 transition-colors">
                      <Link href={`/posts/${post.id}`} className="font-medium text-primary hover:underline">{post.title}</Link>
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
  <div className="space-y-6 w-full">
    <Card><CardHeader><Skeleton className="h-8 w-3/5" /><Skeleton className="h-4 w-4/5 mt-2" /></CardHeader></Card>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({length:3}).map((_,i) => (
        <Card key={i}><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-4 w-3/4 mb-4" /><Skeleton className="h-10 w-2/3" /></CardContent></Card>
      ))}
    </div>
    <Card>
        <CardHeader><Skeleton className="h-7 w-1/3" /></CardHeader>
        <CardContent className="space-y-6">
            <Skeleton className="h-5 w-full mb-4" /> 
            <div>
                <Skeleton className="h-6 w-1/4 mb-3" />
                <RecommendedAlumniSkeleton />
            </div>
            <div>
                <Skeleton className="h-6 w-1/3 mb-3" />
                <PostListSkeleton />
            </div>
             <Skeleton className="h-10 w-40 mt-2" />
        </CardContent>
    </Card>
  </div>
);

const RecommendedAlumniSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({length:2}).map((_,j)=>(
            <Card key={j} className="p-4 flex items-center gap-3 shadow-sm">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-16" />
            </Card>
        ))}
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
