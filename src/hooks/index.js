// Data Fetching Hooks
export {
  useAsyncOperation,
  useDataLoader,
  usePaginatedData,
  useRealTimeData
} from './useDataFetching';

// Form Management Hooks
export {
  useForm,
  useFormPersistence,
  useMultiStepForm
} from './useForm';

// Calculation Hooks
export {
  useFinancialCalculations,
  useLivestockMetrics,
  useFeedAnalytics,
  useInventoryCalculations
} from './useCalculations';

// Filtering and Search Hooks
export {
  useTableFilters,
  useAdvancedSearch,
  useDateRangeFilter,
  useStatusFilter
} from './useFiltering';

// UI State Management Hooks
export {
  useModal,
  useNotification,
  useLocalStorage,
  useTableOperations,
  useLoading
} from './useUIState';

// Analytics and Reporting Hooks
export {
  useReportData,
  useChartData,
  useTrendAnalysis,
  usePerformanceMetrics
} from './useAnalytics';

// Re-export existing hooks for convenience
export { default as useTableSort } from './useTableSort';
export { default as useColumnConfig } from './useColumnConfig';
export { default as usePagination } from './usePagination';
export { useNotification as useNotificationContext } from '../context/NotificationContext';
