import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from '../toaster/customtoast';
import Calendar from '../components/forms/Calendar';
import Select from 'react-select';
import { clientService, type ClientFormData as APIClientFormData } from '../services/clientService';
import logo from '../assets/dmwlogo2.svg';
import bagongLogo from '../assets/bagong.png';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const CIVIL_STATUS_OPTIONS = [
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'Widowed', label: 'Widowed' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Separated', label: 'Separated' }
];

const SEX_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' }
];

const SOCIAL_CLASSIFICATION_OPTIONS = [
  { value: 'Abled', label: 'Abled' },
  { value: 'Differently Abled', label: 'Differently Abled' },
  { value: 'Migrant Workers', label: 'Migrant Workers' },
  { value: '4Ps', label: '4Ps' },
  { value: '4Ps Beneficiary', label: '4Ps Beneficiary' },
  { value: 'OFW', label: 'OFW' },
  { value: 'Indigenous People', label: 'Indigenous People' },
  { value: 'Senior Citizen', label: 'Senior Citizen' },
  { value: 'Youth', label: 'Youth' },
  { value: 'Solo Parent', label: 'Solo Parent' },
  { value: 'Others', label: 'Others' }
];

// PSGC API Configuration
const PSGC_API_BASE = 'https://psgc.gitlab.io/api';

// Region X - Northern Mindanao (Region code: 10)
const REGION_OPTIONS = [
  { value: '10', label: 'Region X - Northern Mindanao' }
];

// Zip Code mapping for Region X cities and municipalities
const ZIP_CODE_MAPPING: Record<string, string> = {
  // Misamis Oriental
  'cagayan de oro': '9000',
  'cdo': '9000',
  'el salvador': '9017',
  'gingoog': '9014',
  'balingasag': '9005',
  'balingoan': '9011',
  'bunawan': '9006',
  'claveria': '9004',
  'gitagum': '9020',
  'initao': '9022',
  'jasaan': '9003',
  'kinoguitan': '9010',
  'lagonglong': '9006',
  'la libertad': '9021',
  'libertad': '9021',
  'lugait': '9025',
  'magsaysay misamis oriental': '9015',
  'manticao': '9024',
  'medina': '9013',
  'naawan': '9023',
  'opol': '9016',
  'salay': '9007',
  'sugbongcogon': '9009',
  'tagoloan misamis oriental': '9001',
  'talisayan': '9012',
  'villarica': '9008',
  
  // Misamis Occidental
  'ozamiz': '7200',
  'tangub': '7214',
  'aloran': '7206',
  'baliangao': '7211',
  'bonifacio': '7215',
  'calamba': '7211',
  'clarin': '7201',
  'concepcion': '7213',
  'don victoriano chiongbian': '7202',
  'jimenez': '7204',
  'lopez jaena': '7208',
  'oroquieta': '7207',
  'panaon': '7205',
  'plaridel': '7209',
  'sapang dalaga': '7212',
  'sinacaban': '7203',
  'tudela': '7210',
  
  // Bukidnon
  'malaybalay': '8700',
  'valencia': '8709',
  'baungon': '8707',
  'cabanglasan': '8713',
  'damulog': '8721',
  'dangcagan': '8719',
  'don carlos': '8712',
  'impasug-ong': '8702',
  'kadingilan': '8718',
  'kalilangan': '8718',
  'kibawe': '8720',
  'kitaotao': '8722',
  'lanto': '8723',
  'libona': '8706',
  'malitbog': '8704',
  'manolo fortich': '8703',
  'maramag': '8714',
  'pangantucan': '8716',
  'quezon': '8715',
  'san fernando': '8711',
  'sumilao': '8701',
  'talakag': '8708',
  
  // Camiguin
  'mambajao': '9100',
  'catarman': '9104',
  'guinsiliban': '9102',
  'mahinog': '9101',
  'sagay': '9103',
  
  // Lanao del Norte
  'iligan': '9200',
  'marawi': '9700',
  'bacolod': '9205',
  'baloi': '9217',
  'baroy': '9207',
  'kapatagan': '9214',
  'karomatan': '9215',
  'kauswagan': '9202',
  'kolambugan': '9204',
  'lala': '9211',
  'linamon': '9201',
  'magsaysay lanao del norte': '9221',
  'maigo': '9206',
  'matungao': '9219',
  'munai': '9219',
  'nunungan': '9216',
  'pantar': '9218',
  'poona piagapo': '9218',
  'salvador': '9212',
  'sapad': '9213',
  'sultan naga dimaporo': '9215',
  'tagoloan lanao del norte': '9222',
  'tambulig': '9214',
  'tubod': '9209',
  'tugaya': '9216'
};

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // State for API data
  const [provinces, setProvinces] = useState<Array<{value: string, label: string}>>([]);
  const [cities, setCities] = useState<Array<{value: string, label: string}>>([]);
  const [barangays, setBarangays] = useState<Array<{value: string, label: string}>>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);
  const [showBarangayInput, setShowBarangayInput] = useState(false);
  
  // Select styles to match the app's design
  const selectStyles = {
    control: (provided: any) => ({
      ...provided,
      minHeight: '48px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#9ca3af',
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

  const [formData, setFormData] = useState<ClientFormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    dateOfBirth: '',
    age: '',
    civilStatus: '',
    sex: '',
    socialClassification: [],
    socialClassificationOther: '',
    houseNumber: '',
    street: '',
    barangay: '',
    province: '',
    region: '',
    city: '',
    zipCode: '',
    telephone: '',
    email: '',
    emergencyName: '',
    emergencyTelephone: '',
    emergencyRelationship: '',
    hasNationalId: false,
    nationalIdNumber: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // API functions for PSGC data
  const fetchProvinces = async (regionCode: string) => {
    setLoadingProvinces(true);
    try {
      console.log('Fetching provinces for region code:', regionCode);
      
      const allProvincesResponse = await fetch(`${PSGC_API_BASE}/provinces`);
      
      if (!allProvincesResponse.ok) {
        throw new Error(`HTTP ${allProvincesResponse.status}`);
      }
      
      const allProvinces = await allProvincesResponse.json();
      
      if (Array.isArray(allProvinces)) {
        const region10Provinces = allProvinces.filter((province: any) => {
          const regionCodeField = province.region_code || province.regionCode;
          return String(regionCodeField) === String(regionCode);
        });
        
        if (region10Provinces.length === 0) {
          // Fallback: Search by known Region X province names
          const regionXProvinceNames = [
            'Misamis Oriental', 'Misamis Occidental', 'Bukidnon', 'Camiguin', 'Lanao del Norte'
          ];
          
          const fallbackProvinces = allProvinces.filter((province: any) => {
            const provinceName = province.name || province.province_name || '';
            return regionXProvinceNames.some(name => 
              provinceName.toLowerCase().includes(name.toLowerCase())
            );
          });
          
          if (fallbackProvinces.length > 0) {
            const fallbackList = fallbackProvinces.map((province: any) => ({
              value: province.code || province.id,
              label: province.name || province.province_name
            }));
            setProvinces(fallbackList);
            return;
          }
        }
        
        const provincesList = region10Provinces.map((province: any) => ({
          value: province.code || province.id,
          label: province.name
        }));
        
        setProvinces(provincesList);
      }
    } catch (err) {
      console.error('Error fetching provinces:', err);
      error({
        title: 'Error',
        message: 'Failed to load provinces. Please try again.'
      });
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchCities = async (provinceCode: string) => {
    setLoadingCities(true);
    try {
      const allCitiesResponse = await fetch(`${PSGC_API_BASE}/cities-municipalities`);
      
      if (!allCitiesResponse.ok) {
        throw new Error(`HTTP ${allCitiesResponse.status}`);
      }
      
      const allCities = await allCitiesResponse.json();
      
      if (Array.isArray(allCities)) {
        const provinceCities = allCities.filter((city: any) => {
          const provinceCodeField = city.province_code || city.provinceCode;
          const officialType = city.type || city.city_type;
          
          const isCityOrMunicipality = officialType === 'City' || 
                                     officialType === 'Municipality' ||
                                     (!officialType && city.name && city.name.length > 0);
          
          const provinceMatch = String(provinceCodeField) === String(provinceCode);
          
          return provinceMatch && isCityOrMunicipality;
        });
        
        const citiesList = provinceCities.map((city: any) => ({
          value: city.code || city.id,
          label: city.name || city.city_name
        }));
        
        setCities(citiesList);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
      error({
        title: 'Error',
        message: 'Failed to load cities. Please try again.'
      });
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchBarangays = async (cityCode: string) => {
    setLoadingBarangays(true);
    try {
      const allBarangaysResponse = await fetch(`${PSGC_API_BASE}/barangays`);
      
      if (!allBarangaysResponse.ok) {
        throw new Error(`HTTP ${allBarangaysResponse.status}`);
      }
      
      const allBarangays = await allBarangaysResponse.json();
      
      if (Array.isArray(allBarangays)) {
        const cityBarangays = allBarangays.filter((barangay: any) => {
          const cityCodeField = barangay.city_code || barangay.cityCode;
          return String(cityCodeField) === String(cityCode);
        });
        
        if (cityBarangays.length === 0) {
          setShowBarangayInput(true);
          setBarangays([]);
          return;
        } else {
          setShowBarangayInput(false);
        }
        
        const barangaysList = cityBarangays.map((barangay: any) => ({
          value: barangay.code || barangay.id,
          label: barangay.name || barangay.barangay_name
        }));
        
        setBarangays(barangaysList);
      }
    } catch (err) {
      console.error('Error fetching barangays:', err);
      error({
        title: 'Error',
        message: 'Failed to load barangays. Please try again.'
      });
    } finally {
      setLoadingBarangays(false);
    }
  };

  // Helper functions for cascading dropdowns
  const getAvailableProvinces = () => provinces;
  const getAvailableCities = () => cities;
  const getAvailableBarangays = () => barangays;

  // Helper function to get zip code for a city
  const getZipCodeForCity = (cityName: string): string => {
    if (!cityName) return '';
    
    console.log('Getting zip code for city:', cityName);
    
    const normalizedCityName = cityName.toLowerCase()
      .replace(/city/g, '')
      .replace(/municipality/g, '')
      .replace(/mun\./g, '')
      .replace(/mun /g, '')
      .replace(/of /g, '')
      .replace(/\(/g, '')
      .replace(/\)/g, '')
      .trim();
    
    console.log('Normalized city name:', normalizedCityName);
    
    // Try exact match first
    if (ZIP_CODE_MAPPING[normalizedCityName]) {
      console.log('Found exact match:', ZIP_CODE_MAPPING[normalizedCityName]);
      return ZIP_CODE_MAPPING[normalizedCityName];
    }
    
    // Try partial matches
    for (const [key, zipCode] of Object.entries(ZIP_CODE_MAPPING)) {
      if (normalizedCityName.includes(key) || key.includes(normalizedCityName)) {
        console.log(`Found partial match: ${key} -> ${zipCode}`);
        return zipCode;
      }
    }
    
    console.log('No zip code found for:', normalizedCityName);
    return '';
  };

  const handleInputChange = (field: keyof ClientFormData, value: string | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'region') {
        newData.province = '';
        newData.city = '';
        newData.barangay = '';
        newData.zipCode = '';
        setProvinces([]);
        setCities([]);
        setBarangays([]);
        setShowBarangayInput(false);
        
        if (value) {
          fetchProvinces(value as string);
        }
      } else if (field === 'province') {
        newData.city = '';
        newData.barangay = '';
        newData.zipCode = '';
        setCities([]);
        setBarangays([]);
        setShowBarangayInput(false);
        
        if (value) {
          fetchCities(value as string);
        }
      }
      // Note: City selection is handled directly in the Select onChange
      
      return newData;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCheckboxChange = (field: keyof ClientFormData, value: string, checked: boolean) => {
    setFormData(prev => {
      if (field === 'socialClassification') {
        const currentArray = prev[field] as string[];
        if (checked) {
          return { ...prev, [field]: [...currentArray, value] };
        } else {
          return { ...prev, [field]: currentArray.filter(item => item !== value) };
        }
      }
      return prev;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  };

  const handleDateOfBirthChange = (value: string) => {
    setFormData(prev => ({ ...prev, dateOfBirth: value }));
    const age = calculateAge(value);
    setFormData(prev => ({ ...prev, age }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.civilStatus) newErrors.civilStatus = 'Civil status is required';
    if (!formData.sex) newErrors.sex = 'Sex is required';
    if (formData.socialClassification.length === 0) newErrors.socialClassification = 'Please select at least one social classification';
    if (!formData.houseNumber.trim()) newErrors.houseNumber = 'House number is required';
    if (!formData.street.trim()) newErrors.street = 'Street is required';
    if (!formData.barangay.trim()) newErrors.barangay = 'Barangay is required';
    if (!formData.province.trim()) newErrors.province = 'Province is required';
    if (!formData.region) newErrors.region = 'Region is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    if (!formData.telephone.trim()) newErrors.telephone = 'Telephone/Mobile number is required';
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    if (!formData.emergencyName.trim()) newErrors.emergencyName = 'Emergency contact name is required';
    if (!formData.emergencyTelephone.trim()) newErrors.emergencyTelephone = 'Emergency contact number is required';
    if (!formData.emergencyRelationship.trim()) newErrors.emergencyRelationship = 'Emergency contact relationship is required';

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.hasNationalId && !formData.nationalIdNumber.trim()) {
      newErrors.nationalIdNumber = 'National ID number is required when you have a National ID';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      error({
        title: 'Validation Error',
        message: 'Please fill in all required fields correctly.'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const selectedProvince = provinces.find(p => p.value === formData.province);
      const selectedCity = cities.find(c => c.value === formData.city);
      const selectedBarangay = barangays.find(b => b.value === formData.barangay);
      const selectedRegion = REGION_OPTIONS.find(r => r.value === formData.region);

      const apiData: APIClientFormData = {
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        suffix: formData.suffix,
        date_of_birth: formData.dateOfBirth,
        age: parseInt(formData.age) || 0,
        civil_status: formData.civilStatus as 'Single' | 'Married' | 'Widowed' | 'Divorced' | 'Separated',
        sex: formData.sex as 'Male' | 'Female',
        social_classification: formData.socialClassification,
        social_classification_other: formData.socialClassificationOther,
        house_number: formData.houseNumber,
        street: formData.street,
        barangay: selectedBarangay?.label || formData.barangay,
        city: selectedCity?.label || formData.city,
        province: selectedProvince?.label || formData.province,
        region: selectedRegion?.label || formData.region,
        zip_code: formData.zipCode,
        telephone: formData.telephone,
        email: formData.email,
        emergency_name: formData.emergencyName,
        emergency_telephone: formData.emergencyTelephone,
        emergency_relationship: formData.emergencyRelationship,
        has_national_id: formData.hasNationalId,
        national_id_number: formData.nationalIdNumber
      };

      console.log('Sending client data:', apiData);
      
      await clientService.createClient(apiData);
      
      success({
        title: 'Success!',
        message: 'Client profile has been created successfully.'
      });
      
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        dateOfBirth: '',
        age: '',
        civilStatus: '',
        sex: '',
        socialClassification: [],
        socialClassificationOther: '',
        houseNumber: '',
        street: '',
        barangay: '',
        province: '',
        region: '',
        city: '',
        zipCode: '',
        telephone: '',
        email: '',
        emergencyName: '',
        emergencyTelephone: '',
        emergencyRelationship: '',
        hasNationalId: false,
        nationalIdNumber: ''
      });
      
      setProvinces([]);
      setCities([]);
      setBarangays([]);
      setShowBarangayInput(false);
    } catch (err: any) {
      console.error('Error creating client:', err);
      let errorMessage = 'Failed to create client profile. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).flat();
        errorMessage = `Validation failed: ${errorMessages.join(', ')}`;
      }
      
      error({
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
        >
          <motion.div
            key="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white w-full max-w-6xl rounded-xl sm:rounded-2xl shadow-xl max-h-[95vh] flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white p-3 sm:p-4 md:p-5 border-b flex items-center justify-between rounded-t-xl sm:rounded-t-2xl z-10 relative">
              <img src={logo} alt="DMW Logo" className="h-10 sm:h-12 md:h-14 w-auto object-contain flex-shrink-0" />

              <h2 className="absolute left-1/2 transform -translate-x-1/2 text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-900 text-center max-w-[50%] sm:max-w-none">
                Client Information Form
              </h2>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <img src={bagongLogo} alt="Bagong Pilipinas" className="h-10 sm:h-12 md:h-14 w-auto object-contain" />

                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="text-gray-600 hover:text-black text-xl sm:text-2xl p-1"
                >
                  ✖
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 flex-1">
              {/* A. CLIENT'S INFORMATION */}
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 border-b border-gray-200 pb-2">
                  A. CLIENT'S INFORMATION
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      1. First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                  </div>

                  {/* Middle Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      2. Middle Name
                    </label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => handleInputChange('middleName', e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Enter middle name"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      3. Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                  </div>

                  {/* Suffix */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      4. Suffix (e.g. Jr., Sr., III)
                    </label>
                    <input
                      type="text"
                      value={formData.suffix}
                      onChange={(e) => handleInputChange('suffix', e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Jr., Sr., III, etc."
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <Calendar
                      label="5. Date of Birth (mm/dd/yyyy)"
                      value={formData.dateOfBirth}
                      onChange={handleDateOfBirthChange}
                      placeholder="Select date of birth"
                      required={true}
                      maxDate={new Date().toISOString().split('T')[0]}
                      className={errors.dateOfBirth ? 'input-error' : ''}
                    />
                    {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      6. Age
                    </label>
                    <input
                      type="text"
                      value={formData.age}
                      readOnly
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="Auto-calculated"
                    />
                  </div>

                  {/* Civil Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      7. Civil Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.civilStatus}
                      onChange={(e) => handleInputChange('civilStatus', e.target.value)}
                      className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.civilStatus ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Select civil status</option>
                      {CIVIL_STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    {errors.civilStatus && <p className="text-xs text-red-500 mt-1">{errors.civilStatus}</p>}
                  </div>

                  {/* Sex */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      8. Sex <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.sex}
                      onChange={(e) => handleInputChange('sex', e.target.value)}
                      className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.sex ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Select sex</option>
                      {SEX_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    {errors.sex && <p className="text-xs text-red-500 mt-1">{errors.sex}</p>}
                  </div>

                  {/* Social Classification */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      9. Social Classification <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {SOCIAL_CLASSIFICATION_OPTIONS.map(option => (
                        <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.socialClassification.includes(option.value)}
                            onChange={(e) => handleCheckboxChange('socialClassification', option.value, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                    {formData.socialClassification.includes('Others') && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={formData.socialClassificationOther}
                          onChange={(e) => handleInputChange('socialClassificationOther', e.target.value)}
                          className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="Please specify"
                        />
                      </div>
                    )}
                    {errors.socialClassification && <p className="text-xs text-red-500 mt-1">{errors.socialClassification}</p>}
                  </div>
                </div>
              </div>

              {/* 10. Home Address */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  10. Home Address
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      House/ Building No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.houseNumber}
                      onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                      className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.houseNumber ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter house/building number"
                    />
                    {errors.houseNumber && <p className="text-xs text-red-500 mt-1">{errors.houseNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={REGION_OPTIONS.find(option => option.value === formData.region) || null}
                      onChange={(selectedOption: any) => handleInputChange('region', selectedOption?.value || '')}
                      options={REGION_OPTIONS}
                      placeholder="Select region"
                      styles={{
                        ...selectStyles,
                        control: (provided: any) => ({
                          ...selectStyles.control(provided),
                          borderColor: errors.region ? '#ef4444' : '#d1d5db',
                        }),
                      }}
                      isSearchable
                      isClearable
                    />
                    {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={getAvailableProvinces().find(option => option.value === formData.province) || null}
                      onChange={(selectedOption: any) => handleInputChange('province', selectedOption?.value || '')}
                      options={getAvailableProvinces()}
                      placeholder={loadingProvinces ? "Loading..." : formData.region ? "Select province" : "Select region first"}
                      isDisabled={!formData.region || loadingProvinces}
                      isLoading={loadingProvinces}
                      styles={{
                        ...selectStyles,
                        control: (provided: any) => ({
                          ...selectStyles.control(provided),
                          borderColor: errors.province ? '#ef4444' : '#d1d5db',
                          backgroundColor: !formData.region ? '#f9fafb' : 'white',
                        }),
                      }}
                      isSearchable
                      isClearable
                    />
                    {errors.province && <p className="text-xs text-red-500 mt-1">{errors.province}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City/Municipality <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={getAvailableCities().find(option => option.value === formData.city) || null}
                      onChange={(selectedOption: any) => {
                        console.log('City select onChange triggered:', selectedOption);
                        
                        if (selectedOption) {
                          console.log('Selected city value:', selectedOption.value);
                          console.log('Selected city label:', selectedOption.label);
                          
                          // Get zip code for selected city
                          const zipCode = getZipCodeForCity(selectedOption.label);
                          console.log('Zip code from getZipCodeForCity:', zipCode);
                          
                          // Update form data with city and zip code
                          setFormData(prev => ({
                            ...prev,
                            city: selectedOption.value,
                            zipCode: zipCode,
                            barangay: '' // Reset barangay
                          }));
                          
                          // Clear errors
                          if (errors.city) {
                            setErrors(prev => ({ ...prev, city: '' }));
                          }
                          
                          // Fetch barangays
                          setBarangays([]);
                          setShowBarangayInput(false);
                          fetchBarangays(selectedOption.value);
                        } else {
                          // Clear city, zip code, and barangay
                          setFormData(prev => ({
                            ...prev,
                            city: '',
                            zipCode: '',
                            barangay: ''
                          }));
                          setBarangays([]);
                          setShowBarangayInput(false);
                        }
                      }}
                      options={getAvailableCities()}
                      placeholder={loadingCities ? "Loading..." : formData.province ? "Select city" : "Select province first"}
                      isDisabled={!formData.province || loadingCities}
                      isLoading={loadingCities}
                      styles={{
                        ...selectStyles,
                        control: (provided: any) => ({
                          ...selectStyles.control(provided),
                          borderColor: errors.city ? '#ef4444' : '#d1d5db',
                          backgroundColor: !formData.province ? '#f9fafb' : 'white',
                        }),
                      }}
                      isSearchable
                      isClearable
                    />
                    {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barangay <span className="text-red-500">*</span>
                    </label>
                    {showBarangayInput ? (
                      <input
                        type="text"
                        value={formData.barangay}
                        onChange={(e) => handleInputChange('barangay', e.target.value)}
                        placeholder="Enter barangay name"
                        className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.barangay ? 'border-red-500' : 'border-gray-300'}`}
                      />
                    ) : (
                      <Select
                        value={getAvailableBarangays().find(option => option.value === formData.barangay) || null}
                        onChange={(selectedOption: any) => handleInputChange('barangay', selectedOption?.value || '')}
                        options={getAvailableBarangays()}
                        placeholder={loadingBarangays ? "Loading..." : formData.city ? "Select barangay" : "Select city first"}
                        isDisabled={!formData.city || loadingBarangays}
                        isLoading={loadingBarangays}
                        styles={{
                          ...selectStyles,
                          control: (provided: any) => ({
                            ...selectStyles.control(provided),
                            borderColor: errors.barangay ? '#ef4444' : '#d1d5db',
                            backgroundColor: !formData.city ? '#f9fafb' : 'white',
                          }),
                        }}
                        isSearchable
                        isClearable
                      />
                    )}
                    {errors.barangay && <p className="text-xs text-red-500 mt-1">{errors.barangay}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.street ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter street name"
                    />
                    {errors.street && <p className="text-xs text-red-500 mt-1">{errors.street}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zip Code <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                          errors.zipCode ? 'border-red-500' : 
                          formData.city && formData.zipCode ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                        }`}
                        placeholder="Enter zip code"
                      />
                      {formData.city && formData.zipCode && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            Auto-filled
                          </span>
                        </div>
                      )}
                    </div>
                    {formData.city && formData.zipCode && (
                      <p className="text-xs text-blue-600 mt-1">
                        Zip code auto-populated for {cities.find(city => city.value === formData.city)?.label || 'selected city'}
                      </p>
                    )}
                    {errors.zipCode && <p className="text-xs text-red-500 mt-1">{errors.zipCode}</p>}
                  </div>
                </div>
              </div>

              {/* 11-12. Contact Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  11-12. Contact Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      11. Telephone/Mobile No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => handleInputChange('telephone', e.target.value)}
                      className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.telephone ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter telephone/mobile number"
                    />
                    {errors.telephone && <p className="text-xs text-red-500 mt-1">{errors.telephone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      12. Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter email address"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* 13. Emergency Contact */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  13. Emergency Contact
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyName}
                      onChange={(e) => handleInputChange('emergencyName', e.target.value)}
                      className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.emergencyName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter emergency contact name"
                    />
                    {errors.emergencyName && <p className="text-xs text-red-500 mt-1">{errors.emergencyName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telephone/Mobile No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyTelephone}
                      onChange={(e) => handleInputChange('emergencyTelephone', e.target.value)}
                      className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.emergencyTelephone ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter emergency contact number"
                    />
                    {errors.emergencyTelephone && <p className="text-xs text-red-500 mt-1">{errors.emergencyTelephone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nature of Relationship <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyRelationship}
                      onChange={(e) => handleInputChange('emergencyRelationship', e.target.value)}
                      className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.emergencyRelationship ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                    {errors.emergencyRelationship && <p className="text-xs text-red-500 mt-1">{errors.emergencyRelationship}</p>}
                  </div>
                </div>
              </div>

              {/* 14. National ID */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  14. Do you have National ID?
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formData.hasNationalId === true}
                        onChange={() => handleInputChange('hasNationalId', true)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formData.hasNationalId === false}
                        onChange={() => handleInputChange('hasNationalId', false)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">No</span>
                    </label>
                  </div>

                  {formData.hasNationalId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        National ID No.: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.nationalIdNumber}
                        onChange={(e) => handleInputChange('nationalIdNumber', e.target.value)}
                        className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.nationalIdNumber ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Enter National ID number"
                      />
                      {errors.nationalIdNumber && <p className="text-xs text-red-500 mt-1">{errors.nationalIdNumber}</p>}
                    </div>
                  )}
                </div>
              </div>

            </form>
            
            {/* Footer */}
            <div className="sticky bottom-0 bg-white px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 rounded-b-xl sm:rounded-b-2xl z-10">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm sm:text-base">Creating...</span>
                  </div>
                ) : (
                  <span className="text-sm sm:text-base">Submit</span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddClientModal;
