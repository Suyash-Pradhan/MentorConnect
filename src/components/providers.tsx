"use client";

import type { ReactNode } from 'react';
// import { ThemeProvider } from "next-themes"; // Example if using next-themes

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  // If using next-themes, wrap with ThemeProvider:
  // return (
  //   <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  //     {children}
  //   </ThemeProvider>
  // );
  return <>{children}</>;
}
