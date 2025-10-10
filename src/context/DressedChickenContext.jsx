import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

const DressedChickenContext = createContext();

export function useDressedChickenContext() {
  return useContext(DressedChickenContext);
}

export function DressedChickenProvider({ children }) {
  const { logAuditAction } = useAuth();
  
  // State management
  const [dressedChickens, setDressedChickensState] = useState([]);
  const [batchRelationships, setBatchRelationshipsState] = useState([]);
  const [chickenInventoryTransactions, setChickenInventoryTransactionsState] = useState([]);
  const [chickenSizeCategories, setChickenSizeCategoriesState] = useState([]);
  const [chickenPartTypes, setChickenPartTypesState] = useState([]);
  const [chickenPartStandards, setChickenPartStandardsState] = useState([]);
  const [chickenProcessingConfigs, setChickenProcessingConfigsState] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper functions to update state and save to localStorage
  const setDressedChickens = (newDressedChickens) => {
    setDressedChickensState(newDressedChickens);
    try {
      localStorage.setItem('dressedChickens', JSON.stringify(newDressedChickens));
    } catch (e) {
      console.warn('Failed to save dressedChickens to localStorage:', e);
    }
  };

  const setBatchRelationships = (newBatchRelationships) => {
    setBatchRelationshipsState(newBatchRelationships);
    try {
      localStorage.setItem('batchRelationships', JSON.stringify(newBatchRelationships));
    } catch (e) {
      console.warn('Failed to save batchRelationships to localStorage:', e);
    }
  };

  const setChickenInventoryTransactions = (newTransactions) => {
    setChickenInventoryTransactionsState(newTransactions);
    try {
      localStorage.setItem('chickenInventoryTransactions', JSON.stringify(newTransactions));
    } catch (e) {
      console.warn('Failed to save chickenInventoryTransactions to localStorage:', e);
    }
  };

  // Load data from Supabase
  useEffect(() => {
    const loadDressedChickenData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load dressed chickens
        try {
          const { data: dressedChickensData, error: dressedChickensError } = await supabase
            .from('dressed_chickens')
            .select('*')
            .order('processing_date', { ascending: false });

          if (dressedChickensError) {
            console.error('Error loading dressed chickens from Supabase:', dressedChickensError);
            if (dressedChickensError.message.includes('relation "dressed_chickens" does not exist')) {
              console.warn('Dressed chickens table does not exist in database. Please run the schema.sql file in your Supabase SQL editor.');
            } else {
              console.error('Database error:', dressedChickensError.message);
            }
            throw dressedChickensError;
          }

          // Prioritize database data over localStorage
          if (dressedChickensData && dressedChickensData.length > 0) {
            setDressedChickens(dressedChickensData);
          } else {
            // Fallback to localStorage
            const localDressedChickens = localStorage.getItem('dressedChickens');
            if (localDressedChickens && localDressedChickens !== 'undefined') {
              try {
                const parsedDressedChickens = JSON.parse(localDressedChickens);
                setDressedChickens(parsedDressedChickens);
              } catch (e) {
                console.warn('Invalid dressedChickens data in localStorage:', e);
                setDressedChickens([]);
              }
            }
          }
        } catch (err) {
          console.warn('Dressed chickens table not available yet:', err);
          setDressedChickens([]);
        }

        // Load batch relationships
        try {
          const { data: batchRelationshipsData, error: batchRelationshipsError } = await supabase
            .from('batch_relationships')
            .select('*')
            .order('created_at', { ascending: false });

          if (batchRelationshipsError && !batchRelationshipsError.message.includes('relation "batch_relationships" does not exist')) {
            throw batchRelationshipsError;
          }

          if (batchRelationshipsData && batchRelationshipsData.length > 0) {
            setBatchRelationships(batchRelationshipsData);
          } else {
            // Fallback to localStorage
            const localBatchRelationships = localStorage.getItem('batchRelationships');
            if (localBatchRelationships && localBatchRelationships !== 'undefined') {
              try {
                const parsedBatchRelationships = JSON.parse(localBatchRelationships);
                setBatchRelationships(parsedBatchRelationships);
              } catch (e) {
                console.warn('Invalid batchRelationships data in localStorage:', e);
                setBatchRelationships([]);
              }
            }
          }
        } catch (err) {
          console.warn('Batch relationships table not available yet:', err);
          setBatchRelationships([]);
        }

        // Load chicken inventory transactions
        try {
          const { data: chickenTransactionsData, error: chickenTransactionsError } = await supabase
            .from('chicken_inventory_transactions')
            .select('*')
            .order('created_at', { ascending: false });

          if (chickenTransactionsError && !chickenTransactionsError.message.includes('relation "chicken_inventory_transactions" does not exist')) {
            throw chickenTransactionsError;
          }

          // Prioritize database data over localStorage
          if (chickenTransactionsData && chickenTransactionsData.length > 0) {
            setChickenInventoryTransactions(chickenTransactionsData);
          } else {
            // Fallback to localStorage
            const localChickenTransactions = localStorage.getItem('chickenInventoryTransactions');
            if (localChickenTransactions && localChickenTransactions !== 'undefined') {
              try {
                const parsedTransactions = JSON.parse(localChickenTransactions);
                setChickenInventoryTransactions(parsedTransactions);
              } catch (e) {
                console.warn('Invalid chickenInventoryTransactions data in localStorage:', e);
                setChickenInventoryTransactions([]);
              }
            }
          }
        } catch (err) {
          console.warn('Chicken inventory transactions table not available yet:', err);
          setChickenInventoryTransactions([]);
        }

        // Load configuration tables
        try {
          const [sizeCategoriesResult, partTypesResult, partStandardsResult, processingConfigsResult] = await Promise.allSettled([
            supabase.from('chicken_size_categories').select('*').order('min_weight', { ascending: true }),
            supabase.from('chicken_part_types').select('*').order('name', { ascending: true }),
            supabase.from('chicken_part_standards').select('*').order('size_category', { ascending: true }),
            supabase.from('chicken_processing_configs').select('*').order('name', { ascending: true })
          ]);

          if (sizeCategoriesResult.status === 'fulfilled' && sizeCategoriesResult.value.data) {
            setChickenSizeCategoriesState(sizeCategoriesResult.value.data);
          }

          if (partTypesResult.status === 'fulfilled' && partTypesResult.value.data) {
            setChickenPartTypesState(partTypesResult.value.data);
          }

          if (partStandardsResult.status === 'fulfilled' && partStandardsResult.value.data) {
            setChickenPartStandardsState(partStandardsResult.value.data);
          }

          if (processingConfigsResult.status === 'fulfilled' && processingConfigsResult.value.data) {
            setChickenProcessingConfigsState(processingConfigsResult.value.data);
          }
        } catch (err) {
          console.warn('Configuration tables not available yet:', err);
        }

      } catch (err) {
        console.error('Error loading dressed chicken data:', err);
        setError('Failed to load dressed chicken data');
      } finally {
        setLoading(false);
      }
    };

    loadDressedChickenData();
  }, []);

  // CRUD operations for dressed chickens
  const addDressedChicken = async (dressedChickenData) => {
    try {
      const dressedChicken = {
        id: Date.now().toString(),
        ...dressedChickenData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to Supabase first
      const { data, error } = await supabase.from('dressed_chickens').insert(dressedChicken).select();
      if (error) {
        console.error('Failed to save to Supabase:', error);
        throw new Error(`Database error: ${error.message}. Please check if the database tables are properly set up.`);
      }

      // Update local state
      setDressedChickens(prev => [dressedChicken, ...prev]);

      // Log audit action
      await logAuditAction('CREATE', 'dressed_chickens', dressedChicken.id, null, dressedChicken);

      return dressedChicken;
    } catch (err) {
      console.error('Error adding dressed chicken:', err);
      throw err;
    }
  };

  const updateDressedChicken = async (id, dressedChickenData) => {
    try {
      const oldDressedChicken = dressedChickens.find(chicken => chicken.id === id);
      if (!oldDressedChicken) throw new Error('Dressed chicken not found');

      const updatedDressedChicken = {
        ...oldDressedChicken,
        ...dressedChickenData,
        updated_at: new Date().toISOString()
      };

      // Update in Supabase
      const { error } = await supabase
        .from('dressed_chickens')
        .update(updatedDressedChicken)
        .eq('id', id);

      if (error) {
        console.error('Failed to update in Supabase:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Update local state
      setDressedChickens(prev => prev.map(chicken =>
        chicken.id === id ? updatedDressedChicken : chicken
      ));

      // Log audit action
      await logAuditAction('UPDATE', 'dressed_chickens', id, oldDressedChicken, updatedDressedChicken);

      return updatedDressedChicken;
    } catch (err) {
      console.error('Error updating dressed chicken:', err);
      throw err;
    }
  };

  const deleteDressedChicken = async (id) => {
    try {
      const chickenToDelete = dressedChickens.find(chicken => chicken.id === id);
      if (!chickenToDelete) throw new Error('Dressed chicken not found');

      // Delete from Supabase
      const { error } = await supabase
        .from('dressed_chickens')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete from Supabase:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Update local state
      setDressedChickens(prev => prev.filter(chicken => chicken.id !== id));

      // Log audit action
      await logAuditAction('DELETE', 'dressed_chickens', id, chickenToDelete, null);

      return chickenToDelete;
    } catch (err) {
      console.error('Error deleting dressed chicken:', err);
      throw err;
    }
  };

  const value = {
    // State
    dressedChickens,
    batchRelationships,
    chickenInventoryTransactions,
    chickenSizeCategories,
    chickenPartTypes,
    chickenPartStandards,
    chickenProcessingConfigs,
    loading,
    error,

    // CRUD operations
    addDressedChicken,
    updateDressedChicken,
    deleteDressedChicken,

    // State setters (for external updates)
    setBatchRelationships,
    setChickenInventoryTransactions
  };

  return (
    <DressedChickenContext.Provider value={value}>
      {children}
    </DressedChickenContext.Provider>
  );
}

export { DressedChickenContext };
