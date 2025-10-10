import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase, supabaseUrl } from '../utils/supabaseClient';
import { isMigrationNeeded, migrateFromLocalStorage } from '../utils/migrateData';
import { formatNumber } from '../utils/formatters';

const AppCoreContext = createContext();

export function useAppCoreContext() {
  return useContext(AppCoreContext);
}

export function AppCoreProvider({ children }) {
  // Global loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Migration state
  const [migrationStatus, setMigrationStatus] = useState({
    needed: false,
    inProgress: false,
    completed: false,
    error: null
  });

  // Check if migration is needed
  useEffect(() => {
    async function checkMigration() {
      try {
        const needed = await isMigrationNeeded();
        setMigrationStatus(prev => ({ ...prev, needed }));
      } catch (err) {
        console.error('Error checking migration status:', err);
        setError('Failed to check migration status');
      } finally {
        setLoading(false);
      }
    }
    checkMigration();
  }, []);

  // Perform migration if needed
  useEffect(() => {
    async function performMigration() {
      try {
        setMigrationStatus(prev => ({ ...prev, inProgress: true }));
        await migrateFromLocalStorage();
        setMigrationStatus(prev => ({ ...prev, inProgress: false, completed: true }));
      } catch (err) {
        console.error('Error performing migration:', err);
        setMigrationStatus(prev => ({ ...prev, inProgress: false, error: err }));
      }
    }

    if (migrationStatus.needed && !migrationStatus.completed && !migrationStatus.inProgress) {
      performMigration();
    }
  }, [migrationStatus]);

  // Manual migration trigger
  const performMigration = async () => {
    try {
      setMigrationStatus(prev => ({ ...prev, inProgress: true, error: null }));
      await migrateFromLocalStorage();
      setMigrationStatus(prev => ({ ...prev, inProgress: false, completed: true }));
    } catch (err) {
      console.error('Error performing migration:', err);
      setMigrationStatus(prev => ({ ...prev, inProgress: false, error: err }));
      throw err;
    }
  };

  // Global error handler
  const setGlobalError = (errorMessage) => {
    setError(errorMessage);
  };

  const clearGlobalError = () => {
    setError(null);
  };

  // Global loading handler
  const setGlobalLoading = (isLoading) => {
    setLoading(isLoading);
  };

  // Utility functions for data export
  const generateReport = (data, type = 'chickens') => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data available for report generation');
      }

      const report = {
        type,
        generatedAt: new Date().toISOString(),
        totalRecords: data.length,
        data: data.map(item => ({
          ...item,
          // Ensure dates are properly formatted
          date: item.date || item.created_at || new Date().toISOString().split('T')[0],
          // Format numbers consistently
          ...(item.count && { count: formatNumber(item.count) }),
          ...(item.size && { size: formatNumber(item.size, 2) }),
          ...(item.price && { price: formatNumber(item.price, 2) }),
          ...(item.amount && { amount: formatNumber(item.amount, 2) }),
          ...(item.balance && { balance: formatNumber(item.balance, 2) })
        }))
      };

      return report;
    } catch (err) {
      console.error('Error generating report:', err);
      throw err;
    }
  };

  const exportToCSV = (data, filename = 'export') => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data available for CSV export');
      }

      // Get all unique keys from the data
      const keys = [...new Set(data.flatMap(Object.keys))];
      
      // Create CSV header
      const csvHeader = keys.join(',');
      
      // Create CSV rows
      const csvRows = data.map(item => 
        keys.map(key => {
          const value = item[key];
          // Handle values that might contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      );

      // Combine header and rows
      const csvContent = [csvHeader, ...csvRows].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return true;
    } catch (err) {
      console.error('Error exporting to CSV:', err);
      throw err;
    }
  };

  // Application statistics (aggregated from all contexts)
  const calculateStats = (chickens = [], transactions = [], liveChickens = [], feedInventory = []) => {
    try {
      // Chicken orders statistics
      const totalOrders = chickens.length;
      const totalChickens = chickens.reduce((sum, chicken) => sum + (chicken.count || 0), 0);
      const totalRevenue = chickens.reduce((sum, chicken) => {
        const revenue = (chicken.count || 0) * (chicken.size || 0) * (chicken.price || 0);
        return sum + revenue;
      }, 0);
      const totalBalance = chickens.reduce((sum, chicken) => sum + (chicken.balance || 0), 0);

      // Transaction statistics
      const totalIncome = transactions
        .filter(t => t.type === 'fund')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpenses = transactions
        .filter(t => t.type === 'expense' || t.type === 'stock_expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Live chickens statistics
      const totalLiveChickens = liveChickens.reduce((sum, batch) => sum + (batch.current_count || 0), 0);
      const totalMortality = liveChickens.reduce((sum, batch) => {
        const initial = batch.initial_count || 0;
        const current = batch.current_count || 0;
        return sum + Math.max(0, initial - current);
      }, 0);

      // Feed statistics
      const totalFeedItems = feedInventory.length;
      const totalFeedValue = feedInventory.reduce((sum, feed) => {
        const bags = feed.number_of_bags || 0;
        const costPerBag = feed.cost_per_bag || 0;
        return sum + (bags * costPerBag);
      }, 0);

      return {
        orders: {
          total: totalOrders,
          totalChickens,
          totalRevenue,
          totalBalance,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
        },
        financial: {
          totalIncome,
          totalExpenses,
          netIncome: totalIncome - totalExpenses,
          profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
        },
        livestock: {
          totalLive: totalLiveChickens,
          totalMortality,
          mortalityRate: liveChickens.reduce((sum, batch) => sum + (batch.initial_count || 0), 0) > 0 
            ? (totalMortality / liveChickens.reduce((sum, batch) => sum + (batch.initial_count || 0), 0)) * 100 
            : 0
        },
        feed: {
          totalItems: totalFeedItems,
          totalValue: totalFeedValue
        },
        summary: {
          totalRecords: totalOrders + transactions.length + liveChickens.length + feedInventory.length,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (err) {
      console.error('Error calculating statistics:', err);
      return {
        orders: { total: 0, totalChickens: 0, totalRevenue: 0, totalBalance: 0, averageOrderValue: 0 },
        financial: { totalIncome: 0, totalExpenses: 0, netIncome: 0, profitMargin: 0 },
        livestock: { totalLive: 0, totalMortality: 0, mortalityRate: 0 },
        feed: { totalItems: 0, totalValue: 0 },
        summary: { totalRecords: 0, lastUpdated: new Date().toISOString() }
      };
    }
  };

  // Database connection status
  const databaseStatus = useMemo(() => {
    const isPlaceholder = supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-supabase-project-url');
    return {
      connected: !isPlaceholder,
      url: isPlaceholder ? 'Not configured' : supabaseUrl,
      status: isPlaceholder ? 'offline' : 'online'
    };
  }, []);

  const value = {
    // Global state
    loading,
    error,
    migrationStatus,
    databaseStatus,

    // Global state management
    setGlobalError,
    clearGlobalError,
    setGlobalLoading,

    // Migration
    performMigration,

    // Utility functions
    generateReport,
    exportToCSV,
    calculateStats
  };

  return (
    <AppCoreContext.Provider value={value}>
      {children}
    </AppCoreContext.Provider>
  );
}

export { AppCoreContext };
