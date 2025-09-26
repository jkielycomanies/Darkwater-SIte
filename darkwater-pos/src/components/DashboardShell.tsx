'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface DashboardShellProps {
  company: {
    name: string;
    type: 'dealership' | 'software' | 'holding';
  };
  children: React.ReactNode;
}

const typeBadges = {
  dealership: '🏍️ Dealership',
  software: '💻 Software',
  holding: '🏢 Holding',
};

export default function DashboardShell({ company, children }: DashboardShellProps) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Company info */}
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-serif font-semibold text-ink tracking-tight">
                  {company.name}
                </h1>
                <div className="inline-flex items-center px-2 py-1 rounded-full bg-accent/20 border border-gold/30">
                  <span className="text-xs font-medium text-gold">
                    {typeBadges[company.type]}
                  </span>
                </div>
              </div>
            </div>

            {/* Right side - User menu */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted">
                Welcome, {session?.user?.name}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-3 py-2 text-sm text-gold hover:text-ink transition-colors focus-ring rounded-lg"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className="bg-bg border-b border-gold/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 py-3">
            <span className="text-sm text-muted">Dashboard</span>
            <ChevronRightIcon className="w-4 h-4 text-gold" />
            <span className="text-sm text-ink font-medium">{company.name}</span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
} 