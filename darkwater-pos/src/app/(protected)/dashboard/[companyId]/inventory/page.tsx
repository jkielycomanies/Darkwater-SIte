'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../dashboard.css';
import { 
  TruckIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

// This page redirects to bike inventory by default
export default function InventoryPage() {
  const router = useRouter();
  const params = useParams();
  
  useEffect(() => {
    if (params?.companyId) {
      router.push(`/dashboard/${params.companyId}/inventory/bikes`);
    }
  }, [router, params]);

  return null;
}

function OldInventoryPage() {
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

  const getCompanyBadge = (type: string) => {
    switch (type) {
      case 'dealership':
        return '🏍️ Dealership';
      case 'software':
        return '💻 Software';
      case 'holding':
        return '🏢 Holding';
      default:
        return '🏢 Business';
    }
  };

  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (!params?.companyId) return;

    const companyId = params.companyId as string;
    fetchInventoryData(companyId);
  }, [status, router, params]);

  const fetchInventoryData = async (companyId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch bikes
      const bikesResponse = await fetch(`/api/companies/${companyId}/inventory/bikes`);
      let bikes: any[] = [];
      
      if (bikesResponse.ok) {
        const bikesData = await bikesResponse.json();
        bikes = bikesData.bikes || [];
      }
      
      // Fetch parts
      const partsResponse = await fetch(`/api/companies/${companyId}/inventory/parts`);
      let parts: any[] = [];
      
      if (partsResponse.ok) {
        const partsData = await partsResponse.json();
        parts = partsData.parts || [];
      }
      
      // Fetch accessories
      const accessoriesResponse = await fetch(`/api/companies/${companyId}/inventory/accessories`);
      let accessories: any[] = [];
      
      if (accessoriesResponse.ok) {
        const accessoriesData = await accessoriesResponse.json();
        accessories = accessoriesData.accessories || [];
      }
      
      // Combine all inventory items
      const allItems = [
        ...bikes.map(bike => ({ ...bike, type: 'bike' })),
        ...parts.map(part => ({ ...part, type: 'part' })),
        ...accessories.map(accessory => ({ ...accessory, type: 'accessory' }))
      ];
      
      setInventoryItems(allItems);
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
      setInventoryItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="background-pattern"></div>
      <div className="floating-elements">
        <div className="floating-orb purple"></div>
        <div className="floating-orb blue"></div>
        <div className="floating-orb green"></div>
      </div>

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="company-info">
            <h1 className="company-name">{company.name}</h1>
            <div className="company-badge">
              {getCompanyBadge(company.type)}
            </div>
          </div>
          <div className="user-section">
            <span className="user-welcome">Welcome, {session.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="sign-out-button"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Menu */}
      <nav className="nav-menu">
        <div className="nav-content">
          <button 
            className="nav-button"
            onClick={() => router.push(`/dashboard/${company.slug}`)}
          >
            Dashboard
          </button>
          <button 
            className="nav-button active"
            onClick={() => router.push(`/dashboard/${company.slug}/inventory`)}
          >
            Inventory
          </button>
          <button 
            className="nav-button"
            onClick={() => router.push(`/dashboard/${company.slug}/service-center`)}
          >
            Service Center
          </button>
          <button 
            className="nav-button"
            onClick={() => router.push(`/dashboard/${company.slug}/cms`)}
          >
            CMS
          </button>
          <button 
            className="nav-button"
            onClick={() => router.push(`/dashboard/${company.slug}/media`)}
          >
            Media
          </button>
          <button 
            className="nav-button"
            onClick={() => router.push(`/dashboard/${company.slug}/financial`)}
          >
            Financial
          </button>
          <button 
            className="nav-button"
            onClick={() => router.push(`/dashboard/${company.slug}/archives`)}
          >
            Archives
          </button>
          <button 
            className="nav-button"
            onClick={() => router.push(`/dashboard/${company.slug}/user-management`)}
          >
            User Management
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 className="section-header">Vehicle Inventory</h2>
          <button className="action-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}>
            <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            Add Vehicle
          </button>
        </div>

        {/* Filters and Search */}
        <div className="kpi-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="kpi-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MagnifyingGlassIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
              <input 
                type="text" 
                placeholder="Search vehicles..." 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'white', 
                  outline: 'none', 
                  flex: 1,
                  fontSize: '0.875rem'
                }} 
              />
            </div>
          </div>
          <div className="kpi-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FunnelIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
              <select style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'white', 
                outline: 'none', 
                flex: 1,
                fontSize: '0.875rem'
              }}>
                <option value="">All Categories</option>
                <option value="sport">Sport</option>
                <option value="adventure">Adventure</option>
                <option value="cruiser">Cruiser</option>
              </select>
            </div>
          </div>
          <div className="kpi-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>Status:</span>
              <select style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'white', 
                outline: 'none', 
                flex: 1,
                fontSize: '0.875rem'
              }}>
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="kpi-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '500', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Vehicle
                      <ArrowUpIcon style={{ width: '1rem', height: '1rem' }} />
                    </div>
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '500', fontSize: '0.875rem' }}>Category</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '500', fontSize: '0.875rem' }}>Price</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '500', fontSize: '0.875rem' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '500', fontSize: '0.875rem' }}>VIN</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#cbd5e1' }}>
                      Loading inventory data...
                    </td>
                  </tr>
                ) : inventoryItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#cbd5e1' }}>
                      No inventory items found
                    </td>
                  </tr>
                ) : (
                  inventoryItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '1rem', color: 'white', fontWeight: '500' }}>{item.name}</td>
                    <td style={{ padding: '1rem', color: '#cbd5e1' }}>{item.category}</td>
                    <td style={{ padding: '1rem', color: '#22c55e', fontWeight: '500' }}>{item.price}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem', 
                        fontWeight: '500',
                        background: item.status === 'Available' ? 'rgba(34, 197, 94, 0.2)' : 
                                   item.status === 'Sold' ? 'rgba(239, 68, 68, 0.2)' : 
                                   'rgba(251, 191, 36, 0.2)',
                        color: item.status === 'Available' ? '#22c55e' : 
                               item.status === 'Sold' ? '#ef4444' : 
                               '#fbbf24'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.875rem' }}>{item.vin}</td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
