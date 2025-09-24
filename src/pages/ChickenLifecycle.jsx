import { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { formatDate, formatNumber } from '../utils/formatters'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import './ChickenLifecycle.css'

const ChickenLifecycle = () => {
  const { liveChickens, updateLiveChicken, chickenInventoryTransactions, weightHistory, feedConsumption } = useAppContext()
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [lifecycleData, setLifecycleData] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [formData, setFormData] = useState({})

  // Lifecycle stages
  const lifecycleStages = [
    { id: 'arrival', name: 'DOC Arrival', icon: '🐣', description: 'Day-old chicks arrival' },
    { id: 'brooding', name: 'Brooding', icon: '🏠', description: '0-4 weeks care' },
    { id: 'growing', name: 'Growing', icon: '🌿', description: '4-6 weeks growth' },
    { id: 'processing', name: 'Processing', icon: '🔪', description: 'Ready for processing' },
    { id: 'freezer', name: 'Freezer Storage', icon: '❄️', description: 'Stored as dressed chicken' }
  ]

  // Get current stage for a batch
  const getCurrentStage = (batch) => {
    if (!batch) return 'arrival'
    return batch.lifecycle_stage || 'arrival'
  }

  // Get stage index
  const getStageIndex = (stageId) => {
    return lifecycleStages.findIndex(stage => stage.id === stageId)
  }

  // Check if stage is completed
  const isStageCompleted = (batch, stageId) => {
    const currentStageIndex = getStageIndex(getCurrentStage(batch))
    const stageIndex = getStageIndex(stageId)
    return stageIndex < currentStageIndex
  }

  // Check if stage is current
  const isStageCurrent = (batch, stageId) => {
    return getCurrentStage(batch) === stageId
  }

  // Move to next stage
  const moveToNextStage = async (batch) => {
    const currentStageIndex = getStageIndex(getCurrentStage(batch))
    if (currentStageIndex < lifecycleStages.length - 1) {
      const nextStage = lifecycleStages[currentStageIndex + 1]
      try {
        await updateLiveChicken(batch.id, { 
          ...batch, 
          lifecycle_stage: nextStage.id,
          [`stage_${nextStage.id}_date`]: new Date().toISOString().split('T')[0]
        })
      } catch (error) {
        console.error('Error updating lifecycle stage:', error)
      }
    }
  }

  // Open modal for stage actions
  const openModal = (type, batch) => {
    setSelectedBatch(batch)
    setModalType(type)
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (modalType === 'mortality') {
        // Handle mortality recording
        const mortalityCount = parseInt(formData.mortality_count) || 0
        if (mortalityCount > 0) {
          const updatedBatch = {
            ...selectedBatch,
            mortality: (selectedBatch.mortality || 0) + mortalityCount,
            current_count: selectedBatch.current_count - mortalityCount
          }
          await updateLiveChicken(selectedBatch.id, updatedBatch)
        }
      } else if (modalType === 'weight') {
        // Handle weight recording
        const weight = parseFloat(formData.weight) || 0
        const updatedBatch = {
          ...selectedBatch,
          current_weight: weight,
          weight_notes: formData.weight_notes || '' // Pass notes for weight history
        }
        await updateLiveChicken(selectedBatch.id, updatedBatch)
      }
      
      closeModal()
    } catch (error) {
      console.error('Error updating batch:', error)
    }
  }

  // Get batch transactions
  const getBatchTransactions = (batchId) => {
    return chickenInventoryTransactions.filter(tx => tx.batch_id === batchId)
  }

  // Calculate batch age
  const calculateAge = (hatchDate) => {
    const today = new Date()
    const hatch = new Date(hatchDate)
    const diffTime = Math.abs(today - hatch)
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  // Calculate feed conversion ratio (FCR)
  const calculateFCR = (batchId) => {
    const batchConsumption = feedConsumption.filter(item => item.chicken_batch_id === batchId)
    const batch = liveChickens.find(b => b.id === batchId)
    
    if (!batch || batchConsumption.length === 0) return 'N/A'
    
    const totalFeedConsumed = batchConsumption.reduce((sum, item) => sum + item.quantity_consumed, 0)
    const avgWeight = batch.current_weight || 1
    const fcr = totalFeedConsumed / (batch.initial_count * avgWeight)
    
    return isNaN(fcr) ? 'N/A' : fcr.toFixed(2)
  }

  return (
    <div className="chicken-lifecycle-container">
      <div className="page-header">
        <h1>Chicken Lifecycle Tracking</h1>
        <p>Track each batch through its complete lifecycle from DOC arrival to processing</p>
      </div>

      {liveChickens.length === 0 ? (
        <div className="no-batches">
          <h3>No chicken batches found</h3>
          <p>Add your first batch to start tracking the lifecycle</p>
        </div>
      ) : (
        <div className="batches-grid">
          {liveChickens.map(batch => (
            <div key={batch.id} className="batch-card">
              <div className="batch-header">
                <h3>{batch.batch_id}</h3>
                <span className={`status-badge ${batch.status}`}>{batch.status}</span>
              </div>
              
              <div className="batch-info">
                <p><strong>Breed:</strong> {batch.breed}</p>
                <p><strong>Age:</strong> {calculateAge(batch.hatch_date)} days</p>
                <p><strong>Count:</strong> {formatNumber(batch.current_count)}/{formatNumber(batch.initial_count)}</p>
                <p><strong>Mortality:</strong> {formatNumber(batch.mortality || 0)} ({((batch.mortality || 0) / batch.initial_count * 100).toFixed(1)}%)</p>
              </div>
              
              <div className="lifecycle-tracker">
                {lifecycleStages.map((stage, index) => {
                  const isCompleted = isStageCompleted(batch, stage.id)
                  const isCurrent = isStageCurrent(batch, stage.id)
                  
                  return (
                    <div 
                      key={stage.id} 
                      className={`stage ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      <div className="stage-icon">
                        {stage.icon}
                        {isCompleted && <span className="checkmark">✓</span>}
                      </div>
                      <div className="stage-name">{stage.name}</div>
                      {isCurrent && (
                        <button 
                          className="btn-next-stage"
                          onClick={() => moveToNextStage(batch)}
                          disabled={index === lifecycleStages.length - 1}
                        >
                          Next Stage
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* Tab-based interface for weight recording and history */}
              <div className="weight-tabs">
                <div className="tab-buttons">
                  <button 
                    className={`tab-button ${modalType === 'weight' ? 'active' : ''}`}
                    onClick={() => openModal('weight', batch)}
                  >
                    Record Weight
                  </button>
                  <button 
                    className={`tab-button ${modalType === 'weight-history' ? 'active' : ''}`}
                    onClick={() => openModal('weight-history', batch)}
                  >
                    Weight History
                  </button>
                </div>
              </div>
              
              <div className="batch-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => openModal('mortality', batch)}
                >
                  Record Mortality
                </button>
              </div>
              
              <div className="batch-transactions">
                <h4>Recent Transactions</h4>
                {getBatchTransactions(batch.id).slice(0, 3).map(tx => (
                  <div key={tx.id} className="transaction-item">
                    <span className={`tx-type ${tx.transaction_type}`}>
                      {tx.transaction_type}
                    </span>
                    <span className="tx-quantity">{tx.quantity_changed > 0 ? '+' : ''}{formatNumber(tx.quantity_changed)}</span>
                    <span className="tx-date">{formatDate(tx.created_at)}</span>
                  </div>
                ))}
                {getBatchTransactions(batch.id).length === 0 && (
                  <p className="no-transactions">No transactions recorded</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for recording mortality */}
      {showModal && modalType === 'mortality' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Record Mortality - {selectedBatch?.batch_id}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="mortality_count">Number of Deaths</label>
                <input
                  type="number"
                  id="mortality_count"
                  name="mortality_count"
                  value={formData.mortality_count || ''}
                  onChange={handleInputChange}
                  min="0"
                  max={selectedBatch?.current_count}
                  required
                />
                <small>Current count: {selectedBatch?.current_count}</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="mortality_notes">Notes (Optional)</label>
                <textarea
                  id="mortality_notes"
                  name="mortality_notes"
                  value={formData.mortality_notes || ''}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Reason for mortality, observations, etc."
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Record Mortality
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for recording weight */}
      {showModal && modalType === 'weight' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Record Weight - {selectedBatch?.batch_id}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="weight">Current Weight (kg)</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
                <small>Previous weight: {selectedBatch?.current_weight || 'Not recorded'} kg</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="weight_notes">Notes (Optional)</label>
                <textarea
                  id="weight_notes"
                  name="weight_notes"
                  value={formData.weight_notes || ''}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Observations, feed type, etc."
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Record Weight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal for weight history */}
      {showModal && modalType === 'weight-history' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Weight History - {selectedBatch?.batch_id}</h2>
            <div className="weight-history-content">
              {(() => {
                // Ensure weightHistory is an array before filtering
                const safeWeightHistory = Array.isArray(weightHistory) ? weightHistory : [];

                // Get weight history from database for this batch
                const batchWeightHistory = safeWeightHistory
                  .filter(record => record.chicken_batch_id === selectedBatch?.id)
                  .sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date));

                // Create combined history including current weight if it exists
                let combinedHistory = [...batchWeightHistory];

                // Add current weight to history if it exists and is not already in history
                if (selectedBatch?.current_weight && selectedBatch.current_weight > 0) {
                  const currentDate = new Date().toISOString().split('T')[0];
                  const currentWeightExists = batchWeightHistory.some(
                    record => Math.abs(record.weight - selectedBatch.current_weight) < 0.01 && record.recorded_date === currentDate
                  );

                  if (!currentWeightExists) {
                    combinedHistory.push({
                      id: 'current',
                      chicken_batch_id: selectedBatch.id,
                      weight: selectedBatch.current_weight,
                      recorded_date: currentDate,
                      notes: 'Current weight',
                      created_at: new Date().toISOString()
                    });
                  }
                }

                // Sort combined history by date (oldest first for proper chronological order)
                combinedHistory.sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date));
                
                // Prepare data for chart
                const chartData = combinedHistory.map(record => ({
                  date: formatDate(record.recorded_date),
                  weight: parseFloat(record.weight)
                }));
                
                // Calculate batch age and FCR
                const batchAge = selectedBatch ? calculateAge(selectedBatch.hatch_date) : 'N/A';
                const fcr = selectedBatch ? calculateFCR(selectedBatch.id) : 'N/A';
                
                return (
                  <>
                    {/* Batch info */}
                    <div className="batch-info-summary">
                      <div className="info-item">
                        <strong>Age:</strong> {batchAge} days
                      </div>
                      <div className="info-item">
                        <strong>FCR:</strong> {fcr}
                      </div>
                    </div>
                    
                    {/* Chart view */}
                    <div className="weight-chart-container">
                      <h3>Weight Progression Chart</h3>
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value) => [`${value} kg`, 'Weight']}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="weight" 
                              name="Weight (kg)" 
                              stroke="#8884d8" 
                              activeDot={{ r: 8 }} 
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <p>No chart data available.</p>
                      )}
                    </div>
                    
                    {/* Table view */}
                    <div className="weight-history-table">
                      <h3>Weight History Records</h3>
                      {combinedHistory.length > 0 ? (
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Age (days)</th>
                              <th>Weight (kg)</th>
                              <th>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {combinedHistory
                              .slice()
                              .reverse() // Show newest first - most recent weight at top
                              .map(record => {
                                // Calculate age at the time of recording
                                const recordingDate = new Date(record.recorded_date);
                                const hatchDate = selectedBatch ? new Date(selectedBatch.hatch_date) : recordingDate;
                                const ageAtRecording = Math.floor((recordingDate - hatchDate) / (1000 * 60 * 60 * 24));

                                return (
                                  <tr key={record.id}>
                                    <td>{formatDate(record.recorded_date)}</td>
                                    <td>{ageAtRecording >= 0 ? ageAtRecording : 'N/A'}</td>
                                    <td>{formatNumber(record.weight, 2)}</td>
                                    <td>{record.notes || 'No notes'}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      ) : (
                        <p>No weight history recorded for this batch.</p>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChickenLifecycle