import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import Calendar from '../forms/Calendar';
import Select from 'react-select';
import { clientService, type ClientFormData as APIClientFormData } from '../../services/clientService';

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
  { value: 'OFW', label: 'OFW' },
  { value: 'Indigenous People', label: 'Indigenous People' },
  { value: 'Senior Citizen', label: 'Senior Citizen' },
  { value: 'Youth', label: 'Youth' }
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
  const { showSuccess, showError } = useToast();
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
      console.log('Fetching provinces for region code:', regionCode, 'Type:', typeof regionCode);
      
      // Try direct API first, then CORS proxy if needed
      let allProvincesResponse;
      try {
        allProvincesResponse = await fetch(`${PSGC_API_BASE}/provinces`);
      } catch (corsError) {
        console.warn('Direct API failed, trying CORS proxy:', corsError);
        // Try with CORS proxy
        allProvincesResponse = await fetch(`https://cors-anywhere.herokuapp.com/${PSGC_API_BASE}/provinces`, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
      }
      
      if (!allProvincesResponse.ok) {
        throw new Error(`HTTP ${allProvincesResponse.status}`);
      }
      
      const allProvinces = await allProvincesResponse.json();
      
      console.log('All provinces data:', allProvinces);
      console.log('Looking for region code:', regionCode);
      console.log('Total provinces found:', allProvinces.length);
      
      // Show first few provinces to understand the data structure
      if (allProvinces.length > 0) {
        console.log('Sample province structure:', allProvinces[0]);
        console.log('Sample province keys:', Object.keys(allProvinces[0]));
      }
      
      // Check if data is an array
      if (Array.isArray(allProvinces)) {
        // Try multiple field names and data types for region code
        const region10Provinces = allProvinces.filter((province: any) => {
          // Check different possible field names for region code
          const regionCodeField = province.region_code || province.regionCode || province.region_id || province.regionId;
          const regionCodeStr = String(regionCodeField);
          const regionCodeNum = Number(regionCodeField);
          const searchStr = String(regionCode);
          const searchNum = Number(regionCode);
          
          console.log('Province:', province.name, 
            'Region Code Field:', regionCodeField,
            'Region Code (string):', regionCodeStr,
            'Region Code (number):', regionCodeNum,
            'Search (string):', searchStr,
            'Search (number):', searchNum,
            'String match:', regionCodeStr === searchStr,
            'Number match:', regionCodeNum === searchNum);
            
          return regionCodeStr === searchStr || regionCodeNum === searchNum;
        });
        
        console.log('Filtered provinces for Region X:', region10Provinces);
        
        // Only show provinces from Region X, never show all provinces
        if (region10Provinces.length === 0) {
          console.warn('No provinces found for Region X. Trying fallback search by province names...');
          
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
          
          console.log('Fallback search results:', fallbackProvinces);
          
          if (fallbackProvinces.length > 0) {
            const fallbackList = fallbackProvinces.map((province: any) => ({
              value: province.code || province.id,
              label: province.name || province.province_name
            }));
            console.log('Using fallback provinces:', fallbackList);
            setProvinces(fallbackList);
            return;
          } else {
            showError('Warning', 'No provinces found for Region X. Please check the console for details.');
          }
        }
        
        const provincesList = region10Provinces.map((province: any) => ({
          value: province.code || province.id,
          label: province.name
        }));
        
        console.log('Final provinces list (Region X only):', provincesList);
        setProvinces(provincesList);
      } else {
        console.error('Data is not an array:', allProvinces);
        throw new Error('Invalid data format from PSGC API');
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
      showError('Error', 'Failed to load provinces. Please try again.');
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchCities = async (provinceCode: string) => {
    setLoadingCities(true);
    try {
      console.log('Fetching cities for province code:', provinceCode, 'Type:', typeof provinceCode);
      
      // Try direct API first, then CORS proxy if needed
      let allCitiesResponse;
      try {
        allCitiesResponse = await fetch(`${PSGC_API_BASE}/cities-municipalities`);
      } catch (corsError) {
        console.warn('Direct API failed, trying CORS proxy:', corsError);
        // Try with CORS proxy
        allCitiesResponse = await fetch(`https://cors-anywhere.herokuapp.com/${PSGC_API_BASE}/cities-municipalities`, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
      }
      
      if (!allCitiesResponse.ok) {
        throw new Error(`HTTP ${allCitiesResponse.status}`);
      }
      
      const allCities = await allCitiesResponse.json();
      
      console.log('All cities data:', allCities);
      console.log('Looking for province code:', provinceCode);
      console.log('Total cities found:', allCities.length);
      
      // Show first few cities to understand the data structure
      if (allCities.length > 0) {
        console.log('Sample city structure:', allCities[0]);
        console.log('Sample city keys:', Object.keys(allCities[0]));
      }
      
      // Check if data is an array
      if (Array.isArray(allCities)) {
        // Try multiple field names and data types for province code
        const provinceCities = allCities.filter((city: any) => {
          // Check different possible field names for province code
          const provinceCodeField = city.province_code || city.provinceCode || city.province_id || city.provinceId;
          const provinceCodeStr = String(provinceCodeField);
          const provinceCodeNum = Number(provinceCodeField);
          const searchStr = String(provinceCode);
          const searchNum = Number(provinceCode);
          
          // Accept both cities and municipalities
          const officialType = city.type || city.city_type || city.classification || city.psgc_type;
          
          // Accept cities and municipalities
          const isCityOrMunicipality = officialType === 'City' || 
                                     officialType === 'HUC' || 
                                     officialType === 'ICC' || 
                                     officialType === 'Component City' ||
                                     officialType === 'Municipality' ||
                                     officialType === 'Component Municipality' ||
                                     // If no official type, check if it's a reasonable place name
                                     (!officialType && city.name && city.name.length > 0);
          
          // Exclude only obvious non-places (barangays, districts, etc.)
          const isExcluded = city.name.toLowerCase().includes('barangay') ||
                           city.name.toLowerCase().includes('brgy') ||
                           city.name.toLowerCase().includes('village') ||
                           city.name.toLowerCase().includes('settlement') ||
                           city.name.toLowerCase().includes('district') ||
                           city.name.toLowerCase().includes('zone') ||
                           city.name.toLowerCase().includes('area') ||
                           city.name.toLowerCase().includes('region') ||
                           city.name.toLowerCase().includes('province') ||
                           city.name.toLowerCase().includes('island') ||
                           city.name.toLowerCase().includes('is.') ||
                           city.name.toLowerCase().includes('is ') ||
                           (officialType && (
                             officialType.toLowerCase().includes('barangay') ||
                             officialType.toLowerCase().includes('district') ||
                             officialType.toLowerCase().includes('zone')
                           ));
          
          // Accept if it's a city/municipality and not excluded
          const isCity = isCityOrMunicipality && !isExcluded;
          
          const provinceMatch = provinceCodeStr === searchStr || provinceCodeNum === searchNum;
          
          console.log('Place:', city.name, 
            'Type:', officialType,
            'Is City/Municipality:', isCityOrMunicipality,
            'Is Excluded:', isExcluded,
            'Is Included (Final):', isCity,
            'Province Code Field:', provinceCodeField,
            'Province Match:', provinceMatch,
            'Final Match:', provinceMatch && isCity);
            
          return provinceMatch && isCity;
        });
        
        console.log('Filtered cities for selected province:', provinceCities);
        
        // Only show cities/municipalities from the selected province, never show all places
        if (provinceCities.length === 0) {
          console.warn('No cities or municipalities found for selected province. This might indicate that the province has no cities/municipalities or the API structure is different.');
          console.log('Available types in this province:');
          
          // Show what types are available in this province for debugging
          const allProvincePlaces = allCities.filter((city: any) => {
            const provinceCodeField = city.province_code || city.provinceCode || city.province_id || city.provinceId;
            const provinceCodeStr = String(provinceCodeField);
            const provinceCodeNum = Number(provinceCodeField);
            const searchStr = String(provinceCode);
            const searchNum = Number(provinceCode);
            
            return provinceCodeStr === searchStr || provinceCodeNum === searchNum;
          });
          
          const typesInProvince = [...new Set(allProvincePlaces.map(place => 
            place.type || place.city_type || place.classification || place.psgc_type || 'Unknown'
          ))];
          console.log('Types found in province:', typesInProvince);
          
          // Show a few examples
          console.log('Sample places in province:', allProvincePlaces.slice(0, 5).map(place => ({
            name: place.name,
            type: place.type || place.city_type || place.classification || place.psgc_type
          })));
          
          showError('Warning', `No cities or municipalities found for selected province. Found types: ${typesInProvince.join(', ')}. Please check the console for details.`);
        }
        
        const citiesList = provinceCities.map((city: any) => ({
          value: city.code || city.id,
          label: city.name || city.city_name
        }));
        
        console.log('Final cities list (selected province only):', citiesList);
        setCities(citiesList);
      } else {
        console.error('Data is not an array:', allCities);
        throw new Error('Invalid data format from PSGC API');
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      showError('Error', 'Failed to load cities. Please try again.');
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchBarangays = async (cityCode: string) => {
    setLoadingBarangays(true);
    try {
      console.log('Fetching barangays for city code:', cityCode, 'Type:', typeof cityCode);
      
      // Try direct API first, then CORS proxy if needed
      let allBarangaysResponse;
      try {
        allBarangaysResponse = await fetch(`${PSGC_API_BASE}/barangays`);
      } catch (corsError) {
        console.warn('Direct API failed, trying CORS proxy:', corsError);
        // Try with CORS proxy
        allBarangaysResponse = await fetch(`https://cors-anywhere.herokuapp.com/${PSGC_API_BASE}/barangays`, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
      }
      
      if (!allBarangaysResponse.ok) {
        throw new Error(`HTTP ${allBarangaysResponse.status}`);
      }
      
      const allBarangays = await allBarangaysResponse.json();
      
      console.log('All barangays data:', allBarangays);
      console.log('Looking for city code:', cityCode);
      console.log('Total barangays found:', allBarangays.length);
      
      // Show first few barangays to understand the data structure
      if (allBarangays.length > 0) {
        console.log('Sample barangay structure:', allBarangays[0]);
        console.log('Sample barangay keys:', Object.keys(allBarangays[0]));
      }
      
      // Check if data is an array
      if (Array.isArray(allBarangays)) {
        // Try multiple field names and data types for city code
        const cityBarangays = allBarangays.filter((barangay: any) => {
          // Check different possible field names for city code
          const cityCodeField = barangay.city_code || barangay.cityCode || barangay.city_id || barangay.cityId;
          const cityCodeStr = String(cityCodeField);
          const cityCodeNum = Number(cityCodeField);
          const searchStr = String(cityCode);
          const searchNum = Number(cityCode);
          
          console.log('Barangay:', barangay.name, 
            'City Code Field:', cityCodeField,
            'City Code (string):', cityCodeStr,
            'City Code (number):', cityCodeNum,
            'Search (string):', searchStr,
            'Search (number):', searchNum,
            'String match:', cityCodeStr === searchStr,
            'Number match:', cityCodeNum === searchNum);
            
          return cityCodeStr === searchStr || cityCodeNum === searchNum;
        });
        
        console.log('Filtered barangays for selected city:', cityBarangays);
        
        // Only show barangays from the selected city, never show all barangays
        if (cityBarangays.length === 0) {
          console.warn('No barangays found for selected city. Enabling manual input field.');
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
        
        console.log('Final barangays list (selected city only):', barangaysList);
        setBarangays(barangaysList);
      } else {
        console.error('Data is not an array:', allBarangays);
        throw new Error('Invalid data format from PSGC API');
      }
    } catch (error) {
      console.error('Error fetching barangays:', error);
      showError('Error', 'Failed to load barangays. Please try again.');
    } finally {
      setLoadingBarangays(false);
    }
  };

  // Helper functions for cascading dropdowns
  const getAvailableProvinces = () => {
    return provinces;
  };

  const getAvailableCities = () => {
    return cities;
  };

  const getAvailableBarangays = () => {
    return barangays;
  };

  // Helper function to get zip code for a city
  const getZipCodeForCity = (cityName: string): string => {
    if (!cityName) return '';
    
    const normalizedCityName = cityName.toLowerCase()
      .replace(/city/g, '')
      .replace(/municipality/g, '')
      .replace(/mun\./g, '')
      .replace(/mun /g, '')
      .replace(/of /g, '')
      .trim();
    
    // Try exact match first
    if (ZIP_CODE_MAPPING[normalizedCityName]) {
      return ZIP_CODE_MAPPING[normalizedCityName];
    }
    
    // Try partial matches
    for (const [key, zipCode] of Object.entries(ZIP_CODE_MAPPING)) {
      if (normalizedCityName.includes(key) || key.includes(normalizedCityName)) {
        return zipCode;
      }
    }
    
    return '';
  };

  const handleInputChange = (field: keyof ClientFormData, value: string | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Handle cascading dropdowns
      if (field === 'region') {
        // Reset province, city and barangay when region changes
        newData.province = '';
        newData.city = '';
        newData.barangay = '';
        setProvinces([]);
        setCities([]);
        setBarangays([]);
        setShowBarangayInput(false);
        
        // Fetch provinces for the selected region
        if (value) {
          fetchProvinces(value as string);
        }
      } else if (field === 'province') {
        // Reset city and barangay when province changes
        newData.city = '';
        newData.barangay = '';
        setCities([]);
        setBarangays([]);
        setShowBarangayInput(false);
        
        // Fetch cities for the selected province
        if (value) {
          fetchCities(value as string);
        }
      } else if (field === 'city') {
        // Reset barangay when city changes
        newData.barangay = '';
        setBarangays([]);
        setShowBarangayInput(false);
        
        // Auto-populate zip code based on selected city
        if (value) {
          const selectedCity = cities.find(city => city.value === value);
          if (selectedCity) {
            const zipCode = getZipCodeForCity(selectedCity.label);
            if (zipCode) {
              newData.zipCode = zipCode;
              console.log(`Auto-populated zip code for ${selectedCity.label}: ${zipCode}`);
            }
          }
          
          // Fetch barangays for the selected city
          fetchBarangays(value as string);
        } else {
          // Clear zip code if no city selected
          newData.zipCode = '';
        }
      }
      
      return newData;
    });
    
    // Clear error when user starts typing
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
    // Clear error when user makes a selection
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

    // Required fields validation
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
    if (!formData.barangay) newErrors.barangay = 'Barangay is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    if (!formData.telephone.trim()) newErrors.telephone = 'Telephone/Mobile number is required';
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    if (!formData.emergencyName.trim()) newErrors.emergencyName = 'Emergency contact name is required';
    if (!formData.emergencyTelephone.trim()) newErrors.emergencyTelephone = 'Emergency contact number is required';
    if (!formData.emergencyRelationship.trim()) newErrors.emergencyRelationship = 'Emergency contact relationship is required';

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // National ID validation
    if (formData.hasNationalId && !formData.nationalIdNumber.trim()) {
      newErrors.nationalIdNumber = 'National ID number is required when you have a National ID';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Get the actual names from the selected options
      const selectedProvince = provinces.find(p => p.value === formData.province);
      const selectedCity = cities.find(c => c.value === formData.city);
      const selectedBarangay = barangays.find(b => b.value === formData.barangay);
      const selectedRegion = REGION_OPTIONS.find(r => r.value === formData.region);

      // Map form data to API format
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
        barangay: selectedBarangay?.label || formData.barangay, // Use name if available, fallback to code
        city: selectedCity?.label || formData.city, // Use name if available, fallback to code
        province: selectedProvince?.label || formData.province, // Use name if available, fallback to code
        region: selectedRegion?.label || formData.region, // Use name if available, fallback to code
        zip_code: formData.zipCode,
        telephone: formData.telephone,
        email: formData.email,
        emergency_name: formData.emergencyName,
        emergency_telephone: formData.emergencyTelephone,
        emergency_relationship: formData.emergencyRelationship,
        has_national_id: formData.hasNationalId,
        national_id_number: formData.nationalIdNumber
      };

      // Debug: Log the data being sent
      console.log('Sending client data:', apiData);
      
      // Call API to create client
      await clientService.createClient(apiData);
      
      showSuccess('Success!', 'Client profile has been created successfully.');
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
      
      // Reset API data and input field states
      setProvinces([]);
      setCities([]);
      setBarangays([]);
      setShowBarangayInput(false);
    } catch (error: any) {
      console.error('Error creating client:', error);
      let errorMessage = 'Failed to create client profile. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat();
        errorMessage = `Validation failed: ${errorMessages.join(', ')}`;
      }
      
      showError('Error', errorMessage);
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
        
        <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add New Client</h2>
              <p className="text-sm text-gray-600">Fill in the client's information below</p>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto">
            <div className="p-6 space-y-8">
              {/* A. CLIENT'S INFORMATION */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  A. CLIENT'S INFORMATION
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      1. First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`input ${errors.firstName ? 'input-error' : ''}`}
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
                      className="input"
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
                      className={`input ${errors.lastName ? 'input-error' : ''}`}
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
                      className="input"
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
                      maxDate={new Date().toISOString().split('T')[0]} // Prevent future dates
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
                      className="input bg-gray-50"
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
                      className={`select ${errors.civilStatus ? 'input-error' : ''}`}
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
                      className={`select ${errors.sex ? 'input-error' : ''}`}
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
                    <div className="mt-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.socialClassification.includes('Others')}
                          onChange={(e) => handleCheckboxChange('socialClassification', 'Others', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Others:</span>
                        <input
                          type="text"
                          value={formData.socialClassificationOther}
                          onChange={(e) => handleInputChange('socialClassificationOther', e.target.value)}
                          className={`input flex-1 ml-2 ${!formData.socialClassification.includes('Others') ? 'bg-gray-50' : ''}`}
                          placeholder="Please specify"
                          disabled={!formData.socialClassification.includes('Others')}
                        />
                      </label>
                    </div>
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
                      House/ Building No./ Building Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.houseNumber}
                      onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                      className={`input ${errors.houseNumber ? 'input-error' : ''}`}
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
                          '&:hover': {
                            borderColor: errors.region ? '#ef4444' : '#9ca3af',
                          },
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
                      placeholder={
                        loadingProvinces 
                          ? "Loading provinces..." 
                          : formData.region 
                            ? "Select province" 
                            : "Select region first"
                      }
                      isDisabled={!formData.region || loadingProvinces}
                      isLoading={loadingProvinces}
                      styles={{
                        ...selectStyles,
                        control: (provided: any) => ({
                          ...selectStyles.control(provided),
                          borderColor: errors.province ? '#ef4444' : '#d1d5db',
                          backgroundColor: !formData.region ? '#f9fafb' : 'white',
                          '&:hover': {
                            borderColor: errors.province ? '#ef4444' : '#9ca3af',
                          },
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
                      onChange={(selectedOption: any) => handleInputChange('city', selectedOption?.value || '')}
                      options={getAvailableCities()}
                      placeholder={
                        loadingCities 
                          ? "Loading cities..." 
                          : formData.province 
                            ? "Select city" 
                            : "Select province first"
                      }
                      isDisabled={!formData.province || loadingCities}
                      isLoading={loadingCities}
                      styles={{
                        ...selectStyles,
                        control: (provided: any) => ({
                          ...selectStyles.control(provided),
                          borderColor: errors.city ? '#ef4444' : '#d1d5db',
                          backgroundColor: !formData.province ? '#f9fafb' : 'white',
                          '&:hover': {
                            borderColor: errors.city ? '#ef4444' : '#9ca3af',
                          },
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
                      <div>
                        <input
                          type="text"
                          value={formData.barangay}
                          onChange={(e) => handleInputChange('barangay', e.target.value)}
                          placeholder="Enter barangay name"
                          className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            errors.barangay 
                              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300'
                          }`}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          No barangays found for this city. Please enter the barangay name manually.
                        </p>
                      </div>
                    ) : (
                      <Select
                        value={getAvailableBarangays().find(option => option.value === formData.barangay) || null}
                        onChange={(selectedOption: any) => handleInputChange('barangay', selectedOption?.value || '')}
                        options={getAvailableBarangays()}
                        placeholder={
                          loadingBarangays 
                            ? "Loading barangays..." 
                            : formData.city 
                              ? "Select barangay" 
                              : "Select city first"
                        }
                        isDisabled={!formData.city || loadingBarangays}
                        isLoading={loadingBarangays}
                        styles={{
                          ...selectStyles,
                          control: (provided: any) => ({
                            ...selectStyles.control(provided),
                            borderColor: errors.barangay ? '#ef4444' : '#d1d5db',
                            backgroundColor: !formData.city ? '#f9fafb' : 'white',
                            '&:hover': {
                              borderColor: errors.barangay ? '#ef4444' : '#9ca3af',
                            },
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
                      className={`input ${errors.street ? 'input-error' : ''}`}
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
                        className={`input ${errors.zipCode ? 'input-error' : ''} ${
                          formData.city && formData.zipCode ? 'bg-blue-50 border-blue-200' : ''
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
                      className={`input ${errors.telephone ? 'input-error' : ''}`}
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
                      className={`input ${errors.email ? 'input-error' : ''}`}
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
                      className={`input ${errors.emergencyName ? 'input-error' : ''}`}
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
                      className={`input ${errors.emergencyTelephone ? 'input-error' : ''}`}
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
                      className={`input ${errors.emergencyRelationship ? 'input-error' : ''}`}
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
                      <span className="ml-2 text-sm text-gray-700">No</span>
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
                        className={`input ${errors.nationalIdNumber ? 'input-error' : ''}`}
                        placeholder="Enter National ID number"
                      />
                      {errors.nationalIdNumber && <p className="text-xs text-red-500 mt-1">{errors.nationalIdNumber}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Client Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;
