
"use client";

import type { Profile, StudentProfile, AlumniProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";

interface ViewProfileProps {
  profile: Profile;
  currentUserProfile?: Profile | null; // To know who is viewing
  onMentorshipRequest?: (message: string) => void; // Callback for mentorship request
}

const ProfileInfoItem: React.FC<{ icon: React.ElementType; label: string; value?: string | number | string[] | null; isLink?: boolean; linkPrefix?: string }> = ({ icon: Icon, label, value, isLink = false, linkPrefix = '' }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  
  let displayValue: React.ReactNode = null;

  if (isLink && typeof value === 'string') {
    const href = value.startsWith('http://') || value.startsWith('https://') ? value : `${linkPrefix}${value}`;
    displayValue = (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
        {value}
      </a>
    );
  } else if (Array.isArray(value)) {
    displayValue = (
      <div className="flex flex-wrap gap-1 mt-1">
        {value.map((item, index) => (
          <Badge key={index} variant="secondary" className="text-sm">{item}</Badge>
        ))}
      </div>
    );
  } else {
    displayValue = <p className="text-md text-foreground">{String(value)}</p>;
  }

  return (
    <div className="flex items-start space-x-3 py-2">
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {displayValue}
      </div>
    </div>
  );
};

export function ViewProfile({ profile, currentUserProfile, onMentorshipRequest }: ViewProfileProps) {
  const { toast } = useToast();
  const [message, setMessage] = React.useState("");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = React.useState(false);
  
  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : (profile.email ? profile.email.charAt(0).toUpperCase() : "U");

  const canRequestMentorship = 
    profile.role === 'alumni' && 
    currentUserProfile?.role === 'student' && 
    profile.id !== currentUserProfile?.id &&
    typeof onMentorshipRequest === 'function';

  const handleRequestSubmit = () => {
    if (!message.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Message cannot be empty." });
      return;
    }
    if (onMentorshipRequest) {
      onMentorshipRequest(message);
    }
    setIsRequestDialogOpen(false);
    setMessage(""); 
  };

  return (
    <Card className="w-full shadow-lg overflow-hidden">
      <div className="relative h-48 bg-gradient-to-r from-primary to-accent">
         <Image 
            src="https://placehold.co/800x400.png"
            alt={`${profile.name || 'User'}'s cover photo`}
            layout="fill"
            objectFit="cover"
            className="opacity-50"
            data-ai-hint="abstract background"
          />
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 p-1 bg-background rounded-full shadow-md">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={profile.avatarUrl || `https://placehold.co/128x128.png`} alt={profile.name || "User"} data-ai-hint="person professional" />
            <AvatarFallback className="text-4xl">{initial}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      <CardHeader className="text-center mt-16 pt-8"> 
        <CardTitle className="text-3xl">{profile.name || "User Name"}</CardTitle>
        <CardDescription className="text-md text-muted-foreground">{profile.email}</CardDescription>
        {profile.role && <Badge variant="outline" className="mx-auto mt-2 text-md capitalize">{profile.role}</Badge>}
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {profile.role === 'student' && profile.studentProfile && (
          <section>
            <h3 className="text-xl font-semibold text-primary mb-3">Academic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <ProfileInfoItem icon={Icons.logo} label="College" value={profile.studentProfile.college} />
              <ProfileInfoItem icon={Icons.calendar} label="Year of Study" value={profile.studentProfile.year?.toString()} />
              <ProfileInfoItem icon={Icons.posts} label="Academic Interests" value={profile.studentProfile.academicInterests} />
              <ProfileInfoItem icon={Icons.helpCircle} label="Goals" value={profile.studentProfile.goals} />
            </div>
          </section>
        )}

        {profile.role === 'alumni' && profile.alumniProfile && (
          <section>
            <h3 className="text-xl font-semibold text-primary mb-3">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <ProfileInfoItem icon={Icons.myOpportunities} label="Job Title" value={profile.alumniProfile.jobTitle} />
              <ProfileInfoItem icon={Icons.company} label="Company" value={profile.alumniProfile.company} />
              <ProfileInfoItem icon={Icons.settings} label="Skills" value={profile.alumniProfile.skills} />
              <ProfileInfoItem icon={Icons.calendar} label="Years of Experience" value={profile.alumniProfile.experienceYears?.toString()} />
              <ProfileInfoItem icon={Icons.logo} label="Education" value={profile.alumniProfile.education} />
              <ProfileInfoItem icon={Icons.filter} label="Industry" value={profile.alumniProfile.industry} />
              <ProfileInfoItem icon={Icons.link} label="LinkedIn Profile" value={profile.alumniProfile.linkedinUrl} isLink linkPrefix="https://" />
            </div>
          </section>
        )}

        {(!profile.studentProfile && !profile.alumniProfile && profile.role) && (
          <p className="text-center text-muted-foreground py-4">
            More details may be available. User might need to complete their profile.
          </p>
        )}
         {(!profile.role) && (
            <p className="text-center text-muted-foreground py-4">
                This user has not selected a role yet.
            </p>
        )}

        {canRequestMentorship && (
          <div className="mt-6 pt-6 border-t">
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Icons.send className="mr-2 h-4 w-4" /> Request Mentorship
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Request Mentorship from {profile.name}</DialogTitle>
                  <DialogDescription>
                    Send a personalized message to {profile.name} explaining why you&apos;d like their mentorship.
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
