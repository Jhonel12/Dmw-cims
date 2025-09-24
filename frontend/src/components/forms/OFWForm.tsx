import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import Select from 'react-select';
import CountrySelect from '../ui/CountrySelect';
import Calendar from './Calendar';
import { useCountries } from '../../hooks/useCountries';
import type { OFWFormData } from '../../types/ofw';
import { POSITIONS as POSITION_OPTIONS } from '../../constants/positions';

interface OFWFormProps {
  initialData?: Partial<OFWFormData>;
  onSubmit: (data: OFWFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isModal?: boolean;
}

export interface OFWFormRef {
  resetForm: () => void;
}

const OFWForm = forwardRef<OFWFormRef, OFWFormProps>(({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  isModal = false
}, ref) => {
  const { countries, isLoading: countriesLoading } = useCountries();
  const [formData, setFormData] = useState<OFWFormData>({
    nameOfWorker: initialData?.nameOfWorker || '',
    sex: initialData?.sex || 'Male',
    position: initialData?.position || '',
    address: initialData?.address || '',
    employer: initialData?.employer || '',
    countryDestination: initialData?.countryDestination || '',
    oecNumber: initialData?.oecNumber || '',
    departureDate: initialData?.departureDate || '',
  });

  const [errors, setErrors] = useState<Partial<OFWFormData>>({});

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        nameOfWorker: initialData.nameOfWorker || '',
        sex: initialData.sex || 'Male',
        position: initialData.position || '',
        address: initialData.address || '',
        employer: initialData.employer || '',
        countryDestination: initialData.countryDestination || '',
        oecNumber: initialData.oecNumber || '',
        departureDate: initialData.departureDate || '',
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<OFWFormData> = {};

    if (!formData.nameOfWorker.trim()) {
      newErrors.nameOfWorker = 'Name of Worker is required';
    }
    if (!formData.position.trim()) {
      newErrors.position = 'Position is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.employer.trim()) {
      newErrors.employer = 'Employer is required';
    }
    if (!formData.countryDestination.trim()) {
      newErrors.countryDestination = 'Country Destination is required';
    }
    if (!formData.oecNumber.trim()) {
      newErrors.oecNumber = 'OEC Number is required';
    }
    if (!formData.departureDate.trim()) {
      newErrors.departureDate = 'Departure Date is required';
    } else {
      // Validate date format but allow past dates for existing records
      const departureDate = new Date(formData.departureDate);
      if (isNaN(departureDate.getTime())) {
        newErrors.departureDate = 'Please enter a valid date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof OFWFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const resetForm = () => {
    setFormData({
      nameOfWorker: '',
      sex: 'Male',
      position: '',
      address: '',
      employer: '',
      countryDestination: '',
      oecNumber: '',
      departureDate: '',
    });
    setErrors({});
  };

  // Expose reset function to parent component
  useImperativeHandle(ref, () => ({
    resetForm
  }));

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
    <div className={isModal ? "p-3 sm:p-4" : "card-elevated p-4 sm:p-6"}>
      {!isModal && (
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {initialData ? 'Edit OFW Record' : 'Add New OFW Record'}
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                {initialData ? 'Update the OFW information below' : 'Fill in the required information for the new OFW'}
              </p>
            </div>
          </div>
          <div className="w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={isModal ? "space-y-3" : "space-y-4"}>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isModal ? "gap-3" : "gap-4"}`}>
          {/* Name of Workers */}
          <div className="form-group">
            <label className="form-label form-label-required">
              Name of Worker
            </label>
            <input
              type="text"
              value={formData.nameOfWorker}
              onChange={(e) => handleChange('nameOfWorker', e.target.value)}
              className={`input ${errors.nameOfWorker ? 'input-error' : ''}`}
              placeholder="Enter Name of Worker"
            />
            {errors.nameOfWorker && (
              <p className="form-error">{errors.nameOfWorker}</p>
            )}
          </div>

          {/* Sex */}
          <div className="form-group">
            <label className="form-label form-label-required">
              Sex
            </label>
            <select
              value={formData.sex}
              onChange={(e) => handleChange('sex', e.target.value as 'Male' | 'Female')}
              className="select"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Position */}
          <div className="form-group">
            <label className="form-label form-label-required">
              Position/Profession
            </label>
            <Select
              value={POSITION_OPTIONS.find(option => option.value === formData.position) || null}
              onChange={(selectedOption: any) => handleChange('position', selectedOption?.value || '')}
              options={POSITION_OPTIONS}
              placeholder="Select Position"
              styles={selectStyles}
              className={errors.position ? 'react-select-error' : ''}
              isSearchable
              isClearable
            />
            {errors.position && (
              <p className="form-error">{errors.position}</p>
            )}
          </div>

          {/* Country Destination */}
          <div className="form-group">
            <label className="form-label form-label-required">
              Country Destination
            </label>
            <CountrySelect
              value={countries.find(option => option.value === formData.countryDestination) || null}
              onChange={(selectedOption) => handleChange('countryDestination', selectedOption?.value || '')}
              options={countries}
              placeholder="Select Country"
              styles={selectStyles}
              isSearchable
              isClearable
              isLoading={countriesLoading}
            />
            {errors.countryDestination && (
              <p className="form-error">{errors.countryDestination}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="form-group">
          <label className="form-label form-label-required">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            rows={3}
            className={`textarea ${errors.address ? 'input-error' : ''}`}
            placeholder="Enter complete address"
          />
          {errors.address && (
            <p className="form-error">{errors.address}</p>
          )}
        </div>

        {/* Employer */}
        <div className="form-group">
          <label className="form-label form-label-required">
            Employer
          </label>
          <input
            type="text"
            value={formData.employer}
            onChange={(e) => handleChange('employer', e.target.value)}
            className={`input ${errors.employer ? 'input-error' : ''}`}
            placeholder="Enter employer name"
          />
          {errors.employer && (
            <p className="form-error">{errors.employer}</p>
          )}
        </div>

        {/* OEC Number */}
        <div className="form-group">
          <label className="form-label form-label-required">
            OEC Number
          </label>
          <input
            type="text"
            value={formData.oecNumber}
            onChange={(e) => handleChange('oecNumber', e.target.value)}
            className={`input ${errors.oecNumber ? 'input-error' : ''}`}
            placeholder="Enter OEC Number"
          />
          {errors.oecNumber && (
            <p className="form-error">{errors.oecNumber}</p>
          )}
        </div>

        {/* Departure Date */}
        <div className="form-group">
          <Calendar
            label="Departure Date"
            value={formData.departureDate}
            onChange={(value) => handleChange('departureDate', value)}
            placeholder="Select departure date"
            required
            className={errors.departureDate ? 'border-red-300' : ''}
          />
          {errors.departureDate && (
            <p className="form-error">{errors.departureDate}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className={`flex justify-end space-x-3 border-t border-gray-200 ${isModal ? "pt-3" : "pt-4"}`}>
          <button
            type="button"
            onClick={onCancel}
            className={`btn btn-secondary ${isModal ? "text-xs py-1.5 px-3" : "text-sm"}`}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`btn btn-primary ${isModal ? "text-xs py-1.5 px-3" : "text-sm"}`}
          >
            {isLoading ? (
              <>
                <div className="spinner w-3 h-3 mr-1"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {initialData ? 'Update Record' : 'Add Record'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
});

export default OFWForm;
