
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Log on the server side
  console.log('[API /api/env-debug] Server-side process.env:', {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY, // Example of a server-side only variable
  });

  // Return to the client
  return NextResponse.json({
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    // You can add more NEXT_PUBLIC_ variables here to check
    // Note: Non-NEXT_PUBLIC_ prefixed variables like GOOGLE_API_KEY will be undefined here if accessed directly in client component
    // but they are accessible in this server-side API route context.
  });
}
