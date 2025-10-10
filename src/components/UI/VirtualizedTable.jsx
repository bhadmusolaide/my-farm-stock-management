import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppContext } from '../../context'
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner'
import './VirtualizedTable.css'

// Virtual scrolling table component for large datasets
const VirtualizedTable = ({
  tableName,
  columns,
  filters = {},
  itemHeight = 60,
  containerHeight = 600,
  overscan = 5,
  onRowClick = null,
  renderRow,
  className = ''
}) => {
  const { loadVirtualizedData } = useAppContext()
  const [scrollTop, setScrollTop] = useState(0)
  const [data, setData] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ASC' })

  // Calculate visible range
  const visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleStopIndex = Math.min(
    totalCount - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  )

  // Load data for visible range
  const loadVisibleData = useCallback(async () => {
    if (totalCount === 0) return

    try {
      setLoading(true)
      const result = await loadVirtualizedData(tableName, {
        startIndex: visibleStartIndex,
        stopIndex: visibleStopIndex,
        filters,
        sortBy: sortConfig.key,
        sortDirection: sortConfig.direction
      })

      setData(result.data)
      setTotalCount(result.count)
    } catch (error) {
      console.error('Error loading virtualized data:', error)
    } finally {
      setLoading(false)
    }
  }, [tableName, visibleStartIndex, visibleStopIndex, filters, sortConfig, loadVirtualizedData, totalCount])

  // Load data when visible range changes
  useEffect(() => {
    loadVisibleData()
  }, [loadVisibleData])

  // Handle scroll
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])

  // Handle sort
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ASC' ? 'DESC' : 'ASC'
    }))
  }, [])

  // Calculate total height for scroll container
  const totalHeight = totalCount * itemHeight

  // Visible items
  const visibleItems = useMemo(() => {
    return data.map((item, index) => (
      <div
        key={item.id || index}
        className={`virtual-row ${onRowClick ? 'clickable' : ''}`}
        style={{
          height: itemHeight,
          transform: `translateY(${(visibleStartIndex + index) * itemHeight}px)`
        }}
        onClick={() => onRowClick && onRowClick(item)}
      >
        {renderRow ? renderRow(item) : (
          <div className="virtual-row-content">
            {columns.map(column => (
              <div key={column.key} className={`virtual-cell ${column.key}`}>
                {column.render ? column.render(item[column.key], item) : item[column.key]}
              </div>
            ))}
          </div>
        )}
      </div>
    ))
  }, [data, columns, visibleStartIndex, itemHeight, onRowClick, renderRow])

  return (
    <div className={`virtualized-table ${className}`}>
      {/* Table Header */}
      <div className="virtual-header">
        {columns.map(column => (
          <div
            key={column.key}
            className={`virtual-header-cell ${column.key} ${column.sortable ? 'sortable' : ''}`}
            onClick={column.sortable ? () => handleSort(column.key) : undefined}
          >
            {column.label}
            {column.sortable && sortConfig.key === column.key && (
              <span className={`sort-indicator ${sortConfig.direction.toLowerCase()}`}>
                {sortConfig.direction === 'ASC' ? '↑' : '↓'}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Virtual Scroll Container */}
      <div
        className="virtual-container"
        style={{ height: containerHeight, overflow: 'auto' }}
        onScroll={handleScroll}
      >
        <div
          className="virtual-scroller"
          style={{ height: totalHeight, position: 'relative' }}
        >
          {loading ? (
            <div className="virtual-loading">
              <LoadingSpinner size="small" text="Loading..." />
            </div>
          ) : (
            visibleItems
          )}
        </div>
      </div>

      {/* Footer with count info */}
      <div className="virtual-footer">
        Showing {data.length} of {totalCount} items
      </div>
    </div>
  )
}

export default VirtualizedTable