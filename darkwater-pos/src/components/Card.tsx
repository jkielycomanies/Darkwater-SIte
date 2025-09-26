import React from 'react';
// Vercel deployment test - pushing through Darkwater-Site repository

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const baseClasses = 'bg-card rounded-2xl gold-border p-6 backdrop-blur-sm';
  const hoverClasses = hover ? 'card-hover cursor-pointer' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';
  
  const combinedClasses = `${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`.trim();

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className={combinedClasses}
        type="button"
      >
        {children}
      </button>
    );
  }

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
} 