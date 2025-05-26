
import type { Profile, MentorshipRequest, DiscussionThread, Comment } from "@/types";

export const placeholderUserStudent: Profile = {
  id: "student123",
  email: "student@example.com",
  name: "Aarav Sharma",
  role: "student",
  avatarUrl: "https://placehold.co/128x128.png?text=AS",
  createdAt: new Date("2023-01-15T09:00:00Z"),
  studentProfile: {
    college: "Rajasthan Technical University",
    year: 3,
    academicInterests: ["Machine Learning", "Web Development", "Cybersecurity"],
    goals: "To become a proficient AI engineer and contribute to innovative tech solutions.",
  },
};

export const placeholderUserAlumni: Profile = {
  id: "alumni456",
  email: "alumni@example.com",
  name: "Priya Verma",
  role: "alumni",
  avatarUrl: "https://placehold.co/128x128.png?text=PV",
  createdAt: new Date("2010-07-20T14:30:00Z"),
  alumniProfile: {
    jobTitle: "Senior Software Engineer",
    company: "Tech Solutions Pvt. Ltd.",
    skills: ["JavaScript", "React", "Node.js", "Cloud Computing", "Agile Methodologies"],
    experienceYears: 8,
    education: "B.Tech in Computer Science from MBM Engineering College",
    industry: "Information Technology",
  },
};

export const placeholderUserAlumni2: Profile = {
  id: "alumni789",
  email: "alumni2@example.com",
  name: "Rohan Meena",
  role: "alumni",
  avatarUrl: "https://placehold.co/128x128.png?text=RM",
  createdAt: new Date("2012-05-10T11:00:00Z"),
  alumniProfile: {
    jobTitle: "Product Manager",
    company: "Innovate Hub",
    skills: ["Product Strategy", "Market Research", "UX Design", "Data Analysis"],
    experienceYears: 6,
    education: "MBA from IIM Udaipur",
    industry: "Fintech",
  },
};


export const placeholderProfiles: Profile[] = [
  placeholderUserStudent,
  placeholderUserAlumni,
  placeholderUserAlumni2,
  {
    id: "alumni001",
    email: "sunita.k@example.com",
    name: "Sunita Kumari",
    role: "alumni",
    avatarUrl: "https://placehold.co/128x128.png?text=SK",
    createdAt: new Date("2008-03-01T10:00:00Z"),
    alumniProfile: {
      jobTitle: "Data Scientist",
      company: "Analytics Corp",
      skills: ["Python", "R", "SQL", "Machine Learning", "Statistics"],
      experienceYears: 10,
      education: "M.Sc. in Statistics from University of Rajasthan",
      industry: "Data Analytics",
    },
  },
  {
    id: "student002",
    email: "vikas.j@example.com",
    name: "Vikas Joshi",
    role: "student",
    avatarUrl: "https://placehold.co/128x128.png?text=VJ",
    createdAt: new Date("2023-08-15T09:00:00Z"),
    studentProfile: {
      college: "Poornima College of Engineering",
      year: 2,
      academicInterests: ["Robotics", "Embedded Systems", "IoT"],
      goals: "To build innovative hardware solutions for societal problems.",
    },
  },
];

export const placeholderMentorshipRequests: MentorshipRequest[] = [
  {
    id: "req1",
    studentId: "student123",
    studentName: "Aarav Sharma",
    studentAvatar: "https://placehold.co/100x100.png?text=AS",
    alumniId: "alumni456",
    alumniName: "Priya Verma",
    alumniAvatar: "https://placehold.co/100x100.png?text=PV",
    message: "Dear Ms. Verma, I am very interested in learning more about cloud computing and your experience at Tech Solutions. Would you be open to a brief mentorship call?",
    status: "pending",
    requestedAt: new Date("2024-07-20T10:00:00Z"),
    studentGoals: "To become a proficient AI engineer and contribute to innovative tech solutions."
  },
  {
    id: "req2",
    studentId: "student002",
    studentName: "Vikas Joshi",
    studentAvatar: "https://placehold.co/100x100.png?text=VJ",
    alumniId: "alumni789",
    alumniName: "Rohan Meena",
    alumniAvatar: "https://placehold.co/100x100.png?text=RM",
    message: "Hello Mr. Meena, I admire your work in product management. I'm a 2nd year student exploring career paths and would love to get your insights on breaking into Fintech.",
    status: "accepted",
    requestedAt: new Date("2024-07-18T14:30:00Z"),
    respondedAt: new Date("2024-07-19T09:15:00Z"),
    studentGoals: "To build innovative hardware solutions for societal problems."
  },
  {
    id: "req3",
    studentId: "student123",
    studentName: "Aarav Sharma",
    studentAvatar: "https://placehold.co/100x100.png?text=AS",
    alumniId: "alumni001",
    alumniName: "Sunita Kumari",
    alumniAvatar: "https://placehold.co/100x100.png?text=SK",
    message: "Respected Ms. Kumari, your journey in Data Science is inspiring. I'm currently working on a project involving statistical modeling and would greatly appreciate your guidance.",
    status: "rejected",
    requestedAt: new Date("2024-07-15T11:00:00Z"),
    respondedAt: new Date("2024-07-16T17:00:00Z"),
    studentGoals: "To become a proficient AI engineer and contribute to innovative tech solutions."
  },
];

export const placeholderComments: Comment[] = [
  {
    id: "comment1",
    authorId: "student123",
    authorName: "Aarav Sharma",
    authorAvatar: "https://placehold.co/100x100.png?text=AS",
    authorRole: "student",
    content: "This is very helpful, Ms. Verma! Could you share some common mistakes to avoid during technical interviews?",
    createdAt: new Date("2024-07-22T10:30:00Z"),
  },
  {
    id: "comment2",
    authorId: "alumni456",
    authorName: "Priya Verma",
    authorAvatar: "https://placehold.co/100x100.png?text=PV",
    authorRole: "alumni",
    content: "Great question, Aarav! One common mistake is not clarifying the problem statement before jumping into coding. Always ask questions if something is unclear.",
    createdAt: new Date("2024-07-22T11:00:00Z"),
  },
];

export const placeholderThreads: DiscussionThread[] = [
  {
    id: "thread1",
    title: "Best resources for learning Cloud Computing (AWS/Azure/GCP)?",
    createdBy: "alumni456", // Priya Verma
    creatorName: "Priya Verma",
    creatorAvatar: "https://placehold.co/100x100.png?text=PV",
    createdAt: new Date("2024-07-19T08:00:00Z"),
    lastActivityAt: new Date("2024-07-22T11:00:00Z"),
    content: "Hi everyone, I'm often asked by students about good resources for learning cloud technologies. Let's compile a list here. I'd recommend starting with the official documentation and free tiers offered by AWS, Azure, and GCP. What are your suggestions?",
    comments: placeholderComments, // Reusing for now
  },
  {
    id: "thread2",
    title: "How to build a strong professional network as a student?",
    createdBy: "alumni789", // Rohan Meena
    creatorName: "Rohan Meena",
    creatorAvatar: "https://placehold.co/100x100.png?text=RM",
    createdAt: new Date("2024-07-10T16:20:00Z"),
    lastActivityAt: new Date("2024-07-15T10:00:00Z"),
    content: "Networking is crucial for career growth. As students, how can you effectively build connections? Attending industry events (even virtual), LinkedIn, and platforms like this are great starts. Share your experiences!",
    comments: [],
  },
];
