import React, { useMemo } from 'react';
import { DataTable, StatusBadge, FilterPanel } from '../UI';
import { formatNumber, formatDate } from '../../utils/formatters';
import { LOW_STOCK_THRESHOLD } from '../../utils/constants';
import './FeedManagement.css';

const FeedInventoryView = ({
  feedInventory = [],
  onEdit,
  onDelete,
  filters,
  onFiltersChange,
  loading = false
}) => {
  // Filter configuration
  const filterConfig = [
    {
      key: 'feed_type',
      type: 'select',
      label: 'Feed Type',
      options: [
        { value: '', label: 'All Feed Types' },
        ...Array.from(new Set(feedInventory.map(item => item.feed_type)))
          .map(type => ({ value: type, label: type }))
      ]
    },
    {
      key: 'brand',
      type: 'select',
      label: 'Brand',
      options: [
        { value: '', label: 'All Brands' },
        ...Array.from(new Set(feedInventory.map(item => item.brand)))
          .map(brand => ({ value: brand, label: brand }))
      ]
    },
    {
      key: 'supplier',
      type: 'text',
      label: 'Supplier',
      placeholder: 'Search by supplier...'
    },
    {
      key: 'stockStatus',
      type: 'select',
      label: 'Stock Status',
      options: [
        { value: '', label: 'All Stock Levels' },
        { value: 'low', label: 'Low Stock' },
        { value: 'normal', label: 'Normal Stock' },
        { value: 'out', label: 'Out of Stock' }
      ]
    },
    {
      key: 'dateRange',
      type: 'dateRange',
      label: 'Purchase Date Range',
      startKey: 'startDate',
      endKey: 'endDate'
    }
  ];

  // Apply filters to feed inventory
  const filteredInventory = useMemo(() => {
    return feedInventory.filter(item => {
      // Feed type filter
      if (filters.feed_type && item.feed_type !== filters.feed_type) {
        return false;
      }

      // Brand filter
      if (filters.brand && item.brand !== filters.brand) {
        return false;
      }

      // Supplier filter
      if (filters.supplier && !item.supplier?.toLowerCase().includes(filters.supplier.toLowerCase())) {
        return false;
      }

      // Stock status filter
      if (filters.stockStatus) {
        const quantity = item.quantity_kg || 0;
        if (filters.stockStatus === 'low' && quantity > LOW_STOCK_THRESHOLD) {
          return false;
        }
        if (filters.stockStatus === 'normal' && (quantity <= LOW_STOCK_THRESHOLD || quantity === 0)) {
          return false;
        }
        if (filters.stockStatus === 'out' && quantity > 0) {
          return false;
        }
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const purchaseDate = new Date(item.purchase_date);
        if (filters.startDate && purchaseDate < new Date(filters.startDate)) {
          return false;
        }
        if (filters.endDate && purchaseDate > new Date(filters.endDate)) {
          return false;
        }
      }

      return true;
    });
  }, [feedInventory, filters]);

  // Get stock status for an item
  const getStockStatus = (quantity) => {
    if (quantity === 0) return 'out';
    if (quantity <= LOW_STOCK_THRESHOLD) return 'low';
    return 'normal';
  };

  // Table columns configuration
  const columns = [
    {
      key: 'batch_number',
      label: 'Batch #',
      sortable: true,
      render: (item) => (
        <div className="batch-number">
          <strong>{item.batch_number || 'N/A'}</strong>
        </div>
      )
    },
    {
      key: 'purchase_date',
      label: 'Purchase Date',
      sortable: true,
      render: (item) => formatDate(item.purchase_date)
    },
    {
      key: 'feed_type',
      label: 'Feed Type',
      sortable: true,
      render: (item) => (
        <div className="feed-type">
          <span className="feed-type-name">{item.feed_type}</span>
        </div>
      )
    },
    {
      key: 'brand',
      label: 'Brand',
      sortable: true,
      render: (item) => (
        <div className="brand-info">
          <span className="brand-name">{item.brand}</span>
        </div>
      )
    },
    {
      key: 'quantity',
      label: 'Quantity',
      sortable: true,
      render: (item) => (
        <div className="quantity-info">
          <div className="quantity-kg">
            <strong>{formatNumber(item.quantity_kg, 2)} kg</strong>
          </div>
          <div className="quantity-bags">
            {formatNumber(item.number_of_bags)} bags
          </div>
        </div>
      )
    },
    {
      key: 'cost',
      label: 'Cost',
      sortable: true,
      render: (item) => {
        const costPerKg = item.cost_per_kg ||
          (item.cost_per_bag * item.number_of_bags) / item.quantity_kg;
        return (
          <div className="cost-info">
            <div className="cost-per-bag">
              ₦{formatNumber(item.cost_per_bag, 2)}/bag
            </div>
            <div className="cost-per-kg">
              ₦{formatNumber(costPerKg, 2)}/kg
            </div>
            <div className="total-cost">
              Total: ₦{formatNumber((item.number_of_bags || 1) * item.cost_per_bag, 2)}
            </div>
          </div>
        );
      }
    },
    {
      key: 'supplier',
      label: 'Supplier',
      sortable: true,
      render: (item) => item.supplier || 'N/A'
    },
    {
      key: 'stock_status',
      label: 'Stock Status',
      sortable: true,
      render: (item) => {
        const status = getStockStatus(item.quantity_kg);
        const statusConfig = {
          out: { label: 'Out of Stock', variant: 'danger' },
          low: { label: 'Low Stock', variant: 'warning' },
          normal: { label: 'In Stock', variant: 'success' }
        };
        
        return (
          <StatusBadge 
            status={status}
            variant="pill"
            showIcon
            customLabel={statusConfig[status].label}
            customVariant={statusConfig[status].variant}
          />
        );
      }
    },
    {
      key: 'expiry_date',
      label: 'Expiry Date',
      sortable: true,
      render: (item) => {
        if (!item.expiry_date) return 'N/A';
        
        const expiryDate = new Date(item.expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let className = 'expiry-date';
        if (daysUntilExpiry < 0) {
          className += ' expired';
        } else if (daysUntilExpiry <= 30) {
          className += ' expiring-soon';
        }
        
        return (
          <div className={className}>
            <div>{formatDate(item.expiry_date)}</div>
            {daysUntilExpiry < 0 && (
              <small className="expiry-warning">Expired {Math.abs(daysUntilExpiry)} days ago</small>
            )}
            {daysUntilExpiry >= 0 && daysUntilExpiry <= 30 && (
              <small className="expiry-warning">Expires in {daysUntilExpiry} days</small>
            )}
          </div>
        );
      }
    }
  ];

  // Row actions
  const renderActions = (item) => (
    <div className="action-buttons">
      <button
        className="btn btn-sm btn-outline-primary"
        onClick={() => onEdit(item)}
        title="Edit Feed Stock"
      >
        ✏️
      </button>
      <button
        className="btn btn-sm btn-outline-danger"
        onClick={() => onDelete(item.id)}
        title="Delete Feed Stock"
      >
        🗑️
      </button>
    </div>
  );

  // Summary statistics
  const summaryStats = useMemo(() => {
    const stats = {
      totalItems: filteredInventory.length,
      totalQuantity: 0,
      totalValue: 0,
      totalAssigned: 0,
      remainingFeed: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      expiringItems: 0
    };

    const today = new Date();

    filteredInventory.forEach(item => {
      const itemQuantity = item.quantity_kg || 0;
      stats.totalQuantity += itemQuantity;
      stats.totalValue += (item.number_of_bags || 1) * item.cost_per_bag;

      // Calculate total assigned for this item
      const itemAssigned = (item.assigned_batches || []).reduce(
        (sum, assignment) => sum + (assignment.assigned_quantity_kg || 0),
        0
      );
      stats.totalAssigned += itemAssigned;

      const status = getStockStatus(item.quantity_kg);
      if (status === 'low') stats.lowStockItems++;
      if (status === 'out') stats.outOfStockItems++;

      if (item.expiry_date) {
        const expiryDate = new Date(item.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
          stats.expiringItems++;
        }
      }
    });

    // Calculate remaining feed (total - assigned)
    stats.remainingFeed = stats.totalQuantity - stats.totalAssigned;

    return stats;
  }, [filteredInventory]);

  // Row className function
  const getRowClassName = (item) => {
    const classes = [];
    const status = getStockStatus(item.quantity_kg);
    
    if (status === 'out') {
      classes.push('out-of-stock-row');
    } else if (status === 'low') {
      classes.push('low-stock-row');
    }
    
    if (item.expiry_date) {
      const expiryDate = new Date(item.expiry_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        classes.push('expired-row');
      } else if (daysUntilExpiry <= 30) {
        classes.push('expiring-soon-row');
      }
    }
    
    return classes.join(' ');
  };

  return (
    <div className="feed-inventory-view">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">📦</div>
          <div className="summary-content">
            <h4>Total Items</h4>
            <p className="summary-value">{formatNumber(summaryStats.totalItems)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">⚖️</div>
          <div className="summary-content">
            <h4>Total Quantity</h4>
            <p className="summary-value">{formatNumber(summaryStats.totalQuantity, 2)} kg</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h4>Total Value</h4>
            <p className="summary-value">₦{formatNumber(summaryStats.totalValue, 2)}</p>
          </div>
        </div>

        <div className="summary-card success">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <h4>Total Assigned</h4>
            <p className="summary-value">{formatNumber(summaryStats.totalAssigned, 2)} kg</p>
          </div>
        </div>

        <div className="summary-card primary">
          <div className="summary-icon">🔄</div>
          <div className="summary-content">
            <h4>Remaining Feeds</h4>
            <p className="summary-value">{formatNumber(summaryStats.remainingFeed, 2)} kg</p>
          </div>
        </div>

        <div className="summary-card warning">
          <div className="summary-icon">⚠️</div>
          <div className="summary-content">
            <h4>Low Stock Items</h4>
            <p className="summary-value">{formatNumber(summaryStats.lowStockItems)}</p>
          </div>
        </div>

        <div className="summary-card danger">
          <div className="summary-icon">🚫</div>
          <div className="summary-content">
            <h4>Out of Stock</h4>
            <p className="summary-value">{formatNumber(summaryStats.outOfStockItems)}</p>
          </div>
        </div>

        <div className="summary-card info">
          <div className="summary-icon">⏰</div>
          <div className="summary-content">
            <h4>Expiring Soon</h4>
            <p className="summary-value">{formatNumber(summaryStats.expiringItems)}</p>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(summaryStats.lowStockItems > 0 || summaryStats.outOfStockItems > 0 || summaryStats.expiringItems > 0) && (
        <div className="alerts-section">
          <h4>⚠️ Stock Alerts</h4>
          <div className="alerts-container">
            {summaryStats.outOfStockItems > 0 && (
              <div className="alert-card danger">
                <strong>{summaryStats.outOfStockItems}</strong> items are out of stock
              </div>
            )}
            {summaryStats.lowStockItems > 0 && (
              <div className="alert-card warning">
                <strong>{summaryStats.lowStockItems}</strong> items have low stock
              </div>
            )}
            {summaryStats.expiringItems > 0 && (
              <div className="alert-card info">
                <strong>{summaryStats.expiringItems}</strong> items expire within 30 days
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <FilterPanel
        filters={filters}
        onFiltersChange={onFiltersChange}
        filterConfig={filterConfig}
        collapsible
        title="Filter Feed Inventory"
      />

      {/* Data Table */}
      <DataTable
        data={filteredInventory}
        columns={columns}
        loading={loading}
        enableSorting
        enablePagination
        enableSearch
        searchPlaceholder="Search feed inventory..."
        renderActions={renderActions}
        emptyMessage="No feed inventory found"
        rowClassName={getRowClassName}
        storageKey="feedInventory"
      />
    </div>
  );
};

export default FeedInventoryView;
