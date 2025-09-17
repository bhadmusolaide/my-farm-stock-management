import { useState, useEffect, useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { formatNumber, formatDate } from '../utils/formatters'
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
    addFeedInventory, 
    addFeedConsumption 
  } = useAppContext()
  
  const [activeTab, setActiveTab] = useState('plans')
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
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

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

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="analytics-section">
          <h2>Feed Analytics</h2>
          
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Feed Stock</h3>
              <p className="summary-value">{formatNumber(feedInventory.reduce((sum, item) => sum + item.quantity_kg, 0))} kg</p>
            </div>
            <div className="summary-card">
              <h3>Active Batches</h3>
              <p className="summary-value">{liveChickens.length}</p>
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
            </div>
          </div>

          <div className="analytics-grid">
            {filteredBatches.map(batch => (
              <div key={batch.id} className="analytics-card">
                <h3>{batch.batch_id}</h3>
                <div className="metric">
                  <span className="label">Feed Conversion Ratio</span>
                  <span className="value">{calculateFCR(batch.id)}:1</span>
                </div>
                <div className="metric">
                  <span className="label">Estimated Wastage</span>
                  <span className="value">{calculateWastage(batch.id)}%</span>
                </div>
                <div className="metric">
                  <span className="label">Current Stage</span>
                  <span className="value">{getCurrentFeedStage(batch).stage}</span>
                </div>
              </div>
            ))}
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
    </div>
  )
}

export default EnhancedFeedManagement