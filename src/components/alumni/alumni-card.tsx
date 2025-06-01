
"use client";

import type { Profile, Role } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Icons } from "@/components/icons";
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
import { Textarea } from "@/components/ui/textarea";
import React from "react";
import { ViewProfile } from "../profile/view-profile"; 

interface AlumniCardProps {
  alumni: Profile; 
  currentUserRole?: Role | null; // Added to control mentorship button
  onMentorshipRequest: (message: string) => void; 
}

export function AlumniCard({ alumni, currentUserRole, onMentorshipRequest }: AlumniCardProps) {
  const { toast } = useToast();
  const [message, setMessage] = React.useState("");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = React.useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);

  if (alumni.role !== 'alumni' || !alumni.alumniProfile) {
    return null; 
  }

  const { name, email, avatarUrl, alumniProfile } = alumni;
  const initial = name ? name.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : "A");

  const handleRequestSubmit = () => {
    if (!message.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Message cannot be empty." });
      return;
    }
    onMentorshipRequest(message); 
    setIsRequestDialogOpen(false);
    setMessage(""); 
  };

  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
        <Avatar className="h-16 w-16 border">
          <AvatarImage src={avatarUrl || `https://placehold.co/100x100.png`} alt={name || "Alumni"} data-ai-hint="person professional" />
          <AvatarFallback className="text-xl">{initial}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-xl mb-1">{name || "Alumni Name"}</CardTitle>
          <CardDescription className="text-sm text-primary">{alumniProfile.jobTitle}</CardDescription>
          <CardDescription className="text-xs text-muted-foreground">{alumniProfile.company}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-muted-foreground mb-1">Industry</h4>
          <p className="text-sm text-foreground">{alumniProfile.industry}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-1">Key Skills</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {alumniProfile.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary">{skill}</Badge>
            ))}
            {alumniProfile.skills.length > 3 && <Badge variant="outline">+{alumniProfile.skills.length - 3} more</Badge>}
          </div>
        </div>
         {alumniProfile.linkedinUrl && (
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-muted-foreground mb-1">Connect</h4>
            <a 
              href={alumniProfile.linkedinUrl.startsWith('http') ? alumniProfile.linkedinUrl : `https://${alumniProfile.linkedinUrl}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Icons.link className="h-3 w-3" /> LinkedIn
            </a>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t flex flex-col sm:flex-row gap-2">
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto flex-1">
              <Icons.profile className="mr-2 h-4 w-4" /> View Full Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{alumni.name}'s Profile</DialogTitle>
            </DialogHeader>
            <ViewProfile profile={alumni} />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Close</Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {currentUserRole === 'student' && (
          <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto flex-1">
                <Icons.send className="mr-2 h-4 w-4" /> Request Mentorship
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Request Mentorship from {name}</DialogTitle>
                <DialogDescription>
                  Send a personalized message to {name} explaining why you&apos;d like their mentorship.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Textarea
                  placeholder="Hi, I'm interested in your expertise in..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="button" onClick={handleRequestSubmit}>Send Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
}
