import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import Select from 'react-select';
import Calendar from './Calendar';
import { useToast } from '../../contexts/ToastContext';
import type { Client, ClientFormData as APIClientFormData } from '../../services/clientService';

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

interface ClientFormProps {
  initialData?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isModal?: boolean;
}

export interface ClientFormRef {
  resetForm: () => void;
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

const ClientForm = forwardRef<ClientFormRef, ClientFormProps>(({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  isModal = false
}, ref) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<ClientFormData>({
    firstName: initialData?.firstName || '',
    middleName: initialData?.middleName || '',
    lastName: initialData?.lastName || '',
    suffix: initialData?.suffix || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    age: initialData?.age || '',
    civilStatus: initialData?.civilStatus || '',
    sex: initialData?.sex || '',
    socialClassification: initialData?.socialClassification || [],
    socialClassificationOther: initialData?.socialClassificationOther || '',
    houseNumber: initialData?.houseNumber || '',
    street: initialData?.street || '',
    barangay: initialData?.barangay || '',
    province: initialData?.province || '',
    region: initialData?.region || '10',
    city: initialData?.city || '',
    zipCode: initialData?.zipCode || '',
    telephone: initialData?.telephone || '',
    email: initialData?.email || '',
    emergencyName: initialData?.emergencyName || '',
    emergencyTelephone: initialData?.emergencyTelephone || '',
    emergencyRelationship: initialData?.emergencyRelationship || '',
    hasNationalId: initialData?.hasNationalId || false,
    nationalIdNumber: initialData?.nationalIdNumber || ''
  });


  const [errors, setErrors] = useState<Partial<ClientFormData>>({});
  const [provinces, setProvinces] = useState<Array<{ value: string; label: string }>>([]);
  const [cities, setCities] = useState<Array<{ value: string; label: string }>>([]);
  const [barangays, setBarangays] = useState<Array<{ value: string; label: string }>>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);
  const [loadedProvinces, setLoadedProvinces] = useState<Set<string>>(new Set());
  const [showBarangayInput, setShowBarangayInput] = useState(false);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName || '',
        middleName: initialData.middleName || '',
        lastName: initialData.lastName || '',
        suffix: initialData.suffix || '',
        dateOfBirth: initialData.dateOfBirth || '',
        age: initialData.age || '',
        civilStatus: initialData.civilStatus || '',
        sex: initialData.sex || '',
        socialClassification: initialData.socialClassification || [],
        socialClassificationOther: initialData.socialClassificationOther || '',
        houseNumber: initialData.houseNumber || '',
        street: initialData.street || '',
        barangay: initialData.barangay || '', // This will be the name from database
        province: initialData.province || '', // This will be the name from database
        region: initialData.region || '10',
        city: initialData.city || '', // This will be the name from database
        zipCode: initialData.zipCode || '',
        telephone: initialData.telephone || '',
        email: initialData.email || '',
        emergencyName: initialData.emergencyName || '',
        emergencyTelephone: initialData.emergencyTelephone || '',
        emergencyRelationship: initialData.emergencyRelationship || '',
        hasNationalId: initialData.hasNationalId || false,
        nationalIdNumber: initialData.nationalIdNumber || ''
      });
    }
  }, [initialData]);

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Helper function to find code by name in a list
  const findCodeByName = (name: string, list: Array<{ value: string; label: string }>): string => {
    if (!name || !list.length) return '';
    
    // First try exact match
    let item = list.find(item => item.label === name);
    if (item) return item.value;
    
    // Try case-insensitive match
    item = list.find(item => item.label.toLowerCase() === name.toLowerCase());
    if (item) return item.value;
    
    // Try partial match
    item = list.find(item => 
      item.label.toLowerCase().includes(name.toLowerCase()) || 
      name.toLowerCase().includes(item.label.toLowerCase())
    );
    if (item) return item.value;
    
    console.warn(`No match found for "${name}" in list:`, list.map(l => l.label));
    return '';
  };

  // Update form data with codes when provinces are loaded
  useEffect(() => {
    if (provinces.length > 0 && formData.province && !formData.province.match(/^\d+$/)) {
      // If province is a name (not a code), find the corresponding code
      const provinceCode = findCodeByName(formData.province, provinces);
      if (provinceCode) {
        setFormData(prev => ({ ...prev, province: provinceCode }));
        // Load cities for this province
        loadCities(provinceCode);
      } else {
        console.warn(`Province "${formData.province}" not found in API data. Available provinces:`, provinces.map(p => p.label));
        // Don't try to load cities if province is not found
      }
    }
  }, [provinces, formData.province]);

  // Update form data with codes when cities are loaded
  useEffect(() => {
    if (cities.length > 0 && formData.city && !formData.city.match(/^\d+$/)) {
      // If city is a name (not a code), find the corresponding code
      const cityCode = findCodeByName(formData.city, cities);
      if (cityCode) {
        setFormData(prev => ({ ...prev, city: cityCode }));
        // Load barangays for this city
        loadBarangays(cityCode);
      }
    }
  }, [cities, formData.city]);

  // Update form data with codes when barangays are loaded
  useEffect(() => {
    if (barangays.length > 0 && formData.barangay && !formData.barangay.match(/^\d+$/)) {
      // If barangay is a name (not a code), find the corresponding code
      const barangayCode = findCodeByName(formData.barangay, barangays);
      if (barangayCode) {
        setFormData(prev => ({ ...prev, barangay: barangayCode }));
        setShowBarangayInput(false);
      } else {
        // If barangay name not found in API data, it was manually entered
        setShowBarangayInput(true);
      }
    } else if (barangays.length === 0 && formData.barangay) {
      // If no barangays loaded but we have a barangay value, it was manually entered
      setShowBarangayInput(true);
    }
  }, [barangays, formData.barangay]);

  // Load cities when province changes
  useEffect(() => {
    if (formData.province) {
      loadCities(formData.province);
    }
  }, [formData.province]);

  // Load barangays when city changes
  useEffect(() => {
    if (formData.city) {
      loadBarangays(formData.city);
      // Reset barangay input mode when city changes
      setShowBarangayInput(false);
    }
  }, [formData.city]);

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

  // Auto-update zip code when city changes
  useEffect(() => {
    if (formData.city) {
      const selectedCity = cities.find(city => city.value === formData.city);
      if (selectedCity) {
        const zipCode = getZipCodeForCity(selectedCity.label);
        if (zipCode) {
          setFormData(prev => ({ ...prev, zipCode }));
          console.log(`Auto-populated zip code for ${selectedCity.label}: ${zipCode}`);
        }
      }
    } else {
      // Clear zip code if no city selected
      setFormData(prev => ({ ...prev, zipCode: '' }));
    }
  }, [formData.city, cities]);

  const loadProvinces = async (regionCode: string = '10') => {
    setIsLoadingProvinces(true);
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
            showToast({ type: 'error', title: 'No provinces found for Region X. Please check the console for details.' });
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
      showToast({ type: 'error', title: 'Failed to load provinces. Please try again.' });
    } finally {
      setIsLoadingProvinces(false);
    }
  };

  const loadCities = async (provinceCode: string) => {
    // Prevent infinite loops by checking if we've already loaded cities for this province
    if (loadedProvinces.has(provinceCode)) {
      console.log(`Cities for province ${provinceCode} already loaded, skipping...`);
      return;
    }
    
    setIsLoadingCities(true);
    setLoadedProvinces(prev => new Set(prev).add(provinceCode));
    
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
          
          // Only show error toast once, not repeatedly
          if (typesInProvince.length > 0) {
            console.warn(`No cities found for province code ${provinceCode}. Available types: ${typesInProvince.join(', ')}`);
          } else {
            console.warn(`No data found for province code ${provinceCode}. This might be a data issue.`);
          }
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
      showToast({ type: 'error', title: 'Failed to load cities. Please try again.' });
    } finally {
      setIsLoadingCities(false);
    }
  };

  const loadBarangays = async (cityCode: string) => {
    setIsLoadingBarangays(true);
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
          setBarangays([]);
          setShowBarangayInput(true);
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
      showToast({ type: 'error', title: 'Failed to load barangays. Please try again.' });
    } finally {
      setIsLoadingBarangays(false);
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

  const handleInputChange = (field: keyof ClientFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Auto-calculate age when date of birth changes
    if (field === 'dateOfBirth') {
      const age = calculateAge(value);
      setFormData(prev => ({ ...prev, age }));
    }
  };

  // Helper function to get the display name for a code
  const getDisplayName = (code: string, list: Array<{ value: string; label: string }>): string => {
    if (!code || !list.length) return code;
    const item = list.find(item => item.value === code);
    return item ? item.label : code;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ClientFormData> = {};

    // Required fields validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.civilStatus) newErrors.civilStatus = 'Civil status is required';
    if (!formData.sex) newErrors.sex = 'Sex is required';
    if (!formData.houseNumber.trim()) newErrors.houseNumber = 'House number is required';
    if (!formData.street.trim()) newErrors.street = 'Street is required';
    if (!formData.barangay) newErrors.barangay = 'Barangay is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.province) newErrors.province = 'Province is required';
    if (!formData.telephone.trim()) newErrors.telephone = 'Telephone is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.emergencyName.trim()) newErrors.emergencyName = 'Emergency contact name is required';
    if (!formData.emergencyTelephone.trim()) newErrors.emergencyTelephone = 'Emergency contact telephone is required';
    if (!formData.emergencyRelationship.trim()) newErrors.emergencyRelationship = 'Emergency relationship is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (formData.telephone && !phoneRegex.test(formData.telephone)) {
      newErrors.telephone = 'Please enter a valid phone number';
    }

    if (formData.emergencyTelephone && !phoneRegex.test(formData.emergencyTelephone)) {
      newErrors.emergencyTelephone = 'Please enter a valid phone number';
    }

    // National ID validation
    if (formData.hasNationalId && !formData.nationalIdNumber.trim()) {
      newErrors.nationalIdNumber = 'National ID number is required when ID is available';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast({ type: 'error', title: 'Please fix the errors in the form' });
      return;
    }

    // Convert codes back to names for API submission
    const formDataWithNames = {
      ...formData,
      province: getDisplayName(formData.province, provinces),
      city: getDisplayName(formData.city, cities),
      barangay: showBarangayInput ? formData.barangay : getDisplayName(formData.barangay, barangays)
    };

    onSubmit(formDataWithNames);
  };

  const resetForm = () => {
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
      region: '10',
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
    setErrors({});
  };

  useImperativeHandle(ref, () => ({
    resetForm
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={`input ${errors.firstName ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
            <input
              type="text"
              value={formData.middleName}
              onChange={(e) => handleInputChange('middleName', e.target.value)}
              className="input"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={`input ${errors.lastName ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suffix</label>
            <input
              type="text"
              value={formData.suffix}
              onChange={(e) => handleInputChange('suffix', e.target.value)}
              className="input"
              disabled={isLoading}
              placeholder="Jr., Sr., III, etc."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <Calendar
              value={formData.dateOfBirth}
              onChange={(date) => handleInputChange('dateOfBirth', date)}
              disabled={isLoading}
            />
            {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="text"
              value={formData.age}
              className="input bg-gray-50"
              disabled
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Civil Status <span className="text-red-500">*</span>
            </label>
            <Select
              value={CIVIL_STATUS_OPTIONS.find(option => option.value === formData.civilStatus)}
              onChange={(option) => handleInputChange('civilStatus', option?.value || '')}
              options={CIVIL_STATUS_OPTIONS}
              isDisabled={isLoading}
              className="react-select-container"
              classNamePrefix="react-select"
            />
            {errors.civilStatus && <p className="text-red-500 text-xs mt-1">{errors.civilStatus}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sex <span className="text-red-500">*</span>
            </label>
            <Select
              value={SEX_OPTIONS.find(option => option.value === formData.sex)}
              onChange={(option) => handleInputChange('sex', option?.value || '')}
              options={SEX_OPTIONS}
              isDisabled={isLoading}
              className="react-select-container"
              classNamePrefix="react-select"
            />
            {errors.sex && <p className="text-red-500 text-xs mt-1">{errors.sex}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Social Classification</label>
          <Select
            isMulti
            value={SOCIAL_CLASSIFICATION_OPTIONS.filter(option => 
              formData.socialClassification.includes(option.value)
            )}
            onChange={(options) => handleInputChange('socialClassification', 
              options ? options.map(option => option.value) : []
            )}
            options={SOCIAL_CLASSIFICATION_OPTIONS}
            isDisabled={isLoading}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        {formData.socialClassification.includes('Other') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other Classification</label>
            <input
              type="text"
              value={formData.socialClassificationOther}
              onChange={(e) => handleInputChange('socialClassificationOther', e.target.value)}
              className="input"
              disabled={isLoading}
              placeholder="Please specify"
            />
          </div>
        )}
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              House Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.houseNumber}
              onChange={(e) => handleInputChange('houseNumber', e.target.value)}
              className={`input ${errors.houseNumber ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.houseNumber && <p className="text-red-500 text-xs mt-1">{errors.houseNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) => handleInputChange('street', e.target.value)}
              className={`input ${errors.street ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Province <span className="text-red-500">*</span>
            </label>
            <Select
              value={provinces.find(option => option.value === formData.province)}
              onChange={(option) => {
                handleInputChange('province', option?.value || '');
                setCities([]);
                setBarangays([]);
                handleInputChange('city', '');
                handleInputChange('barangay', '');
              }}
              options={provinces}
              isLoading={isLoadingProvinces}
              isDisabled={isLoading || isLoadingProvinces}
              className="react-select-container"
              classNamePrefix="react-select"
            />
            {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <Select
              value={cities.find(option => option.value === formData.city)}
              onChange={(option) => {
                handleInputChange('city', option?.value || '');
                setBarangays([]);
                handleInputChange('barangay', '');
              }}
              options={cities}
              isLoading={isLoadingCities}
              isDisabled={isLoading || isLoadingCities || !formData.province}
              className="react-select-container"
              classNamePrefix="react-select"
            />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
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
                  className={`input ${errors.barangay ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  No barangays found for this city. Please enter the barangay name manually.
                </p>
              </div>
            ) : (
              <Select
                value={barangays.find(option => option.value === formData.barangay)}
                onChange={(option) => handleInputChange('barangay', option?.value || '')}
                options={barangays}
                isLoading={isLoadingBarangays}
                isDisabled={isLoading || isLoadingBarangays || !formData.city}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            )}
            {errors.barangay && <p className="text-red-500 text-xs mt-1">{errors.barangay}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <Select
              value={REGION_OPTIONS.find(option => option.value === formData.region)}
              onChange={(option) => handleInputChange('region', option?.value || '')}
              options={REGION_OPTIONS}
              isDisabled={isLoading}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              className="input"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telephone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={(e) => handleInputChange('telephone', e.target.value)}
              className={`input ${errors.telephone ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`input ${errors.email ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.emergencyName}
              onChange={(e) => handleInputChange('emergencyName', e.target.value)}
              className={`input ${errors.emergencyName ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.emergencyName && <p className="text-red-500 text-xs mt-1">{errors.emergencyName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telephone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.emergencyTelephone}
              onChange={(e) => handleInputChange('emergencyTelephone', e.target.value)}
              className={`input ${errors.emergencyTelephone ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.emergencyTelephone && <p className="text-red-500 text-xs mt-1">{errors.emergencyTelephone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.emergencyRelationship}
              onChange={(e) => handleInputChange('emergencyRelationship', e.target.value)}
              className={`input ${errors.emergencyRelationship ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.emergencyRelationship && <p className="text-red-500 text-xs mt-1">{errors.emergencyRelationship}</p>}
          </div>
        </div>
      </div>

      {/* National ID */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">National ID</h3>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.hasNationalId}
              onChange={(e) => handleInputChange('hasNationalId', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-700">Has National ID</span>
          </label>
        </div>

        {formData.hasNationalId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              National ID Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nationalIdNumber}
              onChange={(e) => handleInputChange('nationalIdNumber', e.target.value)}
              className={`input ${errors.nationalIdNumber ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.nationalIdNumber && <p className="text-red-500 text-xs mt-1">{errors.nationalIdNumber}</p>}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className={`btn btn-secondary ${isModal ? "text-xs py-1.5 px-3" : "text-sm"}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={`btn btn-primary flex items-center space-x-2 ${isModal ? "text-xs py-1.5 px-3" : "text-sm"}`}
        >
          {isLoading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          <span>{isLoading ? 'Updating...' : 'Update Client'}</span>
        </button>
      </div>
    </form>
  );
});

ClientForm.displayName = 'ClientForm';

export default ClientForm;
