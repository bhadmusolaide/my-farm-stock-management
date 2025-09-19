import { useState, useEffect, useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { formatNumber, formatDate } from '../utils/formatters'
import FeedDashboardOverview from '../components/FeedDashboardOverview'
import BatchFeedView from '../components/BatchFeedView'
import './EnhancedFeedManagement.css'

// Feed brand constants
const FEED_BRANDS = [
  'New Hope',
  'BreedWell', 
  'Ultima',
  'Happy Chicken',
  'Chikum',
  'Others'
]

const EnhancedFeedManagement = () => {
  const { 
    liveChickens, 
    feedInventory, 
    feedConsumption, 
    feedBatchAssignments,
    addFeedInventory, 
    addFeedConsumption 
  } = useAppContext()
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [formData, setFormData] = useState({})
  const [filters, setFilters] = useState({
    batchId: '',
    feedType: ''
  })

  // Predefined feed plans based on breed and age
  const feedPlans = {
    'Broiler': [
      { 
        stage: 'Starter', 
        feedType: 'Starter', 
        duration: '0-4 weeks', 
        bagsPerBatch: 3,
        description: 'High protein feed for rapid growth'
      },
      { 
        stage: 'Finisher', 
        feedType: 'Finisher', 
        duration: '4-6 weeks', 
        bagsPerBatch: 4,
        description: 'Balanced nutrition for final growth phase'
      }
    ],
    'Layer': [
      { 
        stage: 'Starter', 
        feedType: 'Starter', 
        duration: '0-6 weeks', 
        bagsPerBatch: 2,
        description: 'High protein feed for chick development'
      },
      { 
        stage: 'Grower', 
        feedType: 'Grower', 
        duration: '6-18 weeks', 
        bagsPerBatch: 3,
        description: 'Balanced nutrition for growing pullets'
      },
      { 
        stage: 'Layer', 
        feedType: 'Layer', 
        duration: '18+ weeks', 
        bagsPerBatch: 4,
        description: 'Calcium-rich feed for egg production'
      }
    ]
  }

  // Calculate batch age in weeks
  const calculateAgeInWeeks = (hatchDate) => {
    const today = new Date()
    const hatch = new Date(hatchDate)
    const diffTime = Math.abs(today - hatch)
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7))
  }

  // Get current feed stage for a batch
  const getCurrentFeedStage = (batch) => {
    const age = calculateAgeInWeeks(batch.hatch_date)
    const plan = feedPlans[batch.breed] || feedPlans['Broiler']
    
    for (let i = plan.length - 1; i >= 0; i--) {
      const stage = plan[i]
      if (stage.stage === 'Starter' && age <= 4) return stage
      if (stage.stage === 'Grower' && age > 4 && age <= 18) return stage
      if (stage.stage === 'Finisher' && age > 4 && age <= 6) return stage
      if (stage.stage === 'Layer' && age > 18) return stage
    }
    
    return plan[0] // Default to starter
  }

  // Get recommended feed for a batch
  const getRecommendedFeed = (batch) => {
    const currentStage = getCurrentFeedStage(batch)
    const existingFeed = feedInventory.find(feed => 
      feed.feed_type === currentStage.feedType && 
      new Date(feed.expiry_date) > new Date()
    )
    
    return {
      ...currentStage,
      batchId: batch.id,
      batchName: batch.batch_id,
      currentAge: calculateAgeInWeeks(batch.hatch_date),
      existingFeed: existingFeed ? existingFeed.quantity_kg : 0,
      recommendedQuantity: currentStage.bagsPerBatch * 25 // Assuming 25kg per bag
    }
  }

  // Calculate feed conversion ratio (FCR)
  const calculateFCR = (batchId) => {
    const batchConsumption = feedConsumption.filter(item => item.chicken_batch_id === batchId)
    const batch = liveChickens.find(b => b.id === batchId)
    
    if (!batch || batchConsumption.length === 0) return 0
    
    const totalFeedConsumed = batchConsumption.reduce((sum, item) => sum + item.quantity_consumed, 0)
    const avgWeight = batch.current_weight || 1
    const fcr = totalFeedConsumed / (batch.initial_count * avgWeight)
    
    return isNaN(fcr) ? 0 : fcr.toFixed(2)
  }

  // Get feed wastage percentage
  const calculateWastage = (batchId) => {
    // This would typically come from actual measurements
    // For now, we'll simulate based on batch health
    const batch = liveChickens.find(b => b.id === batchId)
    if (!batch) return 0
    
    // Higher wastage for sick batches
    return batch.status === 'sick' ? 15 : batch.status === 'quarantine' ? 10 : 5
  }

  // Enhanced performance analytics functions
  const calculateFeedCostPerBird = (batchId) => {
    const batchConsumption = feedConsumption.filter(item => item.chicken_batch_id === batchId)
    const batch = liveChickens.find(b => b.id === batchId)
    if (!batch || batchConsumption.length === 0) return 0

    const totalCost = batchConsumption.reduce((sum, item) => {
      const feedItem = feedInventory.find(f => f.id === item.feed_id)
      return sum + (item.quantity_consumed * (feedItem?.cost_per_kg || 0))
    }, 0)
    
    return (totalCost / batch.initial_count).toFixed(2)
  }

  const calculateWeightGainEfficiency = (batchId) => {
    const batch = liveChickens.find(b => b.id === batchId)
    if (!batch) return 0
    
    const ageInWeeks = calculateAgeInWeeks(batch.hatch_date)
    const expectedWeight = ageInWeeks * 0.15 // Assume 150g per week growth
    const actualWeight = batch.current_weight || expectedWeight
    
    return ((actualWeight / expectedWeight) * 100).toFixed(1)
  }

  const calculateDailyFeedConsumption = (batchId) => {
    const batchConsumption = feedConsumption.filter(item => item.chicken_batch_id === batchId)
    const batch = liveChickens.find(b => b.id === batchId)
    if (!batch || batchConsumption.length === 0) return 0

    const totalConsumed = batchConsumption.reduce((sum, item) => sum + item.quantity_consumed, 0)
    const ageInDays = Math.floor((new Date() - new Date(batch.hatch_date)) / (1000 * 60 * 60 * 24))
    
    return ageInDays > 0 ? (totalConsumed / ageInDays / batch.initial_count * 1000).toFixed(1) : 0 // grams per bird per day
  }

  const getBatchPerformanceRating = (batchId) => {
    const fcr = parseFloat(calculateFCR(batchId))
    const efficiency = parseFloat(calculateWeightGainEfficiency(batchId))
    const wastage = parseFloat(calculateWastage(batchId))
    
    let score = 0
    if (fcr <= 1.8) score += 30
    else if (fcr <= 2.2) score += 20
    else if (fcr <= 2.5) score += 10
    
    if (efficiency >= 95) score += 30
    else if (efficiency >= 85) score += 20
    else if (efficiency >= 75) score += 10
    
    if (wastage <= 3) score += 25
    else if (wastage <= 5) score += 15
    else if (wastage <= 8) score += 5
    
    if (score >= 80) return { rating: 'Excellent', color: '#10b981' }
    if (score >= 60) return { rating: 'Good', color: '#3b82f6' }
    if (score >= 40) return { rating: 'Average', color: '#f59e0b' }
    return { rating: 'Poor', color: '#ef4444' }
  }

  const getTopPerformingBatches = () => {
    return liveChickens
      .map(batch => ({
        ...batch,
        performance: getBatchPerformanceRating(batch.id),
        fcr: parseFloat(calculateFCR(batch.id)),
        efficiency: parseFloat(calculateWeightGainEfficiency(batch.id))
      }))
      .sort((a, b) => {
        const scoreA = a.performance.rating === 'Excellent' ? 4 : 
                      a.performance.rating === 'Good' ? 3 : 
                      a.performance.rating === 'Average' ? 2 : 1
        const scoreB = b.performance.rating === 'Excellent' ? 4 : 
                      b.performance.rating === 'Good' ? 3 : 
                      b.performance.rating === 'Average' ? 2 : 1
        return scoreB - scoreA
      })
      .slice(0, 3)
  }

  const calculateAverageFeedCost = () => {
    const totalCost = feedInventory.reduce((sum, item) => sum + (item.quantity_kg * (item.cost_per_bag / 25)), 0)
    const totalQuantity = feedInventory.reduce((sum, item) => sum + item.quantity_kg, 0)
    return totalQuantity > 0 ? (totalCost / totalQuantity).toFixed(2) : 0
  }

  // Filter live chickens based on filters
  const filteredBatches = useMemo(() => {
    return liveChickens.filter(batch => {
      if (filters.batchId && !batch.batch_id.toLowerCase().includes(filters.batchId.toLowerCase())) {
        return false
      }
      return true
    })
  }, [liveChickens, filters])

  // Get all feed recommendations
  const feedRecommendations = useMemo(() => {
    return filteredBatches.map(batch => getRecommendedFeed(batch))
  }, [filteredBatches])

  // Get low stock feed items
  const lowStockFeed = useMemo(() => {
    return feedInventory.filter(feed => feed.quantity_kg < 50)
  }, [feedInventory])

  // Get unassigned feeds (feeds not currently assigned to any batch)
  const unassignedFeeds = useMemo(() => {
    const assignedFeedIds = new Set(feedBatchAssignments.map(assignment => assignment.feed_id))
    return feedInventory.filter(feed => !assignedFeedIds.has(feed.id) && feed.quantity_kg > 0)
  }, [feedInventory, feedBatchAssignments])

  // Get feeds expiring soon (within 30 days)
  const expiringSoonFeeds = useMemo(() => {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    return feedInventory.filter(feed => {
      const expiryDate = new Date(feed.expiry_date)
      return expiryDate <= thirtyDaysFromNow && expiryDate > new Date()
    }).sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
  }, [feedInventory])

  // Get expired feeds
  const expiredFeeds = useMemo(() => {
    const today = new Date()
    return feedInventory.filter(feed => new Date(feed.expiry_date) < today)
  }, [feedInventory])

  // Calculate batch priority based on age, health, and feed requirements
  const calculateBatchPriority = (batch) => {
    const ageInWeeks = calculateAgeInWeeks(batch.hatch_date)
    let priority = 'medium'
    let score = 0

    // Age factor (younger batches need more attention)
    if (ageInWeeks < 2) score += 3
    else if (ageInWeeks < 4) score += 2
    else if (ageInWeeks < 8) score += 1

    // Health factor
    if (batch.status === 'sick') score += 3
    else if (batch.status === 'quarantine') score += 2
    else if (batch.status === 'healthy') score += 0

    // Feed availability factor
    const currentStage = getCurrentFeedStage(batch)
    const availableFeed = feedInventory.find(feed => 
      feed.feed_type === currentStage.feedType && feed.quantity_kg > 0
    )
    if (!availableFeed) score += 2

    // Determine priority
    if (score >= 5) priority = 'high'
    else if (score >= 3) priority = 'medium'
    else priority = 'low'

    return { priority, score }
  }

  // Get batches sorted by priority
  const batchesByPriority = useMemo(() => {
    return filteredBatches.map(batch => ({
      ...batch,
      ...calculateBatchPriority(batch)
    })).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority] || b.score - a.score
    })
  }, [filteredBatches, feedInventory])

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Open modal for different actions
  const openModal = (type, data = null) => {
    setModalType(type)
    setSelectedBatch(data)
    setFormData({})
    setShowModal(true)
  }

  // Close modal
  const closeModal = () => {
    setShowModal(false)
    setSelectedBatch(null)
    setModalType('')
    setFormData({})
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (modalType === 'purchase') {
        // Handle feed purchase
        const finalBrand = formData.brand === 'Others' ? formData.custom_brand : formData.brand
        const purchaseData = {
          feed_type: formData.feed_type,
          brand: finalBrand,
          number_of_bags: parseInt(formData.number_of_bags),
          quantity_kg: parseFloat(formData.quantity_kg),
          cost_per_bag: parseFloat(formData.cost_per_bag),
          supplier: formData.supplier,
          expiry_date: formData.expiry_date,
          purchase_date: new Date().toISOString().split('T')[0],
          deduct_from_balance: formData.deduct_from_balance === 'true'
        }
        
        await addFeedInventory(purchaseData)
      } else if (modalType === 'consume') {
        // Handle feed consumption
        const consumptionData = {
          feed_id: formData.feed_id,
          chicken_batch_id: selectedBatch.batchId,
          quantity_consumed: parseFloat(formData.quantity_consumed),
          notes: formData.notes
        }
        
        await addFeedConsumption(consumptionData)
      }
      
      closeModal()
    } catch (error) {
      console.error('Error handling feed operation:', error)
    }
  }

  return (
    <div className="enhanced-feed-container">
      <div className="page-header">
        <h1>Enhanced Feed Management</h1>
        <p>Optimized feed planning and tracking for your poultry operation</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          Feed Plans
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </button>
        <button 
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory
        </button>
        <button 
            className={`tab-button ${activeTab === 'batches' ? 'active' : ''}`}
            onClick={() => setActiveTab('batches')}
          >
            Batches
          </button>
          <button 
            className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
      </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            <FeedDashboardOverview
              liveChickens={liveChickens}
              feedInventory={feedInventory}
              feedConsumption={feedConsumption}
              feedBatchAssignments={feedBatchAssignments}
              calculateFCR={calculateFCR}
              getCurrentFeedStage={getCurrentFeedStage}
              formatNumber={formatNumber}
            />
          </div>
        )}

        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <div className="tab-content">
            <BatchFeedView
              liveChickens={liveChickens}
              feedInventory={feedInventory}
              feedConsumption={feedConsumption}
              feedBatchAssignments={feedBatchAssignments}
              onAssignFeed={(batch) => {
                setSelectedBatch(batch)
                openModal('smart-allocation', batch)
              }}
              onViewDetails={(batch) => {
                setSelectedBatch(batch)
                // Could open a detailed view modal here
              }}
            />
          </div>
        )}

        {/* Feed Plans Tab */}
        {activeTab === 'plans' && (
        <div className="plans-section">
          <h2>Feed Plans by Breed</h2>
          <div className="plans-grid">
            {Object.entries(feedPlans).map(([breed, plans]) => (
              <div key={breed} className="plan-card">
                <h3>{breed} Feed Plan</h3>
                <div className="plan-stages">
                  {plans.map((plan, index) => (
                    <div key={index} className="plan-stage">
                      <div className="stage-header">
                        <span className="stage-icon">
                          {plan.stage === 'Starter' ? '🐣' : 
                           plan.stage === 'Grower' ? '🐔' : 
                           plan.stage === 'Finisher' ? '🍗' : '🥚'}
                        </span>
                        <h4>{plan.stage}</h4>
                      </div>
                      <div className="stage-details">
                        <p><strong>Duration:</strong> {plan.duration}</p>
                        <p><strong>Feed Type:</strong> {plan.feedType}</p>
                        <p><strong>Bags Needed:</strong> {plan.bagsPerBatch} bags</p>
                        <p className="stage-description">{plan.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="recommendations-section">
          <div className="section-header">
            <h2>Feed Recommendations</h2>
            <div className="filters">
              <input
                type="text"
                name="batchId"
                placeholder="Filter by batch ID..."
                value={filters.batchId}
                onChange={handleFilterChange}
              />
              <button className="btn-primary" onClick={() => openModal('purchase')}>
                Purchase Feed
              </button>
            </div>
          </div>

          {feedRecommendations.length > 0 ? (
            <div className="recommendations-grid">
              {feedRecommendations.map((recommendation, index) => (
                <div key={index} className="recommendation-card">
                  <div className="batch-info">
                    <h3>{recommendation.batchName}</h3>
                    <p><strong>Breed:</strong> {recommendation.breed}</p>
                    <p><strong>Age:</strong> {recommendation.currentAge} weeks</p>
                  </div>
                  
                  <div className="feed-info">
                    <h4>{recommendation.stage} Feed</h4>
                    <p><strong>Type:</strong> {recommendation.feedType}</p>
                    <p><strong>Recommended:</strong> {recommendation.recommendedQuantity} kg</p>
                    <p><strong>Existing Stock:</strong> {formatNumber(recommendation.existingFeed)} kg</p>
                    
                    {recommendation.existingFeed < recommendation.recommendedQuantity && (
                      <div className="alert-low-stock">
                        <span>⚠️ Low stock - Purchase recommended</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="recommendation-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => openModal('purchase')}
                    >
                      Purchase Feed
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => openModal('consume', recommendation)}
                    >
                      Log Consumption
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">
              <p>No batches found matching your filters</p>
            </div>
          )}

          {/* Low Stock Alert */}
          {lowStockFeed.length > 0 && (
            <div className="low-stock-section">
              <h3>Low Stock Alert</h3>
              <div className="low-stock-grid">
                {lowStockFeed.map(feed => (
                  <div key={feed.id} className="low-stock-item">
                    <p><strong>{feed.feed_type}</strong> - {feed.brand}</p>
                    <p>Remaining: {formatNumber(feed.quantity_kg)} kg</p>
                    <button 
                      className="btn-primary"
                      onClick={() => openModal('purchase')}
                    >
                      Reorder
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="inventory-section">
          <h2>Feed Inventory Management</h2>
          
          {/* Inventory Summary Cards */}
          <div className="inventory-summary-cards">
            <div className="summary-card">
              <h3>Total Inventory</h3>
              <p className="summary-value">{feedInventory.length}</p>
              <p className="summary-label">Feed Items</p>
            </div>
            <div className="summary-card">
              <h3>Unassigned Feeds</h3>
              <p className="summary-value">{unassignedFeeds.length}</p>
              <p className="summary-label">Available for Assignment</p>
            </div>
            <div className="summary-card">
              <h3>Expiring Soon</h3>
              <p className="summary-value">{expiringSoonFeeds.length}</p>
              <p className="summary-label">Within 30 Days</p>
            </div>
            <div className="summary-card">
              <h3>Expired</h3>
              <p className="summary-value">{expiredFeeds.length}</p>
              <p className="summary-label">Needs Attention</p>
            </div>
          </div>

          {/* Unassigned Feeds Section */}
          {unassignedFeeds.length > 0 && (
            <div className="inventory-panel">
              <h3>🔄 Unassigned Feeds</h3>
              <p className="panel-description">These feeds are available for batch assignment</p>
              <div className="unassigned-feeds-grid">
                {unassignedFeeds.map(feed => (
                  <div key={feed.id} className="unassigned-feed-card">
                    <div className="feed-header">
                      <h4>{feed.feed_type}</h4>
                      <span className="feed-brand">{feed.brand}</span>
                    </div>
                    <div className="feed-details">
                      <p><strong>Quantity:</strong> {formatNumber(feed.quantity_kg)} kg</p>
                      <p><strong>Bags:</strong> {feed.number_of_bags}</p>
                      <p><strong>Expires:</strong> {new Date(feed.expiry_date).toLocaleDateString()}</p>
                      <p><strong>Supplier:</strong> {feed.supplier}</p>
                    </div>
                    <div className="feed-actions">
                      <button 
                        className="btn-primary"
                        onClick={() => openModal('smart-allocation', { feedId: feed.id })}
                      >
                        Assign to Batch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiry Tracking Section */}
          <div className="inventory-panel">
            <h3>⏰ Expiry Tracking</h3>
            
            {/* Expiring Soon */}
            {expiringSoonFeeds.length > 0 && (
              <div className="expiry-subsection">
                <h4>Expiring Soon (Next 30 Days)</h4>
                <div className="expiry-feeds-list">
                  {expiringSoonFeeds.map(feed => {
                    const daysUntilExpiry = getDaysUntilExpiry(feed.expiry_date)
                    return (
                      <div key={feed.id} className={`expiry-feed-item ${daysUntilExpiry <= 7 ? 'urgent' : daysUntilExpiry <= 14 ? 'warning' : 'caution'}`}>
                        <div className="expiry-feed-info">
                          <h5>{feed.feed_type} - {feed.brand}</h5>
                          <p>{formatNumber(feed.quantity_kg)} kg remaining</p>
                        </div>
                        <div className="expiry-countdown">
                          <span className="days-remaining">{daysUntilExpiry}</span>
                          <span className="days-label">days left</span>
                        </div>
                        <div className="expiry-actions">
                          <button 
                            className="btn-secondary"
                            onClick={() => openModal('smart-allocation', { feedId: feed.id })}
                          >
                            Use First
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Expired Feeds */}
            {expiredFeeds.length > 0 && (
              <div className="expiry-subsection">
                <h4>⚠️ Expired Feeds</h4>
                <div className="expired-feeds-list">
                  {expiredFeeds.map(feed => (
                    <div key={feed.id} className="expired-feed-item">
                      <div className="expired-feed-info">
                        <h5>{feed.feed_type} - {feed.brand}</h5>
                        <p>{formatNumber(feed.quantity_kg)} kg</p>
                        <p className="expired-date">Expired: {new Date(feed.expiry_date).toLocaleDateString()}</p>
                      </div>
                      <div className="expired-actions">
                        <button 
                          className="btn-danger"
                          onClick={() => {
                            if (confirm('Are you sure you want to dispose of this expired feed?')) {
                              // Handle disposal
                            }
                          }}
                        >
                          Dispose
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Batch Priorities Section */}
          <div className="inventory-panel">
            <h3>🎯 Batch Priorities</h3>
            <p className="panel-description">Batches ranked by feeding priority based on age, health, and feed availability</p>
            <div className="batch-priorities-list">
              {batchesByPriority.map(batch => {
                const currentStage = getCurrentFeedStage(batch)
                const availableFeed = feedInventory.find(feed => 
                  feed.feed_type === currentStage.feedType && feed.quantity_kg > 0
                )
                
                return (
                  <div key={batch.id} className={`batch-priority-item priority-${batch.priority}`}>
                    <div className="batch-priority-header">
                      <h4>{batch.batch_id}</h4>
                      <span className={`priority-badge priority-${batch.priority}`}>
                        {batch.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                    <div className="batch-priority-details">
                      <div className="batch-info">
                        <p><strong>Age:</strong> {calculateAgeInWeeks(batch.hatch_date)} weeks</p>
                        <p><strong>Count:</strong> {batch.initial_count} birds</p>
                        <p><strong>Status:</strong> {batch.status}</p>
                        <p><strong>Required Feed:</strong> {currentStage.feedType}</p>
                      </div>
                      <div className="feed-availability">
                        {availableFeed ? (
                          <div className="feed-available">
                            <p>✅ Feed Available</p>
                            <p>{formatNumber(availableFeed.quantity_kg)} kg in stock</p>
                          </div>
                        ) : (
                          <div className="feed-unavailable">
                            <p>❌ Feed Not Available</p>
                            <button 
                              className="btn-primary"
                              onClick={() => openModal('purchase')}
                            >
                              Purchase Feed
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="batch-priority-actions">
                      <button 
                        className="btn-secondary"
                        onClick={() => openModal('smart-allocation', batch)}
                      >
                        Assign Feed
                      </button>
                      <button 
                        className="btn-outline"
                        onClick={() => openModal('consume', batch)}
                      >
                        Log Consumption
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="analytics-section">
          <h2>Feed Analytics & Performance Insights</h2>
          
          {/* Enhanced Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Feed Stock</h3>
              <p className="summary-value">{formatNumber(feedInventory.reduce((sum, item) => sum + item.quantity_kg, 0))} kg</p>
              <p className="summary-subtitle">Avg Cost: ₦{calculateAverageFeedCost()}/kg</p>
            </div>
            <div className="summary-card">
              <h3>Active Batches</h3>
              <p className="summary-value">{liveChickens.length}</p>
              <p className="summary-subtitle">Performance Tracked</p>
            </div>
            <div className="summary-card">
              <h3>Monthly Consumption</h3>
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
              <p className="summary-subtitle">Last 30 Days</p>
            </div>
            <div className="summary-card">
              <h3>Average FCR</h3>
              <p className="summary-value">
                {liveChickens.length > 0 ? 
                  (liveChickens.reduce((sum, batch) => sum + parseFloat(calculateFCR(batch.id)), 0) / liveChickens.length).toFixed(2) 
                  : '0.00'}:1
              </p>
              <p className="summary-subtitle">Feed Efficiency</p>
            </div>
          </div>

          {/* Top Performing Batches */}
          <div className="performance-insights">
            <h3>🏆 Top Performing Batches</h3>
            <div className="top-performers-grid">
              {getTopPerformingBatches().map((batch, index) => (
                <div key={batch.id} className="top-performer-card">
                  <div className="performer-rank">#{index + 1}</div>
                  <div className="performer-info">
                    <h4>{batch.batch_id}</h4>
                    <div className="performance-badge" style={{ backgroundColor: batch.performance.color }}>
                      {batch.performance.rating}
                    </div>
                  </div>
                  <div className="performer-metrics">
                    <div className="mini-metric">
                      <span>FCR: {batch.fcr}:1</span>
                    </div>
                    <div className="mini-metric">
                      <span>Efficiency: {batch.efficiency}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Batch Analytics */}
          <div className="detailed-analytics">
            <h3>📊 Detailed Batch Performance</h3>
            <div className="analytics-grid">
              {filteredBatches.map(batch => {
                const performance = getBatchPerformanceRating(batch.id)
                return (
                  <div key={batch.id} className="enhanced-analytics-card">
                    <div className="analytics-header">
                      <h3>{batch.batch_id}</h3>
                      <div className="performance-indicator" style={{ backgroundColor: performance.color }}>
                        {performance.rating}
                      </div>
                    </div>
                    
                    <div className="analytics-metrics">
                      <div className="metric-row">
                        <div className="metric">
                          <span className="label">Feed Conversion Ratio</span>
                          <span className="value">{calculateFCR(batch.id)}:1</span>
                        </div>
                        <div className="metric">
                          <span className="label">Weight Gain Efficiency</span>
                          <span className="value">{calculateWeightGainEfficiency(batch.id)}%</span>
                        </div>
                      </div>
                      
                      <div className="metric-row">
                        <div className="metric">
                          <span className="label">Daily Feed/Bird</span>
                          <span className="value">{calculateDailyFeedConsumption(batch.id)}g</span>
                        </div>
                        <div className="metric">
                          <span className="label">Feed Cost/Bird</span>
                          <span className="value">₦{calculateFeedCostPerBird(batch.id)}</span>
                        </div>
                      </div>
                      
                      <div className="metric-row">
                        <div className="metric">
                          <span className="label">Estimated Wastage</span>
                          <span className="value">{calculateWastage(batch.id)}%</span>
                        </div>
                        <div className="metric">
                          <span className="label">Current Stage</span>
                          <span className="value">{getCurrentFeedStage(batch).stage}</span>
                        </div>
                      </div>
                    </div>

                    <div className="analytics-actions">
                      <button 
                        className="btn-secondary"
                        onClick={() => openModal('smart-allocation', batch)}
                      >
                        Optimize Feed
                      </button>
                      <button 
                        className="btn-outline"
                        onClick={() => openModal('consume', batch)}
                      >
                        Log Feed
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Feed Efficiency Comparison Chart */}
          <div className="efficiency-comparison">
            <h3>📈 Feed Efficiency Comparison</h3>
            <div className="comparison-chart">
              {liveChickens.map(batch => {
                const fcr = parseFloat(calculateFCR(batch.id))
                const efficiency = parseFloat(calculateWeightGainEfficiency(batch.id))
                const maxFCR = 3.0 // Maximum expected FCR for scaling
                const fcrPercentage = Math.min((fcr / maxFCR) * 100, 100)
                
                return (
                  <div key={batch.id} className="efficiency-bar-item">
                    <div className="batch-label">{batch.batch_id}</div>
                    <div className="efficiency-bars">
                      <div className="bar-container">
                        <label>FCR</label>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill fcr-bar" 
                            style={{ width: `${fcrPercentage}%` }}
                          ></div>
                        </div>
                        <span className="bar-value">{fcr}:1</span>
                      </div>
                      <div className="bar-container">
                        <label>Efficiency</label>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill efficiency-bar" 
                            style={{ width: `${efficiency}%` }}
                          ></div>
                        </div>
                        <span className="bar-value">{efficiency}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cost Analysis */}
          <div className="cost-analysis">
            <h3>💰 Feed Cost Analysis</h3>
            <div className="cost-breakdown">
              <div className="cost-summary">
                <div className="cost-item">
                  <span className="cost-label">Total Feed Investment</span>
                  <span className="cost-value">
                    ₦{formatNumber(feedInventory.reduce((sum, item) => 
                      sum + (item.quantity_kg * (item.cost_per_bag / 25)), 0
                    ))}
                  </span>
                </div>
                <div className="cost-item">
                  <span className="cost-label">Average Cost per Bird</span>
                  <span className="cost-value">
                    ₦{liveChickens.length > 0 ? 
                      (liveChickens.reduce((sum, batch) => 
                        sum + parseFloat(calculateFeedCostPerBird(batch.id)), 0
                      ) / liveChickens.length).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="cost-item">
                  <span className="cost-label">Most Expensive Batch</span>
                  <span className="cost-value">
                    {liveChickens.length > 0 ? 
                      liveChickens.reduce((max, batch) => 
                        parseFloat(calculateFeedCostPerBird(batch.id)) > parseFloat(calculateFeedCostPerBird(max.id)) 
                          ? batch : max
                      ).batch_id : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Feed Modal */}
      {showModal && modalType === 'purchase' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Purchase Feed</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="feed_type">Feed Type*</label>
                  <select
                    id="feed_type"
                    name="feed_type"
                    value={formData.feed_type || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select feed type</option>
                    <option value="Starter">Starter Feed</option>
                    <option value="Grower">Grower Feed</option>
                    <option value="Finisher">Finisher Feed</option>
                    <option value="Layer">Layer Feed</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="brand">Brand*</label>
                  <select
                    id="brand"
                    name="brand"
                    value={formData.brand || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select brand</option>
                    {FEED_BRANDS.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                  {formData.brand === 'Others' && (
                    <input
                      type="text"
                      id="custom_brand"
                      name="custom_brand"
                      value={formData.custom_brand || ''}
                      onChange={handleInputChange}
                      placeholder="Enter custom brand name"
                      style={{ marginTop: '8px' }}
                      required
                    />
                  )}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="number_of_bags">Number of Bags*</label>
                  <input
                    type="number"
                    id="number_of_bags"
                    name="number_of_bags"
                    value={formData.number_of_bags || ''}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="quantity_kg">Quantity (kg)*</label>
                  <input
                    type="number"
                    id="quantity_kg"
                    name="quantity_kg"
                    value={formData.quantity_kg || ''}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cost_per_bag">Cost per Bag (₦)*</label>
                  <input
                    type="number"
                    id="cost_per_bag"
                    name="cost_per_bag"
                    value={formData.cost_per_bag || ''}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="supplier">Supplier</label>
                  <input
                    type="text"
                    id="supplier"
                    name="supplier"
                    value={formData.supplier || ''}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expiry_date">Expiry Date</label>
                  <input
                    type="date"
                    id="expiry_date"
                    name="expiry_date"
                    value={formData.expiry_date || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="deduct_from_balance"
                    value="true"
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  Deduct cost from current balance
                </label>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Purchase Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Consumption Modal */}
      {showModal && modalType === 'consume' && selectedBatch && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Log Feed Consumption</h2>
            <div className="modal-header">
              <p><strong>Batch:</strong> {selectedBatch.batchName}</p>
              <p><strong>Current Stage:</strong> {selectedBatch.stage}</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="feed_id">Feed Type*</label>
                <select
                  id="feed_id"
                  name="feed_id"
                  value={formData.feed_id || ''}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select feed</option>
                  {feedInventory
                    .filter(feed => feed.feed_type === selectedBatch.feedType && feed.quantity_kg > 0)
                    .map(feed => (
                      <option key={feed.id} value={feed.id}>
                        {feed.feed_type} - {feed.brand} ({formatNumber(feed.quantity_kg)} kg available)
                      </option>
                    ))
                  }
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="quantity_consumed">Quantity Consumed (kg)*</label>
                <input
                  type="number"
                  id="quantity_consumed"
                  name="quantity_consumed"
                  value={formData.quantity_consumed || ''}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Observations, wastage notes, etc."
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
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

      {/* Smart Feed Allocation Modal */}
      {showModal && modalType === 'smart-allocation' && selectedBatch && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content smart-allocation-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Smart Feed Allocation</h2>
              <p>Batch {selectedBatch.id} - {selectedBatch.breed} ({selectedBatch.currentCount} birds)</p>
            </div>

            <div className="allocation-content">
              {/* Batch Information Panel */}
              <div className="batch-info-panel">
                <h3>Batch Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Age:</span>
                    <span className="value">{Math.floor((new Date() - new Date(selectedBatch.hatch_date)) / (1000 * 60 * 60 * 24 * 7))} weeks</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Current Stage:</span>
                    <span className="value">{(() => {
                      const age = Math.floor((new Date() - new Date(selectedBatch.hatch_date)) / (1000 * 60 * 60 * 24 * 7));
                      if (selectedBatch.breed === 'Broiler') {
                        return age <= 4 ? 'Starter' : 'Finisher';
                      } else {
                        if (age <= 6) return 'Starter';
                        if (age <= 18) return 'Grower';
                        return 'Layer';
                      }
                    })()}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Birds:</span>
                    <span className="value">{selectedBatch.currentCount}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">FCR:</span>
                    <span className="value">{selectedBatch.fcr || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Smart Recommendations */}
              <div className="recommendations-panel">
                <h3>🎯 Smart Recommendations</h3>
                <div className="recommendation-cards">
                  {(() => {
                    const age = Math.floor((new Date() - new Date(selectedBatch.hatch_date)) / (1000 * 60 * 60 * 24 * 7));
                    const currentStage = selectedBatch.breed === 'Broiler' 
                      ? (age <= 4 ? 'Starter' : 'Finisher')
                      : (age <= 6 ? 'Starter' : age <= 18 ? 'Grower' : 'Layer');
                    
                    const recommendedFeeds = feedInventory.filter(feed => 
                      feed.type.toLowerCase().includes(currentStage.toLowerCase()) && feed.quantity > 0
                    );

                    const dailyConsumption = selectedBatch.breed === 'Broiler' 
                      ? (age <= 4 ? 50 : 120) // grams per bird per day
                      : (age <= 6 ? 40 : age <= 18 ? 80 : 110);
                    
                    const weeklyNeed = (dailyConsumption * selectedBatch.currentCount * 7) / 1000; // kg per week

                    return recommendedFeeds.length > 0 ? recommendedFeeds.map(feed => (
                      <div key={feed.id} className="recommendation-card optimal">
                        <div className="card-header">
                          <span className="feed-name">{feed.brand} {feed.type}</span>
                          <span className="match-score">98% Match</span>
                        </div>
                        <div className="card-details">
                          <div className="detail-row">
                            <span>Available:</span>
                            <span>{feed.quantity} bags</span>
                          </div>
                          <div className="detail-row">
                            <span>Weekly Need:</span>
                            <span>{weeklyNeed.toFixed(1)} kg ({Math.ceil(weeklyNeed / 25)} bags)</span>
                          </div>
                          <div className="detail-row">
                            <span>Duration:</span>
                            <span>{Math.floor((feed.quantity * 25) / weeklyNeed)} weeks</span>
                          </div>
                          <div className="detail-row">
                            <span>Expiry:</span>
                            <span className={new Date(feed.expiry_date) < new Date(Date.now() + 30*24*60*60*1000) ? 'expiring' : 'good'}>
                              {new Date(feed.expiry_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button 
                          className="assign-btn optimal"
                          onClick={() => {
                            // Auto-assign optimal amount
                            const optimalBags = Math.min(Math.ceil(weeklyNeed / 25) * 2, feed.quantity); // 2 weeks supply
                            setFormData({
                              feedId: feed.id,
                              quantity: optimalBags,
                              notes: `Auto-assigned ${optimalBags} bags for 2-week supply`
                            });
                          }}
                        >
                          Auto-Assign Optimal
                        </button>
                      </div>
                    )) : (
                      <div className="recommendation-card warning">
                        <div className="card-header">
                          <span className="feed-name">⚠️ No Optimal Feed Available</span>
                        </div>
                        <div className="card-details">
                          <p>Recommended: {currentStage} feed for {selectedBatch.breed}</p>
                          <p>Consider purchasing {currentStage} feed or using alternative feeds below.</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Portion Calculator */}
              <div className="calculator-panel">
                <h3>📊 Portion Calculator</h3>
                <div className="calculator-grid">
                  <div className="calc-input">
                    <label>Duration (weeks):</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="12" 
                      defaultValue="2"
                      onChange={(e) => {
                        const weeks = parseInt(e.target.value) || 2;
                        const age = Math.floor((new Date() - new Date(selectedBatch.hatch_date)) / (1000 * 60 * 60 * 24 * 7));
                        const dailyConsumption = selectedBatch.breed === 'Broiler' 
                          ? (age <= 4 ? 50 : 120)
                          : (age <= 6 ? 40 : age <= 18 ? 80 : 110);
                        const totalKg = (dailyConsumption * selectedBatch.currentCount * weeks * 7) / 1000;
                        const bags = Math.ceil(totalKg / 25);
                        
                        document.getElementById('calc-result').innerHTML = `
                          <strong>${totalKg.toFixed(1)} kg</strong> (${bags} bags needed)
                        `;
                      }}
                    />
                  </div>
                  <div className="calc-result" id="calc-result">
                    <strong>350.0 kg</strong> (14 bags needed)
                  </div>
                </div>
              </div>

              {/* Manual Feed Selection */}
              <div className="manual-selection-panel">
                <h3>Manual Feed Selection</h3>
                <div className="feed-selection-grid">
                  {feedInventory.filter(feed => feed.quantity > 0).map(feed => (
                    <div 
                      key={feed.id} 
                      className={`feed-option ${formData.feedId === feed.id ? 'selected' : ''}`}
                      onClick={() => setFormData({...formData, feedId: feed.id})}
                    >
                      <div className="feed-header">
                        <span className="feed-name">{feed.brand} {feed.type}</span>
                        <span className="quantity">{feed.quantity} bags</span>
                      </div>
                      <div className="feed-details">
                        <span className="expiry">Exp: {new Date(feed.expiry_date).toLocaleDateString()}</span>
                        <span className={`status ${new Date(feed.expiry_date) < new Date(Date.now() + 30*24*60*60*1000) ? 'warning' : 'good'}`}>
                          {new Date(feed.expiry_date) < new Date(Date.now() + 30*24*60*60*1000) ? 'Expiring Soon' : 'Good'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {formData.feedId && (
                  <div className="allocation-form">
                    <div className="form-row">
                      <label>Bags to Assign:</label>
                      <input 
                        type="number" 
                        min="1" 
                        max={feedInventory.find(f => f.id === formData.feedId)?.quantity || 1}
                        value={formData.quantity || 1}
                        onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="form-row">
                      <label>Notes:</label>
                      <textarea 
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder="Optional notes about this allocation..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary"
                disabled={!formData.feedId || !formData.quantity}
                onClick={() => {
                  // Handle feed assignment
                  console.log('Assigning feed:', formData, 'to batch:', selectedBatch);
                  closeModal();
                }}
              >
                Assign Feed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedFeedManagement