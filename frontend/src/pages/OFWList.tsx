import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../hooks/useModal';
import type { OFW, SearchFilters as SearchFiltersType } from '../types/ofw';
import OFWTable from '../components/tables/OFWTable';
import SearchFilters from '../components/filters/SearchFilters';
import EditOFWModal from '../components/modals/EditOFWModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import ofwService from '../services/OFWService';

const OFWList: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [filteredRecords, setFilteredRecords] = useState<OFW[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [editingOFW, setEditingOFW] = useState<OFW | null>(null);
  const [deletingOFW, setDeletingOFW] = useState<OFW | null>(null);
  const editModal = useModal();
  const deleteModal = useModal();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentFilters, setCurrentFilters] = useState<SearchFiltersType>({});

  // Load OFW records on component mount
  useEffect(() => {
    loadOFWRecords();
  }, []);

  const loadOFWRecords = async (page: number = 1, filters?: SearchFiltersType, isPagination: boolean = false) => {
    // Set loading state based on whether this is pagination or initial load
    if (isPagination) {
      setIsLoading(true);
    } else {
      setIsInitialLoading(true);
    }
    
    try {
      const searchParams = {
        ...filters,
        page,
        per_page: filters?.per_page || itemsPerPage
      };
      
      const response = await ofwService.getOFWRecords(searchParams);
      
      // Handle paginated response
      setFilteredRecords(response.data);
      setCurrentPage(response.current_page);
      setTotalPages(response.last_page);
      setTotalItems(response.total);
    } catch (error) {
      console.error('Error loading OFW records:', error);
      showError('Error', 'Failed to load OFW records. Please try again.');
      // Fallback to mock data for demonstration
      setFilteredRecords(mockData);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalItems(mockData.length);
    } finally {
      if (isPagination) {
        setIsLoading(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  };

  // Mock data for demonstration (fallback)
  const mockData: OFW[] = [
    {
      id: 1,
      nameOfWorker: 'Juan Dela Cruz',
      sex: 'Male',
      position: 'Engineer',
      address: 'Cagayan de Oro City, Misamis Oriental',
      employer: 'Saudi Aramco',
      countryDestination: 'Saudi Arabia',
      oecNumber: 'OEC-2024-001',
      departureDate: '2024-01-15',
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z'
    },
    {
      id: 2,
      nameOfWorker: 'Maria Santos',
      sex: 'Female',
      position: 'Nurse',
      address: 'Iligan City, Lanao del Norte',
      employer: 'Dubai Health Authority',
      countryDestination: 'United Arab Emirates',
      oecNumber: 'OEC-2024-002',
      departureDate: '2024-01-14',
      created_at: '2024-01-09T00:00:00Z',
      updated_at: '2024-01-09T00:00:00Z'
    },
    {
      id: 3,
      nameOfWorker: 'Pedro Rodriguez',
      sex: 'Male',
      position: 'IT Professional',
      address: 'Ozamiz City, Misamis Occidental',
      employer: 'Singapore Technologies',
      countryDestination: 'Singapore',
      oecNumber: 'OEC-2024-003',
      departureDate: '2024-01-13',
      created_at: '2024-01-08T00:00:00Z',
      updated_at: '2024-01-08T00:00:00Z'
    }
  ];


  const handleSearch = async (filters: SearchFiltersType) => {
    setCurrentPage(1); // Reset to first page when searching
    setCurrentFilters(filters); // Store current filters
    if (filters.per_page) {
      setItemsPerPage(filters.per_page);
    }
    await loadOFWRecords(1, filters);
  };

  const handleClearFilters = () => {
    setCurrentPage(1);
    setItemsPerPage(10);
    setCurrentFilters({});
    loadOFWRecords(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Preserve current filters when changing pages
    const filtersToUse = {
      ...currentFilters,
      per_page: itemsPerPage
    };
    loadOFWRecords(page, filtersToUse, true); // true indicates this is pagination
  };

  const handleEdit = (ofw: OFW) => {
    setEditingOFW(ofw);
    editModal.open();
  };

  const handleEditSuccess = () => {
    // Refresh data after successful edit
    loadOFWRecords();
  };

  const handleDelete = (ofw: OFW) => {
    setDeletingOFW(ofw);
    deleteModal.open();
  };

  const confirmDelete = async () => {
    if (!deletingOFW) return;

    try {
      setIsLoading(true);
      
      // Delete from API
      await ofwService.deleteOFWRecord(deletingOFW.id);
      
      // Update local state
      setFilteredRecords(prev => prev.filter(ofw => ofw.id !== deletingOFW.id));
      
      showSuccess('Success!', 'OFW record deleted successfully!');
      
      // Close modal
      deleteModal.close();
      setDeletingOFW(null);
    } catch (error) {
      console.error('Error deleting OFW record:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete OFW record. Please try again.';
      showError('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="card-elevated p-3 sm:p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 mb-1">OFW Records</h1>
            <p className="text-xs text-gray-600">Manage and track Overseas Filipino Workers</p>
          </div>
          {/* <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Add New OFW
          </button> */}
        </div>
      </div>

      {/* Search and Filters */}
      <SearchFilters 
        onSearch={handleSearch}
        onClear={handleClearFilters}
        isLoading={isLoading}
      />

      {/* OFW Table */}
      <OFWTable 
        data={filteredRecords}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        isInitialLoading={isInitialLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />

      {/* Edit Modal */}
      <EditOFWModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        ofwRecord={editingOFW}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={confirmDelete}
        title="Delete OFW Record"
        message={`Are you sure you want to delete the record for "${deletingOFW?.nameOfWorker}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isLoading}
      />
    </div>
  );
};

export default OFWList;
