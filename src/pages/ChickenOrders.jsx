import { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { useNotification } from '../context/NotificationContext'
import { formatNumber, formatDate } from '../utils/formatters'
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
  const { chickens, addChicken, updateChicken, deleteChicken, exportToCSV, liveChickens, updateLiveChicken, logChickenTransaction } = useAppContext()
  const { showError, showSuccess, showWarning } = useNotification()
  

  
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
    batch_id: '' // New field for batch selection
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
      batch_id: ''
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
      batch_id: chicken.batch_id || ''
    })
    setEditMode(true)
    setShowModal(true)
  }
  
  // Close modal
  const closeModal = () => {
    setShowModal(false)
    setCurrentChicken(null)
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
      const selectedBatch = liveChickens.find(batch => batch.id == formData.batch_id)
      if (!selectedBatch) {
        showError('Selected batch not found')
        return
      }
      
      // Only validate count for modes that use chicken count
      if (formData.calculationMode !== 'size_cost') {
        if (selectedBatch.current_count < count) {
          showError(`Insufficient chickens in batch. Available: ${selectedBatch.current_count}, Required: ${count}`)
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
        calculationMode: formData.calculationMode
      }
      
      if (editMode && currentChicken) {
        // Handle batch deduction for edit operations
        if (formData.batch_id && formData.calculationMode !== 'size_cost') {
          const batchId = formData.batch_id
          const selectedBatch = liveChickens.find(batch => batch.id == batchId)
          if (selectedBatch) {
            const updatedBatch = {
              ...selectedBatch,
              current_count: selectedBatch.current_count - count
            }
            await updateLiveChicken(selectedBatch.id, updatedBatch)
            
            // Log the sales transaction for edit
            try {
              await logChickenTransaction(
                selectedBatch.id,
                'sale',
                -count,
                `Chicken order update for ${formData.customer}`,
                currentChicken.id,
                'chicken_order'
              )
            } catch (logError) {
              console.warn('Failed to log chicken transaction for edit:', logError)
            }
          }
        }
        
        await updateChicken(currentChicken.id, chickenData)
        showSuccess('Order updated successfully!')
      } else {
        await addChicken(chickenData)
        
        // Update batch chicken count if a batch was selected
        if (formData.batch_id && formData.calculationMode !== 'size_cost') {
          const selectedBatch = liveChickens.find(batch => batch.id == formData.batch_id)
          if (selectedBatch) {
            const updatedBatch = {
              ...selectedBatch,
              current_count: selectedBatch.current_count - count
            }
            await updateLiveChicken(selectedBatch.id, updatedBatch)
            
            // Log the sales transaction
            try {
              await logChickenTransaction(
                selectedBatch.id,
                'sale',
                -count,
                `Chicken order sale to ${formData.customer}`,
                chickenData.id || Date.now().toString(),
                'chicken_order'
              )
            } catch (logError) {
              console.warn('Failed to log chicken transaction:', logError)
            }
          }
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
            <h2>{editMode ? 'Edit Order' : 'Add New Order'}</h2>
            
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
                    <label htmlFor="batch_id">Select Chicken Batch (Optional)</label>
                    <select
                      id="batch_id"
                      name="batch_id"
                      value={formData.batch_id}
                      onChange={handleInputChange}
                    >
                      <option value="">No batch selected</option>
                      {liveChickens
                        .filter(batch => 
                          (batch.status === 'healthy' || batch.status === 'sick') && 
                          batch.current_count > 0
                        )
                        .map(batch => (
                          <option key={batch.id} value={batch.id}>
                            {batch.batch_id} - {batch.breed} ({batch.current_count} available)
                          </option>
                        ))
                      }
                    </select>
                  </div>
                  
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
                      <option value="count_size_cost">Count (for batch) + Total Weight × Price per kg</option>
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