import React, { useMemo } from 'react';
import { DataTable, StatusBadge } from '../UI';
import { formatNumber, formatDate } from '../../utils/formatters';
import './ChickenOrders.css';

const CustomerManagement = ({
  orders = [],
  onViewCustomer,
  onEditOrder,
  loading = false
}) => {
  // Group orders by customer
  const customerData = useMemo(() => {
    const customerMap = new Map();

    orders.forEach(order => {
      const customerId = order.customer.toLowerCase().trim();
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          name: order.customer,
          phone: order.phone || '',
          location: order.location || '',
          orders: [],
          totalOrders: 0,
          totalValue: 0,
          totalPaid: 0,
          totalBalance: 0,
          lastOrderDate: null,
          statusCounts: {
            pending: 0,
            partial: 0,
            paid: 0
          }
        });
      }

      const customer = customerMap.get(customerId);
      customer.orders.push(order);
      customer.totalOrders++;

      // Calculate order total
      let orderTotal = 0;
      if (order.calculation_mode === 'count_cost') {
        orderTotal = order.count * order.price;
      } else if (order.calculation_mode === 'size_cost') {
        orderTotal = order.size * order.price;
      } else {
        orderTotal = order.count * order.size * order.price;
      }

      customer.totalValue += orderTotal;
      customer.totalPaid += order.amount_paid || 0;
      customer.totalBalance += orderTotal - (order.amount_paid || 0);
      customer.statusCounts[order.status]++;

      // Update last order date
      const orderDate = new Date(order.date);
      if (!customer.lastOrderDate || orderDate > customer.lastOrderDate) {
        customer.lastOrderDate = orderDate;
      }

      // Update contact info if more recent
      if (order.phone && !customer.phone) {
        customer.phone = order.phone;
      }
      if (order.location && !customer.location) {
        customer.location = order.location;
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => b.totalValue - a.totalValue);
  }, [orders]);

  // Table columns
  const columns = [
    {
      key: 'name',
      label: 'Customer',
      sortable: true,
      render: (customer) => (
        <div className="customer-details">
          <div className="customer-name">{customer.name}</div>
          {customer.phone && (
            <div className="customer-phone">📞 {customer.phone}</div>
          )}
          {customer.location && (
            <div className="customer-location">📍 {customer.location}</div>
          )}
        </div>
      )
    },
    {
      key: 'totalOrders',
      label: 'Total Orders',
      sortable: true,
      render: (customer) => (
        <div className="order-count">
          <span className="count-badge">{customer.totalOrders}</span>
        </div>
      )
    },
    {
      key: 'totalValue',
      label: 'Total Value',
      sortable: true,
      render: (customer) => (
        <div className="value-amount">
          ₦{formatNumber(customer.totalValue, 2)}
        </div>
      )
    },
    {
      key: 'totalPaid',
      label: 'Amount Paid',
      sortable: true,
      render: (customer) => (
        <div className="paid-amount">
          ₦{formatNumber(customer.totalPaid, 2)}
        </div>
      )
    },
    {
      key: 'totalBalance',
      label: 'Balance Due',
      sortable: true,
      render: (customer) => (
        <div className={`balance-amount ${customer.totalBalance > 0 ? 'balance-due' : 'balance-paid'}`}>
          ₦{formatNumber(customer.totalBalance, 2)}
        </div>
      )
    },
    {
      key: 'lastOrderDate',
      label: 'Last Order',
      sortable: true,
      render: (customer) => (
        <div className="last-order">
          {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'N/A'}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status Distribution',
      render: (customer) => (
        <div className="status-distribution">
          {Object.entries(customer.statusCounts).map(([status, count]) => (
            count > 0 && (
              <div key={status} className="status-item">
                <StatusBadge status={status} variant="dot" />
                <span className="status-count">{count}</span>
              </div>
            )
          ))}
        </div>
      )
    }
  ];

  // Row actions
  const renderActions = (customer) => (
    <div className="action-buttons">
      <button
        className="btn btn-sm btn-outline-primary"
        onClick={() => onViewCustomer(customer)}
        title="View Customer Details"
      >
        👁️ View
      </button>
    </div>
  );

  // Summary statistics
  const summaryStats = useMemo(() => {
    return {
      totalCustomers: customerData.length,
      totalValue: customerData.reduce((sum, customer) => sum + customer.totalValue, 0),
      totalBalance: customerData.reduce((sum, customer) => sum + customer.totalBalance, 0),
      activeCustomers: customerData.filter(customer => 
        customer.lastOrderDate && 
        (new Date() - customer.lastOrderDate) / (1000 * 60 * 60 * 24) <= 30
      ).length
    };
  }, [customerData]);

  return (
    <div className="customer-management">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">👥</div>
          <div className="summary-content">
            <h4>Total Customers</h4>
            <p className="summary-value">{formatNumber(summaryStats.totalCustomers)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">🔥</div>
          <div className="summary-content">
            <h4>Active Customers</h4>
            <p className="summary-value">{formatNumber(summaryStats.activeCustomers)}</p>
            <small>(Last 30 days)</small>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h4>Total Revenue</h4>
            <p className="summary-value">₦{formatNumber(summaryStats.totalValue, 2)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">⏳</div>
          <div className="summary-content">
            <h4>Outstanding Balance</h4>
            <p className="summary-value balance-due">₦{formatNumber(summaryStats.totalBalance, 2)}</p>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="top-customers">
        <h4>Top Customers by Value</h4>
        <div className="top-customer-list">
          {customerData.slice(0, 5).map((customer, index) => (
            <div key={customer.name} className="top-customer-item">
              <div className="customer-rank">#{index + 1}</div>
              <div className="customer-info">
                <div className="customer-name">{customer.name}</div>
                <div className="customer-stats">
                  {customer.totalOrders} orders • ₦{formatNumber(customer.totalValue, 2)}
                </div>
              </div>
              <div className="customer-actions">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => onViewCustomer(customer)}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Table */}
      <div className="customer-table-section">
        <h4>All Customers</h4>
        <DataTable
          data={customerData}
          columns={columns}
          loading={loading}
          enableSorting
          enablePagination
          enableSearch
          searchPlaceholder="Search customers..."
          renderActions={renderActions}
          emptyMessage="No customers found"
          storageKey="customerManagement"
        />
      </div>
    </div>
  );
};

// Customer Detail Modal Component
export const CustomerDetailModal = ({
  isOpen,
  onClose,
  customer,
  onEditOrder
}) => {
  if (!customer) return null;

  const orderColumns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (order) => formatDate(order.date)
    },
    {
      key: 'inventory_type',
      label: 'Type',
      render: (order) => (
        <span className={`type-badge type-${order.inventory_type}`}>
          {order.inventory_type === 'live' ? 'Live' : 
           order.inventory_type === 'dressed' ? 'Dressed' : 'Parts'}
        </span>
      )
    },
    {
      key: 'count',
      label: 'Count',
      render: (order) => formatNumber(order.count)
    },
    {
      key: 'size',
      label: 'Size (kg)',
      render: (order) => formatNumber(order.size, 2)
    },
    {
      key: 'total',
      label: 'Total',
      render: (order) => {
        let total = 0;
        if (order.calculation_mode === 'count_cost') {
          total = order.count * order.price;
        } else if (order.calculation_mode === 'size_cost') {
          total = order.size * order.price;
        } else {
          total = order.count * order.size * order.price;
        }
        return `₦${formatNumber(total, 2)}`;
      }
    },
    {
      key: 'amount_paid',
      label: 'Paid',
      render: (order) => `₦${formatNumber(order.amount_paid || 0, 2)}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (order) => <StatusBadge status={order.status} variant="pill" />
    }
  ];

  const renderOrderActions = (order) => (
    <button
      className="btn btn-sm btn-outline-primary"
      onClick={() => onEditOrder(order)}
      title="Edit Order"
    >
      ✏️
    </button>
  );

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal-content customer-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Customer Details: {customer.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="customer-detail-content">
          {/* Customer Info */}
          <div className="customer-info-section">
            <div className="info-grid">
              <div className="info-item">
                <label>Name:</label>
                <span>{customer.name}</span>
              </div>
              <div className="info-item">
                <label>Phone:</label>
                <span>{customer.phone || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Location:</label>
                <span>{customer.location || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Total Orders:</label>
                <span>{customer.totalOrders}</span>
              </div>
              <div className="info-item">
                <label>Total Value:</label>
                <span>₦{formatNumber(customer.totalValue, 2)}</span>
              </div>
              <div className="info-item">
                <label>Balance Due:</label>
                <span className={customer.totalBalance > 0 ? 'balance-due' : 'balance-paid'}>
                  ₦{formatNumber(customer.totalBalance, 2)}
                </span>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="customer-orders-section">
            <h4>Order History</h4>
            <DataTable
              data={customer.orders}
              columns={orderColumns}
              enableSorting
              enablePagination
              renderActions={renderOrderActions}
              emptyMessage="No orders found"
              pageSize={10}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
