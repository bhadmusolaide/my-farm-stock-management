# Custom Hooks Documentation

This document provides comprehensive documentation for all custom hooks in the farm stock management application.

## Table of Contents

1. [Data Fetching Hooks](#data-fetching-hooks)
2. [Form Management Hooks](#form-management-hooks)
3. [Calculation Hooks](#calculation-hooks)
4. [Filtering and Search Hooks](#filtering-and-search-hooks)
5. [UI State Management Hooks](#ui-state-management-hooks)
6. [Analytics and Reporting Hooks](#analytics-and-reporting-hooks)

## Data Fetching Hooks

### useAsyncOperation

Handles async operations with loading, error, and success states.

**Parameters:**
- `asyncFunction` (Function): The async function to execute
- `options` (Object): Configuration options
  - `immediate` (boolean): Execute immediately on mount (default: false)
  - `onSuccess` (Function): Callback on successful execution
  - `onError` (Function): Callback on error
  - `initialData` (any): Initial data value (default: null)

**Returns:**
- `data`: Result of the async operation
- `loading`: Loading state
- `error`: Error state
- `execute`: Function to trigger the operation
- `reset`: Function to reset state

**Example:**
```javascript
import { useAsyncOperation } from '../hooks';

const MyComponent = () => {
  const { data, loading, error, execute } = useAsyncOperation(
    async (id) => {
      const response = await fetch(`/api/orders/${id}`);
      return response.json();
    },
    {
      onSuccess: (data) => console.log('Order loaded:', data),
      onError: (error) => console.error('Failed to load order:', error)
    }
  );

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      <button onClick={() => execute(123)}>Load Order</button>
    </div>
  );
};
```

### useDataLoader

Data loading with caching and refresh capabilities.

**Parameters:**
- `dataLoader` (Function): Function that returns a promise with data
- `options` (Object): Configuration options
  - `cacheKey` (string): Key for localStorage caching
  - `cacheDuration` (number): Cache duration in milliseconds (default: 5 minutes)
  - `refreshInterval` (number): Auto-refresh interval in milliseconds
  - `dependencies` (Array): Dependencies that trigger reload
  - `enabled` (boolean): Whether loading is enabled (default: true)

**Returns:**
- `data`: Loaded data
- `loading`: Loading state
- `error`: Error state
- `refresh`: Function to force refresh
- `lastUpdated`: Timestamp of last update

**Example:**
```javascript
const { data: orders, loading, refresh } = useDataLoader(
  () => fetch('/api/orders').then(res => res.json()),
  {
    cacheKey: 'orders-cache',
    cacheDuration: 10 * 60 * 1000, // 10 minutes
    refreshInterval: 30000, // 30 seconds
    dependencies: [userId]
  }
);
```

### usePaginatedData

Handles paginated data with search and filtering.

**Parameters:**
- `dataFetcher` (Function): Function that fetches data (page, pageSize, filters) => Promise
- `options` (Object): Configuration options
  - `initialPage` (number): Initial page number (default: 1)
  - `initialPageSize` (number): Initial page size (default: 10)
  - `initialFilters` (Object): Initial filters (default: {})
  - `enabled` (boolean): Whether fetching is enabled (default: true)

**Returns:**
- `data`: Current page data
- `totalCount`: Total number of items
- `currentPage`: Current page number
- `pageSize`: Current page size
- `totalPages`: Total number of pages
- `hasNextPage`: Whether there's a next page
- `hasPreviousPage`: Whether there's a previous page
- `filters`: Current filters
- `loading`: Loading state
- `error`: Error state
- `goToPage`: Function to go to specific page
- `nextPage`: Function to go to next page
- `previousPage`: Function to go to previous page
- `changePageSize`: Function to change page size
- `updateFilters`: Function to update filters
- `refresh`: Function to refresh current page

**Example:**
```javascript
const {
  data,
  currentPage,
  totalPages,
  goToPage,
  updateFilters
} = usePaginatedData(
  async (page, pageSize, filters) => {
    const params = new URLSearchParams({
      page,
      pageSize,
      ...filters
    });
    const response = await fetch(`/api/orders?${params}`);
    return response.json();
  },
  {
    initialPageSize: 20,
    initialFilters: { status: 'active' }
  }
);
```

### useRealTimeData

Real-time data updates using polling.

**Parameters:**
- `dataFetcher` (Function): Function to fetch data
- `options` (Object): Configuration options
  - `interval` (number): Polling interval in milliseconds (default: 30000)
  - `enabled` (boolean): Whether polling is enabled (default: true)
  - `onUpdate` (Function): Callback when data updates
  - `onError` (Function): Callback on error

**Returns:**
- `data`: Current data
- `loading`: Loading state
- `error`: Error state
- `isConnected`: Connection status
- `start`: Function to start polling
- `stop`: Function to stop polling
- `refresh`: Function to manually refresh

**Example:**
```javascript
const { data: liveData, isConnected } = useRealTimeData(
  () => fetch('/api/live-stats').then(res => res.json()),
  {
    interval: 5000, // 5 seconds
    onUpdate: (newData, oldData) => {
      if (newData.alerts > oldData.alerts) {
        showNotification('New alert received!');
      }
    }
  }
);
```

## Form Management Hooks

### useForm

Comprehensive form state management with validation.

**Parameters:**
- `initialValues` (Object): Initial form values (default: {})
- `options` (Object): Configuration options
  - `validationSchema` (Object): Validation rules
  - `onSubmit` (Function): Submit handler
  - `validateOnChange` (boolean): Validate on field change (default: false)
  - `validateOnBlur` (boolean): Validate on field blur (default: true)
  - `resetOnSubmit` (boolean): Reset form after successful submit (default: false)

**Returns:**
- `values`: Current form values
- `errors`: Validation errors
- `touched`: Touched fields
- `isSubmitting`: Submission state
- `submitCount`: Number of submit attempts
- `isValid`: Whether form is valid
- `isDirty`: Whether form has been modified
- `handleChange`: Field change handler
- `handleBlur`: Field blur handler
- `handleSubmit`: Form submit handler
- `reset`: Function to reset form
- `setFieldValue`: Function to set specific field value
- `setFieldError`: Function to set specific field error
- `getFieldProps`: Function to get field props
- `validateForm`: Function to validate entire form

**Example:**
```javascript
const form = useForm(
  { name: '', email: '', age: '' },
  {
    validationSchema: {
      name: { required: true, minLength: 2 },
      email: { 
        required: true, 
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMessage: 'Please enter a valid email'
      },
      age: {
        required: true,
        custom: (value) => {
          const num = Number(value);
          if (num < 18) return 'Must be at least 18 years old';
          return null;
        }
      }
    },
    onSubmit: async (values) => {
      await submitForm(values);
    }
  }
);

return (
  <form onSubmit={form.handleSubmit}>
    <input
      {...form.getFieldProps('name')}
      placeholder="Name"
    />
    {form.errors.name && <span>{form.errors.name}</span>}
    
    <button type="submit" disabled={form.isSubmitting}>
      {form.isSubmitting ? 'Submitting...' : 'Submit'}
    </button>
  </form>
);
```

### useFormPersistence

Form persistence to localStorage with debouncing.

**Parameters:**
- `key` (string): localStorage key
- `initialValues` (Object): Initial form values (default: {})
- `options` (Object): Configuration options
  - `debounceMs` (number): Debounce delay in milliseconds (default: 500)
  - `clearOnSubmit` (boolean): Clear persisted data on submit (default: true)

**Returns:**
- `values`: Current form values
- `updateValues`: Function to update values
- `clearPersistedData`: Function to clear persisted data
- `handleSubmit`: Enhanced submit handler

**Example:**
```javascript
const { values, updateValues, handleSubmit } = useFormPersistence(
  'order-form',
  { customer: '', items: [] },
  { debounceMs: 1000 }
);

const onSubmit = async (formData) => {
  await saveOrder(formData);
};

return (
  <form onSubmit={() => handleSubmit(onSubmit)}>
    <input
      value={values.customer}
      onChange={(e) => updateValues({ ...values, customer: e.target.value })}
    />
  </form>
);
```

### useMultiStepForm

Multi-step form management with validation and persistence.

**Parameters:**
- `steps` (Array): Array of step configurations
- `options` (Object): Configuration options
  - `initialStep` (number): Initial step index (default: 0)
  - `persistKey` (string): localStorage key for persistence

**Returns:**
- `currentStep`: Current step index
- `stepData`: Data for all steps
- `completedSteps`: Set of completed step indices
- `errors`: Validation errors by step
- `canGoNext`: Whether can go to next step
- `canGoPrevious`: Whether can go to previous step
- `isLastStep`: Whether on last step
- `isFirstStep`: Whether on first step
- `currentStepData`: Data for current step
- `currentStepErrors`: Errors for current step
- `updateStepData`: Function to update step data
- `goToStep`: Function to go to specific step
- `nextStep`: Function to go to next step
- `previousStep`: Function to go to previous step
- `reset`: Function to reset form
- `getAllData`: Function to get all form data
- `validateStep`: Function to validate specific step
- `isStepValid`: Function to check if step is valid

**Example:**
```javascript
const steps = [
  {
    name: 'basic-info',
    validate: (data) => {
      const errors = {};
      if (!data.name) errors.name = 'Name is required';
      return Object.keys(errors).length > 0 ? errors : null;
    }
  },
  {
    name: 'details',
    validate: (data) => {
      const errors = {};
      if (!data.email) errors.email = 'Email is required';
      return Object.keys(errors).length > 0 ? errors : null;
    }
  }
];

const multiStepForm = useMultiStepForm(steps, {
  persistKey: 'multi-step-order'
});

return (
  <div>
    <div>Step {multiStepForm.currentStep + 1} of {steps.length}</div>
    
    {multiStepForm.currentStep === 0 && (
      <input
        value={multiStepForm.currentStepData.name || ''}
        onChange={(e) => multiStepForm.updateStepData(0, { name: e.target.value })}
      />
    )}
    
    <button 
      onClick={multiStepForm.previousStep}
      disabled={!multiStepForm.canGoPrevious}
    >
      Previous
    </button>
    
    <button 
      onClick={multiStepForm.nextStep}
      disabled={!multiStepForm.canGoNext}
    >
      {multiStepForm.isLastStep ? 'Finish' : 'Next'}
    </button>
  </div>
);
```

## Calculation Hooks

### useFinancialCalculations

Financial metrics and calculations.

**Parameters:**
- `transactions` (Array): Array of transaction objects (default: [])
- `orders` (Array): Array of order objects (default: [])
- `options` (Object): Configuration options
  - `currency` (string): Currency symbol (default: '₦')
  - `dateRange` (Object): Date range filter with start and end dates

**Returns:**
- `totalIncome`: Total income amount
- `totalExpenses`: Total expenses amount
- `totalWithdrawals`: Total withdrawals amount
- `netIncome`: Net income (income - expenses - withdrawals)
- `orderRevenue`: Revenue from orders
- `totalBalance`: Outstanding balance from orders
- `totalPaid`: Total amount paid
- `grossProfit`: Gross profit (revenue - expenses)
- `profitMargin`: Profit margin percentage
- `roi`: Return on investment percentage
- `cashFlow`: Cash flow analysis object
- `monthlyBreakdown`: Monthly financial breakdown
- `ratios`: Financial ratios object
- `formatted`: Formatted values with currency

**Example:**
```javascript
const financialMetrics = useFinancialCalculations(
  transactions,
  orders,
  {
    currency: '$',
    dateRange: {
      start: '2024-01-01',
      end: '2024-12-31'
    }
  }
);

console.log(financialMetrics.formatted.grossProfit); // "$15,000"
console.log(financialMetrics.profitMargin); // 25.5
```

### useLivestockMetrics

Livestock performance metrics and calculations.

**Parameters:**
- `liveChickens` (Array): Array of live chicken batch objects (default: [])
- `weightHistory` (Array): Array of weight history records (default: [])
- `options` (Object): Configuration options
  - `targetWeight` (number): Target weight in kg (default: 2.5)
  - `targetAge` (number): Target age in days (default: 42)

**Returns:**
- `totalBatches`: Total number of batches
- `totalLiveChickens`: Total live chicken count
- `totalInitialChickens`: Total initial chicken count
- `totalMortality`: Total mortality count
- `mortalityRate`: Mortality rate percentage
- `averageAge`: Average age in days
- `averageWeight`: Average weight in kg
- `averageDailyGain`: Average daily weight gain
- `averageFCR`: Average feed conversion ratio
- `readyForProcessing`: Batches ready for processing
- `readyCount`: Count of chickens ready for processing
- `healthMetrics`: Health indicators object
- `batchMetrics`: Detailed metrics for each batch
- `growthTrends`: Growth trend data
- `formatted`: Formatted values with units

**Example:**
```javascript
const livestockMetrics = useLivestockMetrics(
  liveChickens,
  weightHistory,
  {
    targetWeight: 3.0,
    targetAge: 45
  }
);

console.log(livestockMetrics.formatted.mortalityRate); // "5.2%"
console.log(livestockMetrics.readyCount); // 150
```

### useFeedAnalytics

Feed analytics and efficiency calculations.

**Parameters:**
- `feedInventory` (Array): Array of feed inventory items (default: [])
- `feedConsumption` (Array): Array of feed consumption records (default: [])
- `liveChickens` (Array): Array of live chicken batches (default: [])
- `options` (Object): Configuration options
  - `alertThreshold` (number): Low stock alert threshold (default: 50)
  - `projectionDays` (number): Days to project feed needs (default: 30)

**Returns:**
- `totalFeedTypes`: Number of different feed types
- `totalFeedStock`: Total feed stock in kg
- `totalFeedValue`: Total value of feed inventory
- `totalConsumption`: Total feed consumption
- `dailyConsumption`: Average daily consumption
- `feedEfficiency`: Efficiency analysis by feed type
- `averageFCR`: Average feed conversion ratio
- `batchFCR`: FCR analysis by batch
- `lowStockAlerts`: Items with low stock
- `projections`: Feed consumption projections
- `summary`: Summary statistics
- `formatted`: Formatted values with units

**Example:**
```javascript
const feedAnalytics = useFeedAnalytics(
  feedInventory,
  feedConsumption,
  liveChickens,
  {
    alertThreshold: 100,
    projectionDays: 14
  }
);

console.log(feedAnalytics.lowStockAlerts.length); // 3
console.log(feedAnalytics.formatted.totalFeedStock); // "1,250.5 kg"
```

### useInventoryCalculations

Inventory turnover and performance calculations.

**Parameters:**
- `inventory` (Array): Array of inventory items (default: [])
- `transactions` (Array): Array of transaction records (default: [])
- `options` (Object): Configuration options
  - `period` (number): Analysis period in days (default: 30)

**Returns:**
- `inventoryAnalysis`: Detailed analysis for each item
- `totalInventoryValue`: Total value of inventory
- `averageTurnoverRate`: Average turnover rate
- `categories`: Items categorized by status
- `performanceMetrics`: Performance indicators
- `recommendations`: Optimization recommendations
- `formatted`: Formatted values

**Example:**
```javascript
const inventoryMetrics = useInventoryCalculations(
  inventory,
  transactions,
  { period: 60 }
);

console.log(inventoryMetrics.categories.critical.length); // 2
console.log(inventoryMetrics.formatted.totalInventoryValue); // "₦45,000"
```

## Usage Best Practices

1. **Performance**: Use `useMemo` and `useCallback` when passing complex objects or functions to hooks
2. **Error Handling**: Always handle error states returned by hooks
3. **Loading States**: Show loading indicators when hooks are fetching data
4. **Cleanup**: Hooks automatically handle cleanup, but be mindful of dependencies
5. **Testing**: Mock hook returns in tests for consistent behavior

## Migration Guide

When migrating from inline logic to custom hooks:

1. Identify repeated patterns in your components
2. Extract the logic into appropriate hooks
3. Update component imports to include the hooks
4. Replace inline logic with hook calls
5. Update tests to mock hook returns
6. Verify functionality remains unchanged

For more examples and advanced usage, see the individual hook files in the `src/hooks/` directory.
