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
import './FeedManagement.css'

// Feed brand constants
const FEED_BRANDS = [
  'New Hope',
  'BreedWell', 
  'Ultima',
  'Happy Chicken',
  'Chikum',
  'Others'
]

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
    custom_brand: '',
    supplier: '',
    number_of_bags: '',
    quantity_kg: '',
    cost_per_bag: '',
    purchase_date: '',
    expiry_date: '',
    notes: '',
    deduct_from_balance: false,
    assigned_batches: []
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
        new Date(item.purchase_date) >= new Date(filters.startDate)
      )
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(item => 
        new Date(item.purchase_date) <= new Date(filters.endDate)
      )
    }
    
    return filtered
  }
  
  const filteredFeed = getFilteredFeed()
  
  // Sorting hooks
  const { sortedData: sortedInventory, sortConfig: inventorySortConfig, requestSort: requestInventorySort, resetSort: resetInventorySort, getSortIcon: getInventorySortIcon } = useTableSort(filteredFeed)
  const { sortedData: sortedConsumption, sortConfig: consumptionSortConfig, requestSort: requestConsumptionSort, resetSort: resetConsumptionSort, getSortIcon: getConsumptionSortIcon } = useTableSort(feedConsumption || [])
  
  // Pagination for feed inventory
  const feedPagination = usePagination(sortedInventory, 10)
  
  // Pagination for feed consumption
  const consumptionPagination = usePagination(sortedConsumption, 10)
  
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

  // Handle batch assignment changes
  const handleBatchAssignmentChange = (batchId, isChecked, quantity = '') => {
    setFeedFormData(prev => {
      const updatedBatches = isChecked
        ? [...prev.assigned_batches, { batch_id: batchId, assigned_quantity_kg: parseFloat(quantity) || 0 }]
        : prev.assigned_batches.filter(batch => batch.batch_id !== batchId)
      
      return { ...prev, assigned_batches: updatedBatches }
    })
  }

  // Handle batch quantity change
  const handleBatchQuantityChange = (batchId, quantity) => {
    setFeedFormData(prev => ({
      ...prev,
      assigned_batches: prev.assigned_batches.map(batch =>
        batch.batch_id === batchId
          ? { ...batch, assigned_quantity_kg: parseFloat(quantity) || 0 }
          : batch
      )
    }))
  }

  // Handle checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    setFeedFormData(prev => ({ ...prev, [name]: checked }))
  }
  
  // Open feed modal
  const openFeedModal = () => {
    setFeedFormData({
      feed_type: '',
      brand: '',
      custom_brand: '',
      number_of_bags: '',
      quantity_kg: '',
      cost_per_bag: '',
      supplier: '',
      expiry_date: '',
      notes: '',
      deduct_from_balance: false,
      assigned_batches: []
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
      custom_brand: '',
      supplier: '',
      number_of_bags: '',
      quantity_kg: '',
      cost_per_bag: '',
      purchase_date: '',
      expiry_date: '',
      notes: '',
      deduct_from_balance: false,
      assigned_batches: []
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
        const finalBrand = feedFormData.brand === 'Others' ? feedFormData.custom_brand : feedFormData.brand
        await addFeedInventory({
          feed_type: feedFormData.feed_type,
          brand: finalBrand,
          number_of_bags: parseInt(feedFormData.number_of_bags),
          quantity_kg: parseFloat(feedFormData.quantity_kg),
          cost_per_bag: parseFloat(feedFormData.cost_per_bag),
          supplier: feedFormData.supplier,
          expiry_date: feedFormData.expiry_date,
          notes: feedFormData.notes,
          deduct_from_balance: feedFormData.deduct_from_balance,
          assigned_batches: feedFormData.assigned_batches
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
    const isCustomBrand = !FEED_BRANDS.slice(0, -1).includes(feed.brand)
    setFeedFormData({
      feed_type: feed.feed_type,
      brand: isCustomBrand ? 'Others' : feed.brand,
      custom_brand: isCustomBrand ? feed.brand : '',
      supplier: feed.supplier,
      number_of_bags: feed.number_of_bags.toString(),
      quantity_kg: feed.quantity_kg.toString(),
      cost_per_bag: feed.cost_per_bag.toString(),
      purchase_date: feed.purchase_date,
      expiry_date: feed.expiry_date,
      notes: feed.notes || '',
      deduct_from_balance: feed.deduct_from_balance || false,
      assigned_batches: feed.assigned_batches || []
    })
    setShowFeedModal(true)
  }

  // Handle update feed
  const handleUpdateFeed = async (e) => {
    e.preventDefault()
    
    try {
      const finalBrand = feedFormData.brand === 'Others' ? feedFormData.custom_brand : feedFormData.brand
      await updateFeedInventory(editingFeed.id, {
        feed_type: feedFormData.feed_type,
        brand: finalBrand,
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
      return total + ((item.number_of_bags || 1) * item.cost_per_bag)
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
          
          {/* Feed Inventory Table */}
          <div className="table-header-controls">
            <h3>Feed Inventory</h3>
            <ColumnFilter 
              columns={inventoryColumns}
              visibleColumns={inventoryColumnConfig.visibleColumns}
              onColumnToggle={inventoryColumnConfig.toggleColumn}
            />          </div>
          
          {/* Sort Controls */}
          <SortControls 
            sortConfig={inventorySortConfig}
            onReset={resetInventorySort}
          />
          
          <div className="table-container">
            <table className="feed-table">
              <thead>
                <tr>
                  {inventoryColumnConfig.isColumnVisible('purchase_date') && (
                    <SortableTableHeader sortKey="purchase_date" onSort={requestInventorySort} getSortIcon={getInventorySortIcon}>
                      Purchase Date
                    </SortableTableHeader>
                  )}
                  {inventoryColumnConfig.isColumnVisible('feed_type') && (
                    <SortableTableHeader sortKey="feed_type" onSort={requestInventorySort} getSortIcon={getInventorySortIcon}>
                      Feed Type
                    </SortableTableHeader>
                  )}
                  {inventoryColumnConfig.isColumnVisible('brand') && (
                    <SortableTableHeader sortKey="brand" onSort={requestInventorySort} getSortIcon={getInventorySortIcon}>
                      Brand
                    </SortableTableHeader>
                  )}
                  {inventoryColumnConfig.isColumnVisible('number_of_bags') && (
                    <SortableTableHeader sortKey="number_of_bags" onSort={requestInventorySort} getSortIcon={getInventorySortIcon}>
                      No. of Bags
                    </SortableTableHeader>
                  )}
                  {inventoryColumnConfig.isColumnVisible('quantity_kg') && (
                    <SortableTableHeader sortKey="quantity_kg" onSort={requestInventorySort} getSortIcon={getInventorySortIcon}>
                      Quantity (kg)
                    </SortableTableHeader>
                  )}
                  {inventoryColumnConfig.isColumnVisible('cost_per_bag') && (
                    <SortableTableHeader sortKey="cost_per_bag" onSort={requestInventorySort} getSortIcon={getInventorySortIcon}>
                      Cost/bag
                    </SortableTableHeader>
                  )}
                  {inventoryColumnConfig.isColumnVisible('totalCost') && (
                    <SortableTableHeader sortKey="totalCost" onSort={requestInventorySort} getSortIcon={getInventorySortIcon}>
                      Total Cost
                    </SortableTableHeader>
                  )}
                  {inventoryColumnConfig.isColumnVisible('supplier') && (
                    <SortableTableHeader sortKey="supplier" onSort={requestInventorySort} getSortIcon={getInventorySortIcon}>
                      Supplier
                    </SortableTableHeader>
                  )}
                  {inventoryColumnConfig.isColumnVisible('expiry_date') && (
                    <SortableTableHeader sortKey="expiry_date" onSort={requestInventorySort} getSortIcon={getInventorySortIcon}>
                      Expiry Date
                    </SortableTableHeader>
                  )}
                  {inventoryColumnConfig.isColumnVisible('status') && (
                    <SortableTableHeader sortKey="status" onSort={requestInventorySort} getSortIcon={getInventorySortIcon}>
                      Status
                    </SortableTableHeader>
                  )}
                  {inventoryColumnConfig.isColumnVisible('actions') && (
                    <SortableTableHeader sortable={false}>
                      Actions
                    </SortableTableHeader>
                  )}
                </tr>
              </thead>
              <tbody>
                {feedPagination.currentData.length > 0 ? (
                  feedPagination.currentData.map(item => {
                    const isLowStock = item.quantity_kg < 50
                const isExpiringSoon = new Date(item.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                    
                    return (
                      <tr key={item.id} className={isLowStock ? 'low-stock' : ''}>
                        {inventoryColumnConfig.isColumnVisible('purchase_date') && <td>{formatDate(item.purchase_date)}</td>}
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
                                className="edit-btn-icon"
                                onClick={() => handleEditFeed(item)}
                                title="Edit feed item"
                                aria-label="Edit feed item"
                              >
                                ✏️
                              </button>
                              <button
                                className="delete-btn-icon"
                                onClick={() => handleDeleteFeed(item.id)}
                                title="Delete feed item"
                                aria-label="Delete feed item"
                              >
                                🗑️
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
          
          {/* Feed Inventory Pagination */}
          <Pagination
            currentPage={feedPagination.currentPage}
            totalPages={feedPagination.totalPages}
            onPageChange={feedPagination.handlePageChange}
            pageSize={feedPagination.pageSize}
            onPageSizeChange={feedPagination.handlePageSizeChange}
            totalItems={feedPagination.totalItems}
          />
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
                    .filter(item => new Date(item.consumption_date).toDateString() === new Date().toDateString())
                    .reduce((sum, item) => sum + item.quantity_consumed, 0)
                )} kg
              </p>
            </div>
            <div className="summary-card">
              <h3>This Week</h3>
              <p className="summary-value">
                {formatNumber(
                  feedConsumption
                    .filter(item => {
                      const itemDate = new Date(item.consumption_date)
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return itemDate >= weekAgo
                    })
                    .reduce((sum, item) => sum + item.quantity_consumed, 0)
                )} kg
              </p>
            </div>
            <div className="summary-card">
              <h3>This Month</h3>
              <p className="summary-value">
                {formatNumber(
                  feedConsumption
                    .filter(item => {
                      const itemDate = new Date(item.consumption_date)
                      const monthAgo = new Date()
                      monthAgo.setMonth(monthAgo.getMonth() - 1)
                      return itemDate >= monthAgo
                    })
                    .reduce((sum, item) => sum + item.quantity_consumed, 0)
                )} kg
              </p>
            </div>
            <div className="summary-card">
              <h3>Active Batches</h3>
              <p className="summary-value">{liveChickens.filter(batch => batch.status === 'healthy' || batch.status === 'sick').length}</p>
            </div>
          </div>

          {/* Consumption Table */}
          <div className="table-header-controls">
            <h3>Feed Consumption</h3>
            <ColumnFilter 
              columns={consumptionColumns}
              visibleColumns={consumptionColumnConfig.visibleColumns}
              onColumnToggle={consumptionColumnConfig.toggleColumn}
            />          </div>
          
          {/* Sort Controls */}
          <SortControls 
            sortConfig={consumptionSortConfig}
            onReset={resetConsumptionSort}
          />
          
          <div className="table-container">
            <table className="feed-table">
              <thead>
                <tr>
                  {consumptionColumnConfig.isColumnVisible('consumption_date') && (
                    <SortableTableHeader sortKey="consumption_date" onSort={requestConsumptionSort} getSortIcon={getConsumptionSortIcon}>
                      Date
                    </SortableTableHeader>
                  )}
                  {consumptionColumnConfig.isColumnVisible('feed_type') && (
                    <SortableTableHeader sortKey="feed_type" onSort={requestConsumptionSort} getSortIcon={getConsumptionSortIcon}>
                      Feed Type
                    </SortableTableHeader>
                  )}
                  {consumptionColumnConfig.isColumnVisible('quantity_consumed') && (
                    <SortableTableHeader sortKey="quantity_consumed" onSort={requestConsumptionSort} getSortIcon={getConsumptionSortIcon}>
                      Quantity (kg)
                    </SortableTableHeader>
                  )}
                  {consumptionColumnConfig.isColumnVisible('chicken_batch') && (
                    <SortableTableHeader sortKey="chicken_batch" onSort={requestConsumptionSort} getSortIcon={getConsumptionSortIcon}>
                      Chicken Batch
                    </SortableTableHeader>
                  )}
                  {consumptionColumnConfig.isColumnVisible('notes') && (
                    <SortableTableHeader sortKey="notes" onSort={requestConsumptionSort} getSortIcon={getConsumptionSortIcon}>
                      Notes
                    </SortableTableHeader>
                  )}
                  {consumptionColumnConfig.isColumnVisible('actions') && (
                    <SortableTableHeader sortable={false}>
                      Actions
                    </SortableTableHeader>
                  )}
                </tr>
              </thead>
              <tbody>
                {consumptionPagination.currentData.length > 0 ? (
                  consumptionPagination.currentData.map(item => {
                    const feedItem = feedInventory.find(feed => feed.id === item.feed_id)
                    const chickenBatch = liveChickens.find(batch => batch.id === item.chicken_batch_id)
                    
                    return (
                      <tr key={item.id}>
                        {consumptionColumnConfig.isColumnVisible('consumption_date') && <td>{formatDate(item.consumption_date)}</td>}
                        {consumptionColumnConfig.isColumnVisible('feed_type') && <td>{feedItem?.feed_type || 'Unknown'}</td>}
                        {consumptionColumnConfig.isColumnVisible('quantity_consumed') && <td>{formatNumber(item.quantity_consumed)}</td>}
                        {consumptionColumnConfig.isColumnVisible('chicken_batch') && <td>{chickenBatch?.batch_id || 'Unknown'}</td>}
                        {consumptionColumnConfig.isColumnVisible('notes') && <td>{item.notes || '-'}</td>}
                        {consumptionColumnConfig.isColumnVisible('actions') && (
                          <td>
                            <button
                              className="delete-btn-icon"
                              onClick={() => handleDeleteConsumption(item.id)}
                              title="Delete consumption record"
                              aria-label="Delete consumption record"
                            >
                              🗑️
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
          
          {/* Feed Consumption Pagination */}
          <Pagination
            currentPage={consumptionPagination.currentPage}
            totalPages={consumptionPagination.totalPages}
            onPageChange={consumptionPagination.handlePageChange}
            pageSize={consumptionPagination.pageSize}
            onPageSizeChange={consumptionPagination.handlePageSizeChange}
            totalItems={consumptionPagination.totalItems}
          />
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
                  const daysWithData = new Set(feedConsumption.map(item => item.consumption_date)).size
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
                  const totalFeedValue = feedInventory.reduce((sum, item) => sum + ((item.number_of_bags || 1) * item.cost_per_bag), 0)
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
        const totalCost = typeInventory.reduce((sum, item) => sum + ((item.number_of_bags || 1) * item.cost_per_bag), 0)
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
                    for (let i = 0; i <= 6; i++) {
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
                  <select
                    id="brand"
                    name="brand"
                    value={feedFormData.brand}
                    onChange={handleFeedInputChange}
                    required
                  >
                    <option value="">Select brand</option>
                    {FEED_BRANDS.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                  {feedFormData.brand === 'Others' && (
                    <input
                      type="text"
                      id="custom_brand"
                      name="custom_brand"
                      value={feedFormData.custom_brand}
                      onChange={handleFeedInputChange}
                      placeholder="Enter custom brand name"
                      style={{ marginTop: '8px' }}
                      required
                    />
                  )}
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
              
              {/* Row 4: Expiry date, Notes */}
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
                  <label htmlFor="notes">Notes</label>
                  <input
                    type="text"
                    id="notes"
                    name="notes"
                    value={feedFormData.notes}
                    onChange={handleFeedInputChange}
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              
              {/* Balance Deduction Checkbox */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="deduct_from_balance"
                    checked={feedFormData.deduct_from_balance}
                    onChange={handleCheckboxChange}
                  />
                  <span className="checkmark"></span>
                  Deduct cost from current balance (₦{formatNumber((parseFloat(feedFormData.cost_per_bag) || 0) * (parseInt(feedFormData.number_of_bags) || 0), 2)})
                </label>
              </div>
              
              {/* Batch Assignment Section */}
              <div className="form-section">
                <h4>Assign to Chicken Batches (Optional)</h4>
                <div className="batch-assignment-container">
                  {liveChickens.filter(batch => batch.status === 'healthy' || batch.status === 'sick').map(batch => {
                    const isAssigned = feedFormData.assigned_batches.some(ab => ab.batch_id === batch.id)
                    const assignedBatch = feedFormData.assigned_batches.find(ab => ab.batch_id === batch.id)
                    
                    return (
                      <div key={batch.id} className="batch-assignment-item">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={(e) => handleBatchAssignmentChange(batch.id, e.target.checked)}
                          />
                          <span className="checkmark"></span>
                          {batch.batch_id} ({batch.currentCount} birds)
                        </label>
                        {isAssigned && (
                          <div className="quantity-input">
                            <input
                              type="number"
                              placeholder="Quantity (kg)"
                              step="0.01"
                              min="0"
                              value={assignedBatch?.assigned_quantity_kg || ''}
                              onChange={(e) => handleBatchQuantityChange(batch.id, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {liveChickens.filter(batch => batch.status === 'healthy' || batch.status === 'sick').length === 0 && (
                    <p className="no-batches-message">No active chicken batches available for assignment.</p>
                  )}
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
                    {feedInventory && feedInventory.length > 0 ? feedInventory
                      .filter(feed => feed.quantity_kg > 0)
                      .map(feed => (
                        <option key={feed.id} value={feed.id}>
                          {feed.feed_type} - {feed.brand} ({formatNumber(feed.quantity_kg)} kg available)
                        </option>
                      )) : (
                      <option disabled>No feed inventory available</option>
                    )}
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
                    {liveChickens.filter(batch => batch.status === 'healthy' || batch.status === 'sick').map(batch => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batch_id} ({batch.currentCount} birds)
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