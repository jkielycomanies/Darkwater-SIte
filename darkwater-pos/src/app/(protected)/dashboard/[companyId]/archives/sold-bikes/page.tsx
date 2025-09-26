'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../../dashboard.css';
import RevaniPortalHeader from '../../../../../../components/RevaniPortalHeader';
import { 
  TruckIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ArchiveBoxIcon
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
  dateSold?: string;
  images?: Array<{
    data: string;
    contentType: string;
    filename: string;
    size: number;
    uploadedAt: string;
  }>;
}

export default function SoldBikesArchivesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [bikeInventory, setBikeInventory] = useState<BikeInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryDropdownOpen, setInventoryDropdownOpen] = useState(false);
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);
  const [serviceCenterDropdownOpen, setServiceCenterDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [archivesDropdownOpen, setArchivesDropdownOpen] = useState(false);

  // Search and filter states
  const [searchFilters, setSearchFilters] = useState({
    searchText: '',
    make: '',
    year: '',
    yearRange: { min: '', max: '' },
    mileageRange: { min: '', max: '' },
    ccRange: { min: '', max: '' },
    status: '',
    soldDateFrom: '',
    soldDateTo: ''
  });

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
        try {
          const bikesResponse = await fetch(`/api/companies/${companyId}/inventory/bikes`);
          if (bikesResponse.ok) {
            const bikesData = await bikesResponse.json();
            // Filter for sold bikes only
            const soldBikes = bikesData.bikes.filter((bike: BikeInventory) => bike.status === 'Sold');
            setBikeInventory(soldBikes);
          } else {
            console.log('Bikes API failed, using fallback data');
            // Fallback data with only sold bikes
            setBikeInventory([
              { _id: '507f1f77bcf86cd799439012', name: '2023 Honda CBR600RR', category: 'Sport', price: 12499, status: 'Sold', vin: 'JH2PC4104NM200001', year: 2023, mileage: '1,250 mi', brand: 'Honda', model: 'CBR600RR', color: 'Red' },
              { _id: '507f1f77bcf86cd799439017', name: '2022 Suzuki GSX-R750', category: 'Sport', price: 15999, status: 'Sold', vin: 'JS1GR7H82N2100001', year: 2022, mileage: '2,100 mi', brand: 'Suzuki', model: 'GSX-R750', color: 'Blue' },
              { _id: '507f1f77bcf86cd799439018', name: '2021 Triumph Street Triple', category: 'Sport', price: 13999, status: 'Sold', vin: 'SMT001KX1MJD00001', year: 2021, mileage: '3,450 mi', brand: 'Triumph', model: 'Street Triple', color: 'White' },
            ]);
          }
        } catch (bikeError) {
          console.error('Bike API error, using fallback:', bikeError);
          // Same fallback data with only sold bikes
          setBikeInventory([
            { _id: '507f1f77bcf86cd799439012', name: '2023 Honda CBR600RR', category: 'Sport', price: 12499, status: 'Sold', vin: 'JH2PC4104NM200001', year: 2023, mileage: '1,250 mi', brand: 'Honda', model: 'CBR600RR', color: 'Red' },
            { _id: '507f1f77bcf86cd799439017', name: '2022 Suzuki GSX-R750', category: 'Sport', price: 15999, status: 'Sold', vin: 'JS1GR7H82N2100001', year: 2022, mileage: '2,100 mi', brand: 'Suzuki', model: 'GSX-R750', color: 'Blue' },
            { _id: '507f1f77bcf86cd799439018', name: '2021 Triumph Street Triple', category: 'Sport', price: 13999, status: 'Sold', vin: 'SMT001KX1MJD00001', year: 2021, mileage: '3,450 mi', brand: 'Triumph', model: 'Street Triple', color: 'White' },
          ]);
        }
      } else if (companyResponse.status === 404) {
        router.push('/select');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      router.push('/select');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter bikes based on search criteria
  const filteredBikes = bikeInventory.filter(bike => {
    const matchesSearchText = !searchFilters.searchText || 
      bike.name.toLowerCase().includes(searchFilters.searchText.toLowerCase()) ||
      bike.brand.toLowerCase().includes(searchFilters.searchText.toLowerCase()) ||
      bike.model.toLowerCase().includes(searchFilters.searchText.toLowerCase()) ||
      bike.vin.toLowerCase().includes(searchFilters.searchText.toLowerCase());

    const matchesMake = !searchFilters.make || 
      bike.brand.toLowerCase().includes(searchFilters.make.toLowerCase());

    const matchesYear = !searchFilters.year || bike.year.toString() === searchFilters.year;

    const matchesYearRange = (!searchFilters.yearRange.min || bike.year >= parseInt(searchFilters.yearRange.min)) &&
      (!searchFilters.yearRange.max || bike.year <= parseInt(searchFilters.yearRange.max));

    const bikeMileage = typeof bike.mileage === 'string' 
      ? parseInt(bike.mileage.replace(/[^0-9]/g, '')) || 0
      : bike.mileage || 0;
    const matchesMileageRange = (!searchFilters.mileageRange.min || bikeMileage >= parseInt(searchFilters.mileageRange.min)) &&
      (!searchFilters.mileageRange.max || bikeMileage <= parseInt(searchFilters.mileageRange.max));

    // For CCs, we'll extract from model or category if available
    const bikeText = `${bike.model} ${bike.category} ${bike.name}`.toLowerCase();
    const ccMatch = bikeText.match(/(\d+)cc|(\d+)\s*cc/);
    const bikeCCs = ccMatch ? parseInt(ccMatch[1] || ccMatch[2]) : 0;
    const matchesCCRange = (!searchFilters.ccRange.min || bikeCCs >= parseInt(searchFilters.ccRange.min)) &&
      (!searchFilters.ccRange.max || bikeCCs <= parseInt(searchFilters.ccRange.max));

    const matchesStatus = !searchFilters.status || 
      bike.status.toLowerCase() === searchFilters.status.toLowerCase();

    const matchesSoldDate = (() => {
      if (!searchFilters.soldDateFrom && !searchFilters.soldDateTo) return true;
      const d = bike.dateSold ? new Date(bike.dateSold) : null;
      if (!d || isNaN(d.getTime())) return false;
      if (searchFilters.soldDateFrom) {
        const from = new Date(searchFilters.soldDateFrom + 'T00:00:00');
        if (d < from) return false;
      }
      if (searchFilters.soldDateTo) {
        const to = new Date(searchFilters.soldDateTo + 'T23:59:59');
        if (d > to) return false;
      }
      return true;
    })();

    return matchesSearchText && matchesMake && matchesYear && matchesYearRange && 
           matchesMileageRange && matchesCCRange && matchesStatus && matchesSoldDate;
  });

  const handleFilterChange = (filterKey: string, value: string) => {
    setSearchFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleRangeChange = (rangeType: string, minMax: string, value: string) => {
    setSearchFilters(prev => {
      if (rangeType === 'yearRange') {
        return { ...prev, yearRange: { ...prev.yearRange, [minMax]: value } };
      }
      if (rangeType === 'mileageRange') {
        return { ...prev, mileageRange: { ...prev.mileageRange, [minMax]: value } };
      }
      if (rangeType === 'ccRange') {
        return { ...prev, ccRange: { ...prev.ccRange, [minMax]: value } };
      }
      return prev;
    });
  };

  const clearFilters = () => {
    setSearchFilters(prev => ({
      ...prev,
      searchText: '',
      make: '',
      year: '',
      yearRange: { min: '', max: '' },
      mileageRange: { min: '', max: '' },
      ccRange: { min: '', max: '' },
      status: '',
      soldDateFrom: '',
      soldDateTo: ''
    }));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sold':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '#22c55e40' }; // Green for sold
      default:
        return { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280', border: '#6b728040' }; // Gray
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

      <RevaniPortalHeader company={company} activePage="archives" />




      {/* Main Content */}
      <main className="dashboard-main">
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 className="section-header">📦 Sold Bikes Archives</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="action-card" 
              style={{ 
                padding: '0.75rem 1.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                width: 'auto',
                color: 'white',
                background: 'rgba(34, 197, 94, 0.3)',
                border: '1px solid rgba(34, 197, 94, 0.5)'
              }}
              onClick={() => router.push(`/dashboard/${company.slug}/inventory/bikes`)}
            >
              <TruckIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              View Active Inventory
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
          <div className="kpi-card">
            <ArchiveBoxIcon className="kpi-icon" />
            <div className="kpi-value">{bikeInventory.length}</div>
            <div className="kpi-title">Total Sold</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: '#22c55e' }}>💰</div>
            <div className="kpi-value">${bikeInventory.reduce((sum, bike) => sum + bike.price, 0).toLocaleString()}</div>
            <div className="kpi-title">Total Value</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: '#fbbf24' }}>📊</div>
            <div className="kpi-value">{bikeInventory.length > 0 ? Math.round(bikeInventory.reduce((sum, bike) => sum + bike.price, 0) / bikeInventory.length) : 0}</div>
            <div className="kpi-title">Avg. Price</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: '#8b5cf6' }}>📅</div>
            <div className="kpi-value">{new Date().getFullYear()}</div>
            <div className="kpi-title">Current Year</div>
          </div>
        </div>

        {/* Enhanced Filters and Search */}
        <div style={{ marginBottom: '2rem' }}>
          {/* Main Search Bar */}
          <div className="kpi-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MagnifyingGlassIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
              <input 
                type="text" 
                placeholder="Search sold bikes by name, brand, model, or VIN..." 
                value={searchFilters.searchText}
                onChange={(e) => handleFilterChange('searchText', e.target.value)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'white', 
                  outline: 'none', 
                  flex: 1,
                  fontSize: '0.875rem'
                }} 
              />
              {(searchFilters.searchText || searchFilters.make || searchFilters.year || searchFilters.status ||
                searchFilters.yearRange.min || searchFilters.yearRange.max || 
                searchFilters.mileageRange.min || searchFilters.mileageRange.max ||
                searchFilters.ccRange.min || searchFilters.ccRange.max) && (
                <button 
                  onClick={clearFilters}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: '#ef4444',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter Grid */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {/* Make Filter */}
            <div className="kpi-card" style={{ padding: '1rem' }}>
              <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                Make
              </label>
              <select 
                value={searchFilters.make}
                onChange={(e) => handleFilterChange('make', e.target.value)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'white', 
                  outline: 'none', 
                  width: '100%',
                  fontSize: '0.875rem'
                }}
              >
                <option value="" style={{ background: '#1e293b', color: 'white' }}>All Makes</option>
                {/* Get unique makes from inventory */}
                {[...new Set(bikeInventory.map(bike => bike.brand))]
                  .filter(brand => brand) // Remove empty brands
                  .sort() // Sort alphabetically
                  .map(brand => (
                    <option key={brand} value={brand} style={{ background: '#1e293b', color: 'white' }}>
                      {brand}
                    </option>
                  ))
                }
              </select>
            </div>

            {/* Year Filter */}
            <div className="kpi-card" style={{ padding: '1rem' }}>
              <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                Year Range
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={searchFilters.yearRange.min}
                  onChange={(e) => handleRangeChange('yearRange', 'min', e.target.value)}
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid rgba(139, 92, 246, 0.3)', 
                    borderRadius: '4px',
                    color: 'white', 
                    outline: 'none', 
                    width: '45%',
                    fontSize: '0.75rem',
                    padding: '0.25rem'
                  }} 
                />
                <span style={{ color: '#8b5cf6', fontSize: '0.75rem' }}>-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={searchFilters.yearRange.max}
                  onChange={(e) => handleRangeChange('yearRange', 'max', e.target.value)}
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid rgba(139, 92, 246, 0.3)', 
                    borderRadius: '4px',
                    color: 'white', 
                    outline: 'none', 
                    width: '45%',
                    fontSize: '0.75rem',
                    padding: '0.25rem'
                  }} 
                />
              </div>
            </div>

            {/* Mileage Range Filter */}
            <div className="kpi-card" style={{ padding: '1rem' }}>
              <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                Miles Range
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={searchFilters.mileageRange.min}
                  onChange={(e) => handleRangeChange('mileageRange', 'min', e.target.value)}
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid rgba(139, 92, 246, 0.3)', 
                    borderRadius: '4px',
                    color: 'white', 
                    outline: 'none', 
                    width: '45%',
                    fontSize: '0.75rem',
                    padding: '0.25rem'
                  }} 
                />
                <span style={{ color: '#8b5cf6', fontSize: '0.75rem' }}>-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={searchFilters.mileageRange.max}
                  onChange={(e) => handleRangeChange('mileageRange', 'max', e.target.value)}
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid rgba(139, 92, 246, 0.3)', 
                    borderRadius: '4px',
                    color: 'white', 
                    outline: 'none', 
                    width: '45%',
                    fontSize: '0.75rem',
                    padding: '0.25rem'
                  }} 
                />
              </div>
            </div>

            {/* Sold Date Range */}
            <div className="kpi-card" style={{ padding: '1rem' }}>
              <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                Sold Date Range
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="date"
                  value={searchFilters.soldDateFrom}
                  onChange={(e) => handleFilterChange('soldDateFrom', e.target.value)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    outline: 'none',
                    width: '45%',
                    fontSize: '0.75rem',
                    padding: '0.25rem'
                  }}
                />
                <span style={{ color: '#8b5cf6', fontSize: '0.75rem' }}>-</span>
                <input
                  type="date"
                  value={searchFilters.soldDateTo}
                  onChange={(e) => handleFilterChange('soldDateTo', e.target.value)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    outline: 'none',
                    width: '45%',
                    fontSize: '0.75rem',
                    padding: '0.25rem'
                  }}
                />
              </div>
            </div>

            {/* CC Range Filter */}
            <div className="kpi-card" style={{ padding: '1rem' }}>
              <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                Engine CC Range
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={searchFilters.ccRange.min}
                  onChange={(e) => handleRangeChange('ccRange', 'min', e.target.value)}
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid rgba(139, 92, 246, 0.3)', 
                    borderRadius: '4px',
                    color: 'white', 
                    outline: 'none', 
                    width: '45%',
                    fontSize: '0.75rem',
                    padding: '0.25rem'
                  }} 
                />
                <span style={{ color: '#8b5cf6', fontSize: '0.75rem' }}>-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={searchFilters.ccRange.max}
                  onChange={(e) => handleRangeChange('ccRange', 'max', e.target.value)}
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid rgba(139, 92, 246, 0.3)', 
                    borderRadius: '4px',
                    color: 'white', 
                    outline: 'none', 
                    width: '45%',
                    fontSize: '0.75rem',
                    padding: '0.25rem'
                  }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sold Bikes Inventory Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.5rem',
          maxWidth: '100%'
        }}>
          {/* Results Count */}
          <div style={{ 
            gridColumn: '1 / -1', 
            marginBottom: '1rem', 
            color: '#8b5cf6', 
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            Showing {filteredBikes.length} of {bikeInventory.length} sold bikes
            {filteredBikes.length !== bikeInventory.length && (
              <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>
                (filtered)
              </span>
            )}
          </div>

          {filteredBikes.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '3rem',
              color: '#64748b',
              fontSize: '1rem'
            }}>
              {bikeInventory.length === 0 
                ? 'No sold bikes in archives yet.' 
                : 'No sold bikes match your search criteria. Try adjusting the filters.'}
            </div>
          ) : (
            filteredBikes.map((bike) => (
            <div 
              key={bike._id} 
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
              onClick={() => {
                router.push(`/dashboard/${company.slug}/inventory/bikes/${bike._id}`);
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
                background: getStatusColor(bike.status).bg,
                color: getStatusColor(bike.status).color,
                border: `1px solid ${getStatusColor(bike.status).border}`
              }}>
                {bike.status}
              </div>

              {/* Bike Image */}
              <div style={{
                width: '100%',
                height: '180px',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                overflow: 'hidden',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                {bike.images && bike.images.length > 0 ? (
                  <img
                    src={`data:${bike.images[0].contentType};base64,${bike.images[0].data}`}
                    alt={bike.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '12px'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px'
              }}>
                <div style={{ fontSize: '3rem' }}>📦</div>
                  </div>
                )}
              </div>

              {/* Bike Details */}
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ 
                  color: 'white', 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  marginBottom: '0.5rem',
                  lineHeight: '1.3'
                }}>
                  {bike.name}
                </h3>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ 
                    color: '#22c55e', 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    background: 'rgba(34, 197, 94, 0.1)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px'
                  }}>
                    {bike.category}
                  </span>
                  <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                    {bike.dateSold ? new Date(bike.dateSold).toLocaleDateString() : `${bike.year} Model`}
                  </span>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      Mileage
                    </p>
                    <p style={{ color: '#cbd5e1', fontSize: '0.875rem', fontWeight: '500' }}>
                      {typeof bike.mileage === 'number' ? `${bike.mileage.toLocaleString()} mi` : bike.mileage}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      Sold Price
                    </p>
                    <p style={{ 
                      color: '#22c55e', 
                      fontSize: '1.25rem', 
                      fontWeight: '700',
                      textShadow: '0 0 10px rgba(34, 197, 94, 0.3)'
                    }}>
                      ${bike.actualSalePrice ? bike.actualSalePrice.toLocaleString() : bike.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div style={{ 
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: '0.75rem'
                }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    VIN
                  </p>
                  <p style={{ 
                    color: '#cbd5e1', 
                    fontSize: '0.75rem', 
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em'
                  }}>
                    {bike.vin}
                  </p>
                </div>

                {/* Archive Note */}
                <div style={{ 
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    color: '#22c55e', 
                    fontSize: '0.75rem', 
                    fontWeight: '500',
                    margin: 0
                  }}>
                    📦 Archived - Click to view details
                  </p>
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}


