import { useState, useMemo } from 'react'

const useTableSort = (data, initialSortConfig = null) => {
  const [sortConfig, setSortConfig] = useState(initialSortConfig)

  const sortedData = useMemo(() => {
    if (!sortConfig || !sortConfig.key) {
      return data
    }

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key)
      const bValue = getNestedValue(b, sortConfig.key)

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1
      if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1

      // Handle different data types
      let comparison = 0
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        // Handle date strings
        const aDate = new Date(aValue)
        const bDate = new Date(bValue)
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          comparison = aDate.getTime() - bDate.getTime()
        } else {
          // String comparison (case insensitive)
          comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
        }
      } else {
        // Convert to string and compare
        comparison = String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase())
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortConfig])

  const requestSort = (key) => {
    let direction = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const resetSort = () => {
    setSortConfig(null)
  }

  const getSortIcon = (columnKey) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return 'sort'
    }
    return sortConfig.direction === 'asc' ? 'sort-asc' : 'sort-desc'
  }

  return {
    sortedData,
    requestSort,
    resetSort,
    getSortIcon,
    sortConfig
  }
}

// Helper function to get nested object values
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null
  }, obj)
}

export default useTableSort