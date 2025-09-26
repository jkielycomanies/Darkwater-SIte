'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../../dashboard.css';
import RevaniPortalHeader from '../../../../../../components/RevaniPortalHeader';
import { 
  TruckIcon, 
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

export default function BikeInventoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [bikeInventory, setBikeInventory] = useState<BikeInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAddBikeModal, setShowAddBikeModal] = useState(false);
  const [newBikeForm, setNewBikeForm] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'Sport',
    price: '',
    status: 'Acquisition' as 'Acquisition' | 'Evaluation' | 'Servicing' | 'Media' | 'Listed' | 'Sold',
    vin: '',
    mileage: '',
    color: ''
  });
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // Search and filter states
  type RangeKey = 'yearRange' | 'mileageRange' | 'ccRange';
  type RangeProp = 'min' | 'max';

  const [searchFilters, setSearchFilters] = useState({
    searchText: '',
    make: '',
    year: '',
    yearRange: { min: '', max: '' },
    mileageRange: { min: '', max: '' },
    ccRange: { min: '', max: '' },
    status: ''
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
            // Filter out sold bikes - only show active inventory
            const activeBikes = bikesData.bikes.filter((bike: BikeInventory) => bike.status !== 'Sold');
            setBikeInventory(activeBikes);
          } else {
            console.log('Bikes API failed, using fallback data');
            // Fallback data with real _id format - only active bikes
            setBikeInventory([
              { _id: '507f1f77bcf86cd799439011', name: '2024 Yamaha R1', category: 'Sport', price: 18999, status: 'Listed', vin: 'JYA1WE010MA000001', year: 2024, mileage: '0 mi', brand: 'Yamaha', model: 'R1', color: 'Blue' },
              { _id: '507f1f77bcf86cd799439013', name: '2024 Kawasaki Ninja H2', category: 'Sport', price: 29500, status: 'Media', vin: 'JKAZF2J18PA000001', year: 2024, mileage: '0 mi', brand: 'Kawasaki', model: 'Ninja H2', color: 'Green' },
              { _id: '507f1f77bcf86cd799439014', name: '2023 BMW R1250GS', category: 'Adventure', price: 18750, status: 'Servicing', vin: 'WB10G3100PM000001', year: 2023, mileage: '2,100 mi', brand: 'BMW', model: 'R1250GS', color: 'White' },
              { _id: '507f1f77bcf86cd799439015', name: '2024 Ducati Panigale V4', category: 'Sport', price: 24995, status: 'Evaluation', vin: 'ZDM12AKU6PB000001', year: 2024, mileage: '0 mi', brand: 'Ducati', model: 'Panigale V4', color: 'Red' },
              { _id: '507f1f77bcf86cd799439016', name: '2023 Harley-Davidson Street Glide', category: 'Cruiser', price: 22899, status: 'Acquisition', vin: '1HD1KB413LB000001', year: 2023, mileage: '850 mi', brand: 'Harley-Davidson', model: 'Street Glide', color: 'Black' },
            ]);
          }
        } catch (bikeError) {
          console.error('Bike API error, using fallback:', bikeError);
          // Same fallback data - only active bikes
          setBikeInventory([
            { _id: '507f1f77bcf86cd799439011', name: '2024 Yamaha R1', category: 'Sport', price: 18999, status: 'Listed', vin: 'JYA1WE010MA000001', year: 2024, mileage: '0 mi', brand: 'Yamaha', model: 'R1', color: 'Blue' },
            { _id: '507f1f77bcf86cd799439013', name: '2024 Kawasaki Ninja H2', category: 'Sport', price: 29500, status: 'Media', vin: 'JKAZF2J18PA000001', year: 2024, mileage: '0 mi', brand: 'Kawasaki', model: 'Ninja H2', color: 'Green' },
            { _id: '507f1f77bcf86cd799439014', name: '2023 BMW R1250GS', category: 'Adventure', price: 18750, status: 'Servicing', vin: 'WB10G3100PM000001', year: 2023, mileage: '2,100 mi', brand: 'BMW', model: 'R1250GS', color: 'White' },
            { _id: '507f1f77bcf86cd799439015', name: '2024 Ducati Panigale V4', category: 'Sport', price: 24995, status: 'Evaluation', vin: 'ZDM12AKU6PB000001', year: 2024, mileage: '0 mi', brand: 'Ducati', model: 'Panigale V2', color: 'Red' },
            { _id: '507f1f77bcf86cd799439016', name: '2023 Harley-Davidson Street Glide', category: 'Cruiser', price: 22899, status: 'Acquisition', vin: '1HD1KB413LB000001', year: 2023, mileage: '850 mi', brand: 'Harley-Davidson', model: 'Street Glide', color: 'Black' },
          ]);
        }
      } else if (companyResponse.status === 404) {
        console.log('Company not found, redirecting to select page');
        router.push('/select');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      console.log('Error occurred, redirecting to select page');
      router.push('/select');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBike = async () => {
    try {
      // Auto-generate bike name from brand, model, and year
      const generatedName = `${newBikeForm.year} ${newBikeForm.brand} ${newBikeForm.model}`.trim();

      // Create the bike data to send to API
      const bikeData = {
        name: generatedName,
        brand: newBikeForm.brand,
        model: newBikeForm.model,
        year: newBikeForm.year,
        category: newBikeForm.category,
        price: parseInt(newBikeForm.price) || 0,
        status: newBikeForm.status,
        vin: newBikeForm.vin,
        mileage: newBikeForm.mileage,
        color: newBikeForm.color
      };

      // Make API call to save bike to database
      const response = await fetch(`/api/companies/${params.companyId}/inventory/bikes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bikeData),
      });

      if (!response.ok) {
        throw new Error('Failed to create bike');
      }

      const result = await response.json();
      
      if (result.success) {
        // Add the saved bike to the current list
        setBikeInventory(prev => [...prev, result.bike]);
        console.log('Bike successfully saved to database:', result.bike);
        console.log('Collection:', result.message);
      } else {
        throw new Error(result.error || 'Failed to create bike');
      }
      
      // Reset form and close modal
      setNewBikeForm({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        category: 'Sport',
        price: '',
        status: 'Acquisition',
        vin: '',
        mileage: '',
        color: ''
      });
      setShowAddBikeModal(false);

    } catch (error) {
      console.error('Error adding bike:', error);
      alert('Failed to add bike. Please try again.');
    }
  };

  const handleFormChange = (field: string, value: string | number) => {
    setNewBikeForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filter bikes based on search criteria
  const filteredBikes = bikeInventory.filter(bike => {
    // Safe string operations with null/undefined checks
    const safeLower = (str: any) => (str || '').toString().toLowerCase();
    
    const matchesSearchText = !searchFilters.searchText || 
      safeLower(bike.name).includes(searchFilters.searchText.toLowerCase()) ||
      safeLower(bike.brand).includes(searchFilters.searchText.toLowerCase()) ||
      safeLower(bike.model).includes(searchFilters.searchText.toLowerCase()) ||
      safeLower(bike.vin).includes(searchFilters.searchText.toLowerCase());

    const matchesMake = !searchFilters.make || 
      safeLower(bike.brand).includes(searchFilters.make.toLowerCase());

    const matchesYear = !searchFilters.year || (bike.year && bike.year.toString() === searchFilters.year);

    const matchesYearRange = (!searchFilters.yearRange.min || (bike.year && bike.year >= parseInt(searchFilters.yearRange.min))) &&
      (!searchFilters.yearRange.max || (bike.year && bike.year <= parseInt(searchFilters.yearRange.max)));

    const bikeMileage = parseInt(typeof bike.mileage === 'string' ? bike.mileage.replace(/[^0-9]/g, '') : (bike.mileage || 0).toString()) || 0;
    const matchesMileageRange = (!searchFilters.mileageRange.min || bikeMileage >= parseInt(searchFilters.mileageRange.min)) &&
      (!searchFilters.mileageRange.max || bikeMileage <= parseInt(searchFilters.mileageRange.max));

    // For CCs, we'll extract from model or category if available
    const bikeText = `${bike.model || ''} ${bike.category || ''} ${bike.name || ''}`.toLowerCase();
    const ccMatch = bikeText.match(/(\d+)cc|(\d+)\s*cc/);
    const bikeCCs = ccMatch ? parseInt(ccMatch[1] || ccMatch[2]) : 0;
    const matchesCCRange = (!searchFilters.ccRange.min || bikeCCs >= parseInt(searchFilters.ccRange.min)) &&
      (!searchFilters.ccRange.max || bikeCCs <= parseInt(searchFilters.ccRange.max));

    const matchesStatus = !searchFilters.status || 
      safeLower(bike.status) === searchFilters.status.toLowerCase();

    return matchesSearchText && matchesMake && matchesYear && matchesYearRange && 
           matchesMileageRange && matchesCCRange && matchesStatus;
  });

  const handleFilterChange = (filterKey: string, value: string) => {
    setSearchFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleRangeChange = (rangeType: RangeKey, minMax: RangeProp, value: string) => {
    setSearchFilters(prev => {
      const currentRange = (prev as any)[rangeType] || { min: '', max: '' };
      return {
        ...prev,
        [rangeType]: {
          ...currentRange,
          [minMax]: value,
        },
      } as typeof prev;
    });
  };

  const clearFilters = () => {
    setSearchFilters({
      searchText: '',
      make: '',
      year: '',
      yearRange: { min: '', max: '' },
      mileageRange: { min: '', max: '' },
      ccRange: { min: '', max: '' },
      status: ''
    });
  };

  const autoFillFromVIN = async () => {
    if (!newBikeForm.vin || newBikeForm.vin.length !== 17) {
      alert('Please enter a valid 17-character VIN first');
      return;
    }

    setIsAutoFilling(true);

    try {
      // Use NHTSA API to decode VIN
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${newBikeForm.vin}?format=json`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.Results || data.Results.length === 0) {
        throw new Error('No data returned from VIN API');
      }

      // Extract relevant information from NHTSA API response
      const results = data.Results;
      const getValue = (variableName: string) => {
        const item = results.find((r: { Variable: string; Value: string }) => r.Variable === variableName);
        return item?.Value || '';
      };

      // Check if VIN is valid
      const errorCode = getValue('Error Code');
      const errorText = getValue('Error Text');
      
      if (errorCode && errorCode !== '0') {
        alert(errorText || 'Invalid VIN format');
        setIsAutoFilling(false);
        return;
      }

      // Extract vehicle information
      const make = getValue('Make');
      const model = getValue('Model');
      const year = parseInt(getValue('Model Year')) || new Date().getFullYear();
      const vehicleType = getValue('Vehicle Type');
      const bodyClass = getValue('Body Class');

      // Determine category based on vehicle data
      let category = 'Sport'; // default
      const customMotorcycleType = getValue('Custom Motorcycle Type');
      const bodyClassLower = bodyClass.toLowerCase();
      
      if (customMotorcycleType) {
        const typeMap: { [key: string]: string } = {
          'cruiser': 'Cruiser',
          'touring': 'Touring',
          'sport': 'Sport',
          'adventure': 'Adventure',
          'standard': 'Standard',
          'dual sport': 'Dual Sport'
        };
        category = typeMap[customMotorcycleType.toLowerCase()] || 'Sport';
      } else if (bodyClassLower.includes('cruiser')) {
        category = 'Cruiser';
      } else if (bodyClassLower.includes('touring')) {
        category = 'Touring';
      } else if (bodyClassLower.includes('adventure')) {
        category = 'Adventure';
      } else if (bodyClassLower.includes('standard')) {
        category = 'Standard';
      }

      // Create bike name
      const bikeName = `${year} ${make} ${model}`.trim();

      // Auto-fill the form
      setNewBikeForm(prev => ({
        ...prev,
        brand: make,
        model: model,
        year: year,
        category: category,
        mileage: '0 mi', // Default for new bikes
        description: `${year} ${make} ${model} - ${vehicleType || bodyClass || 'Motorcycle'}`
      }));

      console.log('Auto-filled from VIN:', { make, model, year, category, bikeName });

    } catch (error) {
      console.error('VIN Auto-fill Error:', error);
      alert('Failed to auto-fill from VIN. Please check the VIN and try again.');
    } finally {
      setIsAutoFilling(false);
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

  // Calculate active bikes (excluding sold bikes)
  const activeBikes = bikeInventory.filter(bike => bike.status !== 'Sold');
  const activeBikeCount = activeBikes.length;

  const getCompanyBadge = (type: string) => {
    switch (type) {
      case 'dealership':
        return 'Dealership';
      case 'software':
        return 'Software';
      case 'holding':
        return 'Holding';
      default:
        return 'Business';
    }
  };

  const getStatusColor = (status: string) => {
    // Normalize status to handle both lowercase and uppercase variations
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    
    switch (normalizedStatus) {
      case 'Acquisition':
        return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '#f59e0b40' }; // Orange
      case 'Evaluation':
        return { bg: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', border: '#6366f140' }; // Indigo
      case 'Servicing':
        return { bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', border: '#a855f740' }; // Purple
      case 'Media':
        return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '#3b82f640' }; // Blue
      case 'Listed':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '#22c55e40' }; // Green
      case 'Sold':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '#ef444440' }; // Red
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

      <RevaniPortalHeader company={company} activePage="inventory" />

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 className="section-header">Active Bike Inventory</h2>
          <button 
            className="action-card" 
            style={{ 
              padding: '0.75rem 1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              width: 'auto',
              color: 'white',
              background: 'rgba(139, 92, 246, 0.3)',
              border: '1px solid rgba(139, 92, 246, 0.5)'
            }}
            onClick={() => setShowAddBikeModal(true)}
          >
            <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            Add Bike
          </button>
        </div>


        {/* Enhanced Filters and Search */}
        <div style={{ marginBottom: '2rem' }}>
          {/* Main Search Bar */}
          <div className="kpi-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MagnifyingGlassIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
              <input 
                type="text" 
                placeholder="Search by name, brand, model, or VIN..." 
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

            {/* Status Filter */}
            <div className="kpi-card" style={{ padding: '1rem' }}>
              <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                Status
              </label>
              <select 
                value={searchFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'white', 
                  outline: 'none', 
                  width: '100%',
                  fontSize: '0.875rem'
                }}
              >
                <option value="" style={{ background: '#1e293b', color: 'white' }}>All Status</option>
                <option value="Acquisition" style={{ background: '#1e293b', color: 'white' }}>Acquisition</option>
                <option value="Evaluation" style={{ background: '#1e293b', color: 'white' }}>Evaluation</option>
                <option value="Servicing" style={{ background: '#1e293b', color: 'white' }}>Servicing</option>
                <option value="Media" style={{ background: '#1e293b', color: 'white' }}>Media</option>
                <option value="Listed" style={{ background: '#1e293b', color: 'white' }}>Listed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bike Inventory Cards */}
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
                          Showing {filteredBikes.length} of {activeBikeCount} bikes
              {filteredBikes.length !== activeBikeCount && (
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
              {activeBikeCount === 0 
                ? 'No bikes in inventory yet. Add your first bike!' 
                : 'No bikes match your search criteria. Try adjusting the filters.'}
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
                {bike.status.charAt(0).toUpperCase() + bike.status.slice(1).toLowerCase()}
              </div>

              {/* Bike Image */}
              <div style={{
                width: '100%',
                height: '180px',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                overflow: 'hidden',
                border: '1px solid rgba(139, 92, 246, 0.2)'
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
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                    borderRadius: '12px'
              }}>
                <img src="/revani-logo.png" alt="Revani Logo" style={{ width: '160px', height: '160px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
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
                    color: '#8b5cf6', 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    background: 'rgba(139, 92, 246, 0.1)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px'
                  }}>
                    {bike.category}
                  </span>
                  <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                    {bike.year}
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
                      {typeof bike.mileage === 'number' ? `${bike.mileage.toLocaleString()} mi` : 
                       typeof bike.mileage === 'string' && !isNaN(Number(bike.mileage.replace(/[^0-9]/g, ''))) ? 
                       `${Number(bike.mileage.replace(/[^0-9]/g, '')).toLocaleString()} mi` : bike.mileage}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      Price
                    </p>
                    <p style={{
                      color: '#22c55e',
                      fontSize: '1.25rem', 
                      fontWeight: '700',
                      textShadow: '0 0 10px rgba(34, 197, 94, 0.3)'
                    }}>
                      ${(bike.actualSalePrice || bike.price).toLocaleString()}
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
              </div>
            </div>
            ))
          )}
        </div>
      </main>

      {/* Add Bike Modal */}
      {showAddBikeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          paddingTop: '3rem'
        }}>
          <div 
            className="modal-scroll"
            style={{
              background: 'rgba(30, 41, 59, 0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
              width: 'calc(100% - 2rem)',
              maxWidth: '650px',
              maxHeight: '85vh',
              overflow: 'auto',
              padding: '1.5rem',
              marginTop: '2rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                Add New Bike
              </h3>
              <button
                onClick={() => setShowAddBikeModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {/* Brand */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Brand *
                </label>
                <input
                  type="text"
                  value={newBikeForm.brand}
                  onChange={(e) => handleFormChange('brand', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., Yamaha"
                />
              </div>

              {/* Model */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Model *
                </label>
                <input
                  type="text"
                  value={newBikeForm.model}
                  onChange={(e) => handleFormChange('model', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., R1"
                />
              </div>

              {/* Year */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Year *
                </label>
                <input
                  type="number"
                  value={newBikeForm.year}
                  onChange={(e) => handleFormChange('year', parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  min="1900"
                  max="2030"
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Category *
                </label>
                <select
                  value={newBikeForm.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Sport" style={{ background: '#1e293b', color: 'white' }}>Sport</option>
                  <option value="Cruiser" style={{ background: '#1e293b', color: 'white' }}>Cruiser</option>
                  <option value="Adventure" style={{ background: '#1e293b', color: 'white' }}>Adventure</option>
                  <option value="Touring" style={{ background: '#1e293b', color: 'white' }}>Touring</option>
                  <option value="Standard" style={{ background: '#1e293b', color: 'white' }}>Standard</option>
                  <option value="Dual Sport" style={{ background: '#1e293b', color: 'white' }}>Dual Sport</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Acquisition Price *
                </label>
                <input
                  type="number"
                  value={newBikeForm.price}
                  onChange={(e) => handleFormChange('price', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., 18999"
                />
              </div>

              {/* Status */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Status
                </label>
                <select
                  value={newBikeForm.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Acquisition" style={{ background: '#1e293b', color: 'white' }}>Acquisition</option>
                  <option value="Evaluation" style={{ background: '#1e293b', color: 'white' }}>Evaluation</option>
                  <option value="Servicing" style={{ background: '#1e293b', color: 'white' }}>Servicing</option>
                  <option value="Media" style={{ background: '#1e293b', color: 'white' }}>Media</option>
                  <option value="Listed" style={{ background: '#1e293b', color: 'white' }}>Listed</option>
                </select>
              </div>

              {/* VIN */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  VIN *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <input
                    type="text"
                    value={newBikeForm.vin}
                    onChange={(e) => handleFormChange('vin', e.target.value.toUpperCase())}
                    maxLength={17}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      letterSpacing: '1px'
                    }}
                    placeholder="e.g., JYA1WE010MA000001"
                  />
                  <button
                    type="button"
                    onClick={autoFillFromVIN}
                    disabled={isAutoFilling || newBikeForm.vin.length !== 17}
                    style={{
                      padding: '0.5rem 1rem',
                      background: newBikeForm.vin.length === 17 && !isAutoFilling 
                        ? 'rgba(34, 197, 94, 0.8)' 
                        : 'rgba(107, 114, 128, 0.3)',
                      border: `1px solid ${newBikeForm.vin.length === 17 ? '#22c55e' : '#6b7280'}40`,
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      cursor: newBikeForm.vin.length === 17 && !isAutoFilling ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      minWidth: '100px',
                      justifyContent: 'center'
                    }}
                  >
                    {isAutoFilling ? (
                      <>
                        <div style={{ 
                          width: '1rem', 
                          height: '1rem', 
                          border: '2px solid transparent',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Filling...
                      </>
                    ) : (
                      <>
                        Auto-Fill
                      </>
                    )}
                  </button>
                </div>
                <div style={{ marginTop: '0.25rem', fontSize: '0.7rem', color: '#94a3b8' }}>
                  {newBikeForm.vin.length}/17 characters
                  {newBikeForm.vin.length === 17 && (
                    <span style={{ color: '#22c55e', marginLeft: '0.5rem' }}>
                      ✓ Ready for auto-fill
                    </span>
                  )}
                </div>
              </div>

              {/* Mileage */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Mileage
                </label>
                <input
                  type="text"
                  value={newBikeForm.mileage}
                  onChange={(e) => handleFormChange('mileage', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., 0 mi"
                />
              </div>

              {/* Color */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Color
                </label>
                <input
                  type="text"
                  value={newBikeForm.color}
                  onChange={(e) => handleFormChange('color', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., Blue"
                />
              </div>


            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowAddBikeModal(false)}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddBike}
                disabled={!newBikeForm.brand || !newBikeForm.model || !newBikeForm.vin}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: newBikeForm.brand && newBikeForm.model && newBikeForm.vin 
                    ? 'rgba(139, 92, 246, 0.8)' 
                    : 'rgba(107, 114, 128, 0.3)',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.9rem',
                  cursor: newBikeForm.brand && newBikeForm.model && newBikeForm.vin 
                    ? 'pointer' 
                    : 'not-allowed',
                  transition: 'all 0.3s ease'
                }}
              >
                Add Bike
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
