'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import '../dashboard.css';
import RevaniPortalHeader from '../../../../../components/RevaniPortalHeader';
import {
  UserIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface Company {
  _id: string;
  slug: string;
  name: string;
  type: 'dealership' | 'software' | 'holding';
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Mechanic' | 'Sales' | 'Viewer';
  companyAccess: string[]; // Array of company slugs
  permissions: {
    // Main Dashboard Access
    dashboard: boolean;
    
    // Inventory Section (inventory auto-calculated from sub-pages)
    bikeInventory: boolean;
    partsInventory: boolean;
    accessoriesInventory: boolean;
    
    // Service Center Section (serviceCenter auto-calculated from sub-pages)
    evaluation: boolean;
    serviceManager: boolean;
    
    // Financial Section (financial auto-calculated from sub-pages)
    financialDashboard: boolean;
    transactions: boolean;
    
    // Tools Section (tools auto-calculated from sub-pages)
    massImport: boolean;
    vinRunner: boolean;
    
    // Archives Section (archives auto-calculated from sub-pages)
    soldBikes: boolean;
    
    // Other Pages
    cms: boolean;
    users: boolean;
    media: boolean;
    profile: boolean;
  };
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function UserManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Viewer' as User['role'],
    companyAccess: [] as string[],
    permissions: {
      // Main Dashboard Access
      dashboard: false,
      
      // Inventory Section (inventory auto-calculated from sub-pages)
      bikeInventory: false,
      partsInventory: false,
      accessoriesInventory: false,
      
      // Service Center Section (serviceCenter auto-calculated from sub-pages)
      evaluation: false,
      serviceManager: false,
      
      // Financial Section (financial auto-calculated from sub-pages)
      financialDashboard: false,
      transactions: false,
      
      // Tools Section (tools auto-calculated from sub-pages)
      massImport: false,
      vinRunner: false,
      
      // Archives Section (archives auto-calculated from sub-pages)
      soldBikes: false,
      
      // Other Pages
      cms: false,
      users: false,
      media: false,
      profile: false
    }
  });

  const [editUser, setEditUser] = useState({
    _id: '',
    name: '',
    email: '',
    password: '',
    role: 'Viewer' as User['role'],
    companyAccess: [] as string[],
    permissions: {
      // Main Dashboard Access
      dashboard: false,
      
      // Inventory Section (inventory auto-calculated from sub-pages)
      bikeInventory: false,
      partsInventory: false,
      accessoriesInventory: false,
      
      // Service Center Section (serviceCenter auto-calculated from sub-pages)
      evaluation: false,
      serviceManager: false,
      
      // Financial Section (financial auto-calculated from sub-pages)
      financialDashboard: false,
      transactions: false,
      
      // Tools Section (tools auto-calculated from sub-pages)
      massImport: false,
      vinRunner: false,
      
      // Archives Section (archives auto-calculated from sub-pages)
      soldBikes: false,
      
      // Other Pages
      cms: false,
      users: false,
      media: false,
      profile: false
    }
  });

  // Full access helper functions
  const getFullPermissions = () => ({
    dashboard: true,
    bikeInventory: true,
    partsInventory: true,
    accessoriesInventory: true,
    evaluation: true,
    serviceManager: true,
    financialDashboard: true,
    transactions: true,
    massImport: true,
    vinRunner: true,
    soldBikes: true,
    cms: true,
    users: true,
    media: true,
    profile: true
  });

  const getAllCompanyAccess = () => companies.map(company => company.slug);

  const isFullAccess = (user: any) => {
    const fullPermissions = getFullPermissions();
    const allCompanies = getAllCompanyAccess();
    
    // Check if all permissions are true
    const hasAllPermissions = Object.keys(fullPermissions).every(
      key => user.permissions[key] === true
    );
    
    // Check if has access to all companies
    const hasAllCompanies = allCompanies.every(
      slug => user.companyAccess.includes(slug)
    );
    
    return hasAllPermissions && hasAllCompanies;
  };

  const toggleFullAccess = (user: any, setUser: any, isChecked: boolean) => {
    if (isChecked) {
      setUser((prev: any) => ({
        ...prev,
        permissions: getFullPermissions(),
        companyAccess: getAllCompanyAccess()
      }));
    } else {
      setUser((prev: any) => ({
        ...prev,
        permissions: {
          dashboard: false,
          bikeInventory: false,
          partsInventory: false,
          accessoriesInventory: false,
          evaluation: false,
          serviceManager: false,
          financialDashboard: false,
          transactions: false,
          massImport: false,
          vinRunner: false,
          soldBikes: false,
          cms: false,
          users: false,
          media: false,
          profile: false
        },
        companyAccess: []
      }));
    }
  };

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
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const fetchCompanyData = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
        
        // Fetch real users from database and companies list
        await Promise.all([fetchUsers(), fetchCompanies()]);
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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        // Map the real user data to our User interface format
        const mappedUsers = data.users.map((user: any) => ({
          _id: user._id,
          name: user.name || 'Unknown User',
          email: user.email,
          role: user.role || 'Viewer',
          companyAccess: user.companyAccess || [],
          permissions: user.permissions || {
            // Main Dashboard Access
            dashboard: false,
            
            // Inventory Section (inventory auto-calculated from sub-pages)
            bikeInventory: false,
            partsInventory: false,
            accessoriesInventory: false,
            
            // Service Center Section (serviceCenter auto-calculated from sub-pages)
            evaluation: false,
            serviceManager: false,
            
            // Financial Section (financial auto-calculated from sub-pages)
            financialDashboard: false,
            transactions: false,
            
            // Tools Section (tools auto-calculated from sub-pages)
            massImport: false,
            vinRunner: false,
            
            // Archives Section (archives auto-calculated from sub-pages)
            soldBikes: false,
            
            // Other Pages
            cms: false,
            users: false,
            media: false,
            profile: false
          },
          status: user.status || 'Active',
          lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }));
        setUsers(mappedUsers);
        console.log(`Loaded ${mappedUsers.length} users from database`);
      } else {
        console.error('Failed to fetch users');
        // Fall back to empty array instead of mock data
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fall back to empty array instead of mock data
      setUsers([]);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'All') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return '#dc2626';
      case 'Manager': return '#ea580c';
      case 'Mechanic': return '#3b82f6';
      case 'Sales': return '#10b981';
      case 'Viewer': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#10b981';
      case 'Inactive': return '#6b7280';
      case 'Suspended': return '#dc2626';
      default: return '#6b7280';
    }
  };



  const formatDate = (dateInput: string | Date) => {
    if (!dateInput) return 'Never';
    
    const date = new Date(dateInput);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // Show relative time for recent logins
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      // Show full date for older logins
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Helper function to calculate main dropdown permissions
  const calculateMainPermissions = (permissions: any) => {
    return {
      ...permissions,
      // Auto-calculate main dropdown permissions based on sub-pages
      inventory: permissions.bikeInventory || permissions.partsInventory || permissions.accessoriesInventory,
      serviceCenter: permissions.evaluation || permissions.serviceManager,
      financial: permissions.financialDashboard || permissions.transactions,
      tools: permissions.massImport || permissions.vinRunner,
      archives: permissions.soldBikes
    };
  };

  const handleAddUser = async () => {
    try {
      // Calculate main permissions before sending
      const userWithCalculatedPermissions = {
        ...newUser,
        permissions: calculateMainPermissions(newUser.permissions),
        status: 'Active'
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userWithCalculatedPermissions),
      });

      if (response.ok) {
        // Refresh users list from database
        await fetchUsers();
        setShowAddModal(false);
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'Viewer',
          companyAccess: [],
          permissions: {
            // Main Dashboard Access
            dashboard: false,
            
            // Inventory Section (inventory auto-calculated from sub-pages)
            bikeInventory: false,
            partsInventory: false,
            accessoriesInventory: false,
            
            // Service Center Section (serviceCenter auto-calculated from sub-pages)
            evaluation: false,
            serviceManager: false,
            
            // Financial Section (financial auto-calculated from sub-pages)
            financialDashboard: false,
            transactions: false,
            
            // Tools Section (tools auto-calculated from sub-pages)
            massImport: false,
            vinRunner: false,
            
            // Archives Section (archives auto-calculated from sub-pages)
            soldBikes: false,
            
            // Other Pages
            cms: false,
            users: false,
            media: false,
            profile: false
          }
        });
        console.log('✅ User created successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to create user:', errorData.error);
        alert('Failed to create user: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user. Please try again.');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      _id: user._id,
      name: user.name,
      email: user.email,
      password: '', // Leave empty for security - user can enter new password if they want to change it
      role: user.role,
      companyAccess: user.companyAccess || [],
      permissions: { ...user.permissions }
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      const response = await fetch(`/api/users/${editUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editUser.name,
          email: editUser.email,
          role: editUser.role,
          companyAccess: editUser.companyAccess,
          permissions: calculateMainPermissions(editUser.permissions),
          ...(editUser.password && { password: editUser.password }) // Only include password if it's provided
        }),
      });

      if (response.ok) {
        // Refresh users list from database
        await fetchUsers();
        setShowEditModal(false);
        setSelectedUser(null);
        console.log('✅ User updated successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to update user:', errorData.error);
        alert('Failed to update user: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user. Please try again.');
    }
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (selectedUser) {
      try {
        const response = await fetch(`/api/users/${selectedUser._id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Refresh users list from database
          await fetchUsers();
          setShowDeleteModal(false);
          setSelectedUser(null);
          console.log('✅ User deleted successfully');
        } else {
          const errorData = await response.json();
          console.error('Failed to delete user:', errorData.error);
          alert('Failed to delete user: ' + errorData.error);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
      }
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...user,
          permissions: calculateMainPermissions(user.permissions),
          status: newStatus
        }),
      });

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(u => 
          u._id === userId 
            ? { ...u, status: newStatus as User['status'] }
            : u
        ));
        console.log(`✅ User status updated to ${newStatus}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to update user status:', errorData.error);
        alert('Failed to update user status: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status. Please try again.');
    }
  };

  // Mock data for demonstration
  const mockUsersData: User[] = [
    {
      _id: '1',
      name: 'Admin User',
      email: 'admin@darkwater.local',
      role: 'Admin',
      accessLevel: 'Full Access',
      permissions: {
        inventory: true,
        financial: true,
        serviceCenter: true,
        users: true,
        reports: true,
        settings: true
      },
      status: 'Active',
      lastLogin: '2025-01-15T10:30:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2025-01-15T10:30:00Z'
    },
    {
      _id: '2',
      name: 'John Manager',
      email: 'john.manager@darkwater.local',
      role: 'Manager',
      accessLevel: 'Limited Access',
      permissions: {
        inventory: true,
        financial: true,
        serviceCenter: true,
        users: false,
        reports: true,
        settings: false
      },
      status: 'Active',
      lastLogin: '2025-01-14T16:45:00Z',
      createdAt: '2024-02-15T00:00:00Z',
      updatedAt: '2025-01-14T16:45:00Z'
    },
    {
      _id: '3',
      name: 'Mike Mechanic',
      email: 'mike.johnson@darkwater.local',
      role: 'Mechanic',
      accessLevel: 'Limited Access',
      permissions: {
        inventory: true,
        financial: false,
        serviceCenter: true,
        users: false,
        reports: false,
        settings: false
      },
      status: 'Active',
      lastLogin: '2025-01-15T08:15:00Z',
      createdAt: '2024-03-01T00:00:00Z',
      updatedAt: '2025-01-15T08:15:00Z'
    },
    {
      _id: '4',
      name: 'Sarah Sales',
      email: 'sarah.sales@darkwater.local',
      role: 'Sales',
      accessLevel: 'Limited Access',
      permissions: {
        inventory: true,
        financial: false,
        serviceCenter: false,
        users: false,
        reports: true,
        settings: false
      },
      status: 'Active',
      lastLogin: '2025-01-13T14:20:00Z',
      createdAt: '2024-04-10T00:00:00Z',
      updatedAt: '2025-01-13T14:20:00Z'
    },
    {
      _id: '5',
      name: 'Bob Viewer',
      email: 'bob.viewer@darkwater.local',
      role: 'Viewer',
      accessLevel: 'Read Only',
      permissions: {
        inventory: true,
        financial: false,
        serviceCenter: false,
        users: false,
        reports: true,
        settings: false
      },
      status: 'Inactive',
      lastLogin: '2024-12-20T11:30:00Z',
      createdAt: '2024-05-01T00:00:00Z',
      updatedAt: '2024-12-20T11:30:00Z'
    }
  ];

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
      <RevaniPortalHeader company={company} activePage="users" />
      
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
            User Management
          </h1>
        </div>

        {/* User Statistics */}
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
                  Total Users
                </h3>
                <p style={{ color: 'white', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                  {users.length}
                </p>
              </div>
              <UserGroupIcon style={{ width: '2.5rem', height: '2.5rem', color: '#8b5cf6' }} />
            </div>
          </div>

          <div className="kpi-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Active Users
                </h3>
                <p style={{ color: 'white', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                  {users.filter(u => u.status === 'Active').length}
                </p>
              </div>
              <UserIcon style={{ width: '2.5rem', height: '2.5rem', color: '#10b981' }} />
            </div>
          </div>

          <div className="kpi-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Admins
                </h3>
                <p style={{ color: 'white', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                  {users.filter(u => u.role === 'Admin').length}
                </p>
              </div>
              <ShieldCheckIcon style={{ width: '2.5rem', height: '2.5rem', color: '#dc2626' }} />
            </div>
          </div>

          <div className="kpi-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Mechanics
                </h3>
                <p style={{ color: 'white', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                  {users.filter(u => u.role === 'Mechanic').length}
                </p>
              </div>
              <CogIcon style={{ width: '2.5rem', height: '2.5rem', color: '#3b82f6' }} />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="kpi-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              Users ({filteredUsers.length})
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}
            >
              <PlusIcon style={{ width: '1rem', height: '1rem' }} />
              Add User
            </button>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr 1fr', 
            gap: '1rem'
          }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or role..."
              style={{
                padding: '0.75rem',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.875rem'
              }}
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '0.75rem',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.875rem'
              }}
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Mechanic">Mechanic</option>
              <option value="Sales">Sales</option>
              <option value="Viewer">Viewer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.75rem',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.875rem'
              }}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="kpi-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500' }}>
                    User
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500' }}>
                    Role
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500' }}>
                    Status
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500' }}>
                    Last Login
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500' }}>
                    Permissions
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user._id} style={{ 
                    borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
                    background: index % 2 === 0 ? 'rgba(139, 92, 246, 0.05)' : 'transparent'
                  }}>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500' }}>
                          {user.name}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: `${getRoleColor(user.role)}20`,
                        color: getRoleColor(user.role),
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          background: `${getStatusColor(user.status)}20`,
                          color: getStatusColor(user.status),
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {user.status}
                        </span>
                        <button
                          onClick={() => toggleUserStatus(user._id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#8b5cf6',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            textDecoration: 'underline'
                          }}
                        >
                          Toggle
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {Object.entries(user.permissions)
                          .filter(([_, hasPermission]) => hasPermission)
                          .map(([permission]) => (
                            <span key={permission} style={{
                              background: 'rgba(139, 92, 246, 0.2)',
                              color: '#8b5cf6',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.625rem',
                              fontWeight: '500'
                            }}>
                              {permission}
                            </span>
                          ))
                        }
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEditUser(user)}
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
                          <PencilIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                        </button>
                        {user.role !== 'Admin' && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              color: '#ef4444',
                              padding: '0.25rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <TrashIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div style={{ 
                padding: '3rem', 
                textAlign: 'center', 
                color: '#9ca3af',
                fontSize: '0.875rem'
              }}>
                No users found matching your criteria.
              </div>
            )}
          </div>
        </div>

        {/* Add User Modal */}
        {showAddModal && (
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
              maxWidth: '600px',
              width: '90%',
              backdropFilter: 'blur(10px)',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                Add New User
              </h3>
              
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
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
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
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
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Enter secure password"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      Role
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as User['role'] }))}
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
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Mechanic">Mechanic</option>
                      <option value="Sales">Sales</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>


                </div>

                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Company Access
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '2rem' }}>
                    {companies.map((company) => (
                      <label key={company.slug} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                        <input
                          type="checkbox"
                          checked={newUser.companyAccess.includes(company.slug)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser(prev => ({
                                ...prev,
                                companyAccess: [...prev.companyAccess, company.slug]
                              }));
                            } else {
                              setNewUser(prev => ({
                                ...prev,
                                companyAccess: prev.companyAccess.filter(slug => slug !== company.slug)
                              }));
                            }
                          }}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        <div>
                          <div style={{ fontWeight: '500' }}>{company.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            {company.type === 'dealership' && '🏎️ Dealership'}
                            {company.type === 'software' && '💻 Software'}
                            {company.type === 'holding' && '🏢 Holding'}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Revani Portal Access Permissions
                  </label>
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    
                    {/* Main Dashboard */}
                    <div>
                      <h4 style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', borderBottom: '1px solid rgba(139, 92, 246, 0.3)', paddingBottom: '0.25rem' }}>
                        📊 Dashboard
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', paddingLeft: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.permissions.dashboard}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, dashboard: e.target.checked }
                            }))}
                            style={{ accentColor: '#8b5cf6' }}
                          />
                          Main Dashboard
                        </label>
                      </div>
                    </div>

                    {/* Inventory Section */}
                    <div>
                      <h4 style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', borderBottom: '1px solid rgba(139, 92, 246, 0.3)', paddingBottom: '0.25rem' }}>
                        📦 Inventory
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', paddingLeft: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.permissions.bikeInventory}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, bikeInventory: e.target.checked }
                            }))}
                            style={{ accentColor: '#8b5cf6' }}
                          />
                          Bike Inventory
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.permissions.partsInventory}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, partsInventory: e.target.checked }
                            }))}
                            style={{ accentColor: '#8b5cf6' }}
                          />
                          Parts Inventory
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.permissions.accessoriesInventory}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, accessoriesInventory: e.target.checked }
                            }))}
                            style={{ accentColor: '#8b5cf6' }}
                          />
                          Accessories Inventory
                        </label>
                      </div>
                    </div>

                    {/* Service Center Section */}
                    <div>
                      <h4 style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', borderBottom: '1px solid rgba(139, 92, 246, 0.3)', paddingBottom: '0.25rem' }}>
                        🔧 Service Center
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', paddingLeft: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.permissions.evaluation}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, evaluation: e.target.checked }
                            }))}
                            style={{ accentColor: '#8b5cf6' }}
                          />
                          Evaluation
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.permissions.serviceManager}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, serviceManager: e.target.checked }
                            }))}
                            style={{ accentColor: '#8b5cf6' }}
                          />
                          Service Manager
                        </label>
                      </div>
                    </div>

                    {/* Financial Section */}
                    <div>
                      <h4 style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', borderBottom: '1px solid rgba(139, 92, 246, 0.3)', paddingBottom: '0.25rem' }}>
                        💰 Financial
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', paddingLeft: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.permissions.financialDashboard}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, financialDashboard: e.target.checked }
                            }))}
                            style={{ accentColor: '#8b5cf6' }}
                          />
                          Financial Dashboard
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.permissions.transactions}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, transactions: e.target.checked }
                            }))}
                            style={{ accentColor: '#8b5cf6' }}
                          />
                          Transactions
                        </label>
                      </div>
                    </div>

                    {/* Tools Section */}
                    <div>
                      <h4 style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', borderBottom: '1px solid rgba(139, 92, 246, 0.3)', paddingBottom: '0.25rem' }}>
                        🛠️ Tools
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', paddingLeft: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.permissions.massImport}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, massImport: e.target.checked }
                            }))}
                            style={{ accentColor: '#8b5cf6' }}
                          />
                          Mass Import
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.permissions.vinRunner}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, vinRunner: e.target.checked }
                            }))}
                            style={{ accentColor: '#8b5cf6' }}
                          />
                          VIN Runner
                        </label>
                      </div>
                    </div>

                    {/* Archives Section */}
                    <div>
                      <h4 style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', borderBottom: '1px solid rgba(139, 92, 246, 0.3)', paddingBottom: '0.25rem' }}>
                        📁 Archives
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', paddingLeft: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.permissions.soldBikes}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, soldBikes: e.target.checked }
                            }))}
                            style={{ accentColor: '#8b5cf6' }}
                          />
                          Sold Bikes
                        </label>
                      </div>
                    </div>

                    {/* Other Pages */}
                    <div>
                      <h4 style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', borderBottom: '1px solid rgba(139, 92, 246, 0.3)', paddingBottom: '0.25rem' }}>
                        🌐 Other Pages
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', paddingLeft: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.permissions.cms}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, cms: e.target.checked }
                            }))}
                            style={{ accentColor: '#8b5cf6' }}
                          />
                          CMS
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.permissions.users}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, users: e.target.checked }
                            }))}
                            style={{ accentColor: '#8b5cf6' }}
                          />
                          Users
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.permissions.media}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, media: e.target.checked }
                            }))}
                            style={{ accentColor: '#8b5cf6' }}
                          />
                          Media
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.permissions.profile}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, profile: e.target.checked }
                            }))}
                            style={{ accentColor: '#8b5cf6' }}
                          />
                          Profile
                        </label>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddModal(false)}
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
                <button
                  onClick={handleAddUser}
                  disabled={!newUser.name || !newUser.email}
                  style={{
                    background: newUser.name && newUser.email ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : '#6b7280',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: newUser.name && newUser.email ? 'pointer' : 'not-allowed'
                  }}
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
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
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <UserPlusIcon style={{ width: '2rem', height: '2rem', color: '#8b5cf6' }} />
                <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
                  Edit User
                </h3>
              </div>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={editUser.name}
                    onChange={(e) => setEditUser(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Enter user's full name"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={editUser.email}
                    onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={editUser.password}
                    onChange={(e) => setEditUser(prev => ({ ...prev, password: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Leave empty to keep current password"
                  />
                  <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem', fontStyle: 'italic' }}>
                    Only fill this field if you want to change the user's password
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Role
                  </label>
                  <select
                    value={editUser.role}
                    onChange={(e) => setEditUser(prev => ({ ...prev, role: e.target.value as User['role'] }))}
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
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Mechanic">Mechanic</option>
                    <option value="Sales">Sales</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Company Access
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '2rem' }}>
                    {companies.map((company) => (
                      <label key={company.slug} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.companyAccess.includes(company.slug)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditUser(prev => ({
                                ...prev,
                                companyAccess: [...prev.companyAccess, company.slug]
                              }));
                            } else {
                              setEditUser(prev => ({
                                ...prev,
                                companyAccess: prev.companyAccess.filter(slug => slug !== company.slug)
                              }));
                            }
                          }}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        <div>
                          <div style={{ fontWeight: '500' }}>{company.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            {company.type === 'dealership' && '🏎️ Dealership'}
                            {company.type === 'software' && '💻 Software'}
                            {company.type === 'holding' && '🏢 Holding'}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Revani Portal Access Permissions
                  </label>
                  
                  {/* Full Access Toggle */}
                  <div style={{ 
                    background: 'rgba(139, 92, 246, 0.1)', 
                    border: '1px solid rgba(139, 92, 246, 0.3)', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    marginBottom: '1.5rem' 
                  }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem', 
                      color: 'white', 
                      fontSize: '1rem', 
                      fontWeight: '600',
                      cursor: 'pointer' 
                    }}>
                      <input
                        type="checkbox"
                        checked={isFullAccess(editUser)}
                        onChange={(e) => toggleFullAccess(editUser, setEditUser, e.target.checked)}
                        style={{ 
                          accentColor: '#8b5cf6',
                          transform: 'scale(1.2)'
                        }}
                      />
                      <div>
                        <div style={{ color: '#8b5cf6', fontWeight: '700' }}>🔓 Full Access</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '400' }}>
                          Grant complete access to all companies and permissions
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div>
                      <h4 style={{ color: '#8b5cf6', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Dashboard</h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.permissions.dashboard}
                          onChange={(e) => setEditUser(prev => ({ ...prev, permissions: { ...prev.permissions, dashboard: e.target.checked } }))}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        Dashboard Access
                      </label>
                    </div>

                    <div>
                      <h4 style={{ color: '#8b5cf6', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Inventory</h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.permissions.bikeInventory}
                          onChange={(e) => setEditUser(prev => ({ ...prev, permissions: { ...prev.permissions, bikeInventory: e.target.checked } }))}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        Bike Inventory
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.permissions.partsInventory}
                          onChange={(e) => setEditUser(prev => ({ ...prev, permissions: { ...prev.permissions, partsInventory: e.target.checked } }))}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        Parts Inventory
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.permissions.accessoriesInventory}
                          onChange={(e) => setEditUser(prev => ({ ...prev, permissions: { ...prev.permissions, accessoriesInventory: e.target.checked } }))}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        Accessories Inventory
                      </label>
                    </div>

                    <div>
                      <h4 style={{ color: '#8b5cf6', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Service Center</h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.permissions.evaluation}
                          onChange={(e) => setEditUser(prev => ({ ...prev, permissions: { ...prev.permissions, evaluation: e.target.checked } }))}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        Evaluation
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.permissions.serviceManager}
                          onChange={(e) => setEditUser(prev => ({ ...prev, permissions: { ...prev.permissions, serviceManager: e.target.checked } }))}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        Service Manager
                      </label>
                    </div>

                    <div>
                      <h4 style={{ color: '#8b5cf6', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Financial</h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.permissions.financialDashboard}
                          onChange={(e) => setEditUser(prev => ({ ...prev, permissions: { ...prev.permissions, financialDashboard: e.target.checked } }))}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        Financial Dashboard
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.permissions.transactions}
                          onChange={(e) => setEditUser(prev => ({ ...prev, permissions: { ...prev.permissions, transactions: e.target.checked } }))}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        Transactions
                      </label>
                    </div>

                    <div>
                      <h4 style={{ color: '#8b5cf6', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Tools</h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.permissions.massImport}
                          onChange={(e) => setEditUser(prev => ({ ...prev, permissions: { ...prev.permissions, massImport: e.target.checked } }))}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        Mass Import
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.permissions.vinRunner}
                          onChange={(e) => setEditUser(prev => ({ ...prev, permissions: { ...prev.permissions, vinRunner: e.target.checked } }))}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        VIN Runner
                      </label>
                    </div>

                    <div>
                      <h4 style={{ color: '#8b5cf6', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Archives</h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.permissions.soldBikes}
                          onChange={(e) => setEditUser(prev => ({ ...prev, permissions: { ...prev.permissions, soldBikes: e.target.checked } }))}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        Sold Bikes
                      </label>
                    </div>

                    <div>
                      <h4 style={{ color: '#8b5cf6', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Other</h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.permissions.cms}
                          onChange={(e) => setEditUser(prev => ({ ...prev, permissions: { ...prev.permissions, cms: e.target.checked } }))}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        CMS
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.permissions.users}
                          onChange={(e) => setEditUser(prev => ({ ...prev, permissions: { ...prev.permissions, users: e.target.checked } }))}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        User Management
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.permissions.media}
                          onChange={(e) => setEditUser(prev => ({ ...prev, permissions: { ...prev.permissions, media: e.target.checked } }))}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        Media
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <input
                          type="checkbox"
                          checked={editUser.permissions.profile}
                          onChange={(e) => setEditUser(prev => ({ ...prev, permissions: { ...prev.permissions, profile: e.target.checked } }))}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        Profile
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button
                  onClick={() => setShowEditModal(false)}
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
                <button
                  onClick={handleUpdateUser}
                  disabled={!editUser.name || !editUser.email}
                  style={{
                    background: editUser.name && editUser.email ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : '#6b7280',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: editUser.name && editUser.email ? 'pointer' : 'not-allowed'
                  }}
                >
                  Update User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedUser && (
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
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <ExclamationTriangleIcon style={{ width: '2rem', height: '2rem', color: '#ef4444' }} />
                <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                  Delete User
                </h3>
              </div>
              
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '2rem' }}>
                Are you sure you want to delete <strong style={{ color: 'white' }}>{selectedUser.name}</strong>? 
                This action cannot be undone.
              </p>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
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
                <button
                  onClick={confirmDeleteUser}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
