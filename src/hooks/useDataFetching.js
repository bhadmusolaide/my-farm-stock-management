import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for handling async operations with loading, error, and success states
 * @param {Function} asyncFunction - The async function to execute
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, execute, reset }
 */
export function useAsyncOperation(asyncFunction, options = {}) {
  const {
    immediate = false,
    onSuccess,
    onError,
    initialData = null
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await asyncFunction(...args);
      
      if (mountedRef.current) {
        setData(result);
        if (onSuccess) onSuccess(result);
      }
      
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        if (onError) onError(err);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [asyncFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
}

/**
 * Custom hook for data loading with caching and refresh capabilities
 * @param {Function} dataLoader - Function that returns a promise with data
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, refresh, lastUpdated }
 */
export function useDataLoader(dataLoader, options = {}) {
  const {
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    refreshInterval,
    dependencies = [],
    enabled = true
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const loadData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache if not forcing refresh
    if (!force && cacheKey && lastUpdated) {
      const cacheAge = Date.now() - lastUpdated;
      if (cacheAge < cacheDuration) {
        return data;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await dataLoader();
      
      if (mountedRef.current) {
        setData(result);
        setLastUpdated(Date.now());
        
        // Cache to localStorage if cacheKey provided
        if (cacheKey) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              data: result,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.warn('Failed to cache data:', e);
          }
        }
      }
      
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [dataLoader, enabled, cacheKey, cacheDuration, lastUpdated, data]);

  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  // Load data on mount and dependency changes
  useEffect(() => {
    if (enabled) {
      // Try to load from cache first
      if (cacheKey) {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { data: cachedData, timestamp } = JSON.parse(cached);
            const cacheAge = Date.now() - timestamp;
            
            if (cacheAge < cacheDuration) {
              setData(cachedData);
              setLastUpdated(timestamp);
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to load cached data:', e);
        }
      }
      
      loadData();
    }
  }, [enabled, ...dependencies]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && enabled) {
      intervalRef.current = setInterval(() => {
        loadData(true);
      }, refreshInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refreshInterval, enabled, loadData]);

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated
  };
}

/**
 * Custom hook for paginated data with search and filtering
 * @param {Function} dataFetcher - Function that fetches data (page, pageSize, filters) => Promise
 * @param {Object} options - Configuration options
 * @returns {Object} - Pagination state and controls
 */
export function usePaginatedData(dataFetcher, options = {}) {
  const {
    initialPage = 1,
    initialPageSize = 10,
    initialFilters = {},
    enabled = true
  } = options;

  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await dataFetcher(currentPage, pageSize, filters);
      
      setData(result.data || []);
      setTotalCount(result.totalCount || 0);
    } catch (err) {
      setError(err);
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [dataFetcher, currentPage, pageSize, filters, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const changePageSize = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const nextPage = useCallback(() => {
    const totalPages = Math.ceil(totalCount / pageSize);
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalCount, pageSize]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  return {
    // Data
    data,
    totalCount,
    loading,
    error,
    
    // Pagination
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    
    // Filters
    filters,
    
    // Actions
    goToPage,
    nextPage,
    previousPage,
    changePageSize,
    updateFilters,
    refresh
  };
}

/**
 * Custom hook for real-time data updates using polling or WebSocket
 * @param {Function} dataFetcher - Function to fetch data
 * @param {Object} options - Configuration options
 * @returns {Object} - Real-time data state
 */
export function useRealTimeData(dataFetcher, options = {}) {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    onUpdate,
    onError
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await dataFetcher();
      
      if (mountedRef.current) {
        setData(prevData => {
          if (onUpdate && prevData !== null) {
            onUpdate(result, prevData);
          }
          return result;
        });
        setIsConnected(true);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        setIsConnected(false);
        if (onError) onError(err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [dataFetcher, onUpdate, onError]);

  useEffect(() => {
    if (enabled) {
      // Initial fetch
      fetchData();
      
      // Set up polling
      intervalRef.current = setInterval(fetchData, interval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      setIsConnected(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [enabled, interval, fetchData]);

  const start = useCallback(() => {
    if (!intervalRef.current) {
      fetchData();
      intervalRef.current = setInterval(fetchData, interval);
    }
  }, [fetchData, interval]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsConnected(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    isConnected,
    start,
    stop,
    refresh: fetchData
  };
}
