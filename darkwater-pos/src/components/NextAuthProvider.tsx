'use client';

import { SessionProvider } from 'next-auth/react';

interface NextAuthProviderProps {
  children: React.ReactNode;
}

export function NextAuthProvider({ children }: NextAuthProviderProps) {
  return (
    <SessionProvider 
      refetchInterval={0} // Disable automatic session refresh
      refetchOnWindowFocus={false} // Disable refresh on window focus
    >
      {children}
    </SessionProvider>
  );
} 