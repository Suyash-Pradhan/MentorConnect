
export type Role = 'student' | 'alumni' | 'admin';

export interface User {
  id: string;
  email: string;
  role: Role | null; // null if not yet selected
  name?: string;
  avatarUrl?: string;
  bannerUrl?: string;
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
  chatId?: string; // To link to an active chat session
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

export interface Comment { // This is for Discussion Threads
  id:string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: Role;
  content: string;
  createdAt: Date;
}

// Chat specific types
export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string; // Denormalized for display
  senderAvatar?: string; // Denormalized
  text: string;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  participantIds: string[]; // [studentId, alumniId] - keep consistent order for querying
  studentId: string; // Added for direct querying
  alumniId: string; // Added for direct querying
  createdAt: Date;
  lastMessageAt?: Date;
  lastMessageText?: string;
  lastMessageSenderId?: string; // ID of the user who sent the last message
  // Optional: unread counts per user if implementing that feature on the session document
  // studentUnreadCount?: number;
  // alumniUnreadCount?: number;
}

// Notification specific types
export interface AppNotification {
    id: string; // Unique ID for the notification
    type: 'new_message' | 'mentorship_request' | 'post_comment' | 'system'; // Extend as needed
    title: string;
    text: string; // Short text for the notification
    chatId?: string; // If it's a new message notification
    relatedItemId?: string; // e.g., postId, requestId
    senderName?: string; // Name of the person triggering (e.g. chat partner)
    timestamp: Date;
    isRead: boolean;
    link?: string; // Path to navigate to when clicked
}
