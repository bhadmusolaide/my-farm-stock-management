import React, { useState, useEffect } from 'react';
import { EnhancedModal } from '../UI';
import { formatNumber } from '../../utils/formatters';
import './FeedManagement.css';

const FeedConsumptionForm = ({
  isOpen,
  onClose,
  onSubmit,
  feedInventory = [],
  liveChickens = [],
  loading = false
}) => {
  const [formData, setFormData] = useState({
    feed_id: '',
    quantity_consumed: '',
    chicken_batch_id: '',
    consumption_date: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        feed_id: '',
        quantity_consumed: '',
        chicken_batch_id: '',
        consumption_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.feed_id) {
      newErrors.feed_id = 'Feed selection is required';
    }

    if (!formData.quantity_consumed || parseFloat(formData.quantity_consumed) <= 0) {
      newErrors.quantity_consumed = 'Quantity consumed must be greater than 0';
    }

    if (!formData.chicken_batch_id) {
      newErrors.chicken_batch_id = 'Chicken batch selection is required';
    }

    if (!formData.consumption_date) {
      newErrors.consumption_date = 'Consumption date is required';
    }

    // Validate quantity against available feed
    if (formData.feed_id && formData.quantity_consumed) {
      const selectedFeed = feedInventory.find(feed => feed.id === formData.feed_id);
      const quantityConsumed = parseFloat(formData.quantity_consumed);
      
      if (selectedFeed && quantityConsumed > selectedFeed.quantity_kg) {
        newErrors.quantity_consumed = `Quantity cannot exceed available stock (${formatNumber(selectedFeed.quantity_kg, 2)} kg)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const consumptionData = {
      feed_id: formData.feed_id,
      quantity_consumed: parseFloat(formData.quantity_consumed),
      chicken_batch_id: formData.chicken_batch_id,
      consumption_date: formData.consumption_date,
      notes: formData.notes.trim()
    };

    try {
      await onSubmit(consumptionData);
      onClose();
    } catch (error) {
      console.error('Failed to log consumption:', error);
      setErrors({ submit: 'Failed to log consumption. Please try again.' });
    }
  };

  // Get available feed (with stock > 0)
  const availableFeed = feedInventory.filter(feed => feed.quantity_kg > 0);

  // Get active chicken batches
  const activeChickenBatches = liveChickens.filter(
    batch => batch.status === 'healthy' || batch.status === 'sick'
  );

  // Get selected feed details
  const selectedFeed = feedInventory.find(feed => feed.id === formData.feed_id);

  // Calculate consumption analysis
  const selectedBatch = liveChickens.find(batch => batch.id === formData.chicken_batch_id);
  const quantityConsumed = parseFloat(formData.quantity_consumed) || 0;
  const birdCount = selectedBatch?.current_count || 0;
  const fcrPerBird = birdCount > 0 ? quantityConsumed / birdCount : 0;

  // Calculate cost
  let costAnalysis = null;
  if (selectedFeed && quantityConsumed > 0) {
    // Use cost_per_kg if available, otherwise calculate it
    const costPerKg = selectedFeed.cost_per_kg ||
      (selectedFeed.cost_per_bag * selectedFeed.number_of_bags) / selectedFeed.quantity_kg;
    const totalCost = costPerKg * quantityConsumed;
    costAnalysis = { costPerKg, totalCost };
  }

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Feed Consumption"
      size="medium"
      loading={loading}
      error={errors.submit}
    >
      <form onSubmit={handleSubmit} className="consumption-form">
        {/* Feed Selection */}
        <div className="form-section">
          <h4>Feed Information</h4>
          <div className="form-group">
            <label htmlFor="feed_id">
              Feed Type <span className="required">*</span>
            </label>
            <select
              id="feed_id"
              name="feed_id"
              value={formData.feed_id}
              onChange={handleInputChange}
              className={errors.feed_id ? 'error' : ''}
            >
              <option value="">Select feed</option>
              {availableFeed.length > 0 ? (
                availableFeed.map(feed => (
                  <option key={feed.id} value={feed.id}>
                    {feed.feed_type} - {feed.brand} ({formatNumber(feed.quantity_kg, 2)} kg available)
                  </option>
                ))
              ) : (
                <option disabled>No feed inventory available</option>
              )}
            </select>
            {errors.feed_id && <span className="error-message">{errors.feed_id}</span>}
          </div>

          {selectedFeed && (
            <div className="feed-details-card">
              <h5>Selected Feed Details</h5>
              <div className="feed-info-grid">
                <div className="info-item">
                  <label>Batch:</label>
                  <span>{selectedFeed.batch_number || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Type:</label>
                  <span>{selectedFeed.feed_type}</span>
                </div>
                <div className="info-item">
                  <label>Brand:</label>
                  <span>{selectedFeed.brand}</span>
                </div>
                <div className="info-item">
                  <label>Available:</label>
                  <span>{formatNumber(selectedFeed.quantity_kg, 2)} kg</span>
                </div>
                <div className="info-item">
                  <label>Cost/kg:</label>
                  <span>₦{formatNumber(
                    selectedFeed.cost_per_kg ||
                    (selectedFeed.cost_per_bag * selectedFeed.number_of_bags) / selectedFeed.quantity_kg,
                    2
                  )}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chicken Batch Selection */}
        <div className="form-section">
          <h4>Chicken Batch</h4>
          <div className="form-group">
            <label htmlFor="chicken_batch_id">
              Chicken Batch <span className="required">*</span>
            </label>
            <select
              id="chicken_batch_id"
              name="chicken_batch_id"
              value={formData.chicken_batch_id}
              onChange={handleInputChange}
              className={errors.chicken_batch_id ? 'error' : ''}
            >
              <option value="">Select chicken batch</option>
              {activeChickenBatches.length > 0 ? (
                activeChickenBatches.map(batch => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batch_id} - {batch.breed} ({batch.current_count} birds, {batch.status})
                  </option>
                ))
              ) : (
                <option disabled>No active chicken batches available</option>
              )}
            </select>
            {errors.chicken_batch_id && <span className="error-message">{errors.chicken_batch_id}</span>}
          </div>

          {selectedBatch && (
            <div className="batch-details-card">
              <h5>Selected Batch Details</h5>
              <div className="batch-info-grid">
                <div className="info-item">
                  <label>Batch ID:</label>
                  <span>{selectedBatch.batch_id}</span>
                </div>
                <div className="info-item">
                  <label>Breed:</label>
                  <span>{selectedBatch.breed}</span>
                </div>
                <div className="info-item">
                  <label>Bird Count:</label>
                  <span>{selectedBatch.current_count} birds</span>
                </div>
                <div className="info-item">
                  <label>Status:</label>
                  <span className={`status-badge status-${selectedBatch.status}`}>
                    {selectedBatch.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Consumption Details */}
        <div className="form-section">
          <h4>Consumption Details</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity_consumed">
                Quantity Consumed (kg) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="quantity_consumed"
                name="quantity_consumed"
                value={formData.quantity_consumed}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className={errors.quantity_consumed ? 'error' : ''}
              />
              {errors.quantity_consumed && <span className="error-message">{errors.quantity_consumed}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="consumption_date">
                Consumption Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="consumption_date"
                name="consumption_date"
                value={formData.consumption_date}
                onChange={handleInputChange}
                className={errors.consumption_date ? 'error' : ''}
              />
              {errors.consumption_date && <span className="error-message">{errors.consumption_date}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Optional notes about this feeding"
              rows="3"
            />
          </div>
        </div>

        {/* Consumption Analysis */}
        {(fcrPerBird > 0 || costAnalysis) && (
          <div className="form-section">
            <h4>Consumption Analysis</h4>
            <div className="analysis-cards">
              {fcrPerBird > 0 && (
                <div className="analysis-card">
                  <div className="analysis-icon">🎯</div>
                  <div className="analysis-content">
                    <h5>Feed Conversion Ratio</h5>
                    <p className="analysis-value">{formatNumber(fcrPerBird, 3)} kg/bird</p>
                    <small>Based on {birdCount} birds</small>
                  </div>
                </div>
              )}

              {costAnalysis && (
                <div className="analysis-card">
                  <div className="analysis-icon">💰</div>
                  <div className="analysis-content">
                    <h5>Cost Analysis</h5>
                    <p className="analysis-value">₦{formatNumber(costAnalysis.totalCost, 2)}</p>
                    <small>₦{formatNumber(costAnalysis.costPerKg, 2)}/kg</small>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || availableFeed.length === 0 || activeChickenBatches.length === 0}
          >
            {loading ? 'Logging...' : 'Log Consumption'}
          </button>
        </div>

        {/* Warnings */}
        {availableFeed.length === 0 && (
          <div className="warning-message">
            ⚠️ No feed inventory available. Please add feed stock first.
          </div>
        )}

        {activeChickenBatches.length === 0 && (
          <div className="warning-message">
            ⚠️ No active chicken batches available for feeding.
          </div>
        )}
      </form>
    </EnhancedModal>
  );
};

export default FeedConsumptionForm;
