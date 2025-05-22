import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, MessageSquareHeart, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Mock data - replace with actual data fetching and role-based logic
const userName = "User"; // Should come from user session
const userRole = "student"; // Should come from user session ('student' or 'alumni')

const studentDashboardData = {
  pendingRequests: 2,
  upcomingMeetings: 1,
  recommendedAlumni: [
    { id: "1", name: "Dr. Alok Sharma", field: "AI Research", avatar: "https://placehold.co/100x100.png?text=AS" },
    { id: "2", name: "Priya Singh", field: "Software Engineering", avatar: "https://placehold.co/100x100.png?text=PS" },
  ],
  recentPosts: [
    { id: "post1", title: "Navigating Your First Job Interview", author: "Rajesh Kumar" },
    { id: "post2", title: "The Future of Web Development", author: "Anita Desai" },
  ]
};

const alumniDashboardData = {
  newMentorshipRequests: 3,
  activeMentees: 5,
  myRecentPosts: [
     { id: "mypost1", title: "Tips for Effective Networking", views: 150 },
  ],
};

export default function DashboardPage() {
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
        {/* Common Quick Actions */}
        <Card className="shadow-sm hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Users className="text-primary"/> My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Keep your information up-to-date.</p>
            <Button asChild>
              <Link href="/profile">View/Edit Profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><MessageSquareHeart className="text-primary"/>Mentorships</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {userRole === 'student' ? "View your mentorship requests and connections." : "Manage mentorship requests from students."}
            </p>
            <Button asChild>
              <Link href="/mentorship">Go to Mentorships <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
        
        {userRole === 'student' && (
           <Card className="shadow-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Users className="text-primary"/>Alumni Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Find and connect with experienced alumni.</p>
              <Button asChild>
                <Link href="/alumni-directory">Browse Directory <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        )}
        
        {userRole === 'alumni' && (
           <Card className="shadow-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Briefcase className="text-primary"/>Share Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Post job openings, guidance, or success stories.</p>
              <Button asChild>
                <Link href="/posts/create">Create New Post <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Role-Specific Sections */}
      {userRole === 'student' && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Student Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">You have <span className="font-semibold text-primary">{studentDashboardData.pendingRequests} pending mentorship requests</span> and <span className="font-semibold text-primary">{studentDashboardData.upcomingMeetings} upcoming meetings</span>.</p>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Recommended Alumni</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {studentDashboardData.recommendedAlumni.map(alumni => (
                  <Card key={alumni.id} className="p-4 flex items-center gap-3 shadow-sm">
                    <Image src={alumni.avatar} alt={alumni.name} width={40} height={40} className="rounded-full" data-ai-hint="person professional" />
                    <div>
                      <p className="font-semibold">{alumni.name}</p>
                      <p className="text-sm text-muted-foreground">{alumni.field}</p>
                    </div>
                     <Button variant="outline" size="sm" className="ml-auto" asChild>
                        <Link href={`/alumni-directory/${alumni.id}`}>View</Link>
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
             <div>
              <h3 className="text-lg font-semibold mb-2">Recent Posts from Alumni</h3>
              <ul className="space-y-2">
                {studentDashboardData.recentPosts.map(post => (
                  <li key={post.id} className="p-3 bg-secondary rounded-md shadow-sm">
                    <Link href={`/posts/${post.id}`} className="font-medium text-primary hover:underline">{post.title}</Link>
                    <p className="text-sm text-muted-foreground">by {post.author}</p>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {userRole === 'alumni' && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Alumni Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <p className="text-muted-foreground">You have <span className="font-semibold text-primary">{alumniDashboardData.newMentorshipRequests} new mentorship requests</span> and are actively mentoring <span className="font-semibold text-primary">{alumniDashboardData.activeMentees} students</span>.</p>
            <div>
              <h3 className="text-lg font-semibold mb-2">Your Recent Posts</h3>
               <ul className="space-y-2">
                {alumniDashboardData.myRecentPosts.map(post => (
                  <li key={post.id} className="p-3 bg-secondary rounded-md shadow-sm">
                    <Link href={`/posts/${post.id}`} className="font-medium text-primary hover:underline">{post.title}</Link>
                    <p className="text-sm text-muted-foreground">{post.views} views</p>
                  </li>
                ))}
              </ul>
            </div>
            <Button asChild>
              <Link href="/posts">Manage All Posts <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
