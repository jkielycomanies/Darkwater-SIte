'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import RevaniLogo from '@/components/RevaniLogo';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (session) {
      // If logged in, go to company selection
      router.push('/select');
    } else {
      // If not logged in, go to login page (no auto-login)
      router.replace('/login');
    }
  }, [session, status, router]);

  // Show a simple loading state while redirecting
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#0a0a0a',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <RevaniLogo size="large" />
        </div>
        <div className="loading-spinner"></div>
        <h2>Redirecting to Revani Portal...</h2>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          .loading-spinner {
            width: 60px;
            height: 60px;
            border: 3px solid #333;
            border-top: 3px solid #8b5cf6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
}
