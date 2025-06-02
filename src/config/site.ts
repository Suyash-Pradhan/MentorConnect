
export type NavItem = {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  description?: string;
  roles?: ('student' | 'alumni')[];
};

export type SidebarNavItem = NavItem & {
  items?: NavItem[];
};

export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  mainNav: NavItem[];
  sidebarNav: SidebarNavItem[];
};

import {
  LayoutDashboard,
  Users,
  UserCircle,
  MessageSquareHeart,
  Bot,
  GraduationCap,
  Briefcase,
  BookOpenText,
  LifeBuoy,
} from 'lucide-react';

export const siteConfig: SiteConfig = {
  name: 'MentorConnect',
  description:
    'Alumni-Student Interaction Platform for the Technical Education Department, Govt. of Rajasthan.',
  url: 'https://mentorconnect.example.com', // Replace with your actual URL
  ogImage: 'https://mentorconnect.example.com/og.jpg', // Replace with your actual OG image URL
  mainNav: [
    // Header navigation items if any, usually handled by UserNav or App specific links
  ],
  sidebarNav: [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['student', 'alumni'],
    },
    {
      title: 'My Profile',
      href: '/profile',
      icon: UserCircle,
      roles: ['student', 'alumni'],
    },
    {
      title: 'Alumni Directory',
      href: '/alumni-directory',
      icon: Users,
      roles: ['student'],
    },
    {
      title: 'Mentorship',
      href: '/mentorship',
      icon: MessageSquareHeart,
      roles: ['student', 'alumni'],
    },
    {
      title: 'Posts',
      href: '/posts',
      icon: BookOpenText,
      description: "View posts from alumni",
      roles: ['student', 'alumni'], // Alumni can create, students can view
    },
    {
      title: 'Discussions',
      href: '/discussions',
      icon: Users, // Using Users as a placeholder for forum-like icon
      description: "Engage in discussions",
      roles: ['student', 'alumni'],
    },
    {
      title: 'My Opportunities',
      href: '/my-opportunities',
      icon: Briefcase,
      roles: ['alumni'],
      description: "Manage posts and job openings you've shared",
    },
    {
      title: 'FAQ Chatbot',
      href: '/chatbot',
      icon: Bot,
      roles: ['student', 'alumni'],
    },
     {
      title: 'Help & Support', // Corrected from Help &amp; Support
      href: '/help',
      icon: LifeBuoy,
      roles: ['student', 'alumni'],
    },
  ],
};
