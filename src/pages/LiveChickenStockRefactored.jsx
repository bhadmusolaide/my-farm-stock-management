import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context';
import { TabNavigation } from '../components/UI';
import {
  BatchForm,
  BatchList,
  SummaryCards,
  HealthTracking,
  AnalyticsView,
  TransactionHistory
} from '../components/LiveChicken';
import './LiveChickenStock.css';

const LiveChickenStock = () => {
  const {
    liveChickens,
    addLiveChicken,
    deleteLiveChicken,
    updateLiveChicken,
    chickenInventoryTransactions,
    getLowFeedAlerts,
    loadLiveChickens
  } = useAppContext();

  // State management
  const [activeTab, setActiveTab] = useState('batches');
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [selectedBatchForTransactions, setSelectedBatchForTransactions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  
  // Filter states
  const [batchFilters, setBatchFilters] = useState({
    breed: '',
    status: '',
    ageRange: '',
    searchTerm: ''
  });

  // Load live chickens data if not already loaded
  useEffect(() => {
    if (!liveChickens || liveChickens.length === 0) {
      loadLiveChickens();
    }
  }, [liveChickens, loadLiveChickens]);

  // Get low feed alerts (filtered by dismissed alerts)
  const feedAlerts = React.useMemo(() => {
    const lowFeedItems = getLowFeedAlerts();
    return lowFeedItems
      .filter(feed => !dismissedAlerts.includes(feed.id))
      .map(feed => {
        const currentStock = feed.quantity_kg || 0;
        const minThreshold = feed.min_threshold || 50;
        const severity = currentStock < 20 ? 'critical' : 'warning';

        return {
          id: feed.id,
          severity,
          message: `Low feed stock: ${feed.feed_type || 'Unknown'} (${currentStock.toFixed(1)} kg remaining, threshold: ${minThreshold} kg)`
        };
      });
  }, [liveChickens, getLowFeedAlerts, dismissedAlerts]);

  // Tab configuration
  const tabs = [
    { 
      key: 'batches', 
      label: 'Chicken Batches', 
      icon: '🐔',
      badge: liveChickens?.length || 0
    },
    { 
      key: 'analytics', 
      label: 'Analytics', 
      icon: '📊' 
    },
    { 
      key: 'health', 
      label: 'Health Tracking', 
      icon: '🏥',
      badge: feedAlerts?.length > 0 ? feedAlerts.length : null
    },
    { 
      key: 'transactions', 
      label: 'Transaction History', 
      icon: '📋' 
    }
  ];

  // Event handlers
  const handleAddBatch = () => {
    setEditingBatch(null);
    setShowBatchForm(true);
  };

  const handleEditBatch = (batch) => {
    setEditingBatch(batch);
    setShowBatchForm(true);
  };

  const handleDeleteBatch = async (batchId) => {
    if (window.confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
      try {
        setLoading(true);
        await deleteLiveChicken(batchId);
      } catch (error) {
        console.error('Failed to delete batch:', error);
        alert('Failed to delete batch. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVaccinateBatch = (batch) => {
    // TODO: Implement vaccination scheduling
    alert(`Vaccination scheduling for batch ${batch.batch_id} - Feature coming soon!`);
  };

  const handleBatchFormSubmit = async (batchData) => {
    try {
      setLoading(true);
      
      if (editingBatch) {
        await updateLiveChicken(editingBatch.id, batchData);
      } else {
        await addLiveChicken(batchData);
      }
      
      setShowBatchForm(false);
      setEditingBatch(null);
    } catch (error) {
      console.error('Failed to save batch:', error);
      throw error; // Re-throw to let BatchForm handle the error display
    } finally {
      setLoading(false);
    }
  };

  const handleBatchFormClose = () => {
    setShowBatchForm(false);
    setEditingBatch(null);
  };

  const handleBatchSelectForTransactions = (batch) => {
    setSelectedBatchForTransactions(batch);
  };

  const handleDismissAlert = (alertId) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  return (
    <div className="live-chicken-container">
      {/* Page Header */}
      <div className="page-header">
        <h1>Live Chicken Stock Management</h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={handleAddBatch}
            disabled={loading}
          >
            Add New Batch
          </button>
        </div>
      </div>

      {/* Feed Alerts */}
      {feedAlerts.length > 0 && (
        <div className="alerts-section">
          <h3>⚠️ Feed Stock Alerts</h3>
          <div className="alerts-container">
            {feedAlerts.map(alert => (
              <div key={alert.id} className={`alert-card ${alert.severity}`}>
                <p>{alert.message}</p>
                <button
                  className="alert-dismiss-btn"
                  onClick={() => handleDismissAlert(alert.id)}
                  aria-label="Dismiss alert"
                  title="Dismiss this alert"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
        showBadges
      />

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'batches' && (
          <div className="batches-tab">
            {/* Summary Cards */}
            <SummaryCards batches={liveChickens} />
            
            {/* Batch List */}
            <BatchList
              batches={liveChickens}
              onEdit={handleEditBatch}
              onDelete={handleDeleteBatch}
              onVaccinate={handleVaccinateBatch}
              filters={batchFilters}
              onFiltersChange={setBatchFilters}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView 
            batches={liveChickens}
            transactions={chickenInventoryTransactions}
          />
        )}

        {activeTab === 'health' && (
          <HealthTracking batches={liveChickens} />
        )}

        {activeTab === 'transactions' && (
          <TransactionHistory
            transactions={chickenInventoryTransactions}
            batches={liveChickens}
            selectedBatch={selectedBatchForTransactions}
            onBatchSelect={handleBatchSelectForTransactions}
          />
        )}
      </div>

      {/* Batch Form Modal */}
      <BatchForm
        isOpen={showBatchForm}
        onClose={handleBatchFormClose}
        onSubmit={handleBatchFormSubmit}
        editingBatch={editingBatch}
        loading={loading}
      />
    </div>
  );
};

export default LiveChickenStock;
