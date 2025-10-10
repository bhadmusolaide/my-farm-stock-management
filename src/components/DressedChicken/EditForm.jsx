import React, { useState, useEffect } from 'react';
import { EnhancedModal } from '../UI';
import { formatWeight } from '../../utils/formatters';
import './DressedChicken.css';

const EditForm = ({
  isOpen,
  onClose,
  onSubmit,
  editingChicken,
  chickenSizeCategories = [],
  loading = false
}) => {
  const [formData, setFormData] = useState({
    batch_id: '',
    processing_date: '',
    initial_count: '',
    current_count: '',
    average_weight: '',
    size_category_id: '',
    size_category_custom: '',
    storage_location: '',
    expiry_date: '',
    status: 'in-storage',
    notes: '',
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

  // Populate form when editing
  useEffect(() => {
    if (editingChicken && isOpen) {
      const partsCount = editingChicken.parts_count || {};
      const partsWeight = editingChicken.parts_weight || {};

      setFormData({
        batch_id: editingChicken.batch_id || '',
        processing_date: editingChicken.processing_date || '',
        initial_count: editingChicken.initial_count || '',
        current_count: editingChicken.current_count || '',
        average_weight: editingChicken.average_weight || '',
        size_category_id: editingChicken.size_category_id || '',
        size_category_custom: editingChicken.size_category_custom || '',
        storage_location: editingChicken.storage_location || '',
        expiry_date: editingChicken.expiry_date || '',
        status: editingChicken.status || 'in-storage',
        notes: editingChicken.notes || '',
        // Parts data
        neckCount: partsCount.neck || '',
        neckWeight: partsWeight.neck || '',
        feetCount: partsCount.feet || '',
        feetWeight: partsWeight.feet || '',
        gizzardCount: partsCount.gizzard || '',
        gizzardWeight: partsWeight.gizzard || '',
        dogFoodCount: partsCount.dog_food || '',
        dogFoodWeight: partsWeight.dog_food || ''
      });
      setErrors({});
    }
  }, [editingChicken, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.batch_id?.trim()) {
      newErrors.batch_id = 'Batch ID is required';
    }

    if (!formData.processing_date) {
      newErrors.processing_date = 'Processing date is required';
    }

    if (!formData.initial_count || formData.initial_count <= 0) {
      newErrors.initial_count = 'Initial count must be greater than 0';
    }

    if (!formData.current_count || formData.current_count <= 0) {
      newErrors.current_count = 'Current count must be greater than 0';
    }

    // Validate current_count <= initial_count
    const initialCount = parseInt(formData.initial_count) || 0;
    const currentCount = parseInt(formData.current_count) || 0;
    if (currentCount > initialCount) {
      newErrors.current_count = `Current count (${currentCount}) cannot exceed initial count (${initialCount})`;
    }

    if (!formData.average_weight || formData.average_weight <= 0) {
      newErrors.average_weight = 'Average weight must be greater than 0';
    }

    if (!formData.storage_location?.trim()) {
      newErrors.storage_location = 'Storage location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Prepare parts data
      const partsCount = {
        neck: parseFloat(formData.neckCount) || 0,
        feet: parseFloat(formData.feetCount) || 0,
        gizzard: parseFloat(formData.gizzardCount) || 0,
        dog_food: parseFloat(formData.dogFoodCount) || 0
      };

      const partsWeight = {
        neck: parseFloat(formData.neckWeight) || 0,
        feet: parseFloat(formData.feetWeight) || 0,
        gizzard: parseFloat(formData.gizzardWeight) || 0,
        dog_food: parseFloat(formData.dogFoodWeight) || 0
      };

      const updatedData = {
        batch_id: formData.batch_id,
        processing_date: formData.processing_date,
        initial_count: parseFloat(formData.initial_count),
        current_count: parseFloat(formData.current_count),
        average_weight: parseFloat(formData.average_weight),
        size_category_id: formData.size_category_id === 'custom' ? null : (formData.size_category_id || null),
        size_category_custom: formData.size_category_id === 'custom' ? formData.size_category_custom : null,
        size_category: formData.size_category_id && formData.size_category_id !== 'custom'
          ? chickenSizeCategories.find(sc => sc.id === formData.size_category_id)?.name?.toLowerCase()
          : (formData.size_category_id === 'custom' ? formData.size_category_custom : 'medium'),
        storage_location: formData.storage_location,
        expiry_date: formData.expiry_date,
        status: formData.status,
        notes: formData.notes,
        parts_count: partsCount,
        parts_weight: partsWeight
      };

      await onSubmit(editingChicken.id, updatedData);
      onClose();
    } catch (error) {
      console.error('Error updating dressed chicken:', error);
      setErrors({ submit: error.message || 'Failed to update record' });
    }
  };

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Dressed Chicken Record"
      size="large"
      loading={loading}
      error={errors.submit}
    >
      <form onSubmit={handleSubmit} className="processing-form">
        {/* Batch ID */}
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
            className={errors.batch_id ? 'error' : ''}
            placeholder="Enter batch ID"
          />
          {errors.batch_id && <span className="error-message">{errors.batch_id}</span>}
        </div>

        {/* Processing Date */}
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

        {/* Count Fields */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="initial_count">Initial Count</label>
            <input
              type="number"
              id="initial_count"
              name="initial_count"
              value={formData.initial_count}
              onChange={handleInputChange}
              min="0"
              step="1"
              placeholder="Initial count"
            />
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
              className={errors.current_count ? 'error' : ''}
              min="0"
              step="1"
              placeholder="Current count"
            />
            {errors.current_count && <span className="error-message">{errors.current_count}</span>}
          </div>
        </div>

        {/* Average Weight */}
        <div className="form-group">
          <label htmlFor="average_weight">
            Average Weight (kg) <span className="required">*</span>
          </label>
          <input
            type="number"
            id="average_weight"
            name="average_weight"
            value={formData.average_weight}
            onChange={handleInputChange}
            className={errors.average_weight ? 'error' : ''}
            min="0"
            step="0.01"
            placeholder="Average weight in kg"
          />
          {errors.average_weight && <span className="error-message">{errors.average_weight}</span>}
        </div>

        {/* Size Category */}
        <div className="form-group">
          <label htmlFor="size_category_id">Size Category</label>
          <select
            id="size_category_id"
            name="size_category_id"
            value={formData.size_category_id}
            onChange={handleInputChange}
          >
            <option value="">Select Size Category</option>
            {chickenSizeCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.min_weight} - {category.max_weight} kg)
              </option>
            ))}
            <option value="custom">Custom Size</option>
          </select>
        </div>

        {formData.size_category_id === 'custom' && (
          <div className="form-group">
            <label htmlFor="size_category_custom">Custom Size Category</label>
            <input
              type="text"
              id="size_category_custom"
              name="size_category_custom"
              value={formData.size_category_custom}
              onChange={handleInputChange}
              placeholder="Enter custom size category"
            />
          </div>
        )}

        {/* Storage Location */}
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
            className={errors.storage_location ? 'error' : ''}
            placeholder="e.g., Freezer Unit A"
          />
          {errors.storage_location && <span className="error-message">{errors.storage_location}</span>}
        </div>

        {/* Status and Expiry Date */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="in-storage">In Storage</option>
              <option value="sold">Sold</option>
              <option value="expired">Expired</option>
              <option value="damaged">Damaged</option>
            </select>
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
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            placeholder="Additional notes..."
          />
        </div>

        {/* Parts Data */}
        <h3 className="form-section-title">Chicken Parts Inventory</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="neckCount">Neck Count</label>
            <input
              type="number"
              id="neckCount"
              name="neckCount"
              value={formData.neckCount}
              onChange={handleInputChange}
              min="0"
              step="1"
              placeholder="Neck count"
            />
          </div>
          <div className="form-group">
            <label htmlFor="neckWeight">Neck Weight (kg)</label>
            <input
              type="number"
              id="neckWeight"
              name="neckWeight"
              value={formData.neckWeight}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              placeholder="Neck weight in kg"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="feetCount">Feet Count</label>
            <input
              type="number"
              id="feetCount"
              name="feetCount"
              value={formData.feetCount}
              onChange={handleInputChange}
              min="0"
              step="1"
              placeholder="Feet count"
            />
          </div>
          <div className="form-group">
            <label htmlFor="feetWeight">Feet Weight (kg)</label>
            <input
              type="number"
              id="feetWeight"
              name="feetWeight"
              value={formData.feetWeight}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              placeholder="Feet weight in kg"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gizzardCount">Gizzard Count</label>
            <input
              type="number"
              id="gizzardCount"
              name="gizzardCount"
              value={formData.gizzardCount}
              onChange={handleInputChange}
              min="0"
              step="1"
              placeholder="Gizzard count"
            />
          </div>
          <div className="form-group">
            <label htmlFor="gizzardWeight">Gizzard Weight (kg)</label>
            <input
              type="number"
              id="gizzardWeight"
              name="gizzardWeight"
              value={formData.gizzardWeight}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              placeholder="Gizzard weight in kg"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dogFoodCount">Dog Food Count</label>
            <input
              type="number"
              id="dogFoodCount"
              name="dogFoodCount"
              value={formData.dogFoodCount}
              onChange={handleInputChange}
              min="0"
              step="1"
              placeholder="Dog Food count"
            />
          </div>
          <div className="form-group">
            <label htmlFor="dogFoodWeight">Dog Food Weight (kg)</label>
            <input
              type="number"
              id="dogFoodWeight"
              name="dogFoodWeight"
              value={formData.dogFoodWeight}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              placeholder="Dog Food weight in kg"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Record'}
          </button>
        </div>
      </form>
    </EnhancedModal>
  );
};

export default EditForm;

