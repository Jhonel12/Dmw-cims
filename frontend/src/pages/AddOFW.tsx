import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import type { OFWFormData } from '../types/ofw';
import OFWForm, { type OFWFormRef } from '../components/forms/OFWForm';
import ofwService from '../services/OFWService';

const AddOFW: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<OFWFormRef>(null);

  const handleSubmit = async (data: OFWFormData) => {
    setIsLoading(true);
    
    try {
      // Validate data before sending
      const validation = ofwService.validateOFWData(data);
      if (!validation.isValid) {
        console.error('Validation errors:', validation.errors);
        showWarning('Validation Error', 'Please fix the validation errors before submitting.');
        return;
      }

      console.log('Saving OFW data:', data);
      
      // Make actual API call to save the data
      const savedRecord = await ofwService.createOFWRecord(data);
      
      console.log('OFW record saved successfully:', savedRecord);
      
      // Show success message
      showSuccess('Success!', 'OFW record added successfully!');
      
      // Reset form for next entry
      formRef.current?.resetForm();
    } catch (error) {
      console.error('Error saving OFW data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error saving OFW record. Please try again.';
      showError('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/ofw-list');
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="card-elevated p-3 sm:p-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/ofw-list')}
            className="text-gray-600 hover:text-gray-800 focus:outline-none text-sm"
          >
            ← Back to OFW List
          </button>
        </div>
        <h1 className="text-base sm:text-lg font-bold text-gray-900 mt-3">Add New OFW Record</h1>
        <p className="text-xs text-gray-600 mt-1">Enter the required information for the new Overseas Filipino Worker</p>
      </div>

      {/* OFW Form */}
      <OFWForm
        ref={formRef}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AddOFW;
