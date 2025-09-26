'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../../../../dashboard.css';
import RevaniPortalHeader from '@/components/RevaniPortalHeader';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface FinancialImportItem {
  id: string;
  transactionDate: string;
  transactionType: 'sale' | 'purchase' | 'refund' | 'expense' | 'income' | 'transfer';
  amount: number;
  description: string;
  customerVendor: string;
  invoiceNumber: string;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'check' | 'bank_transfer' | 'digital_wallet';
  status: 'completed' | 'pending' | 'cancelled' | 'failed';
  category: string;
  taxAmount: number;
  notes: string;
  errors?: string[];
  warnings?: string[];
}

export default function FinancialImportFormPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [importItems, setImportItems] = useState<FinancialImportItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: number;
    warnings: number;
  }>({ success: 0, errors: 0, warnings: 0 });

  const transactionTypes = [
    { value: 'sale', label: 'Sale', color: 'text-green-500' },
    { value: 'purchase', label: 'Purchase', color: 'text-blue-500' },
    { value: 'refund', label: 'Refund', color: 'text-yellow-500' },
    { value: 'expense', label: 'Expense', color: 'text-red-500' },
    { value: 'income', label: 'Income', color: 'text-emerald-500' },
    { value: 'transfer', label: 'Transfer', color: 'text-purple-500' }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'check', label: 'Check' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'digital_wallet', label: 'Digital Wallet' }
  ];

  const statusOptions = [
    { value: 'completed', label: 'Completed', color: 'text-green-500' },
    { value: 'pending', label: 'Pending', color: 'text-yellow-500' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-500' },
    { value: 'failed', label: 'Failed', color: 'text-gray-500' }
  ];

  const categories = [
    'Vehicle Sales', 'Parts Sales', 'Service Revenue', 'Accessories',
    'Parts Purchase', 'Equipment Purchase', 'Utilities', 'Rent',
    'Insurance', 'Maintenance', 'Marketing', 'Office Supplies',
    'Employee Wages', 'Taxes', 'Other'
  ];

  useEffect(() => {
    if (session) {
      fetchCompanyData();
    }
  }, [session]);

  const fetchCompanyData = async () => {
    try {
      const response = await fetch(`/api/companies/${params.companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
      }
    } catch (error) {
      console.error('Failed to fetch company:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNewItem = () => {
    const newItem: FinancialImportItem = {
      id: `temp-${Date.now()}`,
      transactionDate: new Date().toISOString().split('T')[0],
      transactionType: 'sale',
      amount: 0,
      description: '',
      customerVendor: '',
      invoiceNumber: '',
      paymentMethod: 'cash',
      status: 'completed',
      category: '',
      taxAmount: 0,
      notes: ''
    };
    setImportItems([...importItems, newItem]);
  };

  const removeItem = (id: string) => {
    setImportItems(importItems.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof FinancialImportItem, value: any) => {
    setImportItems(importItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const validateItem = (item: FinancialImportItem): { errors: string[], warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!item.transactionDate) errors.push('Transaction date is required');
    if (!item.description.trim()) errors.push('Description is required');
    if (!item.customerVendor.trim()) errors.push('Customer/Vendor is required');
    if (!item.invoiceNumber.trim()) errors.push('Invoice number is required');
    if (!item.category.trim()) errors.push('Category is required');

    // Data validation
    if (item.amount <= 0) errors.push('Amount must be greater than 0');
    if (item.taxAmount < 0) warnings.push('Tax amount should not be negative');
    if (item.taxAmount > item.amount) warnings.push('Tax amount cannot exceed total amount');
    
    const transactionDate = new Date(item.transactionDate);
    const today = new Date();
    if (transactionDate > today) warnings.push('Transaction date is in the future');

    return { errors, warnings };
  };

  const validateAllItems = () => {
    const validatedItems = importItems.map(item => ({
      ...item,
      ...validateItem(item)
    }));
    setImportItems(validatedItems);
    return validatedItems.every(item => item.errors.length === 0);
  };

  const handleImport = async () => {
    if (!validateAllItems()) {
      alert('Please fix all errors before importing');
      return;
    }

    setImporting(true);
    setImportProgress(0);
    
    let success = 0;
    let errors = 0;
    let warnings = 0;

    for (let i = 0; i < importItems.length; i++) {
      const item = importItems[i];
      
      try {
        // Here you would make the actual API call to create the financial transaction
        // For now, we'll simulate the import
        await new Promise(resolve => setTimeout(resolve, 200));
        success++;
      } catch (error) {
        errors++;
      }

      if (item.warnings && item.warnings.length > 0) {
        warnings++;
      }

      setImportProgress(((i + 1) / importItems.length) * 100);
    }

    setImportResults({ success, errors, warnings });
    setImporting(false);
  };

  const goBack = () => {
    router.push(`/dashboard/${params.companyId}/tools/mass-import`);
  };

  if (loading) {
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

  return (
    <div className="dashboard-container">
      <RevaniPortalHeader company={company} activePage="tools" />
      
      <div className="dashboard-content" style={{ marginTop: '2rem' }}>
        <div className="content-header">
          <div className="header-left">
            <button onClick={goBack} className="back-button">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Import Categories
            </button>
          </div>
          <div className="header-center">
            <h1>Financial Transactions Import Form</h1>
            <p>Add multiple financial records with all required information</p>
          </div>
        </div>

        {importItems.length === 0 ? (
          <div className="empty-state">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mb-4" />
            <h3>No transactions added yet</h3>
            <p>Click "Add Transaction" to start importing your financial records</p>
            <button onClick={addNewItem} className="primary-button">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Your First Transaction
            </button>
          </div>
        ) : (
          <>
            <div className="import-items">
              {importItems.map((item, index) => (
                <div key={item.id} className="import-item-card">
                  <div className="item-header">
                    <h3>Transaction #{index + 1}</h3>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="remove-button"
                      disabled={importing}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="form-grid">
                    {/* Basic Transaction Information */}
                    <div className="form-section">
                      <h4>Transaction Details</h4>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Transaction Date *</label>
                          <input
                            type="date"
                            value={item.transactionDate}
                            onChange={(e) => updateItem(item.id, 'transactionDate', e.target.value)}
                            className={item.errors?.includes('Transaction date is required') ? 'error' : ''}
                          />
                        </div>
                        <div className="form-group">
                          <label>Transaction Type</label>
                          <select
                            value={item.transactionType}
                            onChange={(e) => updateItem(item.id, 'transactionType', e.target.value)}
                          >
                            {transactionTypes.map(type => (
                              <option key={type.value} value={type.value} className={type.color}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Amount *</label>
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => updateItem(item.id, 'amount', parseFloat(e.target.value))}
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            className={item.errors?.includes('Amount must be greater than 0') ? 'error' : ''}
                          />
                        </div>
                        <div className="form-group">
                          <label>Tax Amount</label>
                          <input
                            type="number"
                            value={item.taxAmount}
                            onChange={(e) => updateItem(item.id, 'taxAmount', parseFloat(e.target.value))}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className={item.warnings?.includes('Tax amount should not be negative') ? 'warning' : ''}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Category *</label>
                          <select
                            value={item.category}
                            onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                            className={item.errors?.includes('Category is required') ? 'error' : ''}
                          >
                            <option value="">Select Category</option>
                            {categories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Status</label>
                          <select
                            value={item.status}
                            onChange={(e) => updateItem(item.id, 'status', e.target.value)}
                          >
                            {statusOptions.map(status => (
                              <option key={status.value} value={status.value} className={status.color}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Customer/Vendor Information */}
                    <div className="form-section">
                      <h4>Customer/Vendor Information</h4>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Customer/Vendor *</label>
                          <input
                            type="text"
                            value={item.customerVendor}
                            onChange={(e) => updateItem(item.id, 'customerVendor', e.target.value)}
                            placeholder="Customer or vendor name"
                            className={item.errors?.includes('Customer/Vendor is required') ? 'error' : ''}
                          />
                        </div>
                        <div className="form-group">
                          <label>Invoice Number *</label>
                          <input
                            type="text"
                            value={item.invoiceNumber}
                            onChange={(e) => updateItem(item.id, 'invoiceNumber', e.target.value)}
                            placeholder="Invoice or reference number"
                            className={item.errors?.includes('Invoice number is required') ? 'error' : ''}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Payment Method</label>
                          <select
                            value={item.paymentMethod}
                            onChange={(e) => updateItem(item.id, 'paymentMethod', e.target.value)}
                          >
                            {paymentMethods.map(method => (
                              <option key={method.value} value={method.value}>{method.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Description *</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Transaction description"
                            className={item.errors?.includes('Description is required') ? 'error' : ''}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="form-section">
                      <h4>Additional Information</h4>
                      <div className="form-row">
                        <div className="form-group full-width">
                          <label>Notes</label>
                          <textarea
                            value={item.notes}
                            onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                            placeholder="Additional notes about this transaction..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validation Messages */}
                  {(item.errors && item.errors.length > 0) || (item.warnings && item.warnings.length > 0) ? (
                    <div className="validation-messages">
                      {item.errors && item.errors.length > 0 && (
                        <div className="error-messages">
                          {item.errors.map((error, i) => (
                            <div key={i} className="error-message">
                              <ExclamationTriangleIcon className="h-4 w-4" />
                              {error}
                            </div>
                          ))}
                        </div>
                      )}
                      {item.warnings && item.warnings.length > 0 && (
                        <div className="warning-messages">
                          {item.warnings.map((warning, i) => (
                            <div key={i} className="warning-message">
                              <ExclamationTriangleIcon className="h-4 w-4" />
                              {warning}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="validation-success">
                      <CheckCircleIcon className="h-4 w-4" />
                      All required fields completed
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Import Actions */}
            <div className="import-actions">
              <div className="import-summary">
                <div className="summary-item">
                  <span className="label">Total Transactions:</span>
                  <span className="value">{importItems.length}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Valid:</span>
                  <span className="value success">
                    {importItems.filter(item => !item.errors || item.errors.length === 0).length}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">With Errors:</span>
                  <span className="value error">
                    {importItems.filter(item => item.errors && item.errors.length > 0).length}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">Total Amount:</span>
                  <span className="value">
                    ${importItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  onClick={addNewItem}
                  className="secondary-button"
                  disabled={importing}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Another Transaction
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || importItems.some(item => item.errors && item.errors.length > 0)}
                  className="primary-button"
                >
                  {importing ? (
                    <>
                      <div className="spinner mr-2"></div>
                      Importing {importProgress.toFixed(0)}%...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Import {importItems.length} Transactions
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Import Results */}
            {importResults.success > 0 || importResults.errors > 0 ? (
              <div className="import-results">
                <h3>Import Results</h3>
                <div className="results-grid">
                  <div className="result-item success">
                    <CheckCircleIcon className="h-6 w-6" />
                    <div>
                      <span className="result-count">{importResults.success}</span>
                      <span className="result-label">Successfully Imported</span>
                    </div>
                  </div>
                  <div className="result-item error">
                    <ExclamationTriangleIcon className="h-6 w-6" />
                    <div>
                      <span className="result-count">{importResults.errors}</span>
                      <span className="result-label">Failed to Import</span>
                    </div>
                  </div>
                  <div className="result-item warning">
                    <ExclamationTriangleIcon className="h-6 w-6" />
                    <div>
                      <span className="result-count">{importResults.warnings}</span>
                      <span className="result-label">Warnings</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <style jsx>{`
        .content-header {
          margin-bottom: 2rem;
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 4rem;
        }

        .header-center {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          width: 100%;
          pointer-events: none;
        }

        .header-center h1 {
          color: white;
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
        }

        .header-center p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.125rem;
          margin: 0;
        }

        .header-left {
          z-index: 1;
          pointer-events: auto;
        }

        .header-left h1 {
          color: white;
          font-size: 2rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem 0;
        }

        .header-left p {
          color: #94a3b8;
          font-size: 1.125rem;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          background: transparent;
          color: #8b5cf6;
          padding: 0.5rem 1rem;
          border: 1px solid #8b5cf6;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.3s ease;
          margin-bottom: 1rem;
        }

        .back-button:hover {
          background: #8b5cf6;
          color: white;
        }

        .add-button {
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .add-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
        }

        .add-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }

        .empty-state h3 {
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #94a3b8;
          margin-bottom: 2rem;
        }

        .primary-button {
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
        }

        .import-items {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .import-item-card {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 16px;
          padding: 2rem;
          backdrop-filter: blur(10px);
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
        }

        .item-header h3 {
          color: white;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .remove-button {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: #ef4444;
          padding: 0.5rem;
          border: 1px solid #ef4444;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 40px;
          height: 40px;
        }

        .remove-button:hover:not(:disabled) {
          background: #ef4444;
          color: white;
        }

        .form-grid {
          display: grid;
          gap: 2rem;
        }

        .form-section {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .form-section h4 {
          color: white;
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          color: #e2e8f0;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 6px;
          padding: 0.75rem;
          color: white;
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .form-group input.error,
        .form-group select.error,
        .form-group textarea.error {
          border-color: #ef4444;
        }

        .form-group input.warning,
        .form-group select.warning,
        .form-group textarea.warning {
          border-color: #f59e0b;
        }

        .validation-messages {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(15, 23, 42, 0.6);
          border-radius: 8px;
        }

        .error-messages,
        .warning-messages {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .error-message,
        .warning-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .error-message {
          color: #ef4444;
        }

        .warning-message {
          color: #f59e0b;
        }

        .validation-success {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #10b981;
          font-size: 0.875rem;
          font-weight: 500;
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
        }

        .import-actions {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 16px;
          padding: 2rem;
          backdrop-filter: blur(10px);
          margin-bottom: 2rem;
        }

        .import-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .summary-item .label {
          color: #94a3b8;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .summary-item .value {
          color: white;
          font-size: 2rem;
          font-weight: 700;
        }

        .summary-item .value.success {
          color: #10b981;
        }

        .summary-item .value.error {
          color: #ef4444;
        }

        .action-buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .secondary-button {
          display: inline-flex;
          align-items: center;
          background: transparent;
          color: #8b5cf6;
          padding: 0.75rem 1.5rem;
          border: 1px solid #8b5cf6;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .secondary-button:hover:not(:disabled) {
          background: #8b5cf6;
          color: white;
        }

        .import-results {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 16px;
          padding: 2rem;
          backdrop-filter: blur(10px);
        }

        .import-results h3 {
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .result-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          border-radius: 12px;
          font-weight: 500;
        }

        .result-item.success {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .result-item.error {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .result-item.warning {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .result-count {
          display: block;
          font-size: 2rem;
          font-weight: 700;
        }

        .result-label {
          display: block;
          font-size: 0.875rem;
          opacity: 0.8;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .import-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
