import React, { useState } from 'react';
import Select from 'react-select';
import CountrySelect from '../ui/CountrySelect';
import { useCountries } from '../../hooks/useCountries';
import type { SearchFilters as SearchFiltersType } from '../../types/ofw';

interface SearchFiltersProps {
  onSearch: (filters: SearchFiltersType) => void;
  onClear: () => void;
  isLoading?: boolean;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onSearch, onClear, isLoading = false }) => {
  const { countries, isLoading: countriesLoading } = useCountries();
  const [filters, setFilters] = useState<SearchFiltersType>({
    search: '',
    sex: '',
    country: '',
    sort_by: '',
    sort_order: 'asc',
    per_page: 10,
    page: 1
  } as SearchFiltersType);

  const handleChange = (field: keyof SearchFiltersType, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [field]: field === 'per_page' || field === 'page' ? parseInt(value) || 1 : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({
      search: '',
      sex: '',
      country: '',
      sort_by: '',
      sort_order: 'asc',
      per_page: 10,
      page: 1
    } as SearchFiltersType);
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
              Name
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name, position, country, employer, or OEC number..."
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

          {/* Sort By Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <Select
              value={[
                { value: 'nameOfWorker', label: 'Name' },
                { value: 'position', label: 'Position' },
                { value: 'countryDestination', label: 'Country' },
                { value: 'departureDate', label: 'Departure Date' },
                { value: 'created_at', label: 'Created Date' }
              ].find(option => option.value === filters.sort_by) || null}
              onChange={(selectedOption: any) => handleChange('sort_by', selectedOption?.value || '')}
              options={[
                { value: 'nameOfWorker', label: 'Name' },
                { value: 'position', label: 'Position' },
                { value: 'countryDestination', label: 'Country' },
                { value: 'departureDate', label: 'Departure Date' },
                { value: 'created_at', label: 'Created Date' }
              ]}
              placeholder="Sort by..."
              styles={selectStyles}
              isSearchable
              isClearable
            />
          </div>

          {/* Country Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Country Destination
            </label>
            <CountrySelect
              value={countries.find(option => option.value === filters.country) || null}
              onChange={(selectedOption) => handleChange('country', selectedOption?.value || '')}
              options={countries}
              placeholder="All Countries"
              styles={selectStyles}
              isSearchable
              isClearable
              isLoading={countriesLoading}
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
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
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

export default SearchFilters;
