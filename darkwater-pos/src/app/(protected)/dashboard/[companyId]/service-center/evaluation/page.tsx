'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../../dashboard.css';
import RevaniPortalHeader from '../../../../../../components/RevaniPortalHeader';
import {
  TruckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface Bike {
  _id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  status: string;
  vin: string;
  mileage: number;
  description: string;
  images?: Array<{
    data: string;
    contentType: string;
    filename: string;
    size: number;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  'Service Required'?: string[];
  'Parts Requested'?: string[];
  evaluationDate?: string;
  evaluatedBy?: string;
}

export default function EvaluationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState({
    searchText: '',
    make: '',
    year: ''
  });
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [showBikeModal, setShowBikeModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [serviceItems, setServiceItems] = useState<string[]>(['']);
  const [partsItems, setPartsItems] = useState<string[]>(['']);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session) {
      fetchCompanyData();
    }
  }, [session]);

  const fetchCompanyData = async () => {
    try {
      const companyResponse = await fetch(`/api/companies/${params.companyId}`);
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        setCompany(companyData.company);
        
        // Fetch bikes for this company
        const bikesResponse = await fetch(`/api/companies/${params.companyId}/inventory/bikes`);
        if (bikesResponse.ok) {
          const bikesData = await bikesResponse.json();
          // Handle both array and object with bikes property
          const bikesArray = Array.isArray(bikesData) ? bikesData : bikesData.bikes || [];
          
          // Set bikes without individual evaluation fetches for faster loading
          setBikes(bikesArray);
        }
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="dashboard-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={{ color: 'white', fontSize: '1.5rem' }}>Company not found</div>
        </div>
      </div>
    );
  }

  // Filter bikes to only show those with 'Evaluation' status
  const filteredBikes = Array.isArray(bikes) ? bikes.filter(bike => bike.status === 'Evaluation') : [];

  // Helper functions for evaluation checklist
  const addServiceItem = () => {
    setServiceItems(prev => [...prev, '']);
  };

  const updateServiceItem = (index: number, value: string) => {
    setServiceItems(prev => prev.map((item, i) => i === index ? value : item));
  };

  const removeServiceItem = (index: number) => {
    setServiceItems(prev => prev.filter((_, i) => i !== index));
  };

  const addPartsItem = () => {
    setPartsItems(prev => [...prev, '']);
  };

  const updatePartsItem = (index: number, value: string) => {
    setPartsItems(prev => prev.map((item, i) => i === index ? value : item));
  };

  const removePartsItem = (index: number) => {
    setPartsItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleEvaluateClick = async () => {
    if (!selectedBike) return;
    
    setShowBikeModal(false);
    setShowEvaluationModal(true);
    
    try {
      // Load existing evaluation data for this bike
      const response = await fetch(`/api/companies/${params.companyId}/inventory/bikes/${selectedBike._id}/evaluation`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.evaluation) {
          // Load existing service items
          if (result.evaluation.serviceRequired && result.evaluation.serviceRequired.length > 0) {
            setServiceItems(result.evaluation.serviceRequired);
          } else {
            setServiceItems(['']);
          }
          
          // Load existing parts items
          if (result.evaluation.partsRequested && result.evaluation.partsRequested.length > 0) {
            setPartsItems(result.evaluation.partsRequested);
          } else {
            setPartsItems(['']);
          }
        } else {
          // No existing data, start with empty items
          setServiceItems(['']);
          setPartsItems(['']);
        }
      } else {
        // Error loading data, start with empty items
        setServiceItems(['']);
        setPartsItems(['']);
      }
    } catch (error) {
      console.error('Error loading existing evaluation data:', error);
      // Start with empty items on error
      setServiceItems(['']);
      setPartsItems(['']);
    }
  };

  const saveEvaluation = async (changeStatus: boolean = false) => {
    if (!selectedBike) return;
    
    setIsSaving(true);
    try {
      // Filter out empty items
      const filteredServiceItems = serviceItems.filter(item => item.trim() !== '');
      const filteredPartsItems = partsItems.filter(item => item.trim() !== '');
      
      // Prepare evaluation data
      const evaluationData = {
        serviceRequired: filteredServiceItems,
        partsRequested: filteredPartsItems,
        evaluatedAt: new Date().toISOString(),
        evaluatedBy: session?.user?.name || 'Unknown'
      };

      // Save evaluation data to the bike
      const response = await fetch(`/api/companies/${params.companyId}/inventory/bikes/${selectedBike._id}/evaluation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationData),
      });

      if (!response.ok) {
        throw new Error('Failed to save evaluation');
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('Evaluation saved successfully');
        
        // If finishing evaluation, also change status to Servicing
        if (changeStatus) {
          const statusResponse = await fetch(`/api/companies/${params.companyId}/inventory/bikes/${selectedBike._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'Servicing'
            }),
          });

          if (statusResponse.ok) {
            console.log('Bike status changed to Servicing');
            // Update local state to reflect the change
            setBikes(prev => prev.map(bike => 
              bike._id === selectedBike._id 
                ? { ...bike, status: 'Servicing' }
                : bike
            ));
          }
        }
        
        setShowEvaluationModal(false);
        // Show success message or redirect
        if (changeStatus) {
          router.push(`/dashboard/${params.companyId}/inventory/bikes/${selectedBike._id}`);
        }
      } else {
        throw new Error(result.error || 'Failed to save evaluation');
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('Failed to save evaluation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dashboard-container">
      <RevaniPortalHeader company={company} activePage="service-center" />

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 className="section-header">🔍 Evaluation Bikes</h2>
        </div>

        {/* Stats Cards */}
        <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
          <div className="kpi-card">
            <TruckIcon className="kpi-icon" />
            <div className="kpi-value">{filteredBikes.length}</div>
            <div className="kpi-title">Evaluation Bikes</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: '#fbbf24' }}>⏱</div>
            <div className="kpi-value">{filteredBikes.filter(bike => bike.status === 'Evaluation').length}</div>
            <div className="kpi-title">In Evaluation</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: '#8b5cf6' }}>📊</div>
            <div className="kpi-value">{filteredBikes.length > 0 ? Math.round(filteredBikes.reduce((sum, bike) => sum + (bike.price || 0), 0) / filteredBikes.length) : 0}</div>
            <div className="kpi-title">Avg. Price</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: '#22c55e' }}>💰</div>
            <div className="kpi-value">${filteredBikes.reduce((sum, bike) => sum + (bike.price || 0), 0).toLocaleString()}</div>
            <div className="kpi-title">Total Value</div>
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
                placeholder="Search by name, brand, model, or VIN..." 
                value={searchFilters.searchText}
                onChange={(e) => setSearchFilters({...searchFilters, searchText: e.target.value})}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'white', 
                  outline: 'none', 
                  flex: 1,
                  fontSize: '0.875rem'
                }} 
              />
              {(searchFilters.searchText || searchFilters.make || searchFilters.year) && (
                <button 
                  onClick={() => setSearchFilters({...searchFilters, searchText: '', make: '', year: ''})}
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
                onChange={(e) => setSearchFilters({...searchFilters, make: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">All Makes</option>
                {Array.from(new Set(filteredBikes.map(bike => bike.brand || '').filter(Boolean))).map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="kpi-card" style={{ padding: '1rem' }}>
              <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                Year
              </label>
              <select
                value={searchFilters.year}
                onChange={(e) => setSearchFilters({...searchFilters, year: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">All Years</option>
                {Array.from(new Set(filteredBikes.map(bike => bike.year || 0).filter(year => year > 0))).sort((a, b) => b - a).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

                {/* Bikes Grid */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredBikes
            .filter(bike => {
              const matchesSearch = bike.name.toLowerCase().includes(searchFilters.searchText.toLowerCase()) ||
                                   bike.brand.toLowerCase().includes(searchFilters.searchText.toLowerCase()) ||
                                   bike.model.toLowerCase().includes(searchFilters.searchText.toLowerCase()) ||
                                   bike.vin.toLowerCase().includes(searchFilters.searchText.toLowerCase());
              const matchesMake = !searchFilters.make || bike.brand === searchFilters.make;
              const matchesYear = !searchFilters.year || bike.year.toString() === searchFilters.year;
              return matchesSearch && matchesMake && matchesYear;
            })
            .map(bike => (
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
                   setSelectedBike(bike);
                   setShowBikeModal(true);
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
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  {bike.status || 'Evaluation'}
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
                      alt={bike.name || 'Bike'}
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
                      <div style={{ fontSize: '3rem' }}>🏍️</div>
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
                    {bike.name || 'Unnamed Bike'}
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
                      {bike.brand || 'Unknown'}
                    </span>
                    <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                      {bike.year || 'Unknown'}
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
                        {(bike.mileage || 0).toLocaleString()} mi
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
                        ${(bike.price || 0).toLocaleString()}
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
                      {bike.vin || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {filteredBikes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <TruckIcon style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ marginBottom: '0.5rem' }}>No Evaluation Bikes Found</h3>
            <p>There are currently no bikes in evaluation status.</p>
          </div>
        )}
      </main>

      {/* Bike Action Modal */}
      {showBikeModal && selectedBike && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h3 style={{ 
                color: 'white', 
                fontSize: '1.5rem', 
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                {selectedBike.name || 'Bike Evaluation'}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                Choose an action for this bike
              </p>
            </div>

            {/* Bike Info */}
            <div style={{
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '2rem',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: '#8b5cf6', fontWeight: '600' }}>Brand:</span>
                  <div style={{ color: 'white' }}>{selectedBike.brand || 'Unknown'}</div>
                </div>
                <div>
                  <span style={{ color: '#8b5cf6', fontWeight: '600' }}>Model:</span>
                  <div style={{ color: 'white' }}>{selectedBike.model || 'Unknown'}</div>
                </div>
                <div>
                  <span style={{ color: '#8b5cf6', fontWeight: '600' }}>Year:</span>
                  <div style={{ color: 'white' }}>{selectedBike.year || 'Unknown'}</div>
                </div>
                <div>
                  <span style={{ color: '#8b5cf6', fontWeight: '600' }}>VIN:</span>
                  <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {selectedBike.vin || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowBikeModal(false);
                  router.push(`/dashboard/${params.companyId}/inventory/bikes/${selectedBike._id}`);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(59, 130, 246, 0.3)',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <EyeIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                View Bike Details
              </button>

              <button
                onClick={handleEvaluateClick}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(245, 158, 11, 0.3)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <PencilIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                Evaluate
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowBikeModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '50%',
                width: '2rem',
                height: '2rem',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Evaluation Checklist Modal */}
      {showEvaluationModal && selectedBike && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h3 style={{ 
                color: 'white', 
                fontSize: '1.5rem', 
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Evaluation Checklist
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                {selectedBike.name || 'Bike Evaluation'}
              </p>
            </div>

            {/* Bike Info */}
            <div style={{
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: '#8b5cf6', fontWeight: '600' }}>Brand:</span>
                  <div style={{ color: 'white' }}>{selectedBike.brand || 'Unknown'}</div>
                </div>
                <div>
                  <span style={{ color: '#8b5cf6', fontWeight: '600' }}>Model:</span>
                  <div style={{ color: 'white' }}>{selectedBike.model || 'Unknown'}</div>
                </div>
                <div>
                  <span style={{ color: '#8b5cf6', fontWeight: '600' }}>Year:</span>
                  <div style={{ color: 'white' }}>{selectedBike.year || 'Unknown'}</div>
                </div>
                <div>
                  <span style={{ color: '#8b5cf6', fontWeight: '600' }}>VIN:</span>
                  <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {selectedBike.vin || 'N/A'}
                  </div>
                </div>
              </div>
              {/* Show evaluation status if exists */}
              {selectedBike.evaluationDate && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  background: 'rgba(34, 197, 94, 0.1)', 
                  borderRadius: '8px', 
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  textAlign: 'center'
                }}>
                  <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: '500' }}>
                    Last evaluated: {new Date(selectedBike.evaluationDate).toLocaleDateString()}
                    {selectedBike.evaluatedBy && ` by ${selectedBike.evaluatedBy}`}
                  </span>
                </div>
              )}
            </div>

            {/* Service Required Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ 
                color: 'white', 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🔧 Service Required
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {serviceItems.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        accentColor: '#8b5cf6'
                      }}
                    />
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateServiceItem(index, e.target.value)}
                      placeholder="Enter service item..."
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}
                    />
                    {serviceItems.length > 1 && (
                      <button
                        onClick={() => removeServiceItem(index)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '4px',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addServiceItem}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '6px',
                    color: '#22c55e',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    alignSelf: 'flex-start'
                  }}
                >
                  + Add Service Item
                </button>
              </div>
            </div>

            {/* Parts Requested Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ 
                color: 'white', 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🛠️ Parts Requested
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {partsItems.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        accentColor: '#8b5cf6'
                      }}
                    />
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updatePartsItem(index, e.target.value)}
                      placeholder="Enter parts item..."
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}
                    />
                    {partsItems.length > 1 && (
                      <button
                        onClick={() => removePartsItem(index)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '4px',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addPartsItem}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '6px',
                    color: '#22c55e',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    alignSelf: 'flex-start'
                  }}
                >
                  + Add Parts Item
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowEvaluationModal(false)}
                disabled={isSaving}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: isSaving ? '#64748b' : '#94a3b8',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => saveEvaluation(false)}
                disabled={isSaving}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: isSaving ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.3)',
                  border: '1px solid rgba(34, 197, 94, 0.5)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {isSaving ? 'Saving...' : 'Save Evaluation'}
              </button>
              <button
                onClick={() => saveEvaluation(true)}
                disabled={isSaving}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: isSaving ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.3)',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {isSaving ? 'Finishing...' : 'Finish Evaluation'}
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowEvaluationModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '50%',
                width: '2rem',
                height: '2rem',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
