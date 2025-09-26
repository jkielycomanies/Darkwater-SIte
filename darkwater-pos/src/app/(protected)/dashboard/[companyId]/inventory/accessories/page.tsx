'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../../dashboard.css';
import RevaniPortalHeader from '../../../../../../components/RevaniPortalHeader';
import { 
  ShoppingBagIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface AccessoryFormData {
  name: string;
  category: string;
  price: string;
  brand: string;
  priceAcquired: string;
  stock: string;
  description: string;
  status: 'Available' | 'Low Stock' | 'Out of Stock';
}

interface Accessory {
  _id: string;
  name: string;
  category: string;
  price: number;
  brand: string;
  priceAcquired?: number;
  stock: number;
  sku?: string;
  description?: string;
  compatibleModels?: string[];
  supplier?: string;
  minimumStock?: number;
  weight?: string;
  dimensions?: string;
  status: 'Available' | 'Low Stock' | 'Out of Stock';
}

export default function AccessoriesInventoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [accessoriesInventory, setAccessoriesInventory] = useState<Accessory[]>([]);
  const [filteredAccessories, setFilteredAccessories] = useState<Accessory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<AccessoryFormData>({
    name: '',
    category: '',
    price: '',
    brand: '',
    priceAcquired: '',
    stock: '',
    description: '',
    status: 'Available'
  });


  const [stats, setStats] = useState({ total: 0, types: 0, lowStock: 0, outOfStock: 0 });
  
  // Modal state
  const [formData, setFormData] = useState<AccessoryFormData>({
    name: '',
    category: '',
    price: '',
    brand: '',
    priceAcquired: '',
    stock: '',
    description: '',
    status: 'Available'
  });

  // Fetch company and accessories data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch company data
        const companyResponse = await fetch(`/api/companies/${params.companyId}`);
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          setCompany(companyData.company);
        }

        // Fetch accessories inventory
        const accessoriesResponse = await fetch(`/api/companies/${params.companyId}/inventory/accessories`);
        if (accessoriesResponse.ok) {
          const accessoriesData = await accessoriesResponse.json();
          setAccessoriesInventory(accessoriesData.accessories || []);
          setFilteredAccessories(accessoriesData.accessories || []);
          setStats(accessoriesData.stats || { total: 0, types: 0, lowStock: 0, outOfStock: 0 });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (params.companyId) {
      fetchData();
    }
  }, [params.companyId]);

  // Filter accessories based on search and filters
  useEffect(() => {
    let filtered = accessoriesInventory;

    if (searchTerm) {
      filtered = filtered.filter(accessory =>
        accessory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        accessory.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        accessory.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(accessory => accessory.category === selectedCategory);
    }

    if (selectedStatus) {
      filtered = filtered.filter(accessory => accessory.status === selectedStatus);
    }

    setFilteredAccessories(filtered);
  }, [accessoriesInventory, searchTerm, selectedCategory, selectedStatus]);

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

  const handleInputChange = (field: keyof AccessoryFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.category || !formData.price || !formData.brand || !formData.priceAcquired || !formData.stock) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Make API call to save the accessory
      const response = await fetch(`/api/companies/${params.companyId}/inventory/accessories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add the new accessory to the local state
        setAccessoriesInventory(prev => [...prev, result.accessory]);
        
        // Close modal and reset form
        setShowAddModal(false);
        setFormData({
          name: '',
          category: '',
          price: '',
          brand: '',
          priceAcquired: '',
          stock: '',
          description: '',
          status: 'Available'
        });
        
        alert('Accessory added successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error adding accessory: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding accessory:', error);
      alert('Error adding accessory. Please try again.');
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setFormData({
      name: '',
      category: '',
      price: '',
      brand: '',
      priceAcquired: '',
      stock: '',
      description: '',
      status: 'Available'
    });
  };

  const openDetailModal = (accessory: Accessory) => {
    setSelectedAccessory(accessory);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedAccessory(null);
  };

  const startEditing = () => {
    if (selectedAccessory) {
      setEditFormData({
        name: selectedAccessory.name,
        category: selectedAccessory.category,
        price: selectedAccessory.price?.toString() || '',
        brand: selectedAccessory.brand,
        priceAcquired: selectedAccessory.priceAcquired?.toString() || '',
        stock: selectedAccessory.stock?.toString() || '',
        description: selectedAccessory.description || '',
        status: selectedAccessory.status
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditFormData({
      name: '',
      category: '',
      price: '',
      brand: '',
      priceAcquired: '',
      stock: '',
      description: '',
      status: 'Available'
    });
  };

  const handleEditInputChange = (field: keyof AccessoryFormData, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveChanges = async () => {
    if (!selectedAccessory) return;

    try {
      // Make API call to update the accessory
      const response = await fetch(`/api/companies/${params.companyId}/inventory/accessories/${selectedAccessory._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the local state
        setAccessoriesInventory(prev => 
          prev.map(acc => 
            acc._id === selectedAccessory._id 
              ? { ...acc, ...result.accessory }
              : acc
          )
        );
        
        // Update the selected accessory
        setSelectedAccessory({ ...selectedAccessory, ...result.accessory });
        
        // Exit edit mode
        setIsEditing(false);
        
        alert('Accessory updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error updating accessory: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating accessory:', error);
      alert('Error updating accessory. Please try again.');
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
          <h2 className="section-header">🎒 Accessories Inventory</h2>
          <button 
            className="action-card" 
            style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}
            onClick={() => setShowAddModal(true)}
          >
            <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            Add Accessory
          </button>
        </div>

        {/* Stats Cards */}
        <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
          <div className="kpi-card">
            <ShoppingBagIcon className="kpi-icon" />
            <div className="kpi-value">{stats.total}</div>
            <div className="kpi-title">Total Accessories</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: '#22c55e' }}>✓</div>
            <div className="kpi-value">{stats.types}</div>
            <div className="kpi-title">Types of Accessories</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: '#fbbf24' }}>⚠</div>
            <div className="kpi-value">{stats.lowStock}</div>
            <div className="kpi-title">Low Stock</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: '#ef4444' }}>✗</div>
            <div className="kpi-value">{stats.outOfStock}</div>
            <div className="kpi-title">Out of Stock</div>
          </div>
        </div>

        {/* Accessories Inventory Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.5rem',
          maxWidth: '100%'
        }}>
          {filteredAccessories.map((accessory) => (
            <div 
              key={accessory._id} 
              className="kpi-card" 
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => openDetailModal(accessory)}
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
                background: accessory.status === 'Available' ? 'rgba(34, 197, 94, 0.2)' : 
                           accessory.status === 'Out of Stock' ? 'rgba(239, 68, 68, 0.2)' : 
                           'rgba(251, 191, 36, 0.2)',
                color: accessory.status === 'Available' ? '#22c55e' : 
                       accessory.status === 'Out of Stock' ? '#ef4444' : 
                       '#fbbf24',
                border: `1px solid ${accessory.status === 'Available' ? '#22c55e' : 
                                     accessory.status === 'Out of Stock' ? '#ef4444' : 
                                     '#fbbf24'}40`
              }}>
                {accessory.status}
              </div>

              {/* Accessory Image Placeholder */}
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
                <div style={{ fontSize: '3rem' }}>🎒</div>
              </div>

              {/* Accessory Details */}
              <div style={{ textAlign: 'left', padding: '0 1rem' }}>
                <h3 style={{ 
                  color: 'white', 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  marginBottom: '0.75rem',
                  lineHeight: '1.3',
                  marginLeft: '0'
                }}>
                  {accessory.name}
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
                    {accessory.category}
                  </span>
                  <span style={{ color: '#cbd5e1', fontSize: '0.875rem', alignSelf: 'flex-start' }}>
                    Brand: {accessory.brand}
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
                      Stock
                    </p>
                    <p style={{ 
                      color: accessory.stock > 5 ? '#22c55e' : accessory.stock > 0 ? '#fbbf24' : '#ef4444', 
                      fontSize: '0.875rem', 
                      fontWeight: '500'
                    }}>
                      {accessory.stock} units
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
                      {accessory.price}
                    </p>
                  </div>
                </div>

                <div style={{ 
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: '0.75rem'
                }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Price Acquired
                  </p>
                  <p style={{ 
                    color: '#cbd5e1', 
                    fontSize: '0.75rem', 
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em'
                  }}>
                    {accessory.priceAcquired}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Accessory Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            paddingTop: '1rem'
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
                maxWidth: '600px',
                maxHeight: '85vh',
                overflow: 'auto',
                padding: '1.5rem',
                marginTop: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                  🎯 Add New Accessory
                </h3>
                <button
                  onClick={closeModal}
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
                {/* Name */}
                <div>
                  <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                    Accessory Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '0.9rem'
                    }}
                    placeholder="e.g., Premium Motorcycle Helmet"
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
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
                    <option value="" style={{ background: '#1e293b', color: 'white' }}>Select Category</option>
                    <option value="Safety" style={{ background: '#1e293b', color: 'white' }}>Safety</option>
                    <option value="Storage" style={{ background: '#1e293b', color: 'white' }}>Storage</option>
                    <option value="Lighting" style={{ background: '#1e293b', color: 'white' }}>Lighting</option>
                    <option value="Electronics" style={{ background: '#1e293b', color: 'white' }}>Electronics</option>
                    <option value="Protection" style={{ background: '#1e293b', color: 'white' }}>Protection</option>
                    <option value="Comfort" style={{ background: '#1e293b', color: 'white' }}>Comfort</option>
                    <option value="Performance" style={{ background: '#1e293b', color: 'white' }}>Performance</option>
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                    Brand *
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '0.9rem'
                    }}
                    placeholder="e.g., Shoei, Alpinestars"
                  />
                </div>

                {/* Price */}
                <div>
                  <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                    Price *
                  </label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '0.9rem'
                    }}
                    placeholder="e.g., $299.99"
                  />
                </div>

                {/* Price Acquired */}
                <div>
                  <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                    Price Acquired *
                  </label>
                  <input
                    type="text"
                    value={formData.priceAcquired || ''}
                    onChange={(e) => handleInputChange('priceAcquired', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '0.9rem'
                    }}
                    placeholder="e.g., $199.99"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '0.9rem'
                    }}
                    placeholder="e.g., 15"
                    min="0"
                  />
                </div>

                {/* Status */}
                <div>
                  <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as 'Available' | 'Low Stock' | 'Out of Stock')}
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
                    <option value="Available" style={{ background: '#1e293b', color: 'white' }}>Available</option>
                    <option value="Low Stock" style={{ background: '#1e293b', color: 'white' }}>Low Stock</option>
                    <option value="Out of Stock" style={{ background: '#1e293b', color: 'white' }}>Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginTop: '1rem' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Describe the accessory, features, specifications..."
                />
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#94a3b8',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '6px',
                    color: '#22c55e',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Add Accessory
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Accessory Detail Modal */}
      {showDetailModal && selectedAccessory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          paddingTop: '3rem'
        }}>
          <div 
            className="modal-scroll"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
              width: 'calc(100% - 2rem)',
              maxWidth: '700px',
              maxHeight: '85vh',
              overflow: 'auto',
              padding: '1.5rem',
              marginTop: '1rem'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                🎒 {selectedAccessory.name}
              </h3>
              <button
                onClick={closeDetailModal}
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

            {/* Accessory Image Placeholder */}
            <div style={{
              width: '100%',
              height: '200px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <div style={{ fontSize: '4rem' }}>🎒</div>
            </div>

            {/* Accessory Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', display: 'block' }}>
                  Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => handleEditInputChange('name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '1rem'
                    }}
                  />
                ) : (
                  <p style={{ color: 'white', fontSize: '1rem', margin: 0 }}>
                    {selectedAccessory.name}
                  </p>
                )}
              </div>

              <div>
                <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', display: 'block' }}>
                  Category
                </label>
                {isEditing ? (
                  <select
                    value={editFormData.category}
                    onChange={(e) => handleEditInputChange('category', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="Safety" style={{ background: '#1e293b', color: 'white' }}>Safety</option>
                    <option value="Storage" style={{ background: '#1e293b', color: 'white' }}>Storage</option>
                    <option value="Lighting" style={{ background: '#1e293b', color: 'white' }}>Lighting</option>
                    <option value="Electronics" style={{ background: '#1e293b', color: 'white' }}>Electronics</option>
                    <option value="Protection" style={{ background: '#1e293b', color: 'white' }}>Protection</option>
                    <option value="Comfort" style={{ background: '#1e293b', color: 'white' }}>Comfort</option>
                    <option value="Performance" style={{ background: '#1e293b', color: 'white' }}>Performance</option>
                  </select>
                ) : (
                  <p style={{ color: 'white', fontSize: '1rem', margin: 0 }}>
                    {selectedAccessory.category}
                  </p>
                )}
              </div>

              <div>
                <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', display: 'block' }}>
                  Brand
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.brand}
                    onChange={(e) => handleEditInputChange('brand', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '1rem'
                    }}
                  />
                ) : (
                  <p style={{ color: 'white', fontSize: '1rem', margin: 0 }}>
                    {selectedAccessory.brand}
                  </p>
                )}
              </div>

              <div>
                <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', display: 'block' }}>
                  Status
                </label>
                {isEditing ? (
                  <select
                    value={editFormData.status}
                    onChange={(e) => handleEditInputChange('status', e.target.value as 'Available' | 'Low Stock' | 'Out of Stock')}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="Available" style={{ background: '#1e293b', color: 'white' }}>Available</option>
                    <option value="Low Stock" style={{ background: '#1e293b', color: 'white' }}>Low Stock</option>
                    <option value="Out of Stock" style={{ background: '#1e293b', color: 'white' }}>Out of Stock</option>
                  </select>
                ) : (
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    background: selectedAccessory.status === 'Available' ? 'rgba(34, 197, 94, 0.2)' : 
                               selectedAccessory.status === 'Out of Stock' ? 'rgba(239, 68, 68, 0.2)' : 
                               'rgba(251, 191, 36, 0.2)',
                    color: selectedAccessory.status === 'Available' ? '#22c55e' : 
                           selectedAccessory.status === 'Out of Stock' ? '#ef4444' : 
                           '#fbbf24',
                    border: `1px solid ${selectedAccessory.status === 'Available' ? '#22c55e' : 
                                         selectedAccessory.status === 'Out of Stock' ? '#ef4444' : 
                                         '#fbbf24'}40`
                  }}>
                    {selectedAccessory.status}
                  </span>
                )}
              </div>

              <div>
                <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', display: 'block' }}>
                  Price
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.price}
                    onChange={(e) => handleEditInputChange('price', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '1rem'
                    }}
                    placeholder="e.g., 299.99"
                  />
                ) : (
                  <p style={{ color: 'white', fontSize: '1rem', margin: 0 }}>
                    ${selectedAccessory.price?.toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', display: 'block' }}>
                  Price Acquired
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.priceAcquired}
                    onChange={(e) => handleEditInputChange('priceAcquired', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '1rem'
                    }}
                    placeholder="e.g., 199.99"
                  />
                ) : (
                  <p style={{ color: 'white', fontSize: '1rem', margin: 0 }}>
                    ${selectedAccessory.priceAcquired?.toLocaleString() || 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', display: 'block' }}>
                  Stock Quantity
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editFormData.stock}
                    onChange={(e) => handleEditInputChange('stock', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '1rem'
                    }}
                    min="0"
                  />
                ) : (
                  <p style={{ color: 'white', fontSize: '1rem', margin: 0 }}>
                    {selectedAccessory.stock}
                  </p>
                )}
              </div>

              <div>
                <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', display: 'block' }}>
                  SKU
                </label>
                <p style={{ color: 'white', fontSize: '1rem', margin: 0, fontFamily: 'monospace' }}>
                  {selectedAccessory.sku || 'N/A'}
                </p>
              </div>
            </div>

            {/* Description */}
            {selectedAccessory.description && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => handleEditInputChange('description', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '0.9rem',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    placeholder="Describe the accessory, features, specifications..."
                  />
                ) : (
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
                    {selectedAccessory.description}
                  </p>
                )}
              </div>
            )}

            {/* Additional Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {selectedAccessory.supplier && (
                <div>
                  <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', display: 'block' }}>
                    Supplier
                  </label>
                  <p style={{ color: 'white', fontSize: '1rem', margin: 0 }}>
                    {selectedAccessory.supplier}
                  </p>
                </div>
              )}

              {selectedAccessory.minimumStock && (
                <div>
                  <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', display: 'block' }}>
                    Minimum Stock
                  </label>
                  <p style={{ color: 'white', fontSize: '1rem', margin: 0 }}>
                    {selectedAccessory.minimumStock}
                  </p>
                </div>
              )}

              {selectedAccessory.weight && (
                <div>
                  <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', display: 'block' }}>
                    Weight
                  </label>
                  <p style={{ color: 'white', fontSize: '1rem', margin: 0 }}>
                    {selectedAccessory.weight}
                  </p>
                </div>
              )}

              {selectedAccessory.dimensions && (
                <div>
                  <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', display: 'block' }}>
                    Dimensions
                  </label>
                  <p style={{ color: 'white', fontSize: '1rem', margin: 0 }}>
                    {selectedAccessory.dimensions}
                  </p>
                </div>
              )}
            </div>

            {/* Compatible Models */}
            {selectedAccessory.compatibleModels && selectedAccessory.compatibleModels.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  Compatible Models
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedAccessory.compatibleModels.map((model, index) => (
                    <span key={index} style={{
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      color: '#c4b5fd'
                    }}>
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              {!isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={startEditing}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '6px',
                      color: '#8b5cf6',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={closeDetailModal}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: '#94a3b8',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={saveChanges}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '6px',
                      color: '#22c55e',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: '#94a3b8',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
