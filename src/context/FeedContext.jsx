import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

const FeedContext = createContext();

export function useFeedContext() {
  return useContext(FeedContext);
}

export function FeedProvider({ children }) {
  const { logAuditAction } = useAuth();
  
  // State management
  const [feedInventory, setFeedInventoryState] = useState([]);
  const [feedConsumption, setFeedConsumptionState] = useState([]);
  const [feedBatchAssignments, setFeedBatchAssignmentsState] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper functions to update state and save to localStorage
  const setFeedInventory = (newFeedInventory) => {
    setFeedInventoryState(newFeedInventory);
    try {
      localStorage.setItem('feedInventory', JSON.stringify(newFeedInventory));
    } catch (e) {
      console.warn('Failed to save feedInventory to localStorage:', e);
    }
  };

  const setFeedConsumption = (newFeedConsumption) => {
    setFeedConsumptionState(newFeedConsumption);
    try {
      localStorage.setItem('feedConsumption', JSON.stringify(newFeedConsumption));
    } catch (e) {
      console.warn('Failed to save feedConsumption to localStorage:', e);
    }
  };

  const setFeedBatchAssignments = (newAssignments) => {
    setFeedBatchAssignmentsState(newAssignments);
    try {
      localStorage.setItem('feedBatchAssignments', JSON.stringify(newAssignments));
    } catch (e) {
      console.warn('Failed to save feedBatchAssignments to localStorage:', e);
    }
  };

  // Load data from Supabase
  useEffect(() => {
    const loadFeedData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load feed inventory with batch assignments
        const { data: feedInventoryData, error: feedInventoryError } = await supabase
          .from('feed_inventory')
          .select(`
            *,
            feed_batch_assignments (
              id,
              chicken_batch_id,
              assigned_quantity_kg,
              assigned_date
            )
          `)
          .order('purchase_date', { ascending: false });

        if (feedInventoryError && !feedInventoryError.message.includes('relation "feed_inventory" does not exist')) {
          throw feedInventoryError;
        }

        // Transform the data to match frontend expectations
        const transformedFeedData = feedInventoryData?.map(feed => ({
          ...feed,
          assigned_batches: feed.feed_batch_assignments?.map(assignment => ({
            batch_id: assignment.chicken_batch_id,
            assigned_quantity_kg: assignment.assigned_quantity_kg
          })) || []
        })) || [];

        // Only set from Supabase if we have actual data, otherwise keep localStorage data
        if (transformedFeedData && transformedFeedData.length > 0) {
          setFeedInventory(transformedFeedData);
        } else {
          // Fallback to localStorage
          const localFeedInventory = localStorage.getItem('feedInventory');
          if (localFeedInventory && localFeedInventory !== 'undefined') {
            try {
              const parsedFeedInventory = JSON.parse(localFeedInventory);
              setFeedInventory(parsedFeedInventory);
            } catch (e) {
              console.warn('Invalid feedInventory data in localStorage:', e);
              setFeedInventory([]);
            }
          }
        }

        // Load feed consumption
        const { data: feedConsumptionData, error: feedConsumptionError } = await supabase
          .from('feed_consumption')
          .select('*')
          .order('consumption_date', { ascending: false });

        if (feedConsumptionError && !feedConsumptionError.message.includes('relation "feed_consumption" does not exist')) {
          throw feedConsumptionError;
        }

        // Only set from Supabase if we have actual data, otherwise keep localStorage data
        if (feedConsumptionData && feedConsumptionData.length > 0) {
          setFeedConsumption(feedConsumptionData);
        } else {
          // Fallback to localStorage if no database data exists
          const localFeedConsumption = localStorage.getItem('feedConsumption');
          if (localFeedConsumption && localFeedConsumption !== 'undefined') {
            try {
              const parsedFeedConsumption = JSON.parse(localFeedConsumption);
              setFeedConsumption(parsedFeedConsumption);
            } catch (e) {
              console.warn('Invalid feedConsumption data in localStorage:', e);
              setFeedConsumption([]);
            }
          }
        }

        // Load feed batch assignments
        try {
          const { data: feedBatchAssignmentsData, error: feedBatchAssignmentsError } = await supabase
            .from('feed_batch_assignments')
            .select('*')
            .order('assigned_date', { ascending: false });

          if (feedBatchAssignmentsError) {
            console.warn('Feed batch assignments table not found - this is expected for new installations:', feedBatchAssignmentsError);
            setFeedBatchAssignments([]);
          } else {
            setFeedBatchAssignments(feedBatchAssignmentsData || []);
          }
        } catch (err) {
          console.warn('Feed batch assignments feature not available yet:', err);
          setFeedBatchAssignments([]);
        }

      } catch (err) {
        console.error('Error loading feed data:', err);
        setError('Failed to load feed data');
      } finally {
        setLoading(false);
      }
    };

    loadFeedData();
  }, []);

  // CRUD operations for feed inventory
  const addFeedInventory = async (feedData) => {
    try {
      // Extract assigned_batches before creating feed item
      const { assigned_batches, ...feedItemData } = feedData;

      const feedItem = {
        id: Date.now().toString(),
        ...feedItemData,
        purchase_date: feedItemData.purchase_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert feed inventory
      const { error } = await supabase.from('feed_inventory').insert(feedItem);
      if (error) throw error;

      // Handle batch assignments if any
      if (assigned_batches && assigned_batches.length > 0) {
        const assignments = assigned_batches.map(ab => ({
          id: `${feedItem.id}-${ab.batch_id}-${Date.now()}`,
          feed_id: feedItem.id,
          chicken_batch_id: ab.batch_id,
          assigned_quantity_kg: parseFloat(ab.assigned_quantity_kg),
          assigned_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: assignmentError } = await supabase
          .from('feed_batch_assignments')
          .insert(assignments);

        if (assignmentError) {
          console.error('Error creating batch assignments:', assignmentError);
          // Don't throw - feed was created successfully
        }

        // Add assignments to feed item for local state
        feedItem.assigned_batches = assigned_batches;
      }

      setFeedInventory(prev => [feedItem, ...prev]);

      // Log audit action
      await logAuditAction('CREATE', 'feed_inventory', feedItem.id, null, feedItem);

      return feedItem;
    } catch (err) {
      console.error('Error adding feed inventory:', err);
      throw err;
    }
  };

  const updateFeedInventory = async (id, feedData) => {
    try {
      const oldFeedItem = feedInventory.find(item => item.id === id);
      if (!oldFeedItem) {
        // If feed item not found in current state, check if it's the newly added item
        // This handles the case where balance deduction happens immediately after adding
        if (feedData && feedData.id === id) {
          // Use the provided feed data as the old item for comparison
          console.log('Feed item not in state yet, using provided data for update');
        } else {
          throw new Error('Feed item not found');
        }
      }

      // Extract assigned_batches before updating feed item
      const { assigned_batches, ...feedItemData } = feedData;

      const updatedFeedItem = {
        ...(oldFeedItem || feedData),
        ...feedItemData,
        updated_at: new Date().toISOString()
      };

      // Update feed inventory
      const { error } = await supabase
        .from('feed_inventory')
        .update(updatedFeedItem)
        .eq('id', id);

      if (error) throw error;

      // Handle batch assignments if provided
      if (assigned_batches !== undefined) {
        // Delete existing assignments
        await supabase
          .from('feed_batch_assignments')
          .delete()
          .eq('feed_id', id);

        // Insert new assignments if any
        if (assigned_batches.length > 0) {
          const assignments = assigned_batches.map(ab => ({
            id: `${id}-${ab.batch_id}-${Date.now()}`,
            feed_id: id,
            chicken_batch_id: ab.batch_id,
            assigned_quantity_kg: parseFloat(ab.assigned_quantity_kg),
            assigned_date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          const { error: assignmentError } = await supabase
            .from('feed_batch_assignments')
            .insert(assignments);

          if (assignmentError) {
            console.error('Error updating batch assignments:', assignmentError);
          }
        }

        // Add assignments to updated item for local state
        updatedFeedItem.assigned_batches = assigned_batches;
      }

      setFeedInventory(prev => {
        const existingIndex = prev.findIndex(item => item.id === id);
        if (existingIndex >= 0) {
          // Update existing item
          return prev.map(item =>
            item.id === id ? updatedFeedItem : item
          );
        } else {
          // Add new item if it doesn't exist (for immediate balance deduction updates)
          return [updatedFeedItem, ...prev];
        }
      });

      // Log audit action
      await logAuditAction('UPDATE', 'feed_inventory', id, oldFeedItem || feedData, updatedFeedItem);

      return updatedFeedItem;
    } catch (err) {
      console.error('Error updating feed inventory:', err);
      throw err;
    }
  };

  const deleteFeedInventory = async (id) => {
    try {
      const feedToDelete = feedInventory.find(item => item.id === id);
      if (!feedToDelete) throw new Error('Feed item not found');

      const { error } = await supabase
        .from('feed_inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFeedInventory(prev => prev.filter(item => item.id !== id));

      // Log audit action
      await logAuditAction('DELETE', 'feed_inventory', id, feedToDelete, null);

      return feedToDelete;
    } catch (err) {
      console.error('Error deleting feed inventory:', err);
      throw err;
    }
  };

  // CRUD operations for feed consumption
  const addFeedConsumption = async (consumptionData) => {
    try {
      const consumption = {
        id: Date.now().toString(),
        ...consumptionData,
        consumption_date: consumptionData.consumption_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('feed_consumption').insert(consumption);
      if (error) throw error;

      setFeedConsumption(prev => [consumption, ...prev]);

      // Log audit action
      await logAuditAction('CREATE', 'feed_consumption', consumption.id, null, consumption);

      return consumption;
    } catch (err) {
      console.error('Error adding feed consumption:', err);
      throw err;
    }
  };

  const deleteFeedConsumption = async (id) => {
    try {
      const consumptionToDelete = feedConsumption.find(item => item.id === id);
      if (!consumptionToDelete) throw new Error('Feed consumption record not found');

      const { error } = await supabase
        .from('feed_consumption')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFeedConsumption(prev => prev.filter(item => item.id !== id));

      // Log audit action
      await logAuditAction('DELETE', 'feed_consumption', id, consumptionToDelete, null);

      return consumptionToDelete;
    } catch (err) {
      console.error('Error deleting feed consumption:', err);
      throw err;
    }
  };

  // Feed batch assignment operations
  const addFeedBatchAssignment = async (assignmentData) => {
    try {
      const assignment = {
        id: Date.now().toString(),
        ...assignmentData,
        assigned_date: assignmentData.assigned_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('feed_batch_assignments').insert(assignment);
      if (error) throw error;

      setFeedBatchAssignments(prev => [assignment, ...prev]);

      // Log audit action
      await logAuditAction('CREATE', 'feed_batch_assignments', assignment.id, null, assignment);

      return assignment;
    } catch (err) {
      console.error('Error adding feed batch assignment:', err);
      throw err;
    }
  };

  const deleteFeedBatchAssignment = async (id) => {
    try {
      const assignmentToDelete = feedBatchAssignments.find(item => item.id === id);
      if (!assignmentToDelete) throw new Error('Feed batch assignment not found');

      const { error } = await supabase
        .from('feed_batch_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFeedBatchAssignments(prev => prev.filter(item => item.id !== id));

      // Log audit action
      await logAuditAction('DELETE', 'feed_batch_assignments', id, assignmentToDelete, null);

      return assignmentToDelete;
    } catch (err) {
      console.error('Error deleting feed batch assignment:', err);
      throw err;
    }
  };

  // Feed analysis functions
  const getLowFeedAlerts = React.useCallback(() => {
    return feedInventory.filter(feed => {
      const currentStock = feed.quantity_kg || 0;
      const minThreshold = feed.min_threshold || 50; // Default 50kg threshold
      return currentStock <= minThreshold;
    });
  }, [feedInventory]);

  const calculateProjectedFeedNeeds = (days = 30) => {
    // Calculate average daily consumption for each feed type
    const dailyConsumption = {};
    
    feedConsumption.forEach(consumption => {
      const feedId = consumption.feed_id;
      if (!dailyConsumption[feedId]) {
        dailyConsumption[feedId] = { total: 0, days: 0 };
      }
      dailyConsumption[feedId].total += consumption.quantity_consumed;
      dailyConsumption[feedId].days += 1;
    });

    // Project needs for each feed item
    return feedInventory.map(feed => {
      const consumption = dailyConsumption[feed.id];
      const avgDailyConsumption = consumption ? consumption.total / consumption.days : 0;
      const projectedNeed = avgDailyConsumption * days;
      const currentStock = feed.quantity_kg || 0;
      const shortfall = Math.max(0, projectedNeed - currentStock);

      return {
        ...feed,
        avgDailyConsumption,
        projectedNeed,
        currentStock,
        shortfall,
        daysRemaining: avgDailyConsumption > 0 ? currentStock / avgDailyConsumption : Infinity
      };
    });
  };

  const value = {
    // State
    feedInventory,
    feedConsumption,
    feedBatchAssignments,
    loading,
    error,

    // CRUD operations
    addFeedInventory,
    updateFeedInventory,
    deleteFeedInventory,
    addFeedConsumption,
    deleteFeedConsumption,
    addFeedBatchAssignment,
    deleteFeedBatchAssignment,

    // Analysis functions
    getLowFeedAlerts,
    calculateProjectedFeedNeeds
  };

  return (
    <FeedContext.Provider value={value}>
      {children}
    </FeedContext.Provider>
  );
}

export { FeedContext };
