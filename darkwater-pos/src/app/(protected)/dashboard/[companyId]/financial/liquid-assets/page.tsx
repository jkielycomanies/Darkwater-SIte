'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import '../../dashboard.css';
import RevaniPortalHeader from '../../../../../../components/RevaniPortalHeader';
import {
  BanknotesIcon,
  BuildingLibraryIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface BankAccount {
  _id: string;
  name: string;
  institution: string;
  accountType: 'checking' | 'savings' | 'money_market' | 'operating' | 'reserve';
  last4?: string;
  balance: number;
  updatedAt: string;
}

interface CashLocation {
  _id: string;
  name: string;
  locationType: 'register' | 'safe' | 'petty_cash' | 'atm' | 'other';
  address?: string;
  balance: number;
  updatedAt: string;
}

export default function LiquidAssetsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();

  const [company, setCompany] = useState<Company | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashLocations, setCashLocations] = useState<CashLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (params?.companyId) {
      fetchCompany(params.companyId as string);
      loadMockData();
      // Pull derived balances/transactions from server if present
      fetchDerivedFinancials(params.companyId as string).catch(() => {});
    }
  }, [status, router, params]);

  const fetchCompany = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
      } else if (response.status === 404) {
        router.push('/select');
      }
    } catch (e) {
      console.error('Failed to fetch company', e);
      router.push('/select');
    }
  };

  const loadMockData = () => {
    setIsLoading(true);
    setBankAccounts([]);
    setCashLocations([]);
    setIsLoading(false);
  };

  const totalBank = bankAccounts.reduce((s, a) => s + a.balance, 0);
  const totalCash = cashLocations.reduce((s, c) => s + c.balance, 0);
  const totalLiquid = totalBank + totalCash;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  // Removed Chase demo integration and mapping functions

  const fetchDerivedFinancials = async (companyId: string) => {
    try {
      const res = await fetch(`/api/companies/${companyId}/financial`);
      if (!res.ok) return;
      const json = await res.json();
      const lastBalance = (json?.balances || [])[0];
      if (lastBalance && typeof lastBalance.amount === 'number') {
        // Update the first bank account balance to reflect derived snapshot
        setBankAccounts(prev => {
          if (prev.length === 0) return prev;
          const copy = [...prev];
          copy[0] = { ...copy[0], balance: lastBalance.amount, updatedAt: new Date().toISOString() };
          return copy;
        });
      }
    } catch {}
  };

  // New: CRUD helpers for bank accounts
  const refreshAccounts = async () => {
    const res = await fetch(`/api/companies/${company?._id || params.companyId}/financial/accounts`);
    if (!res.ok) return;
    const json = await res.json();
    setBankAccounts(json.accounts || []);
  };

  useEffect(() => {
    if (company?._id) {
      refreshAccounts();
    }
  }, [company?._id]);

  const addAccount = async () => {
    const name = prompt('Account Name');
    if (!name) return;
    const institution = prompt('Institution (e.g., Chase)') || '';
    const accountType = prompt('Type (checking, savings, money_market, operating, reserve)', 'checking') || 'checking';
    const last4 = prompt('Last 4 (optional)') || '';
    const balanceStr = prompt('Balance (number)', '0') || '0';
    const balance = Number(balanceStr) || 0;
    await fetch(`/api/companies/${company?._id || params.companyId}/financial/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, institution, accountType, last4, balance })
    });
    await refreshAccounts();
  };

  const editAccount = async (acc: BankAccount) => {
    const name = prompt('Account Name', acc.name) || acc.name;
    const institution = prompt('Institution', acc.institution) || acc.institution;
    const accountType = prompt('Type', acc.accountType) || acc.accountType;
    const last4 = prompt('Last 4', acc.last4 || '') || acc.last4 || '';
    const balanceStr = prompt('Balance', String(acc.balance)) || String(acc.balance);
    const balance = Number(balanceStr) || acc.balance;
    await fetch(`/api/companies/${company?._id || params.companyId}/financial/accounts/${acc._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, institution, accountType, last4, balance })
    });
    await refreshAccounts();
  };

  const deleteAccount = async (acc: BankAccount) => {
    if (!confirm(`Delete ${acc.name}?`)) return;
    await fetch(`/api/companies/${company?._id || params.companyId}/financial/accounts/${acc._id}`, { method: 'DELETE' });
    await refreshAccounts();
  };

  if (status === 'loading' || isLoading || !company) {
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

  return (
    <div className="dashboard-container">
      <div className="background-pattern"></div>
      <div className="floating-elements">
        <div className="floating-orb purple"></div>
        <div className="floating-orb blue"></div>
        <div className="floating-orb green"></div>
      </div>

      <RevaniPortalHeader company={company} activePage="financial" />

      <main className="dashboard-main" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => router.push(`/dashboard/${company.slug}/financial`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '0.5rem', color: '#8b5cf6', fontSize: '0.875rem', padding: '0.5rem 0.75rem', cursor: 'pointer'
              }}
            >
              <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
              Back to Financial
            </button>
            <h2 className="section-header" style={{ margin: 0 }}>Liquid Assets</h2>
          </div>
          {/* Removed Connect Chase (Demo) button */}
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <CurrencyDollarIcon className="kpi-icon" style={{ color: '#22c55e' }} />
            <div className="kpi-value" style={{ color: '#22c55e' }}>{formatCurrency(totalLiquid)}</div>
            <div className="kpi-title">Total Liquid Assets</div>
          </div>
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <BuildingLibraryIcon className="kpi-icon" style={{ color: '#3b82f6' }} />
            <div className="kpi-value" style={{ color: '#3b82f6' }}>{formatCurrency(totalBank)}</div>
            <div className="kpi-title">Bank Accounts</div>
          </div>
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <BanknotesIcon className="kpi-icon" style={{ color: '#f59e0b' }} />
            <div className="kpi-value" style={{ color: '#f59e0b' }}>{formatCurrency(totalCash)}</div>
            <div className="kpi-title">Cash On Hand</div>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Bank Accounts */}
          <div className="kpi-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Bank Accounts</h3>
              <button
                onClick={refreshAccounts}
                title="Refresh"
                style={{ background: 'transparent', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#94a3b8', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
              >
                <ArrowPathIcon style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {bankAccounts.map(acc => (
                <div key={acc._id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '0.5rem' }}>
                  <div>
                    <div style={{ color: 'white', fontWeight: 600 }}>{acc.name} • {acc.institution}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{acc.accountType.toUpperCase()} {acc.last4 ? `• • • • ${acc.last4}` : ''}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Updated {new Date(acc.updatedAt).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ color: '#3b82f6', fontWeight: 700 }}>{formatCurrency(acc.balance)}</div>
                    <button onClick={() => editAccount(acc)} style={{ background: 'transparent', border: '1px solid rgba(59,130,246,0.4)', color: '#3b82f6', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => deleteAccount(acc)} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
              {bankAccounts.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>No bank accounts</div>
              )}
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <button onClick={addAccount} style={{ background: 'transparent', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', cursor: 'pointer' }}>
                + Add Account
              </button>
            </div>
          </div>

          {/* Cash Locations */}
          <div className="kpi-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Cash Locations</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cashLocations.map(loc => (
                <div key={loc._id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '0.5rem' }}>
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPinIcon style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />
                      {loc.name}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{loc.locationType.replace('_', ' ').toUpperCase()}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Updated {new Date(loc.updatedAt).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#f59e0b', fontWeight: 700 }}>{formatCurrency(loc.balance)}</div>
                  </div>
                </div>
              ))}
              {cashLocations.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>No cash locations</div>
              )}
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="kpi-card" style={{ marginTop: '2rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheckIcon style={{ width: '1rem', height: '1rem', color: '#22c55e' }} />
          <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Bank and cash balances are mock data. Wire this page to your accounting/ledger API when ready.</div>
        </div>

        {/* Removed Chase demo response block */}
      </main>
    </div>
  );
}


