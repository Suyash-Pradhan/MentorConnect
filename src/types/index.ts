
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
  linkedinUrl?: string;
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
  imageUrl?: string;
  videoUrl?: string;
  externalLinkUrl?: string;
  externalLinkText?: string;
  likesCount: number;
  likedBy: string[]; // Array of user IDs who liked the post
  commentsCount: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PostComment { // Renamed from Comment for clarity if original Comment type is used elsewhere
  id: string;
  postId: string; // Foreign key to the Post
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: Role; // Or string if role isn't strictly needed for comment display
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
}

// Original Comment type if used for DiscussionThread, ensure no name clash or merge logic
export interface Comment { // This is for Discussion Threads
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: Role;
  content: string;
  createdAt: Date;
}
