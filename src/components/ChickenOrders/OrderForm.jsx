import React, { useState, useEffect } from 'react';
import { EnhancedModal } from '../UI';
import { formatNumber, formatDate } from '../../utils/formatters';
import { supabase } from '../../utils/supabaseClient';
import './ChickenOrders.css';

const OrderForm = ({
  isOpen,
  onClose,
  onSubmit,
  editingOrder = null,
  liveChickens = [],
  dressedChickens = [],
  loading = false
}) => {
  const [formData, setFormData] = useState({
    date: '',
    customer: '',
    phone: '',
    location: '',
    count: '',
    size: '',
    price: '',
    amount_paid: '',
    balance: '',
    status: 'pending',
    calculation_mode: 'count_size_cost', // 'count_size_cost', 'count_cost', 'size_cost'
    inventory_type: 'live', // 'live', 'dressed', 'parts'
    batch_id: '', // For live or dressed chicken batch
    part_type: '' // For parts: 'neck', 'feet', 'gizzard', 'dog_food'
  });

  const [errors, setErrors] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [editHistory, setEditHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Helper to get actual whole chicken count from dressed chicken batch
  const getWholeChickenCount = (dressedChicken) => {
    if (!dressedChicken) return 0;
    
    if (dressedChicken.processing_quantity && dressedChicken.processing_quantity > 0) {
      return dressedChicken.processing_quantity;
    }
    
    const partsCount = dressedChicken.parts_count || {};
    const totalPartsCount = Object.values(partsCount).reduce((sum, count) => sum + (count || 0), 0);
    
    if (dressedChicken.current_count === totalPartsCount && totalPartsCount > 0) {
      const partsCounts = Object.values(partsCount).filter(c => c > 0);
      return partsCounts.length > 0 ? Math.min(...partsCounts) : dressedChicken.current_count;
    }
    
    return dressedChicken.current_count || 0;
  };

  // Reset form when modal opens/closes or editing order changes
  useEffect(() => {
    if (isOpen) {
      if (editingOrder) {
        setFormData({
          date: editingOrder.date || '',
          customer: editingOrder.customer || '',
          phone: editingOrder.phone || '',
          location: editingOrder.location || '',
          count: editingOrder.count || '',
          size: editingOrder.size || '',
          price: editingOrder.price || '',
          amount_paid: editingOrder.amount_paid || '',
          balance: editingOrder.balance || '',
          status: editingOrder.status || 'pending',
          calculation_mode: editingOrder.calculation_mode || 'count_size_cost',
          inventory_type: editingOrder.inventory_type || 'live',
          batch_id: editingOrder.batch_id || '',
          part_type: editingOrder.part_type || ''
        });
      } else {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          customer: '',
          phone: '',
          location: '',
          count: '',
          size: '',
          price: '',
          amount_paid: '',
          balance: '0',
          status: 'pending',
          calculation_mode: 'count_size_cost',
          inventory_type: 'live',
          batch_id: '',
          part_type: ''
        });
      }
      setErrors({});
      setShowHistory(false);
      setEditHistory([]);
    }
  }, [isOpen, editingOrder]);

  // Fetch edit history when showing history
  useEffect(() => {
    const fetchEditHistory = async () => {
      if (showHistory && editingOrder && editingOrder.id) {
        setHistoryLoading(true);
        try {
          const { data, error } = await supabase
            .from('audit_logs')
            .select('*, users(full_name)')
            .eq('table_name', 'chickens')
            .eq('record_id', editingOrder.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setEditHistory(data || []);
        } catch (err) {
          console.error('Failed to fetch edit history:', err);
          setEditHistory([]);
        } finally {
          setHistoryLoading(false);
        }
      }
    };

    fetchEditHistory();
  }, [showHistory, editingOrder]);

  // Calculate total cost based on calculation mode
  const calculateTotalCost = () => {
    const count = parseFloat(formData.count) || 0;
    const size = parseFloat(formData.size) || 0;
    const price = parseFloat(formData.price) || 0;

    if (formData.calculation_mode === 'count_cost') {
      return count * price;
    } else if (formData.calculation_mode === 'size_cost') {
      return size * price;
    } else if (formData.calculation_mode === 'count_size_cost') {
      return count * size * price;
    }
    return 0;
  };

  // Calculate balance
  const calculateBalance = () => {
    const totalCost = calculateTotalCost();
    const amountPaid = parseFloat(formData.amount_paid) || 0;
    return Math.max(0, totalCost - amountPaid);
  };

  // Calculate payment status based on amount paid vs total cost
  const calculatePaymentStatus = () => {
    const totalCost = calculateTotalCost();
    const amountPaid = parseFloat(formData.amount_paid) || 0;

    if (totalCost === 0) return 'pending';
    if (amountPaid >= totalCost) return 'paid';
    if (amountPaid > 0) return 'partial';
    return 'pending';
  };

  const totalCost = calculateTotalCost();
  const calculatedBalance = calculateBalance();
  const calculatedPaymentStatus = calculatePaymentStatus();

  // Auto-update balance when total or amount paid changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      balance: calculatedBalance.toFixed(2)
    }));
  }, [calculatedBalance]);

  // Auto-update status when payment status changes (but allow manual override)
  useEffect(() => {
    if (!editingOrder) { // Only auto-update for new orders
      setFormData(prev => ({
        ...prev,
        status: calculatedPaymentStatus
      }));
    }
  }, [calculatedPaymentStatus, editingOrder]);



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

    if (!formData.date) {
      newErrors.date = 'Order date is required';
    }

    if (!formData.customer.trim()) {
      newErrors.customer = 'Customer name is required';
    }

    // Count is required except in 'size_cost' mode
    if (formData.calculation_mode !== 'size_cost' && (!formData.count || parseFloat(formData.count) <= 0)) {
      newErrors.count = 'Count must be greater than 0';
    }

    // Size is required except in 'count_cost' mode
    if (formData.calculation_mode !== 'count_cost' && (!formData.size || parseFloat(formData.size) <= 0)) {
      newErrors.size = 'Size must be greater than 0';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.inventory_type === 'parts' && !formData.part_type) {
      newErrors.part_type = 'Part type is required for parts inventory';
    }

    // Validate inventory availability if batch is selected
    if (formData.batch_id && formData.calculation_mode !== 'size_cost') {
      const count = parseFloat(formData.count) || 0;
      let availableCount = 0;

      if (formData.inventory_type === 'live') {
        const batch = liveChickens.find(b => b.id === formData.batch_id);
        availableCount = batch?.current_count || 0;
      } else if (formData.inventory_type === 'dressed') {
        const batch = dressedChickens.find(b => b.id === formData.batch_id);
        if (formData.inventory_type === 'parts' && formData.part_type) {
          availableCount = batch?.parts_count?.[formData.part_type] || 0;
        } else {
          availableCount = getWholeChickenCount(batch);
        }
      }

      if (availableCount < count) {
        const itemName = formData.inventory_type === 'parts' ? formData.part_type : 'chickens';
        newErrors.count = `Insufficient ${itemName} in batch. Available: ${availableCount}, Required: ${count}`;
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

    const orderData = {
      date: formData.date,
      customer: formData.customer,
      phone: formData.phone,
      location: formData.location,
      count: formData.calculation_mode === 'size_cost' ? 0 : parseFloat(formData.count),
      size: formData.calculation_mode === 'count_cost' ? 0 : parseFloat(formData.size),
      price: parseFloat(formData.price),
      amount_paid: parseFloat(formData.amount_paid) || 0,
      balance: parseFloat(formData.balance) || 0,
      status: formData.status,
      calculation_mode: formData.calculation_mode,
      inventory_type: formData.inventory_type,
      batch_id: formData.batch_id || null,
      part_type: formData.part_type || null
    };

    if (editingOrder) {
      orderData.id = editingOrder.id;
    }

    try {
      await onSubmit(orderData);
      onClose();
    } catch (error) {
      console.error('Failed to save order:', error);
      setErrors({ submit: 'Failed to save order. Please try again.' });
    }
  };

  // Get available batches based on inventory type
  const getAvailableBatches = () => {
    if (formData.inventory_type === 'live') {
      return liveChickens.filter(batch => batch.current_count > 0);
    } else if (formData.inventory_type === 'dressed') {
      return dressedChickens.filter(batch => {
        if (formData.inventory_type === 'parts') {
          return batch.parts_count && Object.values(batch.parts_count).some(count => count > 0);
        }
        return getWholeChickenCount(batch) > 0;
      });
    }
    return [];
  };

  const availableBatches = getAvailableBatches();

  const calculationModes = [
    { value: 'count_size_cost', label: 'Count × Size × Price (Standard)' },
    { value: 'count_cost', label: 'Count × Price' },
    { value: 'size_cost', label: 'Size × Price' }
  ];

  const inventoryTypes = [
    { value: 'live', label: 'Live Chickens' },
    { value: 'dressed', label: 'Dressed Chickens' },
    { value: 'parts', label: 'Chicken Parts' }
  ];

  const partTypes = [
    { value: 'neck', label: 'Neck' },
    { value: 'feet', label: 'Feet' },
    { value: 'gizzard', label: 'Gizzard' },
    { value: 'dog_food', label: 'Dog Food' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'partial', label: 'Partial' },
    { value: 'paid', label: 'Paid' }
  ];

  // Render edit history item
  const renderHistoryItem = (log) => {
    // Parse old and new values
    let oldValues = {};
    let newValues = {};
    
    try {
      oldValues = log.old_values ? JSON.parse(log.old_values) : {};
      newValues = log.new_values ? JSON.parse(log.new_values) : {};
    } catch (e) {
      console.error('Error parsing audit log values:', e);
    }
    
    // Get changed fields
    const changedFields = [];
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
    
    allKeys.forEach(key => {
      const oldValue = oldValues[key];
      const newValue = newValues[key];
      
      // Only show fields that actually changed
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changedFields.push({ key, oldValue, newValue });
      }
    });
    
    // Skip if no relevant changes
    if (changedFields.length === 0) {
      return null;
    }
    
    return (
      <div key={log.id} className="history-item">
        <div className="history-header">
          <div className="history-meta">
            <span className="history-timestamp">{formatDate(log.created_at)}</span>
            <span className="history-user">{log.users?.full_name || 'Unknown User'}</span>
          </div>
        </div>
        <div className="history-changes">
          <div className="changes-list">
            {changedFields.map(({ key, oldValue, newValue }) => (
              <div key={key} className="change-item">
                <div className="change-field">
                  <span className="field-label">{key.replace(/_/g, ' ')}</span>
                </div>
                <div className="change-values">
                  <span className="old-value">
                    {oldValue === null || oldValue === undefined ? 'N/A' : oldValue.toString()}
                  </span>
                  <span className="change-arrow">→</span>
                  <span className="new-value">
                    {newValue === null || newValue === undefined ? 'N/A' : newValue.toString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingOrder ? 'Edit Order' : 'Add New Order'}
      size="large"
      loading={loading}
      error={errors.submit}
    >
      <form onSubmit={handleSubmit} className="order-form">
        {/* Modal Header with History Toggle */}
        {editingOrder && (
          <div className="modal-header">
            <h2>{editingOrder ? 'Edit Order' : 'Add New Order'}</h2>
            <button
              type="button"
              className="btn-history-toggle"
              onClick={() => setShowHistory(!showHistory)}
              disabled={historyLoading}
            >
              {showHistory ? 'Hide History' : 'Show Edit History'}
            </button>
          </div>
        )}

        {/* Edit History Section */}
        {editingOrder && showHistory && (
          <div className="edit-history-section">
            <h3>Edit History</h3>
            {historyLoading ? (
              <div className="history-loading">Loading edit history...</div>
            ) : editHistory.length > 0 ? (
              <>
                <div className="history-list">
                  {editHistory.map(renderHistoryItem).filter(item => item !== null)}
                </div>
                {editHistory.filter(log => {
                  try {
                    const oldValues = log.old_values ? JSON.parse(log.old_values) : {};
                    const newValues = log.new_values ? JSON.parse(log.new_values) : {};
                    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
                    return Array.from(allKeys).some(key =>
                      JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])
                    );
                  } catch (e) {
                    return false;
                  }
                }).length === 0 && (
                  <div className="no-relevant-changes">
                    <p>No relevant changes found in edit history</p>
                  </div>
                )}
              </>
            ) : (
              <div className="no-history">
                <p>No edit history available for this order</p>
              </div>
            )}
          </div>
        )}

        {/* Customer Information */}
        <div className="form-section">
          <h4>Customer Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">
                Order Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={errors.date ? 'error' : ''}
              />
              {errors.date && <span className="error-message">{errors.date}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="customer">
                Customer Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="customer"
                name="customer"
                value={formData.customer}
                onChange={handleInputChange}
                placeholder="Enter customer name"
                className={errors.customer ? 'error' : ''}
              />
              {errors.customer && <span className="error-message">{errors.customer}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter delivery location"
              />
            </div>
          </div>
        </div>

        {/* Order Configuration */}
        <div className="form-section">
          <h4>Order Configuration</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="calculation_mode">Calculation Mode</label>
              <select
                id="calculation_mode"
                name="calculation_mode"
                value={formData.calculation_mode}
                onChange={handleInputChange}
              >
                {calculationModes.map(mode => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="inventory_type">Inventory Type</label>
              <select
                id="inventory_type"
                name="inventory_type"
                value={formData.inventory_type}
                onChange={handleInputChange}
              >
                {inventoryTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.inventory_type === 'parts' && (
            <div className="form-group">
              <label htmlFor="part_type">
                Part Type <span className="required">*</span>
              </label>
              <select
                id="part_type"
                name="part_type"
                value={formData.part_type}
                onChange={handleInputChange}
                className={errors.part_type ? 'error' : ''}
              >
                <option value="">Select Part Type</option>
                {partTypes.map(part => (
                  <option key={part.value} value={part.value}>
                    {part.label}
                  </option>
                ))}
              </select>
              {errors.part_type && <span className="error-message">{errors.part_type}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="batch_id">Batch (Optional)</label>
            <select
              id="batch_id"
              name="batch_id"
              value={formData.batch_id}
              onChange={handleInputChange}
            >
              <option value="">No specific batch</option>
              {availableBatches.map(batch => (
                <option key={batch.id} value={batch.id}>
                  {batch.batch_id} - Available: {
                    formData.inventory_type === 'live'
                      ? batch.current_count
                      : formData.inventory_type === 'parts' && formData.part_type
                        ? batch.parts_count?.[formData.part_type] || 0
                        : getWholeChickenCount(batch)
                  }
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Order Details */}
        <div className="form-section">
          <h4>Order Details</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="count">
                Count {formData.calculation_mode !== 'size_cost' && <span className="required">*</span>}
              </label>
              <input
                type="number"
                id="count"
                name="count"
                value={formData.count}
                onChange={handleInputChange}
                min="0"
                step="1"
                placeholder="Number of items"
                className={errors.count ? 'error' : ''}
                disabled={formData.calculation_mode === 'size_cost'}
                style={{
                  opacity: formData.calculation_mode === 'size_cost' ? 0.5 : 1,
                  cursor: formData.calculation_mode === 'size_cost' ? 'not-allowed' : 'text'
                }}
              />
              {formData.calculation_mode === 'size_cost' && (
                <small className="form-help">Count field is disabled for Size × Price calculation mode</small>
              )}
              {errors.count && <span className="error-message">{errors.count}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="size">
                Size/Weight (kg) {formData.calculation_mode !== 'count_cost' && <span className="required">*</span>}
              </label>
              <input
                type="number"
                id="size"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                placeholder="Total weight"
                className={errors.size ? 'error' : ''}
                disabled={formData.calculation_mode === 'count_cost'}
                style={{
                  opacity: formData.calculation_mode === 'count_cost' ? 0.5 : 1,
                  cursor: formData.calculation_mode === 'count_cost' ? 'not-allowed' : 'text'
                }}
              />
              {formData.calculation_mode === 'count_cost' && (
                <small className="form-help">Size field is disabled for Count × Price calculation mode</small>
              )}
              {errors.size && <span className="error-message">{errors.size}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">
                Price per Unit <span className="required">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                placeholder="Price per unit"
                className={errors.price ? 'error' : ''}
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="amount_paid">Amount Paid</label>
              <input
                type="number"
                id="amount_paid"
                name="amount_paid"
                value={formData.amount_paid}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                placeholder="Amount paid"
              />
              <small className="form-help">
                Enter the amount paid by the customer
              </small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Payment Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <small className="form-help">
                Auto-calculated based on amount paid vs total cost, but can be manually adjusted
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="balance">Balance</label>
              <input
                type="number"
                id="balance"
                name="balance"
                value={formData.balance}
                readOnly
                className="readonly-field"
                style={{
                  backgroundColor: '#f5f5f5',
                  cursor: 'not-allowed'
                }}
              />
              <small className="form-help">
                Auto-calculated: Total Cost - Amount Paid
              </small>
            </div>
          </div>

          {/* Total Cost Display */}
          <div className="total-cost-section">
            <div className="total-cost-display">
              <h4>Total Cost</h4>
              <div className="total-amount">
                ₦{totalCost.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (editingOrder ? 'Update Order' : 'Add Order')}
          </button>
        </div>
      </form>
    </EnhancedModal>
  );
};

export default OrderForm;