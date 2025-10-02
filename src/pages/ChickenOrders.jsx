import { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { useNotification } from '../context/NotificationContext'
import { formatNumber, formatDate } from '../utils/formatters'
import { supabase } from '../utils/supabaseClient'
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner'
import ColumnFilter from '../components/UI/ColumnFilter'
import SortableTableHeader from '../components/UI/SortableTableHeader'
import SortControls from '../components/UI/SortControls'
import useColumnConfig from '../hooks/useColumnConfig'
import useTableSort from '../hooks/useTableSort'
import Pagination from '../components/UI/Pagination'
import usePagination from '../hooks/usePagination'
import './ChickenOrders.css'

const ChickenOrders = () => {
  const { chickens, addChicken, updateChicken, deleteChicken, exportToCSV, liveChickens, updateLiveChicken, dressedChickens, updateDressedChicken, logChickenTransaction } = useAppContext()
  const { showError, showSuccess, showWarning } = useNotification()
  
  // Helper to get actual whole chicken count from dressed chicken batch
  const getWholeChickenCount = (dressedChicken) => {
    if (!dressedChicken) return 0
    
    // If processing_quantity exists, use it
    if (dressedChicken.processing_quantity && dressedChicken.processing_quantity > 0) {
      return dressedChicken.processing_quantity
    }
    
    // Check if current_count looks like old format (sum of parts)
    const partsCount = dressedChicken.parts_count || {}
    const totalPartsCount = Object.values(partsCount).reduce((sum, count) => sum + (count || 0), 0)
    
    // If current_count equals total parts count, find smallest part count
    if (dressedChicken.current_count === totalPartsCount && totalPartsCount > 0) {
      const partsCounts = Object.values(partsCount).filter(c => c > 0)
      return partsCounts.length > 0 ? Math.min(...partsCounts) : dressedChicken.current_count
    }
    
    // Otherwise use current_count as-is
    return dressedChicken.current_count || 0
  }
  

  
  // Loading state
  const [isLoading, setIsLoading] = useState(false)
  
  // State for filters
  const [filters, setFilters] = useState({
    customer: '',
    status: '',
    startDate: '',
    endDate: ''
  })
  
  // State for filtered chickens
  const [filteredChickens, setFilteredChickens] = useState([])
  
  // Sorting hook
  const { sortedData, requestSort, resetSort, getSortIcon, sortConfig } = useTableSort(filteredChickens)
  
  // Pagination for chicken orders
  const chickenPagination = usePagination(sortedData, 10)
  
  // State for modal
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentChicken, setCurrentChicken] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [editHistory, setEditHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    customer: '',
    phone: '',
    location: '',
    count: '',
    size: '',
    price: '',
    amountPaid: '',
    status: 'pending',
    calculationMode: 'count_size_cost', // 'count_size_cost', 'count_cost', 'size_cost'
    inventoryType: 'live', // 'live', 'dressed', 'parts'
    batch_id: '', // For live or dressed chicken batch
    part_type: '' // For parts: 'neck', 'feet', 'gizzard', 'dog_food'
  })

  // Column configuration
  const orderColumns = [
    { key: 'date', label: 'Date' },
    { key: 'customer', label: 'Customer' },
    { key: 'location', label: 'Location' },
    { key: 'count', label: 'Count' },
    { key: 'size', label: 'Size (kg)' },
    { key: 'price', label: 'Price' },
    { key: 'total', label: 'Total' },
    { key: 'paid', label: 'Paid' },
    { key: 'balance', label: 'Balance' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
  ]

  // Column visibility hook
  const columnConfig = useColumnConfig('chickenOrders', orderColumns)
  
  // Apply filters when chickens or filters change
  useEffect(() => {
    filterChickens()
  }, [chickens, filters])
  
  // Filter chickens based on current filters
  const filterChickens = () => {
    let filtered = [...chickens]
    
    if (filters.customer) {
      filtered = filtered.filter(chicken => 
        chicken.customer.toLowerCase().includes(filters.customer.toLowerCase())
      )
    }
    
    if (filters.status) {
      filtered = filtered.filter(chicken => chicken.status === filters.status)
    }
    
    if (filters.startDate) {
      filtered = filtered.filter(chicken => 
        new Date(chicken.date) >= new Date(filters.startDate)
      )
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(chicken => 
        new Date(chicken.date) <= new Date(filters.endDate)
      )
    }
    
    setFilteredChickens(filtered)
  }
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      customer: '',
      status: '',
      startDate: '',
      endDate: ''
    })
  }
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    setFormData(prev => {
      const newFormData = { ...prev, [name]: value }
      
      // Auto-populate amount paid when status is 'paid' or when calculation fields change while status is 'paid'
      if ((name === 'status' && value === 'paid') || 
          (prev.status === 'paid' && ['count', 'size', 'price', 'calculationMode'].includes(name))) {
        
        const count = parseFloat(name === 'count' ? value : newFormData.count || 0)
        const size = parseFloat(name === 'size' ? value : newFormData.size || 0)
        const price = parseFloat(name === 'price' ? value : newFormData.price || 0)
        const calculationMode = name === 'calculationMode' ? value : newFormData.calculationMode
        
        let total = 0
        if (calculationMode === 'count_cost') {
          total = count * price
        } else if (calculationMode === 'size_cost') {
          total = size * price
        } else {
          // count_size_cost: count is for batch deduction, size is total weight, calculate as size × price
          total = size * price
        }
        
        newFormData.amountPaid = total.toFixed(2)
      }
      
      return newFormData
    })
  }
  
  // Open modal for adding new chicken
  const openAddModal = () => {
    setFormData({
      customer: '',
      phone: '',
      location: '',
      count: '',
      size: '',
      price: '',
      amountPaid: '',
      status: 'pending',
      calculationMode: 'count_size_cost',
      inventoryType: 'live',
      batch_id: '',
      part_type: ''
    })
    setEditMode(false)
    setShowModal(true)
  }
  
  // Open modal for editing chicken
  const openEditModal = (chicken) => {
    setCurrentChicken(chicken)
    setFormData({
      customer: chicken.customer,
      phone: chicken.phone || '',
      location: chicken.location || '',
      count: chicken.count,
      size: chicken.size,
      price: chicken.price,
      amountPaid: chicken.amount_paid || 0, // Use amount_paid from database
      status: chicken.status,
      calculationMode: chicken.calculation_mode || 'count_size_cost',
      inventoryType: chicken.inventory_type || 'live',
      batch_id: chicken.batch_id || '',
      part_type: chicken.part_type || ''
    })
    setEditMode(true)
    setShowModal(true)
  }
  
  // Close modal
  const closeModal = () => {
    setShowModal(false)
    setCurrentChicken(null)
    setShowHistory(false)
    setEditHistory([])
  }

  // Fetch edit history for a specific chicken order
  const fetchEditHistory = async (chickenId) => {
    try {
      setHistoryLoading(true)

      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          users!inner(full_name, email)
        `)
        .eq('table_name', 'chickens')
        .eq('record_id', chickenId)
        .eq('action', 'UPDATE')
        .order('created_at', { ascending: false })

      if (error) throw error

      setEditHistory(data || [])
    } catch (err) {
      console.error('Error fetching edit history:', err)
      showError('Failed to load edit history')
    } finally {
      setHistoryLoading(false)
    }
  }

  // Toggle history visibility
  const toggleHistory = async () => {
    if (!showHistory && currentChicken) {
      await fetchEditHistory(currentChicken.id)
    }
    setShowHistory(!showHistory)
  }
  
  // Helper function to handle inventory deduction
  const handleInventoryDeduction = async (inventoryType, batchId, quantity, partType = null, reason = '', referenceId = null) => {
    try {
      if (inventoryType === 'live') {
        const selectedBatch = liveChickens.find(batch => batch.id == batchId)
        if (selectedBatch) {
          const updatedBatch = {
            ...selectedBatch,
            current_count: selectedBatch.current_count - quantity
          }
          await updateLiveChicken(selectedBatch.id, updatedBatch)
          
          // Log the sales transaction
          try {
            await logChickenTransaction(
              selectedBatch.id,
              'sale',
              -quantity,
              reason,
              referenceId,
              'chicken_order'
            )
          } catch (logError) {
            console.warn('Failed to log chicken transaction:', logError)
          }
        }
      } else if (inventoryType === 'dressed') {
        const selectedBatch = dressedChickens.find(batch => batch.id == batchId)
        if (selectedBatch) {
          // Get actual whole chicken count and deduct from it
          const currentWholeChickens = getWholeChickenCount(selectedBatch)
          const newWholeChickens = Math.max(0, currentWholeChickens - quantity)
          
          const updatedBatch = {
            ...selectedBatch,
            current_count: newWholeChickens,
            processing_quantity: newWholeChickens // Update processing_quantity for future reference
          }
          await updateDressedChicken(selectedBatch.id, updatedBatch)
          
          // Log the sales transaction
          try {
            await logChickenTransaction(
              selectedBatch.id,
              'sale',
              -quantity,
              reason,
              referenceId,
              'dressed_chicken_order'
            )
          } catch (logError) {
            console.warn('Failed to log dressed chicken transaction:', logError)
          }
        }
      } else if (inventoryType === 'parts' && partType) {
        const selectedBatch = dressedChickens.find(batch => batch.id == batchId)
        if (selectedBatch) {
          const updatedPartsCount = {
            ...selectedBatch.parts_count,
            [partType]: (selectedBatch.parts_count?.[partType] || 0) - quantity
          }
          const updatedBatch = {
            ...selectedBatch,
            parts_count: updatedPartsCount
          }
          await updateDressedChicken(selectedBatch.id, updatedBatch)
          
          // Log the parts sale
          try {
            await logChickenTransaction(
              selectedBatch.id,
              'sale',
              -quantity,
              `${reason} - ${partType}`,
              referenceId,
              'chicken_parts_order'
            )
          } catch (logError) {
            console.warn('Failed to log parts transaction:', logError)
          }
        }
      }
    } catch (error) {
      console.error('Error deducting from inventory:', error)
      throw error
    }
  }
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form based on calculation mode
    const count = parseInt(formData.count)
    const size = parseFloat(formData.size)
    const price = parseFloat(formData.price)
    const amountPaid = parseFloat(formData.amountPaid) || 0
    
    // Validate required fields based on calculation mode
    if (formData.calculationMode === 'count_cost') {
      if (isNaN(count) || count <= 0) {
        showError('Please enter a valid count')
        return
      }
      if (isNaN(price) || price < 0) {
        showError('Please enter a valid price')
        return
      }
    } else if (formData.calculationMode === 'size_cost') {
      if (isNaN(size) || size <= 0) {
        showError('Please enter a valid size')
        return
      }
      if (isNaN(price) || price < 0) {
        showError('Please enter a valid price')
        return
      }
    } else { // count_size_cost
      if (isNaN(count) || count <= 0) {
        showError('Please enter a valid count')
        return
      }
      if (isNaN(size) || size <= 0) {
        showError('Please enter a valid size')
        return
      }
      if (isNaN(price) || price < 0) {
        showError('Please enter a valid price')
        return
      }
    }
    
    if (isNaN(amountPaid) || amountPaid < 0) {
      showError('Please enter a valid amount paid')
      return
    }
    
    // Validate batch selection if a batch is selected
    if (formData.batch_id) {
      let selectedBatch = null
      let availableCount = 0
      
      if (formData.inventoryType === 'live') {
        selectedBatch = liveChickens.find(batch => batch.id == formData.batch_id)
        availableCount = selectedBatch?.current_count || 0
      } else if (formData.inventoryType === 'dressed') {
        selectedBatch = dressedChickens.find(batch => batch.id == formData.batch_id)
        availableCount = getWholeChickenCount(selectedBatch)
      } else if (formData.inventoryType === 'parts' && formData.part_type) {
        selectedBatch = dressedChickens.find(batch => batch.id == formData.batch_id)
        availableCount = selectedBatch?.parts_count?.[formData.part_type] || 0
      }
      
      if (!selectedBatch) {
        showError('Selected batch not found')
        return
      }
      
      // Only validate count for modes that use chicken count
      if (formData.calculationMode !== 'size_cost') {
        if (availableCount < count) {
          const itemName = formData.inventoryType === 'parts' ? formData.part_type : 'chickens'
          showError(`Insufficient ${itemName} in batch. Available: ${availableCount}, Required: ${count}`)
          return
        }
      }
    }
    
    // Calculate total based on calculation mode
    let total
    if (formData.calculationMode === 'count_cost') {
      total = count * price
    } else if (formData.calculationMode === 'size_cost') {
      total = size * price
    } else {
      // count_size_cost: count is for batch deduction, size is total weight, calculate as size × price
      total = size * price
    }
    
    const status = formData.status
    
    try {
      setIsLoading(true)
      
      const chickenData = {
        customer: formData.customer,
        phone: formData.phone,
        location: formData.location,
        count: formData.calculationMode === 'size_cost' ? 1 : count,
        size: formData.calculationMode === 'count_cost' ? 1 : size,
        price,
        amountPaid,
        status,
        calculationMode: formData.calculationMode,
        inventoryType: formData.inventoryType,
        batch_id: formData.batch_id || null,
        part_type: formData.part_type || null
      }
      
      if (editMode && currentChicken) {
        // Handle batch deduction for edit operations
        if (formData.batch_id && formData.calculationMode !== 'size_cost') {
          await handleInventoryDeduction(formData.inventoryType, formData.batch_id, count, formData.part_type, `Chicken order update for ${formData.customer}`, currentChicken.id)
        }
        
        await updateChicken(currentChicken.id, chickenData)
        showSuccess('Order updated successfully!')
      } else {
        await addChicken(chickenData)
        
        // Update batch inventory if a batch was selected
        if (formData.batch_id && formData.calculationMode !== 'size_cost') {
          await handleInventoryDeduction(formData.inventoryType, formData.batch_id, count, formData.part_type, `Chicken order sale to ${formData.customer}`, chickenData.id || Date.now().toString())
        }
        
        showSuccess('Order added successfully!')
      }
      
      closeModal()
    } catch (error) {
      showError(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle delete chicken
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        setIsLoading(true)
        await deleteChicken(id)
        showSuccess('Order deleted successfully!')
      } catch (error) {
        showError(`Error: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }
  }
  
  // Export orders to CSV
  const handleExport = () => {
    try {
      const dataToExport = filteredChickens.map(chicken => {
        let total
        if (chicken.calculation_mode === 'count_cost') {
          total = chicken.count * chicken.price
        } else if (chicken.calculation_mode === 'size_cost') {
          total = chicken.size * chicken.price
        } else {
          total = chicken.size * chicken.price
        }
        
        return {
          Date: chicken.date,
          Customer: chicken.customer,
          Location: chicken.location || '',
          Phone: chicken.phone || '',
          Count: chicken.count,
          Size: chicken.size,
          Price: chicken.price,
          'Calculation Mode': chicken.calculation_mode || 'count_size_cost',
          Total: total,
          'Amount Paid': chicken.amount_paid || 0,
          Balance: chicken.balance,
          Status: chicken.status
        }
      })
      
      exportToCSV(dataToExport, 'chicken-orders.csv')
    } catch (error) {
      alert(`Export failed: ${error.message}`)
    }
  }
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'status-badge status-paid'
      case 'partial':
        return 'status-badge status-partial'
      case 'pending':
        return 'status-badge status-pending'
      default:
        return 'status-badge'
    }
  }
  
  return (
    <div className="chicken-orders-container">
      <div className="page-header">
        <h1>Chicken Orders</h1>
        <div className="header-actions">
          <button className="btn-primary" onClick={openAddModal}>
            Add Order
          </button>
          <button className="btn-export" onClick={handleExport}>
            Export CSV
          </button>
        </div>
      </div>
      
      <div className="filters-container">
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="customer">Customer</label>
            <input
              type="text"
              id="customer"
              name="customer"
              value={filters.customer}
              onChange={handleFilterChange}
              placeholder="Search by customer"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="startDate">From Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="endDate">To Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label>&nbsp;</label>
            <button className="btn-secondary reset-filter-btn" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>
      
      <div className="table-header-controls">
        <h3>Orders</h3>
        <ColumnFilter 
          columns={orderColumns}
          visibleColumns={columnConfig.visibleColumns}
          onColumnToggle={columnConfig.toggleColumn}
        />      </div>
      
      {/* Sort Controls */}
      <SortControls 
        sortConfig={sortConfig}
        onReset={resetSort}
      />
      
      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              {columnConfig.isColumnVisible('date') && (
                <SortableTableHeader sortKey="date" onSort={requestSort} getSortIcon={getSortIcon}>
                  Date
                </SortableTableHeader>
              )}
              {columnConfig.isColumnVisible('customer') && (
                <SortableTableHeader sortKey="customer" onSort={requestSort} getSortIcon={getSortIcon}>
                  Customer
                </SortableTableHeader>
              )}
              {columnConfig.isColumnVisible('location') && (
                <SortableTableHeader sortKey="location" onSort={requestSort} getSortIcon={getSortIcon}>
                  Location
                </SortableTableHeader>
              )}
              {columnConfig.isColumnVisible('count') && (
                <SortableTableHeader sortKey="count" onSort={requestSort} getSortIcon={getSortIcon}>
                  Count
                </SortableTableHeader>
              )}
              {columnConfig.isColumnVisible('size') && (
                <SortableTableHeader sortKey="size" onSort={requestSort} getSortIcon={getSortIcon}>
                  Size (kg)
                </SortableTableHeader>
              )}
              {columnConfig.isColumnVisible('price') && (
                <SortableTableHeader sortKey="price" onSort={requestSort} getSortIcon={getSortIcon}>
                  Price
                </SortableTableHeader>
              )}
              {columnConfig.isColumnVisible('total') && (
                <SortableTableHeader sortKey="total" onSort={requestSort} getSortIcon={getSortIcon}>
                  Total
                </SortableTableHeader>
              )}
              {columnConfig.isColumnVisible('paid') && (
                <SortableTableHeader sortKey="amount_paid" onSort={requestSort} getSortIcon={getSortIcon}>
                  Paid
                </SortableTableHeader>
              )}
              {columnConfig.isColumnVisible('balance') && (
                <SortableTableHeader sortKey="balance" onSort={requestSort} getSortIcon={getSortIcon}>
                  Balance
                </SortableTableHeader>
              )}
              {columnConfig.isColumnVisible('status') && (
                <SortableTableHeader sortKey="status" onSort={requestSort} getSortIcon={getSortIcon}>
                  Status
                </SortableTableHeader>
              )}
              {columnConfig.isColumnVisible('actions') && (
                <SortableTableHeader sortable={false}>
                  Actions
                </SortableTableHeader>
              )}
            </tr>
          </thead>
          <tbody>
            {chickenPagination.currentData.length > 0 ? (
              chickenPagination.currentData.map(chicken => (
                <tr key={chicken.id}>
                  {columnConfig.isColumnVisible('date') && <td>{formatDate(chicken.date)}</td>}
                  {columnConfig.isColumnVisible('customer') && (
                    <td>
                      <div className="customer-info">
                        <span className="customer-name">{chicken.customer}</span>
                        {chicken.phone && (
                          <span className="customer-phone">{chicken.phone}</span>
                        )}
                      </div>
                    </td>
                  )}
                  {columnConfig.isColumnVisible('location') && <td>{chicken.location || '-'}</td>}
                  {columnConfig.isColumnVisible('count') && <td>{formatNumber(chicken.count)}</td>}
                  {columnConfig.isColumnVisible('size') && <td>{formatNumber(chicken.size)}</td>}
                  {columnConfig.isColumnVisible('price') && <td>₦{formatNumber(chicken.price, 2)}</td>}
                  {columnConfig.isColumnVisible('total') && (
                    <td>₦{formatNumber((() => {
                      if (chicken.calculation_mode === 'count_cost') {
                        return chicken.count * chicken.price
                      } else if (chicken.calculation_mode === 'size_cost') {
                        return chicken.size * chicken.price
                      } else {
                        // count_size_cost: count is for batch deduction, size is total weight, calculate as size × price
                        return chicken.size * chicken.price
                      }
                    })(), 2)}</td>
                  )}
                  {columnConfig.isColumnVisible('paid') && <td>₦{formatNumber(chicken.amount_paid || 0, 2)}</td>}
                  {columnConfig.isColumnVisible('balance') && <td>₦{formatNumber(chicken.balance, 2)}</td>}
                  {columnConfig.isColumnVisible('status') && (
                    <td>
                      <span className={getStatusBadgeClass(chicken.status)}>
                        {chicken.status.charAt(0).toUpperCase() + chicken.status.slice(1)}
                      </span>
                    </td>
                  )}
                  {columnConfig.isColumnVisible('actions') && (
                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-btn"
                          onClick={() => openEditModal(chicken)}
                          aria-label="Edit Order"
                          title="Edit Order"
                        >
                          ✏️
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(chicken.id)}
                          aria-label="Delete Order"
                          title="Delete Order"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columnConfig.getVisibleColumnsCount()} className="no-data">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Chicken Orders Pagination */}
      <Pagination
        currentPage={chickenPagination.currentPage}
        totalPages={chickenPagination.totalPages}
        onPageChange={chickenPagination.handlePageChange}
        pageSize={chickenPagination.pageSize}
        onPageSizeChange={chickenPagination.handlePageSizeChange}
        totalItems={chickenPagination.totalItems}
      />
      
      {/* Add/Edit Chicken Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Order' : 'Add New Order'}</h2>
              {editMode && (
                <button
                  className="btn-history-toggle"
                  onClick={toggleHistory}
                  disabled={historyLoading}
                >
                  {historyLoading ? (
                    <>
                      <LoadingSpinner size="small" color="currentColor" />
                      Loading...
                    </>
                  ) : (
                    <>
                      📋 {showHistory ? 'Hide History' : 'Show History'}
                    </>
                  )}
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-container">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="customer">Customer Name*</label>
                    <input
                      type="text"
                      id="customer"
                      name="customer"
                      value={formData.customer}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="inventoryType">Inventory Type*</label>
                    <select
                      id="inventoryType"
                      name="inventoryType"
                      value={formData.inventoryType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="live">Live Chickens</option>
                      <option value="dressed">Dressed Chickens (Whole)</option>
                      <option value="parts">Chicken Parts</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="batch_id">
                      {formData.inventoryType === 'live' ? 'Live Chicken Batch' : 'Dressed Chicken Batch'} (Optional)
                    </label>
                    <select
                      id="batch_id"
                      name="batch_id"
                      value={formData.batch_id}
                      onChange={handleInputChange}
                    >
                      <option value="">No batch selected</option>
                      {formData.inventoryType === 'live' ? (
                        liveChickens
                          .filter(batch =>
                            (batch.status === 'healthy' || batch.status === 'sick') &&
                            batch.current_count > 0
                          )
                          .map(batch => (
                            <option key={batch.id} value={batch.id}>
                              {batch.batch_id} - {batch.breed} ({batch.current_count} available)
                            </option>
                          ))
                      ) : (
                        dressedChickens
                          .filter(batch =>
                            batch.status === 'in-storage' &&
                            (formData.inventoryType === 'parts' ?
                              Object.values(batch.parts_count || {}).some(count => count > 0) :
                              getWholeChickenCount(batch) > 0
                            )
                          )
                          .map(batch => (
                            <option key={batch.id} value={batch.id}>
                              {batch.batch_id} - {batch.size_category} (
                              {formData.inventoryType === 'parts' ?
                                'Parts available' :
                                `${getWholeChickenCount(batch)} available`
                              })
                            </option>
                          ))
                      )}
                    </select>
                  </div>
                </div>
                
                {formData.inventoryType === 'parts' && formData.batch_id && (
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="part_type">Part Type*</label>
                      <select
                        id="part_type"
                        name="part_type"
                        value={formData.part_type}
                        onChange={handleInputChange}
                        required={formData.inventoryType === 'parts'}
                      >
                        <option value="">Select part type</option>
                        <option value="neck">Neck ({dressedChickens.find(b => b.id === formData.batch_id)?.parts_count?.neck || 0} available)</option>
                        <option value="feet">Feet ({dressedChickens.find(b => b.id === formData.batch_id)?.parts_count?.feet || 0} available)</option>
                        <option value="gizzard">Gizzard ({dressedChickens.find(b => b.id === formData.batch_id)?.parts_count?.gizzard || 0} available)</option>
                        <option value="dog_food">Dog Food ({dressedChickens.find(b => b.id === formData.batch_id)?.parts_count?.dog_food || 0} available)</option>
                      </select>
                    </div>
                  </div>
                )}
                
                <div className="form-row">
                  
                  <div className="form-group">
                    <label htmlFor="status">Status*</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="calculationMode">Calculation Mode*</label>
                    <select
                      id="calculationMode"
                      name="calculationMode"
                      value={formData.calculationMode}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="count_size_cost">Count + Total Weight × Price per kg</option>
                      <option value="count_cost">Count × Price per item</option>
                      <option value="size_cost">Size × Price per kg</option>
                    </select>
                  </div>
                  
                  {formData.calculationMode !== 'size_cost' && (
                    <div className="form-group">
                      <label htmlFor="count">
                        {formData.calculationMode === 'count_size_cost' ? 'Chicken Count (for B.D)*' : 'Count*'}
                      </label>
                      <input
                        type="number"
                        id="count"
                        name="count"
                        value={formData.count}
                        onChange={handleInputChange}
                        min="1"
                        required={formData.calculationMode !== 'size_cost'}
                      />
                    </div>
                  )}
                </div>
                
                <div className="form-row">
                  {formData.calculationMode !== 'count_cost' && (
                    <div className="form-group">
                      <label htmlFor="size">
                        {formData.calculationMode === 'count_size_cost' ? 'Total Weight (kg)*' : 'Size (kg)*'}
                      </label>
                      <input
                        type="number"
                        id="size"
                        name="size"
                        value={formData.size}
                        onChange={handleInputChange}
                        min="0.01"
                        step="0.01"
                        required={formData.calculationMode !== 'count_cost'}
                      />
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label htmlFor="price">
                      {formData.calculationMode === 'count_cost' ? 'Price per item*' : 'Price per kg*'}
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                

                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="amountPaid">Amount Paid (₦)</label>
                    <input
                      type="number"
                      id="amountPaid"
                      name="amountPaid"
                      value={formData.amountPaid}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="total-cost">
                  <h3>Total Cost</h3>
                  <div className="total-amount">
                    ₦{formatNumber((() => {
                      const count = parseFloat(formData.count || 0)
                      const size = parseFloat(formData.size || 0)
                      const price = parseFloat(formData.price || 0)
                      
                      if (formData.calculationMode === 'count_cost') {
                        return count * price
                      } else if (formData.calculationMode === 'size_cost') {
                        return size * price
                      } else {
                        // count_size_cost: count is for batch deduction, size is total weight, calculate as size × price
                        return size * price
                      }
                    })(), 2)}
                  </div>
                </div>
              </div>

              {/* Edit History Section */}
              {editMode && showHistory && (
                <div className="edit-history-section">
                  <h3>Edit History</h3>
                  {historyLoading ? (
                    <div className="history-loading">
                      <LoadingSpinner size="small" text="Loading history..." />
                    </div>
                  ) : editHistory.length === 0 ? (
                    <div className="no-history">
                      <p>No edit history found for this order.</p>
                    </div>
                  ) : (
                    <div className="history-list">
                      {editHistory.map((log, index) => (
                        <div key={log.id} className="history-item">
                          <div className="history-header">
                            <div className="history-meta">
                              <span className="history-timestamp">
                                {formatDate(log.created_at)}
                              </span>
                              <span className="history-user">
                                by {log.users?.full_name || 'Unknown User'}
                              </span>
                            </div>
                          </div>
                          <div className="history-changes">
                            {log.old_values && log.new_values && (
                              <div className="changes-list">
                                {(() => {
                                  const oldValues = JSON.parse(log.old_values);
                                  const newValues = JSON.parse(log.new_values);
                                  const relevantFields = ['price', 'count', 'size', 'balance', 'status', 'amount_paid'];

                                  const changes = [];

                                  Object.keys({ ...oldValues, ...newValues }).forEach(key => {
                                    if (relevantFields.includes(key)) {
                                      const oldValue = oldValues[key];
                                      const newValue = newValues[key];

                                      if (oldValue !== newValue) {
                                        changes.push({
                                          field: key,
                                          oldValue: oldValue,
                                          newValue: newValue
                                        });
                                      }
                                    }
                                  });

                                  return changes.length > 0 ? changes.map((change, index) => (
                                    <div key={index} className="change-item">
                                      <div className="change-field">
                                        <span className="field-label">{change.field}:</span>
                                      </div>
                                      <div className="change-values">
                                        <span className="old-value">{String(change.oldValue)}</span>
                                        <span className="change-arrow">→</span>
                                        <span className="new-value">{String(change.newValue)}</span>
                                      </div>
                                    </div>
                                  )) : (
                                    <div className="no-relevant-changes">
                                      <p>No relevant changes in this edit.</p>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={isLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="small" color="white" />
                      {editMode ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editMode ? 'Update Order' : 'Add Order'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChickenOrders