'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../dashboard.css';
import RevaniPortalHeader from '../../../../../components/RevaniPortalHeader';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  CurrencyDollarIcon,
  ChartPieIcon,
  BanknotesIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  BuildingStorefrontIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  ArchiveBoxIcon,
  SparklesIcon,
  FireIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface BikeData {
  _id: string;
  name: string;
  status: string;
  price: number;
  projectedCosts?: number;
  projectedHighSale?: number;
  projectedLowSale?: number;
  actualListPrice?: number;
  actualSalePrice?: number;
  dateSold?: string;
  dateAcquired?: string;
  parts?: Array<{
    cost: number;
  }>;
  services?: Array<{
    cost: number;
  }>;
  transportation?: Array<{
    cost: number;
  }>;
}

interface FinancialSummary {
  totalInventoryValue: number;
  totalCashAvailable: number;
  totalEquipmentValue: number;
  totalBikeCount: number;
  totalInvestment: number;
  projectedValue: number;
  actualProfit: number;
}

interface MonthlyPerformance {
  month: string;
  year: number;
  bikesSold: number;
  totalRevenue: number;
  totalProfit: number;
  averageSalePrice: number;
  profitMargin: number;
}

interface PerformanceData {
  totalSold: number;
  totalRevenue: number;
  totalProfit: number;
  averageProfitMargin: number;
  monthlyBreakdown: MonthlyPerformance[];
  topPerformingMonths: MonthlyPerformance[];
}

export default function FinancialDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bikes, setBikes] = useState<BikeData[]>([]);
  const [soldBikes, setSoldBikes] = useState<BikeData[]>([]);
  const [activeView, setActiveView] = useState<'active' | 'performance'>('active');
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalInventoryValue: 0,
    totalCashAvailable: 50000, // Default LMA account balance - this should come from API
    totalEquipmentValue: 25000, // Default equipment value - this should come from API
    totalBikeCount: 0,
    totalInvestment: 0,
    projectedValue: 0,
    actualProfit: 0
  });
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0,
    averageProfitMargin: 0,
    monthlyBreakdown: [],
    topPerformingMonths: []
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (params?.companyId) {
      fetchCompanyData(params.companyId as string);
      fetchBikesData(params.companyId as string);
      fetchSoldBikesData(params.companyId as string);
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

  const fetchBikesData = async (companyId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/companies/${companyId}/inventory/bikes`);
      if (response.ok) {
        const data = await response.json();
        const allBikes = data.bikes || [];
        // Filter for active bikes (not sold)
        const activeBikes = allBikes.filter((bike: BikeData) => bike.status.toLowerCase() !== 'sold');
        setBikes(activeBikes);
        calculateFinancialSummary(activeBikes);
      }
    } catch (error) {
      console.error('Failed to fetch bikes data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSoldBikesData = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/inventory/bikes`);
      if (response.ok) {
        const data = await response.json();
        const allBikes = data.bikes || [];
        // Filter for sold bikes only
        const soldBikesData = allBikes.filter((bike: BikeData) => bike.status.toLowerCase() === 'sold');
        setSoldBikes(soldBikesData);
        calculatePerformanceData(soldBikesData);
      }
    } catch (error) {
      console.error('Failed to fetch sold bikes data:', error);
    }
  };

  const calculateFinancialSummary = (bikesData: BikeData[]) => {
    let totalInventoryValue = 0;
    let totalInvestment = 0;
    let projectedValue = 0;
    let actualProfit = 0;

    bikesData.forEach(bike => {
      // Calculate present value (acquisition price + all costs)
      const acquisitionPrice = bike.price || 0;
      
      // Add parts costs
      const partsCosts = bike.parts?.reduce((sum, part) => sum + (part.cost || 0), 0) || 0;
      
      // Add services costs
      const servicesCosts = bike.services?.reduce((sum, service) => sum + (service.cost || 0), 0) || 0;
      
      // Add transportation costs
      const transportationCosts = bike.transportation?.reduce((sum, transport) => sum + (transport.cost || 0), 0) || 0;
      
      // Add projected costs
      const projectedCosts = bike.projectedCosts || 0;
      
      const totalBikeInvestment = acquisitionPrice + partsCosts + servicesCosts + transportationCosts + projectedCosts;
      
      totalInventoryValue += totalBikeInvestment;
      totalInvestment += totalBikeInvestment;
      
      // Calculate projected value (use high sale projection if available)
      if (bike.projectedHighSale) {
        projectedValue += bike.projectedHighSale;
      }
      
      // Calculate actual profit if bike is sold
      if (bike.status.toLowerCase() === 'sold' && bike.actualSalePrice) {
        actualProfit += bike.actualSalePrice - totalBikeInvestment;
      }
    });

    setFinancialSummary(prev => ({
      ...prev,
      totalInventoryValue,
      totalBikeCount: bikesData.length,
      totalInvestment,
      projectedValue,
      actualProfit
    }));
  };

  const calculatePerformanceData = (soldBikesData: BikeData[]) => {
    const monthlyData: { [key: string]: MonthlyPerformance } = {};
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalInvestment = 0;

    soldBikesData.forEach(bike => {
      if (bike.dateSold && bike.actualSalePrice) {
        const saleDate = new Date(bike.dateSold);
        const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        const monthName = saleDate.toLocaleDateString('en-US', { month: 'long' });
        
        // Calculate total investment for this bike
        const acquisitionPrice = bike.price || 0;
        const partsCosts = bike.parts?.reduce((sum, part) => sum + (part.cost || 0), 0) || 0;
        const servicesCosts = bike.services?.reduce((sum, service) => sum + (service.cost || 0), 0) || 0;
        const transportationCosts = bike.transportation?.reduce((sum, transport) => sum + (transport.cost || 0), 0) || 0;
        const projectedCosts = bike.projectedCosts || 0;
        const bikeInvestment = acquisitionPrice + partsCosts + servicesCosts + transportationCosts + projectedCosts;
        
        const bikeProfit = bike.actualSalePrice - bikeInvestment;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthName,
            year: saleDate.getFullYear(),
            bikesSold: 0,
            totalRevenue: 0,
            totalProfit: 0,
            averageSalePrice: 0,
            profitMargin: 0
          };
        }
        
        monthlyData[monthKey].bikesSold += 1;
        monthlyData[monthKey].totalRevenue += bike.actualSalePrice;
        monthlyData[monthKey].totalProfit += bikeProfit;
        
        totalRevenue += bike.actualSalePrice;
        totalProfit += bikeProfit;
        totalInvestment += bikeInvestment;
      }
    });

    // Calculate averages and sort
    const monthlyBreakdown = Object.values(monthlyData).map(month => ({
      ...month,
      averageSalePrice: month.totalRevenue / month.bikesSold,
      profitMargin: month.totalRevenue > 0 ? (month.totalProfit / month.totalRevenue) * 100 : 0
    })).sort((a, b) => b.year - a.year || b.month.localeCompare(a.month));

    const topPerformingMonths = [...monthlyBreakdown]
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 3);

    setPerformanceData({
      totalSold: soldBikesData.length,
      totalRevenue,
      totalProfit,
      averageProfitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      monthlyBreakdown,
      topPerformingMonths
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!company) {
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

      <RevaniPortalHeader company={company} activePage="financial" />

      {/* Main Content */}
      <main className="dashboard-main" style={{ marginTop: '2rem' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 className="section-header">Financial Dashboard</h2>
            <p style={{ color: '#94a3b8', margin: 0 }}>Track active inventory and sold bike performance for {company.name}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.push(`/dashboard/${company.slug}/financial/transactions`)}
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
              <EyeIcon style={{ width: '1rem', height: '1rem' }} />
              View Transactions
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '2rem',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: '0.75rem',
          padding: '0.25rem',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          width: 'fit-content'
        }}>
          <button
            onClick={() => setActiveView('active')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: activeView === 'active' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
              border: 'none',
              borderRadius: '0.5rem',
              color: activeView === 'active' ? '#8b5cf6' : '#94a3b8',
              fontSize: '0.875rem',
              fontWeight: '500',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <BuildingStorefrontIcon style={{ width: '1rem', height: '1rem' }} />
            Active Inventory
          </button>
          <button
            onClick={() => setActiveView('performance')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: activeView === 'performance' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
              border: 'none',
              borderRadius: '0.5rem',
              color: activeView === 'performance' ? '#8b5cf6' : '#94a3b8',
              fontSize: '0.875rem',
              fontWeight: '500',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <ChartBarIcon style={{ width: '1rem', height: '1rem' }} />
            Performance
          </button>
        </div>

        {/* Conditional Content Based on Active View */}
        {activeView === 'active' ? (
          <>
            {/* Active Inventory Financial Summary Cards */}
            <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
              {/* Total Assets */}
              <div className="kpi-card" style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <BanknotesIcon className="kpi-icon" style={{ color: '#8b5cf6' }} />
                <div className="kpi-value" style={{ color: '#8b5cf6' }}>
                  {formatCurrency(financialSummary.totalInventoryValue + financialSummary.totalCashAvailable + financialSummary.totalEquipmentValue)}
                </div>
                <div className="kpi-title">Total Assets</div>
              </div>

              {/* Inventory Value */}
              <div className="kpi-card" style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <BuildingStorefrontIcon className="kpi-icon" style={{ color: '#10b981' }} />
                <div className="kpi-value" style={{ color: '#10b981' }}>
                  {formatCurrency(financialSummary.totalInventoryValue)}
                </div>
                <div className="kpi-title">Active Inventory</div>
              </div>

              {/* Available Cash */}
              <Link href={`/dashboard/${company?.slug}/financial/liquid-assets`} style={{ textDecoration: 'none' }}>
                <div className="kpi-card" style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  cursor: 'pointer'
                }}>
                  <CurrencyDollarIcon className="kpi-icon" style={{ color: '#22c55e' }} />
                  <div className="kpi-value" style={{ color: '#22c55e' }}>
                    {formatCurrency(financialSummary.totalCashAvailable)}
                  </div>
                  <div className="kpi-title">Available Cash</div>
                </div>
              </Link>

              {/* Equipment Value */}
              <div className="kpi-card" style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <WrenchScrewdriverIcon className="kpi-icon" style={{ color: '#f59e0b' }} />
                <div className="kpi-value" style={{ color: '#f59e0b' }}>
                  {formatCurrency(financialSummary.totalEquipmentValue)}
                </div>
                <div className="kpi-title">Equipment Value</div>
              </div>
            </div>

            {/* Active Inventory Details */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '2rem', 
              marginBottom: '2rem' 
            }}>
              {/* Asset Allocation Pie Chart */}
              <div style={{
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '1rem',
                padding: '1.5rem'
              }}>
                <h3 style={{ 
                  color: '#e2e8f0', 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <ChartPieIcon style={{ width: '1.5rem', height: '1.5rem', color: '#8b5cf6' }} />
                  Asset Allocation
                </h3>
                
                {/* Simple CSS-based pie chart */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: '2rem'
                }}>
                  <div style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: `conic-gradient(
                      #8b5cf6 0% ${(financialSummary.totalInventoryValue / (financialSummary.totalInventoryValue + financialSummary.totalCashAvailable + financialSummary.totalEquipmentValue)) * 100}%,
                      #10b981 ${(financialSummary.totalInventoryValue / (financialSummary.totalInventoryValue + financialSummary.totalCashAvailable + financialSummary.totalEquipmentValue)) * 100}% ${((financialSummary.totalInventoryValue + financialSummary.totalCashAvailable) / (financialSummary.totalInventoryValue + financialSummary.totalCashAvailable + financialSummary.totalEquipmentValue)) * 100}%,
                      #f59e0b ${((financialSummary.totalInventoryValue + financialSummary.totalCashAvailable) / (financialSummary.totalInventoryValue + financialSummary.totalCashAvailable + financialSummary.totalEquipmentValue)) * 100}% 100%
                    )`,
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(15, 23, 42, 0.9)',
                      borderRadius: '50%',
                      width: '100px',
                      height: '100px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column'
                    }}>
                      <div style={{ color: '#e2e8f0', fontSize: '0.75rem', opacity: 0.7 }}>Total</div>
                      <div style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '600' }}>
                        {formatCurrency(financialSummary.totalInventoryValue + financialSummary.totalCashAvailable + financialSummary.totalEquipmentValue)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div style={{
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '1rem',
                padding: '1.5rem'
              }}>
                <h3 style={{ 
                  color: '#e2e8f0', 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <ArrowTrendingUpIcon style={{ width: '1.5rem', height: '1.5rem', color: '#8b5cf6' }} />
                  Active Inventory Metrics
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Total Investment */}
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.3)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Investment</span>
                      <span style={{ color: '#8b5cf6', fontSize: '1.125rem', fontWeight: '600' }}>
                        {formatCurrency(financialSummary.totalInvestment)}
                      </span>
                    </div>
                  </div>

                  {/* Projected Value */}
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.3)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Projected Value</span>
                      <span style={{ color: '#10b981', fontSize: '1.125rem', fontWeight: '600' }}>
                        {formatCurrency(financialSummary.projectedValue)}
                      </span>
                    </div>
                  </div>

                  {/* Projected Profit */}
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.3)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(34, 197, 94, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Projected Profit</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {financialSummary.projectedValue - financialSummary.totalInvestment > 0 ? (
                          <ArrowTrendingUpIcon style={{ width: '1rem', height: '1rem', color: '#22c55e' }} />
                        ) : (
                          <ArrowTrendingDownIcon style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
                        )}
                        <span style={{ 
                          color: financialSummary.projectedValue - financialSummary.totalInvestment > 0 ? '#22c55e' : '#ef4444', 
                          fontSize: '1.125rem', 
                          fontWeight: '600' 
                        }}>
                          {formatCurrency(financialSummary.projectedValue - financialSummary.totalInvestment)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bike Count */}
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.3)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Active Bikes</span>
                      <span style={{ color: '#8b5cf6', fontSize: '1.125rem', fontWeight: '600' }}>
                        {financialSummary.totalBikeCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Performance View - Sold Bikes Data */}
            <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
              <div className="kpi-card" style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <ArchiveBoxIcon className="kpi-icon" style={{ color: '#22c55e' }} />
                <div className="kpi-value" style={{ color: '#22c55e' }}>
                  {performanceData.totalSold}
                </div>
                <div className="kpi-title">Total Sold</div>
              </div>

              <div className="kpi-card" style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <CurrencyDollarIcon className="kpi-icon" style={{ color: '#10b981' }} />
                <div className="kpi-value" style={{ color: '#10b981' }}>
                  {formatCurrency(performanceData.totalRevenue)}
                </div>
                <div className="kpi-title">Total Revenue</div>
              </div>

              <div className="kpi-card" style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <ArrowTrendingUpIcon className="kpi-icon" style={{ color: '#8b5cf6' }} />
                <div className="kpi-value" style={{ color: '#8b5cf6' }}>
                  {formatCurrency(performanceData.totalProfit)}
                </div>
                <div className="kpi-title">Total Profit</div>
              </div>

              <div className="kpi-card" style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <ChartBarIcon className="kpi-icon" style={{ color: '#f59e0b' }} />
                <div className="kpi-value" style={{ color: '#f59e0b' }}>
                  {performanceData.averageProfitMargin.toFixed(1)}%
                </div>
                <div className="kpi-title">Avg. Profit Margin</div>
              </div>
            </div>

            {/* Monthly Performance Breakdown */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr', 
              gap: '2rem', 
              marginBottom: '2rem' 
            }}>
              {/* Monthly Chart */}
              <div style={{
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '1rem',
                padding: '1.5rem'
              }}>
                <h3 style={{ 
                  color: '#e2e8f0', 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CalendarIcon style={{ width: '1.5rem', height: '1.5rem', color: '#8b5cf6' }} />
                  Monthly Performance
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {performanceData.monthlyBreakdown.slice(0, 6).map((month, index) => (
                    <div key={index} style={{
                      padding: '1rem',
                      background: 'rgba(15, 23, 42, 0.3)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(139, 92, 246, 0.2)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: '600' }}>
                          {month.month} {month.year}
                        </span>
                        <span style={{ color: '#22c55e', fontSize: '0.875rem', fontWeight: '500' }}>
                          {month.bikesSold} bikes sold
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Revenue</div>
                          <div style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>
                            {formatCurrency(month.totalRevenue)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Profit</div>
                          <div style={{ color: '#8b5cf6', fontSize: '0.875rem', fontWeight: '600' }}>
                            {formatCurrency(month.totalProfit)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Margin</div>
                          <div style={{ color: '#f59e0b', fontSize: '0.875rem', fontWeight: '600' }}>
                            {month.profitMargin.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Performing Months */}
              <div style={{
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '1rem',
                padding: '1.5rem'
              }}>
                <h3 style={{ 
                  color: '#e2e8f0', 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FireIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
                  Top Months
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {performanceData.topPerformingMonths.map((month, index) => (
                    <div key={index} style={{
                      padding: '1rem',
                      background: 'rgba(15, 23, 42, 0.3)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(34, 197, 94, 0.2)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          borderRadius: '50%',
                          width: '1.5rem',
                          height: '1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#22c55e'
                        }}>
                          {index + 1}
                        </div>
                        <span style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '600' }}>
                          {month.month} {month.year}
                        </span>
                      </div>
                      <div style={{ color: '#22c55e', fontSize: '1rem', fontWeight: '700' }}>
                        {formatCurrency(month.totalProfit)}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        {month.bikesSold} bikes • {month.profitMargin.toFixed(1)}% margin
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={{ 
            textAlign: 'center', 
            color: '#94a3b8', 
            fontSize: '1rem',
            padding: '2rem'
          }}>
            Loading financial data...
          </div>
        )}
      </main>
    </div>
  );
}
