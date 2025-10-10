import React, { useState, useEffect } from 'react';
import { EnhancedModal } from '../UI';
import { formatWeight } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import './DressedChicken.css';

const ProcessingForm = ({
  isOpen,
  onClose,
  onSubmit,
  liveChickens = [],
  chickenSizeCategories = [],
  loading = false
}) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    batch_id: '',
    selectedBatch: '',
    processing_date: new Date().toISOString().split('T')[0],
    initial_count: '',
    current_count: '',
    average_weight: '',
    size_category_id: '',
    size_category_custom: '',
    processing_quantity: '',
    storage_location: '',
    expiry_date: '',
    status: 'in-storage',
    notes: '',
    create_new_batch_for_remaining: false,
    remaining_batch_id: '',
    // Parts data (will be transformed to JSONB)
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
        batch_id: `DRESSED-${Date.now()}`,
        selectedBatch: '',
        processing_date: new Date().toISOString().split('T')[0],
        initial_count: '',
        current_count: '',
        average_weight: '',
        size_category_id: '',
        size_category_custom: '',
        processing_quantity: '',
        storage_location: '',
        expiry_date: '',
        status: 'in-storage',
        notes: '',
        create_new_batch_for_remaining: false,
        remaining_batch_id: '',
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
    if (formData.processing_date && !formData.expiry_date) {
      setFormData(prev => ({
        ...prev,
        expiry_date: calculateDefaultExpiryDate(prev.processing_date)
      }));
    }
  }, [formData.processing_date]);

  // Auto-calculate initial_count, current_count, and average_weight when batch or quantity changes
  useEffect(() => {
    if (formData.selectedBatch && formData.processing_quantity) {
      const selectedBatchData = liveChickens.find(batch => batch.id === formData.selectedBatch);
      if (selectedBatchData) {
        const processingQty = parseInt(formData.processing_quantity) || 0;
        const avgWeight = selectedBatchData.current_weight || selectedBatchData.expected_weight || 2.5;

        setFormData(prev => ({
          ...prev,
          initial_count: processingQty,
          current_count: processingQty,
          average_weight: avgWeight.toFixed(2)
        }));
      }
    }
  }, [formData.selectedBatch, formData.processing_quantity, liveChickens]);

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

    if (!formData.batch_id?.trim()) {
      newErrors.batch_id = 'Batch ID is required';
    }

    if (!formData.selectedBatch) {
      newErrors.selectedBatch = 'Please select a live chicken batch';
    }

    if (!formData.size_category_id) {
      newErrors.size_category_id = 'Please select a size category';
    }

    if (formData.size_category_id === 'custom' && !formData.size_category_custom.trim()) {
      newErrors.size_category_custom = 'Please enter a custom size name';
    }

    const selectedBatchData = liveChickens.find(batch => batch.id === formData.selectedBatch);
    const availableBirds = selectedBatchData?.current_count || 0;
    const quantityToProcess = parseInt(formData.processing_quantity) || 0;

    if (quantityToProcess <= 0) {
      newErrors.processing_quantity = 'Please enter a valid quantity to process (must be greater than 0)';
    }

    if (quantityToProcess > availableBirds) {
      newErrors.processing_quantity = `Cannot process more than ${availableBirds} birds (available in selected batch)`;
    }

    if (!formData.processing_date) {
      newErrors.processing_date = 'Processing date is required';
    }

    if (!formData.storage_location?.trim()) {
      newErrors.storage_location = 'Storage location is required';
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
    const quantityToProcess = parseInt(formData.processing_quantity);
    const remainingBirds = selectedBatchData.current_count - quantityToProcess;

    // Prepare parts data as JSONB
    const parts_count = {
      neck: parseInt(formData.neckCount) || 0,
      feet: parseInt(formData.feetCount) || 0,
      gizzard: parseInt(formData.gizzardCount) || 0,
      dog_food: parseInt(formData.dogFoodCount) || 0
    };

    const parts_weight = {
      neck: parseFloat(formData.neckWeight) || 0,
      feet: parseFloat(formData.feetWeight) || 0,
      gizzard: parseFloat(formData.gizzardWeight) || 0,
      dog_food: parseFloat(formData.dogFoodWeight) || 0
    };

    // Prepare data matching database schema
    const processingData = {
      batch_id: formData.batch_id,
      processing_date: formData.processing_date,
      initial_count: parseInt(formData.initial_count),
      current_count: parseInt(formData.current_count),
      average_weight: parseFloat(formData.average_weight),
      size_category_id: formData.size_category_id === 'custom' ? null : formData.size_category_id,
      size_category_custom: formData.size_category_id === 'custom' ? formData.size_category_custom : null,
      status: formData.status,
      storage_location: formData.storage_location,
      expiry_date: formData.expiry_date || null,
      notes: formData.notes || null,
      parts_count: parts_count,
      parts_weight: parts_weight,
      processing_quantity: quantityToProcess,
      remaining_birds: remainingBirds,
      create_new_batch_for_remaining: formData.create_new_batch_for_remaining,
      remaining_batch_id: formData.remaining_batch_id || null,
      created_by: user?.id || null,
      // Additional data for context processing
      selectedBatchData: selectedBatchData
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
        {/* Batch Information */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="batch_id">
              Dressed Batch ID <span className="required">*</span>
            </label>
            <input
              type="text"
              id="batch_id"
              name="batch_id"
              value={formData.batch_id}
              onChange={handleInputChange}
              placeholder="Auto-generated"
              className={errors.batch_id ? 'error' : ''}
            />
            {errors.batch_id && <span className="error-message">{errors.batch_id}</span>}
            <small className="form-help">Unique identifier for this dressed chicken batch</small>
          </div>

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
        </div>

        {/* Processing Details */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="processing_date">
              Processing Date <span className="required">*</span>
            </label>
            <input
              type="date"
              id="processing_date"
              name="processing_date"
              value={formData.processing_date}
              onChange={handleInputChange}
              className={errors.processing_date ? 'error' : ''}
            />
            {errors.processing_date && <span className="error-message">{errors.processing_date}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="processing_quantity">
              Quantity to Process <span className="required">*</span>
            </label>
            <input
              type="number"
              id="processing_quantity"
              name="processing_quantity"
              value={formData.processing_quantity}
              onChange={handleInputChange}
              min="1"
              max={selectedBatchData?.current_count || 999}
              placeholder="Number of birds"
              className={errors.processing_quantity ? 'error' : ''}
            />
            {errors.processing_quantity && <span className="error-message">{errors.processing_quantity}</span>}
            {selectedBatchData && (
              <small className="form-help">
                Available: {selectedBatchData.current_count} birds
              </small>
            )}
          </div>
        </div>

        {/* Auto-calculated fields display */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="average_weight">Average Weight (kg)</label>
            <input
              type="number"
              id="average_weight"
              name="average_weight"
              value={formData.average_weight}
              readOnly
              className="readonly-field"
              style={{
                backgroundColor: '#f5f5f5',
                cursor: 'not-allowed'
              }}
            />
            <small className="form-help">Auto-calculated from selected batch</small>
          </div>

          <div className="form-group">
            <label htmlFor="initial_count">Initial Count</label>
            <input
              type="number"
              id="initial_count"
              name="initial_count"
              value={formData.initial_count}
              readOnly
              className="readonly-field"
              style={{
                backgroundColor: '#f5f5f5',
                cursor: 'not-allowed'
              }}
            />
            <small className="form-help">Auto-set from processing quantity</small>
          </div>
        </div>

        {/* Size Category */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="size_category_id">
              Size Category <span className="required">*</span>
            </label>
            <select
              id="size_category_id"
              name="size_category_id"
              value={formData.size_category_id}
              onChange={handleInputChange}
              className={errors.size_category_id ? 'error' : ''}
            >
              <option value="">Select Size Category</option>
              {chickenSizeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({formatWeight(category.min_weight)} - {formatWeight(category.max_weight)})
                </option>
              ))}
              <option value="custom">Custom Size</option>
            </select>
            {errors.size_category_id && <span className="error-message">{errors.size_category_id}</span>}
          </div>

          {formData.size_category_id === 'custom' && (
            <div className="form-group">
              <label htmlFor="size_category_custom">
                Custom Size Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="size_category_custom"
                name="size_category_custom"
                value={formData.size_category_custom}
                onChange={handleInputChange}
                placeholder="Enter custom size name"
                className={errors.size_category_custom ? 'error' : ''}
              />
              {errors.size_category_custom && <span className="error-message">{errors.size_category_custom}</span>}
            </div>
          )}
        </div>

        {/* Storage Details */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="storage_location">
              Storage Location <span className="required">*</span>
            </label>
            <input
              type="text"
              id="storage_location"
              name="storage_location"
              value={formData.storage_location}
              onChange={handleInputChange}
              placeholder="e.g., Freezer A, Cold Room 1"
              className={errors.storage_location ? 'error' : ''}
            />
            {errors.storage_location && <span className="error-message">{errors.storage_location}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="expiry_date">Expiry Date</label>
            <input
              type="date"
              id="expiry_date"
              name="expiry_date"
              value={formData.expiry_date}
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
        {selectedBatchData && parseInt(formData.processing_quantity) > 0 &&
         parseInt(formData.processing_quantity) < selectedBatchData.current_count && (
          <div className="remaining-birds-section">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="create_new_batch_for_remaining"
                  checked={formData.create_new_batch_for_remaining}
                  onChange={handleInputChange}
                />
                Create new batch for remaining {selectedBatchData.current_count - parseInt(formData.processing_quantity)} birds
              </label>
            </div>

            {formData.create_new_batch_for_remaining && (
              <div className="form-group">
                <label htmlFor="remaining_batch_id">New Batch ID for Remaining Birds</label>
                <input
                  type="text"
                  id="remaining_batch_id"
                  name="remaining_batch_id"
                  value={formData.remaining_batch_id}
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
