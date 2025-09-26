import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="mx-auto h-12 w-12 text-gold mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-serif font-medium text-ink mb-2">
        {title}
      </h3>
      <p className="text-muted max-w-md mx-auto">
        {description}
      </p>
    </div>
  );
} 