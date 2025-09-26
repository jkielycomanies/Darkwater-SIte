'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import './select.css';
import RevaniLogo from '@/components/RevaniLogo';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

const getCompanyIcon = (type: string) => {
  switch (type) {
    case 'dealership':
      return '🏍️';
    case 'software':
      return '💻';
    case 'holding':
      return '🏢';
    default:
      return '🏢';
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

export default function CompanySelectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || !session) {
      // Clear any cached data and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      router.replace('/login');
      return;
    }

    // Fetch companies and user permissions
    fetchData();
  }, [status, session, router]);

  const fetchData = async () => {
    try {
      // Fetch user permissions first
      const permissionsResponse = await fetch('/api/auth/user-permissions');
      let userCompanyAccess: string[] = [];
      
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setUserPermissions(permissionsData);
        userCompanyAccess = permissionsData.companyAccess || [];
        console.log('User company access:', userCompanyAccess);
      }

      // Fetch all companies
      const companiesResponse = await fetch('/api/companies');
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        
        // Filter companies based on user's company access
        const filteredCompanies = companiesData.companies.filter((company: Company) => 
          userCompanyAccess.includes(company.slug)
        );
        
        console.log('Filtered companies for user:', filteredCompanies);
        setCompanies(filteredCompanies);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySelect = (company: Company) => {
    router.push(`/dashboard/${company.slug}`);
  };


  if (status === 'loading' || isLoading) {
    return (
      <div className="select-container">
        {/* Background Pattern */}
        <div className="background-pattern"></div>
        
        {/* Floating Elements */}
        <div className="floating-elements">
          <div className="floating-orb purple"></div>
          <div className="floating-orb blue"></div>
        </div>

        <div className="main-content">
          <div className="loading-card">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to login
  }

  return (
    <div className="select-container">
      {/* Background Pattern */}
      <div className="background-pattern"></div>
      
      {/* Floating Elements */}
      <div className="floating-elements">
        <div className="floating-orb purple"></div>
        <div className="floating-orb blue"></div>
      </div>

      {/* Header with user info and sign out */}
      <header className="select-header">
        <div className="header-content">
          <div className="user-info">
            <span className="welcome-text">Welcome back</span>
            <span className="user-name">{session.user?.name}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="sign-out-button"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="main-content">
        {/* Brand Section */}
        <div className="brand-section">
          <div className="brand-logo">
            <span>D</span>
          </div>
          <h1 className="brand-title">Darkwater Syndicate</h1>
          <p className="brand-subtitle">Select your entity to continue</p>
        </div>

        {/* Companies Grid */}
        <div className="companies-container">
          {companies.length > 0 ? (
            <div className="companies-grid">
              {companies.map((company) => (
                <div
                  key={company._id}
                  className="company-card"
                  onClick={() => handleCompanySelect(company)}
                >
                  <div className="company-icon" style={company.slug === 'revani' ? { 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'flex-end', 
                    height: '140px',
                    marginBottom: '0.5rem',
                    paddingTop: '2rem'
                  } : {}}>
                    {company.slug === 'revani' ? (
                      <div style={{ filter: 'invert(1) brightness(2) contrast(1.2)' }}>
                        <RevaniLogo size="large" style={{ width: '220px', height: '75px' }} />
                      </div>
                    ) : (
                      getCompanyIcon(company.type)
                    )}
                  </div>
                  <h3 className="company-name" style={company.slug === 'revani' ? { height: '2.5rem', display: 'flex', alignItems: 'center' } : {}}>{company.slug === 'revani' ? '' : company.name}</h3>
                  <p className="company-description">
                    {getCompanyDescription(company.type)}
                  </p>
                  <div className="company-enter">
                    <span>Enter</span>
                    <svg className="enter-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1.1rem'
            }}>
              <div style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '400px',
                margin: '0 auto'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                <h3 style={{ color: 'white', marginBottom: '1rem' }}>No Company Access</h3>
                <p>You don't have access to any companies yet. Please contact an administrator to grant you access.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 