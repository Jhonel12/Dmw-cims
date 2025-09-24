import React from 'react';
import { type Client } from '../../services/clientService';

interface ClientTableProps {
  clients: Client[];
  isLoading: boolean;
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
}

const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  isLoading,
  onEditClient,
  onDeleteClient
}) => {

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personal Info</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">National ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => {
              const fullName = `${client.first_name} ${client.middle_name ? client.middle_name + ' ' : ''}${client.last_name}${client.suffix ? ' ' + client.suffix : ''}`;
              const initials = `${client.first_name.charAt(0)}${client.last_name.charAt(0)}`;
              const age = client.age ?? Math.floor((new Date().getTime() - new Date(client.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
              
              return (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                        {initials}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{fullName}</div>
                        <div className="text-xs text-gray-500">ID: {client.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{age} years old</div>
                    <div className="text-xs text-gray-500">{client.sex} • {client.civil_status}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {client.social_classification.join(', ')}
                      {client.social_classification_other && ` (${client.social_classification_other})`}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.city}, {client.province}</div>
                    <div className="text-xs text-gray-500">{client.barangay}</div>
                    <div className="text-xs text-gray-500">{client.zip_code}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.email}</div>
                    <div className="text-xs text-gray-500">{client.telephone}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {client.has_national_id ? (
                      <div>
                        <div className="text-sm text-gray-900">{client.national_id_number}</div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Not Available
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => onEditClient(client)}
                      className="btn-ghost text-xs px-2 py-1"
                      disabled={isLoading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteClient(client)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-200 text-xs px-2 py-1"
                      disabled={isLoading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientTable;
