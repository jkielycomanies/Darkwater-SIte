'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../../dashboard.css';
import RevaniPortalHeader from '../../../../../../components/RevaniPortalHeader';
import { 
  ArrowLeftIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  BanknotesIcon,
  CreditCardIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface Transaction {
  _id: string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentMethod: string;
  reference: string;
  status: 'completed' | 'pending' | 'cancelled';
  companyId: string;
}

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    reference: '',
    status: 'completed'
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (params?.companyId) {
      fetchCompanyData(params.companyId as string);
      fetchTransactions(params.companyId as string);
      // Try to load derived transactions from server
      fetchDerivedTransactions(params.companyId as string).catch(() => {});
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
    }
  };

  const fetchTransactions = async (companyId: string) => {
    try {
      // For now, using mock data. In production, this would fetch from an API
      const mockTransactions: Transaction[] = [
        {
          _id: '1',
          type: 'income',
          category: 'Sales',
          amount: 25000,
          description: 'Motorcycle sale - Yamaha R1',
          date: '2024-01-15',
          paymentMethod: 'Financing',
          reference: 'SALE-001',
          status: 'completed',
          companyId: companyId
        },
        {
          _id: '2',
          type: 'expense',
          category: 'Parts',
          amount: 850,
          description: 'Brake pads and oil filter',
          date: '2024-01-14',
          paymentMethod: 'Credit Card',
          reference: 'EXP-001',
          status: 'completed',
          companyId: companyId
        },
        {
          _id: '3',
          type: 'income',
          category: 'Service',
          amount: 1200,
          description: 'Full service - Honda CBR600RR',
          date: '2024-01-13',
          paymentMethod: 'Cash',
          reference: 'SVC-001',
          status: 'completed',
          companyId: companyId
        },
        {
          _id: '4',
          type: 'expense',
          category: 'Transportation',
          amount: 300,
          description: 'Bike pickup from auction',
          date: '2024-01-12',
          paymentMethod: 'Cash',
          reference: 'TRANS-001',
          status: 'completed',
          companyId: companyId
        },
        {
          _id: '5',
          type: 'income',
          category: 'Accessories',
          amount: 450,
          description: 'Helmet and riding gear sale',
          date: '2024-01-11',
          paymentMethod: 'Credit Card',
          reference: 'ACC-001',
          status: 'pending',
          companyId: companyId
        }
      ];
      
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDerivedTransactions = async (companyId: string) => {
    try {
      const res = await fetch(`/api/companies/${companyId}/financial`);
      if (!res.ok) return;
      const json = await res.json();
      const derived = (json?.transactions || []).map((t: any, idx: number) => ({
        _id: t.sourceId || `derived-${idx}`,
        type: t.type === 'income' ? 'income' : 'expense',
        category: 'Bank',
        amount: Number(t.amount) || 0,
        description: t.description || t.subject || 'Bank alert',
        date: new Date(t.at).toISOString().split('T')[0],
        paymentMethod: 'Bank',
        reference: String(t.sourceId || ''),
        status: 'completed',
        companyId: companyId
      }));
      if (derived.length) {
        setTransactions(prev => [...derived, ...prev]);
      }
    } catch {}
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netProfit = totalIncome - totalExpenses;

  const handleAddTransaction = () => {
    if (newTransaction.category && newTransaction.amount && newTransaction.description) {
      const transaction: Transaction = {
        _id: Math.random().toString(36).substr(2, 9),
        type: newTransaction.type as 'income' | 'expense' | 'transfer',
        category: newTransaction.category,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        date: newTransaction.date,
        paymentMethod: newTransaction.paymentMethod,
        reference: newTransaction.reference || `REF-${Date.now()}`,
        status: newTransaction.status as 'completed' | 'pending' | 'cancelled',
        companyId: params.companyId as string
      };
      
      setTransactions(prev => [transaction, ...prev]);
      setShowAddModal(false);
      setNewTransaction({
        type: 'expense',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        reference: '',
        status: 'completed'
      });
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

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '#22c55e40' };
      case 'expense':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '#ef444440' };
      case 'transfer':
        return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '#3b82f640' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280', border: '#6b728040' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' };
      case 'pending':
        return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' };
      case 'cancelled':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280' };
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

      <RevaniPortalHeader company={company} activePage="financial" />

      {/* Main Content */}
      <main className="dashboard-main">


        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 className="section-header">Transaction Records</h2>
            <p style={{ color: '#94a3b8', margin: 0 }}>Track all financial transactions for {company.name}</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
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
            <PlusIcon style={{ width: '1rem', height: '1rem' }} />
            Add Transaction
          </button>
        </div>

        {/* Financial Summary Cards */}
        <div className="kpi-grid kpi-grid-3" style={{ marginBottom: '2rem' }}>
          <div className="kpi-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <CurrencyDollarIcon style={{ width: '2rem', height: '2rem', color: '#22c55e' }} />
            </div>
            <div style={{ color: '#22c55e', fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              ${totalIncome.toLocaleString()}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Income</div>
          </div>
          
                           <div className="kpi-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                     <DocumentTextIcon style={{ width: '2rem', height: '2rem', color: '#ef4444' }} />
                   </div>
                   <div style={{ color: '#ef4444', fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                     ${totalExpenses.toLocaleString()}
                   </div>
                   <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Expenses</div>
                 </div>
          
          <div className="kpi-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <ChartBarIcon style={{ width: '2rem', height: '2rem', color: netProfit >= 0 ? '#22c55e' : '#ef4444' }} />
            </div>
            <div style={{ color: netProfit >= 0 ? '#22c55e' : '#ef4444', fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              ${netProfit.toLocaleString()}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Net Profit</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="kpi-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
            {/* Search */}
            <div>
              <label style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                Search
              </label>
              <div style={{ position: 'relative' }}>
                <MagnifyingGlassIcon style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search transactions..."
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.375rem',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
              >
                <option value="all" style={{ background: '#1e293b', color: 'white' }}>All Types</option>
                <option value="income" style={{ background: '#1e293b', color: 'white' }}>Income</option>
                <option value="expense" style={{ background: '#1e293b', color: 'white' }}>Expense</option>
                <option value="transfer" style={{ background: '#1e293b', color: 'white' }}>Transfer</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.375rem',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
              >
                <option value="all" style={{ background: '#1e293b', color: 'white' }}>All Statuses</option>
                <option value="completed" style={{ background: '#1e293b', color: 'white' }}>Completed</option>
                <option value="pending" style={{ background: '#1e293b', color: 'white' }}>Pending</option>
                <option value="cancelled" style={{ background: '#1e293b', color: 'white' }}>Cancelled</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterStatus('all');
              }}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.375rem',
                color: '#94a3b8',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = 'rgba(255, 255, 255, 0.2)';
                (e.target as HTMLElement).style.color = 'white';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
                (e.target as HTMLElement).style.color = '#94a3b8';
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="kpi-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
              Transactions ({filteredTransactions.length})
            </h3>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>Type</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>Category</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>Description</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>Payment Method</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>Reference</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '1rem', color: 'white', fontSize: '0.875rem' }}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        background: getTransactionTypeColor(transaction.type).bg,
                        color: getTransactionTypeColor(transaction.type).color,
                        border: `1px solid ${getTransactionTypeColor(transaction.type).border}`
                      }}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'white', fontSize: '0.875rem' }}>
                      {transaction.category}
                    </td>
                    <td style={{ padding: '1rem', color: 'white', fontSize: '0.875rem', maxWidth: '200px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {transaction.description}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <span style={{
                        color: transaction.type === 'income' ? '#22c55e' : '#ef4444',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'white', fontSize: '0.875rem' }}>
                      {transaction.paymentMethod}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        background: getStatusColor(transaction.status).bg,
                        color: getStatusColor(transaction.status).color
                      }}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      {transaction.reference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
                           {filteredTransactions.length === 0 && (
                   <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                     <DocumentTextIcon style={{ width: '3rem', height: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
                     <p style={{ margin: 0, fontSize: '1rem' }}>No transactions found</p>
                     <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', opacity: 0.7 }}>
                       Try adjusting your filters or add a new transaction
                     </p>
                   </div>
                 )}
        </div>
      </main>

      {/* Add Transaction Modal */}
      {showAddModal && (
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
          padding: '1rem'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                💰 Add New Transaction
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
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
              {/* Transaction Type */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Type *
                </label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="income" style={{ background: '#1e293b', color: 'white' }}>Income</option>
                  <option value="expense" style={{ background: '#1e293b', color: 'white' }}>Expense</option>
                  <option value="transfer" style={{ background: '#1e293b', color: 'white' }}>Transfer</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Category *
                </label>
                <input
                  type="text"
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Sales, Parts, Service"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Amount */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Amount *
                </label>
                <input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Date */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Payment Method
                </label>
                <select
                  value={newTransaction.paymentMethod}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="Cash" style={{ background: '#1e293b', color: 'white' }}>Cash</option>
                  <option value="Credit Card" style={{ background: '#1e293b', color: 'white' }}>Credit Card</option>
                  <option value="Debit Card" style={{ background: '#1e293b', color: 'white' }}>Debit Card</option>
                  <option value="Bank Transfer" style={{ background: '#1e293b', color: 'white' }}>Bank Transfer</option>
                  <option value="Financing" style={{ background: '#1e293b', color: 'white' }}>Financing</option>
                  <option value="Check" style={{ background: '#1e293b', color: 'white' }}>Check</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Status
                </label>
                <select
                  value={newTransaction.status}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="completed" style={{ background: '#1e293b', color: 'white' }}>Completed</option>
                  <option value="pending" style={{ background: '#1e293b', color: 'white' }}>Pending</option>
                  <option value="cancelled" style={{ background: '#1e293b', color: 'white' }}>Cancelled</option>
                </select>
              </div>

              {/* Reference */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Reference
                </label>
                <input
                  type="text"
                  value={newTransaction.reference}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="e.g., SALE-001, EXP-001"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Description *
                </label>
                <textarea
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the transaction..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.375rem',
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTransaction}
                disabled={!newTransaction.category || !newTransaction.amount || !newTransaction.description}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: (!newTransaction.category || !newTransaction.amount || !newTransaction.description)
                    ? 'rgba(107, 114, 128, 0.3)'
                    : 'rgba(139, 92, 246, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  borderRadius: '0.375rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  cursor: (!newTransaction.category || !newTransaction.amount || !newTransaction.description)
                    ? 'not-allowed'
                    : 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
