'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../../dashboard.css';
import RevaniPortalHeader from '../../../../../../components/RevaniPortalHeader';
import { 
  TruckIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  EyeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface BikeInventory {
  _id: string;
  name: string;
  category: string;
  price: number;
  actualSalePrice?: number;
  status: 'Acquisition' | 'Evaluation' | 'Servicing' | 'Media' | 'Listed' | 'Sold';
  vin: string;
  year: number;
  mileage: string | number;
  brand: string;
  model: string;
  color?: string;
  description?: string;
  images?: Array<{
    data: string;
    contentType: string;
    filename: string;
    size: number;
    uploadedAt: string;
  }>;
}

export default function SalesCenterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [bikeInventory, setBikeInventory] = useState<BikeInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search and filter states
  const [searchFilters, setSearchFilters] = useState({
    searchText: '',
    make: '',
    year: '',
    yearRange: { min: '', max: '' },
    mileageRange: { min: '', max: '' },
    ccRange: { min: '', max: '' }
  });

  // Sort state
  const [sortBy, setSortBy] = useState('year');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
      // Fetch company data
      const companyResponse = await fetch(`/api/companies/${companyId}`);
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        setCompany(companyData.company);
        
        // Fetch bike inventory
        const bikesResponse = await fetch(`/api/companies/${companyId}/inventory/bikes`);
        if (bikesResponse.ok) {
          const bikesData = await bikesResponse.json();
          // Filter only bikes with 'Listed' status
          const listedBikes = bikesData.bikes?.filter((bike: BikeInventory) => bike.status === 'Listed') || [];
          setBikeInventory(listedBikes);
        }
      } else if (companyResponse.status === 404) {
        router.push('/select');
      }
    } catch (error) {
      console.error('Failed to fetch company:', error);
      router.push('/select');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter bikes based on search criteria
  const filteredBikes = bikeInventory.filter(bike => {
    const matchesSearch = !searchFilters.searchText || 
      bike.brand.toLowerCase().includes(searchFilters.searchText.toLowerCase()) ||
      bike.model.toLowerCase().includes(searchFilters.searchText.toLowerCase()) ||
      bike.vin.toLowerCase().includes(searchFilters.searchText.toLowerCase()) ||
      bike.year.toString().includes(searchFilters.searchText);

    const matchesMake = !searchFilters.make || bike.brand.toLowerCase() === searchFilters.make.toLowerCase();
    const matchesYear = !searchFilters.year || bike.year.toString() === searchFilters.year;

    const yearNum = bike.year;
    const matchesYearRange = (!searchFilters.yearRange.min || yearNum >= parseInt(searchFilters.yearRange.min)) &&
                           (!searchFilters.yearRange.max || yearNum <= parseInt(searchFilters.yearRange.max));

    const mileageNum = typeof bike.mileage === 'string' ? parseInt(bike.mileage.replace(/,/g, '')) : bike.mileage;
    const matchesMileageRange = (!searchFilters.mileageRange.min || mileageNum >= parseInt(searchFilters.mileageRange.min)) &&
                               (!searchFilters.mileageRange.max || mileageNum <= parseInt(searchFilters.mileageRange.max));

    return matchesSearch && matchesMake && matchesYear && matchesYearRange && matchesMileageRange;
  });

  // Sort bikes
  const sortedBikes = [...filteredBikes].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'year':
        aValue = a.year;
        bValue = b.year;
        break;
      case 'price':
        aValue = a.price;
        bValue = b.price;
        break;
      case 'brand':
        aValue = a.brand.toLowerCase();
        bValue = b.brand.toLowerCase();
        break;
      case 'model':
        aValue = a.model.toLowerCase();
        bValue = b.model.toLowerCase();
        break;
      case 'mileage':
        aValue = typeof a.mileage === 'string' ? parseInt(a.mileage.replace(/,/g, '')) : a.mileage;
        bValue = typeof b.mileage === 'string' ? parseInt(b.mileage.replace(/,/g, '')) : b.mileage;
        break;
      default:
        aValue = a.year;
        bValue = b.year;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMileage = (mileage: string | number) => {
    if (typeof mileage === 'string') {
      return mileage;
    }
    return mileage.toLocaleString();
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="loading-container">
        <div className="background-pattern"></div>
        <div className="floating-elements">
          <div className="floating-orb purple"></div>
          <div className="floating-orb blue"></div>
          <div className="floating-orb green"></div>
        </div>
        <div className="loading-content">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!session || !company) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <div className="background-pattern"></div>
      <div className="floating-elements">
        <div className="floating-orb purple"></div>
        <div className="floating-orb blue"></div>
        <div className="floating-orb green"></div>
      </div>

      <RevaniPortalHeader company={company} activePage="sales" />

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 className="section-header">🏪 Sales Center</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              {sortedBikes.length} bikes available for sale
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
          <div className="kpi-card">
            <TruckIcon className="kpi-icon" />
            <div className="kpi-value">{sortedBikes.length}</div>
            <div className="kpi-title">Listed Bikes</div>
          </div>
          <div className="kpi-card">
            <CurrencyDollarIcon className="kpi-icon" style={{ color: '#22c55e' }} />
            <div className="kpi-value">
              {sortedBikes.length > 0 ? Math.round(sortedBikes.reduce((sum, bike) => sum + bike.price, 0) / sortedBikes.length) : 0}
            </div>
            <div className="kpi-title">Avg. Price</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: '#8b5cf6' }}>📊</div>
            <div className="kpi-value">
              {formatCurrency(sortedBikes.reduce((sum, bike) => sum + bike.price, 0))}
            </div>
            <div className="kpi-title">Total Value</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: '#f59e0b' }}>⭐</div>
            <div className="kpi-value">
              {sortedBikes.filter(bike => bike.year >= new Date().getFullYear() - 2).length}
            </div>
            <div className="kpi-title">Recent Models</div>
          </div>
        </div>

        {/* Enhanced Filters and Search */}
        <div style={{ marginBottom: '2rem' }}>
          {/* Main Search Bar */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
              <MagnifyingGlassIcon style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1.25rem',
                height: '1.25rem',
                color: '#6b7280'
              }} />
              <input
                type="text"
                placeholder="Search by brand, model, VIN, or year..."
                value={searchFilters.searchText}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, searchText: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 3rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <select
              value={searchFilters.make}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, make: e.target.value }))}
              style={{
                padding: '0.5rem',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '0.375rem',
                color: 'white',
                fontSize: '0.875rem'
              }}
            >
              <option value="">All Makes</option>
              {Array.from(new Set(bikeInventory.map(bike => bike.brand))).map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>

            <select
              value={searchFilters.year}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, year: e.target.value }))}
              style={{
                padding: '0.5rem',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '0.375rem',
                color: 'white',
                fontSize: '0.875rem'
              }}
            >
              <option value="">All Years</option>
              {Array.from(new Set(bikeInventory.map(bike => bike.year))).sort((a, b) => b - a).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Min Year"
                value={searchFilters.yearRange.min}
                onChange={(e) => setSearchFilters(prev => ({ 
                  ...prev, 
                  yearRange: { ...prev.yearRange, min: e.target.value } 
                }))}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '0.375rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  width: '100px'
                }}
              />
              <span style={{ color: '#94a3b8' }}>to</span>
              <input
                type="number"
                placeholder="Max Year"
                value={searchFilters.yearRange.max}
                onChange={(e) => setSearchFilters(prev => ({ 
                  ...prev, 
                  yearRange: { ...prev.yearRange, max: e.target.value } 
                }))}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '0.375rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  width: '100px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Sort Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem' 
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Sort by:</span>
            {['year', 'price', 'brand', 'model', 'mileage'].map(field => (
              <button
                key={field}
                onClick={() => handleSort(field)}
                style={{
                  padding: '0.5rem 1rem',
                  background: sortBy === field ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '0.375rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.3s ease'
                }}
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
                {sortBy === field && (
                  <ArrowUpIcon style={{ 
                    width: '0.75rem', 
                    height: '0.75rem',
                    transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bike Grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {sortedBikes.map((bike) => (
            <div
              key={bike._id}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '1rem',
                padding: '1.5rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(139, 92, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onClick={() => router.push(`/dashboard/${company.slug}/inventory/bikes/${bike._id}`)}
            >
              {/* Bike Image */}
              <div style={{
                width: '100%',
                height: '200px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                borderRadius: '0.75rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {bike.images && bike.images.length > 0 ? (
                  <img
                    src={`data:${bike.images[0].contentType};base64,${bike.images[0].data}`}
                    alt={bike.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '0.75rem'
                    }}
                  />
                ) : (
                  <TruckIcon style={{ width: '3rem', height: '3rem', color: '#8b5cf6' }} />
                )}
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  background: 'rgba(34, 197, 94, 0.9)',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  LISTED
                </div>
              </div>

              {/* Bike Info */}
              <div>
                <h3 style={{
                  color: 'white',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  margin: '0 0 0.5rem 0'
                }}>
                  {bike.year} {bike.brand} {bike.model}
                </h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                    {bike.category} • {formatMileage(bike.mileage)} miles
                  </span>
                  <span style={{ color: '#8b5cf6', fontSize: '0.875rem', fontWeight: '500' }}>
                    VIN: {bike.vin}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    color: '#22c55e',
                    fontSize: '1.5rem',
                    fontWeight: '700'
                  }}>
                    {formatCurrency(bike.price)}
                  </div>
                  <button
                    style={{
                      background: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      color: '#8b5cf6',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '33%',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/${company.slug}/sales/${bike._id}`);
                    }}
                  >
                    Sell
                  </button>
                </div>

                {bike.description && (
                  <p style={{
                    color: '#cbd5e1',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {bike.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {sortedBikes.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#94a3b8'
          }}>
            <TruckIcon style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ color: '#e2e8f0', marginBottom: '0.5rem' }}>No bikes listed for sale</h3>
            <p>There are currently no bikes with "Listed" status in your inventory.</p>
          </div>
        )}
      </main>
    </div>
  );
}
