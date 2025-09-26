'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface RevanHeaderProps {
  company: Company;
  activePage?: string;
}

export default function RevanHeader({ company, activePage }: RevanHeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);
  const [inventoryDropdownOpen, setInventoryDropdownOpen] = useState(false);
  const [serviceCenterDropdownOpen, setServiceCenterDropdownOpen] = useState(false);
  const [financialDropdownOpen, setFinancialDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [archivesDropdownOpen, setArchivesDropdownOpen] = useState(false);

  const getCompanyBadge = (type: string) => {
    switch (type) {
      case 'dealership':
        return '🏍️ Dealership';
      case 'software':
        return '💻 Software';
      case 'holding':
        return '🏢 Holding';
      default:
        return '🏢 Company';
    }
  };

  const isActivePage = (pageName: string) => {
    return activePage === pageName;
  };

  return (
    <>
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
            <span className="user-welcome">Welcome, {session?.user?.name}</span>
            <button
              onClick={async () => {
                // Clear any local storage or session storage
                if (typeof window !== 'undefined') {
                  localStorage.clear();
                  sessionStorage.clear();
                }
                await signOut({ callbackUrl: '/login', redirect: true });
              }}
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
          <div style={{position: 'relative'}}>
            <button 
              className={`nav-button ${isActivePage('dashboard') ? 'active' : ''}`} 
              onClick={() => setDashboardDropdownOpen(!dashboardDropdownOpen)}
            >
              Dashboard <span style={{display: 'inline-block', marginLeft: '8px', transform: dashboardDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease'}}>▼</span>
            </button>
            <div style={{position: 'fixed', top: '120px', left: '200px', background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)', zIndex: 9999, minWidth: '180px', padding: '8px', opacity: dashboardDropdownOpen ? 1 : 0, visibility: dashboardDropdownOpen ? 'visible' : 'hidden', transform: dashboardDropdownOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)', transition: 'all 0.3s ease', transformOrigin: 'top left'}}>
              <button style={{display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'rgba(139, 92, 246, 0.3)', color: 'white', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', margin: '2px 0'}} onClick={() => {setDashboardDropdownOpen(false); router.push(`/dashboard/${company.slug}`);}}>
                Revani Dashboard
              </button>
              <button style={{display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', margin: '2px 0'}} onMouseEnter={(e) => {(e.target as HTMLElement).style.background = 'rgba(139, 92, 246, 0.3)'; (e.target as HTMLElement).style.color = 'white';}} onMouseLeave={(e) => {(e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#e2e8f0';}} onClick={() => {setDashboardDropdownOpen(false); router.push('/select');}}>
                Company Selector
              </button>
            </div>
          </div>
          
          <div style={{position: 'relative'}}>
            <button 
              className={`nav-button ${isActivePage('inventory') ? 'active' : ''}`} 
              onClick={() => setInventoryDropdownOpen(!inventoryDropdownOpen)}
            >
              Inventory <span style={{display: 'inline-block', marginLeft: '8px', transform: inventoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease'}}>▼</span>
            </button>
            <div style={{position: 'fixed', top: '120px', left: '280px', background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)', zIndex: 9999, minWidth: '180px', padding: '8px', opacity: inventoryDropdownOpen ? 1 : 0, visibility: inventoryDropdownOpen ? 'visible' : 'hidden', transform: inventoryDropdownOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)', transition: 'all 0.3s ease', transformOrigin: 'top left'}}>
              <button style={{display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', margin: '2px 0'}} onMouseEnter={(e) => {(e.target as HTMLElement).style.background = 'rgba(139, 92, 246, 0.3)'; (e.target as HTMLElement).style.color = 'white';}} onMouseLeave={(e) => {(e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#e2e8f0';}} onClick={() => {setInventoryDropdownOpen(false); router.push(`/dashboard/${company.slug}/inventory/bikes`);}}>
                Bike Inventory
              </button>
              <button style={{display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', margin: '2px 0'}} onMouseEnter={(e) => {(e.target as HTMLElement).style.background = 'rgba(139, 92, 246, 0.3)'; (e.target as HTMLElement).style.color = 'white';}} onMouseLeave={(e) => {(e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#e2e8f0';}} onClick={() => {setInventoryDropdownOpen(false); router.push(`/dashboard/${company.slug}/inventory/parts`);}}>
                Part Inventory
              </button>
              <button style={{display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', margin: '2px 0'}} onMouseEnter={(e) => {(e.target as HTMLElement).style.background = 'rgba(139, 92, 246, 0.3)'; (e.target as HTMLElement).style.color = 'white';}} onMouseLeave={(e) => {(e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#e2e8f0';}} onClick={() => {setInventoryDropdownOpen(false); router.push(`/dashboard/${company.slug}/inventory/accessories`);}}>
                Accessory Inventory
              </button>
            </div>
          </div>
          
          <div style={{position: 'relative'}}>
            <button 
              className={`nav-button ${isActivePage('service-center') ? 'active' : ''}`} 
              onClick={() => setServiceCenterDropdownOpen(!serviceCenterDropdownOpen)}
            >
              Service Center <span style={{display: 'inline-block', marginLeft: '8px', transform: serviceCenterDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease'}}>▼</span>
            </button>
            <div style={{position: 'fixed', top: '120px', left: '400px', background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)', zIndex: 9999, minWidth: '180px', padding: '8px', opacity: serviceCenterDropdownOpen ? 1 : 0, visibility: serviceCenterDropdownOpen ? 'visible' : 'hidden', transform: serviceCenterDropdownOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)', transition: 'all 0.3s ease', transformOrigin: 'top left'}}>
              <button style={{display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', margin: '2px 0'}} onMouseEnter={(e) => {(e.target as HTMLElement).style.background = 'rgba(139, 92, 246, 0.3)'; (e.target as HTMLElement).style.color = 'white';}} onMouseLeave={(e) => {(e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#e2e8f0';}} onClick={() => {setServiceCenterDropdownOpen(false); router.push(`/dashboard/${company.slug}/service-center/evaluation`);}}>
                Evaluation
              </button>
              <button style={{display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', margin: '2px 0'}} onMouseEnter={(e) => {(e.target as HTMLElement).style.background = 'rgba(139, 92, 246, 0.3)'; (e.target as HTMLElement).style.color = 'white';}} onMouseLeave={(e) => {(e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#e2e8f0';}} onClick={() => {setServiceCenterDropdownOpen(false); router.push(`/dashboard/${company.slug}/service-center/service-manager`);}}>
                Service Manager
              </button>
            </div>
          </div>
          
          <button 
            className={`nav-button ${isActivePage('sales') ? 'active' : ''}`}
            onClick={() => router.push(`/dashboard/${company.slug}/sales/portal`)}
          >
            Sales
          </button>
          
          <button 
            className={`nav-button ${isActivePage('media') ? 'active' : ''}`}
            onClick={() => router.push(`/dashboard/${company.slug}/media`)}
          >
            Media
          </button>
          
          <div style={{position: 'relative'}}>
            <button 
              className={`nav-button ${isActivePage('financial') ? 'active' : ''}`} 
              onClick={() => setFinancialDropdownOpen(!financialDropdownOpen)}
            >
              Financial <span style={{display: 'inline-block', marginLeft: '8px', transform: financialDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease'}}>▼</span>
            </button>
            <div style={{position: 'fixed', top: '120px', left: '560px', background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)', zIndex: 9999, minWidth: '180px', padding: '8px', opacity: financialDropdownOpen ? 1 : 0, visibility: financialDropdownOpen ? 'visible' : 'hidden', transform: financialDropdownOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)', transition: 'all 0.3s ease', transformOrigin: 'top left'}}>
              <button style={{display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', margin: '2px 0'}} onMouseEnter={(e) => {(e.target as HTMLElement).style.background = 'rgba(139, 92, 246, 0.3)'; (e.target as HTMLElement).style.color = 'white';}} onMouseLeave={(e) => {(e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#e2e8f0';}} onClick={() => {setFinancialDropdownOpen(false); router.push(`/dashboard/${company.slug}/financial`);}}>
                Financial Dashboard
              </button>
              <button style={{display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', margin: '2px 0'}} onMouseEnter={(e) => {(e.target as HTMLElement).style.background = 'rgba(139, 92, 246, 0.3)'; (e.target as HTMLElement).style.color = 'white';}} onMouseLeave={(e) => {(e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#e2e8f0';}} onClick={() => {setFinancialDropdownOpen(false); router.push(`/dashboard/${company.slug}/financial/transactions`);}}>
                Transactions
              </button>
            </div>
          </div>
          
          <div style={{position: 'relative'}}>
            <button 
              className={`nav-button ${isActivePage('tools') ? 'active' : ''}`} 
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
            >
              Tools <span style={{display: 'inline-block', marginLeft: '8px', transform: toolsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease'}}>▼</span>
            </button>
            <div style={{position: 'fixed', top: '120px', left: '640px', background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)', zIndex: 9999, minWidth: '180px', padding: '8px', opacity: toolsDropdownOpen ? 1 : 0, visibility: toolsDropdownOpen ? 'visible' : 'hidden', transform: toolsDropdownOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)', transition: 'all 0.3s ease', transformOrigin: 'top left'}}>
              <button style={{display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', margin: '2px 0'}} onMouseEnter={(e) => {(e.target as HTMLElement).style.background = 'rgba(139, 92, 246, 0.3)'; (e.target as HTMLElement).style.color = 'white';}} onMouseLeave={(e) => {(e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#e2e8f0';}} onClick={() => {setToolsDropdownOpen(false); router.push(`/dashboard/${company.slug}/tools/vin-runner`);}}>
                VIN Runner
              </button>
            </div>
          </div>
          
          <div style={{position: 'relative'}}>
            <button 
              className={`nav-button ${isActivePage('archives') ? 'active' : ''}`} 
              onClick={() => setArchivesDropdownOpen(!archivesDropdownOpen)}
            >
              Archives <span style={{display: 'inline-block', marginLeft: '8px', transform: archivesDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease'}}>▼</span>
            </button>
            <div style={{position: 'fixed', top: '120px', left: '720px', background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)', zIndex: 9999, minWidth: '180px', padding: '8px', opacity: archivesDropdownOpen ? 1 : 0, visibility: archivesDropdownOpen ? 'visible' : 'hidden', transform: archivesDropdownOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)', transition: 'all 0.3s ease', transformOrigin: 'top left'}}>
              <button style={{display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', margin: '2px 0'}} onMouseEnter={(e) => {(e.target as HTMLElement).style.background = 'rgba(139, 92, 246, 0.3)'; (e.target as HTMLElement).style.color = 'white';}} onMouseLeave={(e) => {(e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#e2e8f0';}} onClick={() => {setArchivesDropdownOpen(false); router.push(`/dashboard/${company.slug}/archives`);}}>
                General Archives
              </button>
              <button style={{display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', margin: '2px 0'}} onMouseEnter={(e) => {(e.target as HTMLElement).style.background = 'rgba(139, 92, 246, 0.3)'; (e.target as HTMLElement).style.color = 'white';}} onMouseLeave={(e) => {(e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#e2e8f0';}} onClick={() => {setArchivesDropdownOpen(false); router.push(`/dashboard/${company.slug}/archives/sold-bikes`);}}>
                Sold Bikes
              </button>
            </div>
          </div>
          
          <button 
            className={`nav-button ${isActivePage('user-management') ? 'active' : ''}`}
            onClick={() => router.push(`/dashboard/${company.slug}/user-management`)}
          >
            User Management
          </button>
        </div>
      </nav>
    </>
  );
}


