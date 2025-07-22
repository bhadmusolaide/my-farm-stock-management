import { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { useNotification } from '../context/NotificationContext'
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner'
import './ChickenOrders.css'

const ChickenOrders = () => {
  const { chickens, addChicken, updateChicken, deleteChicken, exportToCSV } = useAppContext()
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
    status: 'pending'
  })
  
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
    setFormData(prev => ({ ...prev, [name]: value }))
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
      status: 'pending'
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
      amountPaid: chicken.amountPaid || 0,
      status: chicken.status
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
    
    // Validate form
    const count = parseInt(formData.count)
    const size = parseFloat(formData.size)
    const price = parseFloat(formData.price)
    const amountPaid = parseFloat(formData.amountPaid) || 0
    
    if (isNaN(count) || count <= 0) {
      showError('Please enter a valid count')
      return
    }
    
    if (isNaN(size) || size <= 0) {
      showError('Please enter a valid size')
      return
    }
    
    if (isNaN(price) || price <= 0) {
      showError('Please enter a valid price')
      return
    }
    
    if (isNaN(amountPaid) || amountPaid < 0) {
      showError('Please enter a valid amount paid')
      return
    }
    
    // Calculate total and use the selected status
    const total = count * size * price
    const status = formData.status
    
    try {
      setIsLoading(true)
      
      const chickenData = {
        customer: formData.customer,
        phone: formData.phone,
        location: formData.location,
        count,
        size,
        price,
        amountPaid,
        status
      }
      
      if (editMode && currentChicken) {
        await updateChicken(currentChicken.id, chickenData)
        showSuccess('Order updated successfully!')
      } else {
        await addChicken(chickenData)
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
      const dataToExport = filteredChickens.map(chicken => ({
        Date: chicken.date,
        Customer: chicken.customer,
        Location: chicken.location || '',
        Phone: chicken.phone || '',
        Count: chicken.count,
        Size: chicken.size,
        Price: chicken.price,
        Total: chicken.count * chicken.size * chicken.price,
        'Amount Paid': chicken.amountPaid || 0,
        Balance: chicken.balance,
        Status: chicken.status
      }))
      
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
        </div>
        
        <button className="btn-secondary" onClick={resetFilters}>
          Reset Filters
        </button>
      </div>
      
      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Location</th>
              <th>Count</th>
              <th>Size (kg)</th>
              <th>Price</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredChickens.length > 0 ? (
              filteredChickens.map(chicken => (
                <tr key={chicken.id}>
                  <td>{new Date(chicken.date).toLocaleDateString()}</td>
                  <td>
                    <div className="customer-info">
                      <span className="customer-name">{chicken.customer}</span>
                      {chicken.phone && (
                        <span className="customer-phone">{chicken.phone}</span>
                      )}
                    </div>
                  </td>
                  <td>{chicken.location || '-'}</td>
                  <td>{chicken.count}</td>
                  <td>{chicken.size}</td>
                  <td>₦{chicken.price.toFixed(2)}</td>
                  <td>₦{(chicken.count * chicken.size * chicken.price).toFixed(2)}</td>
                  <td>₦{(chicken.amountPaid || 0).toFixed(2)}</td>
                  <td>₦{chicken.balance.toFixed(2)}</td>
                  <td>
                    <span className={getStatusBadgeClass(chicken.status)}>
                      {chicken.status.charAt(0).toUpperCase() + chicken.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="edit-btn" 
                        onClick={() => openEditModal(chicken)}
                        aria-label="Edit"
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDelete(chicken.id)}
                        aria-label="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="no-data">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add/Edit Chicken Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editMode ? 'Edit Order' : 'Add New Order'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-container">
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
                  <label htmlFor="location">Location*</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
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
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price">Price per kg*</label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0.01"
                      step="0.01"
                      required
                    />
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