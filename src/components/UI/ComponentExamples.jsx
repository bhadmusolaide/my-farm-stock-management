import React, { useState } from 'react';
import {
  DataTable,
  StatusBadge,
  TabNavigation,
  EnhancedModal,
  FilterPanel,
  Card,
  SummaryCard,
  StatCard,
  MetricCard,
  AlertCard,
  HealthStatusCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  EnhancedDataTable,
  PerformanceTable,
  StatusTable
} from './index';

// Example component showing how to use the new reusable components
const ComponentExamples = () => {
  const [activeTab, setActiveTab] = useState('table');
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({});

  // Sample data for DataTable
  const sampleData = [
    { id: 1, name: 'Batch A', status: 'healthy', count: 100, date: '2024-01-15' },
    { id: 2, name: 'Batch B', status: 'sick', count: 85, date: '2024-01-16' },
    { id: 3, name: 'Batch C', status: 'processing', count: 120, date: '2024-01-17' },
  ];

  // Column configuration for DataTable
  const columns = [
    { key: 'name', label: 'Batch Name' },
    { key: 'status', label: 'Status' },
    { key: 'count', label: 'Count' },
    { key: 'date', label: 'Date' }
  ];

  // Tab configuration
  const tabs = [
    { key: 'cards', label: 'Card Components', icon: '🃏' },
    { key: 'table', label: 'Data Table', icon: '📊' },
    { key: 'status', label: 'Status Badges', icon: '🏷️' },
    { key: 'modal', label: 'Modal Example', icon: '🪟' },
    { key: 'filter', label: 'Filter Panel', icon: '🔍' }
  ];

  // Filter configuration
  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'healthy', label: 'Healthy' },
        { value: 'sick', label: 'Sick' },
        { value: 'processing', label: 'Processing' }
      ]
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'dateRange'
    },
    {
      key: 'minCount',
      label: 'Minimum Count',
      type: 'number',
      placeholder: 'Enter minimum count'
    }
  ];

  // Custom cell renderer for DataTable
  const renderCell = (value, row, column) => {
    if (column.key === 'status') {
      return <StatusBadge status={value} showIcon />;
    }
    if (column.key === 'count') {
      return value.toLocaleString();
    }
    return value;
  };

  // Custom actions renderer for DataTable
  const renderActions = (row) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button className="btn btn-sm btn-primary">Edit</button>
      <button className="btn btn-sm btn-danger">Delete</button>
    </div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Reusable UI Components Examples</h1>
      
      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
        showBadges
      />

      <div style={{ marginTop: '2rem' }}>
        {/* Card Components Example */}
        {activeTab === 'cards' && (
          <div>
            <h2>Card Components</h2>

            <h3>Summary Cards</h3>
            <div className="summary-cards" style={{ marginBottom: '2rem' }}>
              <SummaryCard
                title="Total Chickens"
                value="1,250"
                icon="🐔"
                variant="primary"
                subtitle="Active livestock"
              />
              <SummaryCard
                title="Feed Stock"
                value="2.5 tons"
                icon="🌾"
                variant="warning"
                trend="+5% this week"
              />
              <SummaryCard
                title="Revenue"
                value="$12,450"
                icon="💰"
                variant="success"
                subtitle="This month"
              />
            </div>

            <h3>Health Status Cards</h3>
            <div className="health-status-cards" style={{ marginBottom: '2rem' }}>
              <HealthStatusCard
                status="healthy"
                count="1,100"
                percentage="88"
                icon="✅"
              />
              <HealthStatusCard
                status="sick"
                count="120"
                percentage="9.6"
                icon="🤒"
              />
              <HealthStatusCard
                status="critical"
                count="25"
                percentage="2"
                icon="🚨"
              />
            </div>

            <h3>Alert Cards</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
              <AlertCard
                type="danger"
                title="Critical Mortality Alert"
                message="Batch Vertex 51 has exceeded critical mortality threshold (39.2%)"
                icon="🚨"
                dismissible={true}
              />
              <AlertCard
                type="warning"
                title="Feed Stock Low"
                message="Current feed stock is below recommended levels"
                icon="⚠️"
              />
            </div>
          </div>
        )}

        {/* Data Table Example */}
        {activeTab === 'table' && (
          <div>
            <h2>DataTable Component</h2>
            <DataTable
              data={sampleData}
              columns={columns}
              enableSearch
              enableSorting
              enablePagination
              enableColumnFilter
              renderCell={renderCell}
              renderActions={renderActions}
              emptyMessage="No batches found"
              searchPlaceholder="Search batches..."
            />
          </div>
        )}

        {/* Status Badges Example */}
        {activeTab === 'status' && (
          <div>
            <h2>StatusBadge Component</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <StatusBadge status="healthy" showIcon />
              <StatusBadge status="sick" showIcon />
              <StatusBadge status="processing" showIcon />
              <StatusBadge status="expired" showIcon />
              <StatusBadge status="pending" variant="pill" />
              <StatusBadge status="completed" variant="outline" showIcon />
            </div>
            
            <h3>Custom Status Badge</h3>
            <StatusBadge 
              status="custom"
              customColors={{ background: '#6f42c1', text: '#fff' }}
              showIcon
            >
              Custom Status
            </StatusBadge>
          </div>
        )}

        {/* Modal Example */}
        {activeTab === 'modal' && (
          <div>
            <h2>EnhancedModal Component</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              Open Modal
            </button>
            
            <EnhancedModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              title="Example Modal"
              size="medium"
              footer={
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowModal(false)}
                  >
                    Save
                  </button>
                </div>
              }
            >
              <p>This is an example of the EnhancedModal component with custom footer.</p>
              <p>It supports various sizes, animations, and configurations.</p>
            </EnhancedModal>
          </div>
        )}

        {/* Filter Panel Example */}
        {activeTab === 'filter' && (
          <div>
            <h2>FilterPanel Component</h2>
            <div style={{ maxWidth: '400px' }}>
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                filterConfig={filterConfig}
                title="Batch Filters"
                showClearAll
                collapsible
              />
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <h3>Current Filters:</h3>
              <pre style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px' }}>
                {JSON.stringify(filters, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentExamples;
