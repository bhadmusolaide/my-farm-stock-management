// Export all contexts and providers
export { AuthProvider, useAuth } from './AuthContext';
export { AppCoreProvider, useAppCoreContext } from './AppCoreContext';
export { LiveChickenProvider, useLiveChickenContext } from './LiveChickenContext';
export { DressedChickenProvider, useDressedChickenContext } from './DressedChickenContext';
export { OrdersProvider, useOrdersContext } from './OrdersContext';
export { FeedProvider, useFeedContext } from './FeedContext';
export { FinancialProvider, useFinancialContext } from './FinancialContext';

// Export the main context provider and legacy compatibility
export {
  ContextProvider,
  AppProvider,
  useAppContext,
  useCombinedAppContext
} from './ContextProvider';
