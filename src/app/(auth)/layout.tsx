import type { ReactNode } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
       <Link
          href="/"
          className="absolute top-8 left-8 flex items-center text-lg font-medium text-foreground hover:text-primary transition-colors"
        >
          <Icons.chevronLeft className="mr-2 h-5 w-5" />
          Back to Home
        </Link>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-3xl font-bold text-primary">
            <Icons.logo className="h-10 w-10" />
            MentorConnect
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
