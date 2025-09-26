import React from 'react';
import Card from './Card';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface CompanyCardProps {
  company: Company;
  onClick: () => void;
}

const getCompanyIcon = (type: string) => {
  switch (type) {
    case 'dealership':
      return (
        <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    case 'software':
      return (
        <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    case 'holding':
      return (
        <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2-5a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2v5a2 2 0 01-2 2m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v7.5" />
        </svg>
      );
    default:
      return (
        <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6" />
        </svg>
      );
  }
};

const getCompanyDescription = (type: string) => {
  switch (type) {
    case 'dealership':
      return 'Vehicle sales & inventory management';
    case 'software':
      return 'Technology solutions & development';
    case 'holding':
      return 'Portfolio & investment management';
    default:
      return 'Business operations';
  }
};

export default function CompanyCard({ company, onClick }: CompanyCardProps) {
  return (
    <Card onClick={onClick} hover className="text-center transition-all duration-200">
      <div className="flex flex-col items-center space-y-4">
        <div className="p-3 rounded-full bg-accent/10">
          {getCompanyIcon(company.type)}
        </div>
        
        <div>
          <h3 className="text-xl font-serif font-semibold text-ink mb-1">
            {company.name}
          </h3>
          <p className="text-sm text-muted">
            {getCompanyDescription(company.type)}
          </p>
        </div>
        
        <div className="flex items-center text-accent text-sm font-medium">
          <span>Enter</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Card>
  );
}




















