import React, { useState, useEffect } from 'react';
import { EnhancedModal } from '../UI';
import { formatWeight } from '../../utils/formatters';
import './DressedChicken.css';

const ProcessingForm = ({
  isOpen,
  onClose,
  onSubmit,
  liveChickens = [],
  chickenSizeCategories = [],
  loading = false
}) => {
  const [formData, setFormData] = useState({
    selectedBatch: '',
    processingDate: new Date().toISOString().split('T')[0],
    sizeCategoryId: '',
    sizeCategoryCustom: '',
    processingQuantity: '',
    storageLocation: '',
    expiryDate: '',
    notes: '',
    createNewBatchForRemaining: false,
    remainingBatchId: '',
    // Parts data
    neckCount: '',
    neckWeight: '',
    feetCount: '',
    feetWeight: '',
    gizzardCount: '',
    gizzardWeight: '',
    dogFoodCount: '',
    dogFoodWeight: ''
  });

  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        selectedBatch: '',
        processingDate: new Date().toISOString().split('T')[0],
        sizeCategoryId: '',
        sizeCategoryCustom: '',
        processingQuantity: '',
        storageLocation: '',
        expiryDate: '',
        notes: '',
        createNewBatchForRemaining: false,
        remainingBatchId: '',
        neckCount: '',
        neckWeight: '',
        feetCount: '',
        feetWeight: '',
        gizzardCount: '',
        gizzardWeight: '',
        dogFoodCount: '',
        dogFoodWeight: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  // Calculate default expiry date (3 months from processing date)
  const calculateDefaultExpiryDate = (processingDateStr) => {
    const date = new Date(processingDateStr);
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split('T')[0];
  };

  // Update expiry date when processing date changes
  useEffect(() => {
    if (formData.processingDate && !formData.expiryDate) {
      setFormData(prev => ({
        ...prev,
        expiryDate: calculateDefaultExpiryDate(prev.processingDate)
      }));
    }
  }, [formData.processingDate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

    if (!formData.selectedBatch) {
      newErrors.selectedBatch = 'Please select a live chicken batch';
    }

    if (!formData.sizeCategoryId) {
      newErrors.sizeCategoryId = 'Please select a size category';
    }

    if (formData.sizeCategoryId === 'custom' && !formData.sizeCategoryCustom.trim()) {
      newErrors.sizeCategoryCustom = 'Please enter a custom size name';
    }

    const selectedBatchData = liveChickens.find(batch => batch.id === formData.selectedBatch);
    const availableBirds = selectedBatchData?.current_count || 0;
    const quantityToProcess = parseInt(formData.processingQuantity) || 0;

    if (quantityToProcess <= 0) {
      newErrors.processingQuantity = 'Please enter a valid quantity to process (must be greater than 0)';
    }

    if (quantityToProcess > availableBirds) {
      newErrors.processingQuantity = `Cannot process more than ${availableBirds} birds (available in selected batch)`;
    }

    if (!formData.processingDate) {
      newErrors.processingDate = 'Processing date is required';
    }

    // Validate parts data if provided
    const partsFields = ['neck', 'feet', 'gizzard', 'dogFood'];
    partsFields.forEach(part => {
      const countField = `${part}Count`;
      const weightField = `${part}Weight`;
      
      const count = parseInt(formData[countField]) || 0;
      const weight = parseFloat(formData[weightField]) || 0;
      
      if (count > 0 && weight <= 0) {
        newErrors[weightField] = `Weight is required when count is provided for ${part}`;
      }
      
      if (weight > 0 && count <= 0) {
        newErrors[countField] = `Count is required when weight is provided for ${part}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const selectedBatchData = liveChickens.find(batch => batch.id === formData.selectedBatch);
    const quantityToProcess = parseInt(formData.processingQuantity);
    const remainingBirds = selectedBatchData.current_count - quantityToProcess;

    // Calculate average weight (placeholder - would need actual weight data)
    const averageWeight = selectedBatchData.current_weight || 2.5;

    // Prepare parts data
    const partsCount = {
      neck: parseInt(formData.neckCount) || 0,
      feet: parseInt(formData.feetCount) || 0,
      gizzard: parseInt(formData.gizzardCount) || 0,
      dog_food: parseInt(formData.dogFoodCount) || 0
    };

    const partsWeight = {
      neck: parseFloat(formData.neckWeight) || 0,
      feet: parseFloat(formData.feetWeight) || 0,
      gizzard: parseFloat(formData.gizzardWeight) || 0,
      dog_food: parseFloat(formData.dogFoodWeight) || 0
    };

    const processingData = {
      ...formData,
      quantityToProcess,
      remainingBirds,
      averageWeight,
      partsCount,
      partsWeight,
      selectedBatchData
    };

    try {
      await onSubmit(processingData);
      onClose();
    } catch (error) {
      console.error('Failed to process chickens:', error);
      setErrors({ submit: 'Failed to process chickens. Please try again.' });
    }
  };

  // Available batches (filter out completed and empty batches)
  const availableBatches = liveChickens.filter(
    batch => batch.status !== 'completed' && batch.current_count > 0
  );

  const selectedBatchData = liveChickens.find(batch => batch.id === formData.selectedBatch);

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Chicken Processing"
      size="large"
      loading={loading}
      error={errors.submit}
    >
      <form onSubmit={handleSubmit} className="processing-form">
        {/* Batch Selection */}
        <div className="form-group">
          <label htmlFor="selectedBatch">
            Live Chicken Batch <span className="required">*</span>
          </label>
          <select
            id="selectedBatch"
            name="selectedBatch"
            value={formData.selectedBatch}
            onChange={handleInputChange}
            className={errors.selectedBatch ? 'error' : ''}
          >
            <option value="">Select Live Chicken Batch</option>
            {availableBatches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.batch_id} ({batch.breed}) - {batch.current_count} birds available
              </option>
            ))}
          </select>
          {errors.selectedBatch && <span className="error-message">{errors.selectedBatch}</span>}
        </div>

        {/* Processing Details */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="processingDate">
              Processing Date <span className="required">*</span>
            </label>
            <input
              type="date"
              id="processingDate"
              name="processingDate"
              value={formData.processingDate}
              onChange={handleInputChange}
              className={errors.processingDate ? 'error' : ''}
            />
            {errors.processingDate && <span className="error-message">{errors.processingDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="processingQuantity">
              Quantity to Process <span className="required">*</span>
            </label>
            <input
              type="number"
              id="processingQuantity"
              name="processingQuantity"
              value={formData.processingQuantity}
              onChange={handleInputChange}
              min="1"
              max={selectedBatchData?.current_count || 999}
              placeholder="Number of birds"
              className={errors.processingQuantity ? 'error' : ''}
            />
            {errors.processingQuantity && <span className="error-message">{errors.processingQuantity}</span>}
            {selectedBatchData && (
              <small className="form-help">
                Available: {selectedBatchData.current_count} birds
              </small>
            )}
          </div>
        </div>

        {/* Size Category */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="sizeCategoryId">
              Size Category <span className="required">*</span>
            </label>
            <select
              id="sizeCategoryId"
              name="sizeCategoryId"
              value={formData.sizeCategoryId}
              onChange={handleInputChange}
              className={errors.sizeCategoryId ? 'error' : ''}
            >
              <option value="">Select Size Category</option>
              {chickenSizeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({formatWeight(category.min_weight)} - {formatWeight(category.max_weight)})
                </option>
              ))}
              <option value="custom">Custom Size</option>
            </select>
            {errors.sizeCategoryId && <span className="error-message">{errors.sizeCategoryId}</span>}
          </div>

          {formData.sizeCategoryId === 'custom' && (
            <div className="form-group">
              <label htmlFor="sizeCategoryCustom">
                Custom Size Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="sizeCategoryCustom"
                name="sizeCategoryCustom"
                value={formData.sizeCategoryCustom}
                onChange={handleInputChange}
                placeholder="Enter custom size name"
                className={errors.sizeCategoryCustom ? 'error' : ''}
              />
              {errors.sizeCategoryCustom && <span className="error-message">{errors.sizeCategoryCustom}</span>}
            </div>
          )}
        </div>

        {/* Storage Details */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="storageLocation">Storage Location</label>
            <input
              type="text"
              id="storageLocation"
              name="storageLocation"
              value={formData.storageLocation}
              onChange={handleInputChange}
              placeholder="e.g., Freezer A, Cold Room 1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="expiryDate">Expiry Date</label>
            <input
              type="date"
              id="expiryDate"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleInputChange}
            />
            <small className="form-help">
              Default: 3 months from processing date
            </small>
          </div>
        </div>

        {/* Parts Inventory */}
        <div className="parts-section">
          <h4>Parts Inventory (Optional)</h4>
          <div className="parts-grid">
            {[
              { key: 'neck', label: 'Neck' },
              { key: 'feet', label: 'Feet' },
              { key: 'gizzard', label: 'Gizzard' },
              { key: 'dogFood', label: 'Dog Food' }
            ].map(part => (
              <div key={part.key} className="part-group">
                <h5>{part.label}</h5>
                <div className="part-inputs">
                  <div className="form-group">
                    <label>Count</label>
                    <input
                      type="number"
                      name={`${part.key}Count`}
                      value={formData[`${part.key}Count`]}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="0"
                      className={errors[`${part.key}Count`] ? 'error' : ''}
                    />
                    {errors[`${part.key}Count`] && (
                      <span className="error-message">{errors[`${part.key}Count`]}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      name={`${part.key}Weight`}
                      value={formData[`${part.key}Weight`]}
                      onChange={handleInputChange}
                      min="0"
                      step="0.1"
                      placeholder="0.0"
                      className={errors[`${part.key}Weight`] ? 'error' : ''}
                    />
                    {errors[`${part.key}Weight`] && (
                      <span className="error-message">{errors[`${part.key}Weight`]}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Remaining Birds Handling */}
        {selectedBatchData && parseInt(formData.processingQuantity) > 0 && 
         parseInt(formData.processingQuantity) < selectedBatchData.current_count && (
          <div className="remaining-birds-section">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="createNewBatchForRemaining"
                  checked={formData.createNewBatchForRemaining}
                  onChange={handleInputChange}
                />
                Create new batch for remaining {selectedBatchData.current_count - parseInt(formData.processingQuantity)} birds
              </label>
            </div>
            
            {formData.createNewBatchForRemaining && (
              <div className="form-group">
                <label htmlFor="remainingBatchId">New Batch ID for Remaining Birds</label>
                <input
                  type="text"
                  id="remainingBatchId"
                  name="remainingBatchId"
                  value={formData.remainingBatchId}
                  onChange={handleInputChange}
                  placeholder="e.g., BCH-2024-001-R"
                />
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            placeholder="Additional processing notes..."
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Record Processing'}
          </button>
        </div>
      </form>
    </EnhancedModal>
  );
};

export default ProcessingForm;
