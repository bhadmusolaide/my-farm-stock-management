import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { supabase, supabaseUrl } from '../utils/supabaseClient'
import { isMigrationNeeded, migrateFromLocalStorage } from '../utils/migrateData'
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
  const [feedConsumption, setFeedConsumption] = useState([])
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

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        try {
          // Load chickens
          const { data: chickensData, error: chickensError } = await supabase
            .from('chickens')
            .select('*')
            .order('date', { ascending: false })
          
          if (chickensError) throw chickensError
          setChickens(chickensData || [])
          
          // Load stock
          const { data: stockData, error: stockError } = await supabase
            .from('stock')
            .select('*')
            .order('date', { ascending: false })
          
          if (stockError) throw stockError
          setStock(stockData || [])
          
          // Load live chickens
          const { data: liveChickensData, error: liveChickensError } = await supabase
            .from('live_chickens')
            .select('*')
            .order('hatch_date', { ascending: false })
          
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
          
          // Load feed inventory
          const { data: feedInventoryData, error: feedInventoryError } = await supabase
            .from('feed_inventory')
            .select('*')
            .order('date', { ascending: false })
          
          if (feedInventoryError && !feedInventoryError.message.includes('relation "feed_inventory" does not exist')) {
            throw feedInventoryError
          }
          
          // Only set from Supabase if we have actual data, otherwise keep localStorage data
          if (feedInventoryData && feedInventoryData.length > 0) {
            setFeedInventory(feedInventoryData)
          }
          
          // Load feed consumption
          const { data: feedConsumptionData, error: feedConsumptionError } = await supabase
            .from('feed_consumption')
            .select('*')
            .order('consumption_date', { ascending: false })
          
          if (feedConsumptionError && !feedConsumptionError.message.includes('relation "feed_consumption" does not exist')) {
            throw feedConsumptionError
          }
          
          // Only set from Supabase if we have actual data, otherwise keep localStorage data
          if (feedConsumptionData && feedConsumptionData.length > 0) {
            setFeedConsumption(feedConsumptionData)
          }
          
          // Load transactions
          const { data: transactionsData, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false })
          
          if (transactionsError) throw transactionsError
          setTransactions(transactionsData || [])
          
          // Load balance
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
                setTransactions(JSON.parse(localTransactions))
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
            
            const localLiveChickens = localStorage.getItem('liveChickens')
            if (localLiveChickens && localLiveChickens !== 'undefined') {
              try {
                setLiveChickens(JSON.parse(localLiveChickens))
              } catch (e) {
                console.warn('Invalid liveChickens data in localStorage:', e)
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
      const { amountPaid, calculationMode, ...otherData } = chickenData;
      
      const chicken = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        ...otherData,
        amount_paid: amountPaid || 0,
        calculation_mode: calculationMode || 'count_size_cost',
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
      const { amountPaid, calculationMode, ...otherData } = chickenData;
      
      const updatedChicken = {
        ...otherData,
        amount_paid: amountPaid || 0,
        calculation_mode: calculationMode || 'count_size_cost',
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
        ...chickenData
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

  // Feed Management CRUD operations
  const addFeedInventory = async (feedData) => {
    try {
      // Calculate total cost (number of bags * cost per bag)
      const totalCost = feedData.number_of_bags * feedData.cost_per_bag
      
      const feed = {
        ...feedData,
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        // Convert empty date strings to null for database compatibility
        expiry_date: feedData.expiry_date === '' ? null : feedData.expiry_date
      }
      
      // Create expense transaction for feed purchase
      const feedTransaction = {
        id: (Date.now() + 1).toString(),
        type: 'expense',
        amount: totalCost,
        description: `Feed Purchase: ${feed.feed_type} - ${feed.brand}`,
        date: feed.date
      }
      
      // Update balance
      const newBalance = balance - totalCost
      
      // Add feed to inventory (Note: Supabase operations will fail without connection, but local state will update)
      const { error: feedError } = await supabase.from('feed_inventory').insert(feed)
      if (feedError) throw feedError
      
      const { error: transactionError } = await supabase.from('transactions').insert(feedTransaction)
      if (transactionError) throw transactionError
      
      // Update balance
      const { error: balanceError } = await supabase
        .from('balance')
        .upsert({ id: 1, amount: newBalance }, { onConflict: 'id' })
      if (balanceError) throw balanceError
      
      // Log audit action
      await logAuditAction('CREATE', 'feed_inventory', feed.id, null, feed)
      
      // Update local state
      setFeedInventory(prev => [feed, ...prev])
      setTransactions(prev => [feedTransaction, ...prev])
      setBalance(newBalance)
      
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
      
      // Delete from Supabase database
      const { error } = await supabase
        .from('feed_inventory')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Add refund transaction to database
      const { error: transactionError } = await supabase.from('transactions').insert(refundTransaction)
      if (transactionError) throw transactionError
      
      // Update balance in database
      const { error: balanceError } = await supabase
        .from('balance')
        .upsert({ id: 1, amount: newBalance }, { onConflict: 'id' })
      if (balanceError) throw balanceError
      
      // Update local state
      setFeedInventory(prev => prev.filter(feed => feed.id !== id))
      setTransactions(prev => [refundTransaction, ...prev])
      setBalance(newBalance)
      
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
      
      const updatedFeed = { ...feedToUpdate, ...updatedData }
      
      // Update in Supabase database
      const { error } = await supabase
        .from('feed_inventory')
        .update(updatedData)
        .eq('id', id)
      
      if (error) throw error
      
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
        created_at: new Date().toISOString()
      }
      
      // Store in local state
      setFeedConsumption(prev => [consumption, ...prev])
      
      // Update feed inventory quantities
      setFeedInventory(prev => prev.map(feed => {
        if (feed.id === consumption.feed_id) {
          const newQuantity = feed.quantity_kg - consumption.quantity_consumed
      return { ...feed, quantity_kg: Math.max(0, newQuantity) }
        }
        return feed
      }))
      
      // Log audit action
      await logAuditAction('CREATE', 'feed_consumption', consumption.id, null, consumption)
      
    } catch (err) {
      console.error('Error adding feed consumption:', err)
      throw err
    }
  }

  const deleteFeedConsumption = async (id) => {
    try {
      const consumptionToDelete = feedConsumption.find(consumption => consumption.id === id)
      if (!consumptionToDelete) throw new Error('Feed consumption record not found')
      
      // Restore feed inventory quantities
      setFeedInventory(prev => prev.map(feed => {
        if (feed.id === consumptionToDelete.feed_id) {
          const restoredQuantity = feed.quantity_kg + consumptionToDelete.quantity_consumed
      return { ...feed, quantity_kg: restoredQuantity }
        }
        return feed
      }))
      
      // Remove from local state
      setFeedConsumption(prev => prev.filter(consumption => consumption.id !== id))
      
      // Log audit action
      await logAuditAction('DELETE', 'feed_consumption', id, consumptionToDelete, null)
      
    } catch (err) {
      console.error('Error deleting feed consumption:', err)
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
    
    // Feed Management operations
    addFeedInventory,
    updateFeedInventory,
    deleteFeedInventory,
    addFeedConsumption,
    deleteFeedConsumption,
    
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