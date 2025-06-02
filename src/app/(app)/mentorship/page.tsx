
"use client";

import * as React from "react";
import { MentorshipRequestCard } from "@/components/mentorship/mentorship-request-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MentorshipRequest, Role } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getMentorshipRequestsForUser, updateMentorshipRequestStatus } from "@/services/mentorshipService";
import { useUserProfile } from "@/contexts/user-profile-context"; 

export default function MentorshipPage() {
  const { toast } = useToast();
  const { userProfile, profileLoading, profileError } = useUserProfile(); 

  const [requests, setRequests] = React.useState<MentorshipRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = React.useState(true);

  React.useEffect(() => {
    if (profileLoading) return; 

    if (!userProfile || !userProfile.role) {
      setIsLoadingRequests(false);
      setRequests([]); 
      return;
    }

    const fetchMentorshipData = async () => {
      setIsLoadingRequests(true);
      try {
        const fetchedRequests = await getMentorshipRequestsForUser(userProfile.id, userProfile.role);
        setRequests(fetchedRequests);
      } catch (error) {
        console.error("Error fetching mentorship data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load mentorship requests." });
        setRequests([]);
      } finally {
        setIsLoadingRequests(false);
      }
    };

    fetchMentorshipData();
  }, [userProfile, profileLoading, toast]);

  const handleUpdateRequestStatus = async (requestId: string, newStatus: 'accepted' | 'rejected' | 'messaged', message?: string) => {
    try {
      await updateMentorshipRequestStatus(requestId, newStatus, message);
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId ? { ...req, status: newStatus, respondedAt: new Date(), alumniMessage: newStatus === 'messaged' ? message : req.alumniMessage, chatId: newStatus === 'accepted' ? message : req.chatId } : req
        )
      );
      toast({ title: `Request ${newStatus}`, description: `Mentorship request has been ${newStatus}.`});
    } catch (error) {
      console.error("Error updating request status:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update request status." });
    }
  };

  const categorizeRequests = (role: Role | null) => {
    if (!role || !userProfile) return { sent: [], received: [], accepted: [], active: [] }; // Added active for student
    
    if (role === 'student') {
      return {
        sent: requests.filter(req => req.studentId === userProfile.id && (req.status === 'pending' || req.status === 'messaged' || req.status === 'rejected')),
        received: [], // Students don't "receive" requests in this model
        accepted: requests.filter(req => req.studentId === userProfile.id && req.status === 'accepted'), // This will populate "Active Mentorships"
        active: requests.filter(req => req.studentId === userProfile.id && req.status === 'accepted'), // Alias for clarity if needed elsewhere
      };
    } else { // alumni
      return {
        received: requests.filter(req => req.alumniId === userProfile.id && req.status === 'pending'),
        accepted: requests.filter(req => req.alumniId === userProfile.id && req.status === 'accepted'),
        sent: [], // Alumni don't send requests
        active: requests.filter(req => req.alumniId === userProfile.id && req.status === 'accepted'), // Their accepted requests are their active ones
      };
    }
  };
  
  const categorized = categorizeRequests(userProfile?.role || null);
  
  const renderRequestList = (reqList: MentorshipRequest[], emptyMessage: string) => {
    if (isLoadingRequests) { 
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {Array.from({length: 2}).map((_, i) => <RequestCardSkeleton key={i} />)}
        </div>
      );
    }
    if (reqList.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Icons.mentorship className="mx-auto h-16 w-16 mb-4" />
          <p>{emptyMessage}</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {reqList.map((request) => (
          <MentorshipRequestCard
            key={request.id}
            request={request}
            currentUserRole={userProfile?.role || 'student'} // Default to student if role somehow null, though outer checks should prevent
            onUpdateRequestStatus={handleUpdateRequestStatus}
          />
        ))}
      </div>
    );
  };

  if (profileLoading) { 
     return (
      <div className="w-full">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {Array.from({length: 2}).map((_, i) => <RequestCardSkeleton key={i} />)}
        </div>
      </div>
     );
  }

  if (profileError) { 
    return (
      <div className="w-full text-center py-10">
        <Icons.warning className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-destructive">Error Loading Profile</h2>
        <p className="text-muted-foreground">Could not load your profile information for the mentorship page.</p>
      </div>
    );
  }

  if (!userProfile?.role) { 
    return (
      <div className="w-full text-center py-10">
        <Icons.warning className="mx-auto h-16 w-16 text-destructive mb-4" />
        <p className="text-lg text-muted-foreground">Your role is not set. Please update your profile.</p>
        <Button asChild className="mt-4"><Link href="/profile">Go to Profile</Link></Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Mentorship Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          {userProfile.role === 'student'
            ? "Manage your mentorship requests and active connections."
            : "Manage mentorship requests received from students."}
        </p>
      </div>

      {userProfile.role === 'student' && (
        <Tabs defaultValue="sent" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:w-1/2 lg:w-1/3">
            <TabsTrigger value="sent">
                Sent Requests 
                {!isLoadingRequests && categorized.sent && <Badge variant="secondary" className="ml-2">{categorized.sent.length}</Badge>}
            </TabsTrigger>
             <TabsTrigger value="active"> {/* Changed from value="accepted" */}
                Active Mentorships
                {!isLoadingRequests && categorized.accepted && <Badge variant="secondary" className="ml-2">{categorized.accepted.length}</Badge>}
             </TabsTrigger>
          </TabsList>
          <TabsContent value="sent">
            {renderRequestList(categorized.sent || [], "You haven't sent any mentorship requests, or they have been accepted or archived.")}
          </TabsContent>
           <TabsContent value="active"> {/* Changed from value="accepted" */}
             {renderRequestList(categorized.accepted || [], "You have no active mentorships.")}
           </TabsContent>
        </Tabs>
      )}

      {userProfile.role === 'alumni' && (
        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:w-1/2 lg:w-1/3">
            <TabsTrigger value="received">
                Received Requests
                {!isLoadingRequests && categorized.received && <Badge variant="secondary" className="ml-2">{categorized.received.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="accepted">
                Accepted Requests
                {!isLoadingRequests && categorized.accepted && <Badge variant="secondary" className="ml-2">{categorized.accepted.length}</Badge>}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="received">
            {renderRequestList(categorized.received || [], "You have no new mentorship requests.")}
          </TabsContent>
          <TabsContent value="accepted">
            {renderRequestList(categorized.accepted || [], "You haven't accepted any mentorship requests yet.")}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

const RequestCardSkeleton = () => (
  <Card className="shadow-sm">
    <CardHeader className="flex flex-row items-start gap-4 p-4 space-y-0">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24 mt-1" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-4 pt-0 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
       <Skeleton className="h-3 w-28 mt-1" />
    </CardContent>
    <CardFooter className="p-4 border-t flex justify-end gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </CardFooter>
  </Card>
);


    