import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { storageOptimizer } from '../utils/requestDedupe';
import { useAuth } from './AuthContext';

const OrdersContext = createContext();

export function useOrdersContext() {
  return useContext(OrdersContext);
}

export function OrdersProvider({ children }) {
  const { logAuditAction } = useAuth();
  
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

        if (stockError) throw stockError;
        setStock(stockData || []);

      } catch (err) {
        console.error('Error loading orders data:', err);

        // Fallback to localStorage if Supabase fails
        const localChickens = localStorage.getItem('chickens');
        if (localChickens && localChickens !== 'undefined') {
          try {
            const parsed = JSON.parse(localChickens);
            // Handle both old format (array) and new format (object with data property)
            const chickensData = parsed.data ? parsed.data : (Array.isArray(parsed) ? parsed : []);
            setChickensState(chickensData);
          } catch (e) {
            console.warn('Invalid chickens data in localStorage:', e);
            setChickensState([]);
          }
        } else {
          setChickensState([]);
        }

        const localStock = localStorage.getItem('stock');
        if (localStock && localStock !== 'undefined') {
          try {
            const parsed = JSON.parse(localStock);
            // Handle both old format (array) and new format (object with data property)
            const stockData = parsed.data ? parsed.data : (Array.isArray(parsed) ? parsed : []);
            setStockState(stockData);
          } catch (e) {
            console.warn('Invalid stock data in localStorage:', e);
            setStockState([]);
          }
        } else {
          setStockState([]);
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
      // Convert amountPaid to amount_paid to match database schema
      const { amountPaid, calculationMode, batch_id, ...otherData } = chickenData;
      
      const chicken = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        ...otherData,
        amount_paid: amountPaid || 0,
        calculation_mode: calculationMode || 'count_size_cost',
        batch_id: batch_id || null,
        balance: (chickenData.count * chickenData.size * chickenData.price) - (amountPaid || 0),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('chickens').insert(chicken);
      if (error) throw error;

      setChickens(prev => [chicken, ...prev]);

      // Log audit action
      await logAuditAction('CREATE', 'chickens', chicken.id, null, chicken);

      return chicken;
    } catch (err) {
      console.error('Error adding chicken order:', err);
      throw err;
    }
  };

  const updateChicken = async (id, chickenData) => {
    try {
      const oldChicken = chickens.find(chicken => chicken.id === id);
      if (!oldChicken) throw new Error('Chicken order not found');

      // Convert amountPaid to amount_paid to match database schema
      const { amountPaid, calculationMode, batch_id, ...otherData } = chickenData;
      
      const updatedChicken = {
        ...oldChicken,
        ...otherData,
        amount_paid: amountPaid || 0,
        calculation_mode: calculationMode || 'count_size_cost',
        batch_id: batch_id || null,
        balance: (chickenData.count * chickenData.size * chickenData.price) - (amountPaid || 0),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('chickens')
        .update(updatedChicken)
        .eq('id', id);

      if (error) throw error;

      setChickens(prev => prev.map(chicken =>
        chicken.id === id ? updatedChicken : chicken
      ));

      // Log audit action
      await logAuditAction('UPDATE', 'chickens', id, oldChicken, updatedChicken);

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

      // Log audit action
      await logAuditAction('DELETE', 'chickens', id, chickenToDelete, null);

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

      // Log audit action
      await logAuditAction('CREATE', 'stock', stockItem.id, null, stockItem);

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

      // Log audit action
      await logAuditAction('DELETE', 'stock', id, stockToDelete, null);

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
