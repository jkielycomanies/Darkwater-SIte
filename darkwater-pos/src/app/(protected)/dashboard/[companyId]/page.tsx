'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import './dashboard.css';
import RevaniPortalHeader from '../../../../components/RevaniPortalHeader';
import { 
  TruckIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  PlusIcon,
  DocumentTextIcon,
  CogIcon,
  EyeIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    Acquisition: 0,
    Evaluation: 0,
    Servicing: 0,
    Media: 0,
    Listed: 0
  });
  const [soldThisMonth, setSoldThisMonth] = useState<number>(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<Array<{ label: string; amount: number; month: string }>>([]);
  const [monthlyProfit, setMonthlyProfit] = useState<Array<{ label: string; amount: number; month: string }>>([]);

  const formatCurrencyShort = (amount: number) => {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
  };
  const formatCurrencyFull = (amount: number) => `$${amount.toLocaleString()}`;


  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (!params?.companyId) return;

    const companyId = params.companyId as string;
    (async () => {
      setIsLoading(true);
      await Promise.all([
        fetchCompanyData(companyId),
        fetchInventoryCount(companyId)
      ]);
      setIsLoading(false);
    })();
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
    }
  };

  const fetchInventoryCount = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/dashboard?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        const dashboardData = data.dashboardData;
        
        setInventoryCount(dashboardData.inventoryCount);
        setStatusCounts(dashboardData.statusCounts);
        setSoldThisMonth(dashboardData.soldThisMonth);
        setMonthlyRevenue(dashboardData.monthlyRevenue);
        setMonthlyProfit(dashboardData.monthlyProfit);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="loading-container">
        {/* Background Pattern */}
        <div className="background-pattern"></div>
        
        {/* Floating Elements */}
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

  // Company-specific KPI data and actions
  const getCompanyKPIs = (companyType: string) => {
    switch (companyType) {
      case 'dealership':
        return {
          kpis: [
            { title: 'Inventory Count', value: inventoryCount.toString(), icon: TruckIcon, color: 'text-blue-400' },
            { title: 'Units on Hold', value: '—', icon: CogIcon, color: 'text-yellow-400' },
            { title: 'Open Leads', value: '—', icon: UserGroupIcon, color: 'text-green-400' },
            { title: '7-Day Sales', value: '—', icon: CurrencyDollarIcon, color: 'text-gold' },
          ],
          actions: [
            { title: 'Add Vehicle', icon: PlusIcon, action: 'add_vehicle' },
            { title: 'Create Deal', icon: DocumentTextIcon, action: 'create_deal' },
            { title: 'View Leads', icon: EyeIcon, action: 'view_leads' },
          ],
        };
      case 'software':
        return {
          kpis: [
            { title: 'Active Tenants', value: '156', icon: UserGroupIcon, color: 'text-blue-400' },
            { title: 'Monthly MRR', value: '$89.2K', icon: CurrencyDollarIcon, color: 'text-green-400' },
            { title: 'Open Tickets', value: '8', icon: CogIcon, color: 'text-yellow-400' },
            { title: 'Deploy Status', value: 'Live', icon: ChartBarIcon, color: 'text-gold' },
          ],
          actions: [
            { title: 'Invite Tenant', icon: PlusIcon, action: 'invite_tenant' },
            { title: 'Create Release', icon: DocumentTextIcon, action: 'create_release' },
            { title: 'Open Docs', icon: EyeIcon, action: 'open_docs' },
          ],
        };
      case 'holding':
        return {
          kpis: [
            { title: 'Portfolio Value', value: '$2.4M', icon: ChartBarIcon, color: 'text-blue-400' },
            { title: 'Cash Position', value: '$180K', icon: CurrencyDollarIcon, color: 'text-green-400' },
            { title: 'Intercompany Invoices', value: '23', icon: DocumentTextIcon, color: 'text-yellow-400' },
            { title: 'ROI YTD', value: '18.4%', icon: ChartBarIcon, color: 'text-gold' },
          ],
          actions: [
            { title: 'Allocate Capital', icon: PlusIcon, action: 'allocate_capital' },
            { title: 'View Reports', icon: DocumentTextIcon, action: 'view_reports' },
            { title: 'Portfolio Overview', icon: EyeIcon, action: 'portfolio_overview' },
          ],
        };
      default:
        return { kpis: [], actions: [] };
    }
  };

  const { actions } = getCompanyKPIs(company.type);



  return (
    <div className="dashboard-container">
      {/* Background Pattern */}
      <div className="background-pattern"></div>
      
      {/* Floating Elements */}
      <div className="floating-elements">
        <div className="floating-orb purple"></div>
        <div className="floating-orb blue"></div>
        <div className="floating-orb green"></div>
      </div>

      <RevaniPortalHeader company={company} activePage="dashboard" />


        

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Inventory Status Overview */}
        {company.type === 'dealership' && (
          <section style={{ marginBottom: '1.5rem' }}>
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
              {['Acquisition','Evaluation','Servicing','Media','Listed'].map((stage) => {
                const colorMap: Record<string, { bg: string; color: string; border: string }> = {
                  Acquisition: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '#f59e0b40' },
                  Evaluation: { bg: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', border: '#6366f140' },
                  Servicing: { bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', border: '#a855f740' },
                  Media: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '#3b82f640' },
                  Listed: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '#22c55e40' }
                };
                const c = colorMap[stage];
                return (
                  <div key={stage} className="kpi-card" style={{ padding: '1rem', textAlign: 'center', background: c.bg, border: `1px solid ${c.border}` }}>
                    <div style={{ color: c.color, fontSize: '0.9rem', marginBottom: '0.35rem', fontWeight: 600 }}>{stage}</div>
                    <div style={{ color: c.color, fontSize: '1.75rem', fontWeight: 800 }}>{statusCounts[stage] || 0}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        {company.type === 'dealership' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr auto', gap: '2rem', alignItems: 'stretch', marginTop: '-0.25rem', marginBottom: '1.5rem' }}>
            {/* Revenue Bar Chart - 6 Months */}
            <div className="kpi-card" style={{ padding: '1.25rem', minHeight: '260px' }}>
              <div style={{ color: '#94a3b8', marginBottom: '0.75rem', fontWeight: 700, textAlign: 'center' }}>Revenue (Last 6 Months)</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', height: '180px' }}>
                {monthlyRevenue.length > 0 && (() => { 
                  const maxAmount = Math.max(1, ...monthlyRevenue.map(x => x.amount)); 
                  return monthlyRevenue.map((m, idx) => {
                    const barH = Math.max(8, Math.round((m.amount / maxAmount) * 160));
                    const color = 'rgba(59, 130, 246, 0.9)'; // blue
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '36px', flex: 1 }}>
                        <div style={{ color: '#cbd5e1', fontSize: '0.8rem', marginBottom: '0.35rem', whiteSpace: 'nowrap' }}>{formatCurrencyShort(m.amount)}</div>
                        <div style={{ height: `${barH}px`, width: '32px', background: color, border: '1px solid rgba(59,130,246,0.5)', borderRadius: '8px' }} title={`${m.label}: $${m.amount.toLocaleString()}`} />
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.45rem' }}>{m.label}</div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Profit Bar Chart - 6 Months */}
            <div className="kpi-card" style={{ padding: '1.25rem', minHeight: '260px' }}>
              <div style={{ color: '#94a3b8', marginBottom: '0.75rem', fontWeight: 700, textAlign: 'center' }}>Profit (Last 6 Months)</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', height: '180px' }}>
                {monthlyProfit.length > 0 && (() => { 
                  const maxAmount = Math.max(1, ...monthlyProfit.map(x => x.amount)); 
                  return monthlyProfit.map((m, idx) => {
                    const barH = Math.max(8, Math.round((m.amount / maxAmount) * 160));
                    const color = 'rgba(168, 85, 247, 0.95)'; // purple
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '36px', flex: 1 }}>
                        <div style={{ color: '#cbd5e1', fontSize: '0.8rem', marginBottom: '0.35rem', whiteSpace: 'nowrap' }}>{formatCurrencyShort(m.amount)}</div>
                        <div style={{ height: `${barH}px`, width: '32px', background: color, border: '1px solid rgba(168,85,247,0.5)', borderRadius: '8px' }} title={`${m.label}: $${m.amount.toLocaleString()}`} />
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.45rem' }}>{m.label}</div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Big circular counter */}
            <div
              style={{
                width: '220px',
                height: '220px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(168, 85, 247, 0.12)',
                border: '2px solid rgba(168, 85, 247, 0.35)',
                boxShadow: '0 10px 30px rgba(168, 85, 247, 0.15)'
              }}
            >
              <div style={{ textAlign: 'center', color: '#a855f7' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>{soldThisMonth}</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem' }}>Bikes Sold This Month</div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly computation breakdown */}
        {company.type === 'dealership' && monthlyRevenue.length > 0 && (
          <div className="kpi-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ color: '#94a3b8', fontWeight: 700, marginBottom: '0.5rem' }}>Monthly Breakdown (Sold bikes only)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '0.75rem' }}>
              {monthlyRevenue.map((revenueMonth, idx) => {
                const profitMonth = monthlyProfit.find(p => p.month === revenueMonth.month);
                return (
                  <div key={idx} style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ color: '#cbd5e1', fontWeight: 700, marginBottom: '0.35rem' }}>{revenueMonth.label}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Revenue: <span style={{ color: 'white' }}>{formatCurrencyFull(revenueMonth.amount)}</span></div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Profit: <span style={{ color: 'white' }}>{formatCurrencyFull(profitMonth?.amount || 0)}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* KPI Section removed as requested */}

        {/* Quick Actions Section */}
        <section>
          <h2 className="section-header">Quick Actions</h2>
          <div className="actions-grid">
            {actions.map((action, index) => (
              <div 
                key={index} 
                className="action-card"
                onClick={() => {
                  // Handle action based on action.action
                  // TODO: Implement proper action handling
                }}
              >
                <action.icon className="action-icon" />
                <h3 className="action-title">{action.title}</h3>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
} 