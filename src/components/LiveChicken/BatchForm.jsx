import React, { useState } from 'react';
import { EnhancedModal } from '../UI';
import './LiveChicken.css';

const BatchForm = ({
  isOpen,
  onClose,
  onSubmit,
  editingBatch = null,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    batch_id: editingBatch?.batch_id || '',
    breed: editingBatch?.breed || '',
    initial_count: editingBatch?.initial_count || '',
    current_count: editingBatch?.current_count || '',
    hatch_date: editingBatch?.hatch_date || '',
    expected_weight: editingBatch?.expected_weight || '',
    current_weight: editingBatch?.current_weight || '',
    feed_type: editingBatch?.feed_type || '',
    status: editingBatch?.status || 'healthy',
    mortality: editingBatch?.mortality || '0',
    notes: editingBatch?.notes || '',
    // Lifecycle tracking fields
    lifecycle_stage: editingBatch?.lifecycle_stage || 'arrival',
    stage_arrival_date: editingBatch?.stage_arrival_date || '',
    stage_brooding_date: editingBatch?.stage_brooding_date || '',
    stage_growing_date: editingBatch?.stage_growing_date || '',
    stage_processing_date: editingBatch?.stage_processing_date || '',
    stage_freezer_date: editingBatch?.stage_freezer_date || '',
    completed_date: editingBatch?.completed_date || ''
  });

  const [errors, setErrors] = useState({});

  // Update form data when editing batch changes
  React.useEffect(() => {
    if (editingBatch) {
      setFormData({
        batch_id: editingBatch.batch_id || '',
        breed: editingBatch.breed || '',
        initial_count: editingBatch.initial_count || '',
        current_count: editingBatch.current_count || '',
        hatch_date: editingBatch.hatch_date || '',
        expected_weight: editingBatch.expected_weight || '',
        current_weight: editingBatch.current_weight || '',
        feed_type: editingBatch.feed_type || '',
        status: editingBatch.status || 'healthy',
        mortality: editingBatch.mortality || '0',
        notes: editingBatch.notes || '',
        lifecycle_stage: editingBatch.lifecycle_stage || 'arrival',
        stage_arrival_date: editingBatch.stage_arrival_date || '',
        stage_brooding_date: editingBatch.stage_brooding_date || '',
        stage_growing_date: editingBatch.stage_growing_date || '',
        stage_processing_date: editingBatch.stage_processing_date || '',
        stage_freezer_date: editingBatch.stage_freezer_date || '',
        completed_date: editingBatch.completed_date || ''
      });
    } else {
      // Reset form for new batch
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        batch_id: '',
        breed: '',
        initial_count: '',
        current_count: '',
        hatch_date: '',
        expected_weight: '',
        current_weight: '',
        feed_type: '',
        status: 'healthy',
        mortality: '0',
        notes: '',
        lifecycle_stage: 'arrival',
        stage_arrival_date: today, // Auto-set to today for new batches
        stage_brooding_date: '',
        stage_growing_date: '',
        stage_processing_date: '',
        stage_freezer_date: '',
        completed_date: ''
      });
    }
    setErrors({});
  }, [editingBatch, isOpen]);

  // Auto-calculate mortality when counts change
  React.useEffect(() => {
    const initialCount = parseInt(formData.initial_count) || 0;
    const currentCount = parseInt(formData.current_count) || 0;
    const calculatedMortality = Math.max(0, initialCount - currentCount);

    setFormData(prev => ({
      ...prev,
      mortality: calculatedMortality.toString()
    }));
  }, [formData.initial_count, formData.current_count]);

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

    if (!formData.batch_id.trim()) {
      newErrors.batch_id = 'Batch ID is required';
    }

    if (!formData.breed.trim()) {
      newErrors.breed = 'Breed is required';
    }

    if (!formData.initial_count || parseInt(formData.initial_count) <= 0) {
      newErrors.initial_count = 'Initial count must be greater than 0';
    }

    if (!formData.current_count || parseInt(formData.current_count) < 0) {
      newErrors.current_count = 'Current count cannot be negative';
    }

    if (parseInt(formData.current_count) > parseInt(formData.initial_count)) {
      newErrors.current_count = 'Current count cannot exceed initial count';
    }

    if (!formData.hatch_date) {
      newErrors.hatch_date = 'Hatch date is required';
    }

    if (!formData.expected_weight || parseFloat(formData.expected_weight) <= 0) {
      newErrors.expected_weight = 'Expected weight must be greater than 0';
    }

    if (!formData.current_weight || parseFloat(formData.current_weight) < 0) {
      newErrors.current_weight = 'Current weight cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const batchData = {
      batch_id: formData.batch_id,
      breed: formData.breed,
      initial_count: parseInt(formData.initial_count),
      current_count: parseInt(formData.current_count),
      hatch_date: formData.hatch_date,
      expected_weight: parseFloat(formData.expected_weight),
      current_weight: parseFloat(formData.current_weight),
      feed_type: formData.feed_type || null,
      status: formData.status,
      mortality: parseInt(formData.mortality),
      notes: formData.notes || null,
      // Lifecycle tracking fields
      lifecycle_stage: formData.lifecycle_stage,
      stage_arrival_date: formData.stage_arrival_date || null,
      stage_brooding_date: formData.stage_brooding_date || null,
      stage_growing_date: formData.stage_growing_date || null,
      stage_processing_date: formData.stage_processing_date || null,
      stage_freezer_date: formData.stage_freezer_date || null,
      completed_date: formData.completed_date || null
    };

    if (editingBatch) {
      batchData.id = editingBatch.id;
    } else {
      batchData.id = Date.now().toString();
      batchData.created_at = new Date().toISOString();
    }

    batchData.updated_at = new Date().toISOString();

    try {
      await onSubmit(batchData);
      onClose();
    } catch (error) {
      console.error('Failed to save batch:', error);
      setErrors({ submit: 'Failed to save batch. Please try again.' });
    }
  };

  const breedOptions = [
    'Arbor Acres',
    'Ross 308',
    'Cobb 500',
    'Hubbard',
    'Anak 2000',
    'Marshall',
    'Shaver',
    'Other'
  ];

  const feedTypeOptions = [
    'Starter Feed',
    'Grower Feed',
    'Finisher Feed',
    'Broiler Feed',
    'Layer Feed',
    'Custom Mix'
  ];

  const statusOptions = [
    { value: 'healthy', label: 'Healthy' },
    { value: 'sick', label: 'Sick' },
    { value: 'quarantine', label: 'Quarantine' },
    { value: 'processing', label: 'Processing' }
  ];

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBatch ? 'Edit Chicken Batch' : 'Add New Chicken Batch'}
      size="large"
      loading={loading}
      error={errors.submit}
    >
      <form onSubmit={handleSubmit} className="batch-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="batch_id">
              Batch ID <span className="required">*</span>
            </label>
            <input
              type="text"
              id="batch_id"
              name="batch_id"
              value={formData.batch_id}
              onChange={handleInputChange}
              placeholder="e.g., BCH-2024-001"
              className={errors.batch_id ? 'error' : ''}
            />
            {errors.batch_id && <span className="error-message">{errors.batch_id}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="breed">
              Breed <span className="required">*</span>
            </label>
            <select
              id="breed"
              name="breed"
              value={formData.breed}
              onChange={handleInputChange}
              className={errors.breed ? 'error' : ''}
            >
              <option value="">Select Breed</option>
              {breedOptions.map(breed => (
                <option key={breed} value={breed}>{breed}</option>
              ))}
            </select>
            {errors.breed && <span className="error-message">{errors.breed}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="initial_count">
              Initial Count <span className="required">*</span>
            </label>
            <input
              type="number"
              id="initial_count"
              name="initial_count"
              value={formData.initial_count}
              onChange={handleInputChange}
              min="1"
              placeholder="Number of chicks"
              className={errors.initial_count ? 'error' : ''}
            />
            {errors.initial_count && <span className="error-message">{errors.initial_count}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="current_count">
              Current Count <span className="required">*</span>
            </label>
            <input
              type="number"
              id="current_count"
              name="current_count"
              value={formData.current_count}
              onChange={handleInputChange}
              min="0"
              placeholder="Current number of chickens"
              className={errors.current_count ? 'error' : ''}
            />
            {errors.current_count && <span className="error-message">{errors.current_count}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="hatch_date">
              Hatch Date <span className="required">*</span>
            </label>
            <input
              type="date"
              id="hatch_date"
              name="hatch_date"
              value={formData.hatch_date}
              onChange={handleInputChange}
              className={errors.hatch_date ? 'error' : ''}
            />
            {errors.hatch_date && <span className="error-message">{errors.hatch_date}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="expected_weight">
              Expected Weight (kg) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="expected_weight"
              name="expected_weight"
              value={formData.expected_weight}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              placeholder="Expected weight per bird"
              className={errors.expected_weight ? 'error' : ''}
            />
            {errors.expected_weight && <span className="error-message">{errors.expected_weight}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="current_weight">
              Current Weight (kg) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="current_weight"
              name="current_weight"
              value={formData.current_weight}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              placeholder="Current weight per bird"
              className={errors.current_weight ? 'error' : ''}
            />
            {errors.current_weight && <span className="error-message">{errors.current_weight}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="feed_type">Feed Type</label>
            <select
              id="feed_type"
              name="feed_type"
              value={formData.feed_type}
              onChange={handleInputChange}
            >
              <option value="">Select Feed Type</option>
              {feedTypeOptions.map(feed => (
                <option key={feed} value={feed}>{feed}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="mortality">Mortality Count</label>
            <input
              type="number"
              id="mortality"
              name="mortality"
              value={formData.mortality}
              readOnly
              className="readonly-field"
              style={{
                backgroundColor: '#f5f5f5',
                cursor: 'not-allowed'
              }}
            />
            <small className="form-help">Auto-calculated: Initial Count - Current Count</small>
          </div>
        </div>

        {/* Lifecycle Tracking Section */}
        <div className="form-section">
          <h4>Lifecycle Tracking</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lifecycle_stage">Current Stage</label>
              <select
                id="lifecycle_stage"
                name="lifecycle_stage"
                value={formData.lifecycle_stage}
                onChange={handleInputChange}
              >
                <option value="arrival">Arrival</option>
                <option value="brooding">Brooding</option>
                <option value="growing">Growing</option>
                <option value="processing">Processing</option>
                <option value="freezer">Freezer</option>
                <option value="completed">Completed</option>
              </select>
              <small className="form-help">Current lifecycle stage of the batch</small>
            </div>

            <div className="form-group">
              <label htmlFor="stage_arrival_date">Arrival Date</label>
              <input
                type="date"
                id="stage_arrival_date"
                name="stage_arrival_date"
                value={formData.stage_arrival_date}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stage_brooding_date">Brooding Date</label>
              <input
                type="date"
                id="stage_brooding_date"
                name="stage_brooding_date"
                value={formData.stage_brooding_date}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="stage_growing_date">Growing Date</label>
              <input
                type="date"
                id="stage_growing_date"
                name="stage_growing_date"
                value={formData.stage_growing_date}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stage_processing_date">Processing Date</label>
              <input
                type="date"
                id="stage_processing_date"
                name="stage_processing_date"
                value={formData.stage_processing_date}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="stage_freezer_date">Freezer Date</label>
              <input
                type="date"
                id="stage_freezer_date"
                name="stage_freezer_date"
                value={formData.stage_freezer_date}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="completed_date">Completed Date</label>
            <input
              type="date"
              id="completed_date"
              name="completed_date"
              value={formData.completed_date}
              onChange={handleInputChange}
            />
            <small className="form-help">Date when batch lifecycle is completed</small>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            placeholder="Additional notes about this batch..."
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (editingBatch ? 'Update Batch' : 'Add Batch')}
          </button>
        </div>
      </form>
    </EnhancedModal>
  );
};

export default BatchForm;
