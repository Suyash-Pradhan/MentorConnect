import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

// This is a conceptual check. In a real app, this would involve server-side checks or middleware.
// For now, we assume if the user reaches this layout, they are authenticated.
// const userIsAuthenticated = true; 
// const userRoleSelected = true; 


export default function AppLayout({ children }: { children: ReactNode }) {
  // if (!userIsAuthenticated) {
  //   redirect('/login'); // Or use Next.js middleware
  // }
  // if (!userRoleSelected) {
  //  redirect('/role-selection');
  // }

  return (
    <SidebarProvider defaultOpen={true}> {/* Control sidebar state */}
      <div className="flex min-h-screen flex-col bg-background">
        <AppSidebar /> {/* This will be positioned fixed or absolutely by its own styles */}
        <SidebarInset> {/* This component handles the main content area adjustment */}
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
