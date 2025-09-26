import React from 'react';
import { type Client } from '../../services/clientService';

interface ClientTableProps {
  clients: Client[];
  isLoading: boolean;
  isInitialLoading?: boolean;
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
}

const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  isLoading,
  isInitialLoading = false,
  onEditClient,
  onDeleteClient
}) => {
  // Skeleton loading component
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
          <div className="ml-2">
            <div className="h-3 bg-gray-300 rounded w-28 mb-1"></div>
            <div className="h-2 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="h-3 bg-gray-300 rounded w-16 mb-1"></div>
        <div className="h-2 bg-gray-200 rounded w-20 mb-1"></div>
        <div className="h-2 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="h-3 bg-gray-300 rounded w-20 mb-1"></div>
        <div className="h-2 bg-gray-200 rounded w-16 mb-1"></div>
        <div className="h-2 bg-gray-200 rounded w-12"></div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="h-3 bg-gray-300 rounded w-28 mb-1"></div>
        <div className="h-2 bg-gray-200 rounded w-20"></div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="h-3 bg-gray-300 rounded w-16 mb-1"></div>
        <div className="h-4 bg-gray-200 rounded-full w-12"></div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="h-2 bg-gray-300 rounded w-16"></div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex space-x-1">
          <div className="h-4 bg-gray-300 rounded w-8"></div>
          <div className="h-4 bg-gray-300 rounded w-12"></div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto relative">
        {isLoading && !isInitialLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-sm">Loading data...</span>
            </div>
          </div>
        )}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personal Info</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">National ID</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isInitialLoading === true ? (
              // Show skeleton loading rows for initial load
              Array.from({ length: 5 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))
            ) : clients.length === 0 ? (
              // Empty state - only show when not loading and no clients
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-medium text-gray-900 mb-1">No clients found</h3>
                    <p className="text-xs text-gray-500">Get started by adding a new client profile.</p>
                  </div>
                </td>
              </tr>
            ) : (
              clients.map((client) => {
              const fullName = `${client.first_name} ${client.middle_name ? client.middle_name + ' ' : ''}${client.last_name}${client.suffix ? ' ' + client.suffix : ''}`;
              const initials = `${client.first_name.charAt(0)}${client.last_name.charAt(0)}`;
              const age = client.age ?? Math.floor((new Date().getTime() - new Date(client.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
              
              return (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                        {initials}
                      </div>
                      <div className="ml-2">
                        <div className="text-xs font-medium text-gray-900">{fullName}</div>
                        <div className="text-xs text-gray-500">ID: {client.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-900">{age} years old</div>
                    <div className="text-xs text-gray-500">{client.sex} • {client.civil_status}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {client.social_classification.join(', ')}
                      {client.social_classification_other && ` (${client.social_classification_other})`}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-900">{client.city}, {client.province}</div>
                    <div className="text-xs text-gray-500">{client.barangay}</div>
                    <div className="text-xs text-gray-500">{client.zip_code}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-900">{client.email}</div>
                    <div className="text-xs text-gray-500">{client.telephone}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {client.has_national_id ? (
                      <div>
                        <div className="text-xs text-gray-900">{client.national_id_number}</div>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Not Available
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium space-x-1">
                    <button
                      onClick={() => onEditClient(client)}
                      className="btn-ghost text-xs px-1.5 py-0.5"
                      disabled={isLoading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteClient(client)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-200 text-xs px-1.5 py-0.5"
                      disabled={isLoading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientTable;
