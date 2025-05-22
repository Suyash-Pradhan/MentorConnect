"use client";

import * as React from "react";
import { MentorshipRequestCard } from "@/components/mentorship/mentorship-request-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { placeholderMentorshipRequests } from "@/lib/placeholders"; // Using placeholder data
import type { MentorshipRequest, Role } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Simulate current user - replace with actual auth context
const currentUserId = "student123"; // Can be "student123" or "alumni456" etc.
const currentUserRole: Role = "student"; // Can be "student" or "alumni"

export default function MentorshipPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [requests, setRequests] = React.useState<MentorshipRequest[]>([]);

  // Simulate fetching requests
  React.useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      // Filter requests based on current user's role and ID
      const userRequests = placeholderMentorshipRequests.filter(req => 
        (currentUserRole === 'student' && req.studentId === currentUserId) ||
        (currentUserRole === 'alumni' && req.alumniId === currentUserId)
      );
      setRequests(userRequests);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleUpdateRequestStatus = (requestId: string, newStatus: 'accepted' | 'rejected' | 'messaged') => {
    // Simulate API call
    console.log(`Updating request ${requestId} to ${newStatus}`);
    setRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId ? { ...req, status: newStatus, respondedAt: new Date() } : req
      )
    );
    toast({ title: `Request ${newStatus}`, description: `Mentorship request has been ${newStatus}.`});
  };

  const categorizeRequests = (role: Role) => {
    if (role === 'student') {
      return {
        sent: requests.filter(req => req.studentId === currentUserId),
        // Potentially 'active' or 'completed' tabs could be added
      };
    } else { // alumni
      return {
        received: requests.filter(req => req.alumniId === currentUserId && req.status === 'pending'),
        accepted: requests.filter(req => req.alumniId === currentUserId && req.status === 'accepted'),
        // Potentially 'completed' or 'archived'
      };
    }
  };

  const categorized = categorizeRequests(currentUserRole);
  
  const renderRequestList = (reqList: MentorshipRequest[], emptyMessage: string) => {
    if (isLoading) {
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
            currentUserRole={currentUserRole}
            onUpdateRequestStatus={handleUpdateRequestStatus}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Mentorship Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          {currentUserRole === 'student'
            ? "Manage your mentorship requests sent to alumni."
            : "Manage mentorship requests received from students."}
        </p>
      </div>

      {currentUserRole === 'student' && (
        <Tabs defaultValue="sent" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:w-1/2 lg:w-1/3">
            <TabsTrigger value="sent">
                Sent Requests 
                {!isLoading && categorized.sent && <Badge variant="secondary" className="ml-2">{categorized.sent.length}</Badge>}
            </TabsTrigger>
            {/* Add more tabs for student if needed, e.g., "Active", "Completed" */}
             <TabsTrigger value="active" disabled>Active Mentorships</TabsTrigger>
          </TabsList>
          <TabsContent value="sent">
            {renderRequestList(categorized.sent || [], "You haven't sent any mentorship requests yet.")}
          </TabsContent>
           <TabsContent value="active">
             {renderRequestList([], "You have no active mentorships.")}
           </TabsContent>
        </Tabs>
      )}

      {currentUserRole === 'alumni' && (
        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:w-1/2 lg:w-1/3">
            <TabsTrigger value="received">
                Received Requests
                {!isLoading && categorized.received && <Badge variant="secondary" className="ml-2">{categorized.received.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="accepted">
                Accepted Requests
                {!isLoading && categorized.accepted && <Badge variant="secondary" className="ml-2">{categorized.accepted.length}</Badge>}
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
