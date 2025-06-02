
"use client"; // Error components must be Client Components

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error("Unhandled Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <Icons.warning className="h-20 w-20 text-destructive mx-auto" />
        <h1 className="text-3xl font-bold text-destructive">
          Something went wrong!
        </h1>
        <p className="text-muted-foreground">
          We encountered an unexpected issue. Please try again, or if the
          problem persists, contact support.
        </p>
        {process.env.NODE_ENV === 'development' && error?.message && (
            <pre className="mt-2 p-2 text-left text-xs bg-destructive/10 text-destructive border border-destructive rounded-md overflow-auto max-h-40">
                Error: {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
                {/* Stack trace can be very long, consider if needed for prod-like error page */}
            </pre>
        )}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
            variant="outline"
          >
            Try Again
          </Button>
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
         <p className="text-xs text-muted-foreground">Error Digest (for support): {error.digest || 'N/A'}</p>
      </div>
    </div>
  );
}
