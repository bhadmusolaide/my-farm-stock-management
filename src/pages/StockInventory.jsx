import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { formatNumber, formatDate } from '../utils/formatters'
import ColumnFilter from '../components/UI/ColumnFilter'
import SortableTableHeader from '../components/UI/SortableTableHeader'
import SortControls from '../components/UI/SortControls'
import useColumnConfig from '../hooks/useColumnConfig'
import useTableSort from '../hooks/useTableSort'
import Pagination from '../components/UI/Pagination'
import usePagination from '../hooks/usePagination'
import './StockInventory.css'

const StockInventory = () => {
  const { stock, addStock, deleteStock } = useAppContext()
  

  
  // State for filters
  const [filters, setFilters] = useState({
    description: '',
    startDate: '',
    endDate: ''
  })
  
  // State for modal
  const [showModal, setShowModal] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    description: '',
    count: '',
    size: '',
    cost_per_kg: '',
    calculation_mode: 'count_size_cost' // 'count_size_cost', 'count_cost', 'size_cost'
  })

  // Column configuration
  const stockColumns = [
    { key: 'date', label: 'Date' },
    { key: 'description', label: 'Description' },
    { key: 'count', label: 'Count' },
    { key: 'size', label: 'Size (kg)' },
    { key: 'cost_per_kg', label: 'Cost per kg' },
    { key: 'total_cost', label: 'Total Cost' },
    { key: 'actions', label: 'Actions' }
  ]

  // Column visibility hook
  const columnConfig = useColumnConfig('stockInventory', stockColumns)
  
  // Get filtered stock
  const getFilteredStock = () => {
    let filtered = [...stock]
    
    if (filters.description) {
      filtered = filtered.filter(item => 
        item.description.toLowerCase().includes(filters.description.toLowerCase())
      )
    }
    
    if (filters.startDate) {
      filtered = filtered.filter(item => 
        new Date(item.date) >= new Date(filters.startDate)
      )
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(item => 
        new Date(item.date) <= new Date(filters.endDate)
      )
    }
    
    return filtered
  }
  
  const filteredStock = getFilteredStock()
  
  // Sorting hook
  const { sortedData, sortConfig, requestSort, resetSort, getSortIcon } = useTableSort(filteredStock)
  
  // Pagination for stock inventory
  const stockPagination = usePagination(sortedData, 10)
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      description: '',
      startDate: '',
      endDate: ''
    })
  }
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Open modal for adding new stock
  const openAddModal = () => {
    setFormData({
      description: '',
      count: '',
      size: '',
      cost_per_kg: '',
      calculation_mode: 'count_size_cost'
    })
    setShowModal(true)
  }
  
  // Close modal
  const closeModal = () => {
    setShowModal(false)
  }
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form based on calculation mode
    const count = parseInt(formData.count)
    const size = parseFloat(formData.size)
    const costPerKg = parseFloat(formData.cost_per_kg)
    
    // Validate required fields based on calculation mode
    if (formData.calculation_mode === 'count_cost') {
      if (isNaN(count) || count <= 0) {
        alert('Please enter a valid count')
        return
      }
      if (isNaN(costPerKg) || costPerKg < 0) {
        alert('Please enter a valid cost')
        return
      }
    } else if (formData.calculation_mode === 'size_cost') {
      if (isNaN(size) || size <= 0) {
        alert('Please enter a valid size')
        return
      }
      if (isNaN(costPerKg) || costPerKg < 0) {
        alert('Please enter a valid cost')
        return
      }
    } else { // count_size_cost
      if (isNaN(count) || count <= 0) {
        alert('Please enter a valid count')
        return
      }
      if (isNaN(size) || size <= 0) {
        alert('Please enter a valid size')
        return
      }
      if (isNaN(costPerKg) || costPerKg < 0) {
        alert('Please enter a valid cost per kg')
        return
      }
    }
    
    try {
      await addStock({
        description: formData.description,
        count: formData.calculation_mode === 'size_cost' ? 1 : count,
        size: formData.calculation_mode === 'count_cost' ? 1 : size,
        cost_per_kg: costPerKg,
        calculation_mode: formData.calculation_mode
      })
      
      closeModal()
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }
  
  // Handle delete stock
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this stock item?')) {
      try {
        await deleteStock(id)
      } catch (error) {
        alert(`Error: ${error.message}`)
      }
    }
  }
  
  // Calculate total stock value
  const calculateTotalValue = () => {
    return filteredStock.reduce((total, item) => {
      const costPerKg = item.cost_per_kg || 0;
      return total + (item.count * item.size * costPerKg);
    }, 0);
  }
  
  return (
    <div className="stock-inventory-container">
      <div className="page-header">
        <h1>Stock Inventory</h1>
        <button className="btn-primary" onClick={openAddModal}>
          Add Stock
        </button>
      </div>
      
      <div className="filters-container">
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              name="description"
              value={filters.description}
              onChange={handleFilterChange}
              placeholder="Search by description"
            />
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
        </div>
        
        <button className="btn-secondary" onClick={resetFilters}>
          Reset Filters
        </button>
      </div>
      
      <div className="stock-summary">
        <div className="summary-item">
          <span className="summary-label">Total Items:</span>
          <span className="summary-value">{formatNumber(filteredStock.length)}</span>
        </div>
        
        <div className="summary-item">
          <span className="summary-label">Total Value:</span>
          <span className="summary-value">₦{formatNumber(calculateTotalValue(), 2)}</span>
        </div>
      </div>
      
      <div className="table-header-controls">
        <h3>Stock Inventory</h3>
        <ColumnFilter 
          columns={stockColumns}
          visibleColumns={columnConfig.visibleColumns}
          onColumnToggle={columnConfig.toggleColumn}
        />      </div>
      
      {/* Sort Controls */}
      <SortControls 
        sortConfig={sortConfig}
        onReset={resetSort}
      />
      
      <div className="table-container">
        <table className="stock-table">
          <thead>
            <tr>
              {columnConfig.isColumnVisible('date') && (
                <SortableTableHeader sortKey="date" onSort={requestSort} getSortIcon={getSortIcon}>
                  Date
                </SortableTableHeader>
              )}
              {columnConfig.isColumnVisible('description') && (
                <SortableTableHeader sortKey="description" onSort={requestSort} getSortIcon={getSortIcon}>
                  Description
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
              {columnConfig.isColumnVisible('cost_per_kg') && (
                <SortableTableHeader sortKey="cost_per_kg" onSort={requestSort} getSortIcon={getSortIcon}>
                  Cost per kg
                </SortableTableHeader>
              )}
              {columnConfig.isColumnVisible('total_cost') && (
                <SortableTableHeader sortKey="total_cost" onSort={requestSort} getSortIcon={getSortIcon}>
                  Total Cost
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
            {stockPagination.currentData.length > 0 ? (
              stockPagination.currentData.map(item => (
                <tr key={item.id}>
                  {columnConfig.isColumnVisible('date') && <td>{formatDate(item.date)}</td>}
                  {columnConfig.isColumnVisible('description') && <td>{item.description}</td>}
                  {columnConfig.isColumnVisible('count') && <td>{formatNumber(item.count)}</td>}
                  {columnConfig.isColumnVisible('size') && <td>{formatNumber(item.size)}</td>}
                  {columnConfig.isColumnVisible('cost_per_kg') && <td>₦{formatNumber(item.cost_per_kg || 0, 2)}</td>}
                  {columnConfig.isColumnVisible('total_cost') && <td>₦{formatNumber(item.total_cost || 0, 2)}</td>}
                  {columnConfig.isColumnVisible('actions') && (
                    <td>
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDelete(item.id)}
                        aria-label="Delete"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columnConfig.visibleColumns.length} className="no-data">
                  No stock items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Stock Inventory Pagination */}
      <Pagination
        currentPage={stockPagination.currentPage}
        totalPages={stockPagination.totalPages}
        onPageChange={stockPagination.handlePageChange}
        pageSize={stockPagination.pageSize}
        onPageSizeChange={stockPagination.handlePageSizeChange}
        totalItems={stockPagination.totalItems}
      />
      
      {/* Add Stock Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add Stock</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="description">Description*</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="calculation_mode">Calculation Mode*</label>
                  <select
                    id="calculation_mode"
                    name="calculation_mode"
                    value={formData.calculation_mode}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="count_size_cost">Count × Size × Cost per kg</option>
                    <option value="count_cost">Count × Cost per item</option>
                    <option value="size_cost">Size × Cost per kg</option>
                  </select>
                </div>
                
                {formData.calculation_mode !== 'size_cost' && (
                  <div className="form-group">
                    <label htmlFor="count">Count*</label>
                    <input
                      type="number"
                      id="count"
                      name="count"
                      value={formData.count}
                      onChange={handleInputChange}
                      min="1"
                      required={formData.calculation_mode !== 'size_cost'}
                    />
                  </div>
                )}
              </div>
              
              <div className="form-row">
                {formData.calculation_mode !== 'count_cost' && (
                  <div className="form-group">
                    <label htmlFor="size">Size (kg)*</label>
                    <input
                      type="number"
                      id="size"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      min="0.01"
                      step="0.01"
                      required={formData.calculation_mode !== 'count_cost'}
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="cost_per_kg">
                    {formData.calculation_mode === 'count_cost' ? 'Cost per item*' : 'Cost per kg*'}
                  </label>
                  <input
                    type="number"
                    id="cost_per_kg"
                    name="cost_per_kg"
                    value={formData.cost_per_kg}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group total-preview">
                <label>Total Cost:</label>
                <span className="total-cost">
                  ₦{formatNumber((() => {
                    const count = parseFloat(formData.count || 0)
                    const size = parseFloat(formData.size || 0)
                    const cost = parseFloat(formData.cost_per_kg || 0)
                    
                    if (formData.calculation_mode === 'count_cost') {
                      return count * cost
                    } else if (formData.calculation_mode === 'size_cost') {
                      return size * cost
                    } else {
                      return count * size * cost
                    }
                  })(), 2)}
                </span>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockInventory