import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { supabase, supabaseUrl, optimizedSupabase } from '../utils/supabaseClient'
import { isMigrationNeeded, migrateFromLocalStorage } from '../utils/migrateData'
import { formatNumber } from '../utils/formatters'
import { storageOptimizer } from '../utils/requestDedupe'
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
  
  // Helper functions to update state and save to localStorage with optimization
  const setChickens = (newChickens) => {
    // Ensure newChickens is always an array
    const chickensArray = Array.isArray(newChickens) ? newChickens : []
    setChickensState(chickensArray)
    storageOptimizer.setItem('chickens', {
      data: chickensArray,
      timestamp: Date.now(),
      version: '1.0'
    })
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
  // Configuration tables state
  const [chickenSizeCategories, setChickenSizeCategoriesState] = useState([])
  const [chickenPartTypes, setChickenPartTypesState] = useState([])
  const [chickenPartStandards, setChickenPartStandardsState] = useState([])
  const [chickenProcessingConfigs, setChickenProcessingConfigsState] = useState([])
  
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

  // Pagination state for each data type
  const [pagination, setPagination] = useState({
    chickens: { page: 1, pageSize: 20, total: 0, hasMore: true },
    stock: { page: 1, pageSize: 20, total: 0, hasMore: true },
    transactions: { page: 1, pageSize: 20, total: 0, hasMore: true },
    liveChickens: { page: 1, pageSize: 20, total: 0, hasMore: true },
    feedInventory: { page: 1, pageSize: 20, total: 0, hasMore: true },
    feedConsumption: { page: 1, pageSize: 20, total: 0, hasMore: true },
    feedBatchAssignments: { page: 1, pageSize: 20, total: 0, hasMore: true },
    chickenInventoryTransactions: { page: 1, pageSize: 20, total: 0, hasMore: true },
    weightHistory: { page: 1, pageSize: 20, total: 0, hasMore: true },
    dressedChickens: { page: 1, pageSize: 20, total: 0, hasMore: true },
    batchRelationships: { page: 1, pageSize: 20, total: 0, hasMore: true }
  })

  // Cache for loaded data to avoid redundant requests
  const [dataCache, setDataCache] = useState({
    chickens: [],
    stock: [],
    transactions: [],
    liveChickens: [],
    feedInventory: [],
    feedConsumption: [],
    feedBatchAssignments: [],
    chickenInventoryTransactions: [],
    weightHistory: [],
    dressedChickens: [],
    batchRelationships: []
  })

  // Cache invalidation helper
  const invalidateCache = (tableName, recordId = null) => {
    // Invalidate optimized client cache
    optimizedSupabase.invalidateTableCache(tableName, recordId)

    // Clear local data cache for this table
    setDataCache(prev => ({
      ...prev,
      [tableName]: {}
    }))
  }

  // Paginated data loading for traditional pagination
  const loadPaginatedData = async (dataType, page = 1, pageSize = 20, filters = {}) => {
    try {
      // Use optimized client for enhanced caching and performance
      const adaptiveTimeout = optimizedSupabase.getAdaptiveCacheTimeout(dataType)
      const cacheKey = `paginated_${dataType}_${page}_${pageSize}_${JSON.stringify(filters)}`

      // Check cache first
      if (dataCache[dataType] && dataCache[dataType][cacheKey]) {
        const cached = dataCache[dataType][cacheKey]
        if (Date.now() - cached.timestamp < adaptiveTimeout) {
          return cached
        }
      }

      // Build query options for pagination
      let queryOptions = {
        orderBy: getDefaultOrderBy(dataType),
        range: {
          from: (page - 1) * pageSize,
          to: page * pageSize - 1
        }
      }

      // Apply filters if provided
      let queryFilters = {}
      if (filters.customer) {
        queryFilters.customer = filters.customer
      }
      if (filters.status) {
        queryFilters.status = filters.status
      }
      if (filters.startDate) {
        queryFilters.date = `gte.${filters.startDate}`
      }
      if (filters.endDate) {
        queryFilters.date = `lte.${filters.endDate}`
      }

      // Use optimized columns for pagination
      let selectColumns = getOptimizedColumns(dataType, 'list')

      // Use optimized client for better performance
      const result = await optimizedSupabase.select(dataType, selectColumns, queryFilters, queryOptions)
      const { data: paginatedData, count: paginatedCount } = result

      // Update cache for paginated data
      setDataCache(prev => ({
        ...prev,
        [dataType]: {
          ...prev[dataType],
          [cacheKey]: {
            data: paginatedData || [],
            count: paginatedCount || 0,
            timestamp: Date.now()
          }
        }
      }))

      return { data: paginatedData || [], count: paginatedCount || 0 }
    } catch (error) {
      console.error(`Error loading paginated ${dataType}:`, error)
      return { data: [], count: 0 }
    }
  }

  // Virtualized data loading for large datasets
  const loadVirtualizedData = async (dataType, options = {}) => {
    const {
      startIndex = 0,
      stopIndex = 20,
      filters = {},
      sortBy = null,
      sortDirection = 'DESC'
    } = options

    try {
      // Use optimized client for enhanced caching and performance
      const adaptiveTimeout = optimizedSupabase.getAdaptiveCacheTimeout(dataType)
      const cacheKey = `virtual_${dataType}_${startIndex}_${stopIndex}_${JSON.stringify(filters)}_${sortBy}_${sortDirection}`

      // Check cache first
      if (dataCache[dataType] && dataCache[dataType][cacheKey]) {
        const cached = dataCache[dataType][cacheKey]
        if (Date.now() - cached.timestamp < adaptiveTimeout) {
          return cached
        }
      }

      // Use minimal columns for virtualization
      let selectColumns = getOptimizedColumns(dataType, 'minimal')
      let queryOptions = {
        orderBy: sortBy ? { column: sortBy, ascending: sortDirection === 'ASC' } : getDefaultOrderBy(dataType),
        range: {
          from: startIndex,
          to: stopIndex
        }
      }

      // Use optimized client for better performance
      const result = await optimizedSupabase.select(dataType, selectColumns, filters, queryOptions)
      const { data: virtualData, count: virtualCount } = result

      // Transform data if needed for virtualization
      let transformedVirtualData = virtualData
      if (dataType === 'feed_inventory' && virtualData) {
        transformedVirtualData = virtualData.map(feed => ({
          ...feed,
          assigned_batches: feed.feed_batch_assignments?.map(assignment => ({
            batch_id: assignment.chicken_batch_id,
            assigned_quantity_kg: assignment.assigned_quantity_kg
          })) || []
        }))
      }

      // Update cache for virtualized data
      setDataCache(prev => ({
        ...prev,
        [dataType]: {
          ...prev[dataType],
          [cacheKey]: {
            data: transformedVirtualData || [],
            count: virtualCount || 0,
            timestamp: Date.now()
          }
        }
      }))

      return { data: transformedVirtualData || [], count: virtualCount || 0 }
    } catch (error) {
      console.error(`Error loading virtualized ${dataType}:`, error)
      return { data: [], count: 0 }
    }
  }

  // Helper function to get default ordering for each data type
  const getDefaultOrderBy = (dataType) => {
    const orderMap = {
      chickens: { column: 'created_at', ascending: false },
      stock: { column: 'date', ascending: false },
      transactions: { column: 'date', ascending: false },
      live_chickens: { column: 'hatch_date', ascending: false },
      feed_inventory: { column: 'purchase_date', ascending: false },
      feed_consumption: { column: 'consumption_date', ascending: false },
      chicken_inventory_transactions: { column: 'created_at', ascending: false },
      dressed_chickens: { column: 'processing_date', ascending: false },
      batch_relationships: { column: 'created_at', ascending: false }
    }
    return orderMap[dataType] || { column: 'created_at', ascending: false }
  }

  // Enhanced column selection for reduced payload size with context awareness
  const getOptimizedColumns = (dataType, context = 'list') => {
    const columnMap = {
      chickens: {
        list: 'id, date, customer, phone, location, count, size, price, amount_paid, balance, status, calculation_mode, inventory_type, batch_id, part_type, created_at',
        detail: 'id, date, customer, phone, location, count, size, price, amount_paid, balance, status, calculation_mode, inventory_type, batch_id, part_type, created_at, updated_at',
        minimal: 'id, customer, status, balance, created_at'
      },
      stock: {
        list: 'id, date, description, count, size, cost_per_kg, calculation_mode, created_at',
        detail: 'id, date, description, count, size, cost_per_kg, calculation_mode, notes, created_at, updated_at',
        minimal: 'id, description, count, size'
      },
      transactions: {
        list: 'id, date, type, amount, description, created_at',
        detail: 'id, date, type, amount, description, created_at, updated_at',
        minimal: 'id, type, amount, date'
      },
      live_chickens: {
        list: 'id, batch_id, breed, initial_count, current_count, hatch_date, expected_weight, current_weight, status, lifecycle_stage',
        detail: 'id, batch_id, breed, initial_count, current_count, hatch_date, expected_weight, current_weight, feed_type, status, lifecycle_stage, mortality, notes, created_at, updated_at',
        minimal: 'id, batch_id, breed, current_count, status'
      },
      feed_inventory: {
        list: 'id, batch_number, feed_type, brand, quantity_kg, cost_per_kg, purchase_date, expiry_date, status',
        detail: 'id, batch_number, feed_type, brand, quantity_kg, cost_per_kg, cost_per_bag, number_of_bags, purchase_date, expiry_date, supplier, status, notes, created_at, updated_at',
        minimal: 'id, batch_number, feed_type, quantity_kg, status'
      },
      feed_consumption: {
        list: 'id, feed_id, chicken_batch_id, quantity_consumed, consumption_date, created_at',
        detail: 'id, feed_id, chicken_batch_id, quantity_consumed, consumption_date, notes, created_at, updated_at',
        minimal: 'id, quantity_consumed, consumption_date'
      },
      chicken_inventory_transactions: {
        list: 'id, batch_id, transaction_type, quantity_changed, reason, transaction_date, created_at',
        detail: 'id, batch_id, transaction_type, quantity_changed, reason, reference_id, reference_type, transaction_date, created_at, updated_at',
        minimal: 'id, transaction_type, quantity_changed, transaction_date'
      },
      dressed_chickens: {
        list: 'id, batch_id, processing_date, initial_count, current_count, average_weight, size_category, status',
        detail: 'id, batch_id, processing_date, initial_count, current_count, average_weight, size_category, status, storage_location, expiry_date, notes, parts_count, parts_weight, created_at, updated_at',
        minimal: 'id, batch_id, size_category, current_count, status'
      }
    }

    const contextColumns = columnMap[dataType]?.[context] || columnMap[dataType]?.list || '*'
    return contextColumns
  }

  // Load data from Supabase with optimized loading
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true)

        // Load only essential data initially with optimized queries (balance and recent transactions only)
        try {
          const balancePromise = supabase
            .from('balance')
            .select('amount')
            .eq('id', 1)
            .single()
            .then(({ data, error }) => {
              if (error && !error.message.includes('relation "balance" does not exist')) {
                throw error
              }
              return data?.amount || 0
            })
            .catch(() => 0)

          // Only load recent transactions (last 7 days) for dashboard
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

          const recentTransactionsPromise = supabase
            .from('transactions')
            .select('id, date, type, amount, description')
            .gte('date', sevenDaysAgo.toISOString().split('T')[0])
            .order('date', { ascending: false })
            .limit(20)

          // Load balance first (most critical)
          const currentBalance = await balancePromise
          setBalance(currentBalance)

          // Load recent transactions
          const { data: recentTransactions } = await recentTransactionsPromise
          if (recentTransactions) {
            setTransactions(recentTransactions)
          }

          // Load recent chicken orders (last 30 days for better performance)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

          const { data: recentChickens } = await supabase
            .from('chickens')
            .select('id, date, customer, count, size, price, amount_paid, balance, status, batch_id')
            .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
            .order('created_at', { ascending: false })
            .limit(100)

          if (recentChickens) {
            setChickens(recentChickens)
          }
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
                const parsedChickens = JSON.parse(localChickens)
                // Handle both old format (direct array) and new format (object with data property)
                let chickensArray = []
                if (Array.isArray(parsedChickens)) {
                  chickensArray = parsedChickens
                } else if (parsedChickens && typeof parsedChickens === 'object' && Array.isArray(parsedChickens.data)) {
                  chickensArray = parsedChickens.data
                }

                if (chickensArray.length > 0) {
                  setChickens(chickensArray)
                } else {
                  console.warn('Chickens data in localStorage is empty or invalid, resetting to empty array')
                  setChickens([])
                }
              } catch (e) {
                console.warn('Invalid chickens data in localStorage, resetting to empty array:', e)
                setChickens([])
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

        // Load localStorage data as fallback for other data types
        const loadLocalStorageData = () => {
          const localBalance = localStorage.getItem('balance')
          if (localBalance && localBalance !== 'undefined') {
            setBalance(parseFloat(localBalance))
          }

          Object.keys(dataCache).forEach(key => {
            const localData = localStorage.getItem(key)
            if (localData && localData !== 'undefined') {
              try {
                const parsedData = JSON.parse(localData)
                setDataCache(prev => ({
                  ...prev,
                  [key]: { [`${key}_local`]: parsedData }
                }))

                // Update state with localStorage data
                switch (key) {
                  case 'chickens':
                    // Handle both old format (direct array) and new format (object with data property)
                    let chickensArray = []
                    if (Array.isArray(parsedData)) {
                      chickensArray = parsedData
                    } else if (parsedData && typeof parsedData === 'object' && Array.isArray(parsedData.data)) {
                      chickensArray = parsedData.data
                    }

                    if (chickensArray.length > 0) {
                      setChickens(chickensArray)
                    } else {
                      console.warn(`Chickens data from localStorage is empty or invalid, skipping:`, parsedData)
                    }
                    break
                  case 'stock':
                    setStock(parsedData)
                    break
                  case 'liveChickens':
                    setLiveChickens(parsedData)
                    break
                  case 'feedInventory':
                    setFeedInventory(parsedData)
                    break
                  case 'feedConsumption':
                    setFeedConsumption(parsedData)
                    break
                  case 'dressedChickens':
                    setDressedChickens(parsedData)
                    break
                  case 'batchRelationships':
                    setBatchRelationships(parsedData)
                    break
                }
              } catch (e) {
                console.warn(`Invalid ${key} data in localStorage:`, e)
              }
            }
          })
        }

        loadLocalStorageData()

      } catch (err) {
        console.error('Error loading data from Supabase:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

  // Only load data if migration is not needed or has been completed
  if (!loading && (!migrationStatus.needed || migrationStatus.completed)) {
    loadInitialData()
  }
}, [loading, migrationStatus.needed, migrationStatus.completed])

  // Lazy loading functions for page-specific data
  const loadLiveChickensData = async () => {
    if (liveChickens.length === 0) {
      try {
        // Load only recent 50 live chickens with essential columns to reduce data transfer
        const { data, error } = await supabase
          .from('live_chickens')
          .select('id, batch_id, breed, initial_count, current_count, hatch_date, status, lifecycle_stage') // Select only essential columns
          .order('hatch_date', { ascending: false })
          .limit(50)

        if (error && !error.message.includes('relation "live_chickens" does not exist')) {
          throw error
        }

        if (data) {
          setLiveChickens(data)
        }
      } catch (err) {
        console.error('Error loading live chickens:', err)
      }
    }
  }

  const loadDressedChickensData = async () => {
    if (dressedChickens.length === 0) {
      try {
        // Load only recent 50 dressed chickens with essential columns to reduce data transfer
        const { data, error } = await supabase
          .from('dressed_chickens')
          .select('id, batch_id, processing_date, initial_count, current_count, status, size_category') // Select only essential columns
          .order('processing_date', { ascending: false })
          .limit(50)

        if (error && !error.message.includes('relation "dressed_chickens" does not exist')) {
          throw error
        }

        if (data) {
          setDressedChickens(data)
        }
      } catch (err) {
        console.error('Error loading dressed chickens:', err)
      }
    }
  }

  const loadFeedInventoryData = async () => {
    if (feedInventory.length === 0) {
      try {
        // Load only recent 50 feed inventory items with essential columns to reduce data transfer
        const { data, error } = await supabase
          .from('feed_inventory')
          .select(`
            id, batch_number, feed_type, brand, quantity_kg, status, purchase_date,
            feed_batch_assignments (
              id,
              chicken_batch_id,
              assigned_quantity_kg
            )
          `) // Select only essential columns
          .order('purchase_date', { ascending: false })
          .limit(50)

        if (error && !error.message.includes('relation "feed_inventory" does not exist')) {
          throw error
        }

        if (data) {
          const transformedData = data.map(feed => ({
            ...feed,
            assigned_batches: feed.feed_batch_assignments?.map(assignment => ({
              batch_id: assignment.chicken_batch_id,
              assigned_quantity_kg: assignment.assigned_quantity_kg
            })) || []
          }))
          setFeedInventory(transformedData)
        }
      } catch (err) {
        console.error('Error loading feed inventory:', err)
      }
    }
  }

  
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

      // Invalidate cache for chickens table
      invalidateCache('chickens')

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

      // Invalidate cache for chickens table
      invalidateCache('chickens', [id])

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
        let tableName = 'live_chickens'
        let countField = 'current_count'

        // Determine which table to update based on inventory type
        if (chickenToDelete.inventory_type === 'dressed') {
          tableName = 'dressed_chickens'
          countField = 'current_count' // For dressed chickens, we use current_count
        } else if (chickenToDelete.inventory_type === 'parts') {
          tableName = 'dressed_chickens'
          countField = `parts_count->>${chickenToDelete.part_type}` // For parts, we update the specific part count
        }

        try {
          if (chickenToDelete.inventory_type === 'parts') {
            // For parts, get the parts_count and update the specific part
            const { data: currentBatch, error: fetchError } = await supabase
              .from(tableName)
              .select('parts_count')
              .eq('id', chickenToDelete.batch_id)
              .single()

            if (fetchError) {
              console.warn(`Failed to fetch parts count from ${tableName}:`, fetchError)
            } else if (currentBatch) {
              const partsCount = currentBatch.parts_count || {}
              const newCount = (partsCount[chickenToDelete.part_type] || 0) + chickenToDelete.count
              const updatedPartsCount = { ...partsCount, [chickenToDelete.part_type]: newCount }

              const batchUpdate = await supabase
                .from(tableName)
                .update({ parts_count: updatedPartsCount })
                .eq('id', chickenToDelete.batch_id)

              if (batchUpdate.error) {
                console.warn('Failed to restore parts count to batch:', batchUpdate.error)
              }

              // Log return transaction
              await logChickenTransaction(
                chickenToDelete.batch_id,
                'return',
                chickenToDelete.count,
                `Return of ${chickenToDelete.count} ${chickenToDelete.part_type} parts from deleted order ${id}`,
                id,
                'chicken_order_return'
              )
            }
          } else {
            // For live or dressed chickens
            const { data: currentBatch, error: fetchError } = await supabase
              .from(tableName)
              .select('current_count')
              .eq('id', chickenToDelete.batch_id)
              .single()

            if (fetchError) {
              console.warn(`Failed to fetch current count from ${tableName}:`, fetchError)
            } else if (currentBatch) {
              const newCount = currentBatch.current_count + chickenToDelete.count

              const batchUpdate = await supabase
                .from(tableName)
                .update({ current_count: newCount })
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
          }
        } catch (err) {
          console.warn('Error restoring inventory:', err)
        }
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

      // Invalidate cache for chickens table and related inventory
      invalidateCache('chickens', [id])
      if (chickenToDelete.batch_id) {
        // Also invalidate the inventory tables that might be affected
        invalidateCache(chickenToDelete.inventory_type === 'live' ? 'live_chickens' : 'dressed_chickens', [chickenToDelete.batch_id])
      }

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
      
      // Invalidate cache for stock and transactions tables
      invalidateCache('stock')
      invalidateCache('transactions')

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

      // Invalidate cache for transactions and balance
      invalidateCache('transactions')

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

      // Invalidate cache for transactions
      invalidateCache('transactions')

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
    // Ensure chickens is always an array before using reduce
    const chickensArray = Array.isArray(chickens) ? chickens : []

    const totalChickens = chickensArray.reduce((sum, chicken) => sum + (chicken?.count || 0), 0)
    const totalRevenue = chickensArray.reduce((sum, chicken) => {
      return sum + ((chicken?.count || 0) * (chicken?.size || 0) * (chicken?.price || 0))
    }, 0)

    const totalExpenses = transactions
      .filter(t => t?.type === 'expense' || t?.type === 'stock_expense')
      .reduce((sum, t) => sum + (t?.amount || 0), 0)

    const outstandingBalance = chickensArray.reduce((sum, chicken) => sum + (chicken?.balance || 0), 0)

    const paidCount = chickensArray.filter(c => c?.status === 'paid').length
    const partialCount = chickensArray.filter(c => c?.status === 'partial').length
    const pendingCount = chickensArray.filter(c => c?.status === 'pending').length

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

      // Invalidate cache for live chickens table
      invalidateCache('live_chickens')

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
      
      // Invalidate cache for live chickens table
      invalidateCache('live_chickens', [id])

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
      
      // Invalidate cache for live chickens table
      invalidateCache('live_chickens', [id])

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
      
      // Invalidate cache for feed inventory and transactions if applicable
      invalidateCache('feed_inventory')
      if (feedTransaction) {
        invalidateCache('transactions')
      }

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
    setChickenInventoryTransactions(newTransactions)
    localStorage.setItem('chickenInventoryTransactions', JSON.stringify(newTransactions))
  }

  // Function to load live chickens from database
  const loadLiveChickens = async () => {
    try {
      const { data, error } = await supabase
        .from('live_chickens')
        .select('*')
        .order('hatch_date', { ascending: false })

      if (error && !error.message.includes('relation "live_chickens" does not exist')) {
        throw error
      }

      if (data) {
        setLiveChickens(data)
      }
    } catch (err) {
      console.error('Error loading live chickens:', err)
    }
  }

  // Function to load dressed chickens from database
  const loadDressedChickens = async () => {
    try {
      const { data, error } = await supabase
        .from('dressed_chickens')
        .select('*')
        .order('processing_date', { ascending: false })

      if (error && !error.message.includes('relation "dressed_chickens" does not exist')) {
        throw error
      }

      if (data) {
        setDressedChickens(data)
      }
    } catch (err) {
      console.error('Error loading dressed chickens:', err)
    }
  }

  // Function to load feed inventory from database
  const loadFeedInventory = async () => {
    try {
      const { data, error } = await supabase
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
        .order('purchase_date', { ascending: false })

      if (error && !error.message.includes('relation "feed_inventory" does not exist')) {
        throw error
      }

      if (data) {
        const transformedData = data.map(feed => ({
          ...feed,
          assigned_batches: feed.feed_batch_assignments?.map(assignment => ({
            batch_id: assignment.chicken_batch_id,
            assigned_quantity_kg: assignment.assigned_quantity_kg
          })) || []
        }))
        setFeedInventory(transformedData)
      }
    } catch (err) {
      console.error('Error loading feed inventory:', err)
    }
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
  const loadBatchRelationships = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_relationships')
        .select('*')
        .order('created_at', { ascending: false })

      if (error && !error.message.includes('relation "batch_relationships" does not exist')) {
        throw error
      }

      if (data) {
        setBatchRelationships(data)
      }
    } catch (err) {
      console.warn('Batch relationships table not available yet:', err)
    }
  }

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

      // Invalidate cache for dressed chickens table
      invalidateCache('dressed_chickens')

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

  // Helper function for creating batch relationships with automatic field mapping
  const createBatchRelationship = async (sourceBatch, targetBatch, relationshipType, options = {}) => {
    try {
      // Determine source batch type based on the source object or provided option
      let sourceBatchType = options.sourceBatchType;
      if (!sourceBatchType) {
        if (sourceBatch.breed && sourceBatch.current_count !== undefined) {
          sourceBatchType = 'live_chickens';
        } else if (sourceBatch.processing_date && sourceBatch.average_weight !== undefined) {
          sourceBatchType = 'dressed_chickens';
        } else if (sourceBatch.feed_type && sourceBatch.quantity_kg !== undefined) {
          sourceBatchType = 'feed_inventory';
        } else {
          throw new Error('Cannot determine source batch type. Please provide sourceBatchType in options.');
        }
      }

      // Determine target batch type based on the target object or provided option
      let targetBatchType = options.targetBatchType;
      if (!targetBatchType) {
        if (targetBatch.breed && targetBatch.current_count !== undefined) {
          targetBatchType = 'live_chickens';
        } else if (targetBatch.processing_date && targetBatch.average_weight !== undefined) {
          targetBatchType = 'dressed_chickens';
        } else if (targetBatch.feed_type && targetBatch.quantity_kg !== undefined) {
          targetBatchType = 'feed_inventory';
        } else {
          throw new Error('Cannot determine target batch type. Please provide targetBatchType in options.');
        }
      }

      // Extract batch IDs
      const sourceBatchId = sourceBatch.batch_id || sourceBatch.id;
      const targetBatchId = targetBatch.batch_id || targetBatch.id;

      if (!sourceBatchId || !targetBatchId) {
        throw new Error('Both source and target batches must have valid batch_id or id fields');
      }

      // Determine quantity (use provided quantity or infer from batches)
      let quantity = options.quantity;
      if (quantity === undefined) {
        // Try to infer quantity from the most appropriate field
        if (sourceBatchType === 'live_chickens' && sourceBatch.current_count !== undefined) {
          quantity = sourceBatch.current_count;
        } else if (sourceBatchType === 'dressed_chickens' && sourceBatch.current_count !== undefined) {
          quantity = sourceBatch.current_count;
        } else if (sourceBatchType === 'feed_inventory' && sourceBatch.quantity_kg !== undefined) {
          quantity = Math.floor(sourceBatch.quantity_kg); // Convert to whole number for feed
        } else if (targetBatchType === 'live_chickens' && targetBatch.current_count !== undefined) {
          quantity = targetBatch.current_count;
        } else if (targetBatchType === 'dressed_chickens' && targetBatch.current_count !== undefined) {
          quantity = targetBatch.current_count;
        } else if (targetBatchType === 'feed_inventory' && targetBatch.quantity_kg !== undefined) {
          quantity = Math.floor(targetBatch.quantity_kg);
        } else {
          quantity = 0; // Default to 0 if cannot determine
        }
      }

      // Prepare relationship data
      const relationshipData = {
        source_batch_id: sourceBatchId,
        source_batch_type: sourceBatchType,
        target_batch_id: targetBatchId,
        target_batch_type: targetBatchType,
        relationship_type: relationshipType,
        quantity: quantity,
        notes: options.notes || null
      };

      // Use the existing addBatchRelationship function with validation
      return await addBatchRelationship(relationshipData);
    } catch (err) {
      console.error('Error creating batch relationship:', err);
      throw err;
    }
  }

  // Batch Relationship CRUD operations
  const addBatchRelationship = async (relationshipData) => {
    try {
      // Input validation for required fields
      const requiredFields = ['source_batch_id', 'source_batch_type', 'target_batch_id', 'target_batch_type', 'relationship_type'];
      const missingFields = requiredFields.filter(field => !relationshipData[field]);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields for batch relationship: ${missingFields.join(', ')}`);
      }

      // Validate batch types are valid (updated to match schema constraints)
      const validBatchTypes = ['live_chickens', 'dressed_chickens', 'feed_inventory'];
      if (!validBatchTypes.includes(relationshipData.source_batch_type)) {
        throw new Error(`Invalid source_batch_type: ${relationshipData.source_batch_type}. Must be one of: ${validBatchTypes.join(', ')}`);
      }
      if (!validBatchTypes.includes(relationshipData.target_batch_type)) {
        throw new Error(`Invalid target_batch_type: ${relationshipData.target_batch_type}. Must be one of: ${validBatchTypes.join(', ')}`);
      }

      // Add soft delete awareness - new records are active by default
      if (relationshipData.is_active === undefined) {
        relationshipData.is_active = true;
      }

      // Validate relationship types (updated to match schema constraints)
      const validRelationshipTypes = ['fed_to', 'processed_from', 'sold_to', 'transferred_to', 'split_from', 'partial_processed_from'];
      if (!validRelationshipTypes.includes(relationshipData.relationship_type)) {
        throw new Error(`Invalid relationship_type: ${relationshipData.relationship_type}. Must be one of: ${validRelationshipTypes.join(', ')}`);
      }

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

      // Soft delete from Supabase (set is_active to false and deleted_at timestamp)
      const { error } = await supabase
        .from('batch_relationships')
        .update({
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.warn('Failed to soft delete from Supabase, falling back to hard delete:', error)
        // Fallback to hard delete if soft delete fails
        const { error: hardDeleteError } = await supabase
          .from('batch_relationships')
          .delete()
          .eq('id', id)

        if (hardDeleteError) {
          console.warn('Hard delete also failed:', hardDeleteError)
        }
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

  // Hard delete function for cases where soft delete is not appropriate
  const hardDeleteBatchRelationship = async (id) => {
    try {
      const relationshipToDelete = batchRelationships.find(item => item.id === id)
      if (!relationshipToDelete) throw new Error('Batch relationship not found')

      // Hard delete from Supabase
      const { error } = await supabase
        .from('batch_relationships')
        .delete()
        .eq('id', id)

      if (error) {
        console.warn('Failed to hard delete from Supabase:', error)
      }

      // Update local state using helper function that also saves to localStorage
      setBatchRelationships(batchRelationships.filter(item => item.id !== id))

      // Log audit action
      await logAuditAction('HARD_DELETE', 'batch_relationships', id, relationshipToDelete, null)
    } catch (err) {
      console.error('Error hard deleting batch relationship:', err)
      throw err
    }
  }

  // Configuration Management CRUD operations

  // Load configuration data functions
  const loadChickenSizeCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('chicken_size_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error && !error.message.includes('relation "chicken_size_categories" does not exist')) {
        throw error
      }

      if (data) {
        setChickenSizeCategoriesState(data)
      }
    } catch (err) {
      console.error('Error loading chicken size categories:', err)
    }
  }

  const loadChickenPartTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('chicken_part_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error && !error.message.includes('relation "chicken_part_types" does not exist')) {
        throw error
      }

      if (data) {
        setChickenPartTypesState(data)
      }
    } catch (err) {
      console.error('Error loading chicken part types:', err)
    }
  }

  const loadChickenPartStandards = async () => {
    try {
      const { data, error } = await supabase
        .from('chicken_part_standards')
        .select(`
          *,
          chicken_size_categories(name),
          chicken_part_types(name)
        `)
        .eq('is_active', true)
        .order('breed', { ascending: true })

      if (error && !error.message.includes('relation "chicken_part_standards" does not exist')) {
        throw error
      }

      if (data) {
        setChickenPartStandardsState(data)
      }
    } catch (err) {
      console.error('Error loading chicken part standards:', err)
    }
  }

  const loadChickenProcessingConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('chicken_processing_config')
        .select(`
          *,
          chicken_size_categories(name)
        `)
        .eq('is_active', true)
        .order('config_name', { ascending: true })

      if (error && !error.message.includes('relation "chicken_processing_config" does not exist')) {
        throw error
      }

      if (data) {
        setChickenProcessingConfigsState(data)
      }
    } catch (err) {
      console.error('Error loading chicken processing configs:', err)
    }
  }

  // CRUD operations for chicken size categories
  const addChickenSizeCategory = async (categoryData) => {
    try {
      const { error } = await supabase.from('chicken_size_categories').insert(categoryData)
      if (error) throw error

      await loadChickenSizeCategories() // Reload to get updated data
      return categoryData
    } catch (err) {
      console.error('Error adding chicken size category:', err)
      throw err
    }
  }

  const updateChickenSizeCategory = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('chicken_size_categories')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await loadChickenSizeCategories() // Reload to get updated data
      return updates
    } catch (err) {
      console.error('Error updating chicken size category:', err)
      throw err
    }
  }

  const deleteChickenSizeCategory = async (id) => {
    try {
      const { error } = await supabase
        .from('chicken_size_categories')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      await loadChickenSizeCategories() // Reload to get updated data
    } catch (err) {
      console.error('Error deleting chicken size category:', err)
      throw err
    }
  }

  // CRUD operations for chicken part types
  const addChickenPartType = async (partTypeData) => {
    try {
      const { error } = await supabase.from('chicken_part_types').insert(partTypeData)
      if (error) throw error

      await loadChickenPartTypes() // Reload to get updated data
      return partTypeData
    } catch (err) {
      console.error('Error adding chicken part type:', err)
      throw err
    }
  }

  const updateChickenPartType = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('chicken_part_types')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await loadChickenPartTypes() // Reload to get updated data
      return updates
    } catch (err) {
      console.error('Error updating chicken part type:', err)
      throw err
    }
  }

  const deleteChickenPartType = async (id) => {
    try {
      const { error } = await supabase
        .from('chicken_part_types')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      await loadChickenPartTypes() // Reload to get updated data
    } catch (err) {
      console.error('Error deleting chicken part type:', err)
      throw err
    }
  }

  // CRUD operations for chicken part standards
  const addChickenPartStandard = async (standardData) => {
    try {
      const { error } = await supabase.from('chicken_part_standards').insert(standardData)
      if (error) throw error

      await loadChickenPartStandards() // Reload to get updated data
      return standardData
    } catch (err) {
      console.error('Error adding chicken part standard:', err)
      throw err
    }
  }

  const updateChickenPartStandard = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('chicken_part_standards')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await loadChickenPartStandards() // Reload to get updated data
      return updates
    } catch (err) {
      console.error('Error updating chicken part standard:', err)
      throw err
    }
  }

  const deleteChickenPartStandard = async (id) => {
    try {
      const { error } = await supabase
        .from('chicken_part_standards')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      await loadChickenPartStandards() // Reload to get updated data
    } catch (err) {
      console.error('Error deleting chicken part standard:', err)
      throw err
    }
  }

  // CRUD operations for chicken processing configs
  const addChickenProcessingConfig = async (configData) => {
    try {
      const { error } = await supabase.from('chicken_processing_config').insert(configData)
      if (error) throw error

      await loadChickenProcessingConfigs() // Reload to get updated data
      return configData
    } catch (err) {
      console.error('Error adding chicken processing config:', err)
      throw err
    }
  }

  const updateChickenProcessingConfig = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('chicken_processing_config')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await loadChickenProcessingConfigs() // Reload to get updated data
      return updates
    } catch (err) {
      console.error('Error updating chicken processing config:', err)
      throw err
    }
  }

  const deleteChickenProcessingConfig = async (id) => {
    try {
      const { error } = await supabase
        .from('chicken_processing_config')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      await loadChickenProcessingConfigs() // Reload to get updated data
    } catch (err) {
      console.error('Error deleting chicken processing config:', err)
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
    // Configuration state
    chickenSizeCategories,
    chickenPartTypes,
    chickenPartStandards,
    chickenProcessingConfigs,
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

    // Configuration Management state
    chickenSizeCategories,
    chickenPartTypes,
    chickenPartStandards,
    chickenProcessingConfigs,
  
    // Batch Relationship operations
    addBatchRelationship,
    updateBatchRelationship,
    deleteBatchRelationship,
    hardDeleteBatchRelationship,
    createBatchRelationship,
    loadBatchRelationships,

    // Lazy loading functions
    loadLiveChickens,
    loadDressedChickens,
    loadFeedInventory,
    loadLiveChickensData,
    loadDressedChickensData,
    loadFeedInventoryData,
  
    // Configuration Management operations
    loadChickenSizeCategories,
    loadChickenPartTypes,
    loadChickenPartStandards,
    loadChickenProcessingConfigs,
    addChickenSizeCategory,
    updateChickenSizeCategory,
    deleteChickenSizeCategory,
    addChickenPartType,
    updateChickenPartType,
    deleteChickenPartType,
    addChickenPartStandard,
    updateChickenPartStandard,
    deleteChickenPartStandard,
    addChickenProcessingConfig,
    updateChickenProcessingConfig,
    deleteChickenProcessingConfig,

    // Stats and reports
    stats,
    calculateStats,
    generateReport,
    exportToCSV,

    // Pagination and lazy loading
    pagination,
    loadPaginatedData,
    loadVirtualizedData,
    dataCache,

    // Column optimization helpers
    getOptimizedColumns,
    getDefaultOrderBy
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export { AppContext }