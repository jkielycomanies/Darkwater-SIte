'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../../dashboard.css';
import RevaniPortalHeader from '../../../../../../components/RevaniPortalHeader';
import { 
  TruckIcon, 
  DocumentTextIcon,
  PrinterIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface BikeInventory {
  _id: string;
  name: string;
  category: string;
  price: number;
  actualSalePrice?: number;
  status: 'Acquisition' | 'Evaluation' | 'Servicing' | 'Media' | 'Listed' | 'Sold';
  vin: string;
  year: number;
  mileage: string | number;
  brand: string;
  model: string;
  color?: string;
  description?: string;
  images?: Array<{
    data: string;
    contentType: string;
    filename: string;
    size: number;
    uploadedAt: string;
  }>;
}

interface SaleForm {
  bikeId: string;
  customerFirstName: string;
  customerMiddleName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddressLine1: string;
  customerAddressLine2: string;
  customerCountry: string;
  customerState: string;
  customerCity: string;
  customerZipcode: string;
  customerLicenseFront: string;
  customerLicenseBack: string;
  salePrice: number;
  downPayment: number;
  financing: boolean;
  tradeIn: boolean;
  tradeInValue: number;
  tradeInDescription: string;
  additionalFees: number;
  taxes: number;
  totalAmount: number;
  saleDate: string;
  notes: string;
}

export default function SalesWorkflowPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [bike, setBike] = useState<BikeInventory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [saleForm, setSaleForm] = useState<SaleForm>({
    bikeId: '',
    customerFirstName: '',
    customerMiddleName: '',
    customerLastName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddressLine1: '',
    customerAddressLine2: '',
    customerCountry: '',
    customerState: '',
    customerCity: '',
    customerZipcode: '',
    customerLicenseFront: '',
    customerLicenseBack: '',
    salePrice: 0,
    downPayment: 0,
    financing: false,
    tradeIn: false,
    tradeInValue: 0,
    tradeInDescription: '',
    additionalFees: 0,
    taxes: 0,
    totalAmount: 0,
    saleDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (params?.companyId && params?.bikeId) {
      fetchData(params.companyId as string, params.bikeId as string);
    }
  }, [status, router, params]);

  const fetchData = async (companyId: string, bikeId: string) => {
    try {
      // Fetch company data
      const companyResponse = await fetch(`/api/companies/${companyId}`);
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        setCompany(companyData.company);
      }

      // Fetch bike data
      const bikeResponse = await fetch(`/api/companies/${companyId}/inventory/bikes/${bikeId}`);
      if (bikeResponse.ok) {
        const bikeData = await bikeResponse.json();
        setBike(bikeData.bike);
        
        // Pre-populate form with bike data
        setSaleForm(prev => ({
          ...prev,
          bikeId: bikeData.bike._id,
          salePrice: bikeData.bike.price,
          totalAmount: bikeData.bike.price
        }));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SaleForm, value: any) => {
    setSaleForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Recalculate total amount
      if (field === 'salePrice' || field === 'additionalFees' || field === 'taxes' || field === 'tradeInValue') {
        const total = updated.salePrice + updated.additionalFees + updated.taxes - (updated.tradeIn ? updated.tradeInValue : 0);
        updated.totalAmount = Math.max(0, total);
      }
      
      return updated;
    });
  };

  const handleFileUpload = (field: 'customerLicenseFront' | 'customerLicenseBack', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSaleForm(prev => ({
        ...prev,
        [field]: result
      }));
    };
    reader.readAsDataURL(file);
  };

  const generateBillOfSale = () => {
    if (!bike) return;
    
    const billOfSale = `
BILL OF SALE
====================

Vehicle Information:
- Year: ${bike.year}
- Make: ${bike.brand}
- Model: ${bike.model}
- VIN: ${bike.vin}
- Mileage: ${bike.mileage}
- Color: ${bike.color || 'N/A'}

Buyer Information:
- Name: ${saleForm.customerFirstName} ${saleForm.customerLastName}
- Email: ${saleForm.customerEmail}
- Phone: ${saleForm.customerPhone}
- Address: ${saleForm.customerAddressLine1}

Sale Details:
- Sale Price: $${saleForm.salePrice.toLocaleString()}
- Down Payment: $${saleForm.downPayment.toLocaleString()}
- Additional Fees: $${saleForm.additionalFees.toLocaleString()}
- Taxes: $${saleForm.taxes.toLocaleString()}
${saleForm.tradeIn ? `- Trade-In Value: $${saleForm.tradeInValue.toLocaleString()}` : ''}
- Total Amount: $${saleForm.totalAmount.toLocaleString()}
- Sale Date: ${saleForm.saleDate}

${saleForm.notes ? `Notes: ${saleForm.notes}` : ''}

Seller: ${company?.name || 'Dealership'}
Date: ${new Date().toLocaleDateString()}

Buyer Signature: _________________ Date: _________
Seller Signature: _________________ Date: _________
    `;
    
    return billOfSale;
  };

  const generatePriceSheet = () => {
    if (!bike) return;
    
    return `
PRICE SHEET
===========

${bike.year} ${bike.brand} ${bike.model}
VIN: ${bike.vin}

Base Price: $${bike.price.toLocaleString()}
${saleForm.additionalFees > 0 ? `Additional Fees: $${saleForm.additionalFees.toLocaleString()}` : ''}
${saleForm.taxes > 0 ? `Taxes: $${saleForm.taxes.toLocaleString()}` : ''}
${saleForm.tradeIn ? `Trade-In Credit: -$${saleForm.tradeInValue.toLocaleString()}` : ''}
--------------------------------
TOTAL: $${saleForm.totalAmount.toLocaleString()}

Financing: ${saleForm.financing ? 'Yes' : 'No'}
Down Payment: $${saleForm.downPayment.toLocaleString()}
    `;
  };

  const printDocument = (content: string, title: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${content}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="loading-container">
        <div className="background-pattern"></div>
        <div className="floating-elements">
          <div className="floating-orb purple"></div>
          <div className="floating-orb blue"></div>
          <div className="floating-orb green"></div>
        </div>
        <div className="loading-content">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!session || !company || !bike) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <div className="background-pattern"></div>
      <div className="floating-elements">
        <div className="floating-orb purple"></div>
        <div className="floating-orb blue"></div>
        <div className="floating-orb green"></div>
      </div>

      <RevaniPortalHeader company={company} activePage="sales" />

      <main className="dashboard-main">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 className="section-header">🏪 Sales Workflow</h2>
            <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0' }}>
              {bike.year} {bike.brand} {bike.model} • VIN: {bike.vin}
            </p>
          </div>
          <button
            onClick={() => router.push(`/dashboard/${company.slug}/sales/portal`)}
            style={{
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              color: '#8b5cf6',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ← Back to Sales Center
          </button>
        </div>

        {/* Progress Steps */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '2rem',
          background: 'rgba(30, 41, 59, 0.8)',
          borderRadius: '1rem',
          padding: '1rem'
        }}>
          {[1, 2, 3, 4].map((step) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: currentStep >= step ? '#8b5cf6' : 'rgba(139, 92, 246, 0.3)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                marginRight: '1rem'
              }}>
                {currentStep > step ? <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem' }} /> : step}
              </div>
              {step < 4 && (
                <div style={{
                  width: '60px',
                  height: '2px',
                  background: currentStep > step ? '#8b5cf6' : 'rgba(139, 92, 246, 0.3)',
                  marginRight: '1rem'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              Customer Information
            </h3>
            
            {/* Customer Name Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: '1.1rem' }}>Customer Name</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>First Name *</label>
                  <input
                    type="text"
                    value={saleForm.customerFirstName}
                    onChange={(e) => handleInputChange('customerFirstName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Middle Name</label>
                  <input
                    type="text"
                    value={saleForm.customerMiddleName}
                    onChange={(e) => handleInputChange('customerMiddleName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Last Name *</label>
                  <input
                    type="text"
                    value={saleForm.customerLastName}
                    onChange={(e) => handleInputChange('customerLastName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: '1.1rem' }}>Contact Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Email</label>
                  <input
                    type="email"
                    value={saleForm.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Phone</label>
                  <input
                    type="tel"
                    value={saleForm.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: '1.1rem' }}>Address</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Address Line 1 *</label>
                  <input
                    type="text"
                    value={saleForm.customerAddressLine1}
                    onChange={(e) => handleInputChange('customerAddressLine1', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Address Line 2</label>
                  <input
                    type="text"
                    value={saleForm.customerAddressLine2}
                    onChange={(e) => handleInputChange('customerAddressLine2', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Country *</label>
                  <input
                    type="text"
                    value={saleForm.customerCountry}
                    onChange={(e) => handleInputChange('customerCountry', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>State *</label>
                  <input
                    type="text"
                    value={saleForm.customerState}
                    onChange={(e) => handleInputChange('customerState', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>City *</label>
                  <input
                    type="text"
                    value={saleForm.customerCity}
                    onChange={(e) => handleInputChange('customerCity', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Zipcode *</label>
                  <input
                    type="text"
                    value={saleForm.customerZipcode}
                    onChange={(e) => handleInputChange('customerZipcode', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* License Upload Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: '1.1rem' }}>Driver's License</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>License Front *</label>
                  <div style={{
                    border: '2px dashed rgba(139, 92, 246, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'rgba(15, 23, 42, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      handleFileUpload('customerLicenseFront', files[0]);
                    }
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleFileUpload('customerLicenseFront', file);
                    };
                    input.click();
                  }}>
                    {saleForm.customerLicenseFront ? (
                      <div>
                        <img src={saleForm.customerLicenseFront} alt="License Front" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.5rem' }} />
                        <p style={{ color: '#22c55e', marginTop: '0.5rem' }}>✓ License Front Uploaded</p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                        <p style={{ color: '#e2e8f0' }}>Click or drag to upload license front</p>
                        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>PNG, JPG, or PDF</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>License Back *</label>
                  <div style={{
                    border: '2px dashed rgba(139, 92, 246, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'rgba(15, 23, 42, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      handleFileUpload('customerLicenseBack', files[0]);
                    }
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleFileUpload('customerLicenseBack', file);
                    };
                    input.click();
                  }}>
                    {saleForm.customerLicenseBack ? (
                      <div>
                        <img src={saleForm.customerLicenseBack} alt="License Back" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.5rem' }} />
                        <p style={{ color: '#22c55e', marginTop: '0.5rem' }}>✓ License Back Uploaded</p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                        <p style={{ color: '#e2e8f0' }}>Click or drag to upload license back</p>
                        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>PNG, JPG, or PDF</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CurrencyDollarIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              Pricing & Payment
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Sale Price *</label>
                <input
                  type="number"
                  value={saleForm.salePrice}
                  onChange={(e) => handleInputChange('salePrice', parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Down Payment</label>
                <input
                  type="number"
                  value={saleForm.downPayment}
                  onChange={(e) => handleInputChange('downPayment', parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Additional Fees</label>
                <input
                  type="number"
                  value={saleForm.additionalFees}
                  onChange={(e) => handleInputChange('additionalFees', parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Taxes</label>
                <input
                  type="number"
                  value={saleForm.taxes}
                  onChange={(e) => handleInputChange('taxes', parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={saleForm.tradeIn}
                    onChange={(e) => handleInputChange('tradeIn', e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  Trade-In Vehicle
                </label>
                
                {saleForm.tradeIn && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div>
                      <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Trade-In Value</label>
                      <input
                        type="number"
                        value={saleForm.tradeInValue}
                        onChange={(e) => handleInputChange('tradeInValue', parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '0.5rem',
                          color: 'white',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Trade-In Description</label>
                      <input
                        type="text"
                        value={saleForm.tradeInDescription}
                        onChange={(e) => handleInputChange('tradeInDescription', e.target.value)}
                        placeholder="Year, Make, Model"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '0.5rem',
                          color: 'white',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Total Display */}
            <div style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginTop: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#e2e8f0', fontSize: '1.25rem', fontWeight: '600' }}>Total Amount:</span>
                <span style={{ color: '#22c55e', fontSize: '2rem', fontWeight: '700' }}>
                  ${saleForm.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              Sale Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Sale Date</label>
                <input
                  type="date"
                  value={saleForm.saleDate}
                  onChange={(e) => handleInputChange('saleDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={saleForm.financing}
                    onChange={(e) => handleInputChange('financing', e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  Financing Required
                </label>
              </div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Additional Notes</label>
                <textarea
                  value={saleForm.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  placeholder="Any additional terms, conditions, or notes for this sale..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardDocumentListIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              Generate Documents
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <button
                onClick={() => printDocument(generateBillOfSale() || '', 'Bill of Sale')}
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  color: '#22c55e',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                }}
              >
                <DocumentTextIcon style={{ width: '2rem', height: '2rem' }} />
                <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>Bill of Sale</span>
                <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>Generate and print bill of sale</span>
              </button>
              
              <button
                onClick={() => printDocument(generatePriceSheet() || '', 'Price Sheet')}
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                }}
              >
                <PrinterIcon style={{ width: '2rem', height: '2rem' }} />
                <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>Price Sheet</span>
                <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>Generate pricing breakdown</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            style={{
              background: currentStep === 1 ? 'rgba(75, 85, 99, 0.3)' : 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              color: currentStep === 1 ? '#6b7280' : '#8b5cf6',
              fontSize: '0.875rem',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Previous
          </button>
          
          <button
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            disabled={currentStep === 4}
            style={{
              background: currentStep === 4 ? 'rgba(75, 85, 99, 0.3)' : 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              color: currentStep === 4 ? '#6b7280' : '#22c55e',
              fontSize: '0.875rem',
              cursor: currentStep === 4 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {currentStep === 4 ? 'Complete' : 'Next'}
          </button>
        </div>
      </main>
    </div>
  );
}
