'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../../dashboard.css';
import RevaniPortalHeader from '../../../../../../components/RevaniPortalHeader';
import {
  WrenchScrewdriverIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface BikeForService {
  _id: string;
  name: string;
  brand: string;
  model: string;
  year: string;
  vin: string;
  status: 'Servicing' | 'Assigned' | 'In Progress' | 'Completed';
  assignedMechanic?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dateReceived: string;
  estimatedCompletion?: string;
  serviceNotes: string;
  requiredServices: string[];
  requiredParts: PartToBuy[];
  createdAt: string;
  updatedAt: string;
}

interface PartToBuy {
  id: string;
  name: string;
  partNumber?: string;
  quantity: number;
  estimatedCost: number;
  supplier?: string;
  urgent: boolean;
  notes?: string;
}

interface DailyTask {
  id: string;
  bikeId: string;
  bikeName: string;
  mechanicId: string;
  mechanicName: string;
  taskDescription: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  estimatedHours: number;
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: string;
  notes?: string;
}

interface Mechanic {
  id: string;
  name: string;
  specialties: string[];
  currentWorkload: number; // hours assigned for today
  maxCapacity: number; // max hours per day
  status: 'Available' | 'Busy' | 'Unavailable';
}

export default function ServiceManagerPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [bikes, setBikes] = useState<BikeForService[]>([]);
  const [filteredBikes, setFilteredBikes] = useState<BikeForService[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [partsToBuy, setPartsToBuy] = useState<PartToBuy[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBike, setSelectedBike] = useState<BikeForService | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showPartsModal, setShowPartsModal] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (params?.companyId) {
      fetchCompanyData(params.companyId as string);
    }
  }, [session, router, params]);

  useEffect(() => {
    filterBikes();
  }, [bikes, searchTerm, statusFilter, priorityFilter]);

  const fetchCompanyData = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
        
        // Fetch bikes with "Servicing" status for service manager
        await fetchBikesForService(companyId);
        
        // Fetch real mechanics from user database
        await fetchMechanics();
        
        // Initialize other arrays (these would be populated from real APIs later)
        setDailyTasks([]);
        setPartsToBuy([]);
      } else if (response.status === 404) {
        router.push('/select');
      }
    } catch (error) {
      console.error('Failed to fetch company:', error);
      router.push('/select');
    } finally {
      setLoading(false);
    }
  };

  const fetchBikesForService = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/inventory/bikes`);
      if (response.ok) {
        const data = await response.json();
        // Filter bikes that have "Servicing" status
        const servicingBikes = data.bikes
          .filter((bike: any) => bike.status === 'Servicing')
          .map((bike: any) => ({
            _id: bike._id,
            name: bike.name,
            brand: bike.brand,
            model: bike.model,
            year: bike.year.toString(),
            vin: bike.vin || 'N/A',
            status: 'Servicing' as const,
            priority: 'Medium' as const, // Default priority, could be enhanced later
            dateReceived: bike.createdAt || new Date().toISOString(),
            serviceNotes: (() => {
              if (bike.notes) return bike.notes;
              
              const hasEvaluation = bike['Service Required']?.length > 0 || bike['Parts Requested']?.length > 0;
              if (hasEvaluation) {
                const serviceCount = bike['Service Required']?.length || 0;
                const partsCount = bike['Parts Requested']?.length || 0;
                const evaluatedBy = bike.evaluatedBy ? ` by ${bike.evaluatedBy}` : '';
                const evalDate = bike.evaluationDate ? ` on ${new Date(bike.evaluationDate).toLocaleDateString()}` : '';
                
                return `Evaluation completed${evaluatedBy}${evalDate} - ${serviceCount} services, ${partsCount} parts required`;
              }
              
              return 'No evaluation data available';
            })(),
            requiredServices: bike['Service Required'] || [],
            requiredParts: (bike['Parts Requested'] || []).map((part: any) => ({
              id: part.id || Math.random().toString(36),
              name: part.name || part.partName || 'Unknown Part',
              quantity: part.quantity || 1,
              estimatedCost: part.estimatedCost || part.cost || 0,
              urgent: part.urgent || false,
              supplier: part.supplier || 'TBD',
              notes: part.notes || ''
            })),
            createdAt: bike.createdAt,
            updatedAt: bike.updatedAt
          }));
        
        setBikes(servicingBikes);
        console.log(`Found ${servicingBikes.length} bikes with Servicing status`);
      }
    } catch (error) {
      console.error('Failed to fetch bikes for service:', error);
    }
  };

  const fetchMechanics = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        // Include all users, not just mechanics
        const allUsers = data.users;
        
        const mechanicsData: Mechanic[] = allUsers.map((user: any) => ({
          id: user._id,
          name: user.name,
          specialties: user.role === 'Mechanic' ? ['General Maintenance', 'Engine Repair'] : ['General Tasks'], // Different specialties based on role
          currentWorkload: 0, // No current workload - will be calculated from actual assigned bikes
          maxCapacity: 8, // Standard 8-hour workday
          status: 'Available' as 'Available' | 'Busy' | 'Unavailable' // All users start as available
        }));
        
        setMechanics(mechanicsData);
        console.log(`Loaded ${mechanicsData.length} users for assignment from user database`);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filterBikes = () => {
    let filtered = [...bikes];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(bike =>
        bike.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bike.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bike.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bike.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bike.assignedMechanic && bike.assignedMechanic.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(bike => bike.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'All') {
      filtered = filtered.filter(bike => bike.priority === priorityFilter);
    }

    // Sort by priority and date received
    filtered.sort((a, b) => {
      const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      return new Date(a.dateReceived).getTime() - new Date(b.dateReceived).getTime(); // Older first
    });

    setFilteredBikes(filtered);
  };

  const assignBikeToMechanic = (bikeId: string, mechanicId: string, mechanicName: string) => {
    setBikes(prev => prev.map(bike => 
      bike._id === bikeId 
        ? { ...bike, status: 'Assigned' as const, assignedMechanic: mechanicName }
        : bike
    ));
    setShowAssignModal(false);
    setSelectedBike(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#10b981';
      case 'In Progress': return '#3b82f6';
      case 'Assigned': return '#8b5cf6';
      case 'Servicing': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return '#dc2626';
      case 'High': return '#ea580c';
      case 'Medium': return '#d97706';
      case 'Low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };



  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
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
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: '3rem', 
            fontWeight: '700',
            margin: 0,
            background: 'transparent',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            Service Manager
          </h1>
        </div>

        {/* Filters and Search */}
        <div className="kpi-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr 1fr', 
            gap: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Search Bikes
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by bike, VIN, or mechanic..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
              >
                <option value="All">All Status</option>
                <option value="Servicing">Awaiting Assignment</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
              >
                <option value="All">All Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Task Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Service Management Statistics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr 1fr', 
          gap: '1.5rem', 
          marginBottom: '2rem'
        }}>
          <div className="kpi-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Bikes Awaiting Assignment
                </h3>
                <p style={{ color: 'white', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                  {bikes.filter(b => b.status === 'Servicing').length}
                </p>
              </div>
              <WrenchScrewdriverIcon style={{ width: '2.5rem', height: '2.5rem', color: '#f59e0b' }} />
            </div>
          </div>

          <div className="kpi-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Available Users
                </h3>
                <p style={{ color: 'white', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                  {mechanics.filter(m => m.status === 'Available').length}
                </p>
              </div>
              <UserIcon style={{ width: '2.5rem', height: '2.5rem', color: '#10b981' }} />
            </div>
          </div>

          <div className="kpi-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Today's Tasks
                </h3>
                <p style={{ color: 'white', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                  {dailyTasks.filter(t => t.dueDate === selectedDate).length}
                </p>
              </div>
              <CalendarIcon style={{ width: '2.5rem', height: '2.5rem', color: '#3b82f6' }} />
            </div>
          </div>

          <div className="kpi-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Urgent Parts Needed
                </h3>
                <p style={{ color: 'white', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                  {partsToBuy.filter(p => p.urgent).length}
                </p>
              </div>
              <XCircleIcon style={{ width: '2.5rem', height: '2.5rem', color: '#ef4444' }} />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* Bikes for Service Assignment */}
          <div className="kpi-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                Bikes for Service ({filteredBikes.length})
              </h2>
            </div>
            
            <div style={{ overflowY: 'auto', maxHeight: '600px' }}>
              {filteredBikes.map((bike, index) => (
                <div key={bike._id} style={{ 
                  padding: '1.5rem',
                  borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
                  background: index % 2 === 0 ? 'rgba(139, 92, 246, 0.05)' : 'transparent'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                          {bike.name}
                        </h3>
                        <span style={{
                          background: `${getStatusColor(bike.status)}20`,
                          color: getStatusColor(bike.status),
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {bike.status === 'Servicing' ? 'Awaiting Assignment' : bike.status}
                        </span>
                        <span style={{
                          background: `${getPriorityColor(bike.priority)}20`,
                          color: getPriorityColor(bike.priority),
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {bike.priority === 'Urgent' && <ExclamationTriangleIcon style={{ width: '0.75rem', height: '0.75rem' }} />}
                          {bike.priority}
                        </span>
                      </div>
                      
                      <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                        {bike.brand} {bike.model} ({bike.year}) • VIN: {bike.vin} • Received: {formatDate(bike.dateReceived)}
                        {bike.assignedMechanic && (
                          <span style={{ color: '#8b5cf6', marginLeft: '1rem' }}>
                            Assigned to: {bike.assignedMechanic}
                          </span>
                        )}
                      </div>
                      
                      <p style={{ color: '#e2e8f0', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                        {bike.serviceNotes}
                      </p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <h4 style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                            Required Services
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {bike.requiredServices.length > 0 ? (
                              bike.requiredServices.map((service, idx) => (
                                <span key={idx} style={{
                                  background: 'rgba(59, 130, 246, 0.2)',
                                  color: '#60a5fa',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem'
                                }}>
                                  {service}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: '#6b7280', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                No services specified
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                            Parts Needed
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {bike.requiredParts.length > 0 ? (
                              bike.requiredParts.map((part) => (
                                <span key={part.id} style={{
                                  background: part.urgent ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                  color: part.urgent ? '#f87171' : '#fbbf24',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  {part.urgent && <ExclamationTriangleIcon style={{ width: '0.75rem', height: '0.75rem' }} />}
                                  {part.name} (${part.estimatedCost})
                                </span>
                              ))
                            ) : (
                              <span style={{ color: '#6b7280', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                No parts required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                      {bike.status === 'Servicing' && (
                        <button
                          onClick={() => {
                            setSelectedBike(bike);
                            setShowAssignModal(true);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Assign Mechanic
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/dashboard/${company.slug}/inventory/bikes/${bike._id}`)}
                        style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '6px',
                          color: '#3b82f6',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredBikes.length === 0 && (
                <div style={{ 
                  padding: '3rem', 
                  textAlign: 'center', 
                  color: '#9ca3af',
                  fontSize: '0.875rem'
                }}>
                  No bikes found matching your criteria.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar with Mechanics and Tasks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* User Status */}
            <div className="kpi-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                User Status
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mechanics.map((mechanic) => (
                  <div key={mechanic.id} style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '8px',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600', margin: 0 }}>
                        {mechanic.name}
                      </h4>
                      <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                        {mechanic.currentWorkload} bikes assigned
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Tasks */}
            <div className="kpi-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                Today's Tasks
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {dailyTasks.filter(task => task.dueDate === selectedDate).map((task) => (
                  <div key={task.id} style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '8px',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600', margin: 0, flex: 1 }}>
                        {task.taskDescription}
                      </h4>
                      <span style={{
                        background: `${getPriorityColor(task.priority)}20`,
                        color: getPriorityColor(task.priority),
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        marginLeft: '0.5rem'
                      }}>
                        {task.priority}
                      </span>
                    </div>
                    
                    <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                      {task.bikeName} • {task.mechanicName} • {task.estimatedHours}h
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        background: task.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' :
                                   task.status === 'In Progress' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: task.status === 'Completed' ? '#10b981' :
                               task.status === 'In Progress' ? '#3b82f6' : '#f59e0b',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {task.status}
                      </span>
                      
                      {task.notes && (
                        <span style={{ color: '#9ca3af', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          {task.notes}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {dailyTasks.filter(task => task.dueDate === selectedDate).length === 0 && (
                  <div style={{ 
                    padding: '2rem', 
                    textAlign: 'center', 
                    color: '#9ca3af',
                    fontSize: '0.875rem'
                  }}>
                    No tasks scheduled for this date.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Modal */}
        {showAssignModal && selectedBike && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'rgba(30, 41, 59, 0.95)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                Assign Mechanic to {selectedBike.name}
              </h3>
              
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {selectedBike.brand} {selectedBike.model} ({selectedBike.year})
                </div>
                <div style={{ color: '#e2e8f0', fontSize: '0.875rem', lineHeight: '1.4' }}>
                  {selectedBike.serviceNotes}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {mechanics.map((mechanic) => (
                  <button
                    key={mechanic.id}
                    onClick={() => assignBikeToMechanic(selectedBike._id, mechanic.id, mechanic.name)}
                    style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      padding: '1rem',
                      color: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                        {mechanic.name}
                      </h4>
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                        {mechanic.currentWorkload}h / {mechanic.maxCapacity}h
                      </span>
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                      Specialties: {mechanic.specialties.join(', ')}
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedBike(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: '#8b5cf6',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
