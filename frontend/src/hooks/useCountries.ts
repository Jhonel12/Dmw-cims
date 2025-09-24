import { useState, useEffect } from 'react';
import { fetchCountries, type Country } from '../services/countriesService';

export const useCountries = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchCountries();
        setCountries(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load countries');
        console.error('Error loading countries:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCountries();
  }, []);

  return { countries, isLoading, error };
};
