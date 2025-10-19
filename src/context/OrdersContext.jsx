import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { storageOptimizer } from '../utils/requestDedupe';
import { useAuth } from './AuthContext';
import { useFinancialContext } from './FinancialContext';

const OrdersContext = createContext();

export function useOrdersContext() {
  return useContext(OrdersContext);
}

export function OrdersProvider({ children }) {
  const { logAuditAction } = useAuth();
  const { addFunds, addExpense } = useFinancialContext();
  
  // State management
  const [chickens, setChickensState] = useState([]);
  const [stock, setStockState] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper functions to update state and save to localStorage with optimization
  const setChickens = (newChickens) => {
    // Ensure newChickens is always an array
    const chickensArray = Array.isArray(newChickens) ? newChickens : [];
    setChickensState(chickensArray);
    storageOptimizer.setItem('chickens', {
      data: chickensArray,
      timestamp: Date.now(),
      version: '1.0'
    });
  };

  const setStock = (newStock) => {
    setStockState(newStock);
    try {
      localStorage.setItem('stock', JSON.stringify(newStock));
    } catch (e) {
      console.warn('Failed to save stock to localStorage:', e);
    }
  };

  // Load data from Supabase
  useEffect(() => {
    const loadOrdersData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load chickens (orders)
        const { data: chickensData, error: chickensError } = await supabase
          .from('chickens')
          .select('*')
          .order('created_at', { ascending: false });

        if (chickensError) throw chickensError;
        setChickens(chickensData || []);

        // Load stock
        const { data: stockData, error: stockError } = await supabase
          .from('stock')
          .select('*')
          .order('date', { ascending: false });

        if (stockError && !stockError.message.includes('relation "stock" does not exist')) {
          throw stockError;
        }

        // Use database data if available, otherwise fallback to localStorage
        if (stockData && stockData.length > 0) {
          setStock(stockData);
        } else {
          // Fallback to localStorage if no database data exists
          const localStock = localStorage.getItem('stock');
          if (localStock && localStock !== 'undefined') {
            try {
              const parsed = JSON.parse(localStock);
              // Handle both old format (array) and new format (object with data property)
              const stockData = parsed.data ? parsed.data : (Array.isArray(parsed) ? parsed : []);
              setStock(stockData);
            } catch (e) {
              console.warn('Invalid stock data in localStorage:', e);
              setStock([]);
            }
          } else {
            setStock([]);
          }
        }

      } catch (err) {
        console.error('Error loading orders data:', err);

        // Fallback to localStorage if Supabase fails (only for non-table-exists errors)
        if (!err.message.includes('relation "chickens" does not exist') && !err.message.includes('relation "stock" does not exist')) {
          const localChickens = localStorage.getItem('chickens');
          if (localChickens && localChickens !== 'undefined') {
            try {
              const parsed = JSON.parse(localChickens);
              const chickensData = parsed.data ? parsed.data : (Array.isArray(parsed) ? parsed : []);
              setChickensState(chickensData);
            } catch (e) {
              console.warn('Invalid chickens data in localStorage:', e);
              setChickensState([]);
            }
          }

          const localStock = localStorage.getItem('stock');
          if (localStock && localStock !== 'undefined') {
            try {
              const parsed = JSON.parse(localStock);
              const stockData = parsed.data ? parsed.data : (Array.isArray(parsed) ? parsed : []);
              setStockState(stockData);
            } catch (e) {
              console.warn('Invalid stock data in localStorage:', e);
              setStockState([]);
            }
          }
        }

        setError('Failed to load orders data');
      } finally {
        setLoading(false);
      }
    };

    loadOrdersData();
  }, []);

  // CRUD operations for chicken orders
  const addChicken = async (chickenData) => {
    try {
      // Convert camelCase to snake_case to match database schema
      const { amountPaid, calculationMode, inventoryType, batch_id, ...otherData } = chickenData;

      // Calculate total cost based on calculation mode
      let totalCost = 0;
      const calcMode = calculationMode || 'count_size_cost';
      if (calcMode === 'count_cost') {
        totalCost = chickenData.count * chickenData.price;
      } else if (calcMode === 'size_cost') {
        totalCost = chickenData.size * chickenData.price;
      } else {
        totalCost = chickenData.count * chickenData.size * chickenData.price;
      }

      const chicken = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        ...otherData,
        amount_paid: amountPaid || 0,
        calculation_mode: calcMode,
        inventory_type: inventoryType || 'live',
        batch_id: batch_id || null,
        balance: chickenData.status === 'paid' ? 0 : totalCost - (amountPaid || 0),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('chickens').insert(chicken);
      if (error) throw error;

      // Create financial transaction if payment was made
      if (amountPaid && amountPaid > 0) {
        const customerName = chicken.customer || 'Unknown Customer';
        const description = `Payment received from ${customerName} (Order #${chicken.id.substring(0, 8)})`;
        await addFunds(amountPaid, description);
      }

      setChickens(prev => [chicken, ...prev]);

      // Log audit action (force immediate for order creation)
      await logAuditAction('CREATE', 'chickens', chicken.id, null, chicken, true);

      return chicken;
    } catch (err) {
      console.error('Error adding chicken order:', err);
      throw err;
    }
  };

  const updateChicken = async (id, chickenData) => {
    try {
      // First, try to get the order from local state
      let oldChicken = chickens.find(chicken => chicken.id === id);

      // If not found in local state, fetch from database
      if (!oldChicken) {
        console.warn(`Order ${id} not found in local state (${chickens.length} orders loaded), fetching from database...`);
        const { data: dbChicken, error: fetchError } = await supabase
          .from('chickens')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError || !dbChicken) {
          console.error('Database fetch error:', fetchError);
          throw new Error(`Chicken order not found in database: ${id}`);
        }

        oldChicken = dbChicken;
        console.log('Successfully fetched order from database');
      }

      // Convert camelCase to snake_case to match database schema
      const { amountPaid, calculationMode, inventoryType, batch_id, ...otherData } = chickenData;

      // Calculate total cost based on calculation mode
      let totalCost = 0;
      const calcMode = calculationMode || oldChicken.calculation_mode || 'count_size_cost';
      if (calcMode === 'count_cost') {
        totalCost = chickenData.count * chickenData.price;
      } else if (calcMode === 'size_cost') {
        totalCost = chickenData.size * chickenData.price;
      } else {
        totalCost = chickenData.count * chickenData.size * chickenData.price;
      }

      const updatedChicken = {
        ...oldChicken,
        ...otherData,
        amount_paid: amountPaid || 0,
        calculation_mode: calcMode,
        inventory_type: inventoryType || oldChicken.inventory_type || 'live',
        batch_id: batch_id || null,
        balance: newStatus === 'paid' ? 0 : totalCost - (amountPaid || 0),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('chickens')
        .update(updatedChicken)
        .eq('id', id);

      if (error) throw error;

      // Update financial balance if amount_paid changed or status changed to paid
      const oldAmountPaid = oldChicken.amount_paid || 0;
      const newAmountPaid = amountPaid !== undefined ? amountPaid : oldAmountPaid;
      const paymentDifference = newAmountPaid - oldAmountPaid;

      // Check if status changed to 'paid' (this should trigger a credit transaction for remaining balance)
      const oldStatus = oldChicken.status;
      const newStatus = chickenData.status !== undefined ? chickenData.status : oldStatus;
      const statusChangedToPaid = oldStatus !== 'paid' && newStatus === 'paid';

      // Calculate new balance correctly
      const newBalance = newStatus === 'paid' ? 0 : totalCost - (newAmountPaid || 0);

      if (paymentDifference !== 0 || statusChangedToPaid) {
        const customerName = updatedChicken.customer || 'Unknown Customer';

        if (paymentDifference > 0) {
          // Payment received - increase balance
          const description = `Payment received from ${customerName} (Order #${id.substring(0, 8)})`;
          await addFunds(paymentDifference, description);
        } else if (paymentDifference < 0) {
          // Refund - decrease balance
          const description = `Payment refund to ${customerName} (Order #${id.substring(0, 8)})`;
          await addExpense(Math.abs(paymentDifference), description);
        }

        // Handle status change to 'paid' - create credit transaction for remaining balance
        if (statusChangedToPaid) {
          const remainingBalance = totalCost - (oldAmountPaid || 0);
          if (remainingBalance > 0) {
            const description = `Payment completed for ${customerName} (Order #${id.substring(0, 8)}) - Remaining balance credited`;
            await addFunds(remainingBalance, description);
          }
        }
      }

      // Update local state - handle case where order wasn't in local state
      setChickens(prev => {
        const existingIndex = prev.findIndex(chicken => chicken.id === id);
        if (existingIndex >= 0) {
          // Update existing order
          return prev.map(chicken =>
            chicken.id === id ? updatedChicken : chicken
          );
        } else {
          // Add the order to local state if it wasn't there
          console.log(`Adding order ${id} to local state after update`);
          return [updatedChicken, ...prev]; // Add to beginning for consistency with order
        }
      });

      // Log audit action (force immediate for order updates)
      await logAuditAction('UPDATE', 'chickens', id, oldChicken, updatedChicken, true);

      return updatedChicken;
    } catch (err) {
      console.error('Error updating chicken order:', err);
      throw err;
    }
  };

  const deleteChicken = async (id) => {
    try {
      const chickenToDelete = chickens.find(chicken => chicken.id === id);
      if (!chickenToDelete) throw new Error('Chicken order not found');

      const { error } = await supabase
        .from('chickens')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setChickens(prev => prev.filter(chicken => chicken.id !== id));

      // Log audit action (force immediate for order deletion)
      await logAuditAction('DELETE', 'chickens', id, chickenToDelete, null, true);

      return chickenToDelete;
    } catch (err) {
      console.error('Error deleting chicken order:', err);
      throw err;
    }
  };

  // Stock operations
  const addStock = async (stockData) => {
    try {
      const stockItem = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        ...stockData,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('stock').insert(stockItem);
      if (error) throw error;

      setStock(prev => [stockItem, ...prev]);

      // Log audit action (force immediate for stock creation)
      await logAuditAction('CREATE', 'stock', stockItem.id, null, stockItem, true);

      return stockItem;
    } catch (err) {
      console.error('Error adding stock:', err);
      throw err;
    }
  };

  const deleteStock = async (id) => {
    try {
      const stockToDelete = stock.find(item => item.id === id);
      if (!stockToDelete) throw new Error('Stock item not found');

      const { error } = await supabase
        .from('stock')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStock(prev => prev.filter(item => item.id !== id));

      // Log audit action (force immediate for stock deletion)
      await logAuditAction('DELETE', 'stock', id, stockToDelete, null, true);

      return stockToDelete;
    } catch (err) {
      console.error('Error deleting stock:', err);
      throw err;
    }
  };

  // Utility functions
  const getOrderById = (id) => {
    return chickens.find(chicken => chicken.id === id);
  };

  const getOrdersByCustomer = (customer) => {
    return chickens.filter(chicken => chicken.customer === customer);
  };

  const getOrdersByStatus = (status) => {
    return chickens.filter(chicken => chicken.status === status);
  };

  const getOrdersByDateRange = (startDate, endDate) => {
    return chickens.filter(chicken => {
      const orderDate = new Date(chicken.date);
      return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
    });
  };

  // Customer analytics
  const customerStats = useMemo(() => {
    const customerMap = new Map();
    
    chickens.forEach(chicken => {
      const customerId = chicken.customer;
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          name: customerId,
          orders: 0,
          totalChickens: 0,
          totalRevenue: 0,
          totalBalance: 0,
          statusCounts: { pending: 0, partial: 0, paid: 0 }
        });
      }
      
      const customer = customerMap.get(customerId);
      customer.orders += 1;
      customer.totalChickens += chicken.count;
      customer.totalRevenue += chicken.count * chicken.size * chicken.price;
      customer.totalBalance += chicken.balance || 0;
      
      if (chicken.status === 'pending') {
        customer.statusCounts.pending += 1;
      } else if (chicken.status === 'partial') {
        customer.statusCounts.partial += 1;
      } else if (chicken.status === 'paid') {
        customer.statusCounts.paid += 1;
      }
    });

    return Array.from(customerMap.values());
  }, [chickens]);

  // Order statistics
  const orderStats = useMemo(() => {
    const totalOrders = chickens.length;
    const totalChickens = chickens.reduce((sum, chicken) => sum + chicken.count, 0);
    const totalRevenue = chickens.reduce((sum, chicken) => sum + (chicken.count * chicken.size * chicken.price), 0);
    const totalBalance = chickens.reduce((sum, chicken) => sum + (chicken.balance || 0), 0);
    
    const statusCounts = chickens.reduce((counts, chicken) => {
      counts[chicken.status] = (counts[chicken.status] || 0) + 1;
      return counts;
    }, {});

    return {
      totalOrders,
      totalChickens,
      totalRevenue,
      totalBalance,
      statusCounts,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      averageChickensPerOrder: totalOrders > 0 ? totalChickens / totalOrders : 0
    };
  }, [chickens]);

  // Refresh function to reload data
  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load chickens (orders)
      const { data: chickensData, error: chickensError } = await supabase
        .from('chickens')
        .select('*')
        .order('created_at', { ascending: false });

      if (chickensError && !chickensError.message.includes('relation "chickens" does not exist')) {
        throw chickensError;
      }

      // Use database data if available, otherwise fallback to localStorage
      if (chickensData && chickensData.length > 0) {
        setChickens(chickensData);
      } else {
        // Fallback to localStorage if no database data exists
        const localChickens = localStorage.getItem('chickens');
        if (localChickens && localChickens !== 'undefined') {
          try {
            const parsed = JSON.parse(localChickens);
            // Handle both old format (array) and new format (object with data property)
            const chickensData = parsed.data ? parsed.data : (Array.isArray(parsed) ? parsed : []);
            setChickens(chickensData);
          } catch (e) {
            console.warn('Invalid chickens data in localStorage:', e);
            setChickens([]);
          }
        } else {
          setChickens([]);
        }
      }
      console.log(`Refreshed OrdersContext data: ${chickensData?.length || 0} orders loaded`);
    } catch (err) {
      console.error('Error refreshing orders data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // State
    chickens,
    stock,
    loading,
    error,

    // CRUD operations
    addChicken,
    updateChicken,
    deleteChicken,
    addStock,
    deleteStock,

    // Utility functions
    getOrderById,
    getOrdersByCustomer,
    getOrdersByStatus,
    getOrdersByDateRange,
    refreshData,

    // Analytics
    customerStats,
    orderStats
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
}

export { OrdersContext };
