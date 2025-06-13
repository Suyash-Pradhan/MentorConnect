[![Built by Firebase Studio](https://img.shields.io/badge/Built%20by-Firebase%20Studio-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/products/studio)

<h1 align="center">✨ MentorConnect - Alumni-Student Interaction Platform ✨</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/ShadCN_UI-111111?logo=vercel&logoColor=white" alt="ShadCN UI" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Firestore-FFA000?logo=googlecloud&logoColor=white" alt="Firestore" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?logo=cloudinary&logoColor=white" alt="Cloudinary" />
  <img src="https://img.shields.io/badge/Genkit-4285F4?logo=google&logoColor=white" alt="Genkit" />
</p>



**MentorConnect is a full-stack web application, primarily developed with the assistance of an AI coding partner in Firebase Studio.** It's designed to bridge the gap between students and experienced alumni, fostering mentorship, guidance, and career opportunities, initially tailored for the Technical Education Department, Govt. of Rajasthan.

---

## 🚀 Overview

MentorConnect provides a comprehensive platform for students to find and connect with alumni mentors, and for alumni to share their expertise, post opportunities, and engage in discussions. The platform features role-based access, detailed profiles, a searchable alumni directory, a robust mentorship request system integrated with direct chat, and AI-powered tools like an FAQ chatbot and smart alumni recommendations.

---

## 🌟 Key Features

*   **👤 Role-Based Access**: Distinct experiences and capabilities for 'Student' and 'Alumni' users.
*   **🔒 Authentication**: Secure sign-up and login using Email/Password and Google Sign-In.
*   **🖼️ Profile Management**:
    *   Users can create and update detailed profiles.
    *   Students: Academic interests, college, year, goals.
    *   Alumni: Job title, company, skills, experience, education, industry, LinkedIn.
    *   Cloudinary integration for avatar and banner image uploads.
*   **🔎 Alumni Directory**:
    *   Students can search and filter alumni profiles (name, skills, industry, company).
    *   View alumni profiles and LinkedIn details.
*   **🤝 Mentorship System**:
    *   Students can send personalized mentorship requests to alumni.
    *   Alumni can accept, reject, or message students regarding requests.
    *   Accepted mentorships can initiate a direct chat session.
*   **📰 Posts & Opportunities**:
    *   Alumni can create, edit, and delete posts (job openings, guidance, success stories).
    *   Support for text, images (via Cloudinary), video links, and external links.
    *   Posts are categorized and tagged for better discoverability.
    *   Students and other alumni can view and comment on posts.
    *   Like/unlike functionality for posts.
*   **💬 Discussion Threads**:
    *   Alumni can create discussion threads on various topics.
    *   Students and alumni can participate by commenting on threads.
*   **📱 Direct Chat**:
    *   Real-time one-on-one messaging for accepted mentorships and other interactions.
    *   Displays user avatars and message timestamps.
*   **🤖 AI-Powered Features (Genkit)**:
    *   **FAQ Chatbot**: Answers user questions about the platform, using tools to fetch live data summaries (e.g., alumni industries, post categories, discussion topics).
    *   **Smart Alumni Recommendations**: Provides students with AI-driven suggestions for alumni to connect with based on their profile and interests.
*   **🔔 Notifications**:
    *   Real-time in-app notifications (bell icon) for new chat messages.
*   **❓ Help & Support Page**: Static FAQ page and contact information for further assistance.
*   **📱 Responsive Design**: UI adapted for various screen sizes.

---

## 🛠️ Tech Stack

*   **Frontend Framework**: Next.js (App Router, Server Components, Server Actions)
*   **UI Library**: React
*   **UI Components**: ShadCN UI
*   **Styling**: Tailwind CSS
*   **AI/Generative AI**: Genkit (Google AI SDK, Gemini models)
*   **Language**: TypeScript
*   **Authentication**: Firebase Authentication (Email/Password, Google Sign-In)
*   **Database**: Firestore (NoSQL)
*   **Image Storage & Delivery**: Cloudinary
*   **State Management**: React Context API (for UserProfile, Notifications)
*   **Forms**: React Hook Form with Zod for validation

---

## 📋 Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   Firebase Project
*   Cloudinary Account
*   Google Cloud Project with necessary APIs enabled for Genkit (e.g., Vertex AI API or Generative Language API for Gemini models)

---

## ⚙️ Setup Instructions

Follow these steps carefully to set up the MentorConnect project locally.

### 1. Firebase Setup 🔥

*   **Create Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
*   **Authentication**:
    *   Navigate to "Authentication" (under Build).
    *   On the "Sign-in method" tab, enable:
        *   Email/Password
        *   Google (provide a project support email).
    *   Under "Authorized domains", ensure `localhost` is listed for local development. For cloud IDEs (like Google Cloud Workstations), add the specific domain your app will be served from (e.g., `your-id.cloudworkstations.dev`).
*   **Firestore Database**:
    *   Navigate to "Firestore Database" (under Build).
    *   Click "Create database".
    *   Start in **Test mode** for initial development.
        *   **🚨 IMPORTANT**: For production, you **MUST** configure [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started) to protect your data.
    *   Choose a Firestore location.
*   **Project Settings (Web App Config)**:
    *   Go to "Project settings" (gear icon next to "Project Overview").
    *   Under the "General" tab, find your "Web app" configuration. If one doesn't exist, click "Add app" and choose the web platform (`</>`).
    *   Copy the Firebase SDK configuration snippet values. You'll need these for the `.env.local` file.
*   **Required Indexes**:
    *   Some queries in the application (e.g., fetching posts by tag and ordering by date, fetching chats) may require composite indexes in Firestore.
    *   If you encounter errors in your server logs or browser console mentioning missing indexes, Firestore will typically provide a direct link to create the required index. Click that link and create the index.
    *   Common indexes needed:
        *   Collection: `posts`, Fields: `tags` (Array Contains) ASC, `createdAt` DESC
        *   Collection: `chats`, Fields: `participantIds` (Array Contains) ASC, `lastMessageAt` DESC

### 2. Cloudinary Setup ☁️

*   Create a Cloudinary account at [https://cloudinary.com/](https://cloudinary.com/).
*   Navigate to your Dashboard to find your `Cloud Name`, `API Key`, and `API Secret`.

### 3. Genkit AI Setup (Google AI) 🤖

*   Ensure you have a Google Cloud Project.
*   Enable the "Vertex AI API" or the "Generative Language API" (for Gemini models) in your Google Cloud Console for the project associated with your `GOOGLE_API_KEY`.
*   Set up authentication for your Google Cloud account locally (e.g., by running `gcloud auth application-default login`). This allows Genkit to use your credentials.
*   Obtain your Google API Key for the project. This key will be used for the `GOOGLE_API_KEY` environment variable.

### 4. Environment Variables 🔑

Create a `.env.local` file in the root of your project and add the following environment variables. Replace the placeholder values with your actual credentials and configuration.

```env
# Firebase Configuration (from your Firebase project settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id # Optional

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Genkit / Google AI Configuration
# API key for your Google Cloud project with Gemini models & relevant APIs enabled.
GOOGLE_API_KEY=your_google_api_key_for_gemini
```

**Note**: `GOOGLE_API_KEY` is used by Genkit. Ensure this key is for a Google Cloud project where the necessary AI APIs (like Vertex AI or Generative Language API for Gemini) are enabled.

### 5. Install Dependencies 📦

Open your terminal in the project root and run:

```bash
npm install
# or
# yarn install
```

---

## ▶️ Running the Project

You need to run **two separate development servers** concurrently:
1.  The Next.js application server.
2.  The Genkit AI flows server.

### Terminal 1: Start the Next.js App

```bash
npm run dev
```
This will typically start the Next.js app on `http://localhost:9002` (or another port if 9002 is busy).

### Terminal 2: Start the Genkit Development Server

```bash
npm run genkit:dev
# OR for watching changes in AI flows:
# npm run genkit:watch
```
This will start the Genkit development flow server, usually on `http://localhost:3400`. This server hosts your AI flows and makes them available for the Next.js app to call.

Now, you can access the MentorConnect application in your browser at the URL provided by the Next.js development server (e.g., `http://localhost:9002`).

---

## 🚀 Building for Production

1.  **Build the Next.js Application**:
    ```bash
    npm run build
    ```
    This command prepares your Next.js app for production.

2.  **Start the Production Server**:
    ```bash
    npm run start
    ```
    This command runs the optimized production build of your Next.js app.

**Note on Genkit in Production**:
For deploying Genkit flows to production, you'd typically deploy them to a cloud environment (e.g., Google Cloud Functions, Cloud Run). The `genkit:dev` server is for local development only. Refer to the [Genkit documentation](https://firebase.google.com/docs/genkit) for production deployment strategies.

---

## 📁 Project Structure Highlights

*   `src/app/`: Contains all the pages and layouts for the Next.js App Router.
    *   `(app)/`: Authenticated application routes.
    *   `(auth)/`: Authentication-related pages (login, signup).
*   `src/components/`: Reusable UI components.
    *   `ui/`: ShadCN UI components.
    *   `layout/`: Components specific to the application layout (header, sidebar).
    *   `auth/`, `profile/`, `alumni/`, `mentorship/`, `chatbot/`, etc.: Feature-specific components.
*   `src/services/`: Backend service functions for interacting with Firestore.
*   `src/ai/`: Genkit AI related code.
    *   `flows/`: Specific AI flows (e.g., FAQ chatbot, recommendations).
    *   `genkit.ts`: Genkit global initialization.
    *   `dev.ts`: Genkit development server entry point.
*   `src/types/`: TypeScript type definitions.
*   `src/lib/`: Utility functions and Firebase/Cloudinary configuration.
*   `src/contexts/`: React Context API providers (UserProfile, Notifications).
*   `src/config/`: Site configuration, including navigation.
*   `public/`: Static assets.

---

This project serves as a powerful demonstration of how AI can be leveraged as a coding partner to rapidly develop complex, feature-rich web applications.

Happy Mentoring!
