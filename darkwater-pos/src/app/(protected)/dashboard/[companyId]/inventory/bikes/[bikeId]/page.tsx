'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../../../dashboard.css';
import RevaniPortalHeader from '../../../../../../../components/RevaniPortalHeader';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ClipboardDocumentIcon,
  ChevronDownIcon,
  BanknotesIcon,
  CogIcon,
  WrenchScrewdriverIcon,
  PlusIcon,
  BoltIcon,
  TrashIcon,
  DocumentTextIcon,
  SwatchIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface Mechanic {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: 'Available' | 'Busy' | 'Unavailable';
}

interface BikeService {
  id: string;
  _id?: string;
  title: string;
  serviceLocation: string;
  type: string;
  date: string;
  hours: number;
  technician: string;
  cost: number;
  serviceProvider: string;
  paymentType: string;
  notes: string;
  description?: string;
}

interface BikeDetails {
  _id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  category?: string; // Make category optional since some bikes might not have it
  price: number;
  status: 'Acquisition' | 'Evaluation' | 'Servicing' | 'Media' | 'Listed' | 'Sold';
  vin: string;
  mileage: string;
  color?: string;
  description?: string;
  engineDisplacement?: string; // Engine CCs
  horsepower?: string; // Horsepower
  dateAcquired?: string;
  dateSold?: string;
  // Assignment fields
  assignedMechanic?: {
    userId: string;
    name: string;
    email: string;
    assignedAt: string;
  };
  // Financial fields
  projectedHighSale?: number;
  projectedLowSale?: number;
  projectedCosts?: number;
  projectedLowCost?: number;
  actualListPrice?: number;
  actualSalePrice?: number;
  images?: Array<{
    data: string;
    contentType: string;
    filename: string;
    size: number;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function BikeDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [bike, setBike] = useState<BikeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editedBike, setEditedBike] = useState<BikeDetails | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [showEditPartModal, setShowEditPartModal] = useState(false);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [newPartForm, setNewPartForm] = useState({
    name: '',
    category: 'Engine',
    condition: 'New',
    installDate: new Date().toISOString().split('T')[0],
    cost: '',
    supplier: '',
    paymentType: 'Card',
    notes: ''
  });
  const [editPartForm, setEditPartForm] = useState({
    name: '',
    category: 'Engine',
    condition: 'New',
    installDate: '',
    cost: '',
    supplier: '',
    paymentType: 'Card',
    notes: ''
  });
  const [bikeParts, setBikeParts] = useState<any[]>([]);

  // Service states
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newServiceForm, setNewServiceForm] = useState({
    title: '',
    serviceLocation: 'In-House', // 'In-House' or 'Out-Sourced'
    type: 'Oil Change',
    date: new Date().toISOString().split('T')[0],
    // In-House fields
    hours: '',
    technician: '',
    // Out-Sourced fields
    cost: '',
    serviceProvider: '',
    paymentType: 'Card',
    notes: ''
  });
  const [editServiceForm, setEditServiceForm] = useState({
    type: 'Oil Change',
    description: '',
    date: '',
    cost: '',
    technician: '',
    paymentType: 'Card',
    notes: ''
  });
  const [bikeServices, setBikeServices] = useState<BikeService[]>([]);

  // Transportation states
  const [showAddTransportModal, setShowAddTransportModal] = useState(false);
  const [showEditTransportModal, setShowEditTransportModal] = useState(false);
  const [editingTransportId, setEditingTransportId] = useState<string | null>(null);
  const [newTransportForm, setNewTransportForm] = useState({
    type: 'Pickup',
    description: '',
    date: new Date().toISOString().split('T')[0],
    cost: '',
    location: '',
    company: '',
    paymentType: 'Card',
    notes: ''
  });
  const [editTransportForm, setEditTransportForm] = useState({
    type: 'Pickup',
    description: '',
    date: '',
    cost: '',
    location: '',
    company: '',
    paymentType: 'Card',
    notes: ''
  });
    const [bikeTransportation, setBikeTransportation] = useState<any[]>([]);
  const [evaluationData, setEvaluationData] = useState<any>(null);

  // Image states
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [bikeImages, setBikeImages] = useState<Array<{
    data: string;
    contentType: string;
    filename: string;
    size: number;
    uploadedAt: string;
  }>>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Assignment states
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [allUsers, setAllUsers] = useState<Mechanic[]>([]);
  const [userTypeFilter, setUserTypeFilter] = useState<string>('mechanics');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [vinMessage, setVinMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (params?.companyId && params?.bikeId) {
      fetchData(params.companyId as string, params.bikeId as string);
      fetchMechanics(params.companyId as string);
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

      // Fetch bike details
      try {
        const bikeResponse = await fetch(`/api/companies/${companyId}/inventory/bikes/${bikeId}`);
        if (bikeResponse.ok) {
          const bikeData = await bikeResponse.json();
          setBike(bikeData.bike);
          
          // Initialize bike images from existing bike data
          if (bikeData.bike.images && bikeData.bike.images.length > 0) {
            setBikeImages(bikeData.bike.images);
          }
          
          // Fetch services for this bike
          try {
            const servicesResponse = await fetch(`/api/companies/${companyId}/inventory/bikes/${bikeId}/services`);
            if (servicesResponse.ok) {
              const servicesData = await servicesResponse.json();
              if (servicesData.success) {
                // Convert services to the format expected by the UI
                const formattedServices = servicesData.services.map((service: any) => ({
                  id: service._id,
                  title: service.title || '',
                  serviceLocation: service.serviceLocation || 'Out-Sourced',
                  type: service.type,
                  date: new Date(service.date).toISOString().split('T')[0],
                  // Always include all fields from uniform structure
                  hours: service.hours || 'N/A',
                  technician: service.technician || 'N/A',
                  cost: service.cost || 'N/A',
                  serviceProvider: service.serviceProvider || 'N/A',
                  paymentType: service.paymentType || 'N/A',
                  notes: service.notes || ''
                }));
                setBikeServices(formattedServices);
              }
            }
          } catch (error) {
            console.error('Error fetching services:', error);
            // Keep default empty services if fetch fails
          }

          // Fetch evaluation data for this bike
          try {
            const evaluationResponse = await fetch(`/api/companies/${companyId}/inventory/bikes/${bikeId}/evaluation`);
            if (evaluationResponse.ok) {
              const evaluationResult = await evaluationResponse.json();
              if (evaluationResult.success && evaluationResult.evaluation) {
                setEvaluationData(evaluationResult.evaluation);
              }
            }
          } catch (error) {
            console.error('Error fetching evaluation:', error);
            // Keep default empty evaluation if fetch fails
          }

          // Fetch parts data for this bike
          try {
            const partsResponse = await fetch(`/api/companies/${companyId}/inventory/bikes/${bikeId}/parts`);
            if (partsResponse.ok) {
              const partsResult = await partsResponse.json();
              if (partsResult.success && partsResult.parts) {
                // Transform API data to component format
                const formattedParts = partsResult.parts.map((part: any) => ({
                  id: part._id,
                  name: part.name || 'Unknown Part',
                  category: part.category || 'General',
                  condition: part.condition || 'Used',
                  installDate: part.installDate || part.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                  cost: part.cost || 0,
                  supplier: part.supplier || 'Unknown',
                  paymentType: part.paymentType || 'Card',
                  notes: part.notes || ''
                }));
                setBikeParts(formattedParts);
              }
            }
          } catch (error) {
            console.error('Error fetching parts:', error);
            // Keep default empty parts if fetch fails
          }

          // Fetch transportation data for this bike
          try {
            const transportationResponse = await fetch(`/api/companies/${companyId}/inventory/bikes/${bikeId}/transportation`);
            if (transportationResponse.ok) {
              const transportationResult = await transportationResponse.json();
              if (transportationResult.success && transportationResult.transportation) {
                // Transform API data to component format
                const formattedTransportation = transportationResult.transportation.map((transport: any) => ({
                  id: transport._id,
                  type: transport.type || 'General',
                  description: transport.description || 'Transportation record',
                  date: transport.date || transport.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                  cost: transport.cost || 0,
                  location: transport.location || 'Unknown',
                  company: transport.company || 'Unknown',
                  paymentType: transport.paymentType || 'Card',
                  notes: transport.notes || ''
                }));
                setBikeTransportation(formattedTransportation);
              }
            }
          } catch (error) {
            console.error('Error fetching transportation:', error);
            // Keep default empty transportation if fetch fails
          }


        } else {
          // Fallback: Create a bike based on the ID
          const fallbackBikes = [
            { _id: '507f1f77bcf86cd799439011', name: '2024 Yamaha R1', category: 'Sport', price: 18999, status: 'Listed', vin: 'JYA1WE010MA000001', year: 2024, mileage: '0 mi', brand: 'Yamaha', model: 'R1', color: 'Blue', description: 'Brand new 2024 Yamaha R1 in pristine condition', images: [], createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
            { _id: '507f1f77bcf86cd799439012', name: '2023 Honda CBR600RR', category: 'Sport', price: 12499, status: 'Sold', vin: 'JH2PC4104NM200001', year: 2023, mileage: '1,250 mi', brand: 'Honda', model: 'CBR600RR', color: 'Red', description: '2023 Honda CBR600RR with low mileage', images: [], createdAt: '2024-01-10T10:00:00Z', updatedAt: '2024-01-20T10:00:00Z' },
            { _id: '507f1f77bcf86cd799439013', name: '2024 Kawasaki Ninja H2', category: 'Sport', price: 29500, status: 'Media', vin: 'JKAZF2J18PA000001', year: 2024, mileage: '0 mi', brand: 'Kawasaki', model: 'Ninja H2', color: 'Green', description: 'High-performance supercharged motorcycle', images: [], createdAt: '2024-01-12T10:00:00Z', updatedAt: '2024-01-18T10:00:00Z' },
            { _id: '507f1f77bcf86cd799439013', name: '2023 BMW R1250GS', category: 'Adventure', price: 18750, status: 'Servicing', vin: 'WB10G3100PM000001', year: 2023, mileage: '2,100 mi', brand: 'BMW', model: 'R1250GS', color: 'White', description: 'Adventure touring bike with premium features', images: [], createdAt: '2024-01-08T10:00:00Z', updatedAt: '2024-01-16T10:00:00Z' },
            { _id: '507f1f77bcf86cd799439015', name: '2024 Ducati Panigale V4', category: 'Sport', price: 24995, status: 'Evaluation', vin: 'ZDM12AKU6PB000001', year: 2024, mileage: '0 mi', brand: 'Ducati', model: 'Panigale V4', color: 'Red', description: 'Italian superbike with cutting-edge technology', images: [], createdAt: '2024-01-14T10:00:00Z', updatedAt: '2024-01-14T10:00:00Z' },
            { _id: '507f1f77bcf86cd799439016', name: '2023 Harley-Davidson Street Glide', category: 'Cruiser', price: 22899, status: 'Acquisition', vin: '1HD1KB413LB000001', year: 2023, mileage: '850 mi', brand: 'Harley-Davidson', model: 'Street Glide', color: 'Black', description: 'Classic American cruiser with touring capabilities', images: [], createdAt: '2024-01-06T10:00:00Z', updatedAt: '2024-01-16T10:00:00Z' },
          ];
          const foundBike = fallbackBikes.find(bike => bike._id === bikeId);
          if (foundBike) {
            setBike(foundBike as BikeDetails);
            // Initialize bike images from fallback data
            if (foundBike.images && foundBike.images.length > 0) {
              setBikeImages(foundBike.images);
            }
          } else {
            router.push(`/dashboard/${companyId}/inventory/bikes`);
          }
        }
      } catch (bikeError) {
        console.error('Bike details API error:', bikeError);
        router.push(`/dashboard/${companyId}/inventory/bikes`);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      router.push(`/dashboard/${companyId}/inventory/bikes`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMechanics = async (companyId: string) => {
    try {
      const response = await fetch(`/api/users?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Store all users
          setAllUsers(data.users);
          
          // Filter users to only include mechanics/technicians by default
          const mechanics = data.users.filter((user: any) => 
            user.role === 'mechanic' || user.role === 'technician' || user.role === 'service'
          );
          setMechanics(mechanics);
        }
      }
    } catch (error) {
      console.error('Error fetching mechanics:', error);
    }
  };

  const filterUsersByType = (userType: string) => {
    setUserTypeFilter(userType);
    
    let filteredUsers: Mechanic[] = [];
    
    switch (userType) {
      case 'mechanics':
        filteredUsers = allUsers.filter((user: any) => 
          user.role === 'mechanic' || user.role === 'technician' || user.role === 'service'
        );
        break;
      case 'managers':
        filteredUsers = allUsers.filter((user: any) => 
          user.role === 'manager' || user.role === 'admin' || user.role === 'owner'
        );
        break;
      case 'sales':
        filteredUsers = allUsers.filter((user: any) => 
          user.role === 'sales' || user.role === 'salesperson'
        );
        break;
      case 'all':
        filteredUsers = allUsers;
        break;
      default:
        filteredUsers = allUsers.filter((user: any) => user.role === userType);
        break;
    }
    
    setMechanics(filteredUsers);
  };

  const handleAssignBike = async (mechanicId: string, mechanicName: string, mechanicEmail: string) => {
    if (!bike || !params?.companyId) return;

    setIsAssigning(true);
    setAssignMessage(null);

    try {
      const assignmentData = {
        assignedMechanic: {
          userId: mechanicId,
          name: mechanicName,
          email: mechanicEmail,
          assignedAt: new Date().toISOString()
        }
      };

      const response = await fetch(`/api/companies/${params.companyId}/inventory/bikes/${bike._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBike(result.bike);
          setAssignMessage({ type: 'success', text: `Bike assigned to ${mechanicName}` });
          setShowAssignModal(false);
        } else {
          setAssignMessage({ type: 'error', text: result.error || 'Failed to assign bike' });
        }
      } else {
        setAssignMessage({ type: 'error', text: 'Failed to assign bike' });
      }
    } catch (error) {
      console.error('Error assigning bike:', error);
      setAssignMessage({ type: 'error', text: 'Failed to assign bike' });
    } finally {
      setIsAssigning(false);
      setTimeout(() => setAssignMessage(null), 5000);
    }
  };

  const handleUnassignBike = async () => {
    if (!bike || !params?.companyId) return;

    setIsAssigning(true);
    setAssignMessage(null);

    try {
      const response = await fetch(`/api/companies/${params.companyId}/inventory/bikes/${bike._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignedMechanic: null }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBike(result.bike);
          setAssignMessage({ type: 'success', text: 'Bike unassigned successfully' });
        } else {
          setAssignMessage({ type: 'error', text: result.error || 'Failed to unassign bike' });
        }
      } else {
        setAssignMessage({ type: 'error', text: 'Failed to unassign bike' });
      }
    } catch (error) {
      console.error('Error unassigning bike:', error);
      setAssignMessage({ type: 'error', text: 'Failed to unassign bike' });
    } finally {
      setIsAssigning(false);
      setTimeout(() => setAssignMessage(null), 5000);
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

  if (!session || !company || !bike) {
    return null;
  }

  const getCompanyBadge = (type: string) => {
    switch (type) {
      case 'dealership':
        return 'Dealership';
      case 'software':
        return 'Software';
      case 'holding':
        return 'Holding';
      default:
        return 'Business';
    }
  };

  const getStatusColor = (status: string) => {
    // Normalize status to handle both lowercase and uppercase variations
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    
    switch (normalizedStatus) {
      case 'Acquisition':
        return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '#f59e0b40' }; // Orange
      case 'Evaluation':
        return { bg: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', border: '#6366f140' }; // Indigo
      case 'Servicing':
        return { bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', border: '#a855f740' }; // Purple
      case 'Media':
        return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '#3b82f640' }; // Blue
      case 'Listed':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '#22c55e40' }; // Green
      case 'Sold':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '#ef444440' }; // Red
      default:
        return { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280', border: '#6b728040' }; // Gray
    }
  };

  const getStatusProgress = (status: string) => {
    const statuses = ['Acquisition', 'Evaluation', 'Servicing', 'Media', 'Listed', 'Sold'];
    // Normalize status to handle both lowercase and uppercase variations
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const currentIndex = statuses.indexOf(normalizedStatus);
    return {
      currentStep: currentIndex + 1,
      totalSteps: statuses.length,
      percentage: ((currentIndex + 1) / statuses.length) * 100,
      statuses
    };
  };

  const handleEditClick = () => {
    // Format dates for HTML date inputs (YYYY-MM-DD)
    const formatDateForInput = (dateString?: string) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) return '';
        // Return in YYYY-MM-DD format
        return date.toISOString().split('T')[0];
      } catch {
        return '';
      }
    };

    setEditedBike({
      ...bike!,
      category: bike!.category || 'Sport', // Default to 'Sport' if no category exists
      dateAcquired: formatDateForInput(bike!.dateAcquired),
      dateSold: formatDateForInput(bike!.dateSold)
    });
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditedBike(null);
    setIsEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (editedBike) {
      try {
        // If there are selected images, upload them first
        if (selectedImages.length > 0) {
          setIsUploadingImages(true);
          
          // Upload each image sequentially
          for (let i = 0; i < selectedImages.length; i++) {
            const image = selectedImages[i];
            
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('image', image);
            formData.append('bikeId', params.bikeId as string);
            formData.append('companyId', params.companyId as string);
            
            // Make API call to upload image
            const response = await fetch(`/api/companies/${params.companyId}/inventory/bikes/${params.bikeId}/image`, {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error(`Failed to upload image ${image.name}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
              // The API already adds the image to the bike's images array in the database
              // We don't need to manually add it here
              console.log('Image uploaded successfully:', result.imageData);
            } else {
              throw new Error(result.error || `Failed to upload image ${image.name}`);
            }
          }
          
          // After uploading all images, refresh the bike data to get the updated images
          // This will ensure we have the latest images from the database
          const refreshResponse = await fetch(`/api/companies/${params.companyId}/inventory/bikes/${params.bikeId}`);
          if (refreshResponse.ok) {
            const refreshResult = await refreshResponse.json();
            if (refreshResult.success) {
              editedBike.images = refreshResult.bike.images;
            }
          }
        }

        // Prepare data for API, ensuring dates are properly formatted
        const prepareBikeData = (bikeData: BikeDetails) => {
          const { ...data } = bikeData;
          
          // Convert date strings to proper format for storage
          if (data.dateAcquired) {
            // If it's already in YYYY-MM-DD format, convert to ISO string
            data.dateAcquired = new Date(data.dateAcquired + 'T00:00:00').toISOString();
          }
          
          if (data.dateSold) {
            // If it's already in YYYY-MM-DD format, convert to ISO string
            data.dateSold = new Date(data.dateSold + 'T00:00:00').toISOString();
          }
          
          return data;
        };

        const bikeDataToSave = prepareBikeData(editedBike);

        // Make API call to save changes to MongoDB
        const response = await fetch(`/api/companies/${params.companyId}/inventory/bikes/${params.bikeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bikeDataToSave),
        });

        if (!response.ok) {
          throw new Error('Failed to save bike changes');
        }

        const result = await response.json();
        
        if (result.success) {
          // Refresh the bike data to get the latest information including new images
          const refreshResponse = await fetch(`/api/companies/${params.companyId}/inventory/bikes/${params.bikeId}`);
          if (refreshResponse.ok) {
            const refreshResult = await refreshResponse.json();
            if (refreshResult.success) {
              // Update local state with the refreshed data
              setBike(refreshResult.bike);
              setBikeImages(refreshResult.bike.images || []);
            }
          }
          
          setIsEditMode(false);
          setEditedBike(null);
          
          // Clear upload states
          setSelectedImages([]);
          setImagePreviews([]);
          
          console.log('Bike changes and images saved successfully to database:', result);
          setUploadMessage({ type: 'success', text: 'Bike details and images saved successfully!' });
          setTimeout(() => setUploadMessage(null), 5000);
        } else {
          throw new Error(result.error || 'Failed to save bike changes');
        }
      } catch (error) {
        console.error('Error saving bike changes:', error);
        setUploadMessage({ type: 'error', text: 'Failed to save changes. Please try again.' });
        setTimeout(() => setUploadMessage(null), 5000);
      } finally {
        setIsUploadingImages(false);
      }
    }
  };

  const handleFieldChange = (field: keyof BikeDetails, value: any) => {
    if (editedBike) {
      const updatedBike = {
        ...editedBike,
        [field]: value
      };

      // Auto-generate name when brand, model, or year changes
      if (field === 'brand' || field === 'model' || field === 'year') {
        const year = field === 'year' ? value : updatedBike.year;
        const brand = field === 'brand' ? value : updatedBike.brand;
        const model = field === 'model' ? value : updatedBike.model;
        
        if (year && brand && model) {
          updatedBike.name = `${year} ${brand} ${model}`;
        }
      }

      setEditedBike(updatedBike);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (isEditMode && editedBike) {
      handleFieldChange('status', newStatus);
    }
  };

  const handleDeleteBike = async () => {
    if (!bike || !company) return;

    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/companies/${company.slug}/inventory/bikes/${bike._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete bike');
      }

      const result = await response.json();
      if (result.success) {
        console.log('Bike deleted successfully');
        // Redirect to bike inventory page
        router.push(`/dashboard/${company.slug}/inventory/bikes`);
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Failed to delete bike:', error);
      alert('Failed to delete bike. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  // Enhanced VIN decoding function using NHTSA API (like VIN runner page)
  // Helper function to validate VIN format
  const isValidVINFormat = (vin: string): { valid: boolean; error?: string } => {
    if (!vin) {
      return { valid: false, error: 'VIN is required' };
    }
    
    if (vin.length !== 17) {
      return { valid: false, error: `VIN must be exactly 17 characters (current: ${vin.length})` };
    }
    
    // Check for invalid characters (VINs don't contain I, O, or Q)
    const invalidChars = vin.match(/[IOQ]/gi);
    if (invalidChars) {
      return { valid: false, error: `VIN contains invalid characters: ${invalidChars.join(', ')}. VINs cannot contain I, O, or Q.` };
    }
    
    // Check for valid characters only (alphanumeric, no I, O, Q)
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
      return { valid: false, error: 'VIN contains invalid characters. Only letters (except I, O, Q) and numbers are allowed.' };
    }
    
    return { valid: true };
  };

  const getVINSpecs = async (vin: string) => {
    // Validate VIN format first
    const validation = isValidVINFormat(vin);
    if (!validation.valid) {
      console.log('Invalid VIN format:', validation.error);
      return { 
        brand: null, 
        model: null, 
        year: null, 
        displacement: null, 
        horsepower: null,
        error: validation.error
      };
    }

    try {
      console.log('Fetching VIN data from NHTSA API for:', vin);
      
      // Use NHTSA API to decode VIN (same as VIN runner page)
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`,
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
        console.error('VIN API Error:', errorText);
        
        // Provide more user-friendly error messages
        let userFriendlyError = errorText || 'Invalid VIN format';
        
        if (errorText && errorText.includes('Check Digit')) {
          userFriendlyError = 'Invalid VIN: The check digit (9th character) is incorrect. Please verify the VIN number and try again.';
        } else if (errorText && errorText.includes('position')) {
          userFriendlyError = 'Invalid VIN format: One or more characters in the VIN are incorrect. Please double-check the VIN number.';
        } else if (errorText && (errorText.includes('Invalid') || errorText.includes('invalid'))) {
          userFriendlyError = 'Invalid VIN: Please verify the 17-character VIN number and try again.';
        }
        
        return { 
          brand: null, 
          model: null, 
          year: null, 
          displacement: null, 
          horsepower: null,
          error: userFriendlyError
        };
      }

      // Extract vehicle information
      const make = getValue('Make');
      const model = getValue('Model');
      const year = parseInt(getValue('Model Year')) || null;
      const engineDisplacement = getValue('Displacement (L)');
      const engineCylinders = getValue('Engine Number of Cylinders');
      const engineModel = getValue('Engine Model');

      // Convert displacement from liters to CCs
      let displacementCC = null;
      if (engineDisplacement) {
        const liters = parseFloat(engineDisplacement);
        if (!isNaN(liters)) {
          displacementCC = `${Math.round(liters * 1000)}cc`;
        }
      }

      // For motorcycles, estimate horsepower based on displacement with more accurate values
      let horsepower = null;
      if (displacementCC) {
        const cc = parseInt(displacementCC.replace('cc', ''));
        
        // More accurate motorcycle horsepower estimates based on real-world data
        if (cc <= 50) horsepower = '4 HP';          // Small scooters
        else if (cc <= 125) horsepower = '11 HP';   // Small bikes (Honda Grom ~10hp)
        else if (cc <= 150) horsepower = '14 HP';   // Entry level
        else if (cc <= 200) horsepower = '18 HP';   // Small sport bikes
        else if (cc <= 250) horsepower = '27 HP';   // Ninja 250 (~27hp)
        else if (cc <= 300) horsepower = '39 HP';   // Ninja 300 (~39hp), R3 (~42hp)
        else if (cc <= 400) horsepower = '44 HP';   // Ninja 400 (~45hp), RC390 (~44hp)
        else if (cc <= 500) horsepower = '47 HP';   // CB500F (~47hp)
        else if (cc <= 600) horsepower = '118 HP';  // R6 (~118hp), ZX-6R (~130hp)
        else if (cc <= 650) horsepower = '67 HP';   // SV650 (~67hp), Ninja 650 (~67hp)
        else if (cc <= 750) horsepower = '77 HP';   // GSX-R750 (~150hp), but cruisers ~77hp
        else if (cc <= 800) horsepower = '105 HP';  // Duke 790 (~105hp)
        else if (cc <= 900) horsepower = '115 HP';  // Street Triple (~113hp)
        else if (cc <= 1000) horsepower = '200 HP'; // R1 (~200hp), ZX-10R (~200hp)
        else if (cc <= 1200) horsepower = '175 HP'; // Speed Triple (~148hp), but varies widely
        else if (cc <= 1300) horsepower = '173 HP'; // Hayabusa (~173hp)
        else if (cc <= 1400) horsepower = '190 HP'; // ZX-14R (~190hp)
        else horsepower = '200 HP';                 // Large displacement bikes
        
        // Special handling for common sport bike displacements
        if (cc === 296 || cc === 300) horsepower = '39 HP';  // Ninja 300 specific
        else if (cc === 636) horsepower = '130 HP';          // ZX-6R specific
        else if (cc === 599 || cc === 600) horsepower = '118 HP'; // R6 specific
        else if (cc === 998 || cc === 1000) horsepower = '200 HP'; // Liter bikes
      }

      console.log('NHTSA API results:', { make, model, year, engineDisplacement, displacementCC, horsepower });
      
      return {
        brand: make || null,
        model: model || null,
        year: year,
        displacement: displacementCC,
        horsepower: horsepower
      };

    } catch (error) {
      console.error('Error fetching VIN data:', error);
      return { 
        brand: null, 
        model: null, 
        year: null, 
        displacement: null, 
        horsepower: null,
        error: 'Failed to connect to VIN database'
      };
    }
  };

  // Note: Year decoding now handled by NHTSA API

  // Auto-fill bike information from VIN (now async)
  const autoFillFromVIN = async (vin: string) => {
    // Clear any previous VIN messages
    setVinMessage(null);
    
    const vinSpecs = await getVINSpecs(vin);
    console.log('VIN Specs decoded:', vinSpecs);
    
    // Check if there was an error
    if (vinSpecs.error) {
      setVinMessage({
        type: 'error',
        text: vinSpecs.error
      });
      return;
    }
    
    if (vinSpecs.brand || vinSpecs.model || vinSpecs.year) {
      const updates: any = {};
      
      // Always fill brand/make if we have it (replace existing data)
      if (vinSpecs.brand) {
        updates.brand = vinSpecs.brand;
      }
      
      // Always fill model if we have it (replace existing data)
      if (vinSpecs.model) {
        updates.model = vinSpecs.model;
      }
      
      // Always fill year if we have it (replace existing data)
      if (vinSpecs.year) {
        updates.year = vinSpecs.year;
      }
      
      // Always fill engine displacement if we have it (replace existing data)
      if (vinSpecs.displacement) {
        updates.engineDisplacement = vinSpecs.displacement;
      }
      
      // Always fill horsepower if we have it (replace existing data)
      if (vinSpecs.horsepower) {
        updates.horsepower = vinSpecs.horsepower;
      }
      
      // Always update bike name if we have brand and model (replace existing data)
      if (vinSpecs.brand && vinSpecs.model && vinSpecs.year) {
        updates.name = `${vinSpecs.year} ${vinSpecs.brand} ${vinSpecs.model}`;
      }
      
      console.log('Auto-fill updates:', updates);
      
      // Apply all updates at once
      if (Object.keys(updates).length > 0) {
        setEditedBike(prev => prev ? { ...prev, ...updates } : null);
        setVinMessage({
          type: 'success',
          text: `Successfully auto-filled ${Object.keys(updates).length} field(s) from VIN`
        });
      }
    } else {
      setVinMessage({
        type: 'error',
        text: 'No vehicle information found for this VIN'
      });
    }
  };

  // Note: Manufacturer-specific VIN decoding now handled by NHTSA API

  const handleAddPart = async () => {
    if (newPartForm.name && newPartForm.cost) {
      try {
        // Prepare part data for API
        const partData = {
          name: newPartForm.name,
          category: newPartForm.category,
          condition: newPartForm.condition,
          installDate: newPartForm.installDate,
          cost: parseFloat(newPartForm.cost) || 0,
          supplier: newPartForm.supplier,
          paymentType: newPartForm.paymentType,
          notes: newPartForm.notes
        };

        // Save part to database via API
        const response = await fetch(`/api/companies/${params.companyId}/inventory/bikes/${params.bikeId}/parts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(partData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Add the new part to local state with the database ID
            const newPart = {
              id: result.part._id,
              name: result.part.name,
              category: result.part.category,
              condition: result.part.condition,
              installDate: result.part.installDate,
              cost: result.part.cost,
              supplier: result.part.supplier,
              paymentType: result.part.paymentType,
              notes: result.part.notes
            };
            
            setBikeParts(prev => [...prev, newPart]);
            
            // Reset form
            setNewPartForm({
              name: '',
              category: 'Engine',
              condition: 'New',
              installDate: new Date().toISOString().split('T')[0],
              cost: '',
              supplier: '',
              paymentType: 'Card',
              notes: ''
            });
            
            setShowAddPartModal(false);
            console.log('Part saved to database:', newPart);
          } else {
            console.error('Failed to save part:', result.error);
            alert('Failed to save part. Please try again.');
          }
        } else {
          console.error('API request failed:', response.status);
          alert('Failed to save part. Please try again.');
        }
      } catch (error) {
        console.error('Error saving part:', error);
        alert('Failed to save part. Please try again.');
      }
    }
  };

  const handlePartFormChange = (field: string, value: string) => {
    setNewPartForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditPartFormChange = (field: string, value: string) => {
    setEditPartForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditPartClick = (partId: string) => {
    const partToEdit = bikeParts.find(part => part.id === partId);
    if (partToEdit) {
      setEditPartForm({
        name: partToEdit.name,
        category: partToEdit.category,
        condition: partToEdit.condition,
        installDate: partToEdit.installDate,
        cost: partToEdit.cost.toString(),
        supplier: partToEdit.supplier,
        paymentType: partToEdit.paymentType,
        notes: partToEdit.notes
      });
      setEditingPartId(partId);
      setShowEditPartModal(true);
    }
  };

  const handleSavePartEdit = async () => {
    if (editingPartId && editPartForm.name && editPartForm.cost) {
      try {
        // Prepare part data for API
        const partData = {
          name: editPartForm.name,
          category: editPartForm.category,
          condition: editPartForm.condition,
          installDate: editPartForm.installDate,
          cost: parseFloat(editPartForm.cost) || 0,
          supplier: editPartForm.supplier,
          paymentType: editPartForm.paymentType,
          notes: editPartForm.notes
        };

        // Update part in database via API
        const response = await fetch(`/api/companies/${params.companyId}/inventory/bikes/${params.bikeId}/parts/${editingPartId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(partData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Update the part in local state
            setBikeParts(prev => prev.map(part => 
              part.id === editingPartId 
                ? {
                    id: result.part._id,
                    name: result.part.name,
                    category: result.part.category,
                    condition: result.part.condition,
                    installDate: result.part.installDate,
                    cost: result.part.cost,
                    supplier: result.part.supplier,
                    paymentType: result.part.paymentType,
                    notes: result.part.notes
                  }
                : part
            ));
            
            setShowEditPartModal(false);
            setEditingPartId(null);
            console.log('Part updated in database:', result.part);
          } else {
            console.error('Failed to update part:', result.error);
            alert('Failed to update part. Please try again.');
          }
        } else {
          console.error('API request failed:', response.status);
          alert('Failed to update part. Please try again.');
        }
      } catch (error) {
        console.error('Error updating part:', error);
        alert('Failed to update part. Please try again.');
      }
    }
  };

  const handleCancelPartEdit = () => {
    setShowEditPartModal(false);
    setEditingPartId(null);
    setEditPartForm({
      name: '',
      category: 'Engine',
      condition: 'New',
      installDate: '',
      cost: '',
      supplier: '',
      paymentType: 'Card',
      notes: ''
    });
  };

  const handleDeletePart = async () => {
    if (editingPartId && window.confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
      try {
        // Delete part from database via API
        const response = await fetch(`/api/companies/${params.companyId}/inventory/bikes/${params.bikeId}/parts/${editingPartId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Remove the part from local state
            setBikeParts(prev => prev.filter(part => part.id !== editingPartId));
            setShowEditPartModal(false);
            setEditingPartId(null);
            console.log('Part deleted from database:', result.deletedPart);
          } else {
            console.error('Failed to delete part:', result.error);
            alert('Failed to delete part. Please try again.');
          }
        } else {
          console.error('API request failed:', response.status);
          alert('Failed to delete part. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting part:', error);
        alert('Failed to delete part. Please try again.');
      }
    }
  };

  // Service handling functions
  const handleAddService = async () => {
    // Basic validation - just check required fields based on service location
    const hasRequiredFields = newServiceForm.title && newServiceForm.type && 
      ((newServiceForm.serviceLocation === 'In-House' && newServiceForm.hours && newServiceForm.technician) ||
       (newServiceForm.serviceLocation === 'Out-Sourced' && newServiceForm.cost && newServiceForm.serviceProvider));

    if (hasRequiredFields) {
      try {
        // Create the service data to send to API - always send all fields
        const serviceData = {
          title: newServiceForm.title,
          serviceLocation: newServiceForm.serviceLocation,
          type: newServiceForm.type,
          date: newServiceForm.date,
          // Always send all fields - API will handle N/A values
          hours: newServiceForm.hours || '',
          technician: newServiceForm.technician || '',
          cost: newServiceForm.cost || '',
          serviceProvider: newServiceForm.serviceProvider || '',
          paymentType: newServiceForm.paymentType || 'Card',
          notes: newServiceForm.notes || ''
        };

        console.log('Sending service data:', serviceData);

        // Make API call to save service to database
        const response = await fetch(`/api/companies/${params.companyId}/inventory/bikes/${params.bikeId}/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(serviceData),
        });

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            console.error('API Error Response:', errorData);
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            console.error('Failed to parse error response as JSON:', jsonError);
            const errorText = await response.text();
            console.error('Raw error response:', errorText);
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        
        if (result.success) {
          // Add the saved service to the current list
          const newService = {
            id: result.service._id,
            title: result.service.title,
            serviceLocation: result.service.serviceLocation,
            type: result.service.type,
            date: new Date(result.service.date).toISOString().split('T')[0],
            // Always include all fields from uniform structure
            hours: result.service.hours,
            technician: result.service.technician,
            cost: result.service.cost,
            serviceProvider: result.service.serviceProvider,
            paymentType: result.service.paymentType,
            notes: result.service.notes
          };
          
          setBikeServices(prev => [...prev, newService]);
          console.log('Service successfully saved to database:', result.service);
          console.log('Collection:', result.message);
        } else {
          throw new Error(result.error || 'Failed to create service');
        }
        
        // Reset form
        setNewServiceForm({
          title: '',
          serviceLocation: 'In-House',
          type: 'Oil Change',
          date: new Date().toISOString().split('T')[0],
          // In-House fields
          hours: '',
          technician: '',
          // Out-Sourced fields
          cost: '',
          serviceProvider: '',
          paymentType: 'Card',
          notes: ''
        });
        
        setShowAddServiceModal(false);
      } catch (error) {
        console.error('Error adding service:', error);
        alert('Failed to add service. Please try again.');
      }
    }
  };

  const handleServiceFormChange = (field: string, value: string) => {
    setNewServiceForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditServiceFormChange = (field: string, value: string) => {
    setEditServiceForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditServiceClick = (serviceId: string) => {
    const serviceToEdit = bikeServices.find(service => service.id === serviceId);
    if (serviceToEdit) {
      setEditServiceForm({
        type: serviceToEdit.type,
        description: serviceToEdit.description || '',
        date: serviceToEdit.date,
        cost: serviceToEdit.cost.toString(),
        technician: serviceToEdit.technician,
        paymentType: serviceToEdit.paymentType,
        notes: serviceToEdit.notes
      });
      setEditingServiceId(serviceId);
      setShowEditServiceModal(true);
    }
  };

  const handleSaveServiceEdit = () => {
    if (editingServiceId && editServiceForm.type && editServiceForm.description && editServiceForm.cost) {
      setBikeServices(prev => prev.map(service => 
        service.id === editingServiceId 
          ? {
              ...service,
              type: editServiceForm.type,
              description: editServiceForm.description,
              date: editServiceForm.date,
              cost: parseFloat(editServiceForm.cost) || 0,
              technician: editServiceForm.technician,
              paymentType: editServiceForm.paymentType,
              notes: editServiceForm.notes
            }
          : service
      ));
      
      setShowEditServiceModal(false);
      setEditingServiceId(null);
      console.log('Service updated:', editServiceForm);
    }
  };

  const handleCancelServiceEdit = () => {
    setShowEditServiceModal(false);
    setEditingServiceId(null);
    setEditServiceForm({
      type: 'Oil Change',
      description: '',
      date: '',
      cost: '',
      technician: '',
      paymentType: 'Card',
      notes: ''
    });
  };

  const handleDeleteService = async () => {
    if (editingServiceId && window.confirm('Are you sure you want to delete this service record? This action cannot be undone.')) {
      try {
        // Make API call to delete service from database
        const response = await fetch(`/api/companies/${params.companyId}/inventory/bikes/${params.bikeId}/services?serviceId=${editingServiceId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete service');
        }

        const result = await response.json();
        
        if (result.success) {
          // Update local state after successful deletion
          setBikeServices(prev => prev.filter(service => service._id !== editingServiceId));
          setShowEditServiceModal(false);
          setEditingServiceId(null);
          console.log('Service deleted successfully from database:', editingServiceId);
        } else {
          throw new Error(result.error || 'Failed to delete service');
        }
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Failed to delete service. Please try again.');
      }
    }
  };

  // Transportation handling functions
  const handleAddTransport = async () => {
    if (newTransportForm.type && newTransportForm.description && newTransportForm.cost) {
      try {
        const transportData = {
          type: newTransportForm.type,
          description: newTransportForm.description,
          date: newTransportForm.date,
          cost: parseFloat(newTransportForm.cost) || 0,
          location: newTransportForm.location,
          company: newTransportForm.company,
          paymentType: newTransportForm.paymentType,
          notes: newTransportForm.notes
        };

        const response = await fetch(`/api/companies/${company?.slug}/inventory/bikes/${bike?._id}/transportation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transportData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const newTransport = {
              id: result.transportation._id.toString(),
              type: result.transportation.type,
              description: result.transportation.description,
              date: result.transportation.date,
              cost: result.transportation.cost,
              location: result.transportation.location,
              company: result.transportation.company,
              paymentType: result.transportation.paymentType,
              notes: result.transportation.notes
            };
            
            setBikeTransportation(prev => [...prev, newTransport]);
            
            // Reset form
            setNewTransportForm({
              type: 'Pickup',
              description: '',
              date: new Date().toISOString().split('T')[0],
              cost: '',
              location: '',
              company: '',
              paymentType: 'Card',
              notes: ''
            });
            
            setShowAddTransportModal(false);
            console.log('Transport added successfully:', newTransport);
          } else {
            console.error('Failed to add transport:', result.error);
            alert('Failed to add transportation record. Please try again.');
          }
        } else {
          console.error('Failed to add transport:', response.statusText);
          alert('Failed to add transportation record. Please try again.');
        }
      } catch (error) {
        console.error('Error adding transport:', error);
        alert('Failed to add transportation record. Please try again.');
      }
    }
  };

  const handleTransportFormChange = (field: string, value: string) => {
    setNewTransportForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditTransportFormChange = (field: string, value: string) => {
    setEditTransportForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditTransportClick = (transportId: string) => {
    const transportToEdit = bikeTransportation.find(transport => transport.id === transportId);
    if (transportToEdit) {
      setEditTransportForm({
        type: transportToEdit.type,
        description: transportToEdit.description,
        date: transportToEdit.date,
        cost: transportToEdit.cost.toString(),
        location: transportToEdit.location,
        company: transportToEdit.company,
        paymentType: transportToEdit.paymentType,
        notes: transportToEdit.notes
      });
      setEditingTransportId(transportId);
      setShowEditTransportModal(true);
    }
  };

  const handleSaveTransportEdit = async () => {
    if (editingTransportId && editTransportForm.type && editTransportForm.description && editTransportForm.cost) {
      try {
        const transportData = {
          id: editingTransportId,
          type: editTransportForm.type,
          description: editTransportForm.description,
          date: editTransportForm.date,
          cost: parseFloat(editTransportForm.cost) || 0,
          location: editTransportForm.location,
          company: editTransportForm.company,
          paymentType: editTransportForm.paymentType,
          notes: editTransportForm.notes
        };

        const response = await fetch(`/api/companies/${company?.slug}/inventory/bikes/${bike?._id}/transportation`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transportData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setBikeTransportation(prev => prev.map(transport => 
              transport.id === editingTransportId 
                ? {
                    ...transport,
                    type: result.transportation.type,
                    description: result.transportation.description,
                    date: result.transportation.date,
                    cost: result.transportation.cost,
                    location: result.transportation.location,
                    company: result.transportation.company,
                    paymentType: result.transportation.paymentType,
                    notes: result.transportation.notes
                  }
                : transport
            ));
            
            setShowEditTransportModal(false);
            setEditingTransportId(null);
            console.log('Transport updated successfully:', result.transportation);
          } else {
            console.error('Failed to update transport:', result.error);
            alert('Failed to update transportation record. Please try again.');
          }
        } else {
          console.error('Failed to update transport:', response.statusText);
          alert('Failed to update transportation record. Please try again.');
        }
      } catch (error) {
        console.error('Error updating transport:', error);
        alert('Failed to update transportation record. Please try again.');
      }
    }
  };

  const handleCancelTransportEdit = () => {
    setShowEditTransportModal(false);
    setEditingTransportId(null);
    setEditTransportForm({
      type: 'Pickup',
      description: '',
      date: '',
      cost: '',
      location: '',
      company: '',
      paymentType: 'Card',
      notes: ''
    });
  };

  const handleDeleteTransport = async () => {
    if (editingTransportId && window.confirm('Are you sure you want to delete this transportation record? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/companies/${company?.slug}/inventory/bikes/${bike?._id}/transportation?id=${editingTransportId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setBikeTransportation(prev => prev.filter(transport => transport.id !== editingTransportId));
            setShowEditTransportModal(false);
            setEditingTransportId(null);
            console.log('Transport deleted successfully:', editingTransportId);
          } else {
            console.error('Failed to delete transport:', result.error);
            alert('Failed to delete transportation record. Please try again.');
          }
        } else {
          console.error('Failed to delete transport:', response.statusText);
          alert('Failed to delete transportation record. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting transport:', error);
        alert('Failed to delete transportation record. Please try again.');
      }
    }
  };

  // Image handling functions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image (JPEG, PNG, GIF, etc.)`);
        return false;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image ${file.name} is too large. Must be less than 5MB`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);
      
      // Create previews for new images
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };



  const handleRemoveImage = async (imageData: any) => {
    if (window.confirm('Are you sure you want to remove this image? This action cannot be undone.')) {
      try {
        // Make API call to remove image
        const response = await fetch(`/api/companies/${params.companyId}/inventory/bikes/${params.bikeId}/image`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageData }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to remove image');
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Refresh bike images after successful removal
          await fetchData(params.companyId as string, params.bikeId as string);
          
          console.log('Image removed successfully');
          setUploadMessage({
            type: 'success',
            text: 'Image removed successfully!'
          });
          
          // Clear message after 3 seconds
          setTimeout(() => setUploadMessage(null), 3000);
        } else {
          throw new Error(result.error || 'Failed to remove image');
        }
      } catch (error) {
        console.error('Error removing image:', error);
        setUploadMessage({
          type: 'error',
          text: 'Failed to remove image. Please try again.'
        });
        
        // Clear message after 3 seconds
        setTimeout(() => setUploadMessage(null), 3000);
      }
    }
  };

  const clearImageSelection = () => {
    setSelectedImages([]);
    setImagePreviews([]);
  };



  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      
      // Auto-upload each file immediately
      for (const file of newFiles) {
        await uploadImage(file);
      }
      
      // Clear the file input
      event.target.value = '';
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setIsUploadingImages(true);
      
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      
      // Add to selected images for later upload when save is clicked
      setSelectedImages(prev => [...prev, file]);
      
      // Add to image previews for immediate display
      setImagePreviews(prev => [...prev, previewUrl]);
      
      console.log('Image added for preview:', file.name);
      setUploadMessage({ 
        type: 'success', 
        text: `Image "${file.name}" added successfully!` 
      });
      setTimeout(() => setUploadMessage(null), 3000);
      
    } catch (error) {
      console.error('Error processing image:', error);
      setUploadMessage({ 
        type: 'error', 
        text: `Failed to process image ${file.name}. Please try again.` 
      });
      setTimeout(() => setUploadMessage(null), 5000);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageIndex: number) => {
    try {
      if (!bikeImages || imageIndex >= bikeImages.length) return;
      
      // Remove the image from the bike images array
      const updatedImages = bikeImages.filter((_, index) => index !== imageIndex);
      
      // Update the edited bike with the new images array
      if (editedBike) {
        setEditedBike({
          ...editedBike,
          images: updatedImages
        });
      }
      
      // Update the local bike images state
      setBikeImages(updatedImages);
      
      console.log('Image deleted successfully');
      setUploadMessage({ 
        type: 'success', 
        text: 'Image deleted successfully!' 
      });
      setTimeout(() => setUploadMessage(null), 3000);
      
    } catch (error) {
      console.error('Error deleting image:', error);
      setUploadMessage({ 
        type: 'error', 
        text: 'Failed to delete image. Please try again.' 
      });
      setTimeout(() => setUploadMessage(null), 5000);
    }
  };

  // Drag and drop handlers for image upload
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEditMode) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!isEditMode) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setUploadMessage({ 
        type: 'error', 
        text: 'Please drop image files only.' 
      });
      setTimeout(() => setUploadMessage(null), 3000);
      return;
    }

    // Process each dropped image
    for (const file of imageFiles) {
      await uploadImage(file);
    }
  };



  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'New':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' };
      case 'Good':
        return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
      case 'Fair':
        return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' };
      case 'Poor':
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

      <RevaniPortalHeader company={company} activePage="inventory" />

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Back Button */}
        <div style={{ marginBottom: '2rem' }}>
          <button 
            onClick={() => router.push(`/dashboard/${company.slug}/inventory/bikes`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              color: '#cbd5e1',
              fontSize: '0.875rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
            Back to Bike Inventory
          </button>
        </div>

        {/* Bike Details Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            {isEditMode ? (
              <input
                type="text"
                value={editedBike?.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: '700',
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  width: '100%',
                  maxWidth: '600px'
                }}
              />
            ) : (
              <h2 className="section-header" style={{ marginBottom: '0.5rem' }}>
                {bike.name}
              </h2>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              {isEditMode ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Category</label>
                    <select
                      value={editedBike?.category || ''}
                      onChange={(e) => handleFieldChange('category', e.target.value)}
                      style={{
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '12px',
                        color: '#8b5cf6',
                        fontSize: '1rem',
                        fontWeight: '500',
                        padding: '0.5rem 1rem'
                      }}
                    >
                      <option value="Sport" style={{ background: '#1e293b', color: 'white' }}>Sport</option>
                      <option value="Cruiser" style={{ background: '#1e293b', color: 'white' }}>Cruiser</option>
                      <option value="Adventure" style={{ background: '#1e293b', color: 'white' }}>Adventure</option>
                      <option value="Touring" style={{ background: '#1e293b', color: 'white' }}>Touring</option>
                      <option value="Standard" style={{ background: '#1e293b', color: 'white' }}>Standard</option>
                      <option value="Dual Sport" style={{ background: '#1e293b', color: 'white' }}>Dual Sport</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>Status</label>
                    <select
                      value={editedBike?.status || ''}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                      style={{
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '2px solid rgba(139, 92, 246, 0.5)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        minWidth: '150px'
                      }}
                    >
                      <option value="Acquisition" style={{ background: '#1e293b', color: 'white' }}>Acquisition</option>
                      <option value="Evaluation" style={{ background: '#1e293b', color: 'white' }}>Evaluation</option>
                      <option value="Servicing" style={{ background: '#1e293b', color: 'white' }}>Servicing</option>
                      <option value="Media" style={{ background: '#1e293b', color: 'white' }}>Media</option>
                      <option value="Listed" style={{ background: '#1e293b', color: 'white' }}>Listed</option>
                      <option value="Sold" style={{ background: '#1e293b', color: 'white' }}>Sold</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <span style={{ 
                    color: '#8b5cf6', 
                    fontSize: '1rem', 
                    fontWeight: '500',
                    background: 'rgba(139, 92, 246, 0.1)',
                    padding: '0.5rem 1rem',
                    borderRadius: '12px'
                  }}>
                    {bike.category || 'Motorcycle'}
                  </span>
                  <span style={{ 
                    padding: '0.5rem 1rem', 
                    borderRadius: '9999px', 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    background: getStatusColor(bike.status).bg,
                    color: getStatusColor(bike.status).color,
                    border: `1px solid ${getStatusColor(bike.status).border}`
                  }}>
                    {bike.status.charAt(0).toUpperCase() + bike.status.slice(1).toLowerCase()}
                  </span>
                </>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
            {/* Delete Button - Only show in edit mode */}
            {isEditMode && (
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
              >
                <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                Delete Bike
              </button>
            )}
            
            {/* Price Section */}
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                {isEditMode ? 'Sale Price' : (bike.actualSalePrice ? 'Sale Price' : 'Price')}
              </p>
              {isEditMode ? (
                <input
                  type="number"
                  value={editedBike?.actualSalePrice || editedBike?.price || ''}
                  onChange={(e) => handleFieldChange('actualSalePrice', parseInt(e.target.value) || 0)}
                  placeholder="Enter sale price"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '8px',
                    color: '#22c55e',
                    fontSize: '2rem',
                    fontWeight: '700',
                    padding: '0.5rem',
                    textAlign: 'right',
                    width: '200px'
                  }}
                />
              ) : (
                <p style={{ 
                  color: '#22c55e', 
                  fontSize: '2.5rem', 
                  fontWeight: '700',
                  textShadow: '0 0 20px rgba(34, 197, 94, 0.3)'
                }}>
                  ${(bike.actualSalePrice || bike.price).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status Progress Bar */}
        <div className="kpi-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
              Status Progress {isEditMode && <span style={{ color: '#8b5cf6', fontSize: '0.875rem' }}>(Visual representation - use dropdown above to edit)</span>}
            </h3>
            <span style={{ 
              color: '#8b5cf6', 
              fontSize: '0.875rem', 
              fontWeight: '500',
              background: 'rgba(139, 92, 246, 0.1)',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px'
            }}>
              Step {getStatusProgress(isEditMode && editedBike ? editedBike.status : bike.status).currentStep} of {getStatusProgress(isEditMode && editedBike ? editedBike.status : bike.status).totalSteps}
            </span>
          </div>
          
          {/* Progress Bar Track */}
          <div style={{ 
            width: '100%', 
            height: '8px', 
            background: 'rgba(255, 255, 255, 0.1)', 
            borderRadius: '4px',
            marginBottom: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Progress Fill */}
            <div style={{
              height: '100%',
              width: `${getStatusProgress(isEditMode && editedBike ? editedBike.status : bike.status).percentage}%`,
              background: `linear-gradient(90deg, ${getStatusColor('Acquisition').color} 0%, ${getStatusColor('Evaluation').color} 20%, ${getStatusColor('Servicing').color} 40%, ${getStatusColor('Media').color} 60%, ${getStatusColor('Listed').color} 80%, ${getStatusColor('Sold').color} 100%)`,
              borderRadius: '4px',
              transition: 'width 0.5s ease'
            }}></div>
          </div>
          
          {/* Status Steps */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {getStatusProgress(isEditMode && editedBike ? editedBike.status : bike.status).statuses.map((status, index) => {
              const currentStatus = isEditMode && editedBike ? editedBike.status : bike.status;
              const isCompleted = index < getStatusProgress(currentStatus).currentStep - 1;
              const isCurrent = index === getStatusProgress(currentStatus).currentStep - 1;
              const isPending = index > getStatusProgress(currentStatus).currentStep - 1;
              
              return (
                <div key={status} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  flex: 1,
                  position: 'relative'
                }}>
                  {/* Step Circle */}
                  <div 
                    style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      background: isCompleted 
                        ? getStatusColor(status).color 
                        : isCurrent 
                          ? getStatusColor(status).bg
                          : 'rgba(255, 255, 255, 0.1)',
                      border: `2px solid ${isCompleted || isCurrent 
                        ? getStatusColor(status).color 
                        : 'rgba(255, 255, 255, 0.2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.75rem',
                      transition: 'all 0.3s ease',
                      boxShadow: isCurrent ? `0 0 20px ${getStatusColor(status).color}40` : 'none',
                      cursor: 'default',
                      transform: isCurrent ? 'scale(1.05)' : 'scale(1)',
                      opacity: isCompleted || isCurrent ? 1 : 0.6
                    }}
                  >
                    {isCompleted ? (
                      <span style={{ color: 'white', fontSize: '1rem', fontWeight: 'bold' }}>✓</span>
                    ) : (
                      <span style={{ 
                        color: isCurrent ? getStatusColor(status).color : '#94a3b8', 
                        fontSize: '1rem', 
                        fontWeight: 'bold' 
                      }}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ 
                      color: isCurrent ? getStatusColor(status).color : isCompleted ? 'white' : '#94a3b8',
                      fontSize: '0.875rem', 
                      fontWeight: isCurrent ? '600' : '500',
                      margin: 0,
                      textShadow: isCurrent ? `0 0 10px ${getStatusColor(status).color}40` : 'none'
                    }}>
                      {status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assignment Section */}
        <div className="kpi-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            Mechanic Assignment
          </h3>
          
          {bike?.assignedMechanic ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '0.5rem' }}>
              <div>
                <p style={{ color: 'white', fontSize: '1rem', fontWeight: '500', margin: '0 0 0.25rem 0' }}>
                  Assigned to: {bike.assignedMechanic.name}
                </p>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>
                  Email: {bike.assignedMechanic.email}
                </p>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', margin: '0' }}>
                  Assigned: {new Date(bike.assignedMechanic.assignedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={handleUnassignBike}
                disabled={isAssigning}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: isAssigning ? 'not-allowed' : 'pointer',
                  opacity: isAssigning ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isAssigning) {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAssigning) {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  }
                }}
              >
                {isAssigning ? 'Unassigning...' : 'Unassign'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '0.5rem' }}>
              <div>
                <p style={{ color: 'white', fontSize: '1rem', fontWeight: '500', margin: '0 0 0.25rem 0' }}>
                  Ready to Assign
                </p>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', margin: '0' }}>
                  This bike is not currently assigned to any mechanic
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(true);
                  setUserTypeFilter('mechanics');
                  // Reset to mechanics when modal opens
                  const mechanicUsers = allUsers.filter((user: any) => 
                    user.role === 'mechanic' || user.role === 'technician' || user.role === 'service'
                  );
                  setMechanics(mechanicUsers);
                }}
                disabled={isAssigning}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: isAssigning ? 'not-allowed' : 'pointer',
                  opacity: isAssigning ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isAssigning) {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAssigning) {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                  }
                }}
              >
                Assign User
              </button>
            </div>
          )}

          {assignMessage && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: assignMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${assignMessage.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '0.375rem',
              color: assignMessage.type === 'success' ? '#22c55e' : '#ef4444',
              fontSize: '0.875rem'
            }}>
              {assignMessage.text}
            </div>
          )}
        </div>

        {/* Bike Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Main Details Card */}
          <div className="kpi-card" style={{ padding: '2rem' }}>
            {/* New Simple Image Gallery */}
            <div style={{ marginBottom: '2rem' }}>
                          <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              Images
            </h3>
            
                          {/* Hidden File Input for Image Upload */}
            <input
              type="file"
              id="image-file-input"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
              
              {/* Main Large Image - Dropbox when editing, display when not */}
              <div style={{
                width: '100%',
                height: '400px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: isEditMode 
                  ? isDragOver 
                    ? '2px dashed rgba(34, 197, 94, 0.8)' 
                    : '2px dashed rgba(139, 92, 246, 0.6)'
                  : '2px solid rgba(139, 92, 246, 0.3)',
                background: isEditMode 
                  ? isDragOver
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)'
                  : 'rgba(139, 92, 246, 0.05)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isEditMode ? 'pointer' : 'default',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (isEditMode && !isDragOver) {
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.8)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)';
                }
              }}
              onMouseLeave={(e) => {
                if (isEditMode && !isDragOver) {
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)';
                }
              }}
              onClick={() => {
                if (isEditMode) {
                  // Trigger file input
                  document.getElementById('image-file-input')?.click();
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              >
                {!isEditMode && bikeImages && bikeImages.length > 0 ? (
                  /* View Mode - Show Main Image */
                  <img
                    src={`data:${bikeImages[0].contentType};base64,${bikeImages[0].data}`}
                    alt="Main bike image"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : isEditMode ? (
                  /* Edit Mode - Show Drag & Drop Upload Area */
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDragOver ? '#22c55e' : '#64748b',
                    textAlign: 'center',
                    transition: 'color 0.3s ease'
                  }}>
                    <div style={{ 
                      fontSize: isDragOver ? '3rem' : '2.5rem', 
                      marginBottom: '0.5rem',
                      opacity: isDragOver ? 0.8 : 0.5,
                      transition: 'all 0.3s ease'
                    }}>{isDragOver ? 'Drop' : 'Upload'}</div>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      margin: '0 0 0.25rem 0',
                      opacity: isDragOver ? 1 : 0.6,
                      fontWeight: isDragOver ? '600' : '400',
                      transition: 'all 0.3s ease'
                    }}>
                      {isDragOver ? 'Drop images here!' : 'Drag & drop images or click to upload'}
                    </p>
                    {!isDragOver && (
                      <p style={{ 
                        fontSize: '0.75rem', 
                        margin: 0,
                        opacity: 0.4,
                        fontStyle: 'italic'
                      }}>Supports JPG, PNG, WebP files</p>
                    )}
                    {isUploadingImages && (
                      <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#8b5cf6',
                        opacity: 0.8
                      }}>
                        Uploading...
                      </div>
                    )}
                  </div>
                ) : (
                  /* No Images - Show Subtle Placeholder */
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    width: '100%',
                    height: '100%'
                  }}>
                    <div style={{ 
                      fontSize: '3rem', 
                      marginBottom: '0.5rem',
                      opacity: 0.4
                    }}>Upload</div>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      margin: 0,
                      opacity: 0.6
                    }}>No images uploaded</p>
                  </div>
                )}
              </div>
              
              {/* Small Images Row - Show main image first, then additional images */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: showAllImages ? 'repeat(auto-fit, minmax(120px, 1fr))' : 'repeat(4, 1fr)',
                gap: '0.75rem'
              }}>
                {/* Show main image first if it exists */}
                {bikeImages && bikeImages.length > 0 ? (
                  <div style={{
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '2px solid rgba(139, 92, 246, 0.4)',
                    background: 'rgba(139, 92, 246, 0.05)',
                    position: 'relative'
                  }}>
                    <img
                      src={`data:${bikeImages[0].contentType};base64,${bikeImages[0].data}`}
                      alt="Main bike image"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {isEditMode && (
                      <>
                        <div style={{
                          position: 'absolute',
                          top: '0.25rem',
                          left: '0.25rem',
                          background: 'rgba(139, 92, 246, 0.9)',
                          color: 'white',
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: '500'
                        }}>
                          Main
                        </div>
                        <button
                          style={{
                            position: 'absolute',
                            top: '0.25rem',
                            right: '0.25rem',
                            background: 'rgba(239, 68, 68, 0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '1.25rem',
                            height: '1.25rem',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem'
                          }}
                          onClick={() => handleDeleteImage(0)}
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
                
                {/* Show additional images */}
                {bikeImages && bikeImages.length > 1 ? (
                  bikeImages.slice(1, showAllImages ? bikeImages.length : 4).map((imageData, index) => {
                    console.log('Image data at index', index + 1, ':', imageData);
                    
                    // Handle different image data formats
                    let imageSrc = '';
                    if (imageData && typeof imageData === 'object' && imageData.contentType && imageData.data) {
                      // New format: {contentType, data}
                      imageSrc = `data:${imageData.contentType};base64,${imageData.data}`;
                    } else if (typeof imageData === 'string') {
                      // Old format: direct URL string
                      imageSrc = imageData;
                    } else {
                      console.warn('Unknown image data format:', imageData);
                      return null;
                    }
                    
                    return (
                      <div key={index + 1} style={{
                        aspectRatio: '1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        background: 'rgba(139, 92, 246, 0.05)',
                        position: 'relative'
                      }}>
                        <img
                          src={imageSrc}
                          alt={`Bike image ${index + 2}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        {isEditMode && (
                          <>
                            <div style={{
                              position: 'absolute',
                              top: '0.25rem',
                              left: '0.25rem',
                              background: 'rgba(139, 92, 246, 0.9)',
                              color: 'white',
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontWeight: '500'
                            }}>
                              #{index + 2}
                            </div>
                            <button
                              style={{
                                position: 'absolute',
                                top: '0.25rem',
                                right: '0.25rem',
                                background: 'rgba(239, 68, 68, 0.9)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '1.25rem',
                                height: '1.25rem',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem'
                              }}
                              onClick={() => handleDeleteImage(index + 1)}
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })
                ) : null}
                
                {/* Show preview images from selected files */}
                {imagePreviews.map((previewUrl, index) => (
                  <div key={`preview-${index}`} style={{
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '2px solid rgba(34, 197, 94, 0.4)',
                    background: 'rgba(34, 197, 94, 0.05)',
                    position: 'relative'
                  }}>
                    <img
                      src={previewUrl}
                      alt={`Preview image ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {isEditMode && (
                      <>
                        <div style={{
                          position: 'absolute',
                          top: '0.25rem',
                          left: '0.25rem',
                          background: 'rgba(34, 197, 94, 0.9)',
                          color: 'white',
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: '500'
                        }}>
                          New
                        </div>
                        <button
                          style={{
                            position: 'absolute',
                            top: '0.25rem',
                            right: '0.25rem',
                            background: 'rgba(239, 68, 68, 0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '1.25rem',
                            height: '1.25rem',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem'
                          }}
                          onClick={() => {
                            // Remove preview and selected image
                            setImagePreviews(prev => prev.filter((_, i) => i !== index));
                            setSelectedImages(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                ))}
                
              </div>
              
              {/* Show More/Less Button */}
              {bikeImages && bikeImages.length > 4 && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '1rem'
                }}>
                  <button
                    onClick={() => setShowAllImages(!showAllImages)}
                    style={{
                      background: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      color: '#8b5cf6',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '0 auto'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    }}
                  >
                    {showAllImages ? '👁️ Show Less' : `👁️ Show ${bikeImages.length - 4} More`}
                  </button>
                </div>
              )}
              
              {/* Simple Upload Button */}
              {isEditMode && (
                <div style={{
                  marginTop: '1rem',
                  textAlign: 'center'
                }}>
                  <button
                    style={{
                      background: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      borderRadius: '8px',
                      color: '#8b5cf6',
                      padding: '0.75rem 1.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                    }}
                    onClick={() => {
                      // Trigger file input
                      document.getElementById('image-file-input')?.click();
                    }}
                  >
                    Add Images
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Quick Info Card */}
            <div className="kpi-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                Quick Info
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', rowGap: '1.5rem', alignItems: 'start' }}>
                {/* Make */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, marginTop: '0.125rem' }}>
                    <TruckIcon style={{ width: '100%', height: '100%', color: '#8b5cf6' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0, lineHeight: '1rem' }}>Make</p>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedBike?.brand || ''}
                        onChange={(e) => handleFieldChange('brand', e.target.value)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          width: '100%',
                          marginTop: '0.125rem'
                        }}
                      />
                    ) : (
                      <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', margin: '0.125rem 0 0 0', lineHeight: '1.25rem' }}>{bike.brand}</p>
                    )}
                  </div>
                </div>
                
                {/* Model */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, marginTop: '0.125rem' }}>
                    <CogIcon style={{ width: '100%', height: '100%', color: '#8b5cf6' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0, lineHeight: '1rem' }}>Model</p>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedBike?.model || ''}
                        onChange={(e) => handleFieldChange('model', e.target.value)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          width: '100%',
                          marginTop: '0.125rem'
                        }}
                      />
                    ) : (
                      <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', margin: '0.125rem 0 0 0', lineHeight: '1.25rem' }}>{bike.model}</p>
                    )}
                  </div>
                </div>
                
                {/* Year */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, marginTop: '0.125rem' }}>
                    <CalendarIcon style={{ width: '100%', height: '100%', color: '#8b5cf6' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0, lineHeight: '1rem' }}>Year</p>
                    {isEditMode ? (
                      <input
                        type="number"
                        value={editedBike?.year || ''}
                        onChange={(e) => handleFieldChange('year', parseInt(e.target.value) || 0)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          width: '100%',
                          marginTop: '0.125rem'
                        }}
                      />
                    ) : (
                      <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', margin: '0.125rem 0 0 0', lineHeight: '1.25rem' }}>{bike.year}</p>
                    )}
                  </div>
                </div>
                
                {/* Mileage */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, marginTop: '0.125rem' }}>
                    <ClockIcon style={{ width: '100%', height: '100%', color: '#8b5cf6' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0, lineHeight: '1rem' }}>Mileage</p>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedBike?.mileage || ''}
                        onChange={(e) => handleFieldChange('mileage', e.target.value)}
                        placeholder="e.g., 15,000 mi"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          width: '100%',
                          marginTop: '0.125rem'
                        }}
                      />
                    ) : (
                      <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', margin: '0.125rem 0 0 0', lineHeight: '1.25rem' }}>
                        {(() => {
                          const mileage = bike?.mileage;
                          if (typeof mileage === 'number') {
                            return (mileage as number).toLocaleString();
                          }
                          if (typeof mileage === 'string' && mileage) {
                            const numericValue = Number(mileage.replace(/[^0-9]/g, ''));
                            if (!isNaN(numericValue)) {
                              return numericValue.toLocaleString() + ' mi';
                            }
                          }
                          return mileage || 'N/A';
                        })()}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Engine (CCs) */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, marginTop: '0.125rem' }}>
                    <CogIcon style={{ width: '100%', height: '100%', color: '#8b5cf6' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0, lineHeight: '1rem' }}>Engine (CCs)</p>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedBike?.engineDisplacement || ''}
                        onChange={(e) => handleFieldChange('engineDisplacement', e.target.value)}
                        placeholder="e.g., 600cc, 1000cc"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          width: '100%',
                          marginTop: '0.125rem'
                        }}
                      />
                    ) : (
                      <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', margin: '0.125rem 0 0 0', lineHeight: '1.25rem' }}>
                        {bike.engineDisplacement || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Horsepower */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, marginTop: '0.125rem' }}>
                    <BoltIcon style={{ width: '100%', height: '100%', color: '#8b5cf6' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0, lineHeight: '1rem' }}>Horsepower</p>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedBike?.horsepower || ''}
                        onChange={(e) => handleFieldChange('horsepower', e.target.value)}
                        placeholder="e.g., 150 HP, 200 HP"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          width: '100%',
                          marginTop: '0.125rem'
                        }}
                      />
                    ) : (
                      <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', margin: '0.125rem 0 0 0', lineHeight: '1.25rem' }}>
                        {bike.horsepower || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* VIN */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, marginTop: '0.125rem' }}>
                    <DocumentTextIcon style={{ width: '100%', height: '100%', color: '#8b5cf6' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0, lineHeight: '1rem' }}>VIN</p>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedBike?.vin || ''}
                        onChange={(e) => {
                          const newVin = e.target.value.toUpperCase();
                          handleFieldChange('vin', newVin);
                          
                          // Auto-fill when VIN is complete (17 characters) - now async
                          if (newVin.length === 17) {
                            setTimeout(async () => {
                              await autoFillFromVIN(newVin);
                            }, 100);
                          }
                        }}
                        placeholder="17-character VIN (no I, O, or Q)"
                        maxLength={17}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          fontWeight: '500',
                          width: '100%',
                          marginTop: '0.125rem'
                        }}
                      />
                    ) : (
                      <p style={{ color: 'white', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: '500', margin: '0.125rem 0 0 0', lineHeight: '1.25rem', wordBreak: 'break-all' }}>{bike.vin}</p>
                    )}
                    
                    {/* Auto-fill button - show in edit mode */}
                    {isEditMode && (
                      <button
                        onClick={async () => {
                          if (editedBike?.vin && editedBike.vin.length === 17) {
                            await autoFillFromVIN(editedBike.vin);
                          }
                        }}
                        disabled={!editedBike?.vin || editedBike.vin.length !== 17}
                        style={{
                          background: (!editedBike?.vin || editedBike.vin.length !== 17) 
                            ? 'rgba(107, 114, 128, 0.2)' 
                            : 'rgba(34, 197, 94, 0.2)',
                          border: (!editedBike?.vin || editedBike.vin.length !== 17)
                            ? '1px solid rgba(107, 114, 128, 0.3)'
                            : '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: '4px',
                          color: (!editedBike?.vin || editedBike.vin.length !== 17)
                            ? '#9ca3af'
                            : '#22c55e',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.625rem',
                          fontWeight: '500',
                          cursor: (!editedBike?.vin || editedBike.vin.length !== 17)
                            ? 'not-allowed'
                            : 'pointer',
                          marginTop: '0.5rem',
                          transition: 'all 0.2s ease',
                          opacity: (!editedBike?.vin || editedBike.vin.length !== 17) ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (editedBike?.vin && editedBike.vin.length === 17) {
                            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (editedBike?.vin && editedBike.vin.length === 17) {
                            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                          }
                        }}
                      >
                        {(!editedBike?.vin || editedBike.vin.length !== 17) 
                          ? 'Enter 17-character VIN to auto-fill'
                          : 'Auto-fill from VIN'
                        }
                      </button>
                    )}
                    
                    {/* VIN Message Display */}
                    {vinMessage && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: vinMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${vinMessage.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: '0.375rem',
                        color: vinMessage.type === 'success' ? '#22c55e' : '#ef4444',
                        fontSize: '0.75rem'
                      }}>
                        {vinMessage.text}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Color */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, marginTop: '0.125rem' }}>
                    <SwatchIcon style={{ width: '100%', height: '100%', color: '#8b5cf6' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0, lineHeight: '1rem' }}>Color</p>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedBike?.color || ''}
                        onChange={(e) => handleFieldChange('color', e.target.value)}
                        placeholder="e.g., Red, Blue, Black"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          width: '100%',
                          marginTop: '0.125rem'
                        }}
                      />
                    ) : (
                      <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', margin: '0.125rem 0 0 0', lineHeight: '1.25rem' }}>{bike.color || 'Not specified'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="kpi-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {isEditMode ? (
                  <>
                    <button 
                      onClick={handleSaveEdit}
                      disabled={isUploadingImages}
                      style={{ 
                        padding: '0.75rem 1rem', 
                        width: '100%',
                        fontSize: '0.875rem',
                        background: isUploadingImages ? 'rgba(107, 114, 128, 0.3)' : 'rgba(34, 197, 94, 0.2)',
                        color: isUploadingImages ? '#6b7280' : '#22c55e',
                        border: `1px solid ${isUploadingImages ? 'rgba(107, 114, 128, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                        borderRadius: '1rem',
                        cursor: isUploadingImages ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {isUploadingImages ? (
                        <>
                          <div style={{ 
                            width: '1rem', 
                            height: '1rem', 
                            border: '2px solid transparent',
                            borderTop: '2px solid currentColor',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          ✓ Save Changes
                          {selectedImages.length > 0 && (
                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                              +{selectedImages.length} image{selectedImages.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      style={{ 
                        padding: '0.75rem 1rem', 
                        width: '100%',
                        fontSize: '0.875rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      ✕ Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleEditClick}
                    className="action-card" 
                    style={{ 
                      padding: '0.75rem 1rem', 
                      width: '100%',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <ClipboardDocumentIcon style={{ width: '1rem', height: '1rem' }} />
                    Edit Details
                  </button>
                )}
              </div>
            </div>

            {/* History Card */}
            <div className="kpi-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                History
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', rowGap: '1.5rem', alignItems: 'start' }}>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Added</p>
                  <p style={{ color: 'white', fontSize: '0.875rem' }}>
                    {new Date(bike.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Last Updated</p>
                  <p style={{ color: 'white', fontSize: '0.875rem' }}>
                    {new Date(bike.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Date Acquired</p>
                  {isEditMode ? (
                    <input
                      type="date"
                      value={editedBike?.dateAcquired || ''}
                      onChange={(e) => handleFieldChange('dateAcquired', e.target.value)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.875rem',
                        padding: '0.25rem 0.5rem',
                        width: '100%'
                      }}
                    />
                  ) : (
                    <p style={{ color: 'white', fontSize: '0.875rem' }}>
                      {bike.dateAcquired ? (() => {
                        try {
                          // Handle both ISO strings and YYYY-MM-DD formats
                          const date = new Date(bike.dateAcquired);
                          if (isNaN(date.getTime())) return 'Invalid date';
                          return date.toLocaleDateString();
                        } catch {
                          return 'Invalid date';
                        }
                      })() : 'Not set'}
                    </p>
                  )}
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Date Sold</p>
                  {isEditMode ? (
                    <input
                      type="date"
                      value={editedBike?.dateSold || ''}
                      onChange={(e) => handleFieldChange('dateSold', e.target.value)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.875rem',
                        padding: '0.25rem 0.5rem',
                        width: '100%'
                      }}
                    />
                  ) : (
                    <p style={{ color: 'white', fontSize: '0.875rem' }}>
                      {bike.dateSold ? (() => {
                        try {
                          // Handle both ISO strings and YYYY-MM-DD formats
                          const date = new Date(bike.dateSold);
                          if (isNaN(date.getTime())) return 'Invalid date';
                          return date.toLocaleDateString();
                        } catch {
                          return 'Invalid date';
                        }
                      })() : 'Not sold'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Section - Full Width Row */}
        <div style={{ margin: '2rem 0' }}>
          <div className="kpi-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardDocumentIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
                Evaluation
              </h3>
              {evaluationData && evaluationData.evaluatedAt && (
                <div style={{ 
                  color: '#94a3b8', 
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>Evaluated by {evaluationData.evaluatedBy}</span>
                  <span>•</span>
                  <span>{new Date(evaluationData.evaluatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Service List */}
              <div>
                <h4 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <WrenchScrewdriverIcon style={{ width: '1rem', height: '1rem', color: '#8b5cf6' }} />
                  Service Required
                </h4>
                <div style={{ 
                  background: 'rgba(139, 92, 246, 0.05)', 
                  border: '1px solid rgba(139, 92, 246, 0.2)', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  minHeight: '200px'
                }}>
                  {evaluationData && evaluationData.serviceRequired && evaluationData.serviceRequired.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {evaluationData.serviceRequired.map((service: string, index: number) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem',
                          background: 'rgba(139, 92, 246, 0.1)',
                          borderRadius: '6px',
                          border: '1px solid rgba(139, 92, 246, 0.2)'
                        }}>
                          <input
                            type="checkbox"
                            style={{
                              width: '1rem',
                              height: '1rem',
                              accentColor: '#8b5cf6'
                            }}
                          />
                          <span style={{ color: 'white', fontSize: '0.875rem' }}>{service}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      color: '#64748b', 
                      textAlign: 'center', 
                      padding: '2rem',
                      fontSize: '0.875rem'
                    }}>
                      No evaluation services set up
                    </div>
                  )}
                </div>
              </div>
              
              {/* Parts Requested */}
              <div>
                <h4 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CogIcon style={{ width: '1rem', height: '1rem', color: '#8b5cf6' }} />
                  Parts Requested
                </h4>
                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.05)', 
                  border: '1px solid rgba(59, 130, 246, 0.2)', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  minHeight: '200px'
                }}>
                  {evaluationData && evaluationData.partsRequested && evaluationData.partsRequested.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {evaluationData.partsRequested.map((part: string, index: number) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem',
                          background: 'rgba(59, 130, 246, 0.1)',
                          borderRadius: '6px',
                          border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}>
                          <input
                            type="checkbox"
                            style={{
                              width: '1rem',
                              height: '1rem',
                              accentColor: '#3b82f6'
                            }}
                          />
                          <span style={{ color: 'white', fontSize: '0.875rem' }}>{part}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      color: '#64748b', 
                      textAlign: 'center', 
                      padding: '2rem',
                      fontSize: '0.875rem'
                    }}>
                      No evaluation parts set up
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actual Financial Data Section - Full Width Row */}
        <div style={{ margin: '2rem 0' }}>
          <div className="kpi-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BanknotesIcon style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e' }} />
                Actual Financial Data
              </h3>
            </div>
            
            {/* Actual Financial Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Acquisition Price */}
              <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', textAlign: 'center' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Acquisition Price</div>
                {isEditMode ? (
                  <input
                    type="number"
                    value={editedBike?.price || ''}
                    onChange={(e) => handleFieldChange('price', parseInt(e.target.value) || 0)}
                    style={{
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      color: '#22c55e',
                      fontSize: '1rem',
                      fontWeight: '600',
                      width: '100%',
                      textAlign: 'center'
                    }}
                  />
                ) : (
                  <div style={{ color: '#22c55e', fontSize: '1.125rem', fontWeight: '600' }}>${bike.price.toLocaleString()}</div>
                )}
              </div>

              {/* Actual List Price */}
              <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', textAlign: 'center' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Actual List Price</div>
                {isEditMode ? (
                  <input
                    type="number"
                    value={editedBike?.actualListPrice || ''}
                    onChange={(e) => handleFieldChange('actualListPrice', parseInt(e.target.value) || 0)}
                    placeholder="Enter list price"
                    style={{
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      color: '#22c55e',
                      fontSize: '1rem',
                      fontWeight: '600',
                      width: '100%',
                      textAlign: 'center'
                    }}
                  />
                ) : (
                  <div style={{ color: '#22c55e', fontSize: '1.125rem', fontWeight: '600' }}>
                    {bike.actualListPrice ? `$${bike.actualListPrice.toLocaleString()}` : 'Not set'}
                  </div>
                )}
              </div>

              {/* Actual Sale Price */}
              <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Actual Sale Price</div>
                {isEditMode ? (
                  <input
                    type="number"
                    value={editedBike?.actualSalePrice || ''}
                    onChange={(e) => handleFieldChange('actualSalePrice', parseInt(e.target.value) || 0)}
                    placeholder="Enter sale price"
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      color: '#10b981',
                      fontSize: '1rem',
                      fontWeight: '600',
                      width: '100%',
                      textAlign: 'center'
                    }}
                  />
                ) : (
                  <div style={{ color: '#10b981', fontSize: '1.125rem', fontWeight: '600' }}>
                    {bike.actualSalePrice ? `$${bike.actualSalePrice.toLocaleString()}` : 'Not set'}
                  </div>
                )}
              </div>
            </div>

            {/* Actual Cost Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {/* Service Costs */}
              <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', textAlign: 'center' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Service Costs</div>
                <div style={{ color: '#f59e0b', fontSize: '1.125rem', fontWeight: '600' }}>
                  ${bikeServices.reduce((total, service) => {
                    const cost = typeof service.cost === 'number' ? service.cost : parseFloat(service.cost) || 0;
                    return total + cost;
                  }, 0).toLocaleString()}
                </div>
              </div>

              {/* Parts Costs */}
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Parts Costs</div>
                <div style={{ color: '#ef4444', fontSize: '1.125rem', fontWeight: '600' }}>
                  ${bikeParts.reduce((total, part) => {
                    const cost = parseFloat(part.cost) || 0;
                    return total + cost;
                  }, 0).toLocaleString()}
                </div>
              </div>
              
              {/* Transportation Costs */}
              <div style={{ padding: '0.75rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.2)', textAlign: 'center' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Transportation Costs</div>
                <div style={{ color: '#a855f7', fontSize: '1.125rem', fontWeight: '600' }}>
                  ${bikeTransportation.reduce((total, transport) => {
                    const cost = parseFloat(transport.cost) || 0;
                    return total + cost;
                  }, 0).toLocaleString()}
                </div>
              </div>

              {/* Total Investment */}
              <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', textAlign: 'center' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Total Investment</div>
                <div style={{ color: '#6366f1', fontSize: '1.125rem', fontWeight: '600' }}>
                  ${(bike.price + bikeServices.reduce((total, service) => {
                    const cost = typeof service.cost === 'number' ? service.cost : parseFloat(service.cost) || 0;
                    return total + cost;
                  }, 0) + bikeParts.reduce((total, part) => {
                    const cost = typeof part.cost === 'number' ? part.cost : parseFloat(part.cost) || 0;
                    return total + cost;
                  }, 0) + bikeTransportation.reduce((total, transport) => {
                    const cost = typeof transport.cost === 'number' ? transport.cost : parseFloat(transport.cost) || 0;
                    return total + cost;
                  }, 0)).toLocaleString()}
                </div>
              </div>

              {/* Actual Profit/Loss (if sold) */}
              {bike.actualSalePrice && (
                (() => {
                  const totalCosts = bike.price + bikeServices.reduce((total, service) => {
                    const cost = typeof service.cost === 'number' ? service.cost : parseFloat(service.cost) || 0;
                    return total + cost;
                  }, 0) + bikeParts.reduce((total, part) => {
                    const cost = typeof part.cost === 'number' ? part.cost : parseFloat(part.cost) || 0;
                    return total + cost;
                  }, 0) + bikeTransportation.reduce((total, transport) => {
                    const cost = typeof transport.cost === 'number' ? transport.cost : parseFloat(transport.cost) || 0;
                    return total + cost;
                  }, 0);
                  const profit = bike.actualSalePrice - totalCosts;
                  const isLoss = profit < 0;
                  const margin = bike.actualSalePrice > 0 ? (profit / bike.actualSalePrice) * 100 : 0;
                  
                  return (
                    <div style={{ 
                      padding: '0.75rem', 
                      background: isLoss ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                      borderRadius: '8px', 
                      border: isLoss ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)', 
                      textAlign: 'center' 
                    }}>
                      <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                        {isLoss ? 'Actual Loss' : 'Actual Profit'}
                      </div>
                      <div style={{ 
                        color: isLoss ? '#ef4444' : '#10b981', 
                        fontSize: '1.125rem', 
                        fontWeight: '600' 
                      }}>
                        ${Math.abs(profit).toLocaleString()}
                      </div>
                      <div style={{ 
                        color: isLoss ? '#ef4444' : '#10b981', 
                        fontSize: '0.75rem', 
                        marginTop: '0.25rem' 
                      }}>
                        {Math.abs(margin).toFixed(1)}% {isLoss ? 'loss' : 'margin'}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>

        {/* Projected Financial Data Section - Full Width Row */}
        <div style={{ margin: '2rem 0' }}>
          <div className="kpi-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BanknotesIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
                Projected Financial Data
              </h3>
            </div>
            
            {/* Projected Financial Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Projected High Sale */}
              <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', textAlign: 'center' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Projected High Sale</div>
                {isEditMode ? (
                  <input
                    type="number"
                    value={editedBike?.projectedHighSale || ''}
                    onChange={(e) => handleFieldChange('projectedHighSale', parseInt(e.target.value) || 0)}
                    placeholder="Enter high estimate"
                    style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      color: '#3b82f6',
                      fontSize: '1rem',
                      fontWeight: '600',
                      width: '100%',
                      textAlign: 'center'
                    }}
                  />
                ) : (
                  <div style={{ color: '#3b82f6', fontSize: '1.125rem', fontWeight: '600' }}>
                    {bike.projectedHighSale ? `$${bike.projectedHighSale.toLocaleString()}` : 'Not set'}
                  </div>
                )}
              </div>

              {/* Projected Low Sale */}
              <div style={{ padding: '0.75rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.2)', textAlign: 'center' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Projected Low Sale</div>
                {isEditMode ? (
                  <input
                    type="number"
                    value={editedBike?.projectedLowSale || ''}
                    onChange={(e) => handleFieldChange('projectedLowSale', parseInt(e.target.value) || 0)}
                    placeholder="Enter low estimate"
                    style={{
                      background: 'rgba(168, 85, 247, 0.1)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      color: '#a855f7',
                      fontSize: '1rem',
                      fontWeight: '600',
                      width: '100%',
                      textAlign: 'center'
                    }}
                  />
                ) : (
                  <div style={{ color: '#a855f7', fontSize: '1.125rem', fontWeight: '600' }}>
                    {bike.projectedLowSale ? `$${bike.projectedLowSale.toLocaleString()}` : 'Not set'}
                  </div>
                )}
              </div>

              {/* High Projected Cost */}
              <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', textAlign: 'center' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.5rem' }}>High Projected Cost</div>
                {isEditMode ? (
                  <input
                    type="number"
                    value={editedBike?.projectedCosts || ''}
                    onChange={(e) => handleFieldChange('projectedCosts', parseInt(e.target.value) || 0)}
                    placeholder="Enter high projected cost"
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      color: '#f59e0b',
                      fontSize: '1rem',
                      fontWeight: '600',
                      width: '100%',
                      textAlign: 'center'
                    }}
                  />
                ) : (
                  <div style={{ color: '#f59e0b', fontSize: '1.125rem', fontWeight: '600' }}>
                    {bike.projectedCosts ? `$${bike.projectedCosts.toLocaleString()}` : 'Not set'}
                  </div>
                )}
              </div>

              {/* Projected Low Cost */}
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Projected Low Cost</div>
                {isEditMode ? (
                  <input
                    type="number"
                    value={editedBike?.projectedLowCost || ''}
                    onChange={(e) => handleFieldChange('projectedLowCost', parseInt(e.target.value) || 0)}
                    placeholder="Enter low projected cost"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      color: '#ef4444',
                      fontSize: '1rem',
                      fontWeight: '600',
                      width: '100%',
                      textAlign: 'center'
                    }}
                  />
                ) : (
                  <div style={{ color: '#ef4444', fontSize: '1.125rem', fontWeight: '600' }}>
                    {bike.projectedLowCost ? `$${bike.projectedLowCost.toLocaleString()}` : 'Not set'}
                  </div>
                )}
              </div>
            </div>

            {/* Projected Analysis Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {/* Projected High Profit */}
              <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', textAlign: 'center' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Projected High Profit</div>
                <div style={{ color: '#22c55e', fontSize: '1.125rem', fontWeight: '600' }}>
                  ${(() => {
                    const projectedHighSale = bike.projectedHighSale || 0;
                    const projectedLowCost = bike.projectedLowCost || 0;
                    const acquisitionCost = bike.price || 0;
                    return Math.max(0, projectedHighSale - projectedLowCost - acquisitionCost).toLocaleString();
                  })()}
                </div>
                <div style={{ color: '#22c55e', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {(() => {
                    const projectedHighSale = bike.projectedHighSale || 0;
                    const projectedLowCost = bike.projectedLowCost || 0;
                    const acquisitionCost = bike.price || 0;
                    const profit = Math.max(0, projectedHighSale - projectedLowCost - acquisitionCost);
                    const margin = projectedHighSale > 0 ? (profit / projectedHighSale) * 100 : 0;
                    return `${margin.toFixed(1)}% margin`;
                  })()}
                </div>
              </div>

              {/* Projected Low Profit */}
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Projected Low Profit</div>
                <div style={{ color: '#ef4444', fontSize: '1.125rem', fontWeight: '600' }}>
                  ${(() => {
                    const projectedLowSale = bike.projectedLowSale || 0;
                    const projectedHighCost = bike.projectedCosts || 0;
                    const acquisitionCost = bike.price || 0;
                    return Math.max(0, projectedLowSale - projectedHighCost - acquisitionCost).toLocaleString();
                  })()}
                </div>
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {(() => {
                    const projectedLowSale = bike.projectedLowSale || 0;
                    const projectedHighCost = bike.projectedCosts || 0;
                    const acquisitionCost = bike.price || 0;
                    const profit = Math.max(0, projectedLowSale - projectedHighCost - acquisitionCost);
                    const margin = projectedLowSale > 0 ? (profit / projectedLowSale) * 100 : 0;
                    return `${margin.toFixed(1)}% margin`;
                  })()}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Service, Parts, and Transportation Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '2rem' }}>

          {/* Parts Section */}
          <div className="kpi-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CogIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
                Parts ({bikeParts.length})
              </h3>
              <button 
                onClick={() => setShowAddPartModal(true)}
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '6px',
                  color: '#8b5cf6',
                  padding: '0.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PlusIcon style={{ width: '0.875rem', height: '0.875rem' }} />
              </button>
            </div>
            
            <div style={{ 
              height: '300px', 
              overflowY: bikeParts.length > 3 ? 'auto' : 'hidden',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              paddingRight: bikeParts.length > 3 ? '0.5rem' : '0'
            }}
            className="custom-scrollbar"
            >
              {bikeParts.map((part) => (
                <div key={part.id} style={{ 
                  padding: '1rem', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  minHeight: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', margin: '0 0 0.25rem 0' }}>{part.name}</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>
                        Installed: {new Date(part.installDate).toLocaleDateString()} • ${part.cost} • {part.paymentType}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        color: getConditionColor(part.condition).color, 
                        fontSize: '0.75rem', 
                        background: getConditionColor(part.condition).bg, 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '12px' 
                      }}>
                        {part.condition}
                      </span>
                      {isEditMode && (
                        <button
                          onClick={() => handleEditPartClick(part.id)}
                          style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '4px',
                            color: '#8b5cf6',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service Section */}
          <div className="kpi-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <WrenchScrewdriverIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
                Service ({bikeServices.length})
              </h3>
              <button 
                onClick={() => setShowAddServiceModal(true)}
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '6px',
                  color: '#8b5cf6',
                  padding: '0.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PlusIcon style={{ width: '0.875rem', height: '0.875rem' }} />
              </button>
            </div>
            
            <div style={{ 
              height: '300px', 
              overflowY: bikeServices.length > 3 ? 'auto' : 'hidden',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              paddingRight: bikeServices.length > 3 ? '0.5rem' : '0'
            }}
            className="custom-scrollbar"
            >
              {bikeServices.map((service) => (
                <div key={service.id} style={{ 
                  padding: '1rem', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  minHeight: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', margin: '0 0 0.25rem 0' }}>{service.title}</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>
                        {new Date(service.date).toLocaleDateString()} • {service.serviceLocation === 'In-House' ? `${service.hours}h • ${service.technician}` : `$${service.cost} • ${service.serviceProvider}`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#22c55e', fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '12px' }}>
                        Completed
                      </span>
                      {isEditMode && (
                        <button
                          onClick={() => handleEditServiceClick(service.id)}
                          style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '4px',
                            color: '#8b5cf6',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transportation Section */}
          <div className="kpi-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TruckIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
                Transportation ({bikeTransportation.length})
              </h3>
              <button 
                onClick={() => setShowAddTransportModal(true)}
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '6px',
                  color: '#8b5cf6',
                  padding: '0.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PlusIcon style={{ width: '0.875rem', height: '0.875rem' }} />
              </button>
            </div>
            
            <div style={{ 
              height: '300px', 
              overflowY: bikeTransportation.length > 3 ? 'auto' : 'hidden',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              paddingRight: bikeTransportation.length > 3 ? '0.5rem' : '0'
            }}
            className="custom-scrollbar"
            >
              {bikeTransportation.map((transport) => (
                <div key={transport.id} style={{ 
                  padding: '1rem', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  minHeight: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', margin: '0 0 0.25rem 0' }}>{transport.type}</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>
                        {new Date(transport.date).toLocaleDateString()} • ${transport.cost} • {transport.location}
                        {transport.company && ` • ${transport.company}`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#22c55e', fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '12px' }}>
                        Completed
                      </span>
                      {isEditMode && (
                        <button
                          onClick={() => handleEditTransportClick(transport.id)}
                          style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '4px',
                            color: '#8b5cf6',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Add Part Modal */}
      {showAddPartModal && (
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
          padding: '1rem',
          paddingTop: '3rem'
        }}>
          <div 
            className="modal-scroll"
            style={{
              background: 'rgba(30, 41, 59, 0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
              width: 'calc(100% - 2rem)',
              maxWidth: '550px',
              maxHeight: '85vh',
              overflow: 'auto',
              padding: '1.5rem',
              marginTop: '2rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                Add New Part
              </h3>
              <button
                onClick={() => setShowAddPartModal(false)}
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
              {/* Part Name */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Part Name *
                </label>
                <input
                  type="text"
                  value={newPartForm.name}
                  onChange={(e) => handlePartFormChange('name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., Front Brake Pads"
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Category
                </label>
                <select
                  value={newPartForm.category}
                  onChange={(e) => handlePartFormChange('category', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Engine" style={{ background: '#1e293b', color: 'white' }}>Engine</option>
                  <option value="Brakes" style={{ background: '#1e293b', color: 'white' }}>Brakes</option>
                  <option value="Drivetrain" style={{ background: '#1e293b', color: 'white' }}>Drivetrain</option>
                  <option value="Suspension" style={{ background: '#1e293b', color: 'white' }}>Suspension</option>
                  <option value="Electrical" style={{ background: '#1e293b', color: 'white' }}>Electrical</option>
                  <option value="Body" style={{ background: '#1e293b', color: 'white' }}>Body</option>
                  <option value="Other" style={{ background: '#1e293b', color: 'white' }}>Other</option>
                </select>
              </div>

              {/* Condition */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Condition
                </label>
                <select
                  value={newPartForm.condition}
                  onChange={(e) => handlePartFormChange('condition', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="New" style={{ background: '#1e293b', color: 'white' }}>New</option>
                  <option value="Good" style={{ background: '#1e293b', color: 'white' }}>Good</option>
                  <option value="Fair" style={{ background: '#1e293b', color: 'white' }}>Fair</option>
                  <option value="Poor" style={{ background: '#1e293b', color: 'white' }}>Poor</option>
                </select>
              </div>

              {/* Install Date */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Install Date
                </label>
                <input
                  type="date"
                  value={newPartForm.installDate}
                  onChange={(e) => handlePartFormChange('installDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Cost */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Cost *
                </label>
                <input
                  type="number"
                  value={newPartForm.cost}
                  onChange={(e) => handlePartFormChange('cost', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Supplier */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Supplier
                </label>
                <input
                  type="text"
                  value={newPartForm.supplier}
                  onChange={(e) => handlePartFormChange('supplier', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., Brembo"
                />
              </div>

              {/* Payment Type */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Payment Type
                </label>
                <select
                  value={newPartForm.paymentType}
                  onChange={(e) => handlePartFormChange('paymentType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Cash" style={{ background: '#1e293b', color: 'white' }}>Cash</option>
                  <option value="Card" style={{ background: '#1e293b', color: 'white' }}>Card</option>
                  <option value="Check" style={{ background: '#1e293b', color: 'white' }}>Check</option>
                  <option value="Transfer" style={{ background: '#1e293b', color: 'white' }}>Transfer</option>
                </select>
              </div>

              {/* Notes */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Notes
                </label>
                <textarea
                  value={newPartForm.notes}
                  onChange={(e) => handlePartFormChange('notes', e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                  placeholder="Additional notes about the part..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowAddPartModal(false)}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddPart}
                disabled={!newPartForm.name || !newPartForm.cost}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: newPartForm.name && newPartForm.cost 
                    ? 'rgba(139, 92, 246, 0.8)' 
                    : 'rgba(107, 114, 128, 0.3)',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.9rem',
                  cursor: newPartForm.name && newPartForm.cost 
                    ? 'pointer' 
                    : 'not-allowed',
                  transition: 'all 0.3s ease'
                }}
              >
                Add Part
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Part Modal */}
      {showEditPartModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
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
                ✏️ Edit Part
              </h3>
              <button
                onClick={handleCancelPartEdit}
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
              {/* Part Name */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Part Name *
                </label>
                <input
                  type="text"
                  value={editPartForm.name}
                  onChange={(e) => handleEditPartFormChange('name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., Front Brake Pads"
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Category
                </label>
                <select
                  value={editPartForm.category}
                  onChange={(e) => handleEditPartFormChange('category', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Engine" style={{ background: '#1e293b', color: 'white' }}>Engine</option>
                  <option value="Brakes" style={{ background: '#1e293b', color: 'white' }}>Brakes</option>
                  <option value="Drivetrain" style={{ background: '#1e293b', color: 'white' }}>Drivetrain</option>
                  <option value="Suspension" style={{ background: '#1e293b', color: 'white' }}>Suspension</option>
                  <option value="Electrical" style={{ background: '#1e293b', color: 'white' }}>Electrical</option>
                  <option value="Body" style={{ background: '#1e293b', color: 'white' }}>Body</option>
                  <option value="Other" style={{ background: '#1e293b', color: 'white' }}>Other</option>
                </select>
              </div>

              {/* Condition */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Condition
                </label>
                <select
                  value={editPartForm.condition}
                  onChange={(e) => handleEditPartFormChange('condition', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="New" style={{ background: '#1e293b', color: 'white' }}>New</option>
                  <option value="Good" style={{ background: '#1e293b', color: 'white' }}>Good</option>
                  <option value="Fair" style={{ background: '#1e293b', color: 'white' }}>Fair</option>
                  <option value="Poor" style={{ background: '#1e293b', color: 'white' }}>Poor</option>
                </select>
              </div>

              {/* Install Date */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Install Date
                </label>
                <input
                  type="date"
                  value={editPartForm.installDate}
                  onChange={(e) => handleEditPartFormChange('installDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Cost */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Cost *
                </label>
                <input
                  type="number"
                  value={editPartForm.cost}
                  onChange={(e) => handleEditPartFormChange('cost', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Supplier */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Supplier
                </label>
                <input
                  type="text"
                  value={editPartForm.supplier}
                  onChange={(e) => handleEditPartFormChange('supplier', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., Brembo"
                />
              </div>

              {/* Payment Type */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Payment Type
                </label>
                <select
                  value={editPartForm.paymentType}
                  onChange={(e) => handleEditPartFormChange('paymentType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Cash" style={{ background: '#1e293b', color: 'white' }}>Cash</option>
                  <option value="Card" style={{ background: '#1e293b', color: 'white' }}>Card</option>
                  <option value="Check" style={{ background: '#1e293b', color: 'white' }}>Check</option>
                  <option value="Transfer" style={{ background: '#1e293b', color: 'white' }}>Transfer</option>
                </select>
              </div>

              {/* Notes */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Notes
                </label>
                <textarea
                  value={editPartForm.notes}
                  onChange={(e) => handleEditPartFormChange('notes', e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                  placeholder="Additional notes about the part..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              {/* Delete Button - Left Side */}
              <button
                onClick={handleDeletePart}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Delete Part
              </button>

              {/* Cancel & Save Buttons - Right Side */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleCancelPartEdit}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#94a3b8',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePartEdit}
                  disabled={!editPartForm.name || !editPartForm.cost}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: editPartForm.name && editPartForm.cost 
                      ? 'rgba(139, 92, 246, 0.8)' 
                      : 'rgba(107, 114, 128, 0.3)',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem',
                    cursor: editPartForm.name && editPartForm.cost 
                      ? 'pointer' 
                      : 'not-allowed',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                  Add Service Record
                </h3>
                
                {/* Service Location Toggle */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleServiceFormChange('serviceLocation', 'In-House')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: newServiceForm.serviceLocation === 'In-House' 
                        ? 'rgba(139, 92, 246, 0.8)' 
                        : 'rgba(255, 255, 255, 0.1)',
                      border: `1px solid ${newServiceForm.serviceLocation === 'In-House' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.2)'}`,
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    In-House
                  </button>
                  <button
                    type="button"
                    onClick={() => handleServiceFormChange('serviceLocation', 'Out-Sourced')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: newServiceForm.serviceLocation === 'Out-Sourced' 
                        ? 'rgba(139, 92, 246, 0.8)' 
                        : 'rgba(255, 255, 255, 0.1)',
                      border: `1px solid ${newServiceForm.serviceLocation === 'Out-Sourced' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.2)'}`,
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Out-Sourced
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => setShowAddServiceModal(false)}
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
              {/* Service Title */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Service Title *
                </label>
                <input
                  type="text"
                  value={newServiceForm.title}
                  onChange={(e) => handleServiceFormChange('title', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., Regular Maintenance Service"
                />
              </div>



              {/* Service Type */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Service Type *
                </label>
                <select
                  value={newServiceForm.type}
                  onChange={(e) => handleServiceFormChange('type', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Oil Change" style={{ background: '#1e293b', color: 'white' }}>Oil Change</option>
                  <option value="Brake Service" style={{ background: '#1e293b', color: 'white' }}>Brake Service</option>
                  <option value="Tune-up" style={{ background: '#1e293b', color: 'white' }}>Tune-up</option>
                  <option value="Tire Service" style={{ background: '#1e293b', color: 'white' }}>Tire Service</option>
                  <option value="Chain Service" style={{ background: '#1e293b', color: 'white' }}>Chain Service</option>
                  <option value="Inspection" style={{ background: '#1e293b', color: 'white' }}>Inspection</option>
                  <option value="Repair" style={{ background: '#1e293b', color: 'white' }}>Repair</option>
                  <option value="Maintenance" style={{ background: '#1e293b', color: 'white' }}>Maintenance</option>
                  <option value="Other" style={{ background: '#1e293b', color: 'white' }}>Other</option>
                </select>
              </div>

              {/* Service Date */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Service Date
                </label>
                <input
                  type="date"
                  value={newServiceForm.date}
                  onChange={(e) => handleServiceFormChange('date', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Conditional Fields Based on Service Location */}
              {newServiceForm.serviceLocation === 'In-House' ? (
                <>
                  {/* Hours */}
                  <div>
                    <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                      Hours *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={newServiceForm.hours}
                      onChange={(e) => handleServiceFormChange('hours', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.9rem'
                      }}
                      placeholder="e.g., 2.5"
                    />
                  </div>

                  {/* Technician */}
                  <div>
                    <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                      Technician *
                    </label>
                    <input
                      type="text"
                      value={newServiceForm.technician}
                      onChange={(e) => handleServiceFormChange('technician', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.9rem'
                      }}
                      placeholder="e.g., Mike Johnson"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Cost */}
                  <div>
                    <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                      Cost *
                    </label>
                    <input
                      type="number"
                      value={newServiceForm.cost}
                      onChange={(e) => handleServiceFormChange('cost', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.9rem'
                      }}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  {/* Service Provider */}
                  <div>
                    <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                      Service Provider *
                    </label>
                    <input
                      type="text"
                      value={newServiceForm.serviceProvider}
                      onChange={(e) => handleServiceFormChange('serviceProvider', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.9rem'
                      }}
                      placeholder="e.g., Joe's Motorcycle Shop"
                    />
                  </div>

                  {/* Payment Type */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                      Payment Type
                    </label>
                    <select
                      value={newServiceForm.paymentType}
                      onChange={(e) => handleServiceFormChange('paymentType', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="Card" style={{ background: '#1e293b', color: 'white' }}>Card</option>
                      <option value="Cash" style={{ background: '#1e293b', color: 'white' }}>Cash</option>
                      <option value="Check" style={{ background: '#1e293b', color: 'white' }}>Check</option>
                      <option value="Financing" style={{ background: '#1e293b', color: 'white' }}>Financing</option>
                    </select>
                  </div>
                </>
              )}



              {/* Notes */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Notes
                </label>
                <textarea
                  value={newServiceForm.notes}
                  onChange={(e) => handleServiceFormChange('notes', e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                  placeholder="Additional notes about the service..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowAddServiceModal(false)}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddService}
                disabled={
                  !newServiceForm.title || !newServiceForm.type || 
                  (newServiceForm.serviceLocation === 'In-House' ? 
                    (!newServiceForm.hours || !newServiceForm.technician) : 
                    (!newServiceForm.cost || !newServiceForm.serviceProvider))
                }
                style={{
                  padding: '0.5rem 1.25rem',
                  background: (newServiceForm.title && newServiceForm.type && 
                    (newServiceForm.serviceLocation === 'In-House' ? 
                      (newServiceForm.hours && newServiceForm.technician) : 
                      (newServiceForm.cost && newServiceForm.serviceProvider)))
                    ? 'rgba(139, 92, 246, 0.8)' 
                    : 'rgba(107, 114, 128, 0.3)',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.9rem',
                  cursor: (newServiceForm.title && newServiceForm.type && 
                    (newServiceForm.serviceLocation === 'In-House' ? 
                      (newServiceForm.hours && newServiceForm.technician) : 
                      (newServiceForm.cost && newServiceForm.serviceProvider)))
                    ? 'pointer' 
                    : 'not-allowed',
                  transition: 'all 0.3s ease'
                }}
              >
                Add Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditServiceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
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
                ✏️ Edit Service Record
              </h3>
              <button
                onClick={handleCancelServiceEdit}
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
              {/* Service Type */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Service Type *
                </label>
                <select
                  value={editServiceForm.type}
                  onChange={(e) => handleEditServiceFormChange('type', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Oil Change" style={{ background: '#1e293b', color: 'white' }}>Oil Change</option>
                  <option value="Brake Service" style={{ background: '#1e293b', color: 'white' }}>Brake Service</option>
                  <option value="Tune-up" style={{ background: '#1e293b', color: 'white' }}>Tune-up</option>
                  <option value="Tire Service" style={{ background: '#1e293b', color: 'white' }}>Tire Service</option>
                  <option value="Chain Service" style={{ background: '#1e293b', color: 'white' }}>Chain Service</option>
                  <option value="Inspection" style={{ background: '#1e293b', color: 'white' }}>Inspection</option>
                  <option value="Repair" style={{ background: '#1e293b', color: 'white' }}>Repair</option>
                  <option value="Maintenance" style={{ background: '#1e293b', color: 'white' }}>Maintenance</option>
                  <option value="Other" style={{ background: '#1e293b', color: 'white' }}>Other</option>
                </select>
              </div>

              {/* Service Date */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Service Date
                </label>
                <input
                  type="date"
                  value={editServiceForm.date}
                  onChange={(e) => handleEditServiceFormChange('date', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Description *
                </label>
                <input
                  type="text"
                  value={editServiceForm.description}
                  onChange={(e) => handleEditServiceFormChange('description', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., Full synthetic oil change with filter replacement"
                />
              </div>

              {/* Cost */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Cost *
                </label>
                <input
                  type="number"
                  value={editServiceForm.cost}
                  onChange={(e) => handleEditServiceFormChange('cost', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Technician */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Technician
                </label>
                <input
                  type="text"
                  value={editServiceForm.technician}
                  onChange={(e) => handleEditServiceFormChange('technician', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., Mike Johnson"
                />
              </div>

              {/* Payment Type */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Payment Type
                </label>
                <select
                  value={editServiceForm.paymentType}
                  onChange={(e) => handleEditServiceFormChange('paymentType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Cash" style={{ background: '#1e293b', color: 'white' }}>Cash</option>
                  <option value="Card" style={{ background: '#1e293b', color: 'white' }}>Card</option>
                  <option value="Check" style={{ background: '#1e293b', color: 'white' }}>Check</option>
                  <option value="Transfer" style={{ background: '#1e293b', color: 'white' }}>Transfer</option>
                </select>
              </div>

              {/* Notes */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Notes
                </label>
                <textarea
                  value={editServiceForm.notes}
                  onChange={(e) => handleEditServiceFormChange('notes', e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                  placeholder="Additional notes about the service..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              {/* Delete Button - Left Side */}
              <button
                onClick={handleDeleteService}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Delete Service
              </button>

              {/* Cancel & Save Buttons - Right Side */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleCancelServiceEdit}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#94a3b8',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveServiceEdit}
                  disabled={!editServiceForm.type || !editServiceForm.description || !editServiceForm.cost}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: editServiceForm.type && editServiceForm.description && editServiceForm.cost 
                      ? 'rgba(139, 92, 246, 0.8)' 
                      : 'rgba(107, 114, 128, 0.3)',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem',
                    cursor: editServiceForm.type && editServiceForm.description && editServiceForm.cost 
                      ? 'pointer' 
                      : 'not-allowed',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Transportation Modal */}
      {showAddTransportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
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
                Add Transportation Record
              </h3>
              <button
                onClick={() => setShowAddTransportModal(false)}
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
              {/* Transport Type */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Transport Type *
                </label>
                <select
                  value={newTransportForm.type}
                  onChange={(e) => handleTransportFormChange('type', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Pickup" style={{ background: '#1e293b', color: 'white' }}>Pickup</option>
                  <option value="Delivery" style={{ background: '#1e293b', color: 'white' }}>Delivery</option>
                  <option value="Transport" style={{ background: '#1e293b', color: 'white' }}>Transport</option>
                  <option value="Shipping" style={{ background: '#1e293b', color: 'white' }}>Shipping</option>
                  <option value="Towing" style={{ background: '#1e293b', color: 'white' }}>Towing</option>
                </select>
              </div>

              {/* Transport Date */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Transport Date
                </label>
                <input
                  type="date"
                  value={newTransportForm.date}
                  onChange={(e) => handleTransportFormChange('date', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Description *
                </label>
                <input
                  type="text"
                  value={newTransportForm.description}
                  onChange={(e) => handleTransportFormChange('description', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., Auction house pickup from Barrett-Jackson"
                />
              </div>

              {/* Cost */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Cost *
                </label>
                <input
                  type="number"
                  value={newTransportForm.cost}
                  onChange={(e) => handleTransportFormChange('cost', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Location */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Location
                </label>
                <input
                  type="text"
                  value={newTransportForm.location}
                  onChange={(e) => handleTransportFormChange('location', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., Los Angeles, CA"
                />
              </div>

              {/* Company */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Transport Company
                </label>
                <input
                  type="text"
                  value={newTransportForm.company}
                  onChange={(e) => handleTransportFormChange('company', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., Transport Pro"
                />
              </div>

              {/* Payment Type */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Payment Type
                </label>
                <select
                  value={newTransportForm.paymentType}
                  onChange={(e) => handleTransportFormChange('paymentType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Cash" style={{ background: '#1e293b', color: 'white' }}>Cash</option>
                  <option value="Card" style={{ background: '#1e293b', color: 'white' }}>Card</option>
                  <option value="Check" style={{ background: '#1e293b', color: 'white' }}>Check</option>
                  <option value="Transfer" style={{ background: '#1e293b', color: 'white' }}>Transfer</option>
                </select>
              </div>

              {/* Notes */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Notes
                </label>
                <textarea
                  value={newTransportForm.notes}
                  onChange={(e) => handleTransportFormChange('notes', e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                  placeholder="Additional notes about the transportation..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowAddTransportModal(false)}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTransport}
                disabled={!newTransportForm.type || !newTransportForm.description || !newTransportForm.cost}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: newTransportForm.type && newTransportForm.description && newTransportForm.cost 
                    ? 'rgba(139, 92, 246, 0.8)' 
                    : 'rgba(107, 114, 128, 0.3)',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.9rem',
                  cursor: newTransportForm.type && newTransportForm.description && newTransportForm.cost 
                    ? 'pointer' 
                    : 'not-allowed',
                  transition: 'all 0.3s ease'
                }}
              >
                Add Transportation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transportation Modal */}
      {showEditTransportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
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
                ✏️ Edit Transportation Record
              </h3>
              <button
                onClick={handleCancelTransportEdit}
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
              {/* Transport Type */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Transport Type *
                </label>
                <select
                  value={editTransportForm.type}
                  onChange={(e) => handleEditTransportFormChange('type', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Pickup" style={{ background: '#1e293b', color: 'white' }}>Pickup</option>
                  <option value="Delivery" style={{ background: '#1e293b', color: 'white' }}>Delivery</option>
                  <option value="Transport" style={{ background: '#1e293b', color: 'white' }}>Transport</option>
                  <option value="Shipping" style={{ background: '#1e293b', color: 'white' }}>Shipping</option>
                  <option value="Towing" style={{ background: '#1e293b', color: 'white' }}>Towing</option>
                </select>
              </div>

              {/* Transport Date */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Transport Date
                </label>
                <input
                  type="date"
                  value={editTransportForm.date}
                  onChange={(e) => handleEditTransportFormChange('date', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Description *
                </label>
                <input
                  type="text"
                  value={editTransportForm.description}
                  onChange={(e) => handleEditTransportFormChange('description', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., Auction house pickup from Barrett-Jackson"
                />
              </div>

              {/* Cost */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Cost *
                </label>
                <input
                  type="number"
                  value={editTransportForm.cost}
                  onChange={(e) => handleEditTransportFormChange('cost', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Location */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Location
                </label>
                <input
                  type="text"
                  value={editTransportForm.location}
                  onChange={(e) => handleEditTransportFormChange('location', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., Los Angeles, CA"
                />
              </div>

              {/* Company */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Transport Company
                </label>
                <input
                  type="text"
                  value={editTransportForm.company}
                  onChange={(e) => handleEditTransportFormChange('company', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g., Transport Pro"
                />
              </div>

              {/* Payment Type */}
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Payment Type
                </label>
                <select
                  value={editTransportForm.paymentType}
                  onChange={(e) => handleEditTransportFormChange('paymentType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Cash" style={{ background: '#1e293b', color: 'white' }}>Cash</option>
                  <option value="Card" style={{ background: '#1e293b', color: 'white' }}>Card</option>
                  <option value="Check" style={{ background: '#1e293b', color: 'white' }}>Check</option>
                  <option value="Transfer" style={{ background: '#1e293b', color: 'white' }}>Transfer</option>
                </select>
              </div>

              {/* Notes */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                  Notes
                </label>
                <textarea
                  value={editTransportForm.notes}
                  onChange={(e) => handleEditTransportFormChange('notes', e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                  placeholder="Additional notes about the transportation..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              {/* Delete Button - Left Side */}
              <button
                onClick={handleDeleteTransport}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Delete Transport
              </button>

              {/* Cancel & Save Buttons - Right Side */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleCancelTransportEdit}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#94a3b8',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTransportEdit}
                  disabled={!editTransportForm.type || !editTransportForm.description || !editTransportForm.cost}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: editTransportForm.type && editTransportForm.description && editTransportForm.cost 
                      ? 'rgba(139, 92, 246, 0.8)' 
                      : 'rgba(107, 114, 128, 0.3)',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.9rem',
                    cursor: editTransportForm.type && editTransportForm.description && editTransportForm.cost 
                      ? 'pointer' 
                      : 'not-allowed',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
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
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{
              color: '#ef4444',
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>
              Warning
            </div>
            
            <h3 style={{
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              Delete Bike Permanently?
            </h3>
            
            <p style={{
              color: '#94a3b8',
              fontSize: '1rem',
              marginBottom: '0.5rem',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete <strong style={{ color: 'white' }}>{bike?.name}</strong>?
            </p>
            
            <p style={{
              color: '#ef4444',
              fontSize: '0.875rem',
              marginBottom: '2rem',
              fontWeight: '500'
            }}>
              This action cannot be undone. All associated parts, services, and transportation records will also be deleted.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                disabled={isDeleting}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isDeleting ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleDeleteBike}
                disabled={isDeleting}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: isDeleting 
                    ? 'rgba(239, 68, 68, 0.3)' 
                    : 'rgba(239, 68, 68, 0.8)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: isDeleting ? 0.7 : 1
                }}
              >
                {isDeleting ? (
                  <>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
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
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                Assign User
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', margin: '0' }}>
                Select a user to assign this bike to
              </p>
            </div>

            {/* User Type Filter */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>
                User Type
              </label>
              <select
                value={userTypeFilter}
                onChange={(e) => filterUsersByType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
              >
                <option value="mechanics">Mechanics & Technicians</option>
                <option value="managers">Managers & Admins</option>
                <option value="sales">Sales Team</option>
                <option value="all">All Users</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: '500', margin: '0 0 1rem 0' }}>
                Available Users ({mechanics.length})
              </h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {mechanics.length === 0 ? (
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
                    No users available for the selected type
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {mechanics.map((mechanic) => (
                      <button
                        key={mechanic._id}
                        onClick={() => handleAssignBike(mechanic._id, mechanic.name, mechanic.email)}
                        disabled={isAssigning}
                        style={{
                          padding: '1rem',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '0.5rem',
                          color: 'white',
                          textAlign: 'left',
                          cursor: isAssigning ? 'not-allowed' : 'pointer',
                          opacity: isAssigning ? 0.6 : 1,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isAssigning) {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isAssigning) {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                          }
                        }}
                      >
                        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                          {mechanic.name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                          {mechanic.email} • {mechanic.role}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                          Status: {mechanic.status}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setUserTypeFilter('mechanics');
                }}
                disabled={isAssigning}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'rgba(107, 114, 128, 0.1)',
                  border: '1px solid rgba(107, 114, 128, 0.3)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: isAssigning ? 'not-allowed' : 'pointer',
                  opacity: isAssigning ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isAssigning) {
                    e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAssigning) {
                    e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.1)';
                  }
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
