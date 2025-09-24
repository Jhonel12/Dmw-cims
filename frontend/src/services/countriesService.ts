export interface Country {
  value: string;
  label: string;
  flag: string;
  cca2: string;
}

export interface RestCountry {
  name: {
    common: string;
    official: string;
  };
  cca2: string;
  flags: {
    png: string;
    svg: string;
    alt: string;
  };
}

let countriesCache: Country[] | null = null;


export const fetchCountries = async (): Promise<Country[]> => {
  if (countriesCache) {
    return countriesCache;
  }

  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flags');
    
    if (!response.ok) {
      throw new Error('Failed to fetch countries');
    }

    const data: RestCountry[] = await response.json();
    
    // Transform the data to our format
    const countries: Country[] = data
      .map((country) => ({
        value: country.name.common,
        label: country.name.common,
        flag: country.flags.png,
        cca2: country.cca2,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    countriesCache = countries;
    return countries;
  } catch (error) {
    console.error('Error fetching countries:', error);
    // Return a fallback list of common countries
    return getFallbackCountries();
  }
};

const getFallbackCountries = (): Country[] => {
  return [
    { value: 'United States', label: 'United States', flag: '', cca2: 'US' },
    { value: 'Canada', label: 'Canada', flag: '', cca2: 'CA' },
    { value: 'United Kingdom', label: 'United Kingdom', flag: '', cca2: 'GB' },
    { value: 'Australia', label: 'Australia', flag: '', cca2: 'AU' },
    { value: 'Germany', label: 'Germany', flag: '', cca2: 'DE' },
    { value: 'France', label: 'France', flag: '', cca2: 'FR' },
    { value: 'Japan', label: 'Japan', flag: '', cca2: 'JP' },
    { value: 'South Korea', label: 'South Korea', flag: '', cca2: 'KR' },
    { value: 'Singapore', label: 'Singapore', flag: '', cca2: 'SG' },
    { value: 'United Arab Emirates', label: 'United Arab Emirates', flag: '', cca2: 'AE' },
    { value: 'Saudi Arabia', label: 'Saudi Arabia', flag: '', cca2: 'SA' },
    { value: 'Qatar', label: 'Qatar', flag: '', cca2: 'QA' },
    { value: 'Kuwait', label: 'Kuwait', flag: '', cca2: 'KW' },
    { value: 'Bahrain', label: 'Bahrain', flag: '', cca2: 'BH' },
    { value: 'Oman', label: 'Oman', flag: '', cca2: 'OM' },
    { value: 'Italy', label: 'Italy', flag: '', cca2: 'IT' },
    { value: 'Spain', label: 'Spain', flag: '', cca2: 'ES' },
    { value: 'Netherlands', label: 'Netherlands', flag: '', cca2: 'NL' },
    { value: 'Switzerland', label: 'Switzerland', flag: '', cca2: 'CH' },
    { value: 'Norway', label: 'Norway', flag: '', cca2: 'NO' },
    { value: 'Sweden', label: 'Sweden', flag: '', cca2: 'SE' },
    { value: 'Denmark', label: 'Denmark', flag: '', cca2: 'DK' },
    { value: 'Finland', label: 'Finland', flag: '', cca2: 'FI' },
    { value: 'New Zealand', label: 'New Zealand', flag: '', cca2: 'NZ' },
    { value: 'Hong Kong', label: 'Hong Kong', flag: '', cca2: 'HK' },
    { value: 'Taiwan', label: 'Taiwan', flag: '', cca2: 'TW' },
    { value: 'Malaysia', label: 'Malaysia', flag: '', cca2: 'MY' },
    { value: 'Thailand', label: 'Thailand', flag: '', cca2: 'TH' },
    { value: 'Philippines', label: 'Philippines', flag: '', cca2: 'PH' },
    { value: 'Indonesia', label: 'Indonesia', flag: '', cca2: 'ID' },
    { value: 'Vietnam', label: 'Vietnam', flag: '', cca2: 'VN' },
    { value: 'China', label: 'China', flag: '', cca2: 'CN' },
    { value: 'India', label: 'India', flag: '', cca2: 'IN' },
    { value: 'Brazil', label: 'Brazil', flag: '', cca2: 'BR' },
    { value: 'Mexico', label: 'Mexico', flag: '', cca2: 'MX' },
    { value: 'Argentina', label: 'Argentina', flag: '', cca2: 'AR' },
    { value: 'Chile', label: 'Chile', flag: '', cca2: 'CL' },
    { value: 'South Africa', label: 'South Africa', flag: '', cca2: 'ZA' },
    { value: 'Egypt', label: 'Egypt', flag: '', cca2: 'EG' },
    { value: 'Israel', label: 'Israel', flag: '', cca2: 'IL' },
    { value: 'Turkey', label: 'Turkey', flag: '', cca2: 'TR' },
    { value: 'Russia', label: 'Russia', flag: '', cca2: 'RU' },
  ];
};
