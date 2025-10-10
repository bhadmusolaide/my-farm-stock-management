import { useState } from 'react'
import { useAppContext } from '../context'
import { formatNumber, formatDate } from '../utils/formatters'
import { DataTable } from '../components/UI'
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
  
  // Modal functions
  const openModal = () => setShowModal(true)
  const closeModal = () => setShowModal(false)
  
  // Form state
  const [formData, setFormData] = useState({
    description: '',
    count: '',
    size: '',
    cost_per_kg: '',
    calculation_mode: 'count_size_cost' // 'count_size_cost', 'count_cost', 'size_cost'
  })

  // Table columns configuration for DataTable
  const stockColumns = [
    { key: 'date', label: 'Date' },
    { key: 'description', label: 'Description' },
    { key: 'count', label: 'Count' },
    { key: 'size', label: 'Size (kg)' },
    { key: 'cost_per_kg', label: 'Cost per kg' },
    { key: 'total_cost', label: 'Total Cost' },
    { key: 'actions', label: 'Actions' }
  ]
  
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
  
  // Custom cell renderer for stock table
  const renderStockCell = (value, row, column) => {
    switch (column.key) {
      case 'date':
        return formatDate(row.date);
      case 'count':
        return formatNumber(row.count);
      case 'size':
        return `${formatNumber(row.size, 2)} kg`;
      case 'cost_per_kg':
        return `₦${formatNumber(row.cost_per_kg, 2)}`;
      case 'total_cost':
        return `₦${formatNumber(row.total_cost, 2)}`;
      case 'actions':
        return (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </button>
        );
      default:
        return value;
    }
  }
  
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
            <div className="date-reset-group">
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
              <button className="btn-secondary" onClick={resetFilters}>
                Reset Filters
              </button>
            </div>
          </div>
        </div>
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
      
      {/* Stock Inventory Table */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-title-icon">📦</span>
            Stock Inventory
          </h3>
          <div className="section-actions">
            <button className="btn btn-primary" onClick={openModal}>
              Add Stock
            </button>
          </div>
        </div>

        <DataTable
          data={filteredStock}
          columns={stockColumns}
          renderCell={renderStockCell}
          enableSorting
          enablePagination
          pageSize={10}
          emptyMessage="No stock items found"
          rowKey="id"
        />
      </section>
      
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