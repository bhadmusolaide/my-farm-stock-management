import React, { useState, useEffect } from 'react';
import { EnhancedModal } from '../UI';
import { FEED_BRANDS, FEED_TYPES, kgToBags, bagsToKg } from '../../utils/constants';
import { formatNumber } from '../../utils/formatters';
import './FeedManagement.css';

const FeedForm = ({
  isOpen,
  onClose,
  onSubmit,
  editingFeed = null,
  liveChickens = [],
  loading = false
}) => {
  const [formData, setFormData] = useState({
    batch_number: '',
    feed_type: '',
    brand: '',
    custom_brand: '',
    supplier: '',
    number_of_bags: '',
    quantity_kg: '',
    cost_per_bag: '',
    cost_per_kg: '',
    purchase_date: '',
    expiry_date: '',
    notes: '',
    status: 'active',
    deduct_from_balance: false,
    balance_deducted: false,
    auto_assign_to_batches: false,
    assigned_batches: []
  });

  const [errors, setErrors] = useState({});
  const [showBatchAssignment, setShowBatchAssignment] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  // Reset form when modal opens/closes or editing feed changes
  useEffect(() => {
    if (isOpen) {
      if (editingFeed) {
        const isCustomBrand = !FEED_BRANDS.slice(0, -1).includes(editingFeed.brand);
        setFormData({
          batch_number: editingFeed.batch_number || '',
          feed_type: editingFeed.feed_type || '',
          brand: isCustomBrand ? 'Others' : editingFeed.brand || '',
          custom_brand: isCustomBrand ? editingFeed.brand : '',
          supplier: editingFeed.supplier || '',
          number_of_bags: editingFeed.number_of_bags?.toString() || '',
          quantity_kg: editingFeed.quantity_kg?.toString() || '',
          cost_per_bag: editingFeed.cost_per_bag?.toString() || '',
          cost_per_kg: editingFeed.cost_per_kg?.toString() || '',
          purchase_date: editingFeed.purchase_date || '',
          expiry_date: editingFeed.expiry_date || '',
          notes: editingFeed.notes || '',
          status: editingFeed.status || 'active',
          deduct_from_balance: editingFeed.deduct_from_balance || false,
          balance_deducted: editingFeed.balance_deducted || false,
          assigned_batches: editingFeed.assigned_batches || []
        });
      } else {
        // Generate batch number for new feed
        const batchNumber = `FEED-${Date.now()}`;
        setFormData({
          batch_number: batchNumber,
          feed_type: '',
          brand: '',
          custom_brand: '',
          supplier: '',
          number_of_bags: '',
          quantity_kg: '',
          cost_per_bag: '',
          cost_per_kg: '',
          purchase_date: new Date().toISOString().split('T')[0],
          expiry_date: '',
          notes: '',
          status: 'active',
          deduct_from_balance: false,
          balance_deducted: false,
          auto_assign_to_batches: false,
          assigned_batches: []
        });
      }
      setErrors({});
      setShowBatchAssignment(false);
    }
  }, [isOpen, editingFeed]);

  // Calculate total cost
  useEffect(() => {
    if (formData.number_of_bags && formData.cost_per_bag) {
      const bags = parseFloat(formData.number_of_bags);
      const costPerBag = parseFloat(formData.cost_per_bag);
      if (bags > 0 && costPerBag > 0) {
        setTotalCost(bags * costPerBag);
      } else {
        setTotalCost(0);
      }
    } else {
      setTotalCost(0);
    }
  }, [formData.number_of_bags, formData.cost_per_bag]);

  // Auto-calculate quantity when bags change
  useEffect(() => {
    if (formData.number_of_bags && !editingFeed) {
      const bags = parseFloat(formData.number_of_bags);
      if (bags > 0) {
        const kg = bagsToKg(bags);
        setFormData(prev => ({
          ...prev,
          quantity_kg: kg.toString()
        }));
      }
    }
  }, [formData.number_of_bags, editingFeed]);

  // Auto-calculate bags when quantity changes
  useEffect(() => {
    if (formData.quantity_kg && !formData.number_of_bags) {
      const kg = parseFloat(formData.quantity_kg);
      if (kg > 0) {
        const bags = kgToBags(kg);
        setFormData(prev => ({
          ...prev,
          number_of_bags: bags.toString()
        }));
      }
    }
  }, [formData.quantity_kg, formData.number_of_bags]);

  // Auto-calculate cost_per_kg when cost_per_bag or quantity changes
  useEffect(() => {
    if (formData.cost_per_bag && formData.number_of_bags && formData.quantity_kg) {
      const costPerBag = parseFloat(formData.cost_per_bag);
      const bags = parseFloat(formData.number_of_bags);
      const kg = parseFloat(formData.quantity_kg);

      if (costPerBag > 0 && bags > 0 && kg > 0) {
        const totalCost = costPerBag * bags;
        const costPerKg = totalCost / kg;
        setFormData(prev => ({
          ...prev,
          cost_per_kg: costPerKg.toFixed(2)
        }));
      }
    }
  }, [formData.cost_per_bag, formData.number_of_bags, formData.quantity_kg]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle auto-assign toggle
    if (name === 'auto_assign_to_batches' && checked) {
      handleAutoAssignToBatches();
    }

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

  // Auto-assign feed to active batches proportionally
  const handleAutoAssignToBatches = () => {
    const activeBatches = liveChickens.filter(
      batch => batch.status === 'healthy' || batch.status === 'active'
    );

    if (activeBatches.length === 0) {
      alert('No active batches found to assign feed to.');
      return;
    }

    const totalBirds = activeBatches.reduce((sum, batch) => sum + (batch.current_count || 0), 0);

    if (totalBirds === 0) {
      alert('No birds found in active batches.');
      return;
    }

    const totalQuantity = parseFloat(formData.quantity_kg || 0);

    if (totalQuantity <= 0) {
      alert('Please enter feed quantity first.');
      return;
    }

    // Calculate proportional distribution
    const assignments = activeBatches.map(batch => {
      const proportion = (batch.current_count || 0) / totalBirds;
      const assignedQuantity = totalQuantity * proportion;

      return {
        batch_id: batch.id,
        assigned: true,
        assigned_quantity_kg: parseFloat(assignedQuantity.toFixed(2)),
        auto_assigned: true
      };
    });

    setFormData(prev => ({
      ...prev,
      assigned_batches: assignments
    }));

    setShowBatchAssignment(true);
  };

  const handleBatchAssignmentChange = (batchId, field, value) => {
    setFormData(prev => {
      const newAssignedBatches = [...prev.assigned_batches];
      const existingIndex = newAssignedBatches.findIndex(ab => ab.batch_id === batchId);
      
      if (existingIndex >= 0) {
        if (field === 'assigned' && !value) {
          // Remove assignment
          newAssignedBatches.splice(existingIndex, 1);
        } else {
          // Update existing assignment
          newAssignedBatches[existingIndex] = {
            ...newAssignedBatches[existingIndex],
            [field]: value
          };
        }
      } else if (field === 'assigned' && value) {
        // Add new assignment
        newAssignedBatches.push({
          batch_id: batchId,
          assigned: true,
          assigned_quantity_kg: 0
        });
      }
      
      return {
        ...prev,
        assigned_batches: newAssignedBatches
      };
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.batch_number.trim()) {
      newErrors.batch_number = 'Batch number is required';
    }

    if (!formData.feed_type.trim()) {
      newErrors.feed_type = 'Feed type is required';
    }

    if (!formData.brand) {
      newErrors.brand = 'Brand is required';
    }

    if (formData.brand === 'Others' && !formData.custom_brand.trim()) {
      newErrors.custom_brand = 'Custom brand name is required';
    }

    if (!formData.number_of_bags || parseFloat(formData.number_of_bags) <= 0) {
      newErrors.number_of_bags = 'Number of bags must be greater than 0';
    }

    if (!formData.quantity_kg || parseFloat(formData.quantity_kg) <= 0) {
      newErrors.quantity_kg = 'Quantity must be greater than 0';
    }

    if (!formData.cost_per_bag || parseFloat(formData.cost_per_bag) <= 0) {
      newErrors.cost_per_bag = 'Cost per bag must be greater than 0';
    }

    if (!formData.purchase_date) {
      newErrors.purchase_date = 'Purchase date is required';
    }

    // Validate batch assignments
    const invalidAssignments = formData.assigned_batches.filter(
      ab => ab.assigned && (!ab.assigned_quantity_kg || parseFloat(ab.assigned_quantity_kg) <= 0)
    );

    if (invalidAssignments.length > 0) {
      newErrors.assigned_batches = 'All assigned batches must have a quantity greater than 0';
    }

    // Check if total assigned quantity exceeds available quantity
    const totalAssigned = formData.assigned_batches.reduce(
      (sum, ab) => sum + (ab.assigned ? parseFloat(ab.assigned_quantity_kg || 0) : 0), 0
    );

    if (totalAssigned > parseFloat(formData.quantity_kg || 0)) {
      newErrors.assigned_batches = 'Total assigned quantity cannot exceed available quantity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const feedData = {
      batch_number: formData.batch_number.trim(),
      feed_type: formData.feed_type.trim(),
      brand: formData.brand === 'Others' ? formData.custom_brand.trim() : formData.brand,
      supplier: formData.supplier.trim(),
      number_of_bags: parseInt(formData.number_of_bags),
      quantity_kg: parseFloat(formData.quantity_kg),
      cost_per_bag: parseFloat(formData.cost_per_bag),
      cost_per_kg: parseFloat(formData.cost_per_kg),
      purchase_date: formData.purchase_date,
      expiry_date: formData.expiry_date || null,
      notes: formData.notes.trim(),
      status: formData.status,
      deduct_from_balance: formData.deduct_from_balance,
      balance_deducted: formData.balance_deducted,
      assigned_batches: formData.assigned_batches.filter(ab => ab.assigned)
    };

    if (editingFeed) {
      feedData.id = editingFeed.id;
    }

    try {
      await onSubmit(feedData);
      onClose();
    } catch (error) {
      console.error('Failed to save feed:', error);
      setErrors({ submit: 'Failed to save feed. Please try again.' });
    }
  };

  // Get active chicken batches
  const activeChickenBatches = liveChickens.filter(
    batch => batch.status === 'healthy' || batch.status === 'sick'
  );

  // Calculate totals (totalCost is already managed in state via useEffect)
  const totalAssignedQuantity = formData.assigned_batches.reduce(
    (sum, ab) => sum + (ab.assigned ? parseFloat(ab.assigned_quantity_kg || 0) : 0), 0
  );
  const remainingQuantity = (parseFloat(formData.quantity_kg) || 0) - totalAssignedQuantity;

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingFeed ? 'Edit Feed Stock' : 'Add Feed Stock'}
      size="large"
      loading={loading}
      error={errors.submit}
    >
      <form onSubmit={handleSubmit} className="feed-form">
        {/* Basic Information */}
        <div className="form-section">
          <h4>Feed Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="batch_number">
                Batch Number <span className="required">*</span>
              </label>
              <input
                type="text"
                id="batch_number"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleInputChange}
                placeholder="Auto-generated batch number"
                className={errors.batch_number ? 'error' : ''}
                readOnly={!editingFeed}
              />
              {errors.batch_number && <span className="error-message">{errors.batch_number}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="feed_type">
                Feed Type <span className="required">*</span>
              </label>
              <select
                id="feed_type"
                name="feed_type"
                value={formData.feed_type}
                onChange={handleInputChange}
                className={errors.feed_type ? 'error' : ''}
              >
                <option value="">Select Feed Type</option>
                {FEED_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.feed_type && <span className="error-message">{errors.feed_type}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="brand">
                Brand <span className="required">*</span>
              </label>
              <select
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className={errors.brand ? 'error' : ''}
              >
                <option value="">Select Brand</option>
                {FEED_BRANDS.map(brand => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
              {errors.brand && <span className="error-message">{errors.brand}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="supplier">Supplier</label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                placeholder="Enter supplier name"
              />
            </div>
          </div>

          {formData.brand === 'Others' && (
            <div className="form-group">
              <label htmlFor="custom_brand">
                Custom Brand Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="custom_brand"
                name="custom_brand"
                value={formData.custom_brand}
                onChange={handleInputChange}
                placeholder="Enter custom brand name"
                className={errors.custom_brand ? 'error' : ''}
              />
              {errors.custom_brand && <span className="error-message">{errors.custom_brand}</span>}
            </div>
          )}
        </div>

        {/* Quantity and Cost */}
        <div className="form-section">
          <h4>Quantity and Cost</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="number_of_bags">
                Number of Bags <span className="required">*</span>
              </label>
              <input
                type="number"
                id="number_of_bags"
                name="number_of_bags"
                value={formData.number_of_bags}
                onChange={handleInputChange}
                min="1"
                step="1"
                placeholder="Number of bags"
                className={errors.number_of_bags ? 'error' : ''}
              />
              {errors.number_of_bags && <span className="error-message">{errors.number_of_bags}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="quantity_kg">
                Quantity (kg) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="quantity_kg"
                name="quantity_kg"
                value={formData.quantity_kg}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                placeholder="Total weight in kg"
                className={errors.quantity_kg ? 'error' : ''}
              />
              {errors.quantity_kg && <span className="error-message">{errors.quantity_kg}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cost_per_bag">
                Cost per Bag (₦) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="cost_per_bag"
                name="cost_per_bag"
                value={formData.cost_per_bag}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                placeholder="Cost per bag"
                className={errors.cost_per_bag ? 'error' : ''}
              />
              {errors.cost_per_bag && <span className="error-message">{errors.cost_per_bag}</span>}
            </div>

            <div className="form-group">
              <label>Cost per Kg (₦)</label>
              <div className="calculated-value">
                ₦{formatNumber(parseFloat(formData.cost_per_kg) || 0, 2)}
              </div>
              <small className="form-help">Auto-calculated from total cost</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Cost</label>
              <div className="calculated-value">
                ₦{formatNumber(totalCost, 2)}
              </div>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="form-section">
          <h4>Dates</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="purchase_date">
                Purchase Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="purchase_date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleInputChange}
                className={errors.purchase_date ? 'error' : ''}
              />
              {errors.purchase_date && <span className="error-message">{errors.purchase_date}</span>}
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
        </div>

        {/* Financial Options */}
        {!editingFeed && (
          <div className="form-section">
            <h4>Financial Options</h4>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="deduct_from_balance"
                  checked={formData.deduct_from_balance}
                  onChange={handleInputChange}
                />
                <span>Deduct purchase cost from farm balance</span>
              </label>
              {formData.deduct_from_balance && (
                <div className="info-box">
                  <p>
                    <strong>Amount to deduct:</strong> ₦{formatNumber(totalCost, 2)}
                  </p>
                  <small>This will create an expense transaction and update your farm balance.</small>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Batch Assignments */}
        {!editingFeed && activeChickenBatches.length > 0 && (
          <div className="form-section">
            <div className="section-header-with-action">
              <h4>Batch Assignments (Optional)</h4>
              <div className="form-group checkbox-group inline">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="auto_assign_to_batches"
                    checked={formData.auto_assign_to_batches}
                    onChange={handleInputChange}
                  />
                  <span>Auto-assign to active batches</span>
                </label>
              </div>
            </div>

            <p className="form-help">
              {formData.auto_assign_to_batches
                ? 'Feed will be distributed proportionally based on bird count in each batch.'
                : 'Manually assign portions of this feed to specific chicken batches.'
              }
              {' '}Remaining: <strong>{formatNumber(remainingQuantity, 2)} kg</strong>
            </p>

            {errors.assigned_batches && (
              <div className="error-message">{errors.assigned_batches}</div>
            )}

            {formData.auto_assign_to_batches && formData.assigned_batches.length > 0 && (
              <div className="info-box success">
                <p>
                  ✓ Feed auto-assigned to {formData.assigned_batches.length} active batch(es)
                </p>
              </div>
            )}

            {(showBatchAssignment || formData.assigned_batches.length > 0 || !formData.auto_assign_to_batches) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowBatchAssignment(!showBatchAssignment)}
                style={{ marginBottom: '1rem' }}
              >
                {showBatchAssignment ? 'Hide' : 'Show'} Batch Details
              </button>
            )}

            {showBatchAssignment && (
              <div className="batch-assignments">
                {activeChickenBatches.map(batch => {
                  const assignment = formData.assigned_batches.find(ab => ab.batch_id === batch.id);
                  const isAssigned = assignment?.assigned || false;
                  const assignedQuantity = assignment?.assigned_quantity_kg || '';

                  return (
                    <div key={batch.id} className="batch-assignment">
                      <div className="batch-info">
                        <label className="batch-checkbox">
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={(e) => handleBatchAssignmentChange(batch.id, 'assigned', e.target.checked)}
                            disabled={formData.auto_assign_to_batches}
                          />
                          <span className="batch-details">
                            <strong>{batch.batch_id}</strong> - {batch.breed}
                            <small>({batch.current_count} birds, {batch.status})</small>
                          </span>
                        </label>
                      </div>

                      {isAssigned && (
                        <div className="quantity-input">
                          <input
                            type="number"
                            value={assignedQuantity}
                            onChange={(e) => handleBatchAssignmentChange(batch.id, 'assigned_quantity_kg', e.target.value)}
                            placeholder="Quantity (kg)"
                            min="0"
                            step="0.01"
                            disabled={formData.auto_assign_to_batches}
                          />
                          <span className="unit">kg</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Additional Information */}
        <div className="form-section">
          <h4>Additional Information</h4>
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional notes about this feed stock"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="deduct_from_balance"
                checked={formData.deduct_from_balance}
                onChange={handleInputChange}
              />
              Deduct cost from account balance
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (editingFeed ? 'Update Feed Stock' : 'Add Feed Stock')}
          </button>
        </div>
      </form>
    </EnhancedModal>
  );
};

export default FeedForm;
