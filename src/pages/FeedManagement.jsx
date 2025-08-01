import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { formatNumber, formatDate } from '../utils/formatters'
import ColumnFilter from '../components/UI/ColumnFilter'
import useColumnConfig from '../hooks/useColumnConfig'
import './FeedManagement.css'

const FeedManagement = () => {
  const { feedInventory, addFeedInventory, updateFeedInventory, deleteFeedInventory, feedConsumption, addFeedConsumption, deleteFeedConsumption, liveChickens } = useAppContext()
  

  
  // State for active tab
  const [activeTab, setActiveTab] = useState('inventory')
  
  // State for filters
  const [filters, setFilters] = useState({
    feed_type: '',
    startDate: '',
    endDate: ''
  })
  
  // State for modals
  const [showFeedModal, setShowFeedModal] = useState(false)
  const [showConsumptionModal, setShowConsumptionModal] = useState(false)
  const [editingFeed, setEditingFeed] = useState(null)
  
  // Form state for feed inventory
  const [feedFormData, setFeedFormData] = useState({
    feed_type: '',
    brand: '',
    supplier: '',
    number_of_bags: '',
    quantity_kg: '',
    cost_per_bag: '',
    purchase_date: '',
    expiry_date: '',
    notes: ''
  })
  
  // Form state for feed consumption
  const [consumptionFormData, setConsumptionFormData] = useState({
    feed_id: '',
    quantity_consumed: '',
    chicken_batch_id: '',
    notes: ''
  })

  // Column configurations
  const inventoryColumns = [
    { key: 'purchase_date', label: 'Purchase Date' },
    { key: 'feed_type', label: 'Feed Type' },
    { key: 'brand', label: 'Brand' },
    { key: 'number_of_bags', label: 'No. of Bags' },
    { key: 'quantity_kg', label: 'Quantity (kg)' },
    { key: 'cost_per_bag', label: 'Cost/bag' },
    { key: 'totalCost', label: 'Total Cost' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'expiry_date', label: 'Expiry Date' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
  ]

  const consumptionColumns = [
    { key: 'consumption_date', label: 'Date' },
    { key: 'feed_type', label: 'Feed Type' },
    { key: 'quantity_consumed', label: 'Quantity (kg)' },
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
    
    if (filters.feed_type) {
      filtered = filtered.filter(item =>
        item.feed_type.toLowerCase().includes(filters.feed_type.toLowerCase())
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
      feed_type: '',
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
      feed_type: '',
      brand: '',
      number_of_bags: '',
      quantity_kg: '',
      cost_per_bag: '',
      supplier: '',
      expiry_date: '',
      notes: ''
    })
    setShowFeedModal(true)
  }
  
  // Open consumption modal
  const openConsumptionModal = () => {
    setConsumptionFormData({
        feed_id: '',
        quantity_consumed: '',
        chicken_batch_id: '',
        notes: ''
      })
    setShowConsumptionModal(true)
  }
  
  // Close modals
  const closeFeedModal = () => {
    setShowFeedModal(false)
    setEditingFeed(null)
    setFeedFormData({
      feed_type: '',
      brand: '',
      supplier: '',
      number_of_bags: '',
      quantity_kg: '',
      cost_per_bag: '',
      purchase_date: '',
      expiry_date: '',
      notes: ''
    })
  }
  const closeConsumptionModal = () => setShowConsumptionModal(false)
  
  // Handle feed form submission
  const handleFeedSubmit = async (e) => {
    e.preventDefault()
    
    if (editingFeed) {
      await handleUpdateFeed(e)
    } else {
      try {
        await addFeedInventory({
          feed_type: feedFormData.feed_type,
          brand: feedFormData.brand,
          number_of_bags: parseInt(feedFormData.number_of_bags),
          quantity_kg: parseFloat(feedFormData.quantity_kg),
          cost_per_bag: parseFloat(feedFormData.cost_per_bag),
          supplier: feedFormData.supplier,
          expiry_date: feedFormData.expiry_date,
          notes: feedFormData.notes
        })
        
        closeFeedModal()
      } catch (error) {
        alert(`Error: ${error.message}`)
      }
    }
  }
  
  // Handle consumption form submission
  const handleConsumptionSubmit = async (e) => {
    e.preventDefault()
    
    try {
      await addFeedConsumption({
        feed_id: consumptionFormData.feed_id,
        quantity_consumed: parseFloat(consumptionFormData.quantity_consumed),
        chicken_batch_id: consumptionFormData.chicken_batch_id,
        notes: consumptionFormData.notes
      })
      
      closeConsumptionModal()
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  // Handle edit feed
  const handleEditFeed = (feed) => {
    setEditingFeed(feed)
    setFeedFormData({
      feed_type: feed.feed_type,
      brand: feed.brand,
      supplier: feed.supplier,
      number_of_bags: feed.number_of_bags.toString(),
      quantity_kg: feed.quantity_kg.toString(),
      cost_per_bag: feed.cost_per_bag.toString(),
      purchase_date: feed.purchase_date || feed.date,
      expiry_date: feed.expiry_date,
      notes: feed.notes || ''
    })
    setShowFeedModal(true)
  }

  // Handle update feed
  const handleUpdateFeed = async (e) => {
    e.preventDefault()
    
    try {
      await updateFeedInventory(editingFeed.id, {
        feed_type: feedFormData.feed_type,
        brand: feedFormData.brand,
        number_of_bags: parseInt(feedFormData.number_of_bags),
        quantity_kg: parseFloat(feedFormData.quantity_kg),
        cost_per_bag: parseFloat(feedFormData.cost_per_bag),
        supplier: feedFormData.supplier,
        expiry_date: feedFormData.expiry_date,
        notes: feedFormData.notes
      })
      
      setEditingFeed(null)
      closeFeedModal()
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
      return total + (item.quantity_kg * item.cost_per_bag)
    }, 0)
  }
  
  // Calculate low stock items
  const getLowStockItems = () => {
    return filteredFeed.filter(item => item.quantity_kg < 50) // Less than 50kg is considered low stock
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
              <p className="summary-value">{formatNumber(filteredFeed.reduce((sum, item) => sum + item.quantity_kg, 0))} kg</p>
            </div>
            <div className="summary-card">
              <h3>Total Value</h3>
              <p className="summary-value">₦{formatNumber(calculateTotalValue(), 2)}</p>
            </div>
            <div className="summary-card">
              <h3>Feed Types</h3>
              <p className="summary-value">{new Set(filteredFeed.map(item => item.feed_type)).size}</p>
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
                <label htmlFor="feed_type">Feed Type</label>
                <select
                  id="feed_type"
                  name="feed_type"
                  value={filters.feed_type}
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
                  {inventoryColumnConfig.isColumnVisible('feed_type') && <th>Feed Type</th>}
                {inventoryColumnConfig.isColumnVisible('brand') && <th>Brand</th>}
                {inventoryColumnConfig.isColumnVisible('number_of_bags') && <th>No. of Bags</th>}
                {inventoryColumnConfig.isColumnVisible('quantity_kg') && <th>Quantity (kg)</th>}
                {inventoryColumnConfig.isColumnVisible('cost_per_bag') && <th>Cost/bag</th>}
                {inventoryColumnConfig.isColumnVisible('totalCost') && <th>Total Cost</th>}
                {inventoryColumnConfig.isColumnVisible('supplier') && <th>Supplier</th>}
                {inventoryColumnConfig.isColumnVisible('expiry_date') && <th>Expiry Date</th>}
                  {inventoryColumnConfig.isColumnVisible('status') && <th>Status</th>}
                  {inventoryColumnConfig.isColumnVisible('actions') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredFeed.length > 0 ? (
                  filteredFeed.map(item => {
                    const isLowStock = item.quantity_kg < 50
                const isExpiringSoon = new Date(item.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                    
                    return (
                      <tr key={item.id} className={isLowStock ? 'low-stock' : ''}>
                        {inventoryColumnConfig.isColumnVisible('date') && <td>{formatDate(item.date)}</td>}
                        {inventoryColumnConfig.isColumnVisible('feed_type') && <td>{item.feed_type}</td>}
                    {inventoryColumnConfig.isColumnVisible('brand') && <td>{item.brand}</td>}
                    {inventoryColumnConfig.isColumnVisible('number_of_bags') && <td>{item.number_of_bags}</td>}
                    {inventoryColumnConfig.isColumnVisible('quantity_kg') && <td>{formatNumber(item.quantity_kg)}</td>}
                    {inventoryColumnConfig.isColumnVisible('cost_per_bag') && <td>₦{formatNumber(item.cost_per_bag, 2)}</td>}
                    {inventoryColumnConfig.isColumnVisible('totalCost') && <td>₦{formatNumber((item.number_of_bags || 1) * item.cost_per_bag, 2)}</td>}
                    {inventoryColumnConfig.isColumnVisible('supplier') && <td>{item.supplier}</td>}
                    {inventoryColumnConfig.isColumnVisible('expiry_date') && (
                      <td className={isExpiringSoon ? 'expiring-soon' : ''}>
                        {formatDate(item.expiry_date)}
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
                            <div className="action-buttons">
                              <button 
                                className="edit-btn" 
                                onClick={() => handleEditFeed(item)}
                                aria-label="Edit"
                              >
                                Edit
                              </button>
                              <button 
                                className="delete-btn" 
                                onClick={() => handleDeleteFeed(item.id)}
                                aria-label="Delete"
                              >
                                Delete
                              </button>
                            </div>
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
                  {consumptionColumnConfig.isColumnVisible('consumption_date') && <th>Date</th>}
                {consumptionColumnConfig.isColumnVisible('feed_type') && <th>Feed Type</th>}
                {consumptionColumnConfig.isColumnVisible('quantity_consumed') && <th>Quantity (kg)</th>}
                {consumptionColumnConfig.isColumnVisible('chicken_batch') && <th>Chicken Batch</th>}
                {consumptionColumnConfig.isColumnVisible('notes') && <th>Notes</th>}
                  {consumptionColumnConfig.isColumnVisible('actions') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {feedConsumption.length > 0 ? (
                  feedConsumption.map(item => {
                    const feedItem = feedInventory.find(feed => feed.id === item.feed_id)
                    const chickenBatch = liveChickens.find(batch => batch.id === item.chicken_batch_id)
                    
                    return (
                      <tr key={item.id}>
                        {consumptionColumnConfig.isColumnVisible('consumption_date') && <td>{formatDate(item.consumption_date)}</td>}
                        {consumptionColumnConfig.isColumnVisible('feed_type') && <td>{feedItem?.feed_type || 'Unknown'}</td>}
                        {consumptionColumnConfig.isColumnVisible('quantity_consumed') && <td>{formatNumber(item.quantity_consumed)}</td>}
                        {consumptionColumnConfig.isColumnVisible('chicken_batch') && <td>{chickenBatch?.batchId || 'Unknown'}</td>}
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
                  const totalConsumed = feedConsumption.reduce((sum, item) => sum + item.quantity_consumed, 0)
                   const totalChickens = liveChickens.reduce((sum, batch) => sum + batch.currentCount, 0)
                   const ratio = totalChickens > 0 ? (totalConsumed / totalChickens).toFixed(2) : '0.00'
                  return `${ratio} kg/bird`
                })()} 
              </p>
            </div>
            <div className="summary-card">
              <h3>Average Daily Consumption</h3>
              <p className="summary-value">
                {(() => {
                  const daysWithData = new Set(feedConsumption.map(item => item.date)).size
                  const totalConsumption = feedConsumption.reduce((sum, item) => sum + item.quantity_consumed, 0)
                  const avgDaily = daysWithData > 0 ? (totalConsumption / daysWithData).toFixed(1) : '0.0'
                  return `${avgDaily} kg/day`
                })()} 
              </p>
            </div>
            <div className="summary-card">
              <h3>Feed Cost per Bird</h3>
              <p className="summary-value">
                {(() => {
                  const totalFeedValue = feedInventory.reduce((sum, item) => sum + (item.quantity_kg * item.cost_per_bag), 0)
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
                  const totalFeedConsumed = feedConsumption.reduce((sum, item) => sum + item.quantity_consumed, 0)
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
                    const feedTypes = [...new Set(feedInventory.map(item => item.feed_type))]
      return feedTypes.map(feedType => {
        const typeInventory = feedInventory.filter(item => item.feed_type === feedType)
        const typeConsumption = feedConsumption.filter(item => {
          const feedItem = feedInventory.find(feed => feed.id === item.feed_id)
          return feedItem?.feed_type === feedType
        })
        
        const totalStock = typeInventory.reduce((sum, item) => sum + item.quantity_kg, 0)
        const totalConsumed = typeConsumption.reduce((sum, item) => sum + item.quantity_consumed, 0)
        const remaining = totalStock - totalConsumed
        const totalCost = typeInventory.reduce((sum, item) => sum + (item.quantity_kg * item.cost_per_bag), 0)
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
                      const dayConsumption = feedConsumption.filter(item => item.consumption_date === date)
                      const totalConsumption = dayConsumption.reduce((sum, item) => sum + item.quantity_consumed, 0)
                       const batchesFed = new Set(dayConsumption.map(item => item.chicken_batch_id)).size
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
      
      {/* Add/Edit Feed Modal */}
      {showFeedModal && (
        <div className="modal-overlay" onClick={closeFeedModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingFeed ? 'Edit Feed Stock' : 'Add Feed Stock'}</h2>
            
            <form onSubmit={handleFeedSubmit}>
              {/* Row 1: Feed Type, Brand */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="feed_type">Feed Type*</label>
                  <select
                    id="feed_type"
                    name="feed_type"
                    value={feedFormData.feed_type}
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
              
              {/* Row 2: Cost per bag, Quantity */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cost_per_bag">Cost per bag (₦)*</label>
                  <input
                    type="number"
                    id="cost_per_bag"
                    name="cost_per_bag"
                    value={feedFormData.cost_per_bag}
                    onChange={handleFeedInputChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="quantity_kg">Quantity (kg)*</label>
                  <input
                    type="number"
                    id="quantity_kg"
                    name="quantity_kg"
                    value={feedFormData.quantity_kg}
                    onChange={handleFeedInputChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              {/* Row 3: Number of Bags, Supplier */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="number_of_bags">No. of Bags*</label>
                  <input
                    type="number"
                    id="number_of_bags"
                    name="number_of_bags"
                    value={feedFormData.number_of_bags}
                    onChange={handleFeedInputChange}
                    step="1"
                    min="1"
                    required
                    placeholder="1"
                  />
                </div>
                
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
              </div>
              
              {/* Row 4: Expiry date, Batch Number */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expiry_date">Expiry Date</label>
                  <input
                    type="date"
                    id="expiry_date"
                    name="expiry_date"
                    value={feedFormData.expiry_date}
                    onChange={handleFeedInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="batch_number">Batch Number</label>
                  <input
                    type="text"
                    id="batch_number"
                    name="batch_number"
                    value={feedFormData.batch_number}
                    onChange={handleFeedInputChange}
                    placeholder="Batch number"
                  />
                </div>
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
                  <label htmlFor="feed_id">Feed Type*</label>
                  <select
                    id="feed_id"
                    name="feed_id"
                    value={consumptionFormData.feed_id}
                    onChange={handleConsumptionInputChange}
                    required
                  >
                    <option value="">Select feed</option>
                    {feedInventory.map(feed => (
                      <option key={feed.id} value={feed.id}>
                        {feed.feed_type} - {feed.brand} ({formatNumber(feed.quantity_kg)} kg available)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="chicken_batch_id">Chicken Batch*</label>
                 <select
                   id="chicken_batch_id"
                   name="chicken_batch_id"
                   value={consumptionFormData.chicken_batch_id}
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
                  <label htmlFor="quantity_consumed">Quantity Consumed (kg)*</label>
                <input
                  type="number"
                  id="quantity_consumed"
                  name="quantity_consumed"
                  value={consumptionFormData.quantity_consumed}
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