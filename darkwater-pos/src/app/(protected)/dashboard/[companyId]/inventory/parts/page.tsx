'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../../dashboard.css';
import RevaniPortalHeader from '../../../../../../components/RevaniPortalHeader';
import { 
  CogIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  ArrowUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

export default function PartsInventoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (params?.companyId) {
      fetchCompanyData(params.companyId as string);
    }
  }, [status, router, params]);

  const fetchCompanyData = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
      } else if (response.status === 404) {
        router.push('/select');
      }
    } catch (error) {
      console.error('Failed to fetch company:', error);
      router.push('/select');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="loading-container">
        <div className="background-pattern"></div>
        <div className="floating-elements">
          <div className="floating-orb purple"></div>
          <div className="floating-orb blue"></div>
        </div>
        <div className="loading-card">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!session || !company) {
    return null;
  }



  // Sample parts inventory data
  const partsInventory = [
    { id: 1, name: 'Yamaha R1 Engine Oil Filter', category: 'Filters', price: '$15.99', status: 'In Stock', partNumber: 'YAM-5GH-13440-30', stock: 25 },
    { id: 2, name: 'Honda CBR Brake Pads Front', category: 'Brakes', price: '$89.99', status: 'Low Stock', partNumber: 'HON-06455-MEN-305', stock: 3 },
    { id: 3, name: 'Kawasaki H2 Air Filter', category: 'Filters', price: '$45.99', status: 'In Stock', partNumber: 'KAW-11013-0726', stock: 15 },
    { id: 4, name: 'BMW GS Chain 525x120', category: 'Drive Train', price: '$125.99', status: 'Out of Stock', partNumber: 'BMW-82117-713-939', stock: 0 },
    { id: 5, name: 'Ducati V4 Spark Plugs (4pk)', category: 'Engine', price: '$68.99', status: 'In Stock', partNumber: 'DUC-67090111A', stock: 12 },
    { id: 6, name: 'Universal LED Headlight', category: 'Lighting', price: '$199.99', status: 'In Stock', partNumber: 'UNI-HL-7000-LED', stock: 8 },
  ];

  return (
    <div className="dashboard-container">
      <div className="background-pattern"></div>
      <div className="floating-elements">
        <div className="floating-orb purple"></div>
        <div className="floating-orb blue"></div>
        <div className="floating-orb green"></div>
      </div>

      <RevaniPortalHeader company={company} activePage="inventory" />

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 className="section-header">🔧 Parts Inventory</h2>
          <button className="action-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}>
            <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            Add Part
          </button>
        </div>

        {/* Stats Cards */}
        <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
          <div className="kpi-card">
            <CogIcon className="kpi-icon" />
            <div className="kpi-value">6</div>
            <div className="kpi-title">Total Parts</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: '#22c55e' }}>✓</div>
            <div className="kpi-value">4</div>
            <div className="kpi-title">In Stock</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: '#fbbf24' }}>⚠</div>
            <div className="kpi-value">1</div>
            <div className="kpi-title">Low Stock</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: '#ef4444' }}>✗</div>
            <div className="kpi-value">1</div>
            <div className="kpi-title">Out of Stock</div>
          </div>
        </div>

        {/* Parts Inventory Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.5rem',
          maxWidth: '100%'
        }}>
          {partsInventory.map((part) => (
            <div 
              key={part.id} 
              className="kpi-card" 
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 35px 70px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.25)';
              }}
            >
              {/* Status Badge */}
              <div style={{ 
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                padding: '0.25rem 0.75rem', 
                borderRadius: '9999px', 
                fontSize: '0.75rem', 
                fontWeight: '500',
                background: part.status === 'In Stock' ? 'rgba(34, 197, 94, 0.2)' : 
                           part.status === 'Out of Stock' ? 'rgba(239, 68, 68, 0.2)' : 
                           'rgba(251, 191, 36, 0.2)',
                color: part.status === 'In Stock' ? '#22c55e' : 
                       part.status === 'Out of Stock' ? '#ef4444' : 
                       '#fbbf24',
                border: `1px solid ${part.status === 'In Stock' ? '#22c55e' : 
                                     part.status === 'Out of Stock' ? '#ef4444' : 
                                     '#fbbf24'}40`
              }}>
                {part.status}
              </div>

              {/* Part Image Placeholder */}
              <div style={{
                width: '100%',
                height: '180px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <div style={{ fontSize: '3rem' }}>🔧</div>
              </div>

              {/* Part Details */}
              <div style={{ textAlign: 'left', padding: '0 1rem' }}>
                <h3 style={{ 
                  color: 'white', 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  marginBottom: '0.75rem',
                  lineHeight: '1.3',
                  marginLeft: '0'
                }}>
                  {part.name}
                </h3>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ 
                    color: '#8b5cf6', 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    background: 'rgba(139, 92, 246, 0.1)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    alignSelf: 'flex-start'
                  }}>
                    {part.category}
                  </span>
                  <span style={{ 
                    color: part.stock > 5 ? '#22c55e' : part.stock > 0 ? '#fbbf24' : '#ef4444', 
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    alignSelf: 'flex-start'
                  }}>
                    Stock: {part.stock}
                  </span>
                </div>

                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div style={{ alignSelf: 'flex-start' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      Part Number
                    </p>
                    <p style={{ 
                      color: '#cbd5e1', 
                      fontSize: '0.75rem', 
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em'
                    }}>
                      {part.partNumber}
                    </p>
                  </div>
                  <div style={{ alignSelf: 'flex-start' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      Price
                    </p>
                    <p style={{ 
                      color: '#22c55e', 
                      fontSize: '1.25rem', 
                      fontWeight: '700',
                      textShadow: '0 0 10px rgba(34, 197, 94, 0.3)'
                    }}>
                      {part.price}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
