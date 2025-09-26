import React from 'react';

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="h-16 bg-card/30 rounded-lg"></div>
      
      {/* Breadcrumb skeleton */}
      <div className="h-8 bg-card/20 rounded-lg w-48"></div>
      
      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 bg-card/30 rounded-2xl"></div>
        ))}
      </div>
    </div>
  );
} 