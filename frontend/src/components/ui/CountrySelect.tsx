import React from 'react';
import Select from 'react-select';
import type { Country } from '../../services/countriesService';

interface CountrySelectProps {
  value: Country | null;
  onChange: (selectedOption: Country | null) => void;
  options: Country[];
  placeholder?: string;
  styles?: any;
  isSearchable?: boolean;
  isClearable?: boolean;
  isLoading?: boolean;
}

const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select Country',
  styles,
  isSearchable = true,
  isClearable = true,
  isLoading = false
}) => {
  const formatOptionLabel = (option: Country) => (
    <div className="flex items-center space-x-2">
      {option.flag && (
        <img
          src={option.flag}
          alt={`${option.label} flag`}
          className="w-5 h-3 object-cover rounded-sm"
          onError={(e) => {
            // Hide flag if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      <span className="text-sm">{option.label}</span>
    </div>
  );

  const customStyles = {
    ...styles,
    option: (provided: any, state: any) => ({
      ...provided,
      ...styles?.option?.(provided, state),
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
    }),
    singleValue: (provided: any, state: any) => ({
      ...provided,
      ...styles?.singleValue?.(provided, state),
      display: 'flex',
      alignItems: 'center',
    }),
  };

  return (
    <Select
      value={value}
      onChange={(selectedOption: Country | null) => onChange(selectedOption)}
      options={options}
      formatOptionLabel={formatOptionLabel}
      placeholder={placeholder}
      styles={customStyles}
      isSearchable={isSearchable}
      isClearable={isClearable}
      isLoading={isLoading}
      getOptionValue={(option) => option.value}
      getOptionLabel={(option) => option.label}
    />
  );
};

export default CountrySelect;
