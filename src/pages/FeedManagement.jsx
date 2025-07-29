import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import './FeedManagement.css'

const FeedManagement = () => {
  const { feedInventory, addFeedInventory, deleteFeedInventory, feedConsumption, addFeedConsumption, deleteFeedConsumption, liveChickens } = useAppContext()
  
  // Format number with thousand separators
  const formatNumber = (num, decimals = null) => {
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
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('inventory')
  
  // State for filters
  const [filters, setFilters] = useState({
    feedType: '',
    startDate: '',
    endDate: ''
  })
  
  // State for modals
  const [showFeedModal, setShowFeedModal] = useState(false)
  const [showConsumptionModal, setShowConsumptionModal] = useState(false)
  
  // Form state for feed inventory
  const [feedFormData, setFeedFormData] = useState({
    feedType: '',
    brand: '',
    quantityKg: '',
    costPerBag: '',
    supplier: '',
    expiryDate: '',
    batchNumber: ''
  })
  
  // Form state for feed consumption
  const [consumptionFormData, setConsumptionFormData] = useState({
    feedId: '',
    quantityConsumed: '',
    chickenBatchId: '',
    notes: ''
  })
  
  // Get filtered feed inventory
  const getFilteredFeed = () => {
    let filtered = [...(feedInventory || [])]
    
    if (filters.feedType) {
      filtered = filtered.filter(item => 
        item.feedType.toLowerCase().includes(filters.feedType.toLowerCase())
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
  
  const filteredFeed = getFilteredFeed()
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      feedType: '',
      startDate: '',
      endDate: ''
    })
  }
  
  // Handle feed form input changes
  const handleFeedInputChange = (e) => {
    const { name, value } = e.target
    setFeedFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle consumption form input changes
  const handleConsumptionInputChange = (e) => {
    const { name, value } = e.target
    setConsumptionFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Open feed modal
  const openFeedModal = () => {
    setFeedFormData({
      feedType: '',
      brand: '',
      quantityKg: '',
      costPerBag: '',
      supplier: '',
      expiryDate: '',
      batchNumber: ''
    })
    setShowFeedModal(true)
  }
  
  // Open consumption modal
  const openConsumptionModal = () => {
    setConsumptionFormData({
      feedId: '',
      quantityConsumed: '',
      chickenBatchId: '',
      notes: ''
    })
    setShowConsumptionModal(true)
  }
  
  // Close modals
  const closeFeedModal = () => setShowFeedModal(false)
  const closeConsumptionModal = () => setShowConsumptionModal(false)
  
  // Handle feed form submission
  const handleFeedSubmit = async (e) => {
    e.preventDefault()
    
    try {
      await addFeedInventory({
        feedType: feedFormData.feedType,
        brand: feedFormData.brand,
        quantityKg: parseFloat(feedFormData.quantityKg),
        costPerBag: parseFloat(feedFormData.costPerBag),
        supplier: feedFormData.supplier,
        expiryDate: feedFormData.expiryDate,
        batchNumber: feedFormData.batchNumber
      })
      
      closeFeedModal()
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }
  
  // Handle consumption form submission
  const handleConsumptionSubmit = async (e) => {
    e.preventDefault()
    
    try {
      await addFeedConsumption({
        feedId: consumptionFormData.feedId,
        quantityConsumed: parseFloat(consumptionFormData.quantityConsumed),
        chickenBatchId: consumptionFormData.chickenBatchId,
        notes: consumptionFormData.notes
      })
      
      closeConsumptionModal()
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }
  
  // Handle delete feed
  const handleDeleteFeed = async (id) => {
    if (window.confirm('Are you sure you want to delete this feed item?')) {
      try {
        await deleteFeedInventory(id)
      } catch (error) {
        alert(`Error: ${error.message}`)
      }
    }
  }

  // Handle delete consumption
  const handleDeleteConsumption = async (id) => {
    if (window.confirm('Are you sure you want to delete this consumption record?')) {
      try {
        await deleteFeedConsumption(id)
      } catch (error) {
        alert(`Error: ${error.message}`)
      }
    }
  }
  
  // Calculate total feed value
  const calculateTotalValue = () => {
    return filteredFeed.reduce((total, item) => {
      return total + (item.quantityKg * item.costPerBag)
    }, 0)
  }
  
  // Calculate low stock items
  const getLowStockItems = () => {
    return filteredFeed.filter(item => item.quantityKg < 50) // Less than 50kg is considered low stock
  }
  
  return (
    <div className="feed-management-container">
      <div className="page-header">
        <h1>Feed Management</h1>
        <div className="header-actions">
          {activeTab === 'inventory' && (
            <button className="btn-primary" onClick={openFeedModal}>
              Add Feed Stock
            </button>
          )}
          {activeTab === 'consumption' && (
            <button className="btn-primary" onClick={openConsumptionModal}>
              Log Consumption
            </button>
          )}
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Feed Inventory
        </button>
        <button 
          className={`tab-btn ${activeTab === 'consumption' ? 'active' : ''}`}
          onClick={() => setActiveTab('consumption')}
        >
          Feed Consumption
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>
      
      {/* Feed Inventory Tab */}
      {activeTab === 'inventory' && (
        <>
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Feed Stock</h3>
              <p className="summary-value">{formatNumber(filteredFeed.reduce((sum, item) => sum + item.quantityKg, 0))} kg</p>
            </div>
            <div className="summary-card">
              <h3>Total Value</h3>
              <p className="summary-value">₦{formatNumber(calculateTotalValue(), 2)}</p>
            </div>
            <div className="summary-card">
              <h3>Feed Types</h3>
              <p className="summary-value">{new Set(filteredFeed.map(item => item.feedType)).size}</p>
            </div>
            <div className="summary-card alert">
              <h3>Low Stock Items</h3>
              <p className="summary-value">{getLowStockItems().length}</p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="filters-container">
            <div className="filters-grid">
              <div className="filter-group">
                <label htmlFor="feedType">Feed Type</label>
                <select
                  id="feedType"
                  name="feedType"
                  value={filters.feedType}
                  onChange={handleFilterChange}
                >
                  <option value="">All Feed Types</option>
                  <option value="Starter">Starter Feed</option>
                  <option value="Grower">Grower Feed</option>
                  <option value="Finisher">Finisher Feed</option>
                  <option value="Layer">Layer Feed</option>
                  <option value="Broiler">Broiler Feed</option>
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
          
          {/* Feed Inventory Table */}
          <div className="table-container">
            <table className="feed-table">
              <thead>
                <tr>
                  <th>Purchase Date</th>
                  <th>Feed Type</th>
                  <th>Brand</th>
                  <th>Quantity (kg)</th>
                  <th>Cost/bag</th>
                  <th>Total Cost</th>
                  <th>Supplier</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeed.length > 0 ? (
                  filteredFeed.map(item => {
                    const isLowStock = item.quantityKg < 50
                    const isExpiringSoon = new Date(item.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                    
                    return (
                      <tr key={item.id} className={isLowStock ? 'low-stock' : ''}>
                        <td>{new Date(item.date).toLocaleDateString()}</td>
                        <td>{item.feedType}</td>
                        <td>{item.brand}</td>
                        <td>{formatNumber(item.quantityKg)}</td>
                        <td>₦{formatNumber(item.costPerBag, 2)}</td>
                        <td>₦{formatNumber(item.quantityKg * item.costPerBag, 2)}</td>
                        <td>{item.supplier}</td>
                        <td className={isExpiringSoon ? 'expiring-soon' : ''}>
                          {new Date(item.expiryDate).toLocaleDateString()}
                        </td>
                        <td>
                          <span className={`status-badge ${
                            isLowStock ? 'low-stock' : 
                            isExpiringSoon ? 'expiring' : 'good'
                          }`}>
                            {isLowStock ? 'Low Stock' : 
                             isExpiringSoon ? 'Expiring Soon' : 'Good'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="delete-btn" 
                            onClick={() => handleDeleteFeed(item.id)}
                            aria-label="Delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="10" className="no-data">
                      No feed items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      {/* Feed Consumption Tab */}
      {activeTab === 'consumption' && (
        <>
          {/* Consumption Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Consumption Today</h3>
              <p className="summary-value">
                {formatNumber(
                  feedConsumption
                    .filter(item => new Date(item.date).toDateString() === new Date().toDateString())
                    .reduce((sum, item) => sum + item.quantityConsumed, 0)
                )} kg
              </p>
            </div>
            <div className="summary-card">
              <h3>This Week</h3>
              <p className="summary-value">
                {formatNumber(
                  feedConsumption
                    .filter(item => {
                      const itemDate = new Date(item.date)
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return itemDate >= weekAgo
                    })
                    .reduce((sum, item) => sum + item.quantityConsumed, 0)
                )} kg
              </p>
            </div>
            <div className="summary-card">
              <h3>This Month</h3>
              <p className="summary-value">
                {formatNumber(
                  feedConsumption
                    .filter(item => {
                      const itemDate = new Date(item.date)
                      const monthAgo = new Date()
                      monthAgo.setMonth(monthAgo.getMonth() - 1)
                      return itemDate >= monthAgo
                    })
                    .reduce((sum, item) => sum + item.quantityConsumed, 0)
                )} kg
              </p>
            </div>
            <div className="summary-card">
              <h3>Active Batches</h3>
              <p className="summary-value">{liveChickens.filter(batch => batch.status === 'Active').length}</p>
            </div>
          </div>

          {/* Consumption Table */}
          <div className="table-container">
            <table className="feed-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Feed Type</th>
                  <th>Quantity (kg)</th>
                  <th>Chicken Batch</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedConsumption.length > 0 ? (
                  feedConsumption.map(item => {
                    const feedItem = feedInventory.find(feed => feed.id === item.feedId)
                    const chickenBatch = liveChickens.find(batch => batch.id === item.chickenBatchId)
                    
                    return (
                      <tr key={item.id}>
                        <td>{new Date(item.date).toLocaleDateString()}</td>
                        <td>{feedItem?.feedType || 'Unknown'}</td>
                        <td>{formatNumber(item.quantityConsumed)}</td>
                        <td>{chickenBatch?.batchId || 'Unknown'}</td>
                        <td>{item.notes || '-'}</td>
                        <td>
                          <button 
                            className="delete-btn" 
                            onClick={() => handleDeleteConsumption(item.id)}
                            aria-label="Delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data">
                      No consumption records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <>
          {/* Analytics Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Feed Conversion Ratio</h3>
              <p className="summary-value">
                {(() => {
                  const totalFeedConsumed = feedConsumption.reduce((sum, item) => sum + item.quantityConsumed, 0)
                  const totalChickens = liveChickens.reduce((sum, batch) => sum + batch.currentCount, 0)
                  const ratio = totalChickens > 0 ? (totalFeedConsumed / totalChickens).toFixed(2) : '0.00'
                  return `${ratio} kg/bird`
                })()} 
              </p>
            </div>
            <div className="summary-card">
              <h3>Average Daily Consumption</h3>
              <p className="summary-value">
                {(() => {
                  const daysWithData = new Set(feedConsumption.map(item => item.date)).size
                  const totalConsumption = feedConsumption.reduce((sum, item) => sum + item.quantityConsumed, 0)
                  const avgDaily = daysWithData > 0 ? (totalConsumption / daysWithData).toFixed(1) : '0.0'
                  return `${avgDaily} kg/day`
                })()} 
              </p>
            </div>
            <div className="summary-card">
              <h3>Feed Cost per Bird</h3>
              <p className="summary-value">
                {(() => {
                  const totalFeedValue = feedInventory.reduce((sum, item) => sum + (item.quantityKg * item.costPerBag), 0)
                  const totalChickens = liveChickens.reduce((sum, batch) => sum + batch.currentCount, 0)
                  const costPerBird = totalChickens > 0 ? (totalFeedValue / totalChickens).toFixed(2) : '0.00'
                  return `₦${formatNumber(costPerBird)}`
                })()} 
              </p>
            </div>
            <div className="summary-card">
              <h3>Feed Efficiency</h3>
              <p className="summary-value">
                {(() => {
                  const totalWeight = liveChickens.reduce((sum, batch) => sum + (batch.currentWeight || 0), 0)
                  const totalFeedConsumed = feedConsumption.reduce((sum, item) => sum + item.quantityConsumed, 0)
                  const efficiency = totalFeedConsumed > 0 ? ((totalWeight / totalFeedConsumed) * 100).toFixed(1) : '0.0'
                  return `${efficiency}%`
                })()} 
              </p>
            </div>
          </div>

          {/* Feed Type Analysis */}
          <div className="analytics-section">
            <h3>Feed Type Analysis</h3>
            <div className="table-container">
              <table className="feed-table">
                <thead>
                  <tr>
                    <th>Feed Type</th>
                    <th>Total Stock (kg)</th>
                    <th>Total Consumed (kg)</th>
                    <th>Remaining (kg)</th>
                    <th>Total Cost (₦)</th>
                    <th>Usage Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const feedTypes = [...new Set(feedInventory.map(item => item.feedType))]
                    return feedTypes.map(feedType => {
                      const typeInventory = feedInventory.filter(item => item.feedType === feedType)
                      const typeConsumption = feedConsumption.filter(item => {
                        const feedItem = feedInventory.find(feed => feed.id === item.feedId)
                        return feedItem?.feedType === feedType
                      })
                      
                      const totalStock = typeInventory.reduce((sum, item) => sum + item.quantityKg, 0)
                      const totalConsumed = typeConsumption.reduce((sum, item) => sum + item.quantityConsumed, 0)
                      const remaining = totalStock - totalConsumed
                      const totalCost = typeInventory.reduce((sum, item) => sum + (item.quantityKg * item.costPerBag), 0)
                      const usageRate = totalStock > 0 ? ((totalConsumed / totalStock) * 100).toFixed(1) : '0.0'
                      
                      return (
                        <tr key={feedType}>
                          <td>{feedType}</td>
                          <td>{formatNumber(totalStock)}</td>
                          <td>{formatNumber(totalConsumed)}</td>
                          <td>{formatNumber(remaining)}</td>
                          <td>₦{formatNumber(totalCost, 2)}</td>
                          <td>{usageRate}%</td>
                        </tr>
                      )
                    })
                  })()} 
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Consumption Trends */}
          <div className="analytics-section">
            <h3>Recent Consumption Trends (Last 7 Days)</h3>
            <div className="table-container">
              <table className="feed-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Consumption (kg)</th>
                    <th>Number of Batches Fed</th>
                    <th>Average per Batch (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const last7Days = []
                    for (let i = 6; i >= 0; i--) {
                      const date = new Date()
                      date.setDate(date.getDate() - i)
                      last7Days.push(date.toISOString().split('T')[0])
                    }
                    
                    return last7Days.map(date => {
                      const dayConsumption = feedConsumption.filter(item => item.date === date)
                      const totalConsumption = dayConsumption.reduce((sum, item) => sum + item.quantityConsumed, 0)
                      const batchesFed = new Set(dayConsumption.map(item => item.chickenBatchId)).size
                      const avgPerBatch = batchesFed > 0 ? (totalConsumption / batchesFed).toFixed(2) : '0.00'
                      
                      return (
                        <tr key={date}>
                          <td>{new Date(date).toLocaleDateString()}</td>
                          <td>{formatNumber(totalConsumption)}</td>
                          <td>{batchesFed}</td>
                          <td>{avgPerBatch}</td>
                        </tr>
                      )
                    })
                  })()} 
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {/* Add Feed Modal */}
      {showFeedModal && (
        <div className="modal-overlay" onClick={closeFeedModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add Feed Stock</h2>
            
            <form onSubmit={handleFeedSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="feedType">Feed Type*</label>
                  <select
                    id="feedType"
                    name="feedType"
                    value={feedFormData.feedType}
                    onChange={handleFeedInputChange}
                    required
                  >
                    <option value="">Select feed type</option>
                    <option value="Starter">Starter Feed</option>
                    <option value="Grower">Grower Feed</option>
                    <option value="Finisher">Finisher Feed</option>
                    <option value="Layer">Layer Feed</option>
                    <option value="Broiler">Broiler Feed</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="brand">Brand</label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={feedFormData.brand}
                    onChange={handleFeedInputChange}
                    placeholder="Feed brand"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="quantityKg">Quantity (kg)*</label>
                  <input
                    type="number"
                    id="quantityKg"
                    name="quantityKg"
                    value={feedFormData.quantityKg}
                    onChange={handleFeedInputChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="costPerBag">Cost per bag (₦)*</label>
                  <input
                    type="number"
                    id="costPerBag"
                    name="costPerBag"
                    value={feedFormData.costPerBag}
                    onChange={handleFeedInputChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="supplier">Supplier</label>
                  <input
                    type="text"
                    id="supplier"
                    name="supplier"
                    value={feedFormData.supplier}
                    onChange={handleFeedInputChange}
                    placeholder="Supplier name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="batchNumber">Batch Number</label>
                  <input
                    type="text"
                    id="batchNumber"
                    name="batchNumber"
                    value={feedFormData.batchNumber}
                    onChange={handleFeedInputChange}
                    placeholder="Batch number"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="expiryDate">Expiry Date</label>
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={feedFormData.expiryDate}
                  onChange={handleFeedInputChange}
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeFeedModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Feed Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Feed Consumption Modal */}
      {showConsumptionModal && (
        <div className="modal-overlay" onClick={closeConsumptionModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Log Feed Consumption</h2>
            
            <form onSubmit={handleConsumptionSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="feedId">Feed Type*</label>
                  <select
                    id="feedId"
                    name="feedId"
                    value={consumptionFormData.feedId}
                    onChange={handleConsumptionInputChange}
                    required
                  >
                    <option value="">Select feed</option>
                    {feedInventory.map(feed => (
                      <option key={feed.id} value={feed.id}>
                        {feed.feedType} - {feed.brand} ({formatNumber(feed.quantityKg)} kg available)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="chickenBatchId">Chicken Batch*</label>
                  <select
                    id="chickenBatchId"
                    name="chickenBatchId"
                    value={consumptionFormData.chickenBatchId}
                    onChange={handleConsumptionInputChange}
                    required
                  >
                    <option value="">Select batch</option>
                    {liveChickens.filter(batch => batch.status === 'Active').map(batch => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batchId} - {batch.breed} ({batch.currentCount} birds)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="quantityConsumed">Quantity Consumed (kg)*</label>
                  <input
                    type="number"
                    id="quantityConsumed"
                    name="quantityConsumed"
                    value={consumptionFormData.quantityConsumed}
                    onChange={handleConsumptionInputChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={consumptionFormData.notes}
                  onChange={handleConsumptionInputChange}
                  placeholder="Optional notes about this feeding"
                  rows="3"
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeConsumptionModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Log Consumption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeedManagement