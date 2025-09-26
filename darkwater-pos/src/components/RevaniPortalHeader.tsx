'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  ChevronDownIcon,
  UserGroupIcon,
  CogIcon,
  PhotoIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import RevaniLogo from './RevaniLogo';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface RevaniPortalHeaderProps {
  company: Company;
  activePage: string;
}

export default function RevaniPortalHeader({ company, activePage }: RevaniPortalHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<any>(null);

  // Fetch user permissions
  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const response = await fetch('/api/auth/user-permissions');
        if (response.ok) {
          const data = await response.json();
          setUserPermissions(data.permissions);
          console.log('User permissions loaded:', data.permissions);
        }
      } catch (error) {
        console.error('Error fetching user permissions:', error);
      }
    };

    if (session) {
      fetchUserPermissions();
    }
  }, [session]);

  const getCompanyBadge = (type: string) => {
    switch (type) {
      case 'dealership':
        return 'Dealership';
      case 'software':
        return 'Software';
      case 'holding':
        return 'Holding';
      default:
        return 'Company';
    }
  };

  const handleSignOut = async () => {
    // Clear any local storage or session storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    // Sign out with redirect to login
    await signOut({ 
      callbackUrl: '/login',
      redirect: true 
    });
  };

  return (
    <header style={{
      background: 'linear-gradient(135deg, #1f2937 0%, #374151 25%, #4b5563 50%, #374151 75%, #1f2937 100%)',
      borderBottom: '2px solid #111827',
      padding: '1rem 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 15px rgba(31, 41, 55, 0.4)'
    }}>
      {/* Top Row - Brand and User Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        {/* Left Side - Brand and Company Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ filter: 'invert(1) brightness(2) contrast(1.2)' }}>
            <RevaniLogo size="medium" />
          </div>
          <div style={{
            background: 'rgba(139, 92, 246, 0.8)',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            borderRadius: '9999px',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {getCompanyBadge(company.type)}
          </div>
        </div>

        {/* Right Side - User Profile and Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onClick={() => router.push(`/dashboard/${company.slug}/profile`)}
          title="User Profile"
          >
            <UserCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
          </div>
          <button
            onClick={handleSignOut}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '0.5rem',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            title="Sign Out"
          >
            <ArrowRightOnRectangleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {/* Dashboard */}
        {userPermissions?.dashboard && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'dashboard' ? null : 'dashboard')}
              style={{
                background: activePage === 'dashboard' ? 'rgba(139, 92, 246, 0.8)' : 'transparent',
                border: 'none',
                padding: '0.75rem 1rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                borderBottom: activePage === 'dashboard' ? '2px solid #8b5cf6' : 'none'
              }}
              onMouseEnter={(e) => {
                if (activePage !== 'dashboard') {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (activePage !== 'dashboard') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              Dashboard
              <ChevronDownIcon style={{ width: '1rem', height: '1rem' }} />
            </button>
            {activeDropdown === 'dashboard' && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: 'rgba(30, 41, 59, 0.95)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                padding: '0.5rem 0',
                minWidth: '200px',
                backdropFilter: 'blur(10px)',
                zIndex: 1000
              }}>
                <button
                  onClick={() => {
                    setActiveDropdown(null);
                    router.push(`/dashboard/${company.slug}`);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    color: '#e2e8f0',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#e2e8f0';
                  }}
                >
                  Main Dashboard
                </button>
                <button
                  onClick={() => {
                    setActiveDropdown(null);
                    router.push('/select');
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    color: '#e2e8f0',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#e2e8f0';
                  }}
                >
                  Navigator
                </button>
              </div>
            )}
          </div>
        )}

        {/* Inventory */}
        {(userPermissions?.bikeInventory || userPermissions?.partsInventory || userPermissions?.accessoriesInventory) && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'inventory' ? null : 'inventory')}
              style={{
                background: activePage === 'inventory' ? 'rgba(139, 92, 246, 0.8)' : 'transparent',
                border: 'none',
                padding: '0.75rem 1rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                borderBottom: activePage === 'inventory' ? '2px solid #8b5cf6' : 'none'
              }}
              onMouseEnter={(e) => {
                if (activePage !== 'inventory') {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (activePage !== 'inventory') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              Inventory
              <ChevronDownIcon style={{ width: '1rem', height: '1rem' }} />
            </button>
            {activeDropdown === 'inventory' && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: 'rgba(30, 41, 59, 0.95)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                padding: '0.5rem 0',
                minWidth: '200px',
                backdropFilter: 'blur(10px)',
                zIndex: 1000
              }}>
                {userPermissions?.bikeInventory && (
                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      router.push(`/dashboard/${company.slug}/inventory/bikes`);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      background: 'transparent',
                      color: '#e2e8f0',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                  >
                    Bike Inventory
                  </button>
                )}
                {userPermissions?.partsInventory && (
                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      router.push(`/dashboard/${company.slug}/inventory/parts`);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      background: 'transparent',
                      color: '#e2e8f0',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                  >
                    Parts Inventory
                  </button>
                )}
                {userPermissions?.accessoriesInventory && (
                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      router.push(`/dashboard/${company.slug}/inventory/accessories`);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      background: 'transparent',
                      color: '#e2e8f0',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                  >
                    Accessories Inventory
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Service Center */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'service-center' ? null : 'service-center')}
            style={{
              background: activePage === 'service-center' ? 'rgba(139, 92, 246, 0.8)' : 'transparent',
              border: 'none',
              padding: '0.75rem 1rem',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              borderBottom: activePage === 'service-center' ? '2px solid #8b5cf6' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activePage !== 'service-center') {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (activePage !== 'service-center') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Service
            <ChevronDownIcon style={{ width: '1rem', height: '1rem' }} />
          </button>
          {activeDropdown === 'service-center' && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: 'rgba(30, 41, 59, 0.95)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              padding: '0.5rem 0',
              minWidth: '200px',
              backdropFilter: 'blur(10px)',
              zIndex: 1000
            }}>
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  router.push(`/dashboard/${company.slug}/service-center`);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  color: '#e2e8f0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#e2e8f0';
                }}
              >
                Service Center
              </button>
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  router.push(`/dashboard/${company.slug}/service-center/evaluation`);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  color: '#e2e8f0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#e2e8f0';
                }}
              >
                Evaluation
              </button>
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  router.push(`/dashboard/${company.slug}/service-center/service-manager`);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  color: '#e2e8f0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#e2e8f0';
                }}
              >
                Service Manager
              </button>
            </div>
          )}
        </div>

        {/* Media */}
        {userPermissions?.media && (
          <button
          onClick={() => router.push(`/dashboard/${company.slug}/media`)}
          style={{
            background: activePage === 'media' ? 'rgba(139, 92, 246, 0.8)' : 'transparent',
            border: 'none',
            padding: '0.75rem 1rem',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            borderBottom: activePage === 'media' ? '2px solid #8b5cf6' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activePage !== 'media') {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (activePage !== 'media') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
            Media
          </button>
        )}

        {/* Sales Dropdown */}
        {userPermissions?.cms && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'sales' ? null : 'sales')}
              style={{
                background: activePage === 'sales' ? 'rgba(139, 92, 246, 0.8)' : 'transparent',
                border: 'none',
                padding: '0.75rem 1rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                borderBottom: activePage === 'sales' ? '2px solid #8b5cf6' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (activePage !== 'sales') {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (activePage !== 'sales') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              Sales
              <ChevronDownIcon style={{ width: '1rem', height: '1rem' }} />
            </button>
            {activeDropdown === 'sales' && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: 'rgba(30, 41, 59, 0.95)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                padding: '0.5rem 0',
                minWidth: '200px',
                backdropFilter: 'blur(10px)',
                zIndex: 1000
              }}>
                <button
                  onClick={() => {
                    setActiveDropdown(null);
                    router.push(`/dashboard/${company.slug}/sales/portal`);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    color: '#e2e8f0',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#e2e8f0';
                  }}
                >
                  Sales Center
                </button>
              </div>
            )}
          </div>
        )}

        {/* Financial */}
        {(userPermissions?.financialDashboard || userPermissions?.transactions) && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'financial' ? null : 'financial')}
              style={{
                background: activePage === 'financial' ? 'rgba(139, 92, 246, 0.8)' : 'transparent',
                border: 'none',
                padding: '0.75rem 1rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                borderBottom: activePage === 'financial' ? '2px solid #8b5cf6' : 'none'
              }}
              onMouseEnter={(e) => {
                if (activePage !== 'financial') {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (activePage !== 'financial') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              Financial
              <ChevronDownIcon style={{ width: '1rem', height: '1rem' }} />
            </button>
            {activeDropdown === 'financial' && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: 'rgba(30, 41, 59, 0.95)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                padding: '0.5rem 0',
                minWidth: '200px',
                backdropFilter: 'blur(10px)',
                zIndex: 1000
              }}>
                {userPermissions?.financialDashboard && (
                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      router.push(`/dashboard/${company.slug}/financial`);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      background: 'transparent',
                      color: '#e2e8f0',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                  >
                    Financial Dashboard
                  </button>
                )}
                {userPermissions?.transactions && (
                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      router.push(`/dashboard/${company.slug}/financial/transactions`);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      background: 'transparent',
                      color: '#e2e8f0',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                  >
                    Transaction Records
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tools */}
        {(userPermissions?.massImport || userPermissions?.vinRunner) && (
          <div style={{ position: 'relative' }}>
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'tools' ? null : 'tools')}
            style={{
              background: activePage === 'tools' ? 'rgba(139, 92, 246, 0.8)' : 'transparent',
              border: 'none',
              padding: '0.75rem 1rem',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              borderBottom: activePage === 'tools' ? '2px solid #8b5cf6' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activePage !== 'tools') {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (activePage !== 'tools') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Tools
            <ChevronDownIcon style={{ width: '1rem', height: '1rem' }} />
          </button>
          {activeDropdown === 'tools' && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: 'rgba(30, 41, 59, 0.95)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              padding: '0.5rem 0',
              minWidth: '200px',
              backdropFilter: 'blur(10px)',
              zIndex: 1000
            }}>
                {userPermissions?.massImport && (
                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      router.push(`/dashboard/${company.slug}/tools/mass-import`);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      background: 'transparent',
                      color: '#e2e8f0',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                  >
                    Mass Import
                  </button>
                )}
                {userPermissions?.vinRunner && (
                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      router.push(`/dashboard/${company.slug}/tools/vin-runner`);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      background: 'transparent',
                      color: '#e2e8f0',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                  >
                    VIN Runner
                  </button>
                )}
            </div>
          )}
          </div>
        )}

        {/* Archives */}
        {userPermissions?.soldBikes && (
          <div style={{ position: 'relative' }}>
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'archives' ? null : 'archives')}
            style={{
              background: activePage === 'archives' ? 'rgba(139, 92, 246, 0.8)' : 'transparent',
              border: 'none',
              padding: '0.75rem 1rem',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              borderBottom: activePage === 'archives' ? '2px solid #8b5cf6' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activePage !== 'archives') {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (activePage !== 'archives') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Archives
            <ChevronDownIcon style={{ width: '1rem', height: '1rem' }} />
          </button>
          {activeDropdown === 'archives' && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: 'rgba(30, 41, 59, 0.95)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              padding: '0.5rem 0',
              minWidth: '200px',
              backdropFilter: 'blur(10px)',
              zIndex: 1000
            }}>
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  router.push(`/dashboard/${company.slug}/archives/sold-bikes`);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  color: '#e2e8f0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#e2e8f0';
                }}
              >
                Sold Bikes
              </button>
            </div>
          )}
          </div>
        )}

        {/* User Management */}
        {userPermissions?.users && (
          <button
          onClick={() => router.push(`/dashboard/${company.slug}/users`)}
          style={{
            background: activePage === 'users' ? 'rgba(139, 92, 246, 0.8)' : 'transparent',
            border: 'none',
            padding: '0.75rem 1rem',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            borderBottom: activePage === 'users' ? '2px solid #8b5cf6' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activePage !== 'users') {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (activePage !== 'users') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
            User Management
          </button>
        )}


      </nav>
    </header>
  );
}
