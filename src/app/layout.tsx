
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'MentorConnect - Alumni-Student Interaction Platform',
  description: 'Bridging the gap between students and alumni for mentorship and career opportunities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
        suppressHydrationWarning // Ensure this is present for body tag mismatches
      >
        <div style={{ border: '10px solid magenta', padding: '10px', backgroundColor: 'lightyellow', color: 'black', fontSize: '16px', fontWeight: 'bold', position: 'fixed', top: '0', left: '0', width: '100%', zIndex: 9999 }}>
          ROOT LAYOUT DIAGNOSTIC: If you see this, src/app/layout.tsx is rendering.
        </div>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
