
"use client";

import * as React from "react";
import { AlumniCard } from "@/components/alumni/alumni-card";
import { AlumniFilters, type AlumniFiltersState } from "@/components/alumni/alumni-filters";
import type { Profile } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfilesByRole } from "@/services/profileService"; // Import the service

export default function AlumniDirectoryPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [allAlumni, setAllAlumni] = React.useState<Profile[]>([]);
  const [filteredAlumni, setFilteredAlumni] = React.useState<Profile[]>([]);
  
  React.useEffect(() => {
    const fetchAlumni = async () => {
      setIsLoading(true);
      try {
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
        setIsLoading(false);
      }
    };
    fetchAlumni();
  }, [toast]);

  const handleFilterChange = React.useCallback((filters: AlumniFiltersState) => {
    // No need to set isLoading here unless filtering is a very heavy operation
    // For client-side filtering, it's usually fast enough.
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

  const handleMentorshipRequest = (alumniId: string, message: string) => {
    // TODO: Implement actual mentorship request saving to Firestore in a later step
    console.log(`Mentorship request to ${alumniId}: ${message}`);
    toast({
      title: "Mentorship Request Sent!",
      description: "Your request has been sent to the alumni.",
    });
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


  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Alumni Directory</h1>
        <p className="text-lg text-muted-foreground">
          Find and connect with experienced alumni for guidance and mentorship.
        </p>
      </div>

      <AlumniFilters 
        onFiltersChange={handleFilterChange}
        availableSkills={availableSkills}
        availableIndustries={availableIndustries}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : filteredAlumni.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAlumni.map((alumni) => (
            <AlumniCard key={alumni.id} alumni={alumni} onMentorshipRequest={handleMentorshipRequest} />
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
