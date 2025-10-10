import React, { useState, useEffect } from 'react';
import { EnhancedModal } from '../UI';
import { formatNumber } from '../../utils/formatters';
import './ChickenOrders.css';

const BatchUpdateModal = ({
  isOpen,
  onClose,
  onSubmit,
  selectedOrders = [],
  orders = [],
  loading = false
}) => {
  const [updateData, setUpdateData] = useState({
    status: '',
    amount_paid: '',
    updateType: 'status' // 'status', 'payment', 'both'
  });

  const [errors, setErrors] = useState({});

  // Get selected order details
  const selectedOrderDetails = orders.filter(order =>
    selectedOrders.includes(order.id)
  );

  // Calculate totals for selected orders
  const totals = selectedOrderDetails.reduce((acc, order) => {
    let orderTotal = 0;
    if (order.calculation_mode === 'count_cost') {
      orderTotal = order.count * order.price;
    } else if (order.calculation_mode === 'size_cost') {
      orderTotal = order.size * order.price;
    } else {
      // Default: count_size_cost
      orderTotal = order.count * order.size * order.price;
    }

    acc.totalValue += orderTotal;
    acc.totalPaid += order.amount_paid || 0;
    acc.totalBalance += orderTotal - (order.amount_paid || 0);
    return acc;
  }, { totalValue: 0, totalPaid: 0, totalBalance: 0 });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setUpdateData({
        status: '',
        amount_paid: '',
        updateType: 'status'
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateData(prev => ({
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

    if (updateData.updateType === 'status' || updateData.updateType === 'both') {
      if (!updateData.status) {
        newErrors.status = 'Status is required';
      }
    }

    if (updateData.updateType === 'payment' || updateData.updateType === 'both') {
      if (!updateData.amount_paid || parseFloat(updateData.amount_paid) < 0) {
        newErrors.amount_paid = 'Amount paid must be 0 or greater';
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

    // Prepare batch update data with balance recalculation
    const updatedOrders = selectedOrderDetails.map(order => {
      let orderTotal = 0;
      if (order.calculation_mode === 'count_cost') {
        orderTotal = order.count * order.price;
      } else if (order.calculation_mode === 'size_cost') {
        orderTotal = order.size * order.price;
      } else {
        orderTotal = order.count * order.size * order.price;
      }

      const newAmountPaid = updateData.updateType === 'payment' || updateData.updateType === 'both'
        ? parseFloat(updateData.amount_paid)
        : order.amount_paid;

      const newBalance = Math.max(0, orderTotal - newAmountPaid);

      return {
        id: order.id,
        status: updateData.updateType === 'status' || updateData.updateType === 'both'
          ? updateData.status
          : order.status,
        amount_paid: newAmountPaid,
        balance: newBalance
      };
    });

    const batchData = {
      orderIds: selectedOrders,
      updateType: updateData.updateType,
      status: updateData.updateType === 'status' || updateData.updateType === 'both'
        ? updateData.status
        : undefined,
      amount_paid: updateData.updateType === 'payment' || updateData.updateType === 'both'
        ? parseFloat(updateData.amount_paid)
        : undefined,
      updatedOrders: updatedOrders // Include recalculated balances
    };

    try {
      await onSubmit(batchData);
      onClose();
    } catch (error) {
      console.error('Failed to update orders:', error);
      setErrors({ submit: 'Failed to update orders. Please try again.' });
    }
  };

  const statusOptions = [
    { value: '', label: 'Select Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const updateTypeOptions = [
    { value: 'status', label: 'Update Status Only' },
    { value: 'payment', label: 'Update Payment Only' },
    { value: 'both', label: 'Update Both Status and Payment' }
  ];

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Batch Update Orders"
      size="medium"
      loading={loading}
      error={errors.submit}
    >
      <div className="batch-update-content">
        {/* Selection Summary */}
        <div className="selection-summary">
          <h4>Selected Orders Summary</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <label>Orders Selected:</label>
              <span className="summary-value">{selectedOrders.length}</span>
            </div>
            <div className="summary-item">
              <label>Total Value:</label>
              <span className="summary-value">₦{formatNumber(totals.totalValue, 2)}</span>
            </div>
            <div className="summary-item">
              <label>Amount Paid:</label>
              <span className="summary-value">₦{formatNumber(totals.totalPaid, 2)}</span>
            </div>
            <div className="summary-item">
              <label>Balance Due:</label>
              <span className="summary-value balance-due">₦{formatNumber(totals.totalBalance, 2)}</span>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSubmit} className="batch-update-form">
          <div className="form-group">
            <label htmlFor="updateType">
              Update Type <span className="required">*</span>
            </label>
            <select
              id="updateType"
              name="updateType"
              value={updateData.updateType}
              onChange={handleInputChange}
            >
              {updateTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {(updateData.updateType === 'status' || updateData.updateType === 'both') && (
            <div className="form-group">
              <label htmlFor="status">
                New Status <span className="required">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={updateData.status}
                onChange={handleInputChange}
                className={errors.status ? 'error' : ''}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.status && <span className="error-message">{errors.status}</span>}
            </div>
          )}

          {(updateData.updateType === 'payment' || updateData.updateType === 'both') && (
            <div className="form-group">
              <label htmlFor="amount_paid">
                Amount Paid <span className="required">*</span>
              </label>
              <input
                type="number"
                id="amount_paid"
                name="amount_paid"
                value={updateData.amount_paid}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                placeholder="Enter amount paid"
                className={errors.amount_paid ? 'error' : ''}
              />
              {errors.amount_paid && <span className="error-message">{errors.amount_paid}</span>}
              <small className="form-help">
                This amount will be set for each selected order. Balance will be auto-recalculated.
              </small>
            </div>
          )}

          {/* Preview of Changes */}
          <div className="update-preview">
            <h4>Preview of Changes</h4>
            <div className="preview-content">
              <p>
                <strong>{selectedOrders.length}</strong> orders will be updated with:
              </p>
              <ul>
                {(updateData.updateType === 'status' || updateData.updateType === 'both') && updateData.status && (
                  <li>Status: <span className={`status-badge status-${updateData.status}`}>
                    {updateData.status.charAt(0).toUpperCase() + updateData.status.slice(1)}
                  </span></li>
                )}
                {(updateData.updateType === 'payment' || updateData.updateType === 'both') && updateData.amountPaid && (
                  <li>Amount Paid: <strong>₦{formatNumber(parseFloat(updateData.amountPaid), 2)}</strong> each</li>
                )}
              </ul>
            </div>
          </div>

          {/* Affected Orders List */}
          <div className="affected-orders">
            <h4>Affected Orders</h4>
            <div className="orders-list">
              {selectedOrderDetails.slice(0, 5).map(order => (
                <div key={order.id} className="order-item">
                  <div className="order-customer">{order.customer}</div>
                  <div className="order-details">
                    {order.count} × {formatNumber(order.size, 2)}kg - ₦{formatNumber(
                      order.calculation_mode === 'count_cost' 
                        ? order.count * order.price
                        : order.size * order.price, 2
                    )}
                  </div>
                  <div className={`order-status status-${order.status}`}>
                    {order.status}
                  </div>
                </div>
              ))}
              {selectedOrderDetails.length > 5 && (
                <div className="more-orders">
                  ... and {selectedOrderDetails.length - 5} more orders
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating...' : `Update ${selectedOrders.length} Orders`}
            </button>
          </div>
        </form>
      </div>
    </EnhancedModal>
  );
};

export default BatchUpdateModal;
