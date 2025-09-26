import React, { useState, useEffect } from 'react';
import { useAlertDialog } from '../contexts/AlertDialogContext';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../hooks/useModal';
import AddClientModal from '../components/modals/AddClientModal';
import EditClientModal from '../components/modals/EditClientModal';
import ClientTable from '../components/tables/ClientTable';
import ClientSearchFilters from '../components/filters/ClientSearchFilters';
import { Pagination } from '../components/pagination';
import { clientService, type Client, type ClientStats } from '../services/clientService';


const ClientProfile: React.FC = () => {
  const { showDanger } = useAlertDialog();
  const { showSuccess, showError } = useToast();
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentFilters, setCurrentFilters] = useState<any>({});
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

  const loadClients = async (page: number = currentPage, perPage: number = itemsPerPage, isPagination: boolean = false) => {
    try {
      // Set loading state based on whether this is pagination or initial load
      if (isPagination) {
        setIsLoading(true);
      } else {
        setIsInitialLoading(true);
      }
      
      const response = await clientService.getClients({
        per_page: perPage,
        page: page
      });
      
      const clientsData = response.data.data || [];
      setFilteredClients(clientsData);
      setTotalPages(response.data.last_page || 1);
      setTotalItems(response.data.total || 0);
      setCurrentPage(response.data.current_page || 1);
    } catch (error) {
      console.error('Error loading clients:', error);
      showError('Error', 'Failed to load clients. Please try again.');
    } finally {
      if (isPagination) {
        setIsLoading(false);
      } else {
        setIsInitialLoading(false);
      }
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

  const loadClientsWithFilters = async (page: number = currentPage, perPage: number = itemsPerPage, filters: any = currentFilters, isPagination: boolean = false) => {
    // Set loading state based on whether this is pagination or search/filter
    if (isPagination) {
      setIsLoading(true);
    } else {
      setIsInitialLoading(true);
    }
    
    try {
      const response = await clientService.getClients({
        search: filters.search,
        status: filters.status,
        per_page: perPage,
        page: page,
        // Add additional filters for API
        sex: filters.sex,
        place: filters.place,
        civil_status: filters.civil_status,
        sort_by: filters.sort_by
      });
      
      const clientsData = response.data.data || [];
      setFilteredClients(clientsData);
      setTotalPages(response.data.last_page || 1);
      setTotalItems(response.data.total || 0);
      setCurrentPage(response.data.current_page || 1);
    } catch (error) {
      console.error('Error loading clients:', error);
      showError('Error', 'Failed to load clients. Please try again.');
    } finally {
      if (isPagination) {
        setIsLoading(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  };

  const handleSearch = async (filters: any) => {
    // Store current filters
    setCurrentFilters(filters);
    
    // Update items per page if changed and reset to page 1
    if (filters.per_page && filters.per_page !== itemsPerPage) {
      setItemsPerPage(filters.per_page);
      setCurrentPage(1);
      await loadClientsWithFilters(1, filters.per_page, filters);
    } else {
      await loadClientsWithFilters(currentPage, itemsPerPage, filters);
    }
  };

  const handleClearFilters = () => {
    setCurrentFilters({});
    setCurrentPage(1);
    setItemsPerPage(10); // Reset to default
    loadClients(1, 10);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Use the current filters to maintain search state
    loadClientsWithFilters(page, itemsPerPage, currentFilters, true); // true indicates this is pagination
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
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleClientUpdated = () => {
    // Refresh the clients list
    loadClients();
    setEditingClient(null);
    setIsEditModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setEditingClient(null);
    setIsEditModalOpen(false);
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
        isInitialLoading={isInitialLoading}
        onEditClient={handleEditClient}
        onDeleteClient={handleDeleteClient}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={addClientModal.isOpen}
        onClose={addClientModal.close}
        onSuccess={handleAddClientSuccess}
      />

      {/* Edit Client Modal */}
      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        client={editingClient}
        onSuccess={handleClientUpdated}
      />
    </div>
  );
};

export default ClientProfile;
