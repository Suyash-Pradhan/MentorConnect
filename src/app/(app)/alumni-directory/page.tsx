
"use client";

import * as React from "react";
import { AlumniCard } from "@/components/alumni/alumni-card";
import { AlumniFilters, type AlumniFiltersState } from "@/components/alumni/alumni-filters";
import type { Profile, MentorshipRequest, Role } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button"; 
import Link from "next/link"; 
import { getProfilesByRole } from "@/services/profileService"; // getProfile was removed, not needed here directly
import { createMentorshipRequest } from "@/services/mentorshipService";
import { useUserProfile } from "@/contexts/user-profile-context"; // Import context hook

export default function AlumniDirectoryPage() {
  const { toast } = useToast();
  const { userProfile, profileLoading: isCurrentUserProfileLoading } = useUserProfile(); // Get current user from context

  const [isLoadingAlumni, setIsLoadingAlumni] = React.useState(true);
  const [allAlumni, setAllAlumni] = React.useState<Profile[]>([]);
  const [filteredAlumni, setFilteredAlumni] = React.useState<Profile[]>([]);
  
  React.useEffect(() => {
    const fetchPageData = async () => {
      setIsLoadingAlumni(true);
      try {
        // Fetch alumni data regardless of current user profile loading status first
        const alumniData = await getProfilesByRole('alumni');
        setAllAlumni(alumniData);
        setFilteredAlumni(alumniData);
      } catch (error) {
        console.error("Failed to fetch alumni:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load alumni data. Please try again later.",
        });
      } finally {
        setIsLoadingAlumni(false);
      }
    };
    fetchPageData();
  }, [toast]);

  const handleFilterChange = React.useCallback((filters: AlumniFiltersState) => {
    let result = allAlumni;
    if (filters.searchTerm) {
      result = result.filter(alumni =>
        alumni.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        alumni.email?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    if (filters.skills.length > 0) {
      result = result.filter(alumni =>
        filters.skills.every(skill => alumni.alumniProfile?.skills.includes(skill))
      );
    }
    if (filters.industry) {
      result = result.filter(alumni =>
        alumni.alumniProfile?.industry.toLowerCase() === filters.industry.toLowerCase()
      );
    }
    if (filters.company) {
      result = result.filter(alumni =>
        alumni.alumniProfile?.company.toLowerCase().includes(filters.company.toLowerCase())
      );
    }
    setFilteredAlumni(result);
  }, [allAlumni]);

  const handleMentorshipRequest = async (alumni: Profile, message: string) => {
    if (!userProfile || userProfile.role !== 'student') {
      toast({ variant: "destructive", title: "Error", description: "Only students can send mentorship requests." });
      return;
    }
    if (!alumni.alumniProfile) {
        toast({ variant: "destructive", title: "Error", description: "Selected user is not an alumni." });
        return;
    }

    const requestData: Omit<MentorshipRequest, 'id' | 'requestedAt' | 'status'> = {
      studentId: userProfile.id,
      studentName: userProfile.name || "Student User",
      studentAvatar: userProfile.avatarUrl,
      studentGoals: userProfile.studentProfile?.goals,
      alumniId: alumni.id,
      alumniName: alumni.name || "Alumni User",
      alumniAvatar: alumni.avatarUrl,
      message: message,
    };

    try {
      await createMentorshipRequest(requestData);
      toast({
        title: "Mentorship Request Sent!",
        description: `Your request has been sent to ${alumni.name}.`,
      });
    } catch (error) {
      console.error("Failed to send mentorship request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send mentorship request. Please try again.",
      });
    }
  };
  
  const availableSkills = React.useMemo(() => {
    const skillsSet = new Set<string>();
    allAlumni.forEach(p => p.alumniProfile?.skills.forEach(s => skillsSet.add(s)));
    return Array.from(skillsSet).sort();
  }, [allAlumni]);

  const availableIndustries = React.useMemo(() => {
    const industriesSet = new Set<string>();
    allAlumni.forEach(p => {
      if (p.alumniProfile?.industry) industriesSet.add(p.alumniProfile.industry);
    });
    return Array.from(industriesSet).sort();
  }, [allAlumni]);

  if (isLoadingAlumni || isCurrentUserProfileLoading) { 
     return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="mb-8 text-center">
                <Skeleton className="h-10 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-5 w-1/2 mx-auto" />
            </div>
            <Skeleton className="h-32 w-full mb-6"/>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                    <CardSkeleton key={index} />
                ))}
            </div>
        </div>
     );
  }
  
  const alumniCount = filteredAlumni.length;
  const subtitleText = userProfile?.role === 'student' 
    ? `Browse ${alumniCount} alumni. Connect for mentorship & view LinkedIn profiles.`
    : `Browse ${alumniCount} alumni. View profiles and LinkedIn details.`;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Alumni Directory</h1>
        <p className="text-lg text-muted-foreground">
          {isLoadingAlumni ? 'Loading alumni...' : subtitleText}
        </p>
      </div>

      <AlumniFilters 
        onFiltersChange={handleFilterChange}
        availableSkills={availableSkills}
        availableIndustries={availableIndustries}
      />

      {filteredAlumni.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAlumni.map((alumni) => (
            <AlumniCard 
              key={alumni.id} 
              alumni={alumni} 
              currentUserProfile={userProfile} // Pass full current user profile
              onMentorshipRequest={(message) => handleMentorshipRequest(alumni, message)} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Icons.search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground">No Alumni Found</h3>
          <p className="text-muted-foreground">
            There are currently no alumni profiles matching your criteria or no alumni have registered yet. Try adjusting your search filters or check back later.
          </p>
        </div>
      )}
    </div>
  );
}

const CardSkeleton = () => (
  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3">
    <div className="flex items-start gap-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <div className="space-y-1">
       <Skeleton className="h-3 w-1/4" />
       <Skeleton className="h-4 w-full" />
    </div>
     <div className="space-y-1">
       <Skeleton className="h-3 w-1/4" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
    <div className="flex gap-2 pt-2 border-t mt-2">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-9 w-1/2" />
    </div>
  </div>
);
