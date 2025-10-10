import React, { createContext, useContext } from 'react';
import { supabase } from '../utils/supabaseClient';
import { AuthProvider } from './AuthContext';
import { AppCoreProvider, useAppCoreContext } from './AppCoreContext';
import { LiveChickenProvider, useLiveChickenContext } from './LiveChickenContext';
import { DressedChickenProvider, useDressedChickenContext } from './DressedChickenContext';
import { OrdersProvider, useOrdersContext } from './OrdersContext';
import { FeedProvider, useFeedContext } from './FeedContext';
import { FinancialProvider, useFinancialContext } from './FinancialContext';

// Combined context for backward compatibility
const CombinedAppContext = createContext();

export function useCombinedAppContext() {
  return useContext(CombinedAppContext);
}

// Legacy hook for backward compatibility with existing components
export function useAppContext() {
  return useContext(CombinedAppContext);
}

// Combined context provider that merges all contexts
function CombinedContextProvider({ children }) {
  const appCore = useAppCoreContext();
  const liveChicken = useLiveChickenContext();
  const dressedChicken = useDressedChickenContext();
  const orders = useOrdersContext();
  const feed = useFeedContext();
  const financial = useFinancialContext();

  // Combine all context values for backward compatibility
  const combinedValue = {
    // App Core
    loading: appCore.loading,
    error: appCore.error,
    migrationStatus: appCore.migrationStatus,
    databaseStatus: appCore.databaseStatus,
    setGlobalError: appCore.setGlobalError,
    clearGlobalError: appCore.clearGlobalError,
    setGlobalLoading: appCore.setGlobalLoading,
    performMigration: appCore.performMigration,
    generateReport: appCore.generateReport,
    exportToCSV: appCore.exportToCSV,
    calculateStats: appCore.calculateStats,

    // Live Chickens
    liveChickens: liveChicken.liveChickens,
    weightHistory: liveChicken.weightHistory,
    addLiveChicken: liveChicken.addLiveChicken,
    updateLiveChicken: liveChicken.updateLiveChicken,
    deleteLiveChicken: liveChicken.deleteLiveChicken,
    addWeightHistory: liveChicken.addWeightHistory,
    loadLiveChickens: liveChicken.loadLiveChickens,
    getLiveChickenById: liveChicken.getLiveChickenById,
    getLiveChickensByBatch: liveChicken.getLiveChickensByBatch,
    getWeightHistoryByBatch: liveChicken.getWeightHistoryByBatch,
    getTotalLiveChickens: liveChicken.getTotalLiveChickens,
    getTotalMortality: liveChicken.getTotalMortality,
    getMortalityRate: liveChicken.getMortalityRate,

    // Dressed Chickens
    dressedChickens: dressedChicken.dressedChickens,
    batchRelationships: dressedChicken.batchRelationships,
    chickenInventoryTransactions: dressedChicken.chickenInventoryTransactions,
    chickenSizeCategories: dressedChicken.chickenSizeCategories,
    chickenPartTypes: dressedChicken.chickenPartTypes,
    chickenPartStandards: dressedChicken.chickenPartStandards,
    chickenProcessingConfigs: dressedChicken.chickenProcessingConfigs,
    addDressedChicken: dressedChicken.addDressedChicken,
    updateDressedChicken: dressedChicken.updateDressedChicken,
    deleteDressedChicken: dressedChicken.deleteDressedChicken,
    setBatchRelationships: dressedChicken.setBatchRelationships,
    setChickenInventoryTransactions: dressedChicken.setChickenInventoryTransactions,

    // Load functions for dressed chicken data (no-op since data loads automatically in useEffect)
    loadDressedChickens: () => Promise.resolve(dressedChicken.dressedChickens),
    loadBatchRelationships: () => Promise.resolve(dressedChicken.batchRelationships),
    loadChickenSizeCategories: () => Promise.resolve(dressedChicken.chickenSizeCategories),
    loadChickenPartTypes: () => Promise.resolve(dressedChicken.chickenPartTypes),
    loadChickenPartStandards: () => Promise.resolve(dressedChicken.chickenPartStandards),
    loadChickenProcessingConfigs: () => Promise.resolve(dressedChicken.chickenProcessingConfigs),

    // CRUD operations for chicken size categories
    addChickenSizeCategory: async (categoryData) => {
      try {
        const { data, error } = await supabase
          .from('chicken_size_categories')
          .insert([categoryData])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Error adding chicken size category:', err);
        throw err;
      }
    },

    updateChickenSizeCategory: async (id, categoryData) => {
      try {
        const { data, error } = await supabase
          .from('chicken_size_categories')
          .update(categoryData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Error updating chicken size category:', err);
        throw err;
      }
    },

    deleteChickenSizeCategory: async (id) => {
      try {
        const { error } = await supabase
          .from('chicken_size_categories')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        console.error('Error deleting chicken size category:', err);
        throw err;
      }
    },

    // CRUD operations for chicken part types
    addChickenPartType: async (partTypeData) => {
      try {
        const { data, error } = await supabase
          .from('chicken_part_types')
          .insert([partTypeData])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Error adding chicken part type:', err);
        throw err;
      }
    },

    updateChickenPartType: async (id, partTypeData) => {
      try {
        const { data, error } = await supabase
          .from('chicken_part_types')
          .update(partTypeData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Error updating chicken part type:', err);
        throw err;
      }
    },

    deleteChickenPartType: async (id) => {
      try {
        const { error } = await supabase
          .from('chicken_part_types')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        console.error('Error deleting chicken part type:', err);
        throw err;
      }
    },

    // CRUD operations for chicken part standards
    addChickenPartStandard: async (standardData) => {
      try {
        const { data, error } = await supabase
          .from('chicken_part_standards')
          .insert([standardData])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Error adding chicken part standard:', err);
        throw err;
      }
    },

    updateChickenPartStandard: async (id, standardData) => {
      try {
        const { data, error } = await supabase
          .from('chicken_part_standards')
          .update(standardData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Error updating chicken part standard:', err);
        throw err;
      }
    },

    deleteChickenPartStandard: async (id) => {
      try {
        const { error } = await supabase
          .from('chicken_part_standards')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        console.error('Error deleting chicken part standard:', err);
        throw err;
      }
    },

    // CRUD operations for chicken processing configs
    addChickenProcessingConfig: async (configData) => {
      try {
        const { data, error } = await supabase
          .from('chicken_processing_configs')
          .insert([configData])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Error adding chicken processing config:', err);
        throw err;
      }
    },

    updateChickenProcessingConfig: async (id, configData) => {
      try {
        const { data, error } = await supabase
          .from('chicken_processing_configs')
          .update(configData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Error updating chicken processing config:', err);
        throw err;
      }
    },

    deleteChickenProcessingConfig: async (id) => {
      try {
        const { error } = await supabase
          .from('chicken_processing_configs')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        console.error('Error deleting chicken processing config:', err);
        throw err;
      }
    },

    // Orders (Chickens)
    chickens: orders.chickens,
    stock: orders.stock,
    addChicken: orders.addChicken,
    updateChicken: orders.updateChicken,
    deleteChicken: orders.deleteChicken,
    addStock: orders.addStock,
    deleteStock: orders.deleteStock,
    getOrderById: orders.getOrderById,
    getOrdersByCustomer: orders.getOrdersByCustomer,
    getOrdersByStatus: orders.getOrdersByStatus,
    getOrdersByDateRange: orders.getOrdersByDateRange,
    customerStats: orders.customerStats,
    orderStats: orders.orderStats,

    // Feed Management
    feedInventory: feed.feedInventory,
    feedConsumption: feed.feedConsumption,
    feedBatchAssignments: feed.feedBatchAssignments,
    addFeedInventory: feed.addFeedInventory,
    updateFeedInventory: feed.updateFeedInventory,
    deleteFeedInventory: feed.deleteFeedInventory,
    addFeedConsumption: feed.addFeedConsumption,
    deleteFeedConsumption: feed.deleteFeedConsumption,
    addFeedBatchAssignment: feed.addFeedBatchAssignment,
    deleteFeedBatchAssignment: feed.deleteFeedBatchAssignment,
    getLowFeedAlerts: feed.getLowFeedAlerts,
    calculateProjectedFeedNeeds: feed.calculateProjectedFeedNeeds,
    loadFeedInventory: feed.loadFeedInventory || (() => Promise.resolve(feed.feedInventory)),

    // Financial
    balance: financial.balance,
    transactions: financial.transactions,
    addFunds: financial.addFunds,
    addExpense: financial.addExpense,
    withdrawFunds: financial.withdrawFunds,
    clearBalance: financial.clearBalance,
    deleteTransaction: financial.deleteTransaction,
    financialStats: financial.financialStats,
    getTransactionsByType: financial.getTransactionsByType,
    getTransactionsByDateRange: financial.getTransactionsByDateRange,

    // Combined statistics
    stats: (() => {
      const calculatedStats = appCore.calculateStats(
        orders.chickens,
        financial.transactions,
        liveChicken.liveChickens,
        feed.feedInventory
      );

      // Add flat properties for backward compatibility with Dashboard
      return {
        ...calculatedStats,
        // Flat properties expected by Dashboard
        balance: financial.balance || 0,
        totalChickens: calculatedStats.orders?.totalChickens || 0,
        totalRevenue: calculatedStats.orders?.totalRevenue || 0,
        outstandingBalance: calculatedStats.orders?.totalBalance || 0,
      };
    })(),

    // Pagination state and helper functions
    pagination: {
      currentPage: 1,
      pageSize: 20,
      totalPages: 0,
      totalCount: 0
    },

    loadPaginatedData: async (table, page = 1, pageSize = 20, filters = {}) => {
      try {
        let query = supabase.from(table).select('*', { count: 'exact' });

        // Apply filters
        Object.keys(filters).forEach(key => {
          if (filters[key]) {
            if (key === 'startDate') {
              query = query.gte('date', filters[key]);
            } else if (key === 'endDate') {
              query = query.lte('date', filters[key]);
            } else {
              query = query.ilike(key, `%${filters[key]}%`);
            }
          }
        });

        // Apply pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) throw error;

        return {
          data: data || [],
          count: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize)
        };
      } catch (err) {
        console.error('Error loading paginated data:', err);
        return {
          data: [],
          count: 0,
          page,
          pageSize,
          totalPages: 0
        };
      }
    },

    // Load functions for specific data types
    loadLiveChickensData: () => Promise.resolve(liveChicken.liveChickens),
    loadDressedChickensData: () => Promise.resolve(dressedChicken.dressedChickens),

    // Legacy function for chicken inventory transactions
    logChickenTransaction: async (transactionData) => {
      try {
        const transaction = {
          id: Date.now().toString(),
          ...transactionData,
          created_at: new Date().toISOString()
        };

        // Add to dressed chicken context
        const currentTransactions = dressedChicken.chickenInventoryTransactions;
        dressedChicken.setChickenInventoryTransactions([transaction, ...currentTransactions]);

        return transaction;
      } catch (err) {
        console.error('Error logging chicken transaction:', err);
        throw err;
      }
    },

    // Legacy function for batch relationships
    addBatchRelationship: async (relationshipData) => {
      try {
        const relationship = {
          id: Date.now().toString(),
          ...relationshipData,
          created_at: new Date().toISOString()
        };

        const currentRelationships = dressedChicken.batchRelationships;
        dressedChicken.setBatchRelationships([relationship, ...currentRelationships]);

        return relationship;
      } catch (err) {
        console.error('Error adding batch relationship:', err);
        throw err;
      }
    },

    updateBatchRelationship: async (id, relationshipData) => {
      try {
        const currentRelationships = dressedChicken.batchRelationships;
        const updatedRelationships = currentRelationships.map(rel =>
          rel.id === id ? { ...rel, ...relationshipData, updated_at: new Date().toISOString() } : rel
        );
        
        dressedChicken.setBatchRelationships(updatedRelationships);

        return updatedRelationships.find(rel => rel.id === id);
      } catch (err) {
        console.error('Error updating batch relationship:', err);
        throw err;
      }
    },

    deleteBatchRelationship: async (id) => {
      try {
        const currentRelationships = dressedChicken.batchRelationships;
        const relationshipToDelete = currentRelationships.find(rel => rel.id === id);
        
        if (!relationshipToDelete) {
          throw new Error('Batch relationship not found');
        }

        const updatedRelationships = currentRelationships.filter(rel => rel.id !== id);
        dressedChicken.setBatchRelationships(updatedRelationships);

        return relationshipToDelete;
      } catch (err) {
        console.error('Error deleting batch relationship:', err);
        throw err;
      }
    }
  };

  return (
    <CombinedAppContext.Provider value={combinedValue}>
      {children}
    </CombinedAppContext.Provider>
  );
}

// Main provider wrapper that sets up the entire context hierarchy
export function ContextProvider({ children }) {
  return (
    <AuthProvider>
      <AppCoreProvider>
        <FinancialProvider>
          <OrdersProvider>
            <FeedProvider>
              <LiveChickenProvider>
                <DressedChickenProvider>
                  <CombinedContextProvider>
                    {children}
                  </CombinedContextProvider>
                </DressedChickenProvider>
              </LiveChickenProvider>
            </FeedProvider>
          </OrdersProvider>
        </FinancialProvider>
      </AppCoreProvider>
    </AuthProvider>
  );
}

// Export individual context hooks for components that want to use specific contexts
export {
  useAppCoreContext,
  useLiveChickenContext,
  useDressedChickenContext,
  useOrdersContext,
  useFeedContext,
  useFinancialContext
};

// Export the legacy AppProvider for backward compatibility
export function AppProvider({ children }) {
  return (
    <ContextProvider>
      {children}
    </ContextProvider>
  );
}
