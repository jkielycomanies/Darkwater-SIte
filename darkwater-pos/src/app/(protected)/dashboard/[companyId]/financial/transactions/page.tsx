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
  date: string;
  amount: number;
  provider: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  vehicle: string;
  classification: string;
  purchase: string;
  movement: string;
  recurring: boolean;
  useful: boolean;
  description: string;
  // Legacy fields for compatibility
  category?: string;
  paymentMethod?: string;
  reference?: string;
  status?: 'completed' | 'pending' | 'cancelled';
  companyId: string;
}

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bikeInventory, setBikeInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    provider: '',
    name: '',
    type: 'expense',
    vehicle: '',
    classification: 'Operating',
    purchase: session?.user?.name || '',
    movement: '',
    recurring: false,
    useful: false,
    description: '',
    // Legacy fields for compatibility
    category: '',
    paymentMethod: 'Chase DC',
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
      fetchBikeInventory(params.companyId as string);
      // Try to load derived transactions from server
      fetchDerivedTransactions(params.companyId as string).catch(() => {});
    }
  }, [status, router, params]);

  // Update purchaser field when session becomes available
  useEffect(() => {
    if (session?.user?.name) {
      setNewTransaction(prev => ({
        ...prev,
        purchase: session.user.name
      }));
    }
  }, [session]);

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

  const fetchBikeInventory = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/inventory/bikes`);
      if (response.ok) {
        const data = await response.json();
        // Get all bikes regardless of status (sold, available, etc.)
        setBikeInventory(data.bikes || []);
      }
    } catch (error) {
      console.error('Failed to fetch bike inventory:', error);
      // Fallback data with VINs
      setBikeInventory([
        { _id: '1', vin: 'JYA1WE010MA000001', make: 'Yamaha', model: 'R1', year: 2024, status: 'Listed' },
        { _id: '2', vin: 'JKAZF2J18PA000001', make: 'Kawasaki', model: 'Ninja H2', year: 2024, status: 'Media' },
        { _id: '3', vin: 'WB10G3100PM000001', make: 'BMW', model: 'R1250GS', year: 2023, status: 'Servicing' },
        { _id: '4', vin: 'ZDM12AKU6PB000001', make: 'Ducati', model: 'Panigale V4', year: 2024, status: 'Evaluation' },
        { _id: '5', vin: 'JH2PC4104NM200001', make: 'Honda', model: 'CBR600RR', year: 2023, status: 'Sold' },
        { _id: '6', vin: 'JS1GR7H82N2100001', make: 'Suzuki', model: 'GSX-R750', year: 2022, status: 'Sold' },
      ]);
    }
  };

  const fetchTransactions = async (companyId: string) => {
    try {
      // Fetch transactions from database
      const response = await fetch(`/api/companies/${companyId}/financial/transactions`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      } else {
        console.log('Transactions API failed, no transactions found');
        setTransactions([]);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      // Use empty array as fallback
      setTransactions([]);
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

  const handleAddTransaction = async () => {
    if (newTransaction.amount && newTransaction.name && newTransaction.description) {
      try {
        if (editingTransaction) {
          // Update existing transaction
          const updatedTransaction: Transaction = {
            ...editingTransaction,
            date: newTransaction.date,
            amount: parseFloat(newTransaction.amount),
            provider: newTransaction.provider,
            name: newTransaction.name,
            type: newTransaction.type as 'income' | 'expense' | 'transfer',
            vehicle: newTransaction.vehicle,
            classification: newTransaction.classification,
            purchase: newTransaction.purchase,
            movement: newTransaction.movement,
            recurring: newTransaction.recurring,
            useful: newTransaction.useful,
            description: newTransaction.description,
            // Legacy fields for compatibility
            category: newTransaction.category,
            paymentMethod: newTransaction.paymentMethod,
            reference: newTransaction.reference || editingTransaction.reference,
            status: newTransaction.status as 'completed' | 'pending' | 'cancelled',
          };
          
          // Update in database
          const response = await fetch(`/api/companies/${params.companyId}/financial/transactions/${editingTransaction._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedTransaction),
          });
          
          if (response.ok) {
            setTransactions(prev => prev.map(t => t._id === editingTransaction._id ? updatedTransaction : t));
            setEditingTransaction(null);
          } else {
            alert('Failed to update transaction in database. Please try again.');
            return;
          }
        } else {
          // Add new transaction
          const transaction: Transaction = {
            _id: Math.random().toString(36).substr(2, 9),
            date: newTransaction.date,
            amount: parseFloat(newTransaction.amount),
            provider: newTransaction.provider,
            name: newTransaction.name,
            type: newTransaction.type as 'income' | 'expense' | 'transfer',
            vehicle: newTransaction.vehicle,
            classification: newTransaction.classification,
            purchase: newTransaction.purchase,
            movement: newTransaction.movement,
            recurring: newTransaction.recurring,
            useful: newTransaction.useful,
            description: newTransaction.description,
            // Legacy fields for compatibility
            category: newTransaction.category,
            paymentMethod: newTransaction.paymentMethod,
            reference: newTransaction.reference || `REF-${Date.now()}`,
            status: newTransaction.status as 'completed' | 'pending' | 'cancelled',
            companyId: params.companyId as string
          };
          
          // Save to database
          const response = await fetch(`/api/companies/${params.companyId}/financial/transactions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(transaction),
          });
          
          if (response.ok) {
            const savedTransaction = await response.json();
            setTransactions(prev => [savedTransaction.transaction || transaction, ...prev]);
          } else {
            alert('Failed to save transaction to database. Please try again.');
            return;
          }
        }
        
        setShowAddModal(false);
        resetForm();
      } catch (error) {
        console.error('Error saving transaction:', error);
        alert('Error saving transaction. Please try again.');
      }
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      date: transaction.date,
      amount: transaction.amount.toString(),
      provider: transaction.provider || '',
      name: transaction.name || '',
      type: transaction.type,
      vehicle: transaction.vehicle || '',
      classification: transaction.classification || 'Operating',
      purchase: transaction.purchase || '',
      movement: transaction.movement || '',
      recurring: transaction.recurring || false,
      useful: transaction.useful || false,
      description: transaction.description || '',
      // Legacy fields for compatibility
      category: transaction.category || '',
      paymentMethod: transaction.paymentMethod || 'Chase DC',
      reference: transaction.reference || '',
      status: transaction.status || 'completed'
    });
    setShowAddModal(true);
  };

  const handleDeleteTransaction = async () => {
    if (editingTransaction) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete this transaction?\n\n` +
        `Date: ${new Date(editingTransaction.date).toLocaleDateString()}\n` +
        `Amount: $${editingTransaction.amount.toLocaleString()}\n` +
        `Description: ${editingTransaction.description}\n\n` +
        `This action cannot be undone.`
      );
      
      if (confirmDelete) {
        try {
          // Delete from database
          const response = await fetch(`/api/companies/${params.companyId}/financial/transactions/${editingTransaction._id}`, {
            method: 'DELETE',
          });
          
          if (response.ok) {
            // Remove from local state only if database deletion was successful
            setTransactions(prev => prev.filter(t => t._id !== editingTransaction._id));
            setEditingTransaction(null);
            setShowAddModal(false);
            resetForm();
          } else {
            alert('Failed to delete transaction from database. Please try again.');
          }
        } catch (error) {
          console.error('Error deleting transaction:', error);
          alert('Error deleting transaction. Please try again.');
        }
      }
    }
  };

  const resetForm = () => {
    setNewTransaction({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      provider: '',
      name: '',
      type: 'expense',
      vehicle: '',
      classification: 'Operating',
      purchase: session?.user?.name || '',
      movement: '',
      recurring: false,
      useful: false,
      description: '',
      // Legacy fields for compatibility
      category: '',
      paymentMethod: 'Chase DC',
      reference: '',
      status: 'completed'
    });
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
                  <th style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Actions</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Amount</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Provider</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Payment Type</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Vehicle</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Classification</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Purchaser</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Movement</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Recurring</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Useful</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {/* Actions */}
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '0.375rem',
                          color: '#60a5fa',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.background = 'rgba(59, 130, 246, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.background = 'rgba(59, 130, 246, 0.2)';
                        }}
                      >
                        Edit
                      </button>
                    </td>
                    
                    {/* Date */}
                    <td style={{ padding: '0.75rem', color: 'white', fontSize: '0.75rem' }}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    
                    {/* Amount */}
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <span style={{
                        color: transaction.type === 'income' ? '#22c55e' : '#ef4444',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </span>
                    </td>
                    
                    {/* Provider */}
                    <td style={{ padding: '0.75rem', color: 'white', fontSize: '0.75rem' }}>
                      {transaction.provider || '-'}
                    </td>
                    
                    {/* Name */}
                    <td style={{ padding: '0.75rem', color: 'white', fontSize: '0.75rem' }}>
                      {transaction.name || '-'}
                    </td>
                    
                    {/* Payment Type */}
                    <td style={{ padding: '0.75rem', color: 'white', fontSize: '0.75rem' }}>
                      {transaction.paymentMethod || '-'}
                    </td>
                    
                    {/* Vehicle */}
                    <td style={{ padding: '0.75rem', color: 'white', fontSize: '0.75rem' }}>
                      {transaction.vehicle || '-'}
                    </td>
                    
                    {/* Classification */}
                    <td style={{ padding: '0.75rem', color: 'white', fontSize: '0.75rem' }}>
                      {transaction.classification || '-'}
                    </td>
                    
                    {/* Purchaser */}
                    <td style={{ padding: '0.75rem', color: 'white', fontSize: '0.75rem' }}>
                      {transaction.purchase || '-'}
                    </td>
                    
                    {/* Movement */}
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.625rem',
                        fontWeight: '500',
                        background: getTransactionTypeColor(transaction.type).bg,
                        color: getTransactionTypeColor(transaction.type).color,
                        border: `1px solid ${getTransactionTypeColor(transaction.type).border}`
                      }}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                    </td>
                    
                    {/* Recurring */}
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.625rem',
                        fontWeight: '500',
                        background: transaction.recurring ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                        color: transaction.recurring ? '#22c55e' : '#6b7280',
                        border: `1px solid ${transaction.recurring ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`
                      }}>
                        {transaction.recurring ? 'Yes' : 'No'}
                      </span>
                    </td>
                    
                    {/* Useful */}
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.625rem',
                        fontWeight: '500',
                        background: transaction.useful ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                        color: transaction.useful ? '#3b82f6' : '#6b7280',
                        border: `1px solid ${transaction.useful ? 'rgba(59, 130, 246, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`
                      }}>
                        {transaction.useful ? 'Yes' : 'No'}
                      </span>
                    </td>
                    
                    {/* Description */}
                    <td style={{ padding: '0.75rem', color: 'white', fontSize: '0.75rem', maxWidth: '150px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {transaction.description || '-'}
                      </div>
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
                {editingTransaction ? '✏️ Edit Transaction' : '💰 Add New Transaction'}
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

            {/* Row 1: Date, Amount, Provider, Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Date *
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
                    fontSize: '0.75rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
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
                    fontSize: '0.75rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Provider
                </label>
                <input
                  type="text"
                  value={newTransaction.provider}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, provider: e.target.value }))}
                  placeholder="e.g., Bank, Vendor"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={newTransaction.name}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Transaction name"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}
                />
              </div>
            </div>

            {/* Row 2: Payment Type, Vehicle, Classification, Purchaser */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Payment Type
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
                    fontSize: '0.75rem'
                  }}
                >
                  <option value="" style={{ background: '#1e293b', color: 'white' }}>Select Payment Type</option>
                  <option value="Chase DC" style={{ background: '#1e293b', color: 'white' }}>Chase DC</option>
                  <option value="Cash" style={{ background: '#1e293b', color: 'white' }}>Cash</option>
                  <option value="Check" style={{ background: '#1e293b', color: 'white' }}>Check</option>
                  <option value="Wire" style={{ background: '#1e293b', color: 'white' }}>Wire</option>
                </select>
              </div>
              
              <div style={{ position: 'relative' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Vehicle (VIN)
                </label>
                <input
                  type="text"
                  value={newTransaction.vehicle}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, vehicle: e.target.value }))}
                  placeholder="VIN"
                  list="vin-suggestions"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}
                />
                <datalist id="vin-suggestions">
                  {bikeInventory.map((bike) => (
                    <option key={bike._id} value={bike.vin}>
                      {bike.vin} - {bike.year} {bike.make} {bike.model} ({bike.status})
                    </option>
                  ))}
                </datalist>
              </div>
              
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Classification
                </label>
                <select
                  value={newTransaction.classification}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, classification: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}
                >
                  <option value="" style={{ background: '#1e293b', color: 'white' }}>Select Classification</option>
                  <option value="Operating" style={{ background: '#1e293b', color: 'white' }}>Operating</option>
                  <option value="Opening" style={{ background: '#1e293b', color: 'white' }}>Opening</option>
                  <option value="Cash Deposit" style={{ background: '#1e293b', color: 'white' }}>Cash Deposit</option>
                  <option value="Equipment" style={{ background: '#1e293b', color: 'white' }}>Equipment</option>
                </select>
              </div>
              
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Purchaser
                </label>
                <input
                  type="text"
                  value={newTransaction.purchase}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, purchase: e.target.value }))}
                  placeholder="Name of person who did transaction"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}
                />
              </div>
            </div>

            {/* Row 3: Movement, Recurring, Useful, Description */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Movement *
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
                    fontSize: '0.75rem'
                  }}
                >
                  <option value="income" style={{ background: '#1e293b', color: 'white' }}>Income</option>
                  <option value="expense" style={{ background: '#1e293b', color: 'white' }}>Expense</option>
                  <option value="transfer" style={{ background: '#1e293b', color: 'white' }}>Transfer</option>
                </select>
              </div>
              
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Recurring
                </label>
                <select
                  value={newTransaction.recurring.toString()}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, recurring: e.target.value === 'true' }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}
                >
                  <option value="false" style={{ background: '#1e293b', color: 'white' }}>No</option>
                  <option value="true" style={{ background: '#1e293b', color: 'white' }}>Yes</option>
                </select>
              </div>
              
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Useful
                </label>
                <select
                  value={newTransaction.useful.toString()}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, useful: e.target.value === 'true' }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}
                >
                  <option value="false" style={{ background: '#1e293b', color: 'white' }}>No</option>
                  <option value="true" style={{ background: '#1e293b', color: 'white' }}>Yes</option>
                </select>
              </div>
              
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Description *
                </label>
                <textarea
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the transaction..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.75rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: editingTransaction ? 'space-between' : 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              {editingTransaction && (
                <button
                  onClick={handleDeleteTransaction}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.375rem',
                    color: '#f87171',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background = 'rgba(239, 68, 68, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background = 'rgba(239, 68, 68, 0.2)';
                  }}
                >
                  🗑️ Delete Transaction
                </button>
              )}
              
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTransaction(null);
                    resetForm();
                  }}
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
                  disabled={!newTransaction.amount || !newTransaction.name || !newTransaction.description}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: (!newTransaction.amount || !newTransaction.name || !newTransaction.description)
                      ? 'rgba(107, 114, 128, 0.3)'
                      : 'rgba(139, 92, 246, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.875rem',
                    cursor: (!newTransaction.amount || !newTransaction.name || !newTransaction.description)
                      ? 'not-allowed'
                      : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
