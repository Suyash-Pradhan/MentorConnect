

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
  studentGoals?: string; // For alumni to see context at a glance
  alumniId: string;
  alumniName: string; // Denormalized
  alumniAvatar?: string;
  message: string; // Student's initial message
  status: MentorshipRequestStatus;
  requestedAt: Date;
  respondedAt?: Date;
  alumniMessage?: string; // Optional field for alumni's direct message via the platform
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
  threadId: string; // Added to explicitly link comment to thread
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
  createdBy: string; // User ID (typically Alumni)
  creatorName: string;
  creatorAvatar?: string;
  creatorRole: Role; // Added to know the role of the creator
  createdAt: Date;
  lastActivityAt: Date;
  content: string; // Initial post content
  commentsCount: number; // To display comment count easily
  // Comments are now stored in a subcollection, not directly on the thread document
}

