'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../../dashboard.css';
import RevaniPortalHeader from '../../../../../../components/RevaniPortalHeader';
import { 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CalendarIcon,
  CogIcon,
  TruckIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface VINResult {
  vin: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  engine?: string;
  transmission?: string;
  driveType?: string;
  bodyStyle?: string;
  fuelType?: string;
  country: string;
  manufacturer: string;
  plantCode?: string;
  isValid: boolean;
  error?: string;
  marketCheckData?: {
    listings?: any[];
    listingCount?: number;
    stats?: any;
    avgPrice?: number;
    minPrice?: number;
    maxPrice?: number;
    priceStdDev?: number;
  };
}

export default function VINRunnerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vinInput, setVinInput] = useState('');
  const [vinResult, setVinResult] = useState<VINResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [apiResults, setApiResults] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (params?.companyId) {
      fetchCompanyData(params.companyId as string);
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
    } finally {
      setIsLoading(false);
    }
  };



  // Fetch motorcycle market data from MarketCheck
  const fetchMarketCheckData = async (make: string, model: string, year: number) => {
    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_MARKETCHECK_KEY;
    console.log('MarketCheck API Key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'undefined'
    });
    
    if (!apiKey) {
      console.warn('MarketCheck API key not configured, skipping market data fetch');
      return null;
    }

    try {
      console.log('🔍 MarketCheck Search Strategy:');
      console.log('  Using NHTSA decoded data:', { make, model, year });
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for multiple calls
      
      // Strategy 1: Try exact make, model, and year search using official endpoint
      const exactSearchUrl = `https://marketcheck-prod.apigee.net/v2/search/motorcycle/active`;
      const params = new URLSearchParams({
        make: make,
        model: model,
        year: year.toString(),
        start: '0',
        rows: '10'
      });
      
      console.log('  🎯 Exact search URL:', `${exactSearchUrl}?${params.toString()}`);
      
      const searchResponse = await fetch(`${exactSearchUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Host': 'marketcheck-prod.apigee.net',
          'api_key': apiKey,
          'api_secret': process.env.NEXT_PUBLIC_MARKETCHECK_SECRET || 'X9OYtWITfjBp5sBX'
        },
        signal: controller.signal
      });

      let searchData = null;
      if (searchResponse.ok) {
        searchData = await searchResponse.json();
        console.log('✅ MarketCheck exact search response:', {
          found: searchData?.num_found || 0,
          listings: searchData?.listings?.length || 0,
          status: searchData?.status || 'unknown'
        });
        
        // Log any API warnings or messages
        if (searchData?.message) {
          console.log('📝 MarketCheck API message:', searchData.message);
        }
      } else {
        // Try to get error details from response
        try {
          const errorData = await searchResponse.json();
          console.warn('❌ MarketCheck exact search failed:', {
            status: searchResponse.status,
            statusText: searchResponse.statusText,
            error: errorData
          });
        } catch {
          console.warn('❌ MarketCheck exact search failed:', searchResponse.status, searchResponse.statusText);
        }
        
        // Strategy 2: Fallback to make and year only (broader search)
        const broadParams = new URLSearchParams({
          make: make,
          year: year.toString(),
          start: '0',
          rows: '10'
        });
        
        console.log('  🔄 Trying broader search (make + year only):', `${exactSearchUrl}?${broadParams.toString()}`);
        
        const broadResponse = await fetch(`${exactSearchUrl}?${broadParams.toString()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Host': 'marketcheck-prod.apigee.net',
            'api_key': apiKey,
            'api_secret': process.env.NEXT_PUBLIC_MARKETCHECK_SECRET || 'X9OYtWITfjBp5sBX'
          },
          signal: controller.signal
        });
        
        if (broadResponse.ok) {
          searchData = await broadResponse.json();
          console.log('✅ MarketCheck broad search response:', {
            found: searchData?.num_found || 0,
            listings: searchData?.listings?.length || 0
          });
        } else {
          console.warn('❌ MarketCheck broad search also failed:', broadResponse.status, broadResponse.statusText);
          
          // Strategy 3: Last resort - search by make only
          const makeOnlyParams = new URLSearchParams({
            make: make,
            start: '0',
            rows: '5'
          });
          const makeOnlyUrl = `${exactSearchUrl}?${makeOnlyParams.toString()}`;
          console.log('  🔄 Last resort: make-only search:', makeOnlyUrl);
          
          try {
            const makeOnlyResponse = await fetch(makeOnlyUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Host': 'marketcheck-prod.apigee.net',
                'api_key': apiKey,
                'api_secret': process.env.NEXT_PUBLIC_MARKETCHECK_SECRET || 'X9OYtWITfjBp5sBX'
              },
              signal: controller.signal
            });
            
            if (makeOnlyResponse.ok) {
              searchData = await makeOnlyResponse.json();
              console.log('✅ MarketCheck make-only search response:', {
                found: searchData?.num_found || 0,
                listings: searchData?.listings?.length || 0
              });
            }
          } catch (error) {
            console.warn('❌ Make-only search also failed:', error);
          }
        }
      }

      // 2. Get market statistics for pricing insights (using make + year for broader stats)
      const statsParams = new URLSearchParams({
        make: make,
        year: year.toString(),
        rows: '0',
        stats: 'price'
      });
      
      console.log('  📊 Stats search URL:', `${exactSearchUrl}?${statsParams.toString()}`);
      
      const statsResponse = await fetch(`${exactSearchUrl}?${statsParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Host': 'marketcheck-prod.apigee.net',
          'api_key': apiKey,
          'api_secret': process.env.NEXT_PUBLIC_MARKETCHECK_SECRET || 'X9OYtWITfjBp5sBX'
        },
        signal: controller.signal
      });

      let statsData = null;
      if (statsResponse.ok) {
        statsData = await statsResponse.json();
        console.log('✅ MarketCheck stats response:', {
          hasStats: !!statsData?.stats,
          priceStats: statsData?.stats?.price ? 'available' : 'none'
        });
      } else {
        console.warn('❌ MarketCheck stats request failed:', statsResponse.status, statsResponse.statusText);
      }

      clearTimeout(timeoutId);

      // Combine the data from both calls
      if (searchData || statsData) {
        const result = {
          listings: searchData?.listings || [],
          listingCount: searchData?.num_found || 0,
          stats: statsData?.stats || null,
          avgPrice: statsData?.stats?.price?.avg || null,
          minPrice: statsData?.stats?.price?.min || null,
          maxPrice: statsData?.stats?.price?.max || null,
          priceStdDev: statsData?.stats?.price?.std_dev || null
        };
        
        console.log('🎉 MarketCheck final result:', {
          listingsFound: result.listingCount,
          hasStats: !!result.stats,
          avgPrice: result.avgPrice ? `$${result.avgPrice.toLocaleString()}` : 'N/A'
        });
        
        return result;
      }

      console.log('❌ No MarketCheck data found for:', { make, model, year });
      return null;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn('MarketCheck request timed out');
        } else {
          console.warn('Error fetching MarketCheck data:', error.message);
        }
      } else {
        console.warn('Unknown error fetching MarketCheck data:', error);
      }
      return null;
    }
  };

  const runVINSearch = async () => {
    if (!vinInput.trim() || vinInput.length !== 17) {
      setVinResult({
        vin: vinInput,
        make: '',
        model: '',
        year: 0,
        country: '',
        manufacturer: '',
        isValid: false,
        error: 'VIN must be exactly 17 characters'
      });
      return;
    }

    setIsSearching(true);
    
    try {
      // Use NHTSA API to decode VIN
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vinInput}?format=json`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.Results || data.Results.length === 0) {
        throw new Error('No data returned from VIN API');
      }

      // Extract relevant information from NHTSA API response
      const results = data.Results;
      const getValue = (variableName: string) => {
        const item = results.find((r: any) => r.Variable === variableName);
        return item?.Value || '';
      };

      // Check if VIN is valid
      const errorCode = getValue('Error Code');
      const errorText = getValue('Error Text');
      
      if (errorCode && errorCode !== '0') {
        setVinResult({
          vin: vinInput,
          make: '',
          model: '',
          year: 0,
          country: '',
          manufacturer: '',
          isValid: false,
          error: errorText || 'Invalid VIN format'
        });
        setIsSearching(false);
        return;
      }

      // Extract vehicle information
      const make = getValue('Make');
      const model = getValue('Model');
      const year = parseInt(getValue('Model Year')) || 0;
      const manufacturer = getValue('Manufacturer Name');
      const vehicleType = getValue('Vehicle Type');
      const bodyClass = getValue('Body Class');
      const engineModel = getValue('Engine Model');
      const engineCylinders = getValue('Engine Number of Cylinders');
      const engineDisplacement = getValue('Displacement (L)');
      const fuelType = getValue('Fuel Type - Primary');
      const driveType = getValue('Drive Type');
      const transmission = getValue('Transmission Style');
      const country = getValue('Plant Country');
      const plantCompanyName = getValue('Plant Company Name');
      const plantCity = getValue('Plant City');
      const plantState = getValue('Plant State');

      // Format engine info
      let engineInfo = '';
      if (engineDisplacement && engineCylinders) {
        engineInfo = `${engineDisplacement}L ${engineCylinders}-Cylinder`;
      } else if (engineModel) {
        engineInfo = engineModel;
      } else if (engineDisplacement) {
        engineInfo = `${engineDisplacement}L Engine`;
      } else if (engineCylinders) {
        engineInfo = `${engineCylinders}-Cylinder Engine`;
      }

      // Format location
      let manufacturingLocation = country;
      if (plantCity && plantState) {
        manufacturingLocation += ` (${plantCity}, ${plantState})`;
      }

      // Fetch additional motorcycle market data
      let marketCheckData = null;

      if (make && model && year) {
        console.log('NHTSA Decoded Vehicle Data for MarketCheck search:', {
          make: make,
          model: model,
          year: year,
          manufacturer: manufacturer,
          vehicleType: vehicleType
        });
        
        // Fetch MarketCheck data with proper authentication
        try {
          marketCheckData = await fetchMarketCheckData(make, model, year);
        } catch (error) {
          console.warn('Error fetching MarketCheck data:', error);
          // Continue without market data
        }
      } else {
        console.warn('Insufficient NHTSA data for MarketCheck search:', {
          make: make || 'missing',
          model: model || 'missing', 
          year: year || 'missing'
        });
      }

      const result: VINResult = {
        vin: vinInput,
        make: make || 'Unknown',
        model: model || 'Unknown',
        year: year,
        trim: getValue('Trim') || undefined,
        engine: engineInfo || undefined,
        transmission: transmission || undefined,
        driveType: driveType || undefined,
        bodyStyle: bodyClass || vehicleType || undefined,
        fuelType: fuelType || undefined,
        country: manufacturingLocation || 'Unknown',
        manufacturer: manufacturer || plantCompanyName || 'Unknown',
        plantCode: vinInput.substring(10, 12),
        isValid: true,
        marketCheckData: marketCheckData || undefined
      };

      setVinResult(result);
      setApiResults(results);

    } catch (error) {
      console.error('VIN API Error:', error);
      setVinResult({
        vin: vinInput,
        make: '',
        model: '',
        year: 0,
        country: '',
        manufacturer: '',
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to decode VIN. Please try again.'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      runVINSearch();
    }
  };

  const getValue = (variableName: string) => {
    const item = apiResults.find((r: any) => r.Variable === variableName);
    return item?.Value || '';
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

  return (
    <div className="dashboard-container">
      <div className="background-pattern"></div>
      <div className="floating-elements">
        <div className="floating-orb purple"></div>
        <div className="floating-orb blue"></div>
        <div className="floating-orb green"></div>
      </div>

      <RevaniPortalHeader company={company} activePage="tools" />

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 className="section-header">🔍 VIN Runner</h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.5rem' }}>
            Decode Vehicle Identification Numbers to get detailed vehicle information
          </p>
        </div>

        {/* VIN Search Section */}
        <div className="kpi-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <DocumentTextIcon style={{ width: '2rem', height: '2rem', color: '#8b5cf6' }} />
            <div>
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                Enter VIN Number
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                Enter a 17-character Vehicle Identification Number
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={vinInput}
                onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                maxLength={17}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1.125rem',
                  fontFamily: 'monospace',
                  letterSpacing: '2px',
                  textAlign: 'center'
                }}
                placeholder="Enter 17-digit VIN (e.g., JYA1WE010MA000001)"
              />
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                {vinInput.length}/17 characters
              </div>
            </div>
            <button
              onClick={runVINSearch}
              disabled={isSearching || vinInput.length !== 17}
              style={{
                padding: '1rem 2rem',
                background: vinInput.length === 17 && !isSearching 
                  ? 'rgba(139, 92, 246, 0.8)' 
                  : 'rgba(107, 114, 128, 0.3)',
                border: '1px solid rgba(139, 92, 246, 0.5)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: vinInput.length === 17 && !isSearching ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '140px',
                justifyContent: 'center'
              }}
            >
              {isSearching ? (
                <>
                  <div style={{ 
                    width: '1rem', 
                    height: '1rem', 
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Searching...
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                  Decode VIN
                </>
              )}
            </button>
          </div>
        </div>

        {/* VIN Results Section */}
        {vinResult && (
          <div className="kpi-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <CogIcon style={{ width: '2rem', height: '2rem', color: vinResult.isValid ? '#22c55e' : '#ef4444' }} />
              <div>
                <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                  VIN Decode Results
                </h3>
                <p style={{ 
                  color: vinResult.isValid ? '#22c55e' : '#ef4444', 
                  fontSize: '0.875rem', 
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {vinResult.isValid ? '✓ Valid VIN' : '✗ Invalid VIN'}
                </p>
              </div>
            </div>

            {vinResult.error ? (
              <div style={{
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#fca5a5'
              }}>
                {vinResult.error}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* NHTSA Official VIN Data */}
                <div className="kpi-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ 
                      width: '3rem', 
                      height: '3rem', 
                      background: 'rgba(59, 130, 246, 0.2)', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                      🏛️
                    </div>
                    <div>
                      <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                        NHTSA Official Vehicle Data
                      </h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                        Official government vehicle identification data
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {/* Basic Information */}
                    <div>
                      <h4 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                        🚗 Basic Information
                      </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>VIN:</span>
                      <span style={{ color: 'white', fontFamily: 'monospace', letterSpacing: '1px' }}>{vinResult.vin}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Make:</span>
                      <span style={{ color: 'white', fontWeight: '500' }}>{getValue('Make')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Model:</span>
                      <span style={{ color: 'white', fontWeight: '500' }}>{getValue('Model')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Model Year:</span>
                      <span style={{ color: 'white', fontWeight: '500' }}>{getValue('Model Year')}</span>
                    </div>
                    {getValue('Trim') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Trim:</span>
                        <span style={{ color: 'white' }}>{getValue('Trim')}</span>
                      </div>
                    )}
                    {getValue('Series') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Series:</span>
                        <span style={{ color: 'white' }}>{getValue('Series')}</span>
                      </div>
                    )}
                    {getValue('Vehicle Type') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Vehicle Type:</span>
                        <span style={{ color: 'white' }}>{getValue('Vehicle Type')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Body & Design */}
                <div>
                  <h4 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                    🎨 Body & Design
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {getValue('Body Class') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Body Class:</span>
                        <span style={{ color: 'white' }}>{getValue('Body Class')}</span>
                      </div>
                    )}
                    {getValue('Doors') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Doors:</span>
                        <span style={{ color: 'white' }}>{getValue('Doors')}</span>
                      </div>
                    )}
                    {getValue('Windows') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Windows:</span>
                        <span style={{ color: 'white' }}>{getValue('Windows')}</span>
                      </div>
                    )}
                    {getValue('Wheel Base Type') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Wheelbase:</span>
                        <span style={{ color: 'white' }}>{getValue('Wheel Base Type')}</span>
                      </div>
                    )}
                    {getValue('Track Width (inches)') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Track Width:</span>
                        <span style={{ color: 'white' }}>{getValue('Track Width (inches)')} in</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Engine Specifications */}
                <div>
                  <h4 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                    ⚙️ Engine Specifications
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {getValue('Engine Number of Cylinders') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Cylinders:</span>
                        <span style={{ color: 'white' }}>{getValue('Engine Number of Cylinders')}</span>
                      </div>
                    )}
                    {getValue('Displacement (L)') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Displacement:</span>
                        <span style={{ color: 'white' }}>
                          {getValue('Displacement (L)')} L
                          {getValue('Displacement (L)') && ` (${Math.round(parseFloat(getValue('Displacement (L)')) * 1000)} cc)`}
                        </span>
                      </div>
                    )}
                    {getValue('Displacement (CC)') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Displacement (CC):</span>
                        <span style={{ color: 'white' }}>{getValue('Displacement (CC)')} cc</span>
                      </div>
                    )}
                    {getValue('Displacement (CI)') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Displacement (CI):</span>
                        <span style={{ color: 'white' }}>{getValue('Displacement (CI)')} ci</span>
                      </div>
                    )}
                    {getValue('Engine Configuration') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Configuration:</span>
                        <span style={{ color: 'white' }}>{getValue('Engine Configuration')}</span>
                      </div>
                    )}
                    {getValue('Fuel Type - Primary') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Fuel Type:</span>
                        <span style={{ color: 'white' }}>{getValue('Fuel Type - Primary')}</span>
                      </div>
                    )}
                    {getValue('Engine Power (kW)') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Power:</span>
                        <span style={{ color: 'white' }}>{getValue('Engine Power (kW)')} kW</span>
                      </div>
                    )}
                    {getValue('Engine Brake (hp) From') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Horsepower:</span>
                        <span style={{ color: 'white' }}>{getValue('Engine Brake (hp) From')} hp</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transmission & Drivetrain */}
                <div>
                  <h4 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                    🔧 Transmission & Drivetrain
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {getValue('Transmission Style') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Transmission:</span>
                        <span style={{ color: 'white' }}>{getValue('Transmission Style')}</span>
                      </div>
                    )}
                    {getValue('Transmission Speeds') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Speeds:</span>
                        <span style={{ color: 'white' }}>{getValue('Transmission Speeds')}</span>
                      </div>
                    )}
                    {getValue('Drive Type') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Drive Type:</span>
                        <span style={{ color: 'white' }}>{getValue('Drive Type')}</span>
                      </div>
                    )}
                    {getValue('Axles') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Axles:</span>
                        <span style={{ color: 'white' }}>{getValue('Axles')}</span>
                      </div>
                    )}
                    {getValue('Axle Configuration') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Axle Config:</span>
                        <span style={{ color: 'white' }}>{getValue('Axle Configuration')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Safety & Features */}
                <div>
                  <h4 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                    🛡️ Safety & Features
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {getValue('Anti-lock Braking System (ABS)') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>ABS:</span>
                        <span style={{ color: 'white' }}>{getValue('Anti-lock Braking System (ABS)')}</span>
                      </div>
                    )}
                    {getValue('Electronic Stability Control (ESC)') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>ESC:</span>
                        <span style={{ color: 'white' }}>{getValue('Electronic Stability Control (ESC)')}</span>
                      </div>
                    )}
                    {getValue('Traction Control') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Traction Control:</span>
                        <span style={{ color: 'white' }}>{getValue('Traction Control')}</span>
                      </div>
                    )}
                    {getValue('Air Bag Localization') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Airbags:</span>
                        <span style={{ color: 'white' }}>{getValue('Air Bag Localization')}</span>
                      </div>
                    )}
                    {getValue('Seat Belts Type') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Seat Belts:</span>
                        <span style={{ color: 'white' }}>{getValue('Seat Belts Type')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manufacturing Details */}
                <div>
                  <h4 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                    🏭 Manufacturing Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {getValue('Manufacturer Name') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Manufacturer:</span>
                        <span style={{ color: 'white' }}>{getValue('Manufacturer Name')}</span>
                      </div>
                    )}
                    {getValue('Plant Country') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Plant Country:</span>
                        <span style={{ color: 'white' }}>{getValue('Plant Country')}</span>
                      </div>
                    )}
                    {getValue('Plant City') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Plant City:</span>
                        <span style={{ color: 'white' }}>{getValue('Plant City')}</span>
                      </div>
                    )}
                    {getValue('Plant State') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Plant State:</span>
                        <span style={{ color: 'white' }}>{getValue('Plant State')}</span>
                      </div>
                    )}
                    {getValue('Plant Company Name') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Plant Company:</span>
                        <span style={{ color: 'white' }}>{getValue('Plant Company Name')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Specifications */}
                <div>
                  <h4 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                    📊 Additional Specifications
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {getValue('GVWR') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>GVWR:</span>
                        <span style={{ color: 'white' }}>{getValue('GVWR')}</span>
                      </div>
                    )}
                    {getValue('Curb Weight (pounds)') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Curb Weight:</span>
                        <span style={{ color: 'white' }}>{getValue('Curb Weight (pounds)')} lbs</span>
                      </div>
                    )}
                    {getValue('Wheelbase (inches)') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Wheelbase:</span>
                        <span style={{ color: 'white' }}>{getValue('Wheelbase (inches)')} in</span>
                      </div>
                    )}
                    {getValue('Gross Vehicle Weight Rating From') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>GVWR From:</span>
                        <span style={{ color: 'white' }}>{getValue('Gross Vehicle Weight Rating From')}</span>
                      </div>
                    )}
                    {getValue('Tire Size Front') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Front Tires:</span>
                        <span style={{ color: 'white' }}>{getValue('Tire Size Front')}</span>
                      </div>
                    )}
                    {getValue('Tire Size Rear') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Rear Tires:</span>
                        <span style={{ color: 'white' }}>{getValue('Tire Size Rear')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Motorcycle Specifications */}
                {(getValue('Custom Motorcycle Type') || getValue('Motorcycle Suspension Type') || getValue('Motorcycle Chassis Type') || getValue('Motorcycle Pegs or Footrests')) && (
                  <div>
                    <h4 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                      🏍️ Motorcycle Specifications
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {getValue('Custom Motorcycle Type') && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Motorcycle Type:</span>
                          <span style={{ color: 'white' }}>{getValue('Custom Motorcycle Type')}</span>
                        </div>
                      )}
                      {getValue('Motorcycle Suspension Type') && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Suspension:</span>
                          <span style={{ color: 'white' }}>{getValue('Motorcycle Suspension Type')}</span>
                        </div>
                      )}
                      {getValue('Motorcycle Chassis Type') && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Chassis Type:</span>
                          <span style={{ color: 'white' }}>{getValue('Motorcycle Chassis Type')}</span>
                        </div>
                      )}
                      {getValue('Motorcycle Pegs or Footrests') && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Pegs/Footrests:</span>
                          <span style={{ color: 'white' }}>{getValue('Motorcycle Pegs or Footrests')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Commercial Vehicle Info */}
                {(getValue('Bus Floor Configuration') || getValue('Bus Type') || getValue('Truck Body Type') || getValue('Trailer Type Connection')) && (
                  <div>
                    <h4 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                      🚛 Commercial Vehicle
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {getValue('Bus Floor Configuration') && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Bus Floor Config:</span>
                          <span style={{ color: 'white' }}>{getValue('Bus Floor Configuration')}</span>
                        </div>
                      )}
                      {getValue('Bus Type') && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Bus Type:</span>
                          <span style={{ color: 'white' }}>{getValue('Bus Type')}</span>
                        </div>
                      )}
                      {getValue('Truck Body Type') && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Truck Body:</span>
                          <span style={{ color: 'white' }}>{getValue('Truck Body Type')}</span>
                        </div>
                      )}
                      {getValue('Trailer Type Connection') && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Trailer Connection:</span>
                          <span style={{ color: 'white' }}>{getValue('Trailer Type Connection')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                  </div>
                </div>




                {/* MarketCheck Market Data */}
                <div className="kpi-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ 
                      width: '3rem', 
                      height: '3rem', 
                      background: 'rgba(245, 101, 101, 0.2)', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '1px solid rgba(245, 101, 101, 0.3)'
                    }}>
                      💰
                    </div>
                    <div>
                      <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                        MarketCheck Market Data
                      </h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                        Current market listings and pricing information
                      </p>
                    </div>
                  </div>

                  {vinResult.marketCheckData ? (
                    <div>
                      <h4 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                        💰 Market Analysis
                      </h4>
                      
                      {/* Market Statistics */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h5 style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.75rem 0' }}>
                          📊 Price Statistics
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Active Listings:</span>
                            <span style={{ color: 'white', fontWeight: '600' }}>{vinResult.marketCheckData.listingCount || 0}</span>
                          </div>
                          {vinResult.marketCheckData.avgPrice && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#94a3b8' }}>Average Price:</span>
                              <span style={{ color: '#22c55e', fontWeight: '600' }}>
                                ${vinResult.marketCheckData.avgPrice.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {vinResult.marketCheckData.minPrice && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#94a3b8' }}>Lowest Price:</span>
                              <span style={{ color: '#60a5fa' }}>
                                ${vinResult.marketCheckData.minPrice.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {vinResult.marketCheckData.maxPrice && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#94a3b8' }}>Highest Price:</span>
                              <span style={{ color: '#f87171' }}>
                                ${vinResult.marketCheckData.maxPrice.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sample Listings */}
                      {vinResult.marketCheckData.listings && vinResult.marketCheckData.listings.length > 0 && (
                        <div>
                          <h5 style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.75rem 0' }}>
                            🏪 Recent Listings (Top {Math.min(3, vinResult.marketCheckData.listings.length)})
                          </h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {vinResult.marketCheckData.listings.slice(0, 3).map((listing: any, index: number) => (
                              <div key={index} style={{
                                padding: '0.75rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                              }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {listing.heading && (
                                    <div style={{ color: 'white', fontWeight: '500', fontSize: '0.875rem' }}>
                                      {listing.heading}
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {listing.price && (
                                      <span style={{ color: '#22c55e', fontWeight: '600' }}>
                                        ${parseInt(listing.price).toLocaleString()}
                                      </span>
                                    )}
                                    {listing.miles && (
                                      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                        {parseInt(listing.miles).toLocaleString()} miles
                                      </span>
                                    )}
                                  </div>
                                  {listing.dealer?.name && (
                                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                      {listing.dealer.name}
                                      {listing.dealer.city && listing.dealer.state && (
                                        <span> • {listing.dealer.city}, {listing.dealer.state}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Raw Data Section for Debugging */}
                      <div style={{ marginTop: '2rem' }}>
                        <h5 style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.75rem 0' }}>
                          🔧 Raw API Data (Debug)
                        </h5>
                        <details style={{ 
                          background: 'rgba(0, 0, 0, 0.3)', 
                          border: '1px solid rgba(255, 255, 255, 0.1)', 
                          borderRadius: '8px',
                          padding: '0.75rem'
                        }}>
                          <summary style={{ 
                            color: '#94a3b8', 
                            cursor: 'pointer', 
                            fontSize: '0.875rem',
                            marginBottom: '0.5rem'
                          }}>
                            Click to view raw MarketCheck data
                          </summary>
                          <pre style={{ 
                            color: '#e2e8f0', 
                            fontSize: '0.75rem', 
                            background: 'rgba(0, 0, 0, 0.5)', 
                            padding: '1rem', 
                            borderRadius: '6px', 
                            overflow: 'auto', 
                            maxHeight: '300px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all'
                          }}>
                            {JSON.stringify(vinResult.marketCheckData, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        borderRadius: '8px',
                        color: '#fbbf24',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span>⚠️</span>
                          <strong>No Market Data Available</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>
                          Either the API key is not configured or no market listings were found for this vehicle. 
                          Check console for details and raw data below.
                        </p>
                      </div>

                      {/* Show raw data even when no results for debugging */}
                      <div>
                        <h5 style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.75rem 0' }}>
                          🔧 Debug Information
                        </h5>
                        <details style={{ 
                          background: 'rgba(0, 0, 0, 0.3)', 
                          border: '1px solid rgba(255, 255, 255, 0.1)', 
                          borderRadius: '8px',
                          padding: '0.75rem'
                        }}>
                          <summary style={{ 
                            color: '#94a3b8', 
                            cursor: 'pointer', 
                            fontSize: '0.875rem',
                            marginBottom: '0.5rem'
                          }}>
                            Click to view debug data (API response, search params, etc.)
                          </summary>
                          <div style={{ 
                            color: '#e2e8f0', 
                            fontSize: '0.75rem', 
                            background: 'rgba(0, 0, 0, 0.5)', 
                            padding: '1rem', 
                            borderRadius: '6px'
                          }}>
                            <p><strong>MarketCheck Data:</strong> {vinResult.marketCheckData ? 'Present but empty' : 'null/undefined'}</p>
                            <p><strong>Check browser console for:</strong></p>
                            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                              <li>NHTSA decoded data used for search</li>
                              <li>MarketCheck API search URLs</li>
                              <li>API response details</li>
                              <li>Error messages if any</li>
                            </ul>
                            {vinResult.marketCheckData && (
                              <pre style={{ 
                                marginTop: '1rem',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all'
                              }}>
                                {JSON.stringify(vinResult.marketCheckData, null, 2)}
                              </pre>
                            )}
                          </div>
                        </details>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

      </main>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
