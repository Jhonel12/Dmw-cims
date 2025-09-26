import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../ui/Modal';
import ClientForm, { type ClientFormRef } from '../forms/ClientForm';
import { clientService, type Client } from '../../services/clientService';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSuccess: () => void;
}

interface ClientFormData {
  // Basic Information
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  dateOfBirth: string;
  age: string;
  civilStatus: string;
  sex: string;
  socialClassification: string[];
  socialClassificationOther: string;
  
  // Address Information
  houseNumber: string;
  street: string;
  barangay: string;
  province: string;
  region: string;
  city: string;
  zipCode: string;
  
  // Contact Information
  telephone: string;
  email: string;
  
  // Emergency Contact
  emergencyName: string;
  emergencyTelephone: string;
  emergencyRelationship: string;
  
  // National ID
  hasNationalId: boolean;
  nationalIdNumber: string;
}

const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  onClose,
  client,
  onSuccess
}) => {
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const formRef = React.useRef<ClientFormRef>(null);

  // Convert Client to ClientFormData
  const convertToFormData = (client: Client): ClientFormData => {
    // Format the date for the form input (YYYY-MM-DD format)
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    };


    return {
      firstName: client.first_name || '',
      middleName: client.middle_name || '',
      lastName: client.last_name || '',
      suffix: client.suffix || '',
      dateOfBirth: formatDate(client.date_of_birth),
      age: client.age?.toString() || '',
      civilStatus: client.civil_status || '',
      sex: client.sex || '',
      socialClassification: client.social_classification || [],
      socialClassificationOther: client.social_classification_other || '',
      houseNumber: client.house_number || '',
      street: client.street || '',
      barangay: client.barangay || '', // This should be the name, not code
      province: client.province || '', // This should be the name, not code
      region: client.region || '10',
      city: client.city || '', // This should be the name, not code
      zipCode: client.zip_code || '',
      telephone: client.telephone || '',
      email: client.email || '',
      emergencyName: client.emergency_name || '',
      emergencyTelephone: client.emergency_telephone || '',
      emergencyRelationship: client.emergency_relationship || '',
      hasNationalId: client.has_national_id || false,
      nationalIdNumber: client.national_id_number || ''
    };
  };

  const convertToAPIFormat = (data: ClientFormData) => {
    return {
      first_name: data.firstName,
      middle_name: data.middleName,
      last_name: data.lastName,
      suffix: data.suffix,
      date_of_birth: data.dateOfBirth,
      age: parseInt(data.age) || 0,
      civil_status: data.civilStatus,
      sex: data.sex,
      social_classification: data.socialClassification,
      social_classification_other: data.socialClassificationOther,
      house_number: data.houseNumber,
      street: data.street,
      barangay: data.barangay, // This will be the name from the dropdown
      city: data.city, // This will be the name from the dropdown
      province: data.province, // This will be the name from the dropdown
      region: data.region,
      zip_code: data.zipCode,
      telephone: data.telephone,
      email: data.email,
      emergency_name: data.emergencyName,
      emergency_telephone: data.emergencyTelephone,
      emergency_relationship: data.emergencyRelationship,
      has_national_id: data.hasNationalId,
      national_id_number: data.nationalIdNumber
    };
  };

  const handleSubmit = async (data: ClientFormData) => {
    if (!client) return;

    setIsLoading(true);
    
    try {
      console.log('Updating client data:', data);
      
      // Convert form data to API format
      const apiData = convertToAPIFormat(data);
      
      // Make actual API call to update the data
      const response = await clientService.updateClient(client.id, apiData);
      
      if (response.success) {
        console.log('Client updated successfully:', response.data);
        
        // Show success message
        showSuccess('Success!', 'Client updated successfully!');
        
        // Close modal and refresh data
        onClose();
        onSuccess();
      } else {
        showError('Error', response.message || 'Failed to update client');
      }
    } catch (error) {
      console.error('Error updating client data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error updating client. Please try again.';
      showError('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  // Update form data when modal opens with new client
  useEffect(() => {
    if (isOpen && client && formRef.current) {
      // The form will automatically use the initialData prop
      // No need to reset the form as it should prefill with the data
    }
  }, [isOpen, client]);

  if (!client) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Client"
      size="xl"
      closeOnOverlayClick={!isLoading}
      className="p-0"
    >
      <div className="p-0">
        <ClientForm
          ref={formRef}
          initialData={convertToFormData(client)}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          isModal={true}
        />
      </div>
    </Modal>
  );
};

export default EditClientModal;