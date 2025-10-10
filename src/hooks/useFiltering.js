import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for table filtering with multiple filter types
 * @param {Array} data - Array of data to filter
 * @param {Object} options - Configuration options
 * @returns {Object} - Filtered data and filter controls
 */
export function useTableFilters(data = [], options = {}) {
  const { 
    searchFields = [], 
    defaultFilters = {},
    caseSensitive = false,
    debounceMs = 300
  } = options;

  const [filters, setFilters] = useState(defaultFilters);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Apply all filters to the data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchTerm && searchFields.length > 0) {
      const searchValue = caseSensitive ? searchTerm : searchTerm.toLowerCase();
      result = result.filter(item => {
        return searchFields.some(field => {
          const fieldValue = getNestedValue(item, field);
          if (fieldValue == null) return false;
          
          const stringValue = caseSensitive 
            ? String(fieldValue) 
            : String(fieldValue).toLowerCase();
          
          return stringValue.includes(searchValue);
        });
      });
    }

    // Apply custom filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        result = result.filter(item => {
          const itemValue = getNestedValue(item, key);
          
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
            // Range filter
            const numValue = Number(itemValue);
            return numValue >= value.min && numValue <= value.max;
          } else if (typeof value === 'object' && (value.start || value.end)) {
            // Date range filter
            const itemDate = new Date(itemValue);
            const startDate = value.start ? new Date(value.start) : new Date(0);
            const endDate = value.end ? new Date(value.end) : new Date();
            return itemDate >= startDate && itemDate <= endDate;
          } else {
            return itemValue === value;
          }
        });
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, filters, sortConfig, searchFields, caseSensitive]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const removeFilter = useCallback((key) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setSortConfig({ key: null, direction: 'asc' });
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const getFilterSummary = useCallback(() => {
    const activeFilters = Object.entries(filters).filter(([_, value]) => 
      value !== null && value !== undefined && value !== ''
    );
    
    return {
      totalFilters: activeFilters.length + (searchTerm ? 1 : 0),
      hasActiveFilters: activeFilters.length > 0 || searchTerm,
      searchActive: !!searchTerm,
      sortActive: !!sortConfig.key,
      filteredCount: filteredData.length,
      totalCount: data.length
    };
  }, [filters, searchTerm, sortConfig.key, filteredData.length, data.length]);

  return {
    filteredData,
    filters,
    searchTerm,
    sortConfig,
    updateFilter,
    removeFilter,
    clearAllFilters,
    setSearchTerm,
    handleSort,
    getFilterSummary
  };
}

/**
 * Custom hook for advanced search with multiple criteria
 * @param {Array} data - Array of data to search
 * @param {Object} options - Configuration options
 * @returns {Object} - Search results and controls
 */
export function useAdvancedSearch(data = [], options = {}) {
  const {
    searchFields = [],
    operators = ['contains', 'equals', 'startsWith', 'endsWith', 'greaterThan', 'lessThan'],
    caseSensitive = false
  } = options;

  const [searchCriteria, setSearchCriteria] = useState([]);
  const [logicalOperator, setLogicalOperator] = useState('AND'); // AND or OR

  const searchResults = useMemo(() => {
    if (searchCriteria.length === 0) return data;

    return data.filter(item => {
      const results = searchCriteria.map(criteria => {
        const { field, operator, value } = criteria;
        const itemValue = getNestedValue(item, field);
        
        return evaluateCondition(itemValue, operator, value, caseSensitive);
      });

      return logicalOperator === 'AND' 
        ? results.every(result => result)
        : results.some(result => result);
    });
  }, [data, searchCriteria, logicalOperator, caseSensitive]);

  const addCriteria = useCallback((field, operator, value) => {
    setSearchCriteria(prev => [...prev, { field, operator, value, id: Date.now() }]);
  }, []);

  const removeCriteria = useCallback((id) => {
    setSearchCriteria(prev => prev.filter(criteria => criteria.id !== id));
  }, []);

  const updateCriteria = useCallback((id, updates) => {
    setSearchCriteria(prev => prev.map(criteria => 
      criteria.id === id ? { ...criteria, ...updates } : criteria
    ));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchCriteria([]);
  }, []);

  return {
    searchResults,
    searchCriteria,
    logicalOperator,
    setLogicalOperator,
    addCriteria,
    removeCriteria,
    updateCriteria,
    clearSearch,
    hasActiveCriteria: searchCriteria.length > 0
  };
}

/**
 * Custom hook for date range filtering
 * @param {Array} data - Array of data to filter
 * @param {string} dateField - Field name containing the date
 * @param {Object} options - Configuration options
 * @returns {Object} - Filtered data and date controls
 */
export function useDateRangeFilter(data = [], dateField, options = {}) {
  const { 
    defaultRange = null,
    presets = [
      { label: 'Today', value: 'today' },
      { label: 'Yesterday', value: 'yesterday' },
      { label: 'Last 7 days', value: 'last7days' },
      { label: 'Last 30 days', value: 'last30days' },
      { label: 'This month', value: 'thisMonth' },
      { label: 'Last month', value: 'lastMonth' },
      { label: 'This year', value: 'thisYear' }
    ]
  } = options;

  const [dateRange, setDateRange] = useState(defaultRange);
  const [selectedPreset, setSelectedPreset] = useState(null);

  const filteredData = useMemo(() => {
    if (!dateRange || !dateField) return data;

    const { start, end } = dateRange;
    if (!start && !end) return data;

    return data.filter(item => {
      const itemDate = new Date(getNestedValue(item, dateField));
      if (isNaN(itemDate.getTime())) return false;

      const startDate = start ? new Date(start) : new Date(0);
      const endDate = end ? new Date(end) : new Date();

      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [data, dateRange, dateField]);

  const applyPreset = useCallback((presetValue) => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    let range = null;

    switch (presetValue) {
      case 'today':
        range = { start: startOfDay, end: endOfDay };
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
        range = { start: startOfYesterday, end: endOfYesterday };
        break;
      case 'last7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        range = { start: sevenDaysAgo, end: endOfDay };
        break;
      case 'last30days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        range = { start: thirtyDaysAgo, end: endOfDay };
        break;
      case 'thisMonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        range = { start: startOfMonth, end: endOfMonth };
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
        range = { start: lastMonth, end: endOfLastMonth };
        break;
      case 'thisYear':
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
        range = { start: startOfYear, end: endOfYear };
        break;
      default:
        range = null;
    }

    setDateRange(range);
    setSelectedPreset(presetValue);
  }, []);

  const setCustomRange = useCallback((start, end) => {
    setDateRange({ start, end });
    setSelectedPreset(null);
  }, []);

  const clearDateFilter = useCallback(() => {
    setDateRange(null);
    setSelectedPreset(null);
  }, []);

  return {
    filteredData,
    dateRange,
    selectedPreset,
    presets,
    applyPreset,
    setCustomRange,
    clearDateFilter,
    hasDateFilter: !!dateRange
  };
}

/**
 * Custom hook for status-based filtering
 * @param {Array} data - Array of data to filter
 * @param {string} statusField - Field name containing the status
 * @param {Object} options - Configuration options
 * @returns {Object} - Filtered data and status controls
 */
export function useStatusFilter(data = [], statusField, options = {}) {
  const { 
    statusOptions = [],
    allowMultiple = true,
    defaultStatuses = []
  } = options;

  const [selectedStatuses, setSelectedStatuses] = useState(defaultStatuses);

  // Extract unique statuses from data if not provided
  const availableStatuses = useMemo(() => {
    if (statusOptions.length > 0) return statusOptions;

    const uniqueStatuses = [...new Set(
      data.map(item => getNestedValue(item, statusField)).filter(Boolean)
    )];

    return uniqueStatuses.map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
      count: data.filter(item => getNestedValue(item, statusField) === status).length
    }));
  }, [data, statusField, statusOptions]);

  const filteredData = useMemo(() => {
    if (selectedStatuses.length === 0) return data;

    return data.filter(item => {
      const itemStatus = getNestedValue(item, statusField);
      return selectedStatuses.includes(itemStatus);
    });
  }, [data, selectedStatuses, statusField]);

  const toggleStatus = useCallback((status) => {
    if (allowMultiple) {
      setSelectedStatuses(prev => 
        prev.includes(status)
          ? prev.filter(s => s !== status)
          : [...prev, status]
      );
    } else {
      setSelectedStatuses(prev => 
        prev.includes(status) ? [] : [status]
      );
    }
  }, [allowMultiple]);

  const selectAllStatuses = useCallback(() => {
    setSelectedStatuses(availableStatuses.map(status => status.value));
  }, [availableStatuses]);

  const clearStatusFilter = useCallback(() => {
    setSelectedStatuses([]);
  }, []);

  const getStatusSummary = useCallback(() => {
    return availableStatuses.map(status => ({
      ...status,
      selected: selectedStatuses.includes(status.value),
      filteredCount: selectedStatuses.length === 0 
        ? status.count 
        : selectedStatuses.includes(status.value) 
          ? data.filter(item => getNestedValue(item, statusField) === status.value).length 
          : 0
    }));
  }, [availableStatuses, selectedStatuses, data, statusField]);

  return {
    filteredData,
    selectedStatuses,
    availableStatuses,
    toggleStatus,
    selectAllStatuses,
    clearStatusFilter,
    getStatusSummary,
    hasStatusFilter: selectedStatuses.length > 0
  };
}

// Utility functions
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function evaluateCondition(itemValue, operator, searchValue, caseSensitive) {
  if (itemValue == null) return false;

  const itemStr = caseSensitive ? String(itemValue) : String(itemValue).toLowerCase();
  const searchStr = caseSensitive ? String(searchValue) : String(searchValue).toLowerCase();

  switch (operator) {
    case 'contains':
      return itemStr.includes(searchStr);
    case 'equals':
      return itemValue === searchValue;
    case 'startsWith':
      return itemStr.startsWith(searchStr);
    case 'endsWith':
      return itemStr.endsWith(searchStr);
    case 'greaterThan':
      return Number(itemValue) > Number(searchValue);
    case 'lessThan':
      return Number(itemValue) < Number(searchValue);
    case 'greaterThanOrEqual':
      return Number(itemValue) >= Number(searchValue);
    case 'lessThanOrEqual':
      return Number(itemValue) <= Number(searchValue);
    default:
      return false;
  }
}
