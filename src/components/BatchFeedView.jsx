import React, { useMemo } from 'react'
import './BatchFeedView.css'

const BatchFeedView = ({ 
  liveChickens, 
  feedInventory, 
  feedConsumption, 
  feedBatchAssignments,
  onAssignFeed,
  onViewDetails 
}) => {
  // Feed plans for different breeds
  const feedPlans = {
    'Broiler': [
      { 
        stage: 'Starter', 
        feedType: 'Starter', 
        duration: '0-4 weeks', 
        bagsPerBatch: 2,
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

  // Calculate days remaining in current stage
  const getDaysRemainingInStage = (batch) => {
    const ageInWeeks = calculateAgeInWeeks(batch.hatch_date)
    const plan = feedPlans[batch.breed] || feedPlans['Broiler']
    
    if (batch.breed === 'Broiler') {
      if (ageInWeeks <= 4) {
        return (4 - ageInWeeks) * 7 // Days until finisher stage
      } else {
        return (6 - ageInWeeks) * 7 // Days until processing
      }
    } else { // Layer
      if (ageInWeeks <= 6) {
        return (6 - ageInWeeks) * 7 // Days until grower stage
      } else if (ageInWeeks <= 18) {
        return (18 - ageInWeeks) * 7 // Days until layer stage
      } else {
        return 0 // Already in layer stage
      }
    }
  }

  // Get current feed stage for a batch
  const getCurrentFeedStage = (batch) => {
    const age = calculateAgeInWeeks(batch.hatch_date)
    const plan = feedPlans[batch.breed] || feedPlans['Broiler']
    
    if (batch.breed === 'Broiler') {
      return age <= 4 ? plan[0] : plan[1] // Starter or Finisher
    } else { // Layer
      if (age <= 6) return plan[0] // Starter
      if (age <= 18) return plan[1] // Grower
      return plan[2] // Layer
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

  // Get assigned feeds for a batch
  const getAssignedFeeds = (batchId) => {
    const assignments = feedBatchAssignments.filter(assignment => 
      assignment.chicken_batch_id === batchId
    )
    
    return assignments.map(assignment => {
      const feed = feedInventory.find(f => f.id === assignment.feed_id)
      return {
        ...assignment,
        feed: feed
      }
    }).filter(item => item.feed)
  }

  // Get feed status for a batch
  const getFeedStatus = (batch) => {
    const currentStage = getCurrentFeedStage(batch)
    const assignedFeeds = getAssignedFeeds(batch.id)
    const correctFeed = assignedFeeds.find(af => af.feed.feed_type === currentStage.feedType)
    
    if (!correctFeed) return 'no-feed'
    if (correctFeed.assigned_quantity_kg < 10) return 'low-stock'
    if (new Date(correctFeed.feed.expiry_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) return 'expiring'
    return 'good'
  }

  // Process batches with feed information
  const batchesWithFeedInfo = useMemo(() => {
    return liveChickens
      .filter(batch => batch.status === 'healthy' || batch.status === 'sick')
      .map(batch => {
        const currentStage = getCurrentFeedStage(batch)
        const assignedFeeds = getAssignedFeeds(batch.id)
        const fcr = calculateFCR(batch.id)
        const daysRemaining = getDaysRemainingInStage(batch)
        const feedStatus = getFeedStatus(batch)
        const ageInWeeks = calculateAgeInWeeks(batch.hatch_date)

        return {
          ...batch,
          currentStage,
          assignedFeeds,
          fcr,
          daysRemaining,
          feedStatus,
          ageInWeeks
        }
      })
      .sort((a, b) => a.batch_id.localeCompare(b.batch_id))
  }, [liveChickens, feedInventory, feedConsumption, feedBatchAssignments])

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return '#10b981'
      case 'low-stock': return '#f59e0b'
      case 'expiring': return '#ef4444'
      case 'no-feed': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'good': return 'Well Fed'
      case 'low-stock': return 'Low Stock'
      case 'expiring': return 'Feed Expiring'
      case 'no-feed': return 'No Feed Assigned'
      default: return 'Unknown'
    }
  }

  if (batchesWithFeedInfo.length === 0) {
    return (
      <div className="batch-feed-view">
        <div className="empty-state">
          <h3>No Active Batches</h3>
          <p>No healthy or sick batches found. Add some live chickens to see batch feed information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="batch-feed-view">
      <div className="batch-feed-header">
        <h2>Batch Feed Management</h2>
        <p>Monitor feed assignments, stages, and efficiency for all active batches</p>
      </div>

      {/* Visual Feed Assignment Matrix */}
      <div className="feed-assignment-matrix">
        <div className="matrix-header">
          <h3>Feed Assignment Overview</h3>
          <div className="status-legend">
            <div className="legend-item">
              <div className="legend-color good"></div>
              <span>Well Fed</span>
            </div>
            <div className="legend-item">
              <div className="legend-color low-stock"></div>
              <span>Low Stock</span>
            </div>
            <div className="legend-item">
              <div className="legend-color expiring"></div>
              <span>Feed Expiring</span>
            </div>
            <div className="legend-item">
              <div className="legend-color no-feed"></div>
              <span>No Feed</span>
            </div>
          </div>
        </div>
        
        <div className="matrix-grid">
          {batchesWithFeedInfo.map(batch => (
            <div 
              key={batch.id} 
              className={`matrix-cell ${batch.feedStatus}`}
              onClick={() => onViewDetails && onViewDetails(batch)}
              title={`${batch.batch_id} - ${batch.breed} - ${getStatusText(batch.feedStatus)}`}
            >
              <div className="cell-header">
                <span className="batch-id">{batch.batch_id}</span>
                <span className="breed-indicator">{batch.breed.charAt(0)}</span>
              </div>
              <div className="cell-content">
                <div className="stage-info">
                  <span className="stage">{batch.currentStage.stage}</span>
                  <span className="age">{batch.ageInWeeks}w</span>
                </div>
                <div className="feed-info">
                  <span className="bird-count">{batch.current_count || batch.initial_count}</span>
                  <span className="fcr">FCR: {batch.fcr}</span>
                </div>
              </div>
              <div className="status-bar" style={{ backgroundColor: getStatusColor(batch.feedStatus) }}></div>
            </div>
          ))}
        </div>
      </div>

      <div className="batch-cards-grid">
        {batchesWithFeedInfo.map(batch => (
          <div key={batch.id} className={`batch-card ${batch.feedStatus}`}>
            <div className="batch-card-header">
              <div className="batch-info">
                <h3>{batch.batch_id}</h3>
                <span className="breed-badge">{batch.breed}</span>
              </div>
              <div 
                className="feed-status-indicator"
                style={{ backgroundColor: getStatusColor(batch.feedStatus) }}
                title={getStatusText(batch.feedStatus)}
              >
                {getStatusText(batch.feedStatus)}
              </div>
            </div>

            <div className="batch-metrics">
              <div className="metric">
                <span className="metric-label">Birds</span>
                <span className="metric-value">{batch.current_count || batch.initial_count}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Age</span>
                <span className="metric-value">{batch.ageInWeeks}w</span>
              </div>
              <div className="metric">
                <span className="metric-label">FCR</span>
                <span className="metric-value">{batch.fcr}</span>
              </div>
            </div>

            <div className="current-stage">
              <h4>Current Stage: {batch.currentStage.stage}</h4>
              <p>{batch.currentStage.description}</p>
              <div className="stage-timeline">
                <span className="duration">{batch.currentStage.duration}</span>
                {batch.daysRemaining > 0 && (
                  <span className="days-remaining">{batch.daysRemaining} days remaining</span>
                )}
              </div>
            </div>

            <div className="assigned-feeds">
              <h4>Assigned Feeds</h4>
              {batch.assignedFeeds.length > 0 ? (
                <div className="feed-list">
                  {batch.assignedFeeds.map(assignment => (
                    <div key={assignment.id} className="feed-item">
                      <div className="feed-details">
                        <span className="feed-type">{assignment.feed.feed_type}</span>
                        <span className="feed-brand">{assignment.feed.brand}</span>
                      </div>
                      <div className="feed-quantity">
                        <span>{assignment.assigned_quantity_kg}kg</span>
                        {new Date(assignment.feed.expiry_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                          <span className="expiry-warning">Expires Soon</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-feeds">
                  <p>No feeds assigned</p>
                  <button 
                    className="assign-feed-btn"
                    onClick={() => onAssignFeed && onAssignFeed(batch)}
                  >
                    Assign Feed
                  </button>
                </div>
              )}
            </div>

            <div className="batch-actions">
              <button 
                className="btn-secondary"
                onClick={() => onViewDetails && onViewDetails(batch)}
              >
                View Details
              </button>
              <button 
                className="btn-primary"
                onClick={() => onAssignFeed && onAssignFeed(batch)}
              >
                Manage Feed
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BatchFeedView