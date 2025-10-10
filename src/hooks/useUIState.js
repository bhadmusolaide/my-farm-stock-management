import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for modal state management
 * @param {Object} options - Configuration options
 * @returns {Object} - Modal state and controls
 */
export function useModal(options = {}) {
  const { 
    defaultOpen = false,
    closeOnEscape = true,
    closeOnOverlayClick = true,
    onOpen,
    onClose
  } = options;

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [data, setData] = useState(null);
  const previousFocusRef = useRef(null);

  const open = useCallback((modalData = null) => {
    // Store the currently focused element
    previousFocusRef.current = document.activeElement;
    
    setIsOpen(true);
    setData(modalData);
    
    if (onOpen) onOpen(modalData);
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
    
    // Restore focus to the previously focused element
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
    
    if (onClose) onClose();
  }, [onClose]);

  const toggle = useCallback((modalData = null) => {
    if (isOpen) {
      close();
    } else {
      open(modalData);
    }
  }, [isOpen, open, close]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, close]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = useCallback((event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      close();
    }
  }, [closeOnOverlayClick, close]);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    handleOverlayClick
  };
}

/**
 * Custom hook for notification management
 * @param {Object} options - Configuration options
 * @returns {Object} - Notification state and controls
 */
export function useNotification(options = {}) {
  const { 
    defaultDuration = 5000,
    maxNotifications = 5,
    position = 'top-right'
  } = options;

  const [notifications, setNotifications] = useState([]);
  const timeoutRefs = useRef(new Map());

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: defaultDuration,
      ...notification
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    // Auto-remove notification after duration
    if (newNotification.duration > 0) {
      const timeoutId = setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
      
      timeoutRefs.current.set(id, timeoutId);
    }

    return id;
  }, [defaultDuration, maxNotifications]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    // Clear timeout if exists
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    
    // Clear all timeouts
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutRefs.current.clear();
  }, []);

  // Convenience methods for different notification types
  const success = useCallback((message, options = {}) => {
    return addNotification({ ...options, message, type: 'success' });
  }, [addNotification]);

  const error = useCallback((message, options = {}) => {
    return addNotification({ ...options, message, type: 'error', duration: 0 }); // Errors don't auto-dismiss
  }, [addNotification]);

  const warning = useCallback((message, options = {}) => {
    return addNotification({ ...options, message, type: 'warning' });
  }, [addNotification]);

  const info = useCallback((message, options = {}) => {
    return addNotification({ ...options, message, type: 'info' });
  }, [addNotification]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info,
    position
  };
}

/**
 * Custom hook for localStorage with JSON serialization
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {Array} - [value, setValue, removeValue]
 */
export function useLocalStorage(key, initialValue) {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Function to remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Custom hook for table operations (selection, bulk actions, etc.)
 * @param {Array} data - Array of table data
 * @param {Object} options - Configuration options
 * @returns {Object} - Table operation state and controls
 */
export function useTableOperations(data = [], options = {}) {
  const { 
    idField = 'id',
    allowMultiSelect = true,
    selectAllOnMount = false
  } = options;

  const [selectedItems, setSelectedItems] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);

  // Initialize selection if selectAllOnMount is true
  useEffect(() => {
    if (selectAllOnMount && data.length > 0) {
      const allIds = new Set(data.map(item => item[idField]));
      setSelectedItems(allIds);
    }
  }, [selectAllOnMount, data, idField]);

  const selectItem = useCallback((itemId, index = null) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        if (!allowMultiSelect) {
          newSelection.clear();
        }
        newSelection.add(itemId);
      }
      
      return newSelection;
    });
    
    setLastSelectedIndex(index);
  }, [allowMultiSelect]);

  const selectRange = useCallback((startIndex, endIndex) => {
    if (!allowMultiSelect) return;

    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      
      for (let i = start; i <= end; i++) {
        if (data[i]) {
          newSelection.add(data[i][idField]);
        }
      }
      
      return newSelection;
    });
  }, [allowMultiSelect, data, idField]);

  const handleItemClick = useCallback((itemId, index, event) => {
    if (event.shiftKey && allowMultiSelect && lastSelectedIndex !== null) {
      selectRange(lastSelectedIndex, index);
    } else if (event.ctrlKey || event.metaKey) {
      selectItem(itemId, index);
    } else {
      // Regular click - select only this item
      setSelectedItems(new Set([itemId]));
      setLastSelectedIndex(index);
    }
  }, [allowMultiSelect, lastSelectedIndex, selectItem, selectRange]);

  const selectAll = useCallback(() => {
    const allIds = new Set(data.map(item => item[idField]));
    setSelectedItems(allIds);
  }, [data, idField]);

  const deselectAll = useCallback(() => {
    setSelectedItems(new Set());
    setLastSelectedIndex(null);
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedItems.size === data.length) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [selectedItems.size, data.length, selectAll, deselectAll]);

  const isSelected = useCallback((itemId) => {
    return selectedItems.has(itemId);
  }, [selectedItems]);

  const getSelectedItems = useCallback(() => {
    return data.filter(item => selectedItems.has(item[idField]));
  }, [data, selectedItems, idField]);

  const bulkAction = useCallback((action) => {
    const selected = getSelectedItems();
    if (selected.length === 0) return;

    return action(selected);
  }, [getSelectedItems]);

  const isAllSelected = selectedItems.size > 0 && selectedItems.size === data.length;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < data.length;

  return {
    selectedItems: Array.from(selectedItems),
    selectedCount: selectedItems.size,
    isAllSelected,
    isIndeterminate,
    selectItem,
    selectRange,
    handleItemClick,
    selectAll,
    deselectAll,
    toggleSelectAll,
    isSelected,
    getSelectedItems,
    bulkAction
  };
}

/**
 * Custom hook for managing loading states
 * @param {boolean} initialLoading - Initial loading state
 * @returns {Object} - Loading state and controls
 */
export function useLoading(initialLoading = false) {
  const [loading, setLoading] = useState(initialLoading);
  const [loadingStates, setLoadingStates] = useState({});

  const startLoading = useCallback((key = 'default') => {
    if (key === 'default') {
      setLoading(true);
    } else {
      setLoadingStates(prev => ({ ...prev, [key]: true }));
    }
  }, []);

  const stopLoading = useCallback((key = 'default') => {
    if (key === 'default') {
      setLoading(false);
    } else {
      setLoadingStates(prev => {
        const newStates = { ...prev };
        delete newStates[key];
        return newStates;
      });
    }
  }, []);

  const isLoading = useCallback((key = 'default') => {
    return key === 'default' ? loading : !!loadingStates[key];
  }, [loading, loadingStates]);

  const withLoading = useCallback(async (asyncFunction, key = 'default') => {
    try {
      startLoading(key);
      const result = await asyncFunction();
      return result;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  return {
    loading,
    loadingStates,
    startLoading,
    stopLoading,
    isLoading,
    withLoading
  };
}
