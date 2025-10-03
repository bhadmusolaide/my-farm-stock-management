// Formatting utilities for consistent data display across the application

/**
 * Format numbers with locale-specific formatting
 * @param {number|string} num - The number to format
 * @param {number|null} decimals - Number of decimal places (null for auto)
 * @returns {string} Formatted number string
 */
export const formatNumber = (num, decimals = null) => {
  const number = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(number)) return '0'
  
  if (decimals !== null) {
    return number.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }
  
  return number.toLocaleString('en-US')
}

/**
 * Format currency values with Naira symbol
 * @param {number|string} amount - The amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, decimals = 2) => {
  return `₦${formatNumber(amount, decimals)}`
}

/**
 * Format date with full timestamp
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * Format date without time
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format date with time (no seconds)
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateWithTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format percentage values
 * @param {number} value - The percentage value (0-100)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  return `${formatNumber(value, decimals)}%`
}

/**
 * Format weight values with kg unit
 * @param {number|string} weight - The weight to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted weight string
 */
export const formatWeight = (weight, decimals = 2) => {
  return `${formatNumber(weight, decimals)} kg`
}

/**
 * Format count values (for chicken counts, etc.)
 * @param {number} count - The count to format
 * @returns {string} Formatted count string
 */
export const formatCount = (count) => {
  return formatNumber(count, 0)
}

/**
 * Get aggregated report data with server-side calculations to reduce Egress usage
 * @param {Object} supabase - Supabase client instance
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Object|null>} Aggregated report data or null if error
 */
export const getAggregatedReportData = async (supabase, startDate, endDate) => {
  try {
    // Get aggregated financial data for the date range
    const financialQuery = supabase
      .from('chickens')
      .select('count, size, price, amount_paid, balance, status, date')
      .gte('date', startDate)
      .lte('date', endDate)

    // Get aggregated transaction data for the same period
    const transactionQuery = supabase
      .from('transactions')
      .select('type, amount, date')
      .gte('date', startDate)
      .lte('date', endDate)

    const [chickensResult, transactionsResult] = await Promise.all([
      financialQuery,
      transactionQuery
    ])

    if (chickensResult.error) throw chickensResult.error
    if (transactionsResult.error) throw transactionsResult.error

    const chickens = chickensResult.data || []
    const transactions = transactionsResult.data || []

    // Calculate aggregated metrics
    const totalRevenue = chickens.reduce((sum, chicken) => sum + (chicken.count * chicken.size * chicken.price), 0)
    const totalPaid = chickens.reduce((sum, chicken) => sum + chicken.amount_paid, 0)
    const totalBalance = chickens.reduce((sum, chicken) => sum + chicken.balance, 0)

    const totalExpenses = transactions
      .filter(t => t.type === 'expense' || t.type === 'stock_expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalFunds = transactions
      .filter(t => t.type === 'fund')
      .reduce((sum, t) => sum + t.amount, 0)

    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      funds: totalFunds,
      outstandingBalance: totalBalance,
      paidAmount: totalPaid,
      netProfit,
      profitMargin,
      totalChickens: chickens.reduce((sum, chicken) => sum + chicken.count, 0),
      totalOrders: chickens.length,
      chickens, // Return raw data for detailed analysis if needed
      transactions // Return raw data for cash flow analysis if needed
    }
  } catch (error) {
    console.error('Error getting aggregated report data:', error)
    return null
  }
}