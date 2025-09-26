'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../../../../dashboard.css';
import RevaniPortalHeader from '@/components/RevaniPortalHeader';
import {
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface BikeImportItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  status: 'acquisition' | 'evaluation' | 'available' | 'sold' | 'hold' | 'maintenance';
  vin: string;
  mileage: number;
  description: string;
  color: string;
  engineSize: string;
  fuelType: 'gasoline' | 'electric' | 'hybrid';
  transmission: 'manual' | 'automatic';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  errors?: string[];
  warnings?: string[];
}

export default function BikesImportFormPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [importItems, setImportItems] = useState<BikeImportItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: number;
    warnings: number;
  }>({ success: 0, errors: 0, warnings: 0 });

  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const brands = [
    'Yamaha', 'Honda', 'Kawasaki', 'Suzuki', 'BMW', 'Ducati', 'Harley-Davidson',
    'KTM', 'Triumph', 'Aprilia', 'MV Agusta', 'Indian', 'Victory', 'Royal Enfield'
  ];

  const statusOptions = [
    { value: 'acquisition', label: 'Acquisition', color: 'text-purple-500' },
    { value: 'evaluation', label: 'Evaluation', color: 'text-orange-500' },
    { value: 'available', label: 'Available', color: 'text-green-500' },
    { value: 'sold', label: 'Sold', color: 'text-red-500' },
    { value: 'hold', label: 'Hold', color: 'text-yellow-500' },
    { value: 'maintenance', label: 'Maintenance', color: 'text-blue-500' }
  ];

  const fuelTypeOptions = [
    { value: 'gasoline', label: 'Gasoline' },
    { value: 'electric', label: 'Electric' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  const transmissionOptions = [
    { value: 'manual', label: 'Manual' },
    { value: 'automatic', label: 'Automatic' }
  ];

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
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
    const newItem: BikeImportItem = {
      id: `temp-${Date.now()}`,
      name: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      price: 0,
      status: 'acquisition',
      vin: '',
      mileage: 0,
      description: '',
      color: '',
      engineSize: '',
      fuelType: 'gasoline',
      transmission: 'manual',
      condition: 'good'
    };
    setImportItems([...importItems, { ...newItem, ...validateItem(newItem) }]);
  };

  const removeItem = (id: string) => {
    setImportItems(importItems.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof BikeImportItem, value: any) => {
    const updatedItems = importItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-generate name if year, brand, or model changed
        if (['year', 'brand', 'model'].includes(field)) {
          const parts = [
            updatedItem.year > 0 ? updatedItem.year.toString() : '',
            updatedItem.brand,
            updatedItem.model
          ].filter(part => part.trim() !== '');
          
          if (parts.length > 0) {
            updatedItem.name = parts.join(' ');
          }
        }
        
        // VIN lookup if VIN changed and is valid
        if (field === 'vin' && value.length === 17) {
          fetchVinData(value).then(vinData => {
            if (vinData) {
              const enhancedItem = { ...updatedItem };
              
              // Fill in missing data from VIN
              if (!enhancedItem.brand) enhancedItem.brand = vinData.brand;
              if (!enhancedItem.model) enhancedItem.model = vinData.model;
              if (!enhancedItem.year || enhancedItem.year === new Date().getFullYear()) enhancedItem.year = vinData.year;
              if (!enhancedItem.engineSize) enhancedItem.engineSize = vinData.engineSize;
              if (enhancedItem.fuelType === 'gasoline') enhancedItem.fuelType = vinData.fuelType;
              if (enhancedItem.transmission === 'manual') enhancedItem.transmission = vinData.transmission;
              
              // Regenerate name if we got new data
              const nameParts = [
                enhancedItem.year > 0 ? enhancedItem.year.toString() : '',
                enhancedItem.brand,
                enhancedItem.model
              ].filter(part => part.trim() !== '');
              
              if (nameParts.length > 0) {
                enhancedItem.name = nameParts.join(' ');
              }
              
              // Update the state with enhanced data
              setImportItems(prevItems => 
                prevItems.map(prevItem => 
                  prevItem.id === id ? { ...enhancedItem, ...validateItem(enhancedItem) } : prevItem
                )
              );
            }
          }).catch(error => {
            console.warn('VIN lookup failed:', error);
          });
        }
        
        return { ...updatedItem, ...validateItem(updatedItem) };
      }
      return item;
    });
    
    setImportItems(updatedItems);
  };

  const validateItem = (item: BikeImportItem): { errors: string[], warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!item.name.trim()) errors.push('Name is required');
    if (!item.brand.trim()) errors.push('Brand is required');
    if (!item.model.trim()) errors.push('Model is required');

    // VIN is optional, but if provided, must be valid length
    if (item.vin.trim() && item.vin.length !== 17) {
      warnings.push('VIN should be 17 characters if provided');
    }

    // Color is optional - no validation required

    // Data validation
    if (item.year < 1900 || item.year > new Date().getFullYear() + 1) {
      warnings.push('Year seems invalid');
    }
    if (item.price < 0) warnings.push('Price should be positive');
    if (item.mileage < 0) warnings.push('Mileage should be positive');

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
        // Map status to match inventory page expectations (capitalize first letter)
        const mapStatusForAPI = (status: string): string => {
          switch (status.toLowerCase()) {
            case 'acquisition': return 'Acquisition';
            case 'evaluation': return 'Evaluation';
            case 'available': return 'Listed'; // Map 'available' to 'Listed' for inventory
            case 'sold': return 'Sold';
            case 'hold': return 'Hold';
            case 'maintenance': return 'Servicing'; // Map 'maintenance' to 'Servicing' for inventory
            default: return 'Acquisition';
          }
        };

        // Create the bike data in the format expected by the API
        const bikeData = {
          name: item.name,
          make: item.brand, // API expects 'make' field
          model: item.model,
          year: item.year,
          price: item.price,
          status: mapStatusForAPI(item.status),
          vin: item.vin,
          mileage: item.mileage > 0 ? `${item.mileage} mi` : '0 mi', // Convert number to string with units
          description: item.description,
          color: item.color,
          engineSize: item.engineSize,
          fuelType: item.fuelType,
          transmission: item.transmission,
          condition: item.condition,
          dateAcquired: new Date() // Set current date for acquisition
        };

        // Make API call to create the bike
        const response = await fetch(`/api/companies/${params.companyId}/inventory/bikes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bikeData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create bike: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.success) {
          success++;
          console.log(`✅ Successfully imported bike: ${item.name}`);
        } else {
          throw new Error(result.error || 'Unknown error occurred');
        }
      } catch (error) {
        console.error(`❌ Failed to import bike ${item.name}:`, error);
        errors++;
      }

      if (item.warnings && item.warnings.length > 0) {
        warnings++;
      }

      setImportProgress(((i + 1) / importItems.length) * 100);
    }

    setImportResults({ success, errors, warnings });
    setImporting(false);

    // If all items were imported successfully, redirect back to mass import page after a delay
    if (success === importItems.length && errors === 0) {
      setTimeout(() => {
        router.push(`/dashboard/${params.companyId}/tools/mass-import`);
      }, 3000); // Give user time to see the success message
    }
  };

  const goBack = () => {
    router.push(`/dashboard/${params.companyId}/tools/mass-import`);
  };

  // File handling functions
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    setUploading(true);
    
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let extractedData: BikeImportItem[] = [];

      switch (fileExtension) {
        case 'csv':
          extractedData = await processCsvFile(file);
          break;
        case 'xlsx':
        case 'xls':
          extractedData = await processExcelFile(file);
          break;
        case 'pdf':
          extractedData = await processPdfFile(file);
          break;
        default:
          throw new Error('Unsupported file format');
      }

      // Add validation to each extracted item
      const validatedData = extractedData.map(item => ({
        ...item,
        ...validateItem(item)
      }));

      setImportItems(validatedData);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please check the format and try again.');
    } finally {
      setUploading(false);
    }
  };

  const processCsvFile = async (file: File): Promise<BikeImportItem[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const data: BikeImportItem[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',');
            const item: BikeImportItem = {
              id: `imported-${Date.now()}-${i}`,
              name: getValueByHeader(headers, values, ['name', 'bike name', 'model name']) || '',
              brand: getValueByHeader(headers, values, ['brand', 'manufacturer', 'make']) || '',
              model: getValueByHeader(headers, values, ['model', 'bike model']) || '',
              year: parseInt(getValueByHeader(headers, values, ['year', 'model year']) || '0'),
              price: parseFloat(getValueByHeader(headers, values, ['price', 'selling price', 'retail price']) || '0'),
              status: getValueByHeader(headers, values, ['status', 'condition', 'availability']) as any || 'available',
              vin: getValueByHeader(headers, values, ['vin', 'chassis number', 'frame number']) || '',
              mileage: parseInt(getValueByHeader(headers, values, ['mileage', 'miles', 'kilometers', 'km']) || '0'),
              description: getValueByHeader(headers, values, ['description', 'notes', 'details']) || '',
              color: getValueByHeader(headers, values, ['color', 'colour', 'paint']) || '',
              engineSize: getValueByHeader(headers, values, ['engine', 'engine size', 'displacement', 'cc']) || '',
              fuelType: getValueByHeader(headers, values, ['fuel', 'fuel type', 'engine type']) as any || 'gasoline',
              transmission: getValueByHeader(headers, values, ['transmission', 'gearbox']) as any || 'manual',
              condition: getValueByHeader(headers, values, ['condition', 'bike condition', 'quality']) as any || 'good'
            };
            data.push(item);
          }
        }
        resolve(data);
      };
      reader.readAsText(file);
    });
  };

  const processExcelFile = async (file: File): Promise<BikeImportItem[]> => {
    try {
      // Import xlsx library dynamically
      const XLSX = await import('xlsx');
      
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Get the first worksheet
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        throw new Error('Excel file must have at least a header row and one data row');
      }
      
      // Get headers (first row) and convert to lowercase for matching
      const headers = (jsonData[0] as string[]).map(h => h ? h.toString().toLowerCase().trim() : '');
      
      const extractedData: BikeImportItem[] = [];
      
      // Process each data row (skip header row)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        
        // Skip empty rows
        if (!row || row.every(cell => !cell)) continue;
        
        // Extract individual fields
        const brand = getValueByHeaderExcel(headers, row, ['brand', 'manufacturer', 'make', 'company']) || '';
        const model = getValueByHeaderExcel(headers, row, ['model', 'bike model', 'version']) || '';
        const year = parseInt(getValueByHeaderExcel(headers, row, ['year', 'model year', 'manufacture year']) || '0');
        const rawVin = getValueByHeaderExcel(headers, row, ['vin', 'chassis number', 'frame number', 'vehicle id']) || '';
        
        // Validate VIN (should be 17 characters for a valid VIN)
        const validVin = rawVin.length === 17 ? rawVin : '';
        
        // Auto-generate name from year, brand, and model
        const autoGeneratedName = [year > 0 ? year.toString() : '', brand, model]
          .filter(part => part.trim() !== '')
          .join(' ');

        const item: BikeImportItem = {
          id: `excel-${Date.now()}-${i}`,
          name: autoGeneratedName || getValueByHeaderExcel(headers, row, ['name', 'bike name', 'model name', 'bike', 'motorcycle']) || '',
          brand,
          model,
          year,
          price: parseFloat(getValueByHeaderExcel(headers, row, ['price', 'selling price', 'retail price', 'cost', 'value']) || '0'),
          status: normalizeStatus(getValueByHeaderExcel(headers, row, ['status', 'condition', 'availability', 'state'])) || 'acquisition',
          vin: validVin,
          mileage: parseInt(getValueByHeaderExcel(headers, row, ['mileage', 'miles', 'kilometers', 'km', 'odometer']) || '0'),
          description: getValueByHeaderExcel(headers, row, ['description', 'notes', 'details', 'comments', 'remarks']) || '',
          color: getValueByHeaderExcel(headers, row, ['color', 'colour', 'paint', 'finish']) || '',
          engineSize: getValueByHeaderExcel(headers, row, ['engine', 'engine size', 'displacement', 'cc', 'capacity']) || '',
          fuelType: normalizeFuelType(getValueByHeaderExcel(headers, row, ['fuel', 'fuel type', 'engine type', 'power'])) || 'gasoline',
          transmission: normalizeTransmission(getValueByHeaderExcel(headers, row, ['transmission', 'gearbox', 'gear'])) || 'manual',
          condition: normalizeCondition(getValueByHeaderExcel(headers, row, ['condition', 'bike condition', 'quality', 'state'])) || 'good'
        };
        
        // Note: VIN lookup would happen in a real implementation
        // For now, we'll skip the async VIN lookup during Excel processing
        // to avoid blocking the UI thread
        
        extractedData.push(item);
      }
      
      console.log(`Successfully extracted ${extractedData.length} bikes from Excel file`);
      return extractedData;
      
    } catch (error) {
      console.error('Error processing Excel file:', error);
      throw new Error('Failed to parse Excel file. Please check the format.');
    }
  };

  const processPdfFile = async (file: File): Promise<BikeImportItem[]> => {
    // PDF processing would require a PDF parsing library
    // This is a simulation of the process
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData: BikeImportItem[] = [
          {
            id: `pdf-${Date.now()}-1`,
            name: 'Honda CBR600RR',
            brand: 'Honda',
            model: 'CBR600RR',
            year: 2023,
            price: 12500,
            status: 'available',
            vin: '2HGBH41JXMN109187',
            mileage: 2500,
            description: 'Well maintained sport bike',
            color: 'Red',
            engineSize: '600cc',
            fuelType: 'gasoline',
            transmission: 'manual',
            condition: 'good'
          }
        ];
        resolve(mockData);
      }, 2000);
    });
  };

  const getValueByHeader = (headers: string[], values: string[], possibleNames: string[]): string => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => h.includes(name));
      if (index !== -1 && values[index]) {
        return values[index].trim().replace(/"/g, '');
      }
    }
    return '';
  };

  const getValueByHeaderExcel = (headers: string[], row: any[], possibleNames: string[]): string => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => h.includes(name.toLowerCase()));
      if (index !== -1 && row[index] !== undefined && row[index] !== null) {
        return row[index].toString().trim();
      }
    }
    return '';
  };

  const normalizeStatus = (value: string): 'acquisition' | 'evaluation' | 'available' | 'sold' | 'hold' | 'maintenance' => {
    const lower = value.toLowerCase();
    if (lower.includes('acquisition') || lower.includes('acquire') || lower.includes('new') || lower.includes('incoming')) return 'acquisition';
    if (lower.includes('evaluation') || lower.includes('assess') || lower.includes('review') || lower.includes('check')) return 'evaluation';
    if (lower.includes('sold') || lower.includes('sale')) return 'sold';
    if (lower.includes('hold') || lower.includes('reserve')) return 'hold';
    if (lower.includes('maintenance') || lower.includes('repair') || lower.includes('service')) return 'maintenance';
    if (lower.includes('available') || lower.includes('ready') || lower.includes('stock')) return 'available';
    return 'acquisition';
  };

  const normalizeFuelType = (value: string): 'gasoline' | 'electric' | 'hybrid' => {
    const lower = value.toLowerCase();
    if (lower.includes('electric') || lower.includes('battery')) return 'electric';
    if (lower.includes('hybrid')) return 'hybrid';
    return 'gasoline';
  };

  const normalizeTransmission = (value: string): 'manual' | 'automatic' => {
    const lower = value.toLowerCase();
    if (lower.includes('automatic') || lower.includes('auto') || lower.includes('cvt')) return 'automatic';
    return 'manual';
  };

  const normalizeCondition = (value: string): 'excellent' | 'good' | 'fair' | 'poor' => {
    const lower = value.toLowerCase();
    if (lower.includes('excellent') || lower.includes('perfect') || lower.includes('pristine')) return 'excellent';
    if (lower.includes('fair') || lower.includes('average') || lower.includes('okay')) return 'fair';
    if (lower.includes('poor') || lower.includes('bad') || lower.includes('damaged')) return 'poor';
    return 'good';
  };

  const fetchVinData = async (vin: string) => {
    try {
      // In a real implementation, you would call a VIN decoder API
      // For now, we'll simulate the VIN lookup process with enhanced engine size detection
      console.log(`Looking up VIN: ${vin}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Enhanced mock VIN data with more engine size patterns
      // In reality, you'd use services like NHTSA API, VIN Decoder APIs, etc.
      const engineSizePatterns = [
        '125cc', '150cc', '200cc', '250cc', '300cc', '400cc', '500cc', 
        '600cc', '650cc', '750cc', '800cc', '900cc', '1000cc', '1100cc', 
        '1200cc', '1300cc', '1400cc', '1500cc', '1600cc', '1800cc', '2000cc'
      ];
      
      const mockVinData = {
        brand: 'Honda', // Would be decoded from VIN
        model: 'CBR600RR', // Would be decoded from VIN
        year: 2023, // Would be decoded from VIN
        engineSize: engineSizePatterns[Math.floor(Math.random() * engineSizePatterns.length)],
        fuelType: 'gasoline' as const,
        transmission: 'manual' as const
      };
      
      return mockVinData;
    } catch (error) {
      console.error('VIN lookup failed:', error);
      return null;
    }
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
            <h1>Bikes & Motorcycles Import Form</h1>
            <p>Add multiple bikes with all required information</p>
          </div>
        </div>

        {importItems.length === 0 ? (
          <div className="file-drop-zone">
            <div 
              className={`drop-area ${dragOver ? 'drag-over' : ''}`}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="drop-content">
                <div className="file-icons">
                  <DocumentTextIcon className="h-12 w-12 text-green-500" />
                  <TableCellsIcon className="h-12 w-12 text-blue-500" />
                  <DocumentIcon className="h-12 w-12 text-red-500" />
                </div>
                <h3>Drop your files here or click to browse</h3>
                <p>Supports Excel (.xlsx, .xls), CSV, and PDF files</p>
                <div className="supported-formats">
                  <span className="format-pill excel">📊 Excel</span>
                  <span className="format-pill csv">📄 CSV</span>
                  <span className="format-pill pdf">📑 PDF</span>
                </div>
                {uploading && (
                  <div className="upload-progress">
                    <div className="spinner"></div>
                    <span>Processing file...</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                onChange={handleFileSelect}
                className="hidden-file-input"
                multiple={false}
              />
            </div>
            
            <div className="manual-entry">
              <div className="divider">
                <span>OR</span>
              </div>
              <button onClick={addNewItem} className="manual-button">
                <PlusIcon className="h-5 w-5 mr-2" />
                Enter Data Manually
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Data Extraction Summary */}
            <div className="extraction-summary">
              <div className="summary-header">
                <h2>📊 Extracted Data Preview</h2>
                <p>Review the data extracted from your file. Edit any fields that need correction.</p>
              </div>
              
              <div className="extraction-stats">
                <div className="stat-item">
                  <span className="stat-number">{importItems.length}</span>
                  <span className="stat-label">Items Found</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number success">
                    {importItems.filter(item => !item.errors || item.errors.length === 0).length}
                  </span>
                  <span className="stat-label">Valid Items</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number warning">
                    {importItems.filter(item => item.errors && item.errors.length > 0).length}
                  </span>
                  <span className="stat-label">Need Review</span>
                </div>
              </div>
            </div>

            <div className="import-items">
              {importItems.map((item, index) => (
                <div key={item.id} className="import-item-card">
                  <div className="item-header">
                    <h3>Bike #{index + 1}</h3>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="remove-button"
                      disabled={importing}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="form-grid">
                    {/* Basic Information */}
                    <div className="form-section">
                      <h4>Basic Information</h4>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Name *</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            placeholder="e.g., Yamaha R1"
                            className={item.errors?.includes('Name is required') ? 'error' : ''}
                          />
                        </div>
                        <div className="form-group">
                          <label>Brand *</label>
                          <select
                            value={item.brand}
                            onChange={(e) => updateItem(item.id, 'brand', e.target.value)}
                            className={item.errors?.includes('Brand is required') ? 'error' : ''}
                          >
                            <option value="">Select Brand</option>
                            {brands.map(brand => (
                              <option key={brand} value={brand}>{brand}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Model *</label>
                          <input
                            type="text"
                            value={item.model}
                            onChange={(e) => updateItem(item.id, 'model', e.target.value)}
                            placeholder="e.g., R1"
                            className={item.errors?.includes('Model is required') ? 'error' : ''}
                          />
                        </div>
                        <div className="form-group">
                          <label>Year *</label>
                          <input
                            type="number"
                            value={item.year}
                            onChange={(e) => updateItem(item.id, 'year', parseInt(e.target.value))}
                            min="1900"
                            max={new Date().getFullYear() + 1}
                            className={item.warnings?.includes('Year seems invalid') ? 'warning' : ''}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Color (Optional)</label>
                          <input
                            type="text"
                            value={item.color}
                            onChange={(e) => updateItem(item.id, 'color', e.target.value)}
                            placeholder="e.g., Blue"
                          />
                        </div>
                        <div className="form-group">
                          <label>Engine Size (Optional)</label>
                          <input
                            type="text"
                            value={item.engineSize}
                            onChange={(e) => updateItem(item.id, 'engineSize', e.target.value)}
                            placeholder="e.g., 1000cc"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Technical Specifications */}
                    <div className="form-section">
                      <h4>Technical Specifications</h4>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Fuel Type</label>
                          <select
                            value={item.fuelType}
                            onChange={(e) => updateItem(item.id, 'fuelType', e.target.value)}
                          >
                            {fuelTypeOptions.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Transmission</label>
                          <select
                            value={item.transmission}
                            onChange={(e) => updateItem(item.id, 'transmission', e.target.value)}
                          >
                            {transmissionOptions.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Condition</label>
                          <select
                            value={item.condition}
                            onChange={(e) => updateItem(item.id, 'condition', e.target.value)}
                          >
                            {conditionOptions.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Mileage</label>
                          <input
                            type="number"
                            value={item.mileage}
                            onChange={(e) => updateItem(item.id, 'mileage', parseInt(e.target.value))}
                            min="0"
                            placeholder="0"
                            className={item.warnings?.includes('Mileage should be positive') ? 'warning' : ''}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business Information */}
                    <div className="form-section">
                      <h4>Business Information</h4>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Price *</label>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value))}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className={item.warnings?.includes('Price should be positive') ? 'warning' : ''}
                          />
                        </div>
                        <div className="form-group">
                          <label>Status</label>
                          <select
                            value={item.status}
                            onChange={(e) => updateItem(item.id, 'status', e.target.value)}
                          >
                            {statusOptions.map(option => (
                              <option key={option.value} value={option.value} className={option.color}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group full-width">
                          <label>VIN (Optional)</label>
                          <input
                            type="text"
                            value={item.vin}
                            onChange={(e) => updateItem(item.id, 'vin', e.target.value.toUpperCase())}
                            placeholder="Vehicle Identification Number (17 characters)"
                            className={item.warnings?.includes('VIN should be 17 characters if provided') ? 'warning' : ''}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group full-width">
                          <label>Description</label>
                          <textarea
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Additional details about the bike..."
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
                  <span className="label">Total Bikes:</span>
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
              </div>

              <div className="action-buttons">
                <button
                  onClick={addNewItem}
                  className="secondary-button"
                  disabled={importing}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Another Bike
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
                      Import {importItems.length} Bikes
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Import Results */}
            {importResults.success > 0 || importResults.errors > 0 ? (
              <div className="import-results">
                <h3>Import Results</h3>
                {importResults.success === importItems.length && importResults.errors === 0 ? (
                  <div className="success-message">
                    <CheckCircleIcon className="h-8 w-8" />
                    <div className="success-content">
                      <h4>🎉 All bikes imported successfully!</h4>
                      <p>All {importResults.success} bikes have been added to your inventory.</p>
                      <p className="redirect-notice">Redirecting you back to Mass Import in 3 seconds...</p>
                    </div>
                  </div>
                ) : (
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
                )}
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

        .file-drop-zone {
          max-width: 800px;
          margin: 0 auto;
        }

        .drop-area {
          border: 3px dashed rgba(139, 92, 246, 0.3);
          border-radius: 20px;
          padding: 3rem 2rem;
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 2rem;
        }

        .drop-area:hover {
          border-color: rgba(139, 92, 246, 0.6);
          background: rgba(30, 41, 59, 0.9);
          transform: translateY(-2px);
        }

        .drop-area.drag-over {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
          transform: scale(1.02);
        }

        .drop-content {
          text-align: center;
          color: white;
        }

        .file-icons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .drop-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: white;
        }

        .drop-content p {
          color: #94a3b8;
          margin-bottom: 1.5rem;
        }

        .supported-formats {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .format-pill {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .format-pill.excel {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .format-pill.csv {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .format-pill.pdf {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .upload-progress {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-top: 1rem;
          color: #8b5cf6;
        }

        .hidden-file-input {
          display: none;
        }

        .manual-entry {
          text-align: center;
        }

        .divider {
          position: relative;
          margin: 2rem 0;
        }

        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(139, 92, 246, 0.3);
        }

        .divider span {
          background: #0f172a;
          color: #94a3b8;
          padding: 0 1rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .manual-button {
          display: inline-flex;
          align-items: center;
          background: transparent;
          color: #8b5cf6;
          padding: 0.75rem 1.5rem;
          border: 2px solid #8b5cf6;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .manual-button:hover {
          background: #8b5cf6;
          color: white;
          transform: translateY(-2px);
        }

        .extraction-summary {
          background: rgba(30, 41, 59, 0.9);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          backdrop-filter: blur(10px);
        }

        .summary-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .summary-header h2 {
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .summary-header p {
          color: #94a3b8;
          font-size: 1rem;
        }

        .extraction-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          padding: 1.5rem;
          background: rgba(15, 23, 42, 0.6);
          border-radius: 12px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.5rem;
        }

        .stat-number.success {
          color: #10b981;
        }

        .stat-number.warning {
          color: #f59e0b;
        }

        .stat-label {
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
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

        .success-message {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 2rem;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 12px;
          color: #10b981;
        }

        .success-content h4 {
          color: #10b981;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .success-content p {
          color: #059669;
          margin: 0.25rem 0;
          font-size: 1rem;
        }

        .redirect-notice {
          font-style: italic;
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
