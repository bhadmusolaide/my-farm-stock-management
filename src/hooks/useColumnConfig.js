import { useState, useEffect } from 'react';

const useColumnConfig = (tableId, defaultColumns) => {
  const storageKey = `columnConfig_${tableId}`;
  
  // Initialize visible columns from localStorage or use all columns as default
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that saved columns still exist in current column definitions
        const validColumns = parsed.filter(colKey => 
          defaultColumns.some(col => col.key === colKey)
        );
        return validColumns.length > 0 ? validColumns : defaultColumns.map(col => col.key);
      }
    } catch (error) {
      console.warn('Failed to load column config from localStorage:', error);
    }
    return defaultColumns.map(col => col.key);
  });

  // Save to localStorage whenever visibleColumns changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
    } catch (error) {
      console.warn('Failed to save column config to localStorage:', error);
    }
  }, [visibleColumns, storageKey]);

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => {
      if (prev.includes(columnKey)) {
        // Don't allow hiding the last column
        if (prev.length <= 1) {
          return prev;
        }
        return prev.filter(key => key !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  const showAllColumns = () => {
    setVisibleColumns(defaultColumns.map(col => col.key));
  };

  const hideAllColumns = () => {
    // Keep at least the first column visible
    setVisibleColumns([defaultColumns[0]?.key].filter(Boolean));
  };

  const resetToDefault = () => {
    setVisibleColumns(defaultColumns.map(col => col.key));
  };

  const isColumnVisible = (columnKey) => {
    return visibleColumns.includes(columnKey);
  };

  const getVisibleColumnsData = () => {
    return defaultColumns.filter(col => visibleColumns.includes(col.key));
  };

  const getVisibleColumnsCount = () => {
    return visibleColumns.length;
  };

  return {
    visibleColumns,
    toggleColumn,
    showAllColumns,
    hideAllColumns,
    resetToDefault,
    isColumnVisible,
    getVisibleColumnsData,
    getVisibleColumnsCount
  };
};

export default useColumnConfig;