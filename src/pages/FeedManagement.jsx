import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { formatNumber, formatDate } from '../utils/formatters'
import ColumnFilter from '../components/UI/ColumnFilter'
import useColumnConfig from '../hooks/useColumnConfig'
import './FeedManagement.css'

const FeedManagement = () => {
  const { feedInventory, addFeedInventory, deleteFeedInventory, feedConsumption, addFeedConsumption, deleteFeedConsumption, liveChickens } = useAppContext()
  

  
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
    numberOfBags: '',
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

  // Column configurations
  const inventoryColumns = [
    { key: 'date', label: 'Purchase Date' },
    { key: 'feedType', label: 'Feed Type' },
    { key: 'brand', label: 'Brand' },
    { key: 'numberOfBags', label: 'No. of Bags' },
    { key: 'quantityKg', label: 'Quantity (kg)' },
    { key: 'costPerBag', label: 'Cost/bag' },
    { key: 'totalCost', label: 'Total Cost' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'expiryDate', label: 'Expiry Date' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
  ]

  const consumptionColumns = [
    { key: 'date', label: 'Date' },
    { key: 'feedType', label: 'Feed Type' },
    { key: 'quantityConsumed', label: 'Quantity (kg)' },
    { key: 'chickenBatch', label: 'Chicken Batch' },
    { key: 'notes', label: 'Notes' },
    { key: 'actions', label: 'Actions' }
  ]

  // Column visibility hooks
  const inventoryColumnConfig = useColumnConfig('feedInventory', inventoryColumns)
  const consumptionColumnConfig = useColumnConfig('feedConsumption', consumptionColumns)
  
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
      numberOfBags: '',
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
        numberOfBags: parseInt(feedFormData.numberOfBags),
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
          <div className="table-header-controls">
            <h3>Feed Inventory</h3>
            <ColumnFilter 
              columns={inventoryColumns}
              visibleColumns={inventoryColumnConfig.visibleColumns}
              onColumnToggle={inventoryColumnConfig.toggleColumn}
            />
          </div>
          <div className="table-container">
            <table className="feed-table">
              <thead>
                <tr>
                  {inventoryColumnConfig.isColumnVisible('date') && <th>Purchase Date</th>}
                  {inventoryColumnConfig.isColumnVisible('feedType') && <th>Feed Type</th>}
                  {inventoryColumnConfig.isColumnVisible('brand') && <th>Brand</th>}
                  {inventoryColumnConfig.isColumnVisible('numberOfBags') && <th>No. of Bags</th>}
                  {inventoryColumnConfig.isColumnVisible('quantityKg') && <th>Quantity (kg)</th>}
                  {inventoryColumnConfig.isColumnVisible('costPerBag') && <th>Cost/bag</th>}
                  {inventoryColumnConfig.isColumnVisible('totalCost') && <th>Total Cost</th>}
                  {inventoryColumnConfig.isColumnVisible('supplier') && <th>Supplier</th>}
                  {inventoryColumnConfig.isColumnVisible('expiryDate') && <th>Expiry Date</th>}
                  {inventoryColumnConfig.isColumnVisible('status') && <th>Status</th>}
                  {inventoryColumnConfig.isColumnVisible('actions') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredFeed.length > 0 ? (
                  filteredFeed.map(item => {
                    const isLowStock = item.quantityKg < 50
                    const isExpiringSoon = new Date(item.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                    
                    return (
                      <tr key={item.id} className={isLowStock ? 'low-stock' : ''}>
                        {inventoryColumnConfig.isColumnVisible('date') && <td>{formatDate(item.date)}</td>}
                        {inventoryColumnConfig.isColumnVisible('feedType') && <td>{item.feedType}</td>}
                        {inventoryColumnConfig.isColumnVisible('brand') && <td>{item.brand}</td>}
                        {inventoryColumnConfig.isColumnVisible('numberOfBags') && <td>{item.numberOfBags || 'N/A'}</td>}
                        {inventoryColumnConfig.isColumnVisible('quantityKg') && <td>{formatNumber(item.quantityKg)}</td>}
                        {inventoryColumnConfig.isColumnVisible('costPerBag') && <td>₦{formatNumber(item.costPerBag, 2)}</td>}
                        {inventoryColumnConfig.isColumnVisible('totalCost') && <td>₦{formatNumber((item.numberOfBags || 1) * item.costPerBag, 2)}</td>}
                        {inventoryColumnConfig.isColumnVisible('supplier') && <td>{item.supplier}</td>}
                        {inventoryColumnConfig.isColumnVisible('expiryDate') && (
                          <td className={isExpiringSoon ? 'expiring-soon' : ''}>
                            {formatDate(item.expiryDate)}
                          </td>
                        )}
                        {inventoryColumnConfig.isColumnVisible('status') && (
                          <td>
                            <span className={`status-badge ${
                              isLowStock ? 'low-stock' : 
                              isExpiringSoon ? 'expiring' : 'good'
                            }`}>
                              {isLowStock ? 'Low Stock' : 
                               isExpiringSoon ? 'Expiring Soon' : 'Good'}
                            </span>
                          </td>
                        )}
                        {inventoryColumnConfig.isColumnVisible('actions') && (
                          <td>
                            <button 
                              className="delete-btn" 
                              onClick={() => handleDeleteFeed(item.id)}
                              aria-label="Delete"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={inventoryColumnConfig.visibleColumns.length} className="no-data">
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
          <div className="table-header-controls">
            <h3>Feed Consumption</h3>
            <ColumnFilter 
              columns={consumptionColumns}
              visibleColumns={consumptionColumnConfig.visibleColumns}
              onColumnToggle={consumptionColumnConfig.toggleColumn}
            />
          </div>
          <div className="table-container">
            <table className="feed-table">
              <thead>
                <tr>
                  {consumptionColumnConfig.isColumnVisible('date') && <th>Date</th>}
                  {consumptionColumnConfig.isColumnVisible('feedType') && <th>Feed Type</th>}
                  {consumptionColumnConfig.isColumnVisible('quantityConsumed') && <th>Quantity (kg)</th>}
                  {consumptionColumnConfig.isColumnVisible('chickenBatch') && <th>Chicken Batch</th>}
                  {consumptionColumnConfig.isColumnVisible('notes') && <th>Notes</th>}
                  {consumptionColumnConfig.isColumnVisible('actions') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {feedConsumption.length > 0 ? (
                  feedConsumption.map(item => {
                    const feedItem = feedInventory.find(feed => feed.id === item.feedId)
                    const chickenBatch = liveChickens.find(batch => batch.id === item.chickenBatchId)
                    
                    return (
                      <tr key={item.id}>
                        {consumptionColumnConfig.isColumnVisible('date') && <td>{formatDate(item.date)}</td>}
                        {consumptionColumnConfig.isColumnVisible('feedType') && <td>{feedItem?.feedType || 'Unknown'}</td>}
                        {consumptionColumnConfig.isColumnVisible('quantityConsumed') && <td>{formatNumber(item.quantityConsumed)}</td>}
                        {consumptionColumnConfig.isColumnVisible('chickenBatch') && <td>{chickenBatch?.batchId || 'Unknown'}</td>}
                        {consumptionColumnConfig.isColumnVisible('notes') && <td>{item.notes || '-'}</td>}
                        {consumptionColumnConfig.isColumnVisible('actions') && (
                          <td>
                            <button 
                              className="delete-btn" 
                              onClick={() => handleDeleteConsumption(item.id)}
                              aria-label="Delete"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={consumptionColumnConfig.visibleColumns.length} className="no-data">
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
                          <td>{formatDate(date)}</td>
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
                  <label htmlFor="numberOfBags">No. of Bags*</label>
                  <input
                    type="number"
                    id="numberOfBags"
                    name="numberOfBags"
                    value={feedFormData.numberOfBags}
                    onChange={handleFeedInputChange}
                    step="1"
                    min="1"
                    required
                    placeholder="1"
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