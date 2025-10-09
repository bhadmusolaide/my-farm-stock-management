import React, { useMemo } from 'react';
import { DataTable, StatusBadge, FilterPanel } from '../UI';
import { formatDate, formatNumber } from '../../utils/formatters';
import './LiveChicken.css';

const BatchList = ({
  batches = [],
  onEdit,
  onDelete,
  onVaccinate,
  filters,
  onFiltersChange,
  loading = false
}) => {
  // Helper functions
  const calculateAge = (hatchDate) => {
    if (!hatchDate) return 0;
    const today = new Date();
    const hatch = new Date(hatchDate);
    const diffTime = Math.abs(today - hatch);
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  const getAgeCategory = (age) => {
    if (age <= 2) return 'Chick';
    if (age <= 4) return 'Grower';
    if (age <= 6) return 'Finisher';
    return 'Mature';
  };

  const getLifecycleStage = (batch) => {
    const age = calculateAge(batch.hatch_date);
    return getAgeCategory(age);
  };

  const calculateMortalityRate = (initial, current) => {
    if (!initial || initial === 0) return 0;
    const mortality = initial - current;
    return ((mortality / initial) * 100).toFixed(1);
  };

  // Process batches with calculated fields
  const processedBatches = useMemo(() => {
    return batches.map(batch => ({
      ...batch,
      age: calculateAge(batch.hatch_date),
      mortalityRate: calculateMortalityRate(batch.initial_count, batch.current_count),
      lifecycleStage: getLifecycleStage(batch),
      mortality: batch.initial_count - batch.current_count
    }));
  }, [batches]);

  // Filter configuration
  const filterConfig = [
    {
      key: 'breed',
      label: 'Breed',
      type: 'select',
      options: [
        { value: 'Arbor Acres', label: 'Arbor Acres' },
        { value: 'Ross 308', label: 'Ross 308' },
        { value: 'Cobb 500', label: 'Cobb 500' },
        { value: 'Hubbard', label: 'Hubbard' },
        { value: 'Other', label: 'Other' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'healthy', label: 'Healthy' },
        { value: 'sick', label: 'Sick' },
        { value: 'quarantine', label: 'Quarantine' },
        { value: 'processing', label: 'Processing' }
      ]
    },
    {
      key: 'ageRange',
      label: 'Age Range',
      type: 'select',
      options: [
        { value: 'chick', label: 'Chick (0-2 weeks)' },
        { value: 'grower', label: 'Grower (3-4 weeks)' },
        { value: 'finisher', label: 'Finisher (5-6 weeks)' },
        { value: 'mature', label: 'Mature (7+ weeks)' }
      ]
    },
    {
      key: 'searchTerm',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by batch ID or breed...'
    }
  ];

  // Apply filters
  const filteredBatches = useMemo(() => {
    let filtered = [...processedBatches];

    if (filters.breed) {
      filtered = filtered.filter(batch => 
        batch.breed?.toLowerCase().includes(filters.breed.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(batch => batch.status === filters.status);
    }

    if (filters.ageRange) {
      filtered = filtered.filter(batch => {
        const category = getAgeCategory(batch.age).toLowerCase();
        return category === filters.ageRange;
      });
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(batch =>
        batch.batch_id?.toLowerCase().includes(searchLower) ||
        batch.breed?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [processedBatches, filters]);

  // Table columns
  const columns = [
    { key: 'batch_id', label: 'Batch ID' },
    { key: 'breed', label: 'Breed' },
    { key: 'age', label: 'Age' },
    { key: 'count', label: 'Count' },
    { key: 'weight', label: 'Weight' },
    { key: 'mortality', label: 'Mortality' },
    { key: 'lifecycleStage', label: 'Stage' },
    { key: 'status', label: 'Status' }
  ];

  // Custom cell renderer
  const renderCell = (value, row, column) => {
    switch (column.key) {
      case 'age':
        return (
          <div>
            {row.age} weeks
            <br />
            <small className="age-category">({getAgeCategory(row.age)})</small>
          </div>
        );
      
      case 'count':
        return (
          <div>
            {formatNumber(row.current_count)}/{formatNumber(row.initial_count)}
            <br />
            <small>({row.mortalityRate}% loss)</small>
          </div>
        );
      
      case 'weight':
        return (
          <div>
            {row.current_weight} kg
            <br />
            <small>Target: {row.expected_weight} kg</small>
          </div>
        );
      
      case 'mortality':
        return (
          <span className={row.mortalityRate > 10 ? 'high-mortality' : ''}>
            {row.mortality}
          </span>
        );
      
      case 'lifecycleStage':
        return (
          <span className="lifecycle-stage-badge">
            {row.lifecycleStage}
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
    <div className="batch-actions">
      <button
        className="btn btn-sm btn-primary"
        onClick={() => onEdit(row)}
        title="Edit batch"
      >
        Edit
      </button>
      <button
        className="btn btn-sm btn-info"
        onClick={() => onVaccinate(row)}
        title="Schedule vaccination"
      >
        Vaccinate
      </button>
      <button
        className="btn btn-sm btn-danger"
        onClick={() => onDelete(row.id)}
        title="Delete batch"
      >
        Delete
      </button>
    </div>
  );

  // Row class name for highlighting sick batches
  const getRowClassName = (row) => {
    if (row.status === 'sick') return 'sick-batch';
    if (row.mortalityRate > 15) return 'high-mortality-batch';
    return '';
  };

  return (
    <div className="batch-list">
      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFiltersChange={onFiltersChange}
        filterConfig={filterConfig}
        title="Batch Filters"
        variant="compact"
        collapsible
        showClearAll
      />

      {/* Data Table */}
      <DataTable
        data={filteredBatches}
        columns={columns}
        loading={loading}
        enableSearch={false} // Using custom filter panel instead
        enableSorting
        enablePagination
        enableColumnFilter
        renderCell={renderCell}
        renderActions={renderActions}
        rowClassName={getRowClassName}
        emptyMessage="No chicken batches found"
        storageKey="batchList"
      />
    </div>
  );
};

export default BatchList;
