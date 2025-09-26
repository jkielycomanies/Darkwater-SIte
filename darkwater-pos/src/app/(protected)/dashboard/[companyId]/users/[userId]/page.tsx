'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../../dashboard.css';
import RevaniPortalHeader from '../../../../../../components/RevaniPortalHeader';
import {
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  KeyIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
  BriefcaseIcon,
  StarIcon,
  HeartIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Mechanic' | 'Sales' | 'Viewer';
  companyAccess: string[];
  permissions: {
    dashboard: boolean;
    bikeInventory: boolean;
    partsInventory: boolean;
    accessoriesInventory: boolean;
    evaluation: boolean;
    serviceManager: boolean;
    financialDashboard: boolean;
    transactions: boolean;
    reports: boolean;
    userManagement: boolean;
    profile: boolean;
    tools: boolean;
    archives: boolean;
    media: boolean;
    sales: boolean;
  };
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  mechanicData?: {
    jobsCompleted: number;
    specialties: string[];
    favoriteBrands: string[];
  };
}

export default function UserDetailsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newFavoriteBrand, setNewFavoriteBrand] = useState('');

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (params?.companyId && params?.userId) {
      fetchCompanyData(params.companyId as string);
      fetchUserData(params.userId as string);
    }
  }, [session, router, params]);

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
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 404) {
        router.push(`/dashboard/${params.companyId}/users`);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      router.push(`/dashboard/${params.companyId}/users`);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return '#dc2626';
      case 'Manager': return '#7c3aed';
      case 'Mechanic': return '#059669';
      case 'Sales': return '#ea580c';
      case 'Viewer': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#10b981';
      case 'Inactive': return '#6b7280';
      case 'Suspended': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleEditClick = () => {
    if (user) {
      setEditedUser({ ...user });
      setIsEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setEditedUser({});
    setIsEditMode(false);
    setSaveMessage(null);
  };

  const handleFieldChange = (field: keyof User, value: any) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionChange = (permission: string, value: boolean) => {
    setEditedUser(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && isEditMode) {
      const currentData = getMechanicData();
      const updatedSpecialties = [...currentData.specialties, newSpecialty.trim()];
      setEditedUser(prev => ({
        ...prev,
        mechanicData: {
          ...currentData,
          specialties: updatedSpecialties
        }
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (index: number) => {
    if (isEditMode) {
      const currentData = getMechanicData();
      const updatedSpecialties = currentData.specialties.filter((_, i) => i !== index);
      setEditedUser(prev => ({
        ...prev,
        mechanicData: {
          ...currentData,
          specialties: updatedSpecialties
        }
      }));
    }
  };

  const addFavoriteBrand = () => {
    if (newFavoriteBrand.trim() && isEditMode) {
      const currentData = getMechanicData();
      const updatedBrands = [...currentData.favoriteBrands, newFavoriteBrand.trim()];
      setEditedUser(prev => ({
        ...prev,
        mechanicData: {
          ...currentData,
          favoriteBrands: updatedBrands
        }
      }));
      setNewFavoriteBrand('');
    }
  };

  const removeFavoriteBrand = (index: number) => {
    if (isEditMode) {
      const currentData = getMechanicData();
      const updatedBrands = currentData.favoriteBrands.filter((_, i) => i !== index);
      setEditedUser(prev => ({
        ...prev,
        mechanicData: {
          ...currentData,
          favoriteBrands: updatedBrands
        }
      }));
    }
  };

  const handleSaveUser = async () => {
    if (!editedUser || !user) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedUser),
      });

      if (response.ok) {
        // Check if response has content before parsing JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const updatedUser = await response.json();
          setUser(updatedUser.user);
        } else {
          // If no JSON response, just update the local state
          setUser({ ...user, ...editedUser });
        }
        setIsEditMode(false);
        setEditedUser({});
        setSaveMessage({ type: 'success', text: 'User updated successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        // Handle error response
        let errorMessage = 'Failed to update user';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        setSaveMessage({ type: 'error', text: errorMessage });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setSaveMessage({ type: 'error', text: 'Failed to update user. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'dashboard': return 'Dashboard';
      case 'bikeInventory': return 'Bikes';
      case 'partsInventory': return 'Parts';
      case 'accessoriesInventory': return 'Accessories';
      case 'evaluation': return 'Evaluation';
      case 'serviceManager': return 'Service';
      case 'financialDashboard': return 'Financial';
      case 'transactions': return 'Transactions';
      case 'reports': return 'Reports';
      case 'userManagement': return 'Users';
      case 'profile': return 'Profile';
      case 'tools': return 'Tools';
      case 'archives': return 'Archives';
      case 'media': return 'Media';
      case 'sales': return 'Sales';
      default: return 'Check';
    }
  };

  // Helper functions for mechanic data
  const getMechanicData = () => {
    if (!user) return { jobsCompleted: 0, specialties: [], favoriteBrands: [] };
    
    return user.mechanicData || {
      jobsCompleted: 0,
      specialties: [],
      favoriteBrands: []
    };
  };

  const calculateTimeWorked = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
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

  if (!company || !user) {
    return (
      <div className="dashboard-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={{ color: 'white', fontSize: '1.5rem' }}>User not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <RevaniPortalHeader company={company} activePage="users" />
      
      <main className="dashboard-main">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/dashboard/${company.slug}/users`)}
            style={{
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              color: '#8b5cf6',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
          <h1 style={{ 
            color: 'white', 
            fontSize: '2.5rem', 
            fontWeight: '700',
            margin: 0,
            background: 'transparent',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            User Details
          </h1>
        </div>

        {/* User Information Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* Basic Information */}
          <div className="kpi-card" style={{ padding: '2rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <UserIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              Basic Information
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Full Name
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedUser.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      color: 'white',
                      fontSize: '1.125rem',
                      fontWeight: '500',
                      width: '100%'
                    }}
                  />
                ) : (
                  <div style={{ color: 'white', fontSize: '1.125rem', fontWeight: '500' }}>
                    {user.name}
                  </div>
                )}
              </div>
              
              <div>
                <label style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block', textAlign: 'center' }}>
                  Email Address
                </label>
                {isEditMode ? (
                  <input
                    type="email"
                    value={editedUser.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      color: 'white',
                      fontSize: '1.125rem',
                      width: '100%',
                      textAlign: 'center'
                    }}
                  />
                ) : (
                  <div style={{ color: 'white', fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <EnvelopeIcon style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                    {user.email}
                  </div>
                )}
              </div>
              
              <div>
                <label style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Role
                </label>
                {isEditMode ? (
                  <select
                    value={editedUser.role || ''}
                    onChange={(e) => handleFieldChange('role', e.target.value)}
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600',
                      width: '100%'
                    }}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Mechanic">Mechanic</option>
                    <option value="Sales">Sales</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                ) : (
                  <span style={{
                    background: `${getRoleColor(user.role)}20`,
                    color: getRoleColor(user.role),
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <ShieldCheckIcon style={{ width: '1rem', height: '1rem' }} />
                    {user.role}
                  </span>
                )}
              </div>
              
              <div>
                <label style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Status
                </label>
                {isEditMode ? (
                  <select
                    value={editedUser.status || ''}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600',
                      width: '100%'
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                ) : (
                  <span style={{
                    background: `${getStatusColor(user.status)}20`,
                    color: getStatusColor(user.status),
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {user.status === 'Active' ? (
                      <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                    ) : (
                      <XCircleIcon style={{ width: '1rem', height: '1rem' }} />
                    )}
                    {user.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="kpi-card" style={{ padding: '2rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <KeyIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              Account Information
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  User ID
                </label>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontFamily: 'monospace', background: 'rgba(30, 41, 59, 0.5)', padding: '0.5rem', borderRadius: '4px' }}>
                  {user._id}
                </div>
              </div>
              
              <div>
                <label style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block', textAlign: 'center' }}>
                  Account Created
                </label>
                <div style={{ color: 'white', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <CalendarIcon style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                  {formatDate(user.createdAt)}
                </div>
              </div>
              
              <div>
                <label style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block', textAlign: 'center' }}>
                  Last Updated
                </label>
                <div style={{ color: 'white', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <ClockIcon style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                  {formatDate(user.updatedAt)}
                </div>
              </div>
              
              {user.lastLogin && (
                <div>
                  <label style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block', textAlign: 'center' }}>
                    Last Login
                  </label>
                  <div style={{ color: 'white', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <ClockIcon style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                    {formatDate(user.lastLogin)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Company Access */}
        <div className="kpi-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            Company Access
          </h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {user.companyAccess.map((companySlug, index) => (
              <span key={index} style={{
                background: 'rgba(139, 92, 246, 0.2)',
                color: '#8b5cf6',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}>
                {companySlug}
              </span>
            ))}
          </div>
        </div>

        {/* Permissions */}
        <div className="kpi-card" style={{ padding: '2rem' }}>
          <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            Permissions
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {Object.entries(isEditMode ? (editedUser.permissions || user.permissions) : user.permissions).map(([permission, hasPermission]) => (
              <div key={permission} style={{
                background: hasPermission ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                border: `1px solid ${hasPermission ? 'rgba(16, 185, 129, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`,
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: isEditMode ? 'pointer' : 'default'
              }}
              onClick={isEditMode ? () => handlePermissionChange(permission, !hasPermission) : undefined}
              >
                <span style={{ fontSize: '1.25rem' }}>
                  {getPermissionIcon(permission)}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    color: hasPermission ? '#10b981' : '#6b7280', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {permission.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div style={{ 
                    color: hasPermission ? '#10b981' : '#6b7280', 
                    fontSize: '0.75rem' 
                  }}>
                    {hasPermission ? 'Granted' : 'Denied'}
                  </div>
                </div>
                {isEditMode && (
                  <div style={{ 
                    color: hasPermission ? '#10b981' : '#6b7280',
                    fontSize: '1rem'
                  }}>
                    {hasPermission ? '✓' : '✗'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mechanic Section - Only show if user is a mechanic */}
        {user.role === 'Mechanic' && (
          <div className="kpi-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <WrenchScrewdriverIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              Mechanic Information
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              
              {/* Performance Stats */}
              <div>
                <h3 style={{ color: '#9ca3af', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BriefcaseIcon style={{ width: '1rem', height: '1rem' }} />
                  Performance
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#3b82f6', fontSize: '2rem', fontWeight: '700' }}>
                      {isEditMode ? (editedUser.mechanicData?.jobsCompleted ?? getMechanicData().jobsCompleted) : getMechanicData().jobsCompleted}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                      Jobs Completed
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: '600' }}>
                      {calculateTimeWorked(user.createdAt)}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                      Time Worked Here
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills & Preferences */}
              <div>
                <h3 style={{ color: '#9ca3af', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <StarIcon style={{ width: '1rem', height: '1rem' }} />
                  Skills & Preferences
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                      Specialties
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: isEditMode ? '0.75rem' : '0' }}>
                      {(isEditMode ? (editedUser.mechanicData?.specialties ?? getMechanicData().specialties) : getMechanicData().specialties).map((specialty, index) => (
                        <span key={index} style={{
                          background: 'rgba(139, 92, 246, 0.2)',
                          color: '#8b5cf6',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {specialty}
                          {isEditMode && (
                            <button
                              onClick={() => removeSpecialty(index)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#8b5cf6',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                padding: '0',
                                marginLeft: '0.25rem'
                              }}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {isEditMode && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={newSpecialty}
                          onChange={(e) => setNewSpecialty(e.target.value)}
                          placeholder="Add specialty..."
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '4px',
                            padding: '0.5rem',
                            color: 'white',
                            fontSize: '0.75rem',
                            flex: 1
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
                        />
                        <button
                          onClick={addSpecialty}
                          style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '4px',
                            color: '#8b5cf6',
                            padding: '0.5rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <HeartIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                      Favorite Brands
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: isEditMode ? '0.75rem' : '0' }}>
                      {(isEditMode ? (editedUser.mechanicData?.favoriteBrands ?? getMechanicData().favoriteBrands) : getMechanicData().favoriteBrands).map((brand, index) => (
                        <span key={index} style={{
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#f59e0b',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {brand}
                          {isEditMode && (
                            <button
                              onClick={() => removeFavoriteBrand(index)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#f59e0b',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                padding: '0',
                                marginLeft: '0.25rem'
                              }}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {isEditMode && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={newFavoriteBrand}
                          onChange={(e) => setNewFavoriteBrand(e.target.value)}
                          placeholder="Add favorite brand..."
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '4px',
                            padding: '0.5rem',
                            color: 'white',
                            fontSize: '0.75rem',
                            flex: 1
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && addFavoriteBrand()}
                        />
                        <button
                          onClick={addFavoriteBrand}
                          style={{
                            background: 'rgba(245, 158, 11, 0.2)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '4px',
                            color: '#f59e0b',
                            padding: '0.5rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Message */}
        {saveMessage && (
          <div style={{
            background: saveMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${saveMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            color: saveMessage.type === 'success' ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {saveMessage.type === 'success' ? (
              <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            ) : (
              <XCircleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            )}
            {saveMessage.text}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button
            onClick={() => router.push(`/dashboard/${company.slug}/users`)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              color: '#8b5cf6',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
            Back to Users
          </button>
          
          {isEditMode ? (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(107, 114, 128, 0.3)',
                  borderRadius: '8px',
                  color: '#6b7280',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: saving ? 0.5 : 1
                }}
              >
                <XMarkIcon style={{ width: '1rem', height: '1rem' }} />
                Cancel
              </button>
              
              <button
                onClick={handleSaveUser}
                disabled={saving}
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  color: '#10b981',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: saving ? 0.5 : 1
                }}
              >
                {saving ? (
                  <div style={{ width: '1rem', height: '1rem', border: '2px solid #10b981', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <CheckIcon style={{ width: '1rem', height: '1rem' }} />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              onClick={handleEditClick}
              style={{
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                color: '#8b5cf6',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <PencilIcon style={{ width: '1rem', height: '1rem' }} />
              Edit User
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
