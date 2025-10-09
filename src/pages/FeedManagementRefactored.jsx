import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import { TabNavigation } from '../components/UI';
import {
  FeedInventoryView,
  FeedForm,
  FeedConsumptionView,
  FeedConsumptionForm,
  FeedAnalyticsView
} from '../components/FeedManagement';
import './FeedManagement.css';

const FeedManagement = () => {
  const {
    feedInventory,
    addFeedInventory,
    updateFeedInventory,
    deleteFeedInventory,
    feedConsumption,
    addFeedConsumption,
    deleteFeedConsumption,
    liveChickens,
    feedBatchAssignments,
    deleteFeedBatchAssignment,
    loadFeedInventory
  } = useAppContext();

  const { showError, showSuccess, showWarning } = useNotification();

  // State management
  const [activeTab, setActiveTab] = useState('inventory');
  const [showFeedForm, setShowFeedForm] = useState(false);
  const [showConsumptionForm, setShowConsumptionForm] = useState(false);
  const [editingFeed, setEditingFeed] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [inventoryFilters, setInventoryFilters] = useState({
    feed_type: '',
    brand: '',
    supplier: '',
    stockStatus: '',
    startDate: '',
    endDate: ''
  });

  const [consumptionFilters, setConsumptionFilters] = useState({
    feed_type: '',
    chicken_batch_id: '',
    startDate: '',
    endDate: ''
  });

  // Load feed inventory data if not already loaded
  useEffect(() => {
    if (!feedInventory || feedInventory.length === 0) {
      loadFeedInventory();
    }
  }, [feedInventory, loadFeedInventory]);

  // Tab configuration
  const tabs = [
    { 
      key: 'inventory', 
      label: 'Feed Inventory', 
      icon: '📦',
      badge: feedInventory?.length || 0
    },
    { 
      key: 'consumption', 
      label: 'Feed Consumption', 
      icon: '🍽️',
      badge: feedConsumption?.length || 0
    },
    { 
      key: 'analytics', 
      label: 'Analytics', 
      icon: '📊' 
    }
  ];

  // Database reset function
  const resetFeedData = async () => {
    if (window.confirm('⚠️ CAUTION: This will permanently delete ALL feed data from the database including inventory, consumption records, and batch assignments. This action cannot be undone. Do you want to proceed?')) {
      try {
        setLoading(true);
        
        // Delete all feed consumption records
        for (const consumption of feedConsumption) {
          await deleteFeedConsumption(consumption.id);
        }
        
        // Delete all feed batch assignments
        for (const assignment of feedBatchAssignments) {
          await deleteFeedBatchAssignment(assignment.id);
        }
        
        // Delete all feed inventory records
        for (const feed of feedInventory) {
          await deleteFeedInventory(feed.id);
        }
        
        showSuccess('Feed data reset successfully');
        
        // Refresh the page to ensure UI is updated
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('Error resetting feed data:', error);
        showError('Error resetting feed data: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Event handlers
  const handleFeedSubmit = async (feedData) => {
    try {
      setLoading(true);

      if (editingFeed) {
        await updateFeedInventory(feedData.id, feedData);
        showSuccess('Feed stock updated successfully!');
      } else {
        await addFeedInventory(feedData);
        showSuccess('Feed stock added successfully!');
      }

      // Refresh feed inventory
      await loadFeedInventory();

    } catch (error) {
      console.error('Failed to save feed:', error);
      showError(`Failed to save feed: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleEditFeed = (feed) => {
    setEditingFeed(feed);
    setShowFeedForm(true);
  };

  const handleDeleteFeed = async (feedId) => {
    if (window.confirm('Are you sure you want to delete this feed stock? This action cannot be undone.')) {
      try {
        setLoading(true);
        await deleteFeedInventory(feedId);
        await loadFeedInventory();
        showSuccess('Feed stock deleted successfully');
      } catch (error) {
        console.error('Failed to delete feed:', error);
        showError('Failed to delete feed stock. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConsumptionSubmit = async (consumptionData) => {
    try {
      setLoading(true);

      // Add consumption record
      await addFeedConsumption(consumptionData);

      // Update feed inventory quantity
      const selectedFeed = feedInventory.find(feed => feed.id === consumptionData.feed_id);
      if (selectedFeed) {
        const newQuantity = Math.max(0, selectedFeed.quantity_kg - consumptionData.quantity_consumed);
        await updateFeedInventory(selectedFeed.id, {
          ...selectedFeed,
          quantity_kg: newQuantity
        });
      }

      // Refresh data
      await loadFeedInventory();
      
      showSuccess('Feed consumption logged successfully!');

    } catch (error) {
      console.error('Failed to log consumption:', error);
      showError(`Failed to log consumption: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConsumption = async (consumptionId) => {
    if (window.confirm('Are you sure you want to delete this consumption record? This action cannot be undone.')) {
      try {
        setLoading(true);
        
        // Find the consumption record to restore feed quantity
        const consumptionRecord = feedConsumption.find(c => c.id === consumptionId);
        if (consumptionRecord) {
          const feedItem = feedInventory.find(feed => feed.id === consumptionRecord.feed_id);
          if (feedItem) {
            // Restore the consumed quantity back to inventory
            await updateFeedInventory(feedItem.id, {
              ...feedItem,
              quantity_kg: feedItem.quantity_kg + consumptionRecord.quantity_consumed
            });
          }
        }
        
        await deleteFeedConsumption(consumptionId);
        await loadFeedInventory();
        showSuccess('Consumption record deleted successfully');
      } catch (error) {
        console.error('Failed to delete consumption record:', error);
        showError('Failed to delete consumption record. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="feed-management-container">
      {/* Page Header */}
      <div className="page-header">
        <h1>Feed Management</h1>
        <div className="header-actions">
          {/* Database Reset Button */}
          <button 
            className="btn btn-danger" 
            onClick={resetFeedData}
            disabled={loading}
            style={{ 
              backgroundColor: '#dc3545', 
              color: 'white',
              fontWeight: 'bold',
              border: '2px solid #bd2130',
              marginRight: '10px'
            }}
          >
            🚨 Database Reset
          </button>
          
          {activeTab === 'inventory' && (
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setEditingFeed(null);
                setShowFeedForm(true);
              }}
              disabled={loading}
            >
              Add Feed Stock
            </button>
          )}
          
          {activeTab === 'consumption' && (
            <button 
              className="btn btn-primary" 
              onClick={() => setShowConsumptionForm(true)}
              disabled={loading}
            >
              Log Consumption
            </button>
          )}
        </div>
      </div>

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
        {activeTab === 'inventory' && (
          <FeedInventoryView
            feedInventory={feedInventory}
            onEdit={handleEditFeed}
            onDelete={handleDeleteFeed}
            filters={inventoryFilters}
            onFiltersChange={setInventoryFilters}
            loading={loading}
          />
        )}

        {activeTab === 'consumption' && (
          <FeedConsumptionView
            feedConsumption={feedConsumption}
            feedInventory={feedInventory}
            liveChickens={liveChickens}
            onDelete={handleDeleteConsumption}
            filters={consumptionFilters}
            onFiltersChange={setConsumptionFilters}
            loading={loading}
          />
        )}

        {activeTab === 'analytics' && (
          <FeedAnalyticsView
            feedInventory={feedInventory}
            feedConsumption={feedConsumption}
            liveChickens={liveChickens}
          />
        )}
      </div>

      {/* Feed Form Modal */}
      <FeedForm
        isOpen={showFeedForm}
        onClose={() => {
          setShowFeedForm(false);
          setEditingFeed(null);
        }}
        onSubmit={handleFeedSubmit}
        editingFeed={editingFeed}
        liveChickens={liveChickens}
        loading={loading}
      />

      {/* Feed Consumption Form Modal */}
      <FeedConsumptionForm
        isOpen={showConsumptionForm}
        onClose={() => setShowConsumptionForm(false)}
        onSubmit={handleConsumptionSubmit}
        feedInventory={feedInventory}
        liveChickens={liveChickens}
        loading={loading}
      />
    </div>
  );
};

export default FeedManagement;
