import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { formatNumber, formatDate } from '../utils/formatters'
import ColumnFilter from '../components/UI/ColumnFilter'
import useColumnConfig from '../hooks/useColumnConfig'
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
    costPerKg: '',
    calculationMode: 'count_size_cost' // 'count_size_cost', 'count_cost', 'size_cost'
  })

  // Column configuration
  const stockColumns = [
    { key: 'date', label: 'Date' },
    { key: 'description', label: 'Description' },
    { key: 'count', label: 'Count' },
    { key: 'size', label: 'Size (kg)' },
    { key: 'costPerKg', label: 'Cost per kg' },
    { key: 'totalCost', label: 'Total Cost' },
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
      costPerKg: '',
      calculationMode: 'count_size_cost'
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
    const costPerKg = parseFloat(formData.costPerKg)
    
    // Validate required fields based on calculation mode
    if (formData.calculationMode === 'count_cost') {
      if (isNaN(count) || count <= 0) {
        alert('Please enter a valid count')
        return
      }
      if (isNaN(costPerKg) || costPerKg < 0) {
        alert('Please enter a valid cost')
        return
      }
    } else if (formData.calculationMode === 'size_cost') {
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
        count: formData.calculationMode === 'size_cost' ? 1 : count,
        size: formData.calculationMode === 'count_cost' ? 1 : size,
        costPerKg,
        calculationMode: formData.calculationMode
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
        />
      </div>
      <div className="table-container">
        <table className="stock-table">
          <thead>
            <tr>
              {columnConfig.isColumnVisible('date') && <th>Date</th>}
              {columnConfig.isColumnVisible('description') && <th>Description</th>}
              {columnConfig.isColumnVisible('count') && <th>Count</th>}
              {columnConfig.isColumnVisible('size') && <th>Size (kg)</th>}
              {columnConfig.isColumnVisible('costPerKg') && <th>Cost per kg</th>}
              {columnConfig.isColumnVisible('totalCost') && <th>Total Cost</th>}
              {columnConfig.isColumnVisible('actions') && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredStock.length > 0 ? (
              filteredStock.map(item => (
                <tr key={item.id}>
                  {columnConfig.isColumnVisible('date') && <td>{formatDate(item.date)}</td>}
                  {columnConfig.isColumnVisible('description') && <td>{item.description}</td>}
                  {columnConfig.isColumnVisible('count') && <td>{formatNumber(item.count)}</td>}
                  {columnConfig.isColumnVisible('size') && <td>{formatNumber(item.size)}</td>}
                  {columnConfig.isColumnVisible('costPerKg') && <td>₦{formatNumber(item.cost_per_kg || 0, 2)}</td>}
                  {columnConfig.isColumnVisible('totalCost') && <td>₦{formatNumber(item.totalCost || 0, 2)}</td>}
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
                  <label htmlFor="calculationMode">Calculation Mode*</label>
                  <select
                    id="calculationMode"
                    name="calculationMode"
                    value={formData.calculationMode}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="count_size_cost">Count × Size × Cost per kg</option>
                    <option value="count_cost">Count × Cost per item</option>
                    <option value="size_cost">Size × Cost per kg</option>
                  </select>
                </div>
                
                {formData.calculationMode !== 'size_cost' && (
                  <div className="form-group">
                    <label htmlFor="count">Count*</label>
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
                    <label htmlFor="size">Size (kg)*</label>
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
                  <label htmlFor="costPerKg">
                    {formData.calculationMode === 'count_cost' ? 'Cost per item*' : 'Cost per kg*'}
                  </label>
                  <input
                    type="number"
                    id="costPerKg"
                    name="costPerKg"
                    value={formData.costPerKg}
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
                    const cost = parseFloat(formData.costPerKg || 0)
                    
                    if (formData.calculationMode === 'count_cost') {
                      return count * cost
                    } else if (formData.calculationMode === 'size_cost') {
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