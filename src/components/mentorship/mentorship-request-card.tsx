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

interface MentorshipRequestCardProps {
  request: MentorshipRequest;
  currentUserRole: Role; // 'student' or 'alumni'
  onUpdateRequestStatus: (requestId: string, newStatus: 'accepted' | 'rejected' | 'messaged', message?: string) => void;
}

const getStatusBadgeVariant = (status: MentorshipRequest['status']) => {
  switch (status) {
    case 'accepted': return 'default'; // Greenish or primary
    case 'rejected': return 'destructive';
    case 'pending': return 'secondary'; // Yellowish or muted
    case 'messaged': return 'outline'; // Bluish or accent
    default: return 'secondary';
  }
};


export function MentorshipRequestCard({ request, currentUserRole, onUpdateRequestStatus }: MentorshipRequestCardProps) {
  const { toast } = useToast();
  const [replyMessage, setReplyMessage] = React.useState("");
  const [isReplyDialogOpen, setIsReplyDialogOpen] = React.useState(false);

  const targetUser = currentUserRole === 'student' ? 
    { name: request.alumniName, avatar: request.alumniAvatar, role: 'Alumni' as const, id: request.alumniId } : 
    { name: request.studentName, avatar: request.studentAvatar, role: 'Student' as const, id: request.studentId };
  
  const initial = targetUser.name ? targetUser.name.charAt(0).toUpperCase() : targetUser.role.charAt(0);

  const handleAction = (status: 'accepted' | 'rejected') => {
    onUpdateRequestStatus(request.id, status);
    toast({ title: `Request ${status}`, description: `Mentorship request has been ${status}.`});
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
      </CardContent>
      {currentUserRole === 'alumni' && request.status === 'pending' && (
        <CardFooter className="p-4 border-t flex justify-end gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10">
                <Icons.close className="mr-2 h-4 w-4" /> Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to reject this request?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. You can optionally provide a reason for rejection.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleAction('rejected')} className="bg-destructive hover:bg-destructive/90">Confirm Reject</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button size="sm" onClick={() => handleAction('accepted')} className="bg-green-600 hover:bg-green-700 text-white">
            <Icons.check className="mr-2 h-4 w-4" /> Accept
          </Button>
        </CardFooter>
      )}
      { (request.status === 'accepted' || request.status === 'messaged') && (
         <CardFooter className="p-4 border-t flex justify-end gap-2">
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Icons.send className="mr-2 h-4 w-4" /> 
                    {currentUserRole === 'student' ? 'Reply to Alumni' : 'Message Student'}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Send a message to {targetUser.name}</DialogTitle>
                <DialogDescription>
                    Continue the conversation regarding this mentorship.
                </DialogDescription>
                </DialogHeader>
                <Textarea
                placeholder="Type your message here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
                />
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="button" onClick={handleAction('messaged')}>Send</Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
         </CardFooter>
      )}
    </Card>
  );
}
