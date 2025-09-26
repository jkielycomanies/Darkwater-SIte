'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../dashboard.css';
import RevaniPortalHeader from '../../../../../components/RevaniPortalHeader';
import {
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TruckIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface ServiceJob {
  _id: string;
  bikeId: string;
  bikeName: string;
  customerName: string;
  technician: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'On Hold';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  description: string;
  estimatedHours: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface AssignedBike {
  _id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  status: 'Acquisition' | 'Evaluation' | 'Servicing' | 'Media' | 'Listed' | 'Sold';
  vin: string;
  mileage: string | number;
  assignedMechanic: {
    userId: string;
    name: string;
    email: string;
    assignedAt: string;
  };
  images?: Array<{
    data: string;
    contentType: string;
    filename: string;
    size: number;
    uploadedAt: string;
  }>;
}

interface PartNeeded {
  _id: string;
  name: string;
  partNumber: string;
  quantity: number;
  status: 'Needed' | 'Ordered' | 'Received' | 'Installed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimatedCost: number;
  supplier?: string;
  bikeId: string;
}

interface ServiceRequired {
  _id: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimatedHours: number;
  bikeId: string;
  category: 'Engine' | 'Electrical' | 'Brakes' | 'Suspension' | 'Bodywork' | 'Other';
}

export default function ServiceCenterPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [serviceJobs, setServiceJobs] = useState<ServiceJob[]>([]);
  const [assignedBikes, setAssignedBikes] = useState<AssignedBike[]>([]);
  const [selectedBike, setSelectedBike] = useState<AssignedBike | null>(null);
  const [partsNeeded, setPartsNeeded] = useState<PartNeeded[]>([]);
  const [servicesRequired, setServicesRequired] = useState<ServiceRequired[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed' | 'on-hold'>('all');
  
  // Timer states
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentJobBike, setCurrentJobBike] = useState<AssignedBike | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (params?.companyId) {
      fetchCompanyData(params.companyId as string);
      fetchServiceJobs();
      fetchAssignedBikes();
    }
  }, [session, router, params]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && timerStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - timerStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning, timerStartTime]);

  // Timer utility functions
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // Always return HH:MM:SS format starting from 00:00:00
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = (bike: AssignedBike) => {
    setCurrentJobBike(bike);
    setTimerStartTime(new Date());
    setElapsedTime(0);
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resumeTimer = () => {
    if (timerStartTime) {
      // Adjust start time to account for elapsed time
      const adjustedStartTime = new Date(Date.now() - elapsedTime * 1000);
      setTimerStartTime(adjustedStartTime);
      setIsTimerRunning(true);
    }
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setTimerStartTime(null);
    setElapsedTime(0);
    setCurrentJobBike(null);
  };

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

  const fetchServiceJobs = async () => {
    try {
      // TODO: Replace with real API call to fetch service jobs
      // const response = await fetch(`/api/companies/${params?.companyId}/service-jobs`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setServiceJobs(data.serviceJobs || []);
      // }
      
      // For now, start with empty array - no dummy data
      setServiceJobs([]);
    } catch (error) {
      console.error('Failed to fetch service jobs:', error);
      setServiceJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedBikes = async () => {
    try {
      if (!session?.user?.id) {
        setAssignedBikes([]);
        return;
      }

      const response = await fetch(`/api/companies/${params?.companyId}/inventory/bikes`);
      if (response.ok) {
        const data = await response.json();
        
        // Filter bikes that are assigned to the current user
        const userAssignedBikes = data.bikes.filter((bike: any) => 
          bike.assignedMechanic && bike.assignedMechanic.userId === session.user.id
        );
        
        setAssignedBikes(userAssignedBikes);
        console.log(`Found ${userAssignedBikes.length} bikes assigned to current user`);
      } else {
        console.error('Failed to fetch bikes');
        setAssignedBikes([]);
      }
    } catch (error) {
      console.error('Failed to fetch assigned bikes:', error);
      setAssignedBikes([]);
    }
  };

  const fetchPartsForBike = async (bikeId: string) => {
    try {
      // TODO: Replace with real API call to fetch parts needed for specific bike
      // const response = await fetch(`/api/companies/${params?.companyId}/inventory/bikes/${bikeId}/parts-needed`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setPartsNeeded(data.parts || []);
      // }
      
      // For now, generate some example parts based on bike ID
      const exampleParts: PartNeeded[] = [
        {
          _id: `part1-${bikeId}`,
          name: 'Brake Pads',
          partNumber: 'BP-001',
          quantity: 2,
          status: 'Needed',
          priority: 'High',
          estimatedCost: 85.99,
          supplier: 'OEM Parts Co.',
          bikeId: bikeId
        },
        {
          _id: `part2-${bikeId}`,
          name: 'Air Filter',
          partNumber: 'AF-205',
          quantity: 1,
          status: 'Ordered',
          priority: 'Medium',
          estimatedCost: 24.50,
          supplier: 'Filter Pro',
          bikeId: bikeId
        }
      ];
      
      setPartsNeeded(exampleParts);
    } catch (error) {
      console.error('Failed to fetch parts for bike:', error);
      setPartsNeeded([]);
    }
  };

  const fetchServicesForBike = async (bikeId: string) => {
    try {
      // TODO: Replace with real API call to fetch services required for specific bike
      // const response = await fetch(`/api/companies/${params?.companyId}/inventory/bikes/${bikeId}/services-required`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setServicesRequired(data.services || []);
      // }
      
      // For now, generate some example services based on bike ID
      const exampleServices: ServiceRequired[] = [
        {
          _id: `service1-${bikeId}`,
          title: 'Brake System Inspection',
          description: 'Complete brake system check and pad replacement',
          status: 'Pending',
          priority: 'High',
          estimatedHours: 2.5,
          bikeId: bikeId,
          category: 'Brakes'
        },
        {
          _id: `service2-${bikeId}`,
          title: 'Engine Oil Change',
          description: 'Replace engine oil and filter',
          status: 'In Progress',
          priority: 'Medium',
          estimatedHours: 1.0,
          bikeId: bikeId,
          category: 'Engine'
        }
      ];
      
      setServicesRequired(exampleServices);
    } catch (error) {
      console.error('Failed to fetch services for bike:', error);
      setServicesRequired([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#f59e0b';
      case 'In Progress': return '#3b82f6';
      case 'Completed': return '#10b981';
      case 'On Hold': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'High': return '#ef4444';
      case 'Urgent': return '#dc2626';
      case 'Critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getPartStatusColor = (status: string) => {
    switch (status) {
      case 'Needed': return '#f59e0b';
      case 'Ordered': return '#3b82f6';
      case 'Received': return '#8b5cf6';
      case 'Installed': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Engine': return '#ef4444';
      case 'Electrical': return '#f59e0b';
      case 'Brakes': return '#dc2626';
      case 'Suspension': return '#8b5cf6';
      case 'Bodywork': return '#10b981';
      case 'Other': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const filteredJobs = serviceJobs.filter(job => {
    if (filter === 'all') return true;
    return job.status.toLowerCase().replace(' ', '-') === filter;
  });

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={{ color: 'white', fontSize: '1.5rem' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="dashboard-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={{ color: 'white', fontSize: '1.5rem' }}>Company not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <RevaniPortalHeader company={company} activePage="service-center" />
      
      <main className="dashboard-main">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: '2.5rem', 
            fontWeight: '700',
            margin: 0,
            background: 'transparent',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            Service Center
          </h1>
        </div>

        {/* Start Job Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <button
            onClick={() => {
              if (selectedBike) {
                console.log('Starting job for bike:', selectedBike.name);
                startTimer(selectedBike);
                // Optional: Navigate to bike details or start job workflow
                // router.push(`/dashboard/${company?.slug}/inventory/bikes/${selectedBike._id}`);
              }
            }}
            disabled={!selectedBike}
            style={{
              background: selectedBike ? 'rgba(139, 92, 246, 0.2)' : 'rgba(107, 114, 128, 0.2)',
              border: `1px solid ${selectedBike ? 'rgba(139, 92, 246, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`,
              borderRadius: '8px',
              color: selectedBike ? '#8b5cf6' : '#6b7280',
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: selectedBike ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              opacity: selectedBike ? 1 : 0.6
            }}
            onMouseEnter={(e) => {
              if (selectedBike) {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedBike) {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
              }
            }}
          >
            <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            {selectedBike ? `Start Job - ${selectedBike.name}` : 'Start Job - Select a bike first'}
          </button>
        </div>

        {/* Main Content Layout */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Left Column - Assigned Bikes */}
          <div style={{ width: '350px', flexShrink: 0 }}>
            <div className="kpi-card" style={{ padding: '1.5rem' }}>
              <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                My Assigned Bikes
              </h2>
              
              {assignedBikes.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#9ca3af' 
                }}>
                  <TruckIcon style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem' }} />
                  <p style={{ fontSize: '0.875rem' }}>No bikes currently assigned to you</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {assignedBikes.map((bike) => (
                     <div
                       key={bike._id}
                       style={{
                         background: selectedBike?._id === bike._id ? 'rgba(139, 92, 246, 0.3)' : 'rgba(30, 41, 59, 0.5)',
                         border: `1px solid ${selectedBike?._id === bike._id ? 'rgba(139, 92, 246, 0.6)' : 'rgba(139, 92, 246, 0.3)'}`,
                         borderRadius: '8px',
                         padding: '1rem',
                         cursor: 'pointer',
                         transition: 'all 0.3s ease'
                       }}
                       onMouseEnter={(e) => {
                         if (selectedBike?._id !== bike._id) {
                           e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
                           e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                         }
                       }}
                       onMouseLeave={(e) => {
                         if (selectedBike?._id !== bike._id) {
                           e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                           e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                         }
                       }}
                       onClick={() => {
                         const newSelectedBike = selectedBike?._id === bike._id ? null : bike;
                         setSelectedBike(newSelectedBike);
                         
                         if (newSelectedBike) {
                           fetchPartsForBike(newSelectedBike._id);
                           fetchServicesForBike(newSelectedBike._id);
                         } else {
                           setPartsNeeded([]);
                           setServicesRequired([]);
                         }
                       }}
                     >
                      {/* Compact Bike Image */}
                      <div style={{
                        width: '100%',
                        height: '120px',
                        borderRadius: '6px',
                        marginBottom: '0.75rem',
                        overflow: 'hidden',
                        border: '1px solid rgba(139, 92, 246, 0.2)'
                      }}>
                        {bike.images && bike.images.length > 0 ? (
                          <img
                            src={`data:${bike.images[0].contentType};base64,${bike.images[0].data}`}
                            alt={bike.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '6px'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '6px'
                          }}>
                            <img src="/revani-logo.png" alt="Revani Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                          </div>
                        )}
                      </div>

                      {/* Compact Bike Info */}
                      <div>
                        <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                          {bike.name}
                        </h3>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '500' }}>
                            {bike.year} {bike.brand} {bike.model}
                          </span>
                          <span style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                            color: '#8b5cf6',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '3px',
                            fontSize: '0.625rem',
                            fontWeight: '600',
                            marginLeft: '0.5rem'
                          }}>
                            {bike.status}
                          </span>
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          VIN: {bike.vin.slice(0, 8)}...
                        </div>
                        <div style={{ 
                          borderTop: '1px solid rgba(139, 92, 246, 0.2)',
                          paddingTop: '0.5rem',
                          color: '#8b5cf6',
                          fontSize: '0.625rem'
                        }}>
                          Assigned: {new Date(bike.assignedMechanic.assignedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Middle Column - Parts Needed & Services Required */}
          <div style={{ flex: 1, minWidth: '400px' }}>
            {selectedBike ? (
              <>
                {/* Parts Needed Section */}
                <div className="kpi-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                  <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <WrenchScrewdriverIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                    Parts Needed - {selectedBike.name}
                  </h2>
                  
                  {partsNeeded.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '2rem', 
                      color: '#9ca3af' 
                    }}>
                      <WrenchScrewdriverIcon style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.875rem' }}>No parts currently needed</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {partsNeeded.map((part) => (
                        <div
                          key={part._id}
                          style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '8px',
                            padding: '1rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div>
                              <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                {part.name}
                              </h3>
                              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                Part #: {part.partNumber}
                              </p>
                              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                                Qty: {part.quantity} | ${part.estimatedCost.toFixed(2)}
                              </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                background: `${getPartStatusColor(part.status)}20`,
                                color: getPartStatusColor(part.status),
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                display: 'block'
                              }}>
                                {part.status}
                              </span>
                              <span style={{
                                background: `${getPriorityColor(part.priority)}20`,
                                color: getPriorityColor(part.priority),
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}>
                                {part.priority}
                              </span>
                            </div>
                          </div>
                          {part.supplier && (
                            <p style={{ color: '#8b5cf6', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                              Supplier: {part.supplier}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Services Required Section */}
                <div className="kpi-card" style={{ padding: '1.5rem' }}>
                  <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ClipboardDocumentListIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                    Services Required - {selectedBike.name}
                  </h2>
                  
                  {servicesRequired.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '2rem', 
                      color: '#9ca3af' 
                    }}>
                      <ClipboardDocumentListIcon style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.875rem' }}>No services currently required</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {servicesRequired.map((service) => (
                        <div
                          key={service._id}
                          style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '8px',
                            padding: '1rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div>
                              <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                {service.title}
                              </h3>
                              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                {service.description}
                              </p>
                              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                                Est. Hours: {service.estimatedHours}
                              </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                background: `${getCategoryColor(service.category)}20`,
                                color: getCategoryColor(service.category),
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                display: 'block'
                              }}>
                                {service.category}
                              </span>
                              <span style={{
                                background: `${getStatusColor(service.status)}20`,
                                color: getStatusColor(service.status),
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                display: 'block'
                              }}>
                                {service.status}
                              </span>
                              <span style={{
                                background: `${getPriorityColor(service.priority)}20`,
                                color: getPriorityColor(service.priority),
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}>
                                {service.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="kpi-card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ color: '#9ca3af' }}>
                  <ClipboardDocumentListIcon style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Select a bike to view</p>
                  <p style={{ fontSize: '0.875rem' }}>Parts needed and services required</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Timer */}
          <div style={{ width: '300px', flexShrink: 0 }}>
            <div className="kpi-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <ClockIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                Job Timer
              </h2>
              
              {currentJobBike ? (
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ color: '#8b5cf6', fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      {currentJobBike.name}
                    </h3>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                      {currentJobBike.year} {currentJobBike.brand} {currentJobBike.model}
                    </p>
                  </div>
                  
                  {/* Clock Face */}
                  <div style={{ 
                    width: '200px',
                    height: '200px',
                    margin: '0 auto 1.5rem',
                    position: 'relative',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                    borderRadius: '50%',
                    border: '3px solid rgba(139, 92, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.2), inset 0 0 20px rgba(139, 92, 246, 0.1)'
                  }}>
                    {/* Clock Numbers */}
                    <div style={{ position: 'absolute', top: '10px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', fontWeight: '600' }}>12</div>
                    <div style={{ position: 'absolute', right: '10px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', fontWeight: '600' }}>3</div>
                    <div style={{ position: 'absolute', bottom: '10px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', fontWeight: '600' }}>6</div>
                    <div style={{ position: 'absolute', left: '10px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', fontWeight: '600' }}>9</div>
                    
                    {/* Center Dot */}
                    <div style={{
                      position: 'absolute',
                      width: '8px',
                      height: '8px',
                      background: isTimerRunning ? '#22c55e' : '#f59e0b',
                      borderRadius: '50%',
                      zIndex: 10
                    }} />
                    
                    {/* Clock Hands - Simple representation */}
                    <div style={{
                      position: 'absolute',
                      width: '2px',
                      height: '60px',
                      background: isTimerRunning ? '#22c55e' : '#f59e0b',
                      transformOrigin: 'bottom center',
                      transform: `rotate(${(elapsedTime / 60) * 6}deg)`,
                      borderRadius: '1px',
                      transition: 'transform 1s ease-in-out'
                    }} />
                    
                    {/* Status Indicator */}
                    <div style={{
                      position: 'absolute',
                      bottom: '30px',
                      background: isTimerRunning ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      border: `1px solid ${isTimerRunning ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                      borderRadius: '12px',
                      padding: '0.25rem 0.75rem',
                      color: isTimerRunning ? '#22c55e' : '#f59e0b',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {isTimerRunning ? '●' : '⏸'} {isTimerRunning ? 'ACTIVE' : 'PAUSED'}
                    </div>
                  </div>
                  
                  {/* Digital Time Display */}
                  <div style={{ 
                    background: 'rgba(30, 41, 59, 0.8)', 
                    borderRadius: '12px', 
                    padding: '1rem', 
                    marginBottom: '1.5rem',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      color: '#ffffff', 
                      fontSize: '2rem', 
                      fontWeight: '700',
                      fontFamily: 'monospace',
                      letterSpacing: '0.1em',
                      textShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
                    }}>
                      {formatTime(elapsedTime)}
                    </div>
                    <div style={{ 
                      color: '#9ca3af', 
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      marginTop: '0.25rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }}>
                      Hours : Minutes : Seconds
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    {isTimerRunning ? (
                      <button
                        onClick={pauseTimer}
                        style={{
                          background: 'rgba(245, 158, 11, 0.2)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '6px',
                          color: '#f59e0b',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(245, 158, 11, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)';
                        }}
                      >
                        <PauseIcon style={{ width: '1rem', height: '1rem' }} />
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={resumeTimer}
                        style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: '6px',
                          color: '#22c55e',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                        }}
                      >
                        <PlayIcon style={{ width: '1rem', height: '1rem' }} />
                        Resume
                      </button>
                    )}
                    
                    <button
                      onClick={stopTimer}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        color: '#ef4444',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                      }}
                    >
                      <StopIcon style={{ width: '1rem', height: '1rem' }} />
                      Stop
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  {/* Empty Clock Face */}
                  <div style={{ 
                    width: '200px',
                    height: '200px',
                    margin: '0 auto 1.5rem',
                    position: 'relative',
                    background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(75, 85, 99, 0.1) 100%)',
                    borderRadius: '50%',
                    border: '3px solid rgba(107, 114, 128, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(107, 114, 128, 0.1), inset 0 0 20px rgba(107, 114, 128, 0.05)'
                  }}>
                    {/* Clock Numbers */}
                    <div style={{ position: 'absolute', top: '10px', color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.875rem', fontWeight: '600' }}>12</div>
                    <div style={{ position: 'absolute', right: '10px', color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.875rem', fontWeight: '600' }}>3</div>
                    <div style={{ position: 'absolute', bottom: '10px', color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.875rem', fontWeight: '600' }}>6</div>
                    <div style={{ position: 'absolute', left: '10px', color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.875rem', fontWeight: '600' }}>9</div>
                    
                    {/* Center Dot */}
                    <div style={{
                      position: 'absolute',
                      width: '8px',
                      height: '8px',
                      background: '#6b7280',
                      borderRadius: '50%',
                      zIndex: 10
                    }} />
                    
                    {/* Clock Hands - At 12:00 position */}
                    <div style={{
                      position: 'absolute',
                      width: '2px',
                      height: '60px',
                      background: '#6b7280',
                      transformOrigin: 'bottom center',
                      transform: 'rotate(0deg)',
                      borderRadius: '1px'
                    }} />
                    <div style={{
                      position: 'absolute',
                      width: '1px',
                      height: '40px',
                      background: '#6b7280',
                      transformOrigin: 'bottom center',
                      transform: 'rotate(0deg)',
                      borderRadius: '1px'
                    }} />
                    
                    {/* Status Indicator */}
                    <div style={{
                      position: 'absolute',
                      bottom: '30px',
                      background: 'rgba(107, 114, 128, 0.2)',
                      border: '1px solid rgba(107, 114, 128, 0.4)',
                      borderRadius: '12px',
                      padding: '0.25rem 0.75rem',
                      color: '#6b7280',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      ○ READY
                    </div>
                  </div>
                  
                  {/* Digital Time Display - Starting at 00:00:00 */}
                  <div style={{ 
                    background: 'rgba(30, 41, 59, 0.8)', 
                    borderRadius: '12px', 
                    padding: '1rem', 
                    marginBottom: '1.5rem',
                    border: '1px solid rgba(107, 114, 128, 0.2)',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      color: '#9ca3af', 
                      fontSize: '2rem', 
                      fontWeight: '700',
                      fontFamily: 'monospace',
                      letterSpacing: '0.1em'
                    }}>
                      00:00:00
                    </div>
                    <div style={{ 
                      color: '#6b7280', 
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      marginTop: '0.25rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }}>
                      Hours : Minutes : Seconds
                    </div>
                  </div>
                  
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
