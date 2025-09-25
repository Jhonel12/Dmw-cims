import React, { useState } from 'react';
import Select from 'react-select';

interface ClientSearchFilters {
  search: string;
  sex: string;
  place: string;
  civil_status: string;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  per_page: number;
  page: number;
}

interface ClientSearchFiltersProps {
  onSearch: (filters: ClientSearchFilters) => void;
  onClear: () => void;
  isLoading?: boolean;
}

const ClientSearchFilters: React.FC<ClientSearchFiltersProps> = ({ onSearch, onClear, isLoading = false }) => {
  const [filters, setFilters] = useState<ClientSearchFilters>({
    search: '',
    sex: '',
    place: '',
    civil_status: '',
    sort_by: '',
    sort_order: 'asc',
    per_page: 15,
    page: 1
  });

  const handleChange = (field: keyof ClientSearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({
      search: '',
      sex: '',
      place: '',
      civil_status: '',
      sort_by: '',
      sort_order: 'asc',
      per_page: 15,
      page: 1
    });
    onClear();
  };

  // Custom styles for react-select
  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '36px',
      border: state.isFocused ? '2px solid #3b82f6' : '1px solid #d1d5db',
      borderRadius: '6px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      fontSize: '14px',
      '&:hover': {
        border: '1px solid #9ca3af',
      },
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#3b82f6'
        : state.isFocused
        ? '#f3f4f6'
        : 'white',
      color: state.isSelected ? 'white' : '#374151',
      padding: '8px 12px',
      fontSize: '14px',
      '&:hover': {
        backgroundColor: state.isSelected ? '#3b82f6' : '#f3f4f6',
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '14px',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#374151',
      fontSize: '14px',
    }),
  };

  return (
    <div className="card-elevated p-3 sm:p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Search & Filter</h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Name Search */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name, email, city, or province..."
            />
          </div>

          {/* Sex Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Sex
            </label>
            <select
              value={filters.sex}
              onChange={(e) => handleChange('sex', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Place/City Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Place/City
            </label>
            <input
              type="text"
              value={filters.place}
              onChange={(e) => handleChange('place', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by city, province, barangay, or street..."
            />
          </div>

          {/* Civil Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Civil Status
            </label>
            <select
              value={filters.civil_status}
              onChange={(e) => handleChange('civil_status', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Divorced">Divorced</option>
              <option value="Separated">Separated</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <Select
              value={[
                { value: 'first_name', label: 'First Name' },
                { value: 'last_name', label: 'Last Name' },
                { value: 'city', label: 'City' },
                { value: 'province', label: 'Province' },
                { value: 'created_at', label: 'Created Date' },
                { value: 'age', label: 'Age' }
              ].find(option => option.value === filters.sort_by) || null}
              onChange={(selectedOption: any) => handleChange('sort_by', selectedOption?.value || '')}
              options={[
                { value: 'first_name', label: 'First Name' },
                { value: 'last_name', label: 'Last Name' },
                { value: 'city', label: 'City' },
                { value: 'province', label: 'Province' },
                { value: 'created_at', label: 'Created Date' },
                { value: 'age', label: 'Age' }
              ]}
              placeholder="Sort by..."
              styles={selectStyles}
              isSearchable
              isClearable
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <select
              value={filters.sort_order}
              onChange={(e) => handleChange('sort_order', e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          {/* Per Page */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Records Per Page
            </label>
            <select
              value={filters.per_page}
              onChange={(e) => handleChange('per_page', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-2 border-t">
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isLoading}
          >
            Clear Filters
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientSearchFilters;
