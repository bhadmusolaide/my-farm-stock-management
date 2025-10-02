import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { supabase, supabaseUrl } from '../utils/supabaseClient'
import { isMigrationNeeded, migrateFromLocalStorage } from '../utils/migrateData'
import { formatNumber } from '../utils/formatters'
import { useAuth } from './AuthContext'

const AppContext = createContext()

export function useAppContext() {
  return useContext(AppContext)
}

export function AppProvider({ children }) {
  const { logAuditAction } = useAuth()
  const [chickens, setChickensState] = useState([])
  const [stock, setStockState] = useState([])
  const [transactions, setTransactionsState] = useState([])
  
  // Helper functions to update state and save to localStorage
  const setChickens = (newChickens) => {
    setChickensState(newChickens)
    localStorage.setItem('chickens', JSON.stringify(newChickens))
  }
  
  const setStock = (newStock) => {
    setStockState(newStock)
    localStorage.setItem('stock', JSON.stringify(newStock))
  }
  
  const setTransactions = (newTransactions) => {
    setTransactionsState(newTransactions)
    localStorage.setItem('transactions', JSON.stringify(newTransactions))
  }
  const [balance, setBalanceState] = useState(0)
  
  // Helper function to update balance and save to localStorage
  const setBalance = (newBalance) => {
    setBalanceState(newBalance)
    localStorage.setItem('balance', newBalance.toString())
  }
  const [liveChickens, setLiveChickensState] = useState([])
  const [feedInventory, setFeedInventoryState] = useState([])
  
  const setLiveChickens = (newLiveChickens) => {
    setLiveChickensState(newLiveChickens)
    localStorage.setItem('liveChickens', JSON.stringify(newLiveChickens))
  }
  
  const setFeedInventory = (newFeedInventory) => {
    setFeedInventoryState(newFeedInventory)
    localStorage.setItem('feedInventory', JSON.stringify(newFeedInventory))
  }
  const [feedConsumption, setFeedConsumptionState] = useState([])

  // Helper function to update feedConsumption and save to localStorage as fallback
  const setFeedConsumption = (newFeedConsumption) => {
    setFeedConsumptionState(newFeedConsumption)
    // Save to localStorage as fallback
    try {
      localStorage.setItem('feedConsumption', JSON.stringify(newFeedConsumption))
    } catch (e) {
      console.warn('Failed to save feedConsumption to localStorage:', e)
    }
  }
  const [feedBatchAssignments, setFeedBatchAssignments] = useState([])
  const [chickenInventoryTransactions, setChickenInventoryTransactions] = useState([])
  const [weightHistory, setWeightHistory] = useState([]) // Add weight history state
  const [dressedChickens, setDressedChickensState] = useState([])
  const [batchRelationships, setBatchRelationshipsState] = useState([])
  
  // Helper function to update dressedChickens state and save to localStorage
  const setDressedChickens = (newDressedChickens) => {
    setDressedChickensState(newDressedChickens)
    try {
      localStorage.setItem('dressedChickens', JSON.stringify(newDressedChickens))
    } catch (e) {
      console.warn('Failed to save dressedChickens to localStorage:', e)
    }
  }
  
  // Helper function to update batchRelationships state and save to localStorage
  const setBatchRelationships = (newBatchRelationships) => {
    setBatchRelationshipsState(newBatchRelationships)
    try {
      localStorage.setItem('batchRelationships', JSON.stringify(newBatchRelationships))
    } catch (e) {
      console.warn('Failed to save batchRelationships to localStorage:', e)
    }
  }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [migrationStatus, setMigrationStatus] = useState({
    needed: false,
    inProgress: false,
    completed: false,
    error: null
  })

  // Check if migration is needed on initial load
  useEffect(() => {
    async function checkMigration() {
      try {
        const needed = await isMigrationNeeded()
        setMigrationStatus(prev => ({ ...prev, needed }))
      } catch (err) {
        console.error('Error checking migration status:', err)
        setError('Failed to check migration status')
      } finally {
        setLoading(false)
      }
    }
    checkMigration()
  }, [])

  // Perform migration if needed
  useEffect(() => {
    async function performMigration() {
      try {
        setMigrationStatus(prev => ({ ...prev, inProgress: true }))
        await migrateFromLocalStorage()
        setMigrationStatus(prev => ({ ...prev, inProgress: false, completed: true }))
      } catch (err) {
        console.error('Error performing migration:', err)
        setMigrationStatus(prev => ({ ...prev, inProgress: false, error: err }))
      }
    }

    if (migrationStatus.needed && !migrationStatus.completed && !migrationStatus.inProgress) {
      performMigration()
    }
  }, [migrationStatus])

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        try {
          // Load chickens with limit and selective columns to reduce Egress
          // Try to load with new columns first
          let chickensData, chickensError;
          
          try {
            const result = await supabase
              .from('chickens')
              .select('id, date, customer, phone, location, count, size, price, amount_paid, balance, status, calculation_mode, inventory_type, batch_id, part_type, created_at, updated_at')
              .order('created_at', { ascending: false })
              .limit(100)
            
            chickensData = result.data
            chickensError = result.error
          } catch (newColumnsError) {
            // If new columns don't exist yet, fall back to old schema
            console.warn('New columns not found, falling back to old schema:', newColumnsError)
            const result = await supabase
              .from('chickens')
              .select('id, date, customer, phone, location, count, size, price, amount_paid, balance, status, calculation_mode, batch_id, created_at, updated_at')
              .order('created_at', { ascending: false })
              .limit(100)
            
            chickensData = result.data
            chickensError = result.error
          }
        
        if (chickensError) throw chickensError
        setChickens(chickensData || [])
        
        // Load stock with limit and selective columns to reduce Egress
        const { data: stockData, error: stockError } = await supabase
          .from('stock')
          .select('id, date, description, count, size, cost_per_kg, calculation_mode, notes, created_at, updated_at')
          .order('date', { ascending: false })
          .limit(100)
        
        if (stockError) throw stockError
        setStock(stockData || [])
        
        // Load live chickens with limit and selective columns to reduce Egress
        const { data: liveChickensData, error: liveChickensError } = await supabase
          .from('live_chickens')
          .select('id, batch_id, breed, initial_count, current_count, hatch_date, expected_weight, current_weight, feed_type, status, mortality, notes, created_at, updated_at, lifecycle_stage, stage_arrival_date, stage_brooding_date, stage_growing_date, stage_processing_date, stage_freezer_date, completed_date')
          .order('hatch_date', { ascending: false })
          .limit(100)
        
        if (liveChickensError && !liveChickensError.message.includes('relation "live_chickens" does not exist')) {
          throw liveChickensError
        }
        
        // Prioritize database data over localStorage for data consistency
        if (liveChickensData && liveChickensData.length > 0) {
          setLiveChickens(liveChickensData)
        } else {
          // Only use localStorage as fallback if no database data exists
          const localLiveChickens = localStorage.getItem('liveChickens')
          if (localLiveChickens) {
            try {
              const parsedLocalData = JSON.parse(localLiveChickens)
              setLiveChickens(parsedLocalData)
            } catch (e) {
              console.warn('Invalid liveChickens data in localStorage:', e)
              setLiveChickens([])
            }
          }
        }
        
        // Load feed inventory with batch assignments and selective columns to reduce Egress
        const { data: feedInventoryData, error: feedInventoryError } = await supabase
          .from('feed_inventory')
          .select(`
            id, batch_number, feed_type, brand, quantity_kg, cost_per_kg, cost_per_bag, number_of_bags, purchase_date, expiry_date, supplier, status, created_at, updated_at,
            feed_batch_assignments (
              id,
              chicken_batch_id,
              assigned_quantity_kg,
              assigned_date
            )
          `)
          .order('purchase_date', { ascending: false })
          .limit(100)

        if (feedInventoryError && !feedInventoryError.message.includes('relation "feed_inventory" does not exist')) {
          throw feedInventoryError
        }

        // Transform the data to match frontend expectations
        const transformedFeedData = feedInventoryData?.map(feed => ({
          ...feed,
          assigned_batches: feed.feed_batch_assignments?.map(assignment => ({
            batch_id: assignment.chicken_batch_id,
            assigned_quantity_kg: assignment.assigned_quantity_kg
          })) || []
        })) || []

        // Only set from Supabase if we have actual data, otherwise keep localStorage data
        if (transformedFeedData && transformedFeedData.length > 0) {
          setFeedInventory(transformedFeedData)
        }
        
        // Load feed consumption with limit and selective columns to reduce Egress
        const { data: feedConsumptionData, error: feedConsumptionError } = await supabase
          .from('feed_consumption')
          .select('id, feed_id, chicken_batch_id, quantity_consumed, consumption_date, notes, created_at, updated_at')
          .order('consumption_date', { ascending: false })
          .limit(100)
        
        if (feedConsumptionError && !feedConsumptionError.message.includes('relation "feed_consumption" does not exist')) {
          throw feedConsumptionError
        }
        
        // Only set from Supabase if we have actual data, otherwise keep localStorage data
        if (feedConsumptionData && feedConsumptionData.length > 0) {
          setFeedConsumption(feedConsumptionData)
        } else {
          // Fallback to localStorage if no database data exists
          const localFeedConsumption = localStorage.getItem('feedConsumption')
          if (localFeedConsumption && localFeedConsumption !== 'undefined') {
            try {
              const parsedFeedConsumption = JSON.parse(localFeedConsumption)
              setFeedConsumption(parsedFeedConsumption)
            } catch (e) {
              console.warn('Invalid feedConsumption data in localStorage:', e)
              setFeedConsumption([])
            }
          }
        }
        
        // Load feed batch assignments (handle gracefully if table doesn't exist)
        try {
          const { data: feedBatchAssignmentsData, error: feedBatchAssignmentsError } = await supabase
            .from('feed_batch_assignments')
            .select('id, feed_id, chicken_batch_id, assigned_quantity_kg, assigned_date, created_at, updated_at')
            .order('assigned_date', { ascending: false })
            .limit(100)
          
          if (feedBatchAssignmentsError) {
            console.warn('Feed batch assignments table not found - this is expected for new installations:', feedBatchAssignmentsError)
            setFeedBatchAssignments([])
          } else {
            setFeedBatchAssignments(feedBatchAssignmentsData || [])
          }
        } catch (err) {
          console.warn('Feed batch assignments feature not available yet:', err)
          setFeedBatchAssignments([])
        }

        // Load chicken inventory transactions (handle gracefully if table doesn't exist)
        try {
          const { data: chickenTransactionsData, error: chickenTransactionsError } = await supabase
            .from('chicken_inventory_transactions')
            .select('id, batch_id, transaction_type, quantity_changed, reason, reference_id, reference_type, transaction_date, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(100)
          
          if (chickenTransactionsError && !chickenTransactionsError.message.includes('relation "chicken_inventory_transactions" does not exist')) {
            throw chickenTransactionsError
          }
          
          // Prioritize database data over localStorage
          if (chickenTransactionsData && chickenTransactionsData.length > 0) {
            setChickenInventoryTransactions(chickenTransactionsData)
          } else {
            // Fallback to localStorage
            const localChickenTransactions = localStorage.getItem('chickenInventoryTransactions')
            if (localChickenTransactions && localChickenTransactions !== 'undefined') {
              try {
                const parsedTransactions = JSON.parse(localChickenTransactions)
                setChickenInventoryTransactions(parsedTransactions)
              } catch (e) {
                console.warn('Invalid chickenInventoryTransactions data in localStorage:', e)
                setChickenInventoryTransactions([])
              }
            }
          }
        } catch (err) {
          console.warn('Chicken inventory transactions table not available yet:', err)
          setChickenInventoryTransactions([])
        }
        
        // Load weight history (handle gracefully if table doesn't exist)
        try {
          const { data: weightHistoryData, error: weightHistoryError } = await supabase
            .from('weight_history')
            .select('id, chicken_batch_id, weight, recorded_date, notes, created_at, updated_at')
            .order('recorded_date', { ascending: false })
            .limit(100)
          
          if (weightHistoryError && !weightHistoryError.message.includes('relation "weight_history" does not exist')) {
            throw weightHistoryError
          }
          
          // Prioritize database data over localStorage
          if (weightHistoryData && weightHistoryData.length > 0) {
            setWeightHistory(weightHistoryData)
          } else {
            // Fallback to localStorage
            const localWeightHistory = localStorage.getItem('weightHistory')
            if (localWeightHistory && localWeightHistory !== 'undefined') {
              try {
                const parsedWeightHistory = JSON.parse(localWeightHistory)
                setWeightHistory(parsedWeightHistory)
              } catch (e) {
                console.warn('Invalid weightHistory data in localStorage:', e)
                setWeightHistory([])
              }
            }
          }
        } catch (err) {
          console.warn('Weight history table not available yet:', err)
          setWeightHistory([])
        }
        
        // Load dressed chickens (handle gracefully if table doesn't exist)
        try {
          const { data: dressedChickensData, error: dressedChickensError } = await supabase
            .from('dressed_chickens')
            .select('id, batch_id, processing_date, initial_count, current_count, average_weight, size_category, status, storage_location, expiry_date, notes, parts_count, parts_weight, processing_quantity, remaining_birds, create_new_batch_for_remaining, remaining_batch_id, created_at, updated_at')
            .order('processing_date', { ascending: false })
            .limit(100)

          if (dressedChickensError) {
            console.error('Error loading dressed chickens from Supabase:', dressedChickensError)
            if (dressedChickensError.message.includes('relation "dressed_chickens" does not exist')) {
              console.warn('Dressed chickens table does not exist in database. Please run the schema.sql file in your Supabase SQL editor.')
            } else {
              console.error('Database error:', dressedChickensError.message)
            }
            throw dressedChickensError
          }

          // Prioritize database data over localStorage
          if (dressedChickensData && dressedChickensData.length > 0) {
            setDressedChickens(dressedChickensData)
          } else {
            // Fallback to localStorage
            const localDressedChickens = localStorage.getItem('dressedChickens')
            if (localDressedChickens && localDressedChickens !== 'undefined') {
              try {
                const parsedDressedChickens = JSON.parse(localDressedChickens)
                setDressedChickens(parsedDressedChickens)
              } catch (e) {
                console.warn('Invalid dressedChickens data in localStorage:', e)
                setDressedChickens([])
              }
            }
          }
        } catch (err) {
          console.warn('Dressed chickens table not available yet:', err)
          setDressedChickens([])
        }
        
        // Load batch relationships (handle gracefully if table doesn't exist)
        try {
          const { data: batchRelationshipsData, error: batchRelationshipsError } = await supabase
            .from('batch_relationships')
            .select('id, source_batch_id, source_batch_type, target_batch_id, target_batch_type, relationship_type, quantity, notes, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(100)
          
          if (batchRelationshipsError && !batchRelationshipsError.message.includes('relation "batch_relationships" does not exist')) {
            throw batchRelationshipsError
          }
          
          // Prioritize database data over localStorage
          if (batchRelationshipsData && batchRelationshipsData.length > 0) {
            setBatchRelationships(batchRelationshipsData)
          } else {
            // Fallback to localStorage
            const localBatchRelationships = localStorage.getItem('batchRelationships')
            if (localBatchRelationships && localBatchRelationships !== 'undefined') {
              try {
                const parsedBatchRelationships = JSON.parse(localBatchRelationships)
                setBatchRelationships(parsedBatchRelationships)
              } catch (e) {
                console.warn('Invalid batchRelationships data in localStorage:', e)
                setBatchRelationships([])
              }
            }
          }
        } catch (err) {
          console.warn('Batch relationships table not available yet:', err)
          setBatchRelationships([])
        }
        
        // Load transactions with limit and selective columns to reduce Egress
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('id, date, type, amount, description, created_at, updated_at')
          .order('date', { ascending: false })
          .limit(100)
        
        if (transactionsError) throw transactionsError
        setTransactions(transactionsData || [])
        
        // Load balance (single record, no limit needed)
        const { data: balanceData, error: balanceError } = await supabase
          .from('balance')
          .select('amount')
          .eq('id', 1)
          .single()
        
        if (balanceError && !balanceError.message.includes('relation "balance" does not exist')) {
          throw balanceError
        }
        const currentBalance = balanceData?.amount || 0
        setBalance(currentBalance)

      } catch (fetchError) {
        // If we get a fetch error and we're using the placeholder URL, it's expected
        // Just log it but don't set the error state
        console.error('Error fetching from Supabase:', fetchError)
        if (supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-supabase-project-url')) {
          // Using placeholder Supabase URL - load from localStorage as fallback
          const localBalance = localStorage.getItem('balance')
          if (localBalance && localBalance !== 'undefined') {
            setBalance(parseFloat(localBalance))
          }
          
          const localChickens = localStorage.getItem('chickens')
          if (localChickens && localChickens !== 'undefined') {
            try {
              setChickens(JSON.parse(localChickens))
            } catch (e) {
              console.warn('Invalid chickens data in localStorage:', e)
            }
          }
          
          const localStock = localStorage.getItem('stock')
          if (localStock && localStock !== 'undefined') {
            try {
              setStock(JSON.parse(localStock))
            } catch (e) {
              console.warn('Invalid stock data in localStorage:', e)
            }
          }
          
          const localTransactions = localStorage.getItem('transactions')
          if (localTransactions && localTransactions !== 'undefined') {
            try {
              const parsedTransactions = JSON.parse(localTransactions)
              setTransactions([...parsedTransactions].sort((a, b) => new Date(b.date) - new Date(a.date)))
            } catch (e) {
              console.warn('Invalid transactions data in localStorage:', e)
            }
          }
          
          const localFeedInventory = localStorage.getItem('feedInventory')
          if (localFeedInventory && localFeedInventory !== 'undefined') {
            try {
              setFeedInventory(JSON.parse(localFeedInventory))
            } catch (e) {
              console.warn('Invalid feedInventory data in localStorage:', e)
            }
          }
          
          const localFeedConsumption = localStorage.getItem('feedConsumption')
          if (localFeedConsumption && localFeedConsumption !== 'undefined') {
            try {
              setFeedConsumption(JSON.parse(localFeedConsumption))
            } catch (e) {
              console.warn('Invalid feedConsumption data in localStorage:', e)
            }
          }
          
          const localLiveChickens = localStorage.getItem('liveChickens')
          if (localLiveChickens && localLiveChickens !== 'undefined') {
            try {
              setLiveChickens(JSON.parse(localLiveChickens))
            } catch (e) {
              console.warn('Invalid liveChickens data in localStorage:', e)
            }
          }

          // Load chicken inventory transactions from localStorage as fallback
          const localChickenTransactions = localStorage.getItem('chickenInventoryTransactions')
          if (localChickenTransactions && localChickenTransactions !== 'undefined') {
            try {
              const parsedTransactions = JSON.parse(localChickenTransactions)
              setChickenInventoryTransactions(parsedTransactions)
            } catch (e) {
              console.warn('Invalid chickenInventoryTransactions data in localStorage:', e)
            }
          }
          
          // Load weight history from localStorage as fallback
          const localWeightHistory = localStorage.getItem('weightHistory')
          if (localWeightHistory && localWeightHistory !== 'undefined') {
            try {
              const parsedWeightHistory = JSON.parse(localWeightHistory)
              setWeightHistory(parsedWeightHistory)
            } catch (e) {
              console.warn('Invalid weightHistory data in localStorage:', e)
            }
          }
          
          // Load dressed chickens from localStorage as fallback
          const localDressedChickens = localStorage.getItem('dressedChickens')
          if (localDressedChickens && localDressedChickens !== 'undefined') {
            try {
              const parsedDressedChickens = JSON.parse(localDressedChickens)
              setDressedChickens(parsedDressedChickens)
            } catch (e) {
              console.warn('Invalid dressedChickens data in localStorage:', e)
            }
          }
          
          // Load batch relationships from localStorage as fallback
          const localBatchRelationships = localStorage.getItem('batchRelationships')
          if (localBatchRelationships && localBatchRelationships !== 'undefined') {
            try {
              const parsedBatchRelationships = JSON.parse(localBatchRelationships)
              setBatchRelationships(parsedBatchRelationships)
            } catch (e) {
              console.warn('Invalid batchRelationships data in localStorage:', e)
            }
          }
        } else {
          throw fetchError
        }
      }
      
    } catch (err) {
      console.error('Error loading data from Supabase:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Only load data if migration is not needed or has been completed
  if (!loading && (!migrationStatus.needed || migrationStatus.completed)) {
    loadData()
  }
}, [loading, migrationStatus.needed, migrationStatus.completed])

  
  // Function to perform migration
  const performMigration = async () => {
    try {
      setMigrationStatus(prev => ({ ...prev, inProgress: true, error: null }))
      await migrateFromLocalStorage()
      setMigrationStatus(prev => ({ 
        ...prev, 
        inProgress: false, 
        completed: true, 
        needed: false 
      }))
    } catch (err) {
      console.error('Migration failed:', err)
      setMigrationStatus(prev => ({ 
        ...prev, 
        inProgress: false, 
        error: 'Migration failed: ' + err.message 
      }))
    }
  }

  // CRUD operations for chickens
  const addChicken = async (chickenData) => {
    try {
      // Convert amountPaid to amount_paid to match database schema
      const { amountPaid, calculationMode, batch_id, inventoryType, part_type, ...otherData } = chickenData;
      
      const chicken = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        ...otherData,
        amount_paid: amountPaid || 0,
        calculation_mode: calculationMode || 'count_size_cost',
        inventory_type: inventoryType || 'live',
        batch_id: batch_id || null,
        part_type: part_type || null,
        balance: (chickenData.count * chickenData.size * chickenData.price) - (amountPaid || 0)
      }

      const { error } = await supabase.from('chickens').insert(chicken)
      if (error) throw error

      // If there's a payment, create a transaction and update balance
      if (amountPaid > 0) {
        const paymentTransaction = {
          id: (Date.now() + 1).toString(),
          type: 'income',
          amount: amountPaid,
          description: `Payment from ${chicken.customer} for chicken order`,
          date: chicken.date
        }

        // Update balance
        const newBalance = balance + amountPaid

        const { error: transactionError } = await supabase.from('transactions').insert(paymentTransaction)
        if (transactionError) throw transactionError

        // Update the balance record instead of inserting a new one
        const { error: balanceError } = await supabase
          .from('balance')
          .upsert({ id: 1, amount: newBalance }, { onConflict: 'id' })
        if (balanceError) throw balanceError

        // Update local state for transactions and balance
        setTransactions(prev => [paymentTransaction, ...prev])
        setBalance(newBalance)
      }

      // Log audit action
      await logAuditAction('CREATE', 'chickens', chicken.id, null, chicken)

      // Update local state
      setChickens(prev => [chicken, ...prev])
      return chicken
    } catch (err) {
      console.error('Error adding chicken:', err)
      throw err
    }
  }

  const updateChicken = async (id, chickenData) => {
    try {
      // Convert amountPaid to amount_paid to match database schema
      const { amountPaid, calculationMode, batch_id, inventoryType, part_type, ...otherData } = chickenData;
      
      const updatedChicken = {
        ...otherData,
        amount_paid: amountPaid || 0,
        calculation_mode: calculationMode || 'count_size_cost',
        inventory_type: inventoryType || 'live',
        batch_id: batch_id || null,
        part_type: part_type || null,
        balance: (chickenData.count * chickenData.size * chickenData.price) - (amountPaid || 0)
      }

      const { error } = await supabase
        .from('chickens')
        .update(updatedChicken)
        .eq('id', id)

      if (error) throw error

      // Handle balance changes when amount paid is updated
      const oldChicken = chickens.find(c => c.id === id)
      const oldAmountPaid = oldChicken?.amount_paid || 0
      const newAmountPaid = amountPaid || 0
      const paymentDifference = newAmountPaid - oldAmountPaid

      if (paymentDifference !== 0) {
        const transactionType = paymentDifference > 0 ? 'income' : 'expense'
        const transactionAmount = Math.abs(paymentDifference)
        const transactionDescription = paymentDifference > 0
          ? `Additional payment from ${updatedChicken.customer} for chicken order`
          : `Payment refund to ${updatedChicken.customer} for chicken order`

        const paymentTransaction = {
          id: (Date.now() + 1).toString(),
          type: transactionType,
          amount: transactionAmount,
          description: transactionDescription,
          date: new Date().toISOString().split('T')[0]
        }

        // Update balance
        const newBalance = balance + paymentDifference

        const { error: transactionError } = await supabase.from('transactions').insert(paymentTransaction)
        if (transactionError) throw transactionError

        // Update the balance record instead of inserting a new one
        const { error: balanceError } = await supabase
          .from('balance')
          .upsert({ id: 1, amount: newBalance }, { onConflict: 'id' })
        if (balanceError) throw balanceError

        // Update local state for transactions and balance
        setTransactions(prev => [paymentTransaction, ...prev])
        setBalance(newBalance)
      }

      // Log audit action
      await logAuditAction('UPDATE', 'chickens', id, oldChicken, updatedChicken)

      // Update local state
      setChickens(prev =>
        prev.map(chicken => chicken.id === id ? { ...chicken, ...updatedChicken } : chicken)
      )
      return updatedChicken
    } catch (err) {
      console.error('Error updating chicken:', err)
      throw err
    }
  }

  const deleteChicken = async (id) => {
    try {
      // First, find the chicken order to be deleted
      const chickenToDelete = chickens.find(chicken => chicken.id === id)
      
      if (!chickenToDelete) throw new Error('Chicken order not found')
      
      // For chicken orders, we need to handle the financial impact differently
      // If there was an amount_paid, we need to refund it (decrease balance)
      const amountPaid = chickenToDelete.amount_paid || 0
      
      // Calculate new balance
      const newBalance = balance - amountPaid
      
      // Create a transaction for the refund if there was any payment
      let refundTransaction = null
      if (amountPaid > 0) {
        refundTransaction = {
          id: Date.now().toString(),
          type: 'expense', // Using 'expense' type to remove money
          amount: amountPaid,
          description: `Refund for deleted chicken order: ${chickenToDelete.customer}`,
          date: new Date().toISOString().split('T')[0]
        }
      }
      
      // Restore chickens to batch if batch_id exists
      if (chickenToDelete.batch_id) {
        const batchUpdate = await supabase
          .from('live_chickens')
          .update({ current_count: supabase.sql`current_count + ${chickenToDelete.count}` })
          .eq('id', chickenToDelete.batch_id)
        
        if (batchUpdate.error) {
          console.warn('Failed to restore chicken count to batch:', batchUpdate.error)
        }
        
        // Log return transaction
        await logChickenTransaction(
          chickenToDelete.batch_id,
          'return',
          chickenToDelete.count,
          `Return of ${chickenToDelete.count} chickens from deleted order ${id}`,
          id,
          'chicken_order_return'
        )
      }
      
      // Delete the chicken order
      const { error: chickenError } = await supabase
        .from('chickens')
        .delete()
        .eq('id', id)
      
      if (chickenError) throw chickenError
      
      // If there was a payment, add the refund transaction and update balance
      if (refundTransaction) {
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert(refundTransaction)
        
        if (transactionError) throw transactionError
        
        const { error: balanceError } = await supabase
          .from('balance')
          .upsert({ id: 1, amount: newBalance }, { onConflict: 'id' })
        
        if (balanceError) throw balanceError
        
        // Update local state for transactions and balance
        setTransactions(prev => [refundTransaction, ...prev])
        setBalance(newBalance)
      }
      
      // Log audit action
      await logAuditAction('DELETE', 'chickens', id, chickenToDelete, null)

      // Update local state for chickens
      setChickens(prev => prev.filter(chicken => chicken.id !== id))
    } catch (err) {
      console.error('Error deleting chicken:', err)
      throw err
    }
  }

  // CRUD operations for stock
  const addStock = async (stockData) => {
    try {
      // Calculate total cost separately
      const totalCost = stockData.count * stockData.size * stockData.costperkg
      
      // Create stock item without totalCost field (not in database schema)
      const stockItem = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        description: stockData.description,
        count: stockData.count,
        size: stockData.size,
        cost_per_kg: stockData.costperkg,  // Map frontend field to database column name
        calculation_mode: stockData.calculationMode || 'count_size_cost'
      }

      // Create expense transaction for stock purchase
      const stockTransaction = {
        id: (Date.now() + 1).toString(),
        type: 'expense',
        amount: totalCost,
        description: `Stock Purchase: ${stockItem.description}`,
        date: stockItem.date
      }

      // Update balance
      const newBalance = balance - totalCost

      // Add stock to inventory
      const { error: stockError } = await supabase.from('stock').insert(stockItem)
      if (stockError) throw stockError

      const { error: transactionError } = await supabase.from('transactions').insert(stockTransaction)
      if (transactionError) throw transactionError

      // Update balance
      const { error: balanceError } = await supabase
        .from('balance')
        .upsert({ id: 1, amount: newBalance }, { onConflict: 'id' })
      if (balanceError) throw balanceError

      // Log audit action
      await logAuditAction('CREATE', 'stock', stockItem.id, null, stockItem)

      // Add totalCost to stockItem for frontend display only
      const stockItemWithTotal = { ...stockItem, totalCost }
      
      // Update local state
      setStock(prev => [stockItemWithTotal, ...prev])
      setTransactions(prev => [stockTransaction, ...prev])
      setBalance(newBalance)

      return stockItemWithTotal
    } catch (err) {
      console.error('Error adding stock:', err)
      throw err
    }
  }

  const deleteStock = async (id) => {
    try {
      // First, find the stock item to be deleted
      const stockToDelete = stock.find(item => item.id === id)
      
      if (!stockToDelete) throw new Error('Stock item not found')
      
      // Calculate the amount to be reversed (add back to balance)
      const amountToReverse = stockToDelete.totalCost || 
        (stockToDelete.count * stockToDelete.size * stockToDelete.cost_per_kg)
      
      // Create a reversal transaction
      const reversalTransaction = {
        id: Date.now().toString(),
        type: 'fund', // Using 'fund' type to add money back
        amount: amountToReverse,
        description: `Reversal for deleted stock: ${stockToDelete.description}`,
        date: new Date().toISOString().split('T')[0]
      }
      
      // Calculate new balance
      const newBalance = balance + amountToReverse
      
      // Delete the stock item
      const { error: stockError } = await supabase
        .from('stock')
        .delete()
        .eq('id', id)
      
      if (stockError) throw stockError
      
      // Add the reversal transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(reversalTransaction)
      
      if (transactionError) throw transactionError
      
      // Update balance
      const { error: balanceError } = await supabase
        .from('balance')
        .upsert({ id: 1, amount: newBalance }, { onConflict: 'id' })
      
      if (balanceError) throw balanceError
      
      // Log audit action
      await logAuditAction('DELETE', 'stock', id, stockToDelete, null)

      // Update local state
      setStock(prev => prev.filter(item => item.id !== id))
      setTransactions(prev => [reversalTransaction, ...prev])
      setBalance(newBalance)
      
    } catch (err) {
      console.error('Error deleting stock:', err)
      throw err
    }
  }

  // Transaction operations
  const addFunds = async (amount, description) => {
    try {
      const transaction = {
        id: Date.now().toString(),
        type: 'fund',
        amount,
        description: description || 'Fund addition',
        date: new Date().toISOString().split('T')[0]
      }

      // Update balance
      const newBalance = balance + amount

      const { error: transactionError } = await supabase.from('transactions').insert(transaction)
      if (transactionError) throw transactionError

      const { error: balanceError } = await supabase
        .from('balance')
        .upsert({ id: 1, amount: newBalance }, { onConflict: 'id' })
      if (balanceError) throw balanceError

      // Log audit action
      await logAuditAction('CREATE', 'transactions', transaction.id, null, transaction)

      // Update local state
      setTransactions(prev => [transaction, ...prev])
      setBalance(newBalance)
      
      return transaction
    } catch (err) {
      console.error('Error adding funds:', err)
      throw err
    }
  }

  const addExpense = async (amount, description) => {
    try {
      const transaction = {
        id: Date.now().toString(),
        type: 'expense',
        amount,
        description: description || 'Expense',
        date: new Date().toISOString().split('T')[0]
      }

      // Update balance
      const newBalance = balance - amount

      const { error: transactionError } = await supabase.from('transactions').insert(transaction)
      if (transactionError) throw transactionError

      const { error: balanceError } = await supabase
        .from('balance')
        .upsert({ id: 1, amount: newBalance }, { onConflict: 'id' })
      if (balanceError) throw balanceError

      // Log audit action
      await logAuditAction('CREATE', 'transactions', transaction.id, null, transaction)

      // Update local state
      setTransactions(prev => [transaction, ...prev])
      setBalance(newBalance)
      
      return transaction
    } catch (err) {
      console.error('Error adding expense:', err)
      throw err
    }
  }

  const withdrawFunds = async (amount, purpose) => {
    try {
      if (amount > balance) {
        throw new Error('Insufficient funds!')
      }

      const transaction = {
        id: Date.now().toString(),
        type: 'withdrawal',
        amount,
        description: purpose || 'Withdrawal',
        date: new Date().toISOString().split('T')[0]
      }

      // Update balance
      const newBalance = balance - amount

      const { error: transactionError } = await supabase.from('transactions').insert(transaction)
      if (transactionError) throw transactionError

      const { error: balanceError } = await supabase
        .from('balance')
        .upsert({ id: 1, amount: newBalance }, { onConflict: 'id' })
      if (balanceError) throw balanceError

      // Log audit action
      await logAuditAction('CREATE', 'transactions', transaction.id, null, transaction)

      // Update local state
      setTransactions(prev => [transaction, ...prev])
      setBalance(newBalance)
      
      return transaction
    } catch (err) {
      console.error('Error withdrawing funds:', err)
      throw err
    }
  }

  const clearBalance = async () => {
    try {
      if (balance === 0) {
        return // Nothing to clear
      }

      const transaction = {
        id: Date.now().toString(),
        type: 'withdrawal',
        amount: balance,
        description: 'Balance cleared to zero',
        date: new Date().toISOString().split('T')[0]
      }

      // Set balance to zero
      const newBalance = 0

      const { error: transactionError } = await supabase.from('transactions').insert(transaction)
      if (transactionError) throw transactionError

      const { error: balanceError } = await supabase
        .from('balance')
        .upsert({ id: 1, amount: newBalance }, { onConflict: 'id' })
      if (balanceError) throw balanceError

      // Update local state
      setTransactions(prev => [transaction, ...prev])
      setBalance(newBalance)

      return transaction
    } catch (err) {
      console.error('Error clearing balance:', err)
      throw err
    }
  }

  // Memoized stats calculations for better performance
  const stats = useMemo(() => {
    const totalChickens = chickens.reduce((sum, chicken) => sum + chicken.count, 0)
    const totalRevenue = chickens.reduce((sum, chicken) => {
      return sum + (chicken.count * chicken.size * chicken.price)
    }, 0)
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense' || t.type === 'stock_expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const outstandingBalance = chickens.reduce((sum, chicken) => sum + chicken.balance, 0)
    
    const paidCount = chickens.filter(c => c.status === 'paid').length
    const partialCount = chickens.filter(c => c.status === 'partial').length
    const pendingCount = chickens.filter(c => c.status === 'pending').length
    
    return {
      totalChickens,
      totalRevenue,
      totalExpenses,
      outstandingBalance,
      paidCount,
      partialCount,
      pendingCount,
      balance
    }
  }, [chickens, transactions, balance])
  
  // Legacy function for backward compatibility
  const calculateStats = () => stats

  // Generate report for date range
  const generateReport = (startDate, endDate) => {
    if (!startDate || !endDate) {
      throw new Error('Please select both start and end dates')
    }
    
    const filteredOrders = chickens.filter(chicken => {
      const chickenDate = new Date(chicken.date)
      return chickenDate >= new Date(startDate) && chickenDate <= new Date(endDate)
    })
    
    if (filteredOrders.length === 0) {
      return { empty: true, message: 'No orders found in the selected date range.' }
    }
    
    const totalChickens = filteredOrders.reduce((sum, chicken) => sum + chicken.count, 0)
    const totalRevenue = filteredOrders.reduce((sum, chicken) => sum + (chicken.count * chicken.size * chicken.price), 0)
    const totalBalance = filteredOrders.reduce((sum, chicken) => sum + chicken.balance, 0)
    
    return {
      empty: false,
      startDate,
      endDate,
      orders: filteredOrders,
      orderCount: filteredOrders.length,
      totalChickens,
      totalRevenue,
      totalBalance
    }
  }

  // Export to CSV
  const exportToCSV = (data, filename) => {
    if (!data || !data.length) {
      throw new Error('No data to export')
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0])
    
    // Convert data to CSV format
    let csv = headers.join(',') + '\n'
    
    data.forEach(item => {
      const row = headers.map(header => {
        // Handle values that might contain commas
        const value = item[header] !== null && item[header] !== undefined ? item[header].toString() : ''
        return value.includes(',') ? `"${value}"` : value
      }).join(',')
      csv += row + '\n'
    })
    
    // Create and download the file
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Delete transaction
  const deleteTransaction = async (id) => {
    try {
      // First, find the transaction to be deleted
      const transactionToDelete = transactions.find(transaction => transaction.id === id)
      
      if (!transactionToDelete) throw new Error('Transaction not found')
      
      // Calculate balance adjustment based on transaction type
      let balanceAdjustment = 0
      if (transactionToDelete.type === 'fund') {
        balanceAdjustment = -transactionToDelete.amount // Remove the added funds
      } else if (transactionToDelete.type === 'expense' || transactionToDelete.type === 'withdrawal') {
        balanceAdjustment = transactionToDelete.amount // Add back the spent/withdrawn amount
      }
      
      const newBalance = balance + balanceAdjustment
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Update balance if there was an adjustment
      if (balanceAdjustment !== 0) {
        const { error: balanceError } = await supabase
          .from('balance')
          .upsert({ id: 1, amount: newBalance }, { onConflict: 'id' })
        
        if (balanceError) throw balanceError
      }

      // Log audit action
      await logAuditAction('DELETE', 'transactions', id, transactionToDelete, null)

      // Update local state
      setTransactions(prev => prev.filter(transaction => transaction.id !== id))
      if (balanceAdjustment !== 0) {
        setBalance(newBalance)
      }
      
    } catch (err) {
      console.error('Error deleting transaction:', err)
      throw err
    }
  }

  // Live Chicken CRUD operations
  const addLiveChicken = async (chickenData) => {
    try {
      const chicken = {
        ...chickenData,
        lifecycle_stage: 'arrival',
        stage_arrival_date: new Date().toISOString().split('T')[0]
      }
      
      // Save to Supabase first - this is mandatory for data persistence
      const { error } = await supabase.from('live_chickens').insert(chicken)
      if (error) {
        console.error('Failed to save to Supabase:', error)
        throw new Error(`Database error: ${error.message}`)
      }
      
      // Only update local state if database operation succeeded
      setLiveChickens(prev => [chicken, ...prev])
      
      // Log audit action
      await logAuditAction('CREATE', 'live_chickens', chicken.id, null, chicken)
      
    } catch (err) {
      console.error('Error adding live chicken:', err)
      throw err
    }
  }

  const updateLiveChicken = async (id, updates) => {
    try {
      const oldChicken = liveChickens.find(chicken => chicken.id === id)
      if (!oldChicken) throw new Error('Live chicken not found')
      
      const updatedChicken = { ...oldChicken, ...updates }
      
      // If weight is being updated, also save to weight history
      if (updates.current_weight !== undefined && updates.current_weight !== oldChicken.current_weight) {
        try {
          await addWeightHistory({
            chicken_batch_id: id,
            weight: updates.current_weight,
            recorded_date: new Date().toISOString().split('T')[0], // Use current date for weight history
            notes: updates.weight_notes || ''
          })
        } catch (err) {
          console.warn('Failed to save weight history:', err)
        }
      }
      
      // Try to update in Supabase first
      try {
        const { error } = await supabase
          .from('live_chickens')
          .update(updatedChicken)
          .eq('id', id)
        if (error) {
          console.warn('Failed to update in Supabase, updating locally only:', error)
        }
      } catch (supabaseError) {
        console.warn('Supabase not available, updating locally only:', supabaseError)
      }
      
      // Update local state and localStorage
      setLiveChickens(prev => prev.map(chicken =>
        chicken.id === id ? updatedChicken : chicken
      ))
      
      // Log audit action
      await logAuditAction('UPDATE', 'live_chickens', id, oldChicken, updatedChicken)
      
    } catch (err) {
      console.error('Error updating live chicken:', err)
      throw err
    }
  }

  const deleteLiveChicken = async (id) => {
    try {
      const chickenToDelete = liveChickens.find(chicken => chicken.id === id)
      if (!chickenToDelete) throw new Error('Live chicken not found')
      
      // Try to delete from Supabase first
      try {
        const { error } = await supabase
          .from('live_chickens')
          .delete()
          .eq('id', id)
        if (error) {
          console.warn('Failed to delete from Supabase, deleting locally only:', error)
        }
      } catch (supabaseError) {
        console.warn('Supabase not available, deleting locally only:', supabaseError)
      }
      
      // Update local state and localStorage
      setLiveChickens(prev => prev.filter(chicken => chicken.id !== id))
      
      // Log audit action
      await logAuditAction('DELETE', 'live_chickens', id, chickenToDelete, null)
      
    } catch (err) {
      console.error('Error deleting live chicken:', err)
      throw err
    }
  }

  // Function to add weight history record
  const addWeightHistory = async (weightData) => {
    try {
      const weightRecord = {
        id: Date.now().toString(),
        chicken_batch_id: weightData.chicken_batch_id,
        weight: parseFloat(weightData.weight), // Ensure weight is stored as a number
        recorded_date: weightData.recorded_date || new Date().toISOString().split('T')[0],
        notes: weightData.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Save to Supabase first
      const { error } = await supabase.from('weight_history').insert(weightRecord)
      if (error) {
        console.warn('Failed to save weight history to Supabase:', error)
      }

      // Update local state
      setWeightHistory(prev => [weightRecord, ...prev])

      // Save to localStorage as fallback
      try {
        const currentWeightHistory = JSON.parse(localStorage.getItem('weightHistory') || '[]')
        const updatedWeightHistory = [weightRecord, ...currentWeightHistory]
        localStorage.setItem('weightHistory', JSON.stringify(updatedWeightHistory))
      } catch (e) {
        console.warn('Failed to save weightHistory to localStorage:', e)
      }

      // Log audit action
      await logAuditAction('CREATE', 'weight_history', weightRecord.id, null, weightRecord)

      return weightRecord
    } catch (err) {
      console.error('Error adding weight history:', err)
      throw err
    }
  }

  // Feed Management CRUD operations
  const addFeedInventory = async (feedData) => {
    try {
      // Calculate total cost (number of bags * cost per bag)
      const totalCost = feedData.number_of_bags * feedData.cost_per_bag
      
      // Prepare feed data for database (exclude fields that don't exist in schema)
      const { assigned_batches, ...feedDataForDB } = feedData
      
      const feed = {
        ...feedDataForDB,
        id: Date.now().toString(),
        batch_number: `BATCH-${Date.now()}`, // Add required batch_number field
        purchase_date: feedData.purchase_date || new Date().toISOString().split('T')[0],
        cost_per_kg: feedData.cost_per_bag, // Map cost_per_bag to cost_per_kg for schema compatibility
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Convert empty date strings to null for database compatibility
        expiry_date: feedData.expiry_date === '' ? null : feedData.expiry_date,
        deduct_from_balance: feedData.deduct_from_balance || false,
        balance_deducted: feedData.deduct_from_balance || false
      }
      
      let feedTransaction = null
      let newBalance = balance
      
      // Only create transaction and update balance if deduct_from_balance is true
      if (feedData.deduct_from_balance) {
        feedTransaction = {
          id: (Date.now() + 1).toString(),
          type: 'expense',
          amount: totalCost,
          description: `Feed Purchase: ${feed.feed_type} - ${feed.brand}`,
          date: feed.purchase_date
        }
        newBalance = balance - totalCost
      }
      
      // Add feed to inventory
      const { error: feedError } = await supabase.from('feed_inventory').insert(feed)
      if (feedError) throw feedError
      
      // Add transaction if balance deduction is enabled
      if (feedTransaction) {
        const { error: transactionError } = await supabase.from('transactions').insert(feedTransaction)
        if (transactionError) throw transactionError
        
        // Update balance
        const { error: balanceError } = await supabase
          .from('balance')
          .upsert({ id: 1, amount: newBalance }, { onConflict: 'id' })
        if (balanceError) throw balanceError
      }
      
      // Handle batch assignments if provided (gracefully handle missing table)
      if (assigned_batches && assigned_batches.length > 0) {
        try {
          const assignments = assigned_batches.map(batch => ({
            id: `${Date.now()}_${batch.batch_id}`,
            feed_id: feed.id,
            chicken_batch_id: batch.batch_id,
            assigned_quantity_kg: batch.assigned_quantity_kg || 0, // Use the specific quantity assigned to each batch
            assigned_date: feed.purchase_date,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))

          const { error: assignmentError } = await supabase
            .from('feed_batch_assignments')
            .insert(assignments)

          if (assignmentError) {
            console.warn('Feed batch assignments table not available yet:', assignmentError)
          } else {
            // Update local assignments state
            setFeedBatchAssignments(prev => [...assignments, ...prev])
          }
        } catch (err) {
          console.warn('Feed batch assignment feature not available yet:', err)
        }
      }
      
      // Log audit action
      await logAuditAction('CREATE', 'feed_inventory', feed.id, null, feed)
      
      // Update local state
      setFeedInventory(prev => [feed, ...prev])
      if (feedTransaction) {
        setTransactions(prev => [feedTransaction, ...prev])
        setBalance(newBalance)
      }
      
      return feed
    } catch (err) {
      console.error('Error adding feed inventory:', err)
      throw err
    }
  }

  const deleteFeedInventory = async (id) => {
    try {
      const feedToDelete = feedInventory.find(feed => feed.id === id)
      if (!feedToDelete) throw new Error('Feed inventory not found')

      // Delete from Supabase database
      const { error } = await supabase
        .from('feed_inventory')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Only process refund if balance was originally deducted
      if (feedToDelete.balance_deducted) {
        // Calculate refund amount (number of bags * cost per bag)
        const refundAmount = feedToDelete.number_of_bags * feedToDelete.cost_per_bag

        // Create refund transaction for feed deletion
        const refundTransaction = {
          id: Date.now().toString(),
          type: 'income',
          amount: refundAmount,
          description: `Feed Refund: ${feedToDelete.feed_type} - ${feedToDelete.brand}`,
          date: new Date().toISOString().split('T')[0]
        }

        // Update balance
        const newBalance = balance + refundAmount

        // Add refund transaction to database
        const { error: transactionError } = await supabase.from('transactions').insert(refundTransaction)
        if (transactionError) throw transactionError

        // Update balance in database
        const { error: balanceError } = await supabase
          .from('balance')
          .upsert({ id: 1, amount: newBalance }, { onConflict: 'id' })
        if (balanceError) throw balanceError

        // Update local state for balance and transactions
        setTransactions(prev => [refundTransaction, ...prev])
        setBalance(newBalance)
      }

      // Update local state for feed inventory (always remove the feed)
      setFeedInventory(prev => prev.filter(feed => feed.id !== id))

      // Log audit action
      await logAuditAction('DELETE', 'feed_inventory', id, feedToDelete, null)

    } catch (err) {
      console.error('Error deleting feed inventory:', err)
      throw err
    }
  }

  const updateFeedInventory = async (id, updatedData) => {
    try {
      const feedToUpdate = feedInventory.find(feed => feed.id === id)
      if (!feedToUpdate) throw new Error('Feed inventory not found')

      // Extract batch assignments from updated data
      const { assigned_batches, ...feedDataForDB } = updatedData

      const updatedFeed = { ...feedToUpdate, ...updatedData }

      // Update in Supabase database
      const { error } = await supabase
        .from('feed_inventory')
        .update(feedDataForDB)
        .eq('id', id)

      if (error) throw error

      // Handle batch assignments if provided
      if (assigned_batches !== undefined) {
        try {
          // First, delete existing assignments for this feed
          const { error: deleteError } = await supabase
            .from('feed_batch_assignments')
            .delete()
            .eq('feed_id', id)

          if (deleteError) {
            console.warn('Failed to delete existing batch assignments:', deleteError)
          }

          // Then, add new assignments if any
          if (assigned_batches && assigned_batches.length > 0) {
            const assignments = assigned_batches.map(batch => ({
              id: `${Date.now()}_${batch.batch_id}`,
              feed_id: id,
              chicken_batch_id: batch.batch_id,
              assigned_quantity_kg: batch.assigned_quantity_kg || 0,
              assigned_date: new Date().toISOString().split('T')[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }))

            const { error: assignmentError } = await supabase
              .from('feed_batch_assignments')
              .insert(assignments)

            if (assignmentError) {
              console.warn('Feed batch assignments table not available yet:', assignmentError)
            } else {
              // Update local assignments state
              setFeedBatchAssignments(prev => {
                // Remove old assignments for this feed
                const filtered = prev.filter(assignment => assignment.feed_id !== id)
                // Add new assignments
                return [...assignments, ...filtered]
              })
            }
          }
        } catch (err) {
          console.warn('Feed batch assignment feature not available yet:', err)
        }
      }

      // Update local state
      setFeedInventory(prev => prev.map(feed =>
        feed.id === id ? updatedFeed : feed
      ))

      // Log audit action
      await logAuditAction('UPDATE', 'feed_inventory', id, feedToUpdate, updatedFeed)

      return updatedFeed
    } catch (err) {
      console.error('Error updating feed inventory:', err)
      throw err
    }
  }

  const addFeedConsumption = async (consumptionData) => {
    try {
      const consumption = {
        ...consumptionData,
        id: Date.now().toString(),
        consumption_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Save to Supabase first
      const { error } = await supabase.from('feed_consumption').insert(consumption)
      if (error) {
        console.warn('Failed to save to Supabase, saving locally only:', error)
      }
      
      // Update local state
      setFeedConsumption(prev => [consumption, ...prev])
      
      // Automatically deduct consumed feed from inventory
      if (consumption.feed_id && consumption.quantity_consumed) {
        const feedItem = feedInventory.find(item => item.id === consumption.feed_id);
        if (feedItem) {
          const updatedQuantity = Math.max(0, feedItem.quantity_kg - consumption.quantity_consumed);
          const updatedFeedItem = {
            ...feedItem,
            quantity_kg: updatedQuantity,
            status: updatedQuantity <= 0 ? 'consumed' : feedItem.status
          };
          
          // Update feed inventory
          await updateFeedInventory(consumption.feed_id, updatedFeedItem);
        }
      }
      
      // Log audit action
      await logAuditAction('CREATE', 'feed_consumption', consumption.id, null, consumption)
      
      return consumption
    } catch (err) {
      console.error('Error adding feed consumption:', err)
      throw err
    }
  }

  const deleteFeedConsumption = async (id) => {
    try {
      const consumptionToDelete = feedConsumption.find(consumption => consumption.id === id)
      if (!consumptionToDelete) throw new Error('Feed consumption record not found')
      
      // Delete from Supabase database
      const { error } = await supabase
        .from('feed_consumption')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Get the current feed inventory item
      const { data: feedData, error: feedError } = await supabase
        .from('feed_inventory')
        .select('quantity_kg')
        .eq('id', consumptionToDelete.feed_id)
        .single()
      
      if (feedError) throw feedError
      
      // Calculate the restored quantity
      const restoredQuantity = feedData.quantity_kg + consumptionToDelete.quantity_consumed
      
      // Restore feed inventory quantities
      const { data: updatedFeed, error: updateError } = await supabase
        .from('feed_inventory')
        .update({ quantity_kg: restoredQuantity })
        .eq('id', consumptionToDelete.feed_id)
        .select()
      
      if (updateError) throw updateError
      
      // Update local state
      setFeedConsumption(prev => prev.filter(consumption => consumption.id !== id))
      setFeedInventory(prev => prev.map(feed => 
        feed.id === consumptionToDelete.feed_id ? updatedFeed[0] : feed
      ))
      
      // Log audit action
      await logAuditAction('DELETE', 'feed_consumption', id, consumptionToDelete, null)
      
    } catch (err) {
      console.error('Error deleting feed consumption:', err)
      throw err
    }
  }

  // Feed batch assignment operations
  const addFeedBatchAssignment = async (assignmentData) => {
    try {
      const assignment = {
        ...assignmentData,
        id: Date.now().toString(),
        assigned_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { error } = await supabase.from('feed_batch_assignments').insert(assignment)
      if (error) {
        console.warn('Feed batch assignments table not available yet:', error)
        return assignment
      }
      
      setFeedBatchAssignments(prev => [assignment, ...prev])
      
      await logAuditAction('CREATE', 'feed_batch_assignments', assignment.id, null, assignment)
      
      return assignment
    } catch (err) {
      console.warn('Feed batch assignment feature not available yet:', err)
      return null
    }
  }
  
  // Function to check for low feed stock based on assignments
  const getLowFeedAlerts = () => {
    const alerts = [];
    
    feedInventory.forEach(feed => {
      // Calculate total assigned quantity for this feed item
      const totalAssigned = feedBatchAssignments
        .filter(assignment => assignment.feed_id === feed.id)
        .reduce((sum, assignment) => sum + assignment.assigned_quantity_kg, 0);
      
      // Calculate total consumed for this feed item
      const totalConsumed = feedConsumption
        .filter(consumption => consumption.feed_id === feed.id)
        .reduce((sum, consumption) => sum + consumption.quantity_consumed, 0);
      
      // Calculate remaining available quantity
      const remaining = feed.quantity_kg - totalConsumed;
      
      // Check if remaining feed is less than assigned quantities
      if (remaining < totalAssigned * 0.2) { // Less than 20% of assigned quantities remaining
        alerts.push({
          id: `low-feed-${feed.id}`,
          type: 'low-feed',
          severity: remaining < totalAssigned * 0.1 ? 'critical' : 'warning',
          message: `Low feed stock: ${feed.feed_type} (${formatNumber(remaining, 1)} kg remaining, ${formatNumber(totalAssigned, 1)} kg assigned)`,
          feedId: feed.id
        });
      }
    });
    
    return alerts;
  }
  
  // Function to calculate projected feed needs based on chicken batch growth
  const calculateProjectedFeedNeeds = () => {
    const projections = [];
    
    liveChickens.forEach(batch => {
      // Get assigned feed for this batch
      const assignedFeed = feedInventory.reduce((sum, feedItem) => {
        const assignment = feedItem.assigned_batches?.find(a => a.batch_id === batch.id);
        return sum + (assignment ? assignment.assigned_quantity_kg : 0);
      }, 0);
      
      // Get consumed feed for this batch
      const consumedFeed = feedConsumption
        .filter(consumption => consumption.chicken_batch_id === batch.id)
        .reduce((sum, consumption) => sum + consumption.quantity_consumed, 0);
      
      // Calculate remaining assigned feed
      const remainingFeed = assignedFeed - consumedFeed;
      
      // Calculate age in weeks
      const hatchDate = new Date(batch.hatch_date);
      const ageInWeeks = Math.floor((new Date() - hatchDate) / (7 * 24 * 60 * 60 * 1000));
      
      // Project feed needs for next 2 weeks (standard broiler cycle is 6-8 weeks)
      const weeksRemaining = Math.max(0, 8 - ageInWeeks);
      const dailyConsumptionPerBird = 0.15; // kg per bird per day (standard for broilers)
      const projectedDailyConsumption = batch.current_count * dailyConsumptionPerBird;
      const projectedFeedNeeds = weeksRemaining * 7 * projectedDailyConsumption;
      
      // Check if additional feed is needed
      const additionalFeedNeeded = Math.max(0, projectedFeedNeeds - remainingFeed);
      
      if (additionalFeedNeeded > 0) {
        projections.push({
          batchId: batch.id,
          batchNumber: batch.batch_id,
          currentCount: batch.current_count,
          ageInWeeks,
          remainingFeed: remainingFeed.toFixed(1),
          projectedFeedNeeds: projectedFeedNeeds.toFixed(1),
          additionalFeedNeeded: additionalFeedNeeded.toFixed(1),
          feedType: batch.feed_type || 'Starter'
        });
      }
    });
    
    return projections;
  }
  
  const deleteFeedBatchAssignment = async (id) => {
    try {
      const assignmentToDelete = feedBatchAssignments.find(assignment => assignment.id === id)
      if (!assignmentToDelete) throw new Error('Feed batch assignment not found')
      
      const { error } = await supabase
        .from('feed_batch_assignments')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.warn('Feed batch assignments table not available yet:', error)
        return
      }
      
      setFeedBatchAssignments(prev => prev.filter(assignment => assignment.id !== id))
      
      await logAuditAction('DELETE', 'feed_batch_assignments', id, assignmentToDelete, null)
      
    } catch (err) {
      console.warn('Feed batch assignment feature not available yet:', err)
    }
  }

  // Helper function to update chicken inventory transactions and save to localStorage
  const updateChickenInventoryTransactions = (newTransactions) => {
    setChickenInventoryTransactionsState(newTransactions)
    localStorage.setItem('chickenInventoryTransactions', JSON.stringify(newTransactions))
  }

  // Function to log chicken inventory transaction
  const logChickenTransaction = async (batchId, transactionType, quantityChanged, reason = '', referenceId = null, referenceType = null) => {
    try {
      const transactionData = {
        batch_id: batchId,
        transaction_type: transactionType,
        quantity_changed: quantityChanged,
        reason: reason,
        reference_id: referenceId,
        reference_type: referenceType,
        transaction_date: new Date().toISOString().split('T')[0]
      }

      // Try to save to Supabase
      try {
        const { error } = await supabase
          .from('chicken_inventory_transactions')
          .insert(transactionData)
        
        if (error) {
          console.warn('Failed to save chicken transaction to Supabase:', error)
        }
      } catch (supabaseError) {
        console.warn('Supabase not available for chicken transactions, saving locally only:', supabaseError)
      }

      // Always update local state
      const newTransaction = {
        ...transactionData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setChickenInventoryTransactions(prev => [newTransaction, ...prev])

      // Log audit action
      await logAuditAction('CREATE', 'chicken_inventory_transactions', newTransaction.id, null, newTransaction)

      return newTransaction
    } catch (err) {
      console.error('Error logging chicken transaction:', err)
      throw err
    }
  }

  // Load dressed chickens from Supabase
  // useEffect(() => {
  //   async function loadDressedChickens() {
  //     try {
  //       const { data, error } = await supabase
  //         .from('dressed_chickens')
  //         .select('*')
  //         .order('processing_date', { ascending: false })
  //       
  //       if (error && !error.message.includes('relation "dressed_chickens" does not exist')) {
  //         throw error
  //       }
  //       
  //       if (data) {
  //         setDressedChickens(data)
  //       }
  //     } catch (err) {
  //       console.warn('Dressed chickens table not available yet:', err)
  //     }
  //   }
  //   
  //   if (!loading && (!migrationStatus.needed || migrationStatus.completed)) {
  //     loadDressedChickens()
  //   }
  // }, [loading, migrationStatus.needed, migrationStatus.completed])

  // Batch Relationships state and functions
  // Load batch relationships from Supabase
  // useEffect(() => {
  //   async function loadBatchRelationships() {
  //     try {
  //       const { data, error } = await supabase
  //         .from('batch_relationships')
  //         .select('*')
  //         .order('created_at', { ascending: false })
  //       
  //       if (error && !error.message.includes('relation "batch_relationships" does not exist')) {
  //         throw error
  //       }
  //       
  //       if (data) {
  //         setBatchRelationships(data)
  //       }
  //     } catch (err) {
  //       console.warn('Batch relationships table not available yet:', err)
  //     }
  //   }
  //   
  //   if (!loading && (!migrationStatus.needed || migrationStatus.completed)) {
  //     loadBatchRelationships()
  //   }
  // }, [loading, migrationStatus.needed, migrationStatus.completed])

  const addDressedChicken = async (dressedChickenData) => {
    try {
      const dressedChicken = {
        id: Date.now().toString(),
        ...dressedChickenData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Save to Supabase first
      const { data, error } = await supabase.from('dressed_chickens').insert(dressedChicken).select()
      if (error) {
        console.error('Failed to save to Supabase:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })

        // Instead of just warning, let's throw the error so the user knows
        throw new Error(`Database error: ${error.message}. Please check if the database tables are properly set up.`)
      }

      // Update local state using helper function that also saves to localStorage
      setDressedChickens([dressedChicken, ...dressedChickens])

      // Log audit action
      await logAuditAction('CREATE', 'dressed_chickens', dressedChicken.id, null, dressedChicken)

      return dressedChicken
    } catch (err) {
      console.error('Error adding dressed chicken:', err)
      throw err
    }
  }

  const updateDressedChicken = async (id, updates) => {
    try {
      const oldDressedChicken = dressedChickens.find(item => item.id === id)
      if (!oldDressedChicken) {
        console.error('Dressed chicken not found with ID:', id);
        console.error('Available IDs:', dressedChickens.map(item => item.id));
        throw new Error('Dressed chicken not found')
      }

      const updatedDressedChicken = { ...oldDressedChicken, ...updates, updated_at: new Date().toISOString() }

      // Update in Supabase
      const { data, error } = await supabase
        .from('dressed_chickens')
        .update(updatedDressedChicken)
        .eq('id', id)
        .select()

      if (error) {
        console.error('Supabase update error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Instead of just warning, let's throw the error so the user knows
        throw new Error(`Database update failed: ${error.message}. Please check your database connection and table permissions.`)
      }

      // Update local state using helper function that also saves to localStorage
      setDressedChickens(dressedChickens.map(item =>
        item.id === id ? updatedDressedChicken : item
      ))

      // Log audit action
      await logAuditAction('UPDATE', 'dressed_chickens', id, oldDressedChicken, updatedDressedChicken)

      return updatedDressedChicken
    } catch (err) {
      console.error('Error updating dressed chicken:', err)
      throw err
    }
  }

  const deleteDressedChicken = async (id) => {
    try {
      const dressedChickenToDelete = dressedChickens.find(item => item.id === id)
      if (!dressedChickenToDelete) throw new Error('Dressed chicken not found')
      
      // Delete from Supabase
      const { error } = await supabase
        .from('dressed_chickens')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.warn('Failed to delete from Supabase, deleting locally only:', error)
      }
      
      // Update local state using helper function that also saves to localStorage
      setDressedChickens(dressedChickens.filter(item => item.id !== id))
      
      // Log audit action
      await logAuditAction('DELETE', 'dressed_chickens', id, dressedChickenToDelete, null)
    } catch (err) {
      console.error('Error deleting dressed chicken:', err)
      throw err
    }
  }

  // Batch Relationship CRUD operations
  const addBatchRelationship = async (relationshipData) => {
    try {
      const relationship = {
        id: Date.now().toString(),
        ...relationshipData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Save to Supabase first
      const { error } = await supabase.from('batch_relationships').insert(relationship)
      if (error) {
        console.warn('Failed to save to Supabase, saving locally only:', error)
      }
      
      // Update local state using helper function that also saves to localStorage
      setBatchRelationships([relationship, ...batchRelationships])
      
      // Log audit action
      await logAuditAction('CREATE', 'batch_relationships', relationship.id, null, relationship)
      
      return relationship
    } catch (err) {
      console.error('Error adding batch relationship:', err)
      throw err
    }
  }

  const updateBatchRelationship = async (id, updates) => {
    try {
      const oldRelationship = batchRelationships.find(item => item.id === id)
      if (!oldRelationship) throw new Error('Batch relationship not found')
      
      const updatedRelationship = { ...oldRelationship, ...updates, updated_at: new Date().toISOString() }
      
      // Update in Supabase
      const { error } = await supabase
        .from('batch_relationships')
        .update(updatedRelationship)
        .eq('id', id)
      
      if (error) {
        console.warn('Failed to update in Supabase, updating locally only:', error)
      }
      
      // Update local state using helper function that also saves to localStorage
      setBatchRelationships(batchRelationships.map(item =>
        item.id === id ? updatedRelationship : item
      ))
      
      // Log audit action
      await logAuditAction('UPDATE', 'batch_relationships', id, oldRelationship, updatedRelationship)
      
      return updatedRelationship
    } catch (err) {
      console.error('Error updating batch relationship:', err)
      throw err
    }
  }

  const deleteBatchRelationship = async (id) => {
    try {
      const relationshipToDelete = batchRelationships.find(item => item.id === id)
      if (!relationshipToDelete) throw new Error('Batch relationship not found')
      
      // Delete from Supabase
      const { error } = await supabase
        .from('batch_relationships')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.warn('Failed to delete from Supabase, deleting locally only:', error)
      }
      
      // Update local state using helper function that also saves to localStorage
      setBatchRelationships(batchRelationships.filter(item => item.id !== id))
      
      // Log audit action
      await logAuditAction('DELETE', 'batch_relationships', id, relationshipToDelete, null)
    } catch (err) {
      console.error('Error deleting batch relationship:', err)
      throw err
    }
  }

  const value = {
    // State
    chickens,
    stock,
    transactions,
    balance,
    liveChickens: liveChickens,
    feedInventory,
    feedConsumption,
    feedBatchAssignments,
    chickenInventoryTransactions,
    weightHistory,
    dressedChickens,
    batchRelationships,
    loading,
    error,
    migrationStatus,

    // Migration
    performMigration,

    // CRUD operations
    addChicken,
    updateChicken,
    deleteChicken,
    addStock,
    deleteStock,
    addFunds,
    addExpense,
    withdrawFunds,
    clearBalance,
    deleteTransaction,

    // Live Chicken operations
    addLiveChicken,
    updateLiveChicken,
    deleteLiveChicken,

    // Weight History operations
    addWeightHistory,

    // Feed Management operations
    addFeedInventory,
    updateFeedInventory,
    deleteFeedInventory,
    addFeedConsumption,
    deleteFeedConsumption,

    // Feed batch assignment operations
    addFeedBatchAssignment,
    deleteFeedBatchAssignment,

    // Feed analysis functions
    getLowFeedAlerts,
    calculateProjectedFeedNeeds,

    // Chicken Inventory Transaction operations
    logChickenTransaction,

    // Dressed Chicken operations
    addDressedChicken,
    updateDressedChicken,
    deleteDressedChicken,

    // Batch Relationship operations
    addBatchRelationship,
    updateBatchRelationship,
    deleteBatchRelationship,

    // Stats and reports
    stats,
    calculateStats,
    generateReport,
    exportToCSV
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export { AppContext }