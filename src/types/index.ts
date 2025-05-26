
export type Role = 'student' | 'alumni' | 'admin';

export interface User {
  id: string;
  email: string;
  role: Role | null; // null if not yet selected
  name?: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface StudentProfile {
  college: string;
  year: number;
  academicInterests: string[];
  goals: string;
}

export interface AlumniProfile {
  jobTitle: string;
  company: string;
  skills: string[];
  experienceYears: number;
  education: string; // e.g., "B.Tech in CSE from XYZ College"
  industry: string;
}

export interface Profile extends User {
  studentProfile?: StudentProfile;
  alumniProfile?: AlumniProfile;
}

export type MentorshipRequestStatus = 'pending' | 'accepted' | 'rejected' | 'messaged';

export interface MentorshipRequest {
  id: string;
  studentId: string;
  studentName: string; // Denormalized for easier display
  studentAvatar?: string;
  alumniId: string;
  alumniName: string; // Denormalized
  alumniAvatar?: string;
  message: string;
  status: MentorshipRequestStatus;
  requestedAt: Date;
  respondedAt?: Date;
  studentGoals?: string; // For alumni to see context
}

export interface Post {
  id: string;
  authorId: string; // Alumni ID
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdAt: Date;
  updatedAt?: Date; // Added for tracking updates
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: Role;
  content: string;
  createdAt: Date;
}

export interface DiscussionThread {
  id: string;
  title: string;
  createdBy: string; // Alumni ID
  creatorName: string;
  creatorAvatar?: string;
  createdAt: Date;
  lastActivityAt: Date;
  content: string; // Initial post content
  comments: Comment[];
}
