import React, { useState, useEffect } from 'react';
import { useAlertDialog } from '../contexts/AlertDialogContext';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../hooks/useModal';
import AddClientModal from '../components/modals/AddClientModal';
import ClientTable from '../components/tables/ClientTable';
import ClientSearchFilters from '../components/filters/ClientSearchFilters';
import { clientService, type Client, type ClientStats } from '../services/clientService';


const ClientProfile: React.FC = () => {
  const { showDanger } = useAlertDialog();
  const { showSuccess, showError } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const response = await clientService.getClients({
        per_page: 50
      });
      setClients(response.data.data || []);
      setFilteredClients(response.data.data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      showError('Error', 'Failed to load clients. Please try again.');
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

  const handleSearch = async (filters: any) => {
    setIsLoading(true);
    
    try {
      // Use the API service for search
      const response = await clientService.getClients({
        search: filters.search,
        status: filters.status,
        per_page: filters.per_page || 50,
        // Add additional filters for API
        sex: filters.sex,
        place: filters.place,
        civil_status: filters.civil_status,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order
      });
      setFilteredClients(response.data.data || []);
    } catch (error) {
      console.error('Error searching clients:', error);
      showError('Error', 'Failed to search clients. Please try again.');
      // Fallback to local filtering
      let filtered = [...clients];
      
      if (filters.search) {
        filtered = filtered.filter(client => 
          client.first_name.toLowerCase().includes(filters.search.toLowerCase()) ||
          client.last_name.toLowerCase().includes(filters.search.toLowerCase()) ||
          client.email.toLowerCase().includes(filters.search.toLowerCase()) ||
          client.city.toLowerCase().includes(filters.search.toLowerCase()) ||
          client.province.toLowerCase().includes(filters.search.toLowerCase()) ||
          client.barangay.toLowerCase().includes(filters.search.toLowerCase()) ||
          client.street.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.sex) {
        filtered = filtered.filter(client => client.sex === filters.sex);
      }

      if (filters.place) {
        filtered = filtered.filter(client => 
          client.city.toLowerCase().includes(filters.place.toLowerCase()) ||
          client.province.toLowerCase().includes(filters.place.toLowerCase()) ||
          client.barangay.toLowerCase().includes(filters.place.toLowerCase()) ||
          client.street.toLowerCase().includes(filters.place.toLowerCase())
        );
      }

      if (filters.civil_status) {
        filtered = filtered.filter(client => client.civil_status === filters.civil_status);
      }

      // Apply sorting
      if (filters.sort_by) {
        filtered.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (filters.sort_by) {
            case 'first_name':
              aValue = a.first_name;
              bValue = b.first_name;
              break;
            case 'last_name':
              aValue = a.last_name;
              bValue = b.last_name;
              break;
            case 'city':
              aValue = a.city;
              bValue = b.city;
              break;
            case 'province':
              aValue = a.province;
              bValue = b.province;
              break;
            case 'age':
              aValue = a.age;
              bValue = b.age;
              break;
            case 'created_at':
              aValue = new Date(a.created_at).getTime();
              bValue = new Date(b.created_at).getTime();
              break;
            default:
              return 0;
          }

          if (filters.sort_order === 'desc') {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          } else {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          }
        });
      }

      setFilteredClients(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilteredClients(clients);
  };




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
        
        // Update local state
        setClients(prev => prev.filter(c => c.id !== client.id));
        setFilteredClients(prev => prev.filter(c => c.id !== client.id));
        
        loadStats();
      } catch (error: any) {
        console.error('Error deleting client:', error);
        const errorMessage = error.response?.data?.message || 'Failed to delete client. Please try again.';
        showError('Error', errorMessage);
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
      <ClientSearchFilters 
        onSearch={handleSearch}
        onClear={handleClearFilters}
        isLoading={isLoading}
      />

      {/* Clients Table */}
      <ClientTable
        clients={filteredClients}
        isLoading={isLoading}
        onEditClient={handleEditClient}
        onDeleteClient={handleDeleteClient}
      />

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
