"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface AlumniFiltersState {
  searchTerm: string;
  skills: string[];
  industry: string;
  company: string;
}

interface AlumniFiltersProps {
  onFiltersChange: (filters: AlumniFiltersState) => void;
  initialFilters?: Partial<AlumniFiltersState>;
  availableSkills?: string[]; // For multi-select skills filter
  availableIndustries?: string[]; // For industry select
}

const defaultAvailableSkills = ["React", "Node.js", "Python", "Project Management", "Data Analysis", "UX Design", "Cloud Computing", "AI/ML"];
const defaultAvailableIndustries = ["Technology", "Finance", "Healthcare", "Education", "Consulting", "Manufacturing"];


export function AlumniFilters({
  onFiltersChange,
  initialFilters = {},
  availableSkills = defaultAvailableSkills,
  availableIndustries = defaultAvailableIndustries,
}: AlumniFiltersProps) {
  const [searchTerm, setSearchTerm] = React.useState(initialFilters.searchTerm || "");
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>(initialFilters.skills || []);
  const [industry, setIndustry] = React.useState(initialFilters.industry || "");
  const [company, setCompany] = React.useState(initialFilters.company || "");

  React.useEffect(() => {
    const filters: AlumniFiltersState = { searchTerm, skills: selectedSkills, industry, company };
    onFiltersChange(filters);
  }, [searchTerm, selectedSkills, industry, company, onFiltersChange]);

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };
  
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSkills([]);
    setIndustry("");
    setCompany("");
  };

  return (
    <Card className="p-4 md:p-6 mb-6 shadow-sm bg-secondary">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="lg:col-span-1">
          <Label htmlFor="search-alumni" className="text-sm font-medium">Search by Name</Label>
          <div className="relative">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-alumni"
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
            <Label htmlFor="skills-filter" className="text-sm font-medium">Filter by Skills</Label>
            <Popover>
            <PopoverTrigger asChild>
                <Button id="skills-filter" variant="outline" role="combobox" className="w-full justify-between">
                {selectedSkills.length > 0 ? `${selectedSkills.length} skill(s) selected` : "Select skills..."}
                <Icons.chevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                <CommandInput placeholder="Search skills..." />
                <CommandList>
                    <CommandEmpty>No skills found.</CommandEmpty>
                    <CommandGroup>
                    {availableSkills.map((skill) => (
                        <CommandItem
                        key={skill}
                        onSelect={() => handleSkillToggle(skill)}
                        className="flex items-center space-x-2"
                        >
                        <Checkbox
                            id={`skill-${skill}`}
                            checked={selectedSkills.includes(skill)}
                            onCheckedChange={() => handleSkillToggle(skill)}
                        />
                        <Label htmlFor={`skill-${skill}`} className="font-normal cursor-pointer flex-1">{skill}</Label>
                        </CommandItem>
                    ))}
                    </CommandGroup>
                </CommandList>
                </Command>
            </PopoverContent>
            </Popover>
        </div>

        <div>
          <Label htmlFor="industry-filter" className="text-sm font-medium">Filter by Industry</Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger id="industry-filter" className="w-full">
              <SelectValue placeholder="Select industry..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Industries</SelectItem>
              {availableIndustries.map(ind => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="company-filter" className="text-sm font-medium">Search by Company</Label>
           <div className="relative">
             <Icons.company className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="company-filter"
              type="text"
              placeholder="Search by company..."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        { (searchTerm || selectedSkills.length > 0 || industry || company) &&
          <Button onClick={clearFilters} variant="ghost" className="w-full md:w-auto text-primary hover:bg-primary/10 lg:col-start-4">
            <Icons.trash className="mr-2 h-4 w-4" /> Clear Filters
          </Button>
        }
      </div>
    </Card>
  );
}

// Need to add Card to imports if not already present elsewhere in the project
import { Card } from "@/components/ui/card"; 
