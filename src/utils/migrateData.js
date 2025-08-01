import { supabase } from './supabaseClient'

/**
 * Migrates data from localStorage to Supabase database
 * @returns {Promise<Object>} The migrated data
 */
export async function migrateFromLocalStorage() {
  try {
    // Get data from localStorage
    const chickens = JSON.parse(localStorage.getItem('chickens')) || []
    const stock = JSON.parse(localStorage.getItem('stock')) || []
    const transactions = JSON.parse(localStorage.getItem('transactions')) || []
    const balance = parseFloat(localStorage.getItem('balance')) || 0
    
    // Starting migration from localStorage to Supabase
    
    // Insert chickens data
    if (chickens.length > 0) {
      // Migrating chicken orders
      const { error: chickensError } = await supabase.from('chickens').insert(chickens)
      if (chickensError) {
        console.error('Error migrating chickens:', chickensError)
        throw chickensError
      }
    }
    
    // Insert stock data
    if (stock.length > 0) {
      // Migrating stock items
      const { error: stockError } = await supabase.from('stock').insert(stock)
      if (stockError) {
        console.error('Error migrating stock:', stockError)
        throw stockError
      }
    }
    
    // Insert transactions data
    if (transactions.length > 0) {
      // Migrating transactions
      const { error: transactionsError } = await supabase.from('transactions').insert(transactions)
      if (transactionsError) {
        console.error('Error migrating transactions:', transactionsError)
        throw transactionsError
      }
    }
    
    // Set balance
    // Setting initial balance
    const { error: balanceError } = await supabase
      .from('balance')
      .upsert({ id: 1, amount: balance }, { onConflict: 'id' })
    if (balanceError) {
      console.error('Error migrating balance:', balanceError)
      throw balanceError
    }
    
    // Migration completed successfully
    return { chickens, stock, transactions, balance }
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

/**
 * Checks if migration is needed by checking if data exists in Supabase
 * @returns {Promise<boolean>} True if migration is needed
 */
export async function isMigrationNeeded() {
  try {
    // Check if there's data in localStorage
    const hasLocalData = !!localStorage.getItem('chickens') || 
                         !!localStorage.getItem('stock') || 
                         !!localStorage.getItem('transactions')
    
    if (!hasLocalData) {
      // No local data found, migration not needed
      return false
    }
    
    // Check if there's already data in Supabase
    const { data: chickensData, error: chickensError } = await supabase
      .from('chickens')
      .select('id')
      .limit(1)
    
    if (chickensError) throw chickensError
    
    // If there's no data in Supabase but there is in localStorage, migration is needed
    const migrationNeeded = hasLocalData && (!chickensData || chickensData.length === 0)
    // Checking migration status
    return migrationNeeded
  } catch (error) {
    console.error('Error checking migration status:', error)
    // If there's an error, assume migration is needed
    return true
  }
}