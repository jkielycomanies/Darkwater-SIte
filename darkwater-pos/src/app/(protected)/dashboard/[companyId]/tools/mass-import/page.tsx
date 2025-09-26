'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../../dashboard.css';
import RevaniPortalHeader from '../../../../../../components/RevaniPortalHeader';
import {
  CloudArrowUpIcon,
  DocumentArrowUpIcon,
  TableCellsIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon,
  DocumentTextIcon,
  TableCellsIcon as ExcelIcon,
  DocumentIcon,
  PhotoIcon,
  TruckIcon,
  CogIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface ImportItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  status: string;
  vin: string;
  mileage: number;
  description: string;
  errors?: string[];
  warnings?: string[];
}

interface ImportCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  supportedFormats: string[];
  templateUrl: string;
  fields: string[];
}

export default function MassImportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('bikes');
  const [importData, setImportData] = useState<ImportItem[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: number;
    warnings: number;
  }>({ success: 0, errors: 0, warnings: 0 });

  const importCategories: ImportCategory[] = [
    {
      id: 'bikes',
      name: 'Bikes & Motorcycles',
      description: 'Import motorcycle inventory with VIN, specs, and pricing',
      icon: TruckIcon,
      supportedFormats: ['.xlsx', '.xls', '.csv', '.pdf'],
      templateUrl: '/templates/bikes-import-template.xlsx',
      fields: ['Name', 'Brand', 'Model', 'Year', 'Price', 'Status', 'VIN', 'Mileage', 'Description']
    },
    {
      id: 'parts',
      name: 'Parts & Components',
      description: 'Import parts inventory with SKUs and specifications',
      icon: CogIcon,
      supportedFormats: ['.xlsx', '.xls', '.csv'],
      templateUrl: '/templates/parts-import-template.xlsx',
      fields: ['Part Number', 'Name', 'Brand', 'Category', 'Price', 'Stock', 'Location', 'Description']
    },
    {
      id: 'accessories',
      name: 'Accessories',
      description: 'Import accessories and gear inventory',
      icon: PhotoIcon,
      supportedFormats: ['.xlsx', '.xls', '.csv'],
      templateUrl: '/templates/accessories-import-template.xlsx',
      fields: ['SKU', 'Name', 'Category', 'Brand', 'Price', 'Stock', 'Description']
    },
    {
      id: 'customers',
      name: 'Customer Database',
      description: 'Import customer information and contact details',
      icon: UserGroupIcon,
      supportedFormats: ['.xlsx', '.xls', '.csv'],
      templateUrl: '/templates/customers-import-template.xlsx',
      fields: ['First Name', 'Last Name', 'Email', 'Phone', 'Address', 'City', 'State', 'Zip']
    },
    {
      id: 'services',
      name: 'Service Records',
      description: 'Import service history and maintenance records',
      icon: WrenchScrewdriverIcon,
      supportedFormats: ['.xlsx', '.xls', '.csv'],
      templateUrl: '/templates/services-import-template.xlsx',
      fields: ['VIN', 'Service Date', 'Service Type', 'Technician', 'Parts Used', 'Labor Hours', 'Total Cost']
    },
    {
      id: 'financial',
      name: 'Financial Transactions',
      description: 'Import financial records, invoices, and transaction history',
      icon: DocumentTextIcon,
      supportedFormats: ['.xlsx', '.xls', '.csv'],
      templateUrl: '/templates/financial-import-template.csv',
      fields: ['Transaction Date', 'Transaction Type', 'Amount', 'Description', 'Customer/Vendor', 'Invoice Number', 'Payment Method', 'Status']
    },
    {
      id: 'inventory',
      name: 'General Inventory',
      description: 'Import any type of inventory items with custom fields',
      icon: TableCellsIcon,
      supportedFormats: ['.xlsx', '.xls', '.csv'],
      templateUrl: '/templates/inventory-import-template.csv',
      fields: ['Item Name', 'Category', 'Brand', 'Model', 'SKU', 'Price', 'Cost', 'Stock', 'Location', 'Description']
    }
  ];

  useEffect(() => {
    if (session) {
      fetchCompanyData();
    }
  }, [session]);

  const fetchCompanyData = async () => {
    try {
      console.log('🔄 Fetching company data for:', params.companyId);
      const response = await fetch(`/api/companies/${params.companyId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Company data loaded:', data);
        setCompany(data.company);
      } else if (response.status === 404) {
        console.log('❌ Company not found, redirecting to select page');
        router.push('/select');
      } else {
        console.error('❌ Failed to fetch company, status:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      parseFile(uploadedFile);
    }
  };

  const getAcceptedFileTypes = () => {
    const category = importCategories.find(cat => cat.id === selectedCategory);
    if (!category) return '.csv,.xlsx,.xls';
    
    return category.supportedFormats.join(',');
  };

  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return <ExcelIcon className="h-6 w-6 text-green-500" />;
      case 'csv':
        return <TableCellsIcon className="h-6 w-6 text-blue-500" />;
      case 'pdf':
        return <DocumentTextIcon className="h-6 w-6 text-red-500" />;
      default:
        return <DocumentIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const parseFile = async (uploadedFile: File) => {
    try {
      const text = await uploadedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsedData: ImportItem[] = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const item: ImportItem = {
          id: `temp-${index}`,
          name: values[0] || '',
          brand: values[1] || '',
          model: values[2] || '',
          year: parseInt(values[3]) || 0,
          price: parseFloat(values[4]) || 0,
          status: values[5] || 'available',
          vin: values[6] || '',
          mileage: parseInt(values[7]) || 0,
          description: values[8] || '',
          errors: [],
          warnings: []
        };

        // Validate data
        if (!item.name) item.errors?.push('Name is required');
        if (!item.brand) item.errors?.push('Brand is required');
        if (!item.model) item.errors?.push('Model is required');
        if (item.year < 1900 || item.year > new Date().getFullYear() + 1) {
          item.warnings?.push('Year seems invalid');
        }
        if (item.price < 0) item.warnings?.push('Price should be positive');
        if (item.mileage < 0) item.warnings?.push('Mileage should be positive');

        return item;
      });

      setImportData(parsedData);
      setPreviewMode(true);
    } catch (error) {
      console.error('Error parsing file:', error);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setImportProgress(0);
    
    let success = 0;
    let errors = 0;
    let warnings = 0;

    for (let i = 0; i < importData.length; i++) {
      const item = importData[i];
      
      if (item.errors && item.errors.length > 0) {
        errors++;
      } else {
        try {
          // Here you would make the actual API call to create the item
          // For now, we'll simulate the import
          await new Promise(resolve => setTimeout(resolve, 100));
          success++;
        } catch (error) {
          errors++;
        }
      }

      if (item.warnings && item.warnings.length > 0) {
        warnings++;
      }

      setImportProgress(((i + 1) / importData.length) * 100);
    }

    setImportResults({ success, errors, warnings });
    setImporting(false);
  };

  const downloadTemplate = () => {
    const category = importCategories.find(cat => cat.id === selectedCategory);
    if (!category) return;

    let content = '';
    let filename = '';
    let mimeType = '';

    switch (selectedCategory) {
      case 'bikes':
        content = 'Name,Brand,Model,Year,Price,Status,VIN,Mileage,Description\nExample Bike,Yamaha,R1,2024,15000,available,1HGBH41JXMN109186,5000,Excellent condition';
        filename = 'bikes-import-template.csv';
        mimeType = 'text/csv';
        break;
      case 'parts':
        content = 'Part Number,Name,Brand,Category,Price,Stock,Location,Description\nP001,Oil Filter,Yamaha,Maintenance,25.99,50,Shelf A1,High-quality oil filter';
        filename = 'parts-import-template.csv';
        mimeType = 'text/csv';
        break;
      case 'accessories':
        content = 'SKU,Name,Category,Brand,Price,Stock,Description\nACC001,Helmet,Safety,Shark,299.99,25,Full-face racing helmet';
        filename = 'accessories-import-template.csv';
        mimeType = 'text/csv';
        break;
      case 'customers':
        content = 'First Name,Last Name,Email,Phone,Address,City,State,Zip\nJohn,Doe,john@example.com,555-0123,123 Main St,Anytown,CA,90210';
        filename = 'customers-import-template.csv';
        mimeType = 'text/csv';
        break;
      case 'services':
        content = 'VIN,Service Date,Service Type,Technician,Parts Used,Labor Hours,Total Cost\n1HGBH41JXMN109186,2024-01-15,Oil Change,John Smith,Oil Filter,1.5,89.99';
        filename = 'services-import-template.csv';
        mimeType = 'text/csv';
        break;
      case 'financial':
        content = 'Transaction Date,Transaction Type,Amount,Description,Customer/Vendor,Invoice Number,Payment Method,Status\n2024-01-15,Sale,15000.00,Bike Sale - Yamaha R1,John Doe,INV-001,Credit Card,Completed';
        filename = 'financial-import-template.csv';
        mimeType = 'text/csv';
        break;
      case 'inventory':
        content = 'Item Name,Category,Brand,Model,SKU,Price,Cost,Stock,Location,Description\nMotorcycle Helmet,Safety,Shark,Full Face,HELM-001,299.99,200.00,25,Shelf A1,High-quality racing helmet';
        filename = 'inventory-import-template.csv';
        mimeType = 'text/csv';
        break;
      default:
        content = 'Name,Description\nExample Item,Example description';
        filename = 'import-template.csv';
        mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearImport = () => {
    setFile(null);
    setImportData([]);
    setPreviewMode(false);
    setImportResults({ success: 0, errors: 0, warnings: 0 });
    setImportProgress(0);
    setSelectedCategory('bikes');
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

  if (!session) {
    return null;
  }

  if (!company) {
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
      <RevaniPortalHeader company={company} activePage="tools" />
      
            <div className="dashboard-content" style={{ marginTop: '2rem' }}>
        <div className="content-header">
           <h1>Mass Import</h1>
           <p>Import multiple data types including bikes, parts, financial transactions, customers, and more from Excel, CSV, or PDF files</p>
         </div>

        {!previewMode ? (
          <div className="import-upload-section">
            {/* Category Selection */}
            <div className="category-selection">
              <h3 className="category-title">Select Import Category</h3>
              <div className="category-grid">
                {importCategories.map((category) => (
                  <div
                    key={category.id}
                    className={`category-card ${selectedCategory === category.id ? 'selected' : ''}`}
                    onClick={() => {
                      router.push(`/dashboard/${params.companyId}/tools/mass-import/forms/${category.id}`);
                    }}
                  >
                    <div className="category-icon">
                      <category.icon className="h-8 w-8" />
                    </div>
                    <h4 className="category-name">{category.name}</h4>
                    <p className="category-description">{category.description}</p>
                                         <div className="supported-formats">
                       <span className="formats-label">Supported:</span>
                       <div className="format-tags">
                         {category.supportedFormats.map((format) => (
                           <span key={format} className="format-tag">{format}</span>
                         ))}
                       </div>
                     </div>
                     
                                           <div className="form-available">
                        <span className="form-badge">📝 Dedicated Form Available</span>
                      </div>
                  </div>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div className="upload-card">
              <div className="upload-icon">
                <CloudArrowUpIcon className="h-16 w-16 text-purple-400" />
              </div>
              <h3>Upload {importCategories.find(cat => cat.id === selectedCategory)?.name || 'File'}</h3>
              <p className="text-gray-400 mb-6">
                Drag and drop your file here, or click to browse
              </p>
              
              <div className="file-type-info">
                <p className="supported-types">
                  Supported formats: {getAcceptedFileTypes()}
                </p>
              </div>
              
              <input
                type="file"
                accept={getAcceptedFileTypes()}
                onChange={handleFileUpload}
                className="file-input"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="upload-button">
                <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                Choose File
              </label>

              {file && (
                <div className="file-info">
                  {getFileTypeIcon(file.name)}
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}

              <div className="template-section">
                <p className="text-sm text-gray-500 mb-2">Don't have a template?</p>
                <button
                  onClick={downloadTemplate}
                  className="template-button"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download {importCategories.find(cat => cat.id === selectedCategory)?.name || 'Template'}
                </button>
              </div>

              <div className="fields-info">
                <h4>Required Fields</h4>
                <div className="fields-grid">
                  {importCategories.find(cat => cat.id === selectedCategory)?.fields.map((field, index) => (
                    <span key={index} className="field-tag">{field}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="import-preview-section">
            <div className="preview-header">
              <div className="preview-info">
                <h3>Import Preview</h3>
                <p className="text-gray-400">
                  {importData.length} items ready for import
                </p>
              </div>
              <div className="preview-actions">
                <button
                  onClick={clearImport}
                  className="clear-button"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Clear
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="import-button"
                >
                  {importing ? (
                    <>
                      <div className="spinner mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Start Import
                    </>
                  )}
                </button>
              </div>
            </div>

            {importing && (
              <div className="import-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
                <p className="progress-text">{Math.round(importProgress)}% Complete</p>
              </div>
            )}

            {importResults.success > 0 || importResults.errors > 0 ? (
              <div className="import-results">
                <h4>Import Results</h4>
                <div className="results-grid">
                  <div className="result-item success">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>{importResults.success} Successful</span>
                  </div>
                  <div className="result-item error">
                    <XCircleIcon className="h-5 w-5" />
                    <span>{importResults.errors} Errors</span>
                  </div>
                  <div className="result-item warning">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    <span>{importResults.warnings} Warnings</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="preview-table">
                <div className="table-header">
                  <TableCellsIcon className="h-4 w-4 mr-2" />
                  <span>Preview Data</span>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Brand</th>
                        <th>Model</th>
                        <th>Year</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>VIN</th>
                        <th>Mileage</th>
                        <th>Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importData.map((item, index) => (
                        <tr key={item.id} className={item.errors && item.errors.length > 0 ? 'error-row' : ''}>
                          <td>{item.name}</td>
                          <td>{item.brand}</td>
                          <td>{item.model}</td>
                          <td>{item.year}</td>
                          <td>${item.price.toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${item.status}`}>
                              {item.status}
                            </span>
                          </td>
                          <td>{item.vin}</td>
                          <td>{item.mileage.toLocaleString()}</td>
                          <td>
                            {item.errors && item.errors.length > 0 && (
                              <div className="error-list">
                                {item.errors.map((error, i) => (
                                  <span key={i} className="error-tag">{error}</span>
                                ))}
                              </div>
                            )}
                            {item.warnings && item.warnings.length > 0 && (
                              <div className="warning-list">
                                {item.warnings.map((warning, i) => (
                                  <span key={i} className="warning-tag">{warning}</span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .import-upload-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .category-selection {
          margin-bottom: 2rem;
        }

        .category-title {
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .category-card {
          background: rgba(30, 41, 59, 0.8);
          border: 2px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .category-card:hover {
          transform: translateY(-2px);
          border-color: rgba(139, 92, 246, 0.6);
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.2);
        }

        .category-card.selected {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
        }

        .category-icon {
          color: #8b5cf6;
          margin-bottom: 1rem;
        }

        .category-name {
          color: white;
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .category-description {
          color: #94a3b8;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .supported-formats {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .formats-label {
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .format-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .format-tag {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .form-available {
          margin-top: 1rem;
          text-align: center;
        }

        .form-badge {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid rgba(16, 185, 129, 0.3);
          display: inline-block;
        }

        .upload-card {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 16px;
          padding: 3rem 2rem;
          text-align: center;
          backdrop-filter: blur(10px);
        }

        .upload-icon {
          margin-bottom: 1.5rem;
        }

        .upload-card h3 {
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .file-input {
          display: none;
        }

        .upload-button {
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          border: none;
        }

        .upload-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
        }

        .template-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(139, 92, 246, 0.2);
        }

        .template-button {
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
        }

        .template-button:hover {
          background: #8b5cf6;
          color: white;
        }

        .file-type-info {
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .supported-types {
          color: #94a3b8;
          font-size: 0.875rem;
          background: rgba(139, 92, 246, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          padding: 1rem;
          margin: 1.5rem 0;
        }

        .file-name {
          color: white;
          font-weight: 500;
          flex: 1;
        }

        .file-size {
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .fields-info {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(139, 92, 246, 0.2);
        }

        .fields-info h4 {
          color: white;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          text-align: center;
        }

        .fields-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
        }

        .field-tag {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .import-preview-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .preview-info h3 {
          color: white;
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .preview-actions {
          display: flex;
          gap: 1rem;
        }

        .clear-button {
          display: flex;
          align-items: center;
          background: transparent;
          color: #ef4444;
          padding: 0.5rem 1rem;
          border: 1px solid #ef4444;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }

        .clear-button:hover {
          background: #ef4444;
          color: white;
        }

        .import-button {
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .import-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
        }

        .import-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .import-progress {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(139, 92, 246, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6, #a855f7);
          transition: width 0.3s ease;
        }

        .progress-text {
          color: white;
          text-align: center;
          font-weight: 500;
        }

        .import-results {
          padding: 1.5rem;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          margin-bottom: 2rem;
        }

        .import-results h4 {
          color: white;
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .result-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border-radius: 8px;
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

        .preview-table {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          overflow: hidden;
        }

        .table-header {
          display: flex;
          align-items: center;
          padding: 1rem 1.5rem;
          background: rgba(139, 92, 246, 0.1);
          border-bottom: 1px solid rgba(139, 92, 246, 0.3);
          color: white;
          font-weight: 600;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 0.75rem 1rem;
          text-align: left;
          border-bottom: 1px solid rgba(139, 92, 246, 0.1);
        }

        th {
          background: rgba(30, 41, 59, 0.9);
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
        }

        td {
          color: #e2e8f0;
          font-size: 0.875rem;
        }

        .error-row {
          background: rgba(239, 68, 68, 0.1);
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-badge.available {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .status-badge.sold {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .status-badge.hold {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .error-list, .warning-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .error-tag, .warning-tag {
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .error-tag {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .warning-tag {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
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
      `}</style>
    </div>
  );
}
