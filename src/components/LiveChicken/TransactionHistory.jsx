import React, { useMemo, useState } from 'react';
import { DataTable, FilterPanel } from '../UI';
import { formatDate, formatNumber } from '../../utils/formatters';
import './LiveChicken.css';

const TransactionHistory = ({ 
  transactions = [], 
  batches = [],
  selectedBatch = null,
  onBatchSelect 
}) => {
  const [filters, setFilters] = useState({
    type: '',
    dateRange: '',
    batchId: selectedBatch?.id || ''
  });

  // Filter transactions based on selected batch and filters
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by selected batch
    if (selectedBatch) {
      filtered = filtered.filter(transaction => 
        transaction.batch_id === selectedBatch.id || 
        transaction.batch_id === selectedBatch.batch_id
      );
    }

    // Apply additional filters
    if (filters.type) {
      filtered = filtered.filter(transaction => transaction.type === filters.type);
    }

    if (filters.dateRange) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.created_at);
        const filterDate = new Date(filters.dateRange);
        return transactionDate >= filterDate;
      });
    }

    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [transactions, selectedBatch, filters]);

  // Calculate transaction summary for selected batch
  const transactionSummary = useMemo(() => {
    if (!selectedBatch || filteredTransactions.length === 0) {
      return {
        totalSales: 0,
        totalMortality: 0,
        totalAdjustments: 0,
        netChange: 0,
        transactionCount: 0
      };
    }

    const summary = filteredTransactions.reduce((acc, transaction) => {
      const quantity = Math.abs(transaction.quantity || 0);
      
      switch (transaction.type) {
        case 'sale':
          acc.totalSales += quantity;
          break;
        case 'mortality':
          acc.totalMortality += quantity;
          break;
        case 'adjustment':
          acc.totalAdjustments += transaction.quantity || 0; // Can be positive or negative
          break;
      }
      
      acc.transactionCount += 1;
      return acc;
    }, {
      totalSales: 0,
      totalMortality: 0,
      totalAdjustments: 0,
      transactionCount: 0
    });

    summary.netChange = -(summary.totalSales + summary.totalMortality) + summary.totalAdjustments;

    return summary;
  }, [selectedBatch, filteredTransactions]);

  // Filter configuration
  const filterConfig = [
    {
      key: 'type',
      label: 'Transaction Type',
      type: 'select',
      options: [
        { value: 'sale', label: 'Sales' },
        { value: 'mortality', label: 'Mortality' },
        { value: 'adjustment', label: 'Adjustments' },
        { value: 'transfer', label: 'Transfers' }
      ]
    },
    {
      key: 'dateRange',
      label: 'From Date',
      type: 'date'
    }
  ];

  // Table columns
  const columns = [
    { key: 'created_at', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unit_price', label: 'Unit Price' },
    { key: 'total_amount', label: 'Total Amount' },
    { key: 'notes', label: 'Notes' }
  ];

  // Custom cell renderer
  const renderCell = (value, row, column) => {
    switch (column.key) {
      case 'created_at':
        return formatDate(value);
      
      case 'type':
        const typeLabels = {
          sale: 'Sale',
          mortality: 'Mortality',
          adjustment: 'Adjustment',
          transfer: 'Transfer'
        };
        const typeColors = {
          sale: 'success',
          mortality: 'danger',
          adjustment: 'warning',
          transfer: 'info'
        };
        return (
          <span className={`transaction-type ${typeColors[value] || 'secondary'}`}>
            {typeLabels[value] || value}
          </span>
        );
      
      case 'quantity':
        const isNegative = value < 0;
        return (
          <span className={isNegative ? 'negative-quantity' : 'positive-quantity'}>
            {isNegative ? '' : '+'}{formatNumber(value)}
          </span>
        );
      
      case 'unit_price':
        return value ? `$${parseFloat(value).toFixed(2)}` : '-';
      
      case 'total_amount':
        return value ? `$${parseFloat(value).toFixed(2)}` : '-';
      
      case 'notes':
        return value ? (
          <span title={value}>
            {value.length > 50 ? `${value.substring(0, 50)}...` : value}
          </span>
        ) : '-';
      
      default:
        return value;
    }
  };

  // Available batches for selection
  const availableBatches = batches.filter(batch => batch.status !== 'completed');

  return (
    <div className="transaction-history">
      <div className="section-header">
        <h3>📊 Inventory Transaction History</h3>
        <div className="batch-selector">
          <select
            value={selectedBatch?.id || ''}
            onChange={(e) => {
              const batchId = e.target.value;
              const batch = batches.find(b => b.id === batchId);
              onBatchSelect(batch);
              setFilters(prev => ({ ...prev, batchId }));
            }}
            className="batch-select"
          >
            <option value="">Select Batch for Transaction History</option>
            {availableBatches.map(batch => (
              <option key={batch.id} value={batch.id}>
                {batch.batch_id} - {batch.breed} ({formatNumber(batch.current_count)} birds)
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedBatch && (
        <>
          {/* Transaction Summary Cards */}
          <div className="transaction-summary">
            <div className="summary-cards">
              <div className="summary-card sales">
                <h4>Sales</h4>
                <p className="summary-value">{formatNumber(transactionSummary.totalSales)}</p>
              </div>
              <div className="summary-card mortality">
                <h4>Mortality</h4>
                <p className="summary-value">{formatNumber(transactionSummary.totalMortality)}</p>
              </div>
              <div className="summary-card adjustments">
                <h4>Adjustments</h4>
                <p className="summary-value">{formatNumber(transactionSummary.totalAdjustments)}</p>
              </div>
              <div className="summary-card net">
                <h4>Net Change</h4>
                <p className={`summary-value ${transactionSummary.netChange < 0 ? 'negative' : 'positive'}`}>
                  {transactionSummary.netChange >= 0 ? '+' : ''}{formatNumber(transactionSummary.netChange)}
                </p>
              </div>
              <div className="summary-card total">
                <h4>Total Transactions</h4>
                <p className="summary-value">{transactionSummary.transactionCount}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            filterConfig={filterConfig}
            title="Transaction Filters"
            variant="compact"
            collapsible
            showClearAll
          />

          {/* Transactions Table */}
          <DataTable
            data={filteredTransactions}
            columns={columns}
            renderCell={renderCell}
            enableSorting
            enablePagination
            emptyMessage={`No transactions found for batch ${selectedBatch.batch_id}`}
            storageKey="transactionHistory"
          />
        </>
      )}

      {!selectedBatch && (
        <div className="no-batch-selected">
          <p>Select a batch to view its transaction history</p>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
