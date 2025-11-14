import { useCallback, useState } from 'react';
import { FilterState } from '../types/conflict';

interface URLStateParams {
  filters: FilterState;
}

export function useURLState() {
  const [isInitialized, setIsInitialized] = useState(false);

  const parseURLState = useCallback((): Partial<URLStateParams> => {
    const params = new URLSearchParams(window.location.search);
    const state: Partial<URLStateParams> = {};

    const region = params.get('region');
    const severity = params.get('severity');
    const timeline = params.get('timeline');
    const searchQuery = params.get('search');

    if (region || severity || timeline || searchQuery) {
      state.filters = {
        region: region || 'All Regions',
        severity: severity || 'All Severities',
        timeline: timeline || 'All Time',
        searchQuery: searchQuery || '',
      };
    }

    return state;
  }, []);

  const updateURL = useCallback((filters: FilterState) => {
    const params = new URLSearchParams();

    if (filters.region !== 'All Regions') {
      params.set('region', filters.region);
    }
    if (filters.severity !== 'All Severities') {
      params.set('severity', filters.severity);
    }
    if (filters.timeline !== 'All Time') {
      params.set('timeline', filters.timeline);
    }
    if (filters.searchQuery) {
      params.set('search', filters.searchQuery);
    }

    const newURL = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newURL);
  }, []);

  return {
    parseURLState,
    updateURL,
    isInitialized,
    setIsInitialized,
  };
}
