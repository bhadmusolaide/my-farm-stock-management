import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
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
    cost: ''
  })
  
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
      cost: ''
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
    
    // Validate form
    const count = parseInt(formData.count)
    const size = parseFloat(formData.size)
    const cost = parseFloat(formData.cost)
    
    if (isNaN(count) || count <= 0) {
      alert('Please enter a valid count')
      return
    }
    
    if (isNaN(size) || size <= 0) {
      alert('Please enter a valid size')
      return
    }
    
    if (isNaN(cost) || cost <= 0) {
      alert('Please enter a valid cost')
      return
    }
    
    try {
      await addStock({
        description: formData.description,
        count,
        size,
        cost
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
      return total + (item.count * item.size * item.cost)
    }, 0)
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
          <span className="summary-value">{filteredStock.length}</span>
        </div>
        
        <div className="summary-item">
          <span className="summary-label">Total Value:</span>
          <span className="summary-value">₦{calculateTotalValue().toFixed(2)}</span>
        </div>
      </div>
      
      <div className="table-container">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Count</th>
              <th>Size (kg)</th>
              <th>Cost per kg</th>
              <th>Total Cost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.length > 0 ? (
              filteredStock.map(item => (
                <tr key={item.id}>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>{item.description}</td>
                  <td>{item.count}</td>
                  <td>{item.size}</td>
                  <td>₦{item.cost.toFixed(2)}</td>
                  <td>₦{item.totalCost.toFixed(2)}</td>
                  <td>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDelete(item.id)}
                      aria-label="Delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
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
                  <label htmlFor="count">Count*</label>
                  <input
                    type="number"
                    id="count"
                    name="count"
                    value={formData.count}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="size">Size (kg)*</label>
                  <input
                    type="number"
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    min="0.1"
                    step="0.1"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="cost">Cost per kg*</label>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group total-preview">
                <label>Total Cost:</label>
                <span className="total-cost">
                  ₦{(
                    parseFloat(formData.count || 0) * 
                    parseFloat(formData.size || 0) * 
                    parseFloat(formData.cost || 0)
                  ).toFixed(2)}
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