import React, { useMemo } from 'react';
import { DataTable, StatusBadge, FilterPanel } from '../UI';
import { formatNumber, formatDate } from '../../utils/formatters';
import {
  useTableFilters,
  useStatusFilter,
  useDateRangeFilter
} from '../../hooks';
import './ChickenOrders.css';

const OrderList = ({
  orders = [],
  onEdit,
  onDelete,
  onBatchUpdate,
  selectedOrders = [],
  onOrderSelect,
  onSelectAll,
  loading = false
}) => {
  // Use custom hooks for filtering and table operations
  const {
    filteredData: filteredOrders,
    filters,
    searchTerm,
    updateFilter,
    removeFilter,
    clearAllFilters,
    setSearchTerm,
    handleSort,
    getFilterSummary
  } = useTableFilters(orders, {
    searchFields: ['customer', 'phone', 'address', 'notes'],
    defaultFilters: {},
    caseSensitive: false
  });

  const {
    filteredData: statusFilteredOrders,
    selectedStatuses,
    availableStatuses,
    toggleStatus,
    clearStatusFilter,
    getStatusSummary
  } = useStatusFilter(filteredOrders, 'status', {
    allowMultiple: true,
    defaultStatuses: []
  });

  const {
    filteredData: dateFilteredOrders,
    dateRange,
    selectedPreset,
    presets,
    applyPreset,
    setCustomRange,
    clearDateFilter
  } = useDateRangeFilter(statusFilteredOrders, 'date');

  // Selection is managed by parent component via props

  // Final filtered data
  const finalFilteredOrders = dateFilteredOrders;

  // Handler for filter changes
  const onFiltersChange = (newFilters) => {
    Object.entries(newFilters).forEach(([key, value]) => {
      if (key === 'search') {
        // Handle search separately using setSearchTerm
        setSearchTerm(value || '');
      } else if (value === null || value === undefined || value === '') {
        removeFilter(key);
      } else {
        updateFilter(key, value);
      }
    });
  };

  // Order selection is handled by parent component via onOrderSelect prop

  // Handler for select all - this is passed from parent
  // const onSelectAll is already provided as a prop

  // Enhanced filter configuration using custom hooks
  // Combine search term and filters for FilterPanel
  const combinedFilters = {
    search: searchTerm,
    ...filters
  };

  const filterConfig = [
    {
      key: 'search',
      type: 'search',
      label: 'Search Orders',
      placeholder: 'Search by customer, phone, address...'
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
      key: 'paymentStatus',
      type: 'select',
      label: 'Payment Status',
      options: [
        { value: '', label: 'All Payment Status' },
        { value: 'paid', label: 'Fully Paid' },
        { value: 'partial', label: 'Partially Paid' },
        { value: 'unpaid', label: 'Unpaid' }
      ]
    }
  ];

  // Status filter component data
  const statusFilterData = {
    selectedStatuses,
    availableStatuses,
    onToggleStatus: toggleStatus,
    onClearFilter: clearStatusFilter,
    summary: getStatusSummary()
  };

  // Date range filter data
  const dateFilterData = {
    dateRange,
    selectedPreset,
    presets,
    onApplyPreset: applyPreset,
    onSetCustomRange: setCustomRange,
    onClearFilter: clearDateFilter,
    type: 'dateRange',
    label: 'Date Range',
    startKey: 'startDate',
    endKey: 'endDate'
  };

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
        const calcMode = order.calculation_mode || 'count_size_cost';

        // Convert to numbers explicitly - this is likely the issue!
        const count = parseFloat(order.count) || 0;
        const size = parseFloat(order.size) || 0;
        const price = parseFloat(order.price) || 0;

        if (calcMode === 'count_cost') {
          total = count * price;
        } else if (calcMode === 'size_cost') {
          total = size * price;
        } else if (calcMode === 'size_cost_only') {
          total = size * price;  // Size × Price for amount, Count only for inventory deduction
        } else {
          // Default: count_size_cost
          total = count * size * price;
        }

        return total > 0 ? `₦${formatNumber(total, 2)}` : '-';
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
        // If status is paid, balance should always be 0
        if (order.status === 'paid') {
          return (
            <span className="balance-paid">
              ₦{formatNumber(0, 2)}
            </span>
          );
        }

        let total = 0;
        const calcMode = order.calculation_mode || 'count_size_cost';

        // Convert to numbers explicitly
        const count = parseFloat(order.count) || 0;
        const size = parseFloat(order.size) || 0;
        const price = parseFloat(order.price) || 0;
        const amountPaid = parseFloat(order.amount_paid) || 0;

        if (calcMode === 'count_cost') {
          total = count * price;
        } else if (calcMode === 'size_cost') {
          total = size * price;
        } else if (calcMode === 'size_cost_only') {
          total = size * price;  // Size × Price for amount, Count only for inventory deduction
        } else {
          // Default: count_size_cost
          total = count * size * price;
        }

        const balance = total - amountPaid;
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
      totalOrders: finalFilteredOrders.length,
      totalValue: 0,
      totalPaid: 0,
      totalBalance: 0,
      statusCounts: {
        pending: 0,
        partial: 0,
        paid: 0
      }
    };

    finalFilteredOrders.forEach(order => {
      // Calculate total value
      let total = 0;
      const calcMode = order.calculation_mode || 'count_size_cost';

      // Convert to numbers explicitly
      const count = parseFloat(order.count) || 0;
      const size = parseFloat(order.size) || 0;
      const price = parseFloat(order.price) || 0;
      const amountPaid = parseFloat(order.amount_paid) || 0;

      if (calcMode === 'count_cost') {
        total = count * price;
      } else if (calcMode === 'size_cost') {
        total = size * price;
      } else if (calcMode === 'size_cost_only') {
        total = size * price;  // Size × Price for amount, Count only for inventory deduction
      } else {
        // Default: count_size_cost
        total = count * size * price;
      }

      stats.totalValue += total;
      stats.totalPaid += amountPaid;

      // For balance calculation, use the same logic as the table display
      if (order.status === 'paid') {
        stats.totalBalance += 0; // Paid orders contribute 0 to balance
      } else {
        stats.totalBalance += total - amountPaid;
      }

      stats.statusCounts[order.status] = (stats.statusCounts[order.status] || 0) + 1;
    });

    return stats;
  }, [finalFilteredOrders]);

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
        filters={combinedFilters}
        onFiltersChange={onFiltersChange}
        filterConfig={filterConfig}
        collapsible
        title="Filter Orders"
      />

      {/* Data Table */}
      <DataTable
        data={finalFilteredOrders}
        columns={columns}
        loading={loading}
        enableSorting
        enablePagination={false}
        enableSearch={false}
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
            onSelectAll(finalFilteredOrders.map(order => order.id));
          } else {
            onSelectAll([]);
          }
        }}
        selectAllChecked={selectedOrders.length === finalFilteredOrders.length && finalFilteredOrders.length > 0}
        storageKey="orderList"
      />
    </div>
  );
};

export default OrderList;
