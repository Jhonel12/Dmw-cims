import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../ui/Modal';
import OFWForm, { type OFWFormRef } from '../forms/OFWForm';
import ofwService from '../../services/OFWService';
import type { OFW, OFWFormData } from '../../types/ofw';

interface EditOFWModalProps {
  isOpen: boolean;
  onClose: () => void;
  ofwRecord: OFW | null;
  onSuccess: () => void;
}

const EditOFWModal: React.FC<EditOFWModalProps> = ({
  isOpen,
  onClose,
  ofwRecord,
  onSuccess
}) => {
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const formRef = React.useRef<OFWFormRef>(null);

  // Convert OFW to OFWFormData
  const convertToFormData = (ofw: OFW): OFWFormData => {
    // Format the date for the form input (YYYY-MM-DD format)
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    };

    return {
      nameOfWorker: ofw.nameOfWorker || '',
      sex: ofw.sex || 'Male',
      position: ofw.position || '',
      address: ofw.address || '',
      employer: ofw.employer || '',
      countryDestination: ofw.countryDestination || '',
      oecNumber: ofw.oecNumber || '',
      departureDate: formatDate(ofw.departureDate)
    };
  };

  const handleSubmit = async (data: OFWFormData) => {
    if (!ofwRecord) return;

    setIsLoading(true);
    
    try {
      // Validate data before sending
      const validation = ofwService.validateOFWData(data);
      if (!validation.isValid) {
        console.error('Validation errors:', validation.errors);
        showError('Validation Error', 'Please fix the validation errors before submitting.');
        return;
      }

      console.log('Updating OFW data:', data);
      
      // Make actual API call to update the data
      const updatedRecord = await ofwService.updateOFWRecord(ofwRecord.id, data);
      
      console.log('OFW record updated successfully:', updatedRecord);
      
      // Show success message
      showSuccess('Success!', 'OFW record updated successfully!');
      
      // Close modal and refresh data
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error updating OFW data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error updating OFW record. Please try again.';
      showError('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  // Update form data when modal opens with new record
  useEffect(() => {
    if (isOpen && ofwRecord && formRef.current) {
      // The form will automatically use the initialData prop
      // No need to reset the form as it should prefill with the data
    }
  }, [isOpen, ofwRecord]);

  if (!ofwRecord) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit OFW Record"
      size="lg"
      closeOnOverlayClick={!isLoading}
      className="p-0"
    >
      <div className="p-0">
        <OFWForm
          ref={formRef}
          initialData={convertToFormData(ofwRecord)}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          isModal={true}
        />
      </div>
    </Modal>
  );
};

export default EditOFWModal;
