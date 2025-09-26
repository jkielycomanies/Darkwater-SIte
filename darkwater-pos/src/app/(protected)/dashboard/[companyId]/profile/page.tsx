'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../dashboard.css';
import RevaniPortalHeader from '../../../../../components/RevaniPortalHeader';
import { 
  ArrowLeftIcon,
  UserCircleIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon,
  PencilIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  CameraIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    bio: ''
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

    // Initialize profile data from session
    if (session?.user) {
      setEditedProfile({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
        department: 'Administration',
        bio: ''
      });
    }
  }, [status, router, params, session]);

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

  const handleSave = async () => {
    try {
      // TODO: Implement API call to save profile changes
      console.log('Saving profile:', editedProfile);
      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile changes.');
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (session?.user) {
      setEditedProfile({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
        department: 'Administration',
        bio: ''
      });
    }
    setIsEditing(false);
  };

  if (!company || isLoading) {
    return (
      <div className="dashboard-container">
        <div className="background-pattern"></div>
        <div className="floating-elements">
          <div className="floating-orb purple"></div>
          <div className="floating-orb blue"></div>
          <div className="floating-orb green"></div>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: '#e2e8f0',
          fontSize: '1.125rem'
        }}>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="background-pattern"></div>
      <div className="floating-elements">
        <div className="floating-orb purple"></div>
        <div className="floating-orb blue"></div>
        <div className="floating-orb green"></div>
      </div>

      <RevaniPortalHeader company={company} activePage="profile" />

      {/* Main Content */}
      <main className="dashboard-main" style={{ marginTop: '2rem' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.back()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: '#8b5cf6',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
              }}
            >
              <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <div>
              <h2 className="section-header">User Profile</h2>
              <p style={{ color: '#94a3b8', margin: 0 }}>Manage your account information and preferences</p>
            </div>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '0.5rem',
                color: '#8b5cf6',
                fontSize: '0.875rem',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = 'rgba(139, 92, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'rgba(139, 92, 246, 0.2)';
              }}
            >
              <PencilIcon style={{ width: '1rem', height: '1rem' }} />
              Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleCancel}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(107, 114, 128, 0.2)',
                  border: '1px solid rgba(107, 114, 128, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = 'rgba(107, 114, 128, 0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = 'rgba(107, 114, 128, 0.2)';
                }}
              >
                <XMarkIcon style={{ width: '1rem', height: '1rem' }} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#22c55e',
                  fontSize: '0.875rem',
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = 'rgba(34, 197, 94, 0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = 'rgba(34, 197, 94, 0.2)';
                }}
              >
                <CheckIcon style={{ width: '1rem', height: '1rem' }} />
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Profile Content */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 2fr', 
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Left Column - Profile Picture & Basic Info */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '1rem',
            padding: '2rem',
            height: 'fit-content'
          }}>
            {/* Profile Picture */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                border: '4px solid rgba(139, 92, 246, 0.3)',
                position: 'relative'
              }}>
                <UserCircleIcon style={{ width: '4rem', height: '4rem', color: 'white' }} />
                {isEditing && (
                  <button
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(139, 92, 246, 0.9)',
                      border: '2px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.9)';
                    }}
                    onClick={() => alert('Photo upload coming soon!')}
                  >
                    <CameraIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                  </button>
                )}
              </div>
              <h3 style={{ 
                color: '#e2e8f0', 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                margin: '0 0 0.5rem 0' 
              }}>
                {editedProfile.name || 'Admin User'}
              </h3>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem',
                color: '#94a3b8',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                <ShieldCheckIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                Administrator
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem',
                color: '#94a3b8',
                fontSize: '0.875rem'
              }}>
                <EnvelopeIcon style={{ width: '1rem', height: '1rem' }} />
                {editedProfile.email || 'admin@company.com'}
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{
              borderTop: '1px solid rgba(139, 92, 246, 0.2)',
              paddingTop: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#94a3b8',
                fontSize: '0.875rem'
              }}>
                <CalendarIcon style={{ width: '1rem', height: '1rem' }} />
                <span>Joined {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#94a3b8',
                fontSize: '0.875rem'
              }}>
                <ClockIcon style={{ width: '1rem', height: '1rem' }} />
                <span>Last login: {new Date().toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Personal Information */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '1rem',
              padding: '1.5rem'
            }}>
              <h4 style={{ 
                color: '#e2e8f0', 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <UserCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
                Personal Information
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ 
                    color: '#94a3b8', 
                    fontSize: '0.875rem', 
                    display: 'block', 
                    marginBottom: '0.5rem' 
                  }}>
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.name}
                      onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                      style={{
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        color: '#e2e8f0',
                        fontSize: '0.875rem'
                      }}
                    />
                  ) : (
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.3)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      color: '#e2e8f0',
                      fontSize: '0.875rem'
                    }}>
                      {editedProfile.name || 'Not specified'}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ 
                    color: '#94a3b8', 
                    fontSize: '0.875rem', 
                    display: 'block', 
                    marginBottom: '0.5rem' 
                  }}>
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                      style={{
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        color: '#e2e8f0',
                        fontSize: '0.875rem'
                      }}
                    />
                  ) : (
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.3)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      color: '#e2e8f0',
                      fontSize: '0.875rem'
                    }}>
                      {editedProfile.email || 'Not specified'}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ 
                    color: '#94a3b8', 
                    fontSize: '0.875rem', 
                    display: 'block', 
                    marginBottom: '0.5rem' 
                  }}>
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedProfile.phone}
                      onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                      style={{
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        color: '#e2e8f0',
                        fontSize: '0.875rem'
                      }}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.3)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      color: '#e2e8f0',
                      fontSize: '0.875rem'
                    }}>
                      {editedProfile.phone || 'Not specified'}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ 
                    color: '#94a3b8', 
                    fontSize: '0.875rem', 
                    display: 'block', 
                    marginBottom: '0.5rem' 
                  }}>
                    Department
                  </label>
                  {isEditing ? (
                    <select
                      value={editedProfile.department}
                      onChange={(e) => setEditedProfile({...editedProfile, department: e.target.value})}
                      style={{
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        color: '#e2e8f0',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="Administration">Administration</option>
                      <option value="Sales">Sales</option>
                      <option value="Service">Service</option>
                      <option value="Finance">Finance</option>
                      <option value="Management">Management</option>
                    </select>
                  ) : (
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.3)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      color: '#e2e8f0',
                      fontSize: '0.875rem'
                    }}>
                      {editedProfile.department || 'Administration'}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ 
                  color: '#94a3b8', 
                  fontSize: '0.875rem', 
                  display: 'block', 
                  marginBottom: '0.5rem' 
                }}>
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={editedProfile.bio}
                    onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      color: '#e2e8f0',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.3)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: '#e2e8f0',
                    fontSize: '0.875rem',
                    minHeight: '80px'
                  }}>
                    {editedProfile.bio || 'No bio provided yet.'}
                  </div>
                )}
              </div>
            </div>

            {/* Account Settings */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '1rem',
              padding: '1.5rem'
            }}>
              <h4 style={{ 
                color: '#e2e8f0', 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ShieldCheckIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
                Account Settings
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: '8px',
                    color: '#f59e0b',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.2)';
                  }}
                  onClick={() => alert('Change Password functionality coming soon!')}
                >
                  <KeyIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                  Change Password
                </button>

                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px',
                    color: '#10b981',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                  }}
                  onClick={() => alert('Notification Preferences coming soon!')}
                >
                  <BellIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                  Notification Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}




