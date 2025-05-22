"use client";

import type { Profile, StudentProfile, AlumniProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import Image from "next/image";

interface ViewProfileProps {
  profile: Profile; // Combined profile data
}

const ProfileInfoItem: React.FC<{ icon: React.ElementType; label: string; value?: string | number | string[] | null }> = ({ icon: Icon, label, value }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="flex items-start space-x-3 py-2">
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Array.isArray(value) ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {value.map((item, index) => (
              <Badge key={index} variant="secondary" className="text-sm">{item}</Badge>
            ))}
          </div>
        ) : (
          <p className="text-md text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
};

export function ViewProfile({ profile }: ViewProfileProps) {
  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : (profile.email ? profile.email.charAt(0).toUpperCase() : "U");

  return (
    <Card className="w-full shadow-lg overflow-hidden">
      <div className="relative h-48 bg-gradient-to-r from-primary to-accent">
         <Image 
            src={profile.avatarUrl || `https://placehold.co/800x400.png`} 
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
      
      <CardHeader className="text-center mt-16 pt-8"> {/* Added mt-16 for avatar overlap */}
        <CardTitle className="text-3xl">{profile.name || "User Name"}</CardTitle>
        <CardDescription className="text-md text-muted-foreground">{profile.email}</CardDescription>
        <Badge variant="outline" className="mx-auto mt-2 text-md capitalize">{profile.role}</Badge>
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
            </div>
          </section>
        )}

        {!profile.studentProfile && !profile.alumniProfile && profile.role && (
          <p className="text-center text-muted-foreground py-4">
            Please complete your profile information by clicking the &quot;Edit Profile&quot; button.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
