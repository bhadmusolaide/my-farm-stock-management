import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

const LiveChickenContext = createContext();

export function useLiveChickenContext() {
  return useContext(LiveChickenContext);
}

export function LiveChickenProvider({ children }) {
  const { logAuditAction } = useAuth();
  
  // State management
  const [liveChickens, setLiveChickensState] = useState([]);
  const [weightHistory, setWeightHistoryState] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper functions to update state and save to localStorage
  const setLiveChickens = (newLiveChickens) => {
    setLiveChickensState(newLiveChickens);
    try {
      localStorage.setItem('liveChickens', JSON.stringify(newLiveChickens));
    } catch (e) {
      console.warn('Failed to save liveChickens to localStorage:', e);
    }
  };

  const setWeightHistory = (newWeightHistory) => {
    setWeightHistoryState(newWeightHistory);
    try {
      localStorage.setItem('weightHistory', JSON.stringify(newWeightHistory));
    } catch (e) {
      console.warn('Failed to save weightHistory to localStorage:', e);
    }
  };

  // Load data from Supabase
  const loadLiveChickens = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load live chickens
      const { data: liveChickensData, error: liveChickensError } = await supabase
        .from('live_chickens')
        .select('*')
        .order('hatch_date', { ascending: false });

      if (liveChickensError && !liveChickensError.message.includes('relation "live_chickens" does not exist')) {
        throw liveChickensError;
      }

      // Prioritize database data over localStorage for data consistency
      if (liveChickensData && liveChickensData.length > 0) {
        setLiveChickens(liveChickensData);
      } else {
        // Only use localStorage as fallback if no database data exists
        const localLiveChickens = localStorage.getItem('liveChickens');
        if (localLiveChickens) {
          try {
            const parsedLocalData = JSON.parse(localLiveChickens);
            setLiveChickens(parsedLocalData);
          } catch (e) {
            console.warn('Invalid liveChickens data in localStorage:', e);
            setLiveChickens([]);
          }
        }
      }

      // Load weight history
      try {
        const { data: weightHistoryData, error: weightHistoryError } = await supabase
          .from('weight_history')
          .select('*')
          .order('recorded_date', { ascending: false });

        if (weightHistoryError && !weightHistoryError.message.includes('relation "weight_history" does not exist')) {
          throw weightHistoryError;
        }

        if (weightHistoryData && weightHistoryData.length > 0) {
          setWeightHistory(weightHistoryData);
        } else {
          // Fallback to localStorage
          const localWeightHistory = localStorage.getItem('weightHistory');
          if (localWeightHistory && localWeightHistory !== 'undefined') {
            try {
              const parsedWeightHistory = JSON.parse(localWeightHistory);
              setWeightHistory(parsedWeightHistory);
            } catch (e) {
              console.warn('Invalid weightHistory data in localStorage:', e);
              setWeightHistory([]);
            }
          }
        }
      } catch (err) {
        console.warn('Weight history table not available yet:', err);
        setWeightHistory([]);
      }

    } catch (err) {
      console.error('Error loading live chicken data:', err);
      setError('Failed to load live chicken data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveChickens();
  }, []);

  // CRUD operations for live chickens
  const addLiveChicken = async (chickenData) => {
    try {
      const chicken = {
        ...chickenData,
        id: Date.now().toString(),
        lifecycle_stage: 'arrival',
        stage_arrival_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to Supabase first - this is mandatory for data persistence
      const { error } = await supabase.from('live_chickens').insert(chicken);
      if (error) {
        console.error('Failed to save to Supabase:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Only update local state if database operation succeeded
      setLiveChickens(prev => [chicken, ...prev]);

      // Log audit action
      await logAuditAction('CREATE', 'live_chickens', chicken.id, null, chicken);

      return chicken;
    } catch (err) {
      console.error('Error adding live chicken:', err);
      throw err;
    }
  };

  const updateLiveChicken = async (id, chickenData) => {
    try {
      const oldChicken = liveChickens.find(chicken => chicken.id === id);
      if (!oldChicken) throw new Error('Live chicken not found');

      const updatedChicken = {
        ...oldChicken,
        ...chickenData,
        updated_at: new Date().toISOString()
      };

      // Try to update in Supabase first
      try {
        const { error } = await supabase
          .from('live_chickens')
          .update(updatedChicken)
          .eq('id', id);
        if (error) {
          console.warn('Failed to update in Supabase, updating locally only:', error);
        }
      } catch (supabaseError) {
        console.warn('Supabase not available, updating locally only:', supabaseError);
      }

      // Update local state and localStorage
      setLiveChickens(prev => prev.map(chicken =>
        chicken.id === id ? updatedChicken : chicken
      ));

      // Log audit action
      await logAuditAction('UPDATE', 'live_chickens', id, oldChicken, updatedChicken);

      return updatedChicken;
    } catch (err) {
      console.error('Error updating live chicken:', err);
      throw err;
    }
  };

  const deleteLiveChicken = async (id) => {
    try {
      const chickenToDelete = liveChickens.find(chicken => chicken.id === id);
      if (!chickenToDelete) throw new Error('Live chicken not found');

      // Try to delete from Supabase first
      try {
        const { error } = await supabase
          .from('live_chickens')
          .delete()
          .eq('id', id);
        if (error) {
          console.warn('Failed to delete from Supabase, deleting locally only:', error);
        }
      } catch (supabaseError) {
        console.warn('Supabase not available, deleting locally only:', supabaseError);
      }

      // Update local state and localStorage
      setLiveChickens(prev => prev.filter(chicken => chicken.id !== id));

      // Log audit action
      await logAuditAction('DELETE', 'live_chickens', id, chickenToDelete, null);

      return chickenToDelete;
    } catch (err) {
      console.error('Error deleting live chicken:', err);
      throw err;
    }
  };

  // Weight History operations
  const addWeightHistory = async (weightData) => {
    try {
      const weightRecord = {
        ...weightData,
        id: Date.now().toString(),
        recorded_date: weightData.recorded_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      // Try to save to Supabase first
      try {
        const { error } = await supabase.from('weight_history').insert(weightRecord);
        if (error) {
          console.warn('Failed to save weight history to Supabase, saving locally only:', error);
        }
      } catch (supabaseError) {
        console.warn('Supabase not available, saving weight history locally only:', supabaseError);
      }

      // Update local state and localStorage
      setWeightHistory(prev => [weightRecord, ...prev]);

      // Log audit action
      await logAuditAction('CREATE', 'weight_history', weightRecord.id, null, weightRecord);

      return weightRecord;
    } catch (err) {
      console.error('Error adding weight history:', err);
      throw err;
    }
  };

  // Utility functions
  const getLiveChickenById = (id) => {
    return liveChickens.find(chicken => chicken.id === id);
  };

  const getLiveChickensByBatch = (batchId) => {
    return liveChickens.filter(chicken => chicken.batch_id === batchId);
  };

  const getWeightHistoryByBatch = (batchId) => {
    return weightHistory.filter(record => record.batch_id === batchId);
  };

  const getTotalLiveChickens = () => {
    return liveChickens.reduce((total, batch) => total + (batch.current_count || 0), 0);
  };

  const getTotalMortality = () => {
    return liveChickens.reduce((total, batch) => 
      total + ((batch.initial_count || 0) - (batch.current_count || 0)), 0);
  };

  const getMortalityRate = () => {
    const totalInitial = liveChickens.reduce((total, batch) => total + (batch.initial_count || 0), 0);
    const totalMortality = getTotalMortality();
    return totalInitial > 0 ? (totalMortality / totalInitial) * 100 : 0;
  };

  const value = {
    // State
    liveChickens,
    weightHistory,
    loading,
    error,

    // CRUD operations
    addLiveChicken,
    updateLiveChicken,
    deleteLiveChicken,

    // Weight History operations
    addWeightHistory,

    // Loader functions
    loadLiveChickens,

    // Utility functions
    getLiveChickenById,
    getLiveChickensByBatch,
    getWeightHistoryByBatch,
    getTotalLiveChickens,
    getTotalMortality,
    getMortalityRate
  };

  return (
    <LiveChickenContext.Provider value={value}>
      {children}
    </LiveChickenContext.Provider>
  );
}

export { LiveChickenContext };
