import React, { useMemo } from 'react';
import { DataTable, StatusBadge, FilterPanel } from '../UI';
import { formatWeight, formatDate } from '../../utils/formatters';
import './DressedChicken.css';

const InventoryView = ({
  dressedChickens = [],
  chickenSizeCategories = [],
  onEdit,
  onDelete,
  onViewTraceability,
  filters,
  onFiltersChange,
  loading = false
}) => {
  // Helper functions
  const isExpired = (expiryDateStr) => {
    if (!expiryDateStr) return false;
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    return expiryDate < today;
  };

  const isExpiringSoon = (expiryDateStr) => {
    if (!expiryDateStr) return false;
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  };

  const getExpiryStatus = (expiryDateStr) => {
    if (!expiryDateStr) return 'unknown';
    if (isExpired(expiryDateStr)) return 'expired';
    if (isExpiringSoon(expiryDateStr)) return 'expiring-soon';
    return 'fresh';
  };

  const getSizeCategoryDisplay = (chicken) => {
    if (chicken.size_category_custom) {
      return chicken.size_category_custom;
    }
    
    if (chicken.size_category_id) {
      const category = chickenSizeCategories.find(sc => sc.id === chicken.size_category_id);
      return category ? category.name : 'Unknown';
    }
    
    // Fallback to old format
    return chicken.size_category || 'Medium';
  };

  const getWholeChickenCount = (chicken) => {
    return chicken.current_count || chicken.initial_count || 0;
  };

  const getPartsInventoryDisplay = (chicken) => {
    if (!chicken.parts_count) return 'No parts recorded';
    
    const parts = [];
    const partsCount = chicken.parts_count;
    
    if (partsCount.neck > 0) parts.push(`Neck: ${partsCount.neck}`);
    if (partsCount.feet > 0) parts.push(`Feet: ${partsCount.feet}`);
    if (partsCount.gizzard > 0) parts.push(`Gizzard: ${partsCount.gizzard}`);
    if (partsCount.dog_food > 0) parts.push(`Dog Food: ${partsCount.dog_food}`);
    
    return parts.length > 0 ? parts.join(', ') : 'No parts recorded';
  };

  // Filter configuration
  const filterConfig = [
    {
      key: 'sizeCategory',
      label: 'Size Category',
      type: 'select',
      options: [
        ...chickenSizeCategories.map(cat => ({ value: cat.id, label: cat.name })),
        { value: 'custom', label: 'Custom Sizes' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'in-storage', label: 'In Storage' },
        { value: 'sold', label: 'Sold' },
        { value: 'expired', label: 'Expired' },
        { value: 'processing', label: 'Processing' }
      ]
    },
    {
      key: 'expiryStatus',
      label: 'Expiry Status',
      type: 'select',
      options: [
        { value: 'fresh', label: 'Fresh' },
        { value: 'expiring-soon', label: 'Expiring Soon' },
        { value: 'expired', label: 'Expired' }
      ]
    },
    {
      key: 'storageLocation',
      label: 'Storage Location',
      type: 'text',
      placeholder: 'Search by storage location...'
    },
    {
      key: 'searchTerm',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by batch ID...'
    }
  ];

  // Apply filters
  const filteredChickens = useMemo(() => {
    let filtered = [...dressedChickens];

    if (filters?.sizeCategory) {
      if (filters.sizeCategory === 'custom') {
        filtered = filtered.filter(chicken => chicken.size_category_custom);
      } else {
        filtered = filtered.filter(chicken => chicken.size_category_id === filters.sizeCategory);
      }
    }

    if (filters?.status) {
      filtered = filtered.filter(chicken => chicken.status === filters.status);
    }

    if (filters?.expiryStatus) {
      filtered = filtered.filter(chicken => getExpiryStatus(chicken.expiry_date) === filters.expiryStatus);
    }

    if (filters?.storageLocation) {
      const searchLower = filters.storageLocation.toLowerCase();
      filtered = filtered.filter(chicken =>
        chicken.storage_location?.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(chicken =>
        chicken.batch_id?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [dressedChickens, filters, chickenSizeCategories]);

  // Table columns
  const columns = [
    { key: 'batch_id', label: 'Batch ID' },
    { key: 'size_category', label: 'Size Category' },
    { key: 'whole_chickens', label: 'Whole Chickens' },
    { key: 'average_weight', label: 'Avg Weight' },
    { key: 'storage_location', label: 'Storage Location' },
    { key: 'expiry_date', label: 'Expiry Date' },
    { key: 'parts_inventory', label: 'Parts Inventory' },
    { key: 'status', label: 'Status' }
  ];

  // Custom cell renderer
  const renderCell = (value, row, column) => {
    switch (column.key) {
      case 'batch_id':
        return <span className="font-medium">{row.batch_id}</span>;
      
      case 'size_category':
        return getSizeCategoryDisplay(row);
      
      case 'whole_chickens':
        const wholeCount = getWholeChickenCount(row);
        const initialCount = row.initial_count || row.processing_quantity || 0;
        return (
          <div>
            <span className="font-medium">{wholeCount}</span>
            {initialCount !== wholeCount && (
              <small className="text-muted"> / {initialCount} initial</small>
            )}
          </div>
        );
      
      case 'average_weight':
        return formatWeight(row.average_weight);
      
      case 'storage_location':
        return row.storage_location || '-';
      
      case 'expiry_date':
        if (!row.expiry_date) return '-';
        
        const expiryStatus = getExpiryStatus(row.expiry_date);
        const statusColors = {
          expired: 'danger',
          'expiring-soon': 'warning',
          fresh: 'success'
        };
        
        return (
          <div>
            <div>{formatDate(row.expiry_date)}</div>
            {expiryStatus !== 'fresh' && (
              <StatusBadge 
                status={expiryStatus} 
                type={statusColors[expiryStatus]}
                size="small"
              >
                {expiryStatus === 'expired' ? 'EXPIRED' : 'Expiring Soon'}
              </StatusBadge>
            )}
          </div>
        );
      
      case 'parts_inventory':
        const partsDisplay = getPartsInventoryDisplay(row);
        return (
          <span title={partsDisplay}>
            {partsDisplay.length > 30 ? `${partsDisplay.substring(0, 30)}...` : partsDisplay}
          </span>
        );
      
      case 'status':
        return <StatusBadge status={row.status} showIcon />;
      
      default:
        return value;
    }
  };

  // Custom actions renderer
  const renderActions = (row) => (
    <div className="inventory-actions">
      <button
        onClick={() => onViewTraceability(row)}
        className="btn btn-sm btn-info"
        title="View batch traceability"
      >
        🔍 Trace
      </button>
      <button
        className="btn btn-sm btn-primary"
        onClick={() => onEdit(row)}
        title="Edit record"
      >
        Edit
      </button>
      <button
        className="btn btn-sm btn-danger"
        onClick={() => onDelete(row.id)}
        title="Delete record"
      >
        Delete
      </button>
    </div>
  );

  // Row class name for highlighting expired/expiring items
  const getRowClassName = (row) => {
    const expiryStatus = getExpiryStatus(row.expiry_date);
    if (expiryStatus === 'expired') return 'expired-row';
    if (expiryStatus === 'expiring-soon') return 'expiring-soon-row';
    return '';
  };

  return (
    <div className="inventory-view">
      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFiltersChange={onFiltersChange}
        filterConfig={filterConfig}
        title="Inventory Filters"
        variant="compact"
        collapsible
        showClearAll
      />

      {/* Inventory Table */}
      <DataTable
        data={filteredChickens}
        columns={columns}
        loading={loading}
        enableSearch={false} // Using custom filter panel instead
        enableSorting
        enablePagination
        enableColumnFilter
        renderCell={renderCell}
        renderActions={renderActions}
        rowClassName={getRowClassName}
        emptyMessage="No dressed chicken inventory found"
        storageKey="dressedChickenInventory"
      />
    </div>
  );
};

export default InventoryView;
