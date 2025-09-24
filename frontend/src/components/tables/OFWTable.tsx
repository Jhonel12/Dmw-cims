import React, { useState } from 'react';
import { useCountries } from '../../hooks/useCountries';
import type { OFW } from '../../types/ofw';

interface OFWTableProps {
  data: OFW[];
  onEdit: (ofw: OFW) => void;
  onDelete: (ofw: OFW) => void;
  isLoading?: boolean;
}

const OFWTable: React.FC<OFWTableProps> = ({ data, onEdit, onDelete, isLoading = false }) => {
  const { countries } = useCountries();
  const [sortField, setSortField] = useState<keyof OFW>('nameOfWorker');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof OFW) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCountryFlag = (countryName: string) => {
    const country = countries.find(c => c.label === countryName);
    return country?.flag || '';
  };

  if (isLoading) {
    return (
      <div className="card-elevated p-4">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-gray-200 rounded w-40"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200/60 bg-gradient-to-r from-gray-50 to-gray-100/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">OFW Records</h3>
            <p className="text-xs text-gray-600 mt-1">Total records: {data.length}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              <span>Live Data</span>
            </div>
            <button className="btn btn-ghost text-xs px-2 py-1">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th 
                className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100/80 transition-colors duration-150 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                onClick={() => handleSort('nameOfWorker')}
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  {sortField === 'nameOfWorker' && (
                    <svg className={`w-3 h-3 transition-transform duration-200 ${
                      sortDirection === 'asc' ? 'rotate-180' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100/80 transition-colors duration-150 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                onClick={() => handleSort('sex')}
              >
                <div className="flex items-center space-x-1">
                  <span>Sex</span>
                  {sortField === 'sex' && (
                    <svg className={`w-3 h-3 transition-transform duration-200 ${
                      sortDirection === 'asc' ? 'rotate-180' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100/80 transition-colors duration-150 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                onClick={() => handleSort('position')}
              >
                <div className="flex items-center space-x-1">
                  <span>Position</span>
                  {sortField === 'position' && (
                    <svg className={`w-3 h-3 transition-transform duration-200 ${
                      sortDirection === 'asc' ? 'rotate-180' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100/80 transition-colors duration-150 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                onClick={() => handleSort('countryDestination')}
              >
                <div className="flex items-center space-x-1">
                  <span>Country</span>
                  {sortField === 'countryDestination' && (
                    <svg className={`w-3 h-3 transition-transform duration-200 ${
                      sortDirection === 'asc' ? 'rotate-180' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100/80 transition-colors duration-150 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                onClick={() => handleSort('employer')}
              >
                <div className="flex items-center space-x-1">
                  <span>Employer</span>
                  {sortField === 'employer' && (
                    <svg className={`w-3 h-3 transition-transform duration-200 ${
                      sortDirection === 'asc' ? 'rotate-180' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100/80 transition-colors duration-150 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                onClick={() => handleSort('departureDate')}
              >
                <div className="flex items-center space-x-1">
                  <span>Departure</span>
                  {sortField === 'departureDate' && (
                    <svg className={`w-3 h-3 transition-transform duration-200 ${
                      sortDirection === 'asc' ? 'rotate-180' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="table-body">
            {sortedData.map((ofw) => (
              <tr key={ofw.id} className="table-row">
                <td className="px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-700">
                        {ofw.nameOfWorker.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="font-medium text-gray-900 text-sm">{ofw.nameOfWorker}</div>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className={`badge ${
                    ofw.sex === 'Male' ? 'badge-primary' : 'badge-danger'
                  }`}>
                    {ofw.sex}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="text-xs text-gray-900 font-medium">{ofw.position}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center space-x-2">
                    {getCountryFlag(ofw.countryDestination) && (
                      <img 
                        src={getCountryFlag(ofw.countryDestination)} 
                        alt={`${ofw.countryDestination} flag`}
                        className="w-6 h-4 object-cover rounded-sm"
                      />
                    )}
                    <span className="text-xs text-gray-900 font-medium">{ofw.countryDestination}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-xs text-gray-900 max-w-xs truncate" title={ofw.employer}>
                    {ofw.employer}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-xs text-gray-900">{formatDate(ofw.departureDate)}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEdit(ofw)}
                      className="btn btn-ghost text-xs p-1.5 hover:bg-blue-50 hover:text-blue-700"
                      title="Edit record"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(ofw)}
                      className="btn btn-ghost text-xs p-1.5 hover:bg-red-50 hover:text-red-700"
                      title="Delete record"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No OFW records found</h3>
          <p className="text-sm text-gray-500 mb-4">Get started by adding your first OFW record</p>
          <button className="btn btn-primary text-sm">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add First Record
          </button>
        </div>
      )}
    </div>
  );
};

export default OFWTable;
