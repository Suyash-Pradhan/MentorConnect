
"use client";

import type { MentorshipRequest, Role } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { formatDistanceToNow } from 'date-fns';
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation"; // For navigation
import { getOrCreateChat } from "@/services/chatService"; // Import chat service
import { updateMentorshipRequestStatus } from "@/services/mentorshipService"; // For updating chatId
import { doc, updateDoc } from 'firebase/firestore'; // Added import for doc and updateDoc
import { db } from '@/lib/firebase'; // Added import for db

interface MentorshipRequestCardProps {
  request: MentorshipRequest;
  currentUserRole: Role; // 'student' or 'alumni'
  onUpdateRequestStatus: (requestId: string, newStatus: 'accepted' | 'rejected' | 'messaged', message?: string) => void;
}

const getStatusBadgeVariant = (status: MentorshipRequest['status']) => {
  switch (status) {
    case 'accepted': return 'default'; 
    case 'rejected': return 'destructive';
    case 'pending': return 'secondary';
    case 'messaged': return 'outline';
    default: return 'secondary';
  }
};


export function MentorshipRequestCard({ request, currentUserRole, onUpdateRequestStatus }: MentorshipRequestCardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [replyMessage, setReplyMessage] = React.useState("");
  const [isReplyDialogOpen, setIsReplyDialogOpen] = React.useState(false);
  const [isProcessingChat, setIsProcessingChat] = React.useState(false);

  const targetUser = currentUserRole === 'student' ?
    { name: request.alumniName, avatar: request.alumniAvatar, role: 'Alumni' as const, id: request.alumniId } :
    { name: request.studentName, avatar: request.studentAvatar, role: 'Student' as const, id: request.studentId };

  const initial = targetUser.name ? targetUser.name.charAt(0).toUpperCase() : targetUser.role.charAt(0);

  const handleAction = async (status: 'accepted' | 'rejected') => {
    if (status === 'accepted') {
      setIsProcessingChat(true);
      try {
        // When accepting, create/get chat session and store chatId on mentorship request
        const chatId = await getOrCreateChat(request.studentId, request.alumniId);
        // Update the mentorship request with this chatId (optional, but good for linking)
        await updateMentorshipRequestStatus(request.id, 'accepted', chatId); // Pass chatId as the third argument
        // Call parent's update status for UI refresh
        onUpdateRequestStatus(request.id, 'accepted'); // Keep this to update UI
        toast({title: "Request Accepted", description: "Navigating to chat..."});
        router.push(`/chat/${chatId}`);
      } catch (error) {
        console.error("Error creating or getting chat session:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not initiate chat. Please try again." });
        // Do not revert status here, as updateMentorshipRequestStatus might have partially succeeded or failed for other reasons
      } finally {
        setIsProcessingChat(false);
      }
    } else { // For 'rejected'
      onUpdateRequestStatus(request.id, status);
    }
  };

  const handleOpenChat = async () => {
    setIsProcessingChat(true);
    try {
      const chatIdToOpen = request.chatId || await getOrCreateChat(request.studentId, request.alumniId);
      if (!request.chatId && chatIdToOpen) {
        // If chatId wasn't on the request, update it
         await updateDoc(doc(db, 'mentorshipRequests', request.id), { chatId: chatIdToOpen });
      }
      router.push(`/chat/${chatIdToOpen}`);
    } catch (error) {
      console.error("Error opening chat:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not open chat." });
    } finally {
      setIsProcessingChat(false);
    }
  };
  
  const handleSendMessageInDialog = () => {
    if (!replyMessage.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Message cannot be empty." });
      return;
    }
    onUpdateRequestStatus(request.id, 'messaged', replyMessage);
    setIsReplyDialogOpen(false); 
    setReplyMessage(""); 
  };


  const getDialogTriggerButtonText = () => {
    // This dialog is now only for 'messaged' status. 'Accepted' goes directly to chat page.
    return currentUserRole === 'student' ? 'Reply to Alumni' : 'Message Student';
  };
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start gap-4 p-4 space-y-0">
        <Avatar className="h-12 w-12 border">
          <AvatarImage src={targetUser.avatar || `https://placehold.co/100x100.png`} alt={targetUser.name} data-ai-hint="person professional" />
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                <Link href={`/profile/${targetUser.id}`} className="hover:underline">
                  {targetUser.name}
                </Link>
                <span className="text-sm font-normal text-muted-foreground"> ({targetUser.role})</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Requested {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
              </CardDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(request.status)} className="capitalize text-xs">
              {request.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-foreground leading-relaxed line-clamp-3 mb-2">
          <span className="font-semibold">Message: </span>{request.message}
        </p>
        {currentUserRole === 'alumni' && request.studentGoals && (
          <p className="text-xs text-muted-foreground bg-secondary p-2 rounded-md">
            <span className="font-semibold">Student&apos;s Goals: </span>{request.studentGoals}
          </p>
        )}
        {request.respondedAt && (
            <p className="text-xs text-muted-foreground mt-1">
                Responded {formatDistanceToNow(new Date(request.respondedAt), { addSuffix: true })}
            </p>
        )}
        {request.status === 'accepted' && request.alumniMessage && currentUserRole === 'student' && (
          <p className="text-xs text-muted-foreground bg-accent/20 p-2 rounded-md mt-2">
            <span className="font-semibold">Alumni Note: </span>{request.alumniMessage}
          </p>
        )}
      </CardContent>
      
      {/* Footer for Pending Requests (Alumni View) */}
      {currentUserRole === 'alumni' && request.status === 'pending' && (
        <CardFooter className="p-4 border-t flex justify-end gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={isProcessingChat}>
                <Icons.close className="mr-2 h-4 w-4" /> Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to reject this request?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleAction('rejected')} className="bg-destructive hover:bg-destructive/90">Confirm Reject</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button size="sm" onClick={() => handleAction('accepted')} className="bg-green-600 hover:bg-green-700 text-primary-foreground" disabled={isProcessingChat}>
            {isProcessingChat ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/> : <Icons.check className="mr-2 h-4 w-4" />}
            Accept & Chat
          </Button>
        </CardFooter>
      )}

      {/* Footer for Accepted Requests (Both Views) */}
      {request.status === 'accepted' && (
         <CardFooter className="p-4 border-t flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenChat} disabled={isProcessingChat}>
                {isProcessingChat ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/> : <Icons.send className="mr-2 h-4 w-4" />}
                Open Chat
            </Button>
         </CardFooter>
      )}
      
      {/* Footer for Messaged Status (can continue messaging via dialog if not yet accepted) */}
      {request.status === 'messaged' && (
         <CardFooter className="p-4 border-t flex justify-end gap-2">
            {/* Dialog for 'messaged' status to continue sending messages if not yet accepted */}
         </CardFooter>
      )}
    </Card>
  );
}

// Add this to MentorshipService.ts if it's not there to update the doc
// import { doc, updateDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// ...
// export async function updateMentorshipRequestDoc(requestId: string, data: Partial<MentorshipRequest>): Promise<void> {
//   const requestDocRef = doc(db, 'mentorshipRequests', requestId);
//   await updateDoc(requestDocRef, data);
// }

