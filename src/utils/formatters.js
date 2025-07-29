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