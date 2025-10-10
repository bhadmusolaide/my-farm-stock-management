import React, { useMemo, useState } from 'react';
import { DataTable, FilterPanel } from '../UI';
import { formatDate, formatNumber } from '../../utils/formatters';
import ProcessingDetailsModal from './ProcessingDetailsModal';
import './DressedChicken.css';

const ProcessingHistory = ({
  batchRelationships = [],
  liveChickens = [],
  dressedChickens = [],
  filters,
  onFiltersChange,
  loading = false
}) => {
  const [viewingDetails, setViewingDetails] = useState(null);
  // Helper functions
  const getLiveChickenById = (id) => {
    return liveChickens.find(lc => lc.id === id) || {};
  };

  const getDressedChickenById = (id) => {
    return dressedChickens.find(dc => dc.id === id) || {};
  };

  // Process relationships data
  const processedRelationships = useMemo(() => {
    // Filter for processing relationships only (both types)
    const processingRelationships = batchRelationships.filter(
      br => br.relationship_type === 'partial_processed_from' || br.relationship_type === 'processed_from'
    );

    return processingRelationships.map(relationship => {
      const source = getLiveChickenById(relationship.source_batch_id);
      const target = getDressedChickenById(relationship.target_batch_id);

      // Use relationship.quantity (birds processed) for accurate calculation
      const birdsProcessed = relationship.quantity || 0;
      const dressedCount = target.processing_quantity || target.initial_count || 0;

      // Yield rate: (dressed chickens / birds processed) * 100
      // Should typically be 100% unless there were losses during processing
      const yieldRate = birdsProcessed > 0
        ? ((dressedCount / birdsProcessed) * 100).toFixed(1)
        : '0';

      return {
        id: relationship.id,
        liveBatchId: source.batch_id || 'N/A',
        liveBatchBreed: source.breed || 'N/A',
        birdsProcessed,
        dressedBatchId: target.batch_id || 'N/A',
        dressedCount,
        processingDate: target.processing_date,
        yieldRate: parseFloat(yieldRate),
        averageWeight: target.average_weight || 0,
        sizeCategory: target.size_category_custom || target.size_category || 'N/A',
        storageLocation: target.storage_location || 'N/A',
        processingNotes: target.notes || '',
        relationship
      };
    });
  }, [batchRelationships, liveChickens, dressedChickens]);

  // Filter configuration
  const filterConfig = [
    {
      key: 'liveBatchId',
      label: 'Live Batch ID',
      type: 'text',
      placeholder: 'Search by live batch ID...'
    },
    {
      key: 'dressedBatchId',
      label: 'Dressed Batch ID',
      type: 'text',
      placeholder: 'Search by dressed batch ID...'
    },
    {
      key: 'breed',
      label: 'Breed',
      type: 'select',
      options: [
        ...new Set(liveChickens.map(lc => lc.breed).filter(Boolean))
      ].map(breed => ({ value: breed, label: breed }))
    },
    {
      key: 'dateRange',
      label: 'Processing Date From',
      type: 'date'
    },
    {
      key: 'yieldThreshold',
      label: 'Yield Rate',
      type: 'select',
      options: [
        { value: 'low', label: 'Low Yield (<95%)' },
        { value: 'normal', label: 'Normal Yield (95-100%)' },
        { value: 'high', label: 'High Yield (>100%)' }
      ]
    }
  ];

  // Apply filters
  const filteredRelationships = useMemo(() => {
    let filtered = [...processedRelationships];

    if (filters?.liveBatchId) {
      const searchLower = filters.liveBatchId.toLowerCase();
      filtered = filtered.filter(rel =>
        rel.liveBatchId.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.dressedBatchId) {
      const searchLower = filters.dressedBatchId.toLowerCase();
      filtered = filtered.filter(rel =>
        rel.dressedBatchId.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.breed) {
      filtered = filtered.filter(rel => rel.liveBatchBreed === filters.breed);
    }

    if (filters?.dateRange) {
      const filterDate = new Date(filters.dateRange);
      filtered = filtered.filter(rel => {
        if (!rel.processingDate) return false;
        const processingDate = new Date(rel.processingDate);
        return processingDate >= filterDate;
      });
    }

    if (filters?.yieldThreshold) {
      filtered = filtered.filter(rel => {
        const yieldRate = rel.yieldRate;
        switch (filters.yieldThreshold) {
          case 'low':
            return yieldRate < 95;
          case 'normal':
            return yieldRate >= 95 && yieldRate <= 100;
          case 'high':
            return yieldRate > 100;
          default:
            return true;
        }
      });
    }

    return filtered.sort((a, b) => new Date(b.processingDate) - new Date(a.processingDate));
  }, [processedRelationships, filters]);

  // Table columns
  const columns = [
    { key: 'liveBatchId', label: 'Live Batch' },
    { key: 'liveBatchBreed', label: 'Breed' },
    { key: 'birdsProcessed', label: 'Birds Processed' },
    { key: 'dressedBatchId', label: 'Dressed Batch' },
    { key: 'dressedCount', label: 'Dressed Count' },
    { key: 'processingDate', label: 'Processing Date' },
    { key: 'yieldRate', label: 'Yield Rate' },
    { key: 'averageWeight', label: 'Avg Weight' },
    { key: 'sizeCategory', label: 'Size Category' }
  ];

  // Custom cell renderer
  const renderCell = (value, row, column) => {
    switch (column.key) {
      case 'liveBatchId':
      case 'dressedBatchId':
        return <span className="font-medium">{value}</span>;
      
      case 'birdsProcessed':
      case 'dressedCount':
        return formatNumber(value);
      
      case 'processingDate':
        return value ? formatDate(value) : 'N/A';
      
      case 'yieldRate':
        const yieldColor = value < 95 ? 'warning' : value > 100 ? 'danger' : 'success';
        return (
          <span className={`yield-rate ${yieldColor}`}>
            {value.toFixed(1)}%
          </span>
        );
      
      case 'averageWeight':
        return value ? `${value.toFixed(2)} kg` : 'N/A';
      
      default:
        return value;
    }
  };

  // Custom actions renderer
  const renderActions = (row) => (
    <div className="processing-actions">
      <button
        className="btn btn-sm btn-info"
        onClick={() => setViewingDetails(row)}
        title="View processing details"
      >
        Details
      </button>
    </div>
  );

  // Row class name for highlighting yield issues
  const getRowClassName = (row) => {
    if (row.yieldRate < 95) return 'low-yield-row';
    if (row.yieldRate > 100) return 'high-yield-row';
    return '';
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (filteredRelationships.length === 0) {
      return {
        totalProcessingEvents: 0,
        totalBirdsProcessed: 0,
        totalDressedChickens: 0,
        averageYieldRate: 0,
        averageWeight: 0
      };
    }

    const totalBirdsProcessed = filteredRelationships.reduce((sum, rel) => sum + rel.birdsProcessed, 0);
    const totalDressedChickens = filteredRelationships.reduce((sum, rel) => sum + rel.dressedCount, 0);
    const averageYieldRate = filteredRelationships.reduce((sum, rel) => sum + rel.yieldRate, 0) / filteredRelationships.length;
    const averageWeight = filteredRelationships.reduce((sum, rel) => sum + rel.averageWeight, 0) / filteredRelationships.length;

    return {
      totalProcessingEvents: filteredRelationships.length,
      totalBirdsProcessed,
      totalDressedChickens,
      averageYieldRate: averageYieldRate.toFixed(1),
      averageWeight: averageWeight.toFixed(2)
    };
  }, [filteredRelationships]);

  return (
    <div className="processing-history">
      {/* Summary Cards */}
      <div className="processing-summary">
        <div className="summary-cards">
          <div className="summary-card">
            <h4>Processing Events</h4>
            <p className="summary-value">{summaryStats.totalProcessingEvents}</p>
          </div>
          <div className="summary-card">
            <h4>Birds Processed</h4>
            <p className="summary-value">{formatNumber(summaryStats.totalBirdsProcessed)}</p>
          </div>
          <div className="summary-card">
            <h4>Dressed Chickens</h4>
            <p className="summary-value">{formatNumber(summaryStats.totalDressedChickens)}</p>
          </div>
          <div className="summary-card">
            <h4>Average Yield Rate</h4>
            <p className={`summary-value ${parseFloat(summaryStats.averageYieldRate) < 95 ? 'warning' : 'success'}`}>
              {summaryStats.averageYieldRate}%
            </p>
          </div>
          <div className="summary-card">
            <h4>Average Weight</h4>
            <p className="summary-value">{summaryStats.averageWeight} kg</p>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFiltersChange={onFiltersChange}
        filterConfig={filterConfig}
        title="Processing History Filters"
        variant="compact"
        collapsible
        showClearAll
      />

      {/* Processing History Table */}
      <DataTable
        data={filteredRelationships}
        columns={columns}
        loading={loading}
        enableSearch={false} // Using custom filter panel instead
        enableSorting
        enablePagination
        renderCell={renderCell}
        renderActions={renderActions}
        rowClassName={getRowClassName}
        emptyMessage="No processing history found"
        storageKey="processingHistory"
      />

      {/* Processing Details Modal */}
      <ProcessingDetailsModal
        isOpen={!!viewingDetails}
        onClose={() => setViewingDetails(null)}
        processingRecord={viewingDetails}
        liveChicken={viewingDetails ? getLiveChickenById(viewingDetails.liveBatchId) : null}
        dressedChicken={viewingDetails ? getDressedChickenById(viewingDetails.dressedBatchId) : null}
      />
    </div>
  );
};

export default ProcessingHistory;
