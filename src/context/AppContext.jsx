import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, supabaseUrl } from '../utils/supabaseClient'
import { isMigrationNeeded, migrateFromLocalStorage } from '../utils/migrateData'

const AppContext = createContext()

export function useAppContext() {
  return useContext(AppContext)
}

export function AppProvider({ children }) {
  // State management
  const [chickens, setChickens] = useState([])
  const [stock, setStock] = useState([])
  const [transactions, setTransactions] = useState([])
  const [balance, setBalance] = useState(0)
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
            .order('id', { ascending: false })
            .limit(1)
          
          if (balanceError) throw balanceError
          setBalance(balanceData && balanceData.length > 0 ? balanceData[0].amount : 0)
        } catch (fetchError) {
          // If we get a fetch error and we're using the placeholder URL, it's expected
          // Just log it but don't set the error state
          console.error('Error fetching from Supabase:', fetchError)
          if (supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-supabase-project-url')) {
            console.log('Using placeholder Supabase URL, errors are expected')
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
      const chicken = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        ...chickenData,
        balance: (chickenData.count * chickenData.size * chickenData.price) - (chickenData.amountPaid || 0)
      }

      const { error } = await supabase.from('chickens').insert(chicken)
      if (error) throw error

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
      const updatedChicken = {
        ...chickenData,
        balance: (chickenData.count * chickenData.size * chickenData.price) - (chickenData.amountPaid || 0)
      }

      const { error } = await supabase
        .from('chickens')
        .update(updatedChicken)
        .eq('id', id)

      if (error) throw error

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
      const { error } = await supabase
        .from('chickens')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state
      setChickens(prev => prev.filter(chicken => chicken.id !== id))
    } catch (err) {
      console.error('Error deleting chicken:', err)
      throw err
    }
  }

  // CRUD operations for stock
  const addStock = async (stockData) => {
    try {
      const stockItem = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        ...stockData,
        totalCost: stockData.count * stockData.size * stockData.costPerKg
      }

      // Create expense transaction for stock purchase
      const stockTransaction = {
        id: (Date.now() + 1).toString(),
        type: 'expense',
        amount: stockItem.totalCost,
        description: `Stock Purchase: ${stockItem.description}`,
        date: stockItem.date
      }

      // Update balance
      const newBalance = balance - stockItem.totalCost

      // Add stock to inventory
      const { error: stockError } = await supabase.from('stock').insert(stockItem)
      if (stockError) throw stockError

      const { error: transactionError } = await supabase.from('transactions').insert(stockTransaction)
      if (transactionError) throw transactionError

      // Update balance
      const { error: balanceError } = await supabase.from('balance').insert({ amount: newBalance })
      if (balanceError) throw balanceError

      // Update local state
      setStock(prev => [stockItem, ...prev])
      setTransactions(prev => [stockTransaction, ...prev])
      setBalance(newBalance)

      return stockItem
    } catch (err) {
      console.error('Error adding stock:', err)
      throw err
    }
  }

  const deleteStock = async (id) => {
    try {
      const { error } = await supabase
        .from('stock')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state
      setStock(prev => prev.filter(item => item.id !== id))
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

      const { error: balanceError } = await supabase.from('balance').insert({ amount: newBalance })
      if (balanceError) throw balanceError

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

      const { error: balanceError } = await supabase.from('balance').insert({ amount: newBalance })
      if (balanceError) throw balanceError

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

      const { error: balanceError } = await supabase.from('balance').insert({ amount: newBalance })
      if (balanceError) throw balanceError

      // Update local state
      setTransactions(prev => [transaction, ...prev])
      setBalance(newBalance)

      return transaction
    } catch (err) {
      console.error('Error withdrawing funds:', err)
      throw err
    }
  }

  // Stats calculations
  const calculateStats = () => {
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
  }

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
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state
      setTransactions(prev => prev.filter(transaction => transaction.id !== id))
    } catch (err) {
      console.error('Error deleting transaction:', err)
      throw err
    }
  }

  const value = {
    // State
    chickens,
    stock,
    transactions,
    balance,
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
    deleteTransaction,
    
    // Stats and reports
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