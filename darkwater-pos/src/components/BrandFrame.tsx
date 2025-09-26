import React from 'react';

interface BrandFrameProps {
  children: React.ReactNode;
  className?: string;
}

export default function BrandFrame({ children, className = '' }: BrandFrameProps) {
  return (
    <div className={`min-h-screen bg-bg relative ${className}`}>
      {/* Radial vignette overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-accent/20 pointer-events-none" />
      
      {/* Gold frame border */}
      <div className="absolute inset-4 border border-gold/30 rounded-3xl pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
} 