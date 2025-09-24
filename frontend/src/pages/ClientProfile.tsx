import React, { useState, useEffect } from 'react';
import { useAlertDialog } from '../contexts/AlertDialogContext';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../hooks/useModal';
import AddClientModal from '../components/modals/AddClientModal';
import ClientTable from '../components/tables/ClientTable';
import { clientService, type Client, type ClientStats } from '../services/clientService';


const ClientProfile: React.FC = () => {
  const { showDanger } = useAlertDialog();
  const { showSuccess } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('name');
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    total_clients: 0,
    verified_clients: 0,
    unverified_clients: 0,
    ofw_clients: 0,
    trashed_clients: 0
  });
  const addClientModal = useModal();

  // Load clients and stats on component mount
  useEffect(() => {
    loadClients();
    loadStats();
  }, []);

  // Load clients when search or filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadClients();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const response = await clientService.getClients({
        search: searchTerm,
        status: statusFilter === 'All' ? undefined : statusFilter,
        per_page: 50
      });
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await clientService.getClientStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };


  // Since API handles filtering, we just need to sort the clients
  const sortedClients = [...clients].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.first_name.localeCompare(b.first_name);
      case 'company':
        return a.city.localeCompare(b.city);
      case 'joinDate':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'totalRecords':
        return b.id - a.id; // Using ID as a proxy for records
      default:
        return 0;
    }
  });


  const handleDeleteClient = async (client: Client) => {
    const fullName = `${client.first_name} ${client.middle_name ? client.middle_name + ' ' : ''}${client.last_name}${client.suffix ? ' ' + client.suffix : ''}`;
    const confirmed = await showDanger({
      title: 'Delete Client',
      message: `Are you sure you want to delete ${fullName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      try {
        setIsLoading(true);
        await clientService.deleteClient(client.id);
        showSuccess('Success!', `${fullName} has been deleted successfully.`);
        loadClients();
        loadStats();
      } catch (error: any) {
        console.error('Error deleting client:', error);
        const errorMessage = error.response?.data?.message || 'Failed to delete client. Please try again.';
        showSuccess('Error', errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditClient = (client: Client) => {
    const fullName = `${client.first_name} ${client.middle_name ? client.middle_name + ' ' : ''}${client.last_name}${client.suffix ? ' ' + client.suffix : ''}`;
    showSuccess('Info', `Edit functionality for ${fullName} will be implemented soon.`);
  };

  const handleAddClient = () => {
    addClientModal.open();
  };

  const handleAddClientSuccess = () => {
    loadClients();
    loadStats();
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="card-elevated p-3 sm:p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Client Profiles</h1>
            <p className="text-xs text-gray-600">Manage client information and their OFW records</p>
          </div>
          <button 
            onClick={handleAddClient}
            className="btn btn-primary flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Clients</p>
              <p className="text-lg font-bold text-gray-900">{stats.total_clients}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Verified Clients</p>
              <p className="text-lg font-bold text-gray-900">{stats.verified_clients}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Pending Verification</p>
              <p className="text-lg font-bold text-gray-900">{stats.unverified_clients}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">OFW Clients</p>
              <p className="text-lg font-bold text-gray-900">{stats.ofw_clients}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email, city, or province..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
              <svg className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="sm:w-40">
            <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select"
            >
              <option value="All">All Status</option>
              <option value="Active">Verified</option>
              <option value="Inactive">Unverified</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div className="sm:w-40">
            <label className="block text-xs font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select"
            >
              <option value="name">Name</option>
              <option value="company">City</option>
              <option value="joinDate">Created Date</option>
              <option value="totalRecords">ID</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <ClientTable
        clients={sortedClients}
        isLoading={isLoading}
        onEditClient={handleEditClient}
        onDeleteClient={handleDeleteClient}
      />

      {/* Empty State */}
      {sortedClients.length === 0 && (
        <div className="card p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
          <p className="mt-1 text-xs text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={addClientModal.isOpen}
        onClose={addClientModal.close}
        onSuccess={handleAddClientSuccess}
      />
    </div>
  );
};

export default ClientProfile;
