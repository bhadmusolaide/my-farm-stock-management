import React, { useMemo } from 'react';
import { DataTable, StatusBadge, FilterPanel } from '../UI';
import { formatNumber, formatDate } from '../../utils/formatters';
import './ChickenOrders.css';

const OrderList = ({
  orders = [],
  onEdit,
  onDelete,
  onBatchUpdate,
  filters,
  onFiltersChange,
  selectedOrders = [],
  onOrderSelect,
  onSelectAll,
  loading = false
}) => {
  // Filter configuration
  const filterConfig = [
    {
      key: 'customer',
      type: 'text',
      label: 'Customer',
      placeholder: 'Search by customer name...'
    },
    {
      key: 'status',
      type: 'select',
      label: 'Status',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    },
    {
      key: 'inventoryType',
      type: 'select',
      label: 'Inventory Type',
      options: [
        { value: '', label: 'All Types' },
        { value: 'live', label: 'Live Chickens' },
        { value: 'dressed', label: 'Dressed Chickens' },
        { value: 'parts', label: 'Chicken Parts' }
      ]
    },
    {
      key: 'dateRange',
      type: 'dateRange',
      label: 'Date Range',
      startKey: 'startDate',
      endKey: 'endDate'
    }
  ];

  // Apply filters to orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Customer filter
      if (filters.customer && !order.customer.toLowerCase().includes(filters.customer.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.status && order.status !== filters.status) {
        return false;
      }

      // Inventory type filter
      if (filters.inventoryType && order.inventory_type !== filters.inventoryType) {
        return false;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const orderDate = new Date(order.date);
        if (filters.startDate && orderDate < new Date(filters.startDate)) {
          return false;
        }
        if (filters.endDate && orderDate > new Date(filters.endDate)) {
          return false;
        }
      }

      return true;
    });
  }, [orders, filters]);

  // Table columns configuration
  const columns = [
    {
      key: 'select',
      label: '',
      width: '50px',
      render: (order) => (
        <input
          type="checkbox"
          checked={selectedOrders.includes(order.id)}
          onChange={() => onOrderSelect(order.id)}
          aria-label={`Select order for ${order.customer}`}
        />
      )
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (order) => formatDate(order.date)
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (order) => (
        <div className="customer-info">
          <div className="customer-name">{order.customer}</div>
          {order.phone && (
            <div className="customer-phone">{order.phone}</div>
          )}
          {order.location && (
            <div className="customer-location">{order.location}</div>
          )}
        </div>
      )
    },
    {
      key: 'inventory_type',
      label: 'Type',
      sortable: true,
      render: (order) => (
        <div className="inventory-type">
          <span className={`type-badge type-${order.inventory_type}`}>
            {order.inventory_type === 'live' ? 'Live' : 
             order.inventory_type === 'dressed' ? 'Dressed' : 'Parts'}
          </span>
          {order.part_type && (
            <div className="part-type">{order.part_type}</div>
          )}
        </div>
      )
    },
    {
      key: 'count',
      label: 'Count',
      sortable: true,
      render: (order) => formatNumber(order.count)
    },
    {
      key: 'size',
      label: 'Size (kg)',
      sortable: true,
      render: (order) => formatNumber(order.size, 2)
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (order) => `₦${formatNumber(order.price, 2)}`
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (order) => {
        let total = 0;
        if (order.calculation_mode === 'count_cost') {
          total = order.count * order.price;
        } else if (order.calculation_mode === 'size_cost') {
          total = order.size * order.price;
        } else {
          total = order.size * order.price; // count_size_cost
        }
        return `₦${formatNumber(total, 2)}`;
      }
    },
    {
      key: 'amount_paid',
      label: 'Paid',
      sortable: true,
      render: (order) => `₦${formatNumber(order.amount_paid || 0, 2)}`
    },
    {
      key: 'balance',
      label: 'Balance',
      sortable: true,
      render: (order) => {
        let total = 0;
        if (order.calculation_mode === 'count_cost') {
          total = order.count * order.price;
        } else if (order.calculation_mode === 'size_cost') {
          total = order.size * order.price;
        } else {
          total = order.size * order.price;
        }
        const balance = total - (order.amount_paid || 0);
        return (
          <span className={balance > 0 ? 'balance-due' : 'balance-paid'}>
            ₦{formatNumber(balance, 2)}
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (order) => (
        <StatusBadge 
          status={order.status}
          variant="pill"
          showIcon
        />
      )
    },
    {
      key: 'batch_id',
      label: 'Batch',
      render: (order) => order.batch_id || 'N/A'
    }
  ];

  // Row actions
  const renderActions = (order) => (
    <div className="action-buttons">
      <button
        className="btn btn-sm btn-outline-primary"
        onClick={() => onEdit(order)}
        title="Edit Order"
      >
        ✏️
      </button>
      <button
        className="btn btn-sm btn-outline-danger"
        onClick={() => onDelete(order.id)}
        title="Delete Order"
      >
        🗑️
      </button>
    </div>
  );

  // Header actions
  const headerActions = (
    <div className="list-actions">
      {selectedOrders.length > 0 && (
        <button
          className="btn btn-outline-primary"
          onClick={onBatchUpdate}
        >
          Batch Update ({selectedOrders.length})
        </button>
      )}
    </div>
  );

  // Summary statistics
  const summaryStats = useMemo(() => {
    const stats = {
      totalOrders: filteredOrders.length,
      totalValue: 0,
      totalPaid: 0,
      totalBalance: 0,
      statusCounts: {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
      }
    };

    filteredOrders.forEach(order => {
      // Calculate total value
      let total = 0;
      if (order.calculation_mode === 'count_cost') {
        total = order.count * order.price;
      } else if (order.calculation_mode === 'size_cost') {
        total = order.size * order.price;
      } else {
        total = order.size * order.price;
      }

      stats.totalValue += total;
      stats.totalPaid += order.amount_paid || 0;
      stats.totalBalance += total - (order.amount_paid || 0);
      stats.statusCounts[order.status] = (stats.statusCounts[order.status] || 0) + 1;
    });

    return stats;
  }, [filteredOrders]);

  return (
    <div className="order-list">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">📋</div>
          <div className="summary-content">
            <h4>Total Orders</h4>
            <p className="summary-value">{formatNumber(summaryStats.totalOrders)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h4>Total Value</h4>
            <p className="summary-value">₦{formatNumber(summaryStats.totalValue, 2)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <h4>Amount Paid</h4>
            <p className="summary-value">₦{formatNumber(summaryStats.totalPaid, 2)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">⏳</div>
          <div className="summary-content">
            <h4>Balance Due</h4>
            <p className="summary-value balance-due">₦{formatNumber(summaryStats.totalBalance, 2)}</p>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="status-distribution">
        <h4>Status Distribution</h4>
        <div className="status-cards">
          {Object.entries(summaryStats.statusCounts).map(([status, count]) => (
            <div key={status} className={`status-card status-${status}`}>
              <StatusBadge status={status} variant="pill" />
              <span className="status-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        filters={filters}
        onFiltersChange={onFiltersChange}
        filterConfig={filterConfig}
        collapsible
        title="Filter Orders"
      />

      {/* Data Table */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        loading={loading}
        enableSorting
        enablePagination
        enableSearch
        searchPlaceholder="Search orders..."
        renderActions={renderActions}
        headerActions={headerActions}
        emptyMessage="No orders found"
        rowClassName={(order) => {
          const classes = [];
          if (selectedOrders.includes(order.id)) {
            classes.push('selected');
          }
          if (order.status === 'cancelled') {
            classes.push('cancelled-order');
          }
          return classes.join(' ');
        }}
        onSelectAll={(checked) => {
          if (checked) {
            onSelectAll(filteredOrders.map(order => order.id));
          } else {
            onSelectAll([]);
          }
        }}
        selectAllChecked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
        storageKey="orderList"
      />
    </div>
  );
};

export default OrderList;
