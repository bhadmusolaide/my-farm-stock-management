import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context';
import { useNotification } from '../context/NotificationContext';
import { TabNavigation } from '../components/UI';
import {
  ProcessingForm,
  InventoryView,
  ProcessingHistory,
  DressedAnalyticsView,
  TraceabilityModal
} from '../components/DressedChicken';
import './DressedChickenStock.css';

const DressedChickenStock = () => {
  const {
    dressedChickens,
    liveChickens,
    addDressedChicken,
    updateDressedChicken,
    deleteDressedChicken,
    batchRelationships,
    addBatchRelationship,
    updateLiveChicken,
    addLiveChicken,
    loadDressedChickens,
    loadBatchRelationships,
    chickenSizeCategories,
    loadChickenSizeCategories
  } = useAppContext();

  const { showSuccess, showError } = useNotification();

  // State management
  const [activeTab, setActiveTab] = useState('inventory');
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [editingChicken, setEditingChicken] = useState(null);
  const [viewingTraceability, setViewingTraceability] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [inventoryFilters, setInventoryFilters] = useState({
    sizeCategory: '',
    status: '',
    expiryStatus: '',
    storageLocation: '',
    searchTerm: ''
  });

  const [historyFilters, setHistoryFilters] = useState({
    liveBatchId: '',
    dressedBatchId: '',
    breed: '',
    dateRange: '',
    yieldThreshold: ''
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadDressedChickens(),
          loadBatchRelationships(),
          loadChickenSizeCategories()
        ]);
      } catch (error) {
        console.error('Failed to load data:', error);
        showError('Failed to load data. Please refresh the page.');
      }
    };

    loadData();
  }, [loadDressedChickens, loadBatchRelationships, loadChickenSizeCategories, showError]);

  // Tab configuration
  const tabs = [
    { 
      key: 'inventory', 
      label: 'Inventory', 
      icon: '📦',
      badge: dressedChickens?.length || 0
    },
    { 
      key: 'processing', 
      label: 'Processing History', 
      icon: '⚙️' 
    },
    { 
      key: 'analytics', 
      label: 'Analytics', 
      icon: '📊' 
    }
  ];

  // Helper function to calculate default expiry date
  const calculateDefaultExpiryDate = (processingDateStr) => {
    const date = new Date(processingDateStr);
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split('T')[0];
  };

  // Event handlers
  const handleProcessingSubmit = async (processingData) => {
    try {
      setLoading(true);

      const {
        selectedBatch,
        processingDate,
        sizeCategoryId,
        sizeCategoryCustom,
        processingQuantity,
        storageLocation,
        expiryDate,
        notes,
        createNewBatchForRemaining,
        remainingBatchId,
        quantityToProcess,
        remainingBirds,
        averageWeight,
        partsCount,
        partsWeight,
        selectedBatchData
      } = processingData;

      // Create dressed chicken record
      const dressedChickenData = {
        id: Date.now().toString(),
        batch_id: selectedBatch,
        processing_date: processingDate,
        initial_count: quantityToProcess,
        current_count: quantityToProcess,
        average_weight: averageWeight,
        size_category_id: sizeCategoryId === 'custom' ? null : (sizeCategoryId || null),
        size_category_custom: sizeCategoryId === 'custom' ? sizeCategoryCustom : null,
        size_category: sizeCategoryId && sizeCategoryId !== 'custom'
          ? chickenSizeCategories.find(sc => sc.id === sizeCategoryId)?.name?.toLowerCase()
          : (sizeCategoryId === 'custom' ? sizeCategoryCustom : 'medium'),
        status: 'in-storage',
        storage_location: storageLocation || '',
        expiry_date: expiryDate || calculateDefaultExpiryDate(processingDate),
        notes: notes || '',
        parts_count: partsCount,
        parts_weight: partsWeight,
        processing_quantity: quantityToProcess,
        remaining_birds: remainingBirds,
        create_new_batch_for_remaining: createNewBatchForRemaining,
        remaining_batch_id: remainingBatchId
      };

      // Add the dressed chicken record
      await addDressedChicken(dressedChickenData);

      // Create batch relationship
      await addBatchRelationship({
        source_batch_id: selectedBatch,
        target_batch_id: dressedChickenData.id,
        relationship_type: 'partial_processed_from',
        quantity: quantityToProcess,
        created_at: new Date().toISOString()
      });

      // Update the live chicken batch
      const updatedLiveBatch = {
        ...selectedBatchData,
        current_count: remainingBirds,
        status: remainingBirds === 0 ? 'completed' : selectedBatchData.status
      };
      await updateLiveChicken(selectedBatch, updatedLiveBatch);

      // Create new batch for remaining birds if requested
      if (createNewBatchForRemaining && remainingBirds > 0 && remainingBatchId) {
        const newBatchData = {
          ...selectedBatchData,
          id: Date.now().toString() + '_remaining',
          batch_id: remainingBatchId,
          initial_count: remainingBirds,
          current_count: remainingBirds,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await addLiveChicken(newBatchData);
      }

      // Refresh data
      await Promise.all([
        loadDressedChickens(),
        loadBatchRelationships()
      ]);

      showSuccess('Chicken processing recorded successfully');
      setShowProcessingModal(false);

    } catch (error) {
      console.error('Error processing chickens:', error);
      showError(`Failed to process chickens: ${error.message}`);
      throw error; // Re-throw to let ProcessingForm handle the error display
    } finally {
      setLoading(false);
    }
  };

  const handleEditChicken = (chicken) => {
    setEditingChicken(chicken);
    // TODO: Implement edit modal
    alert(`Edit functionality for ${chicken.batch_id} - Feature coming soon!`);
  };

  const handleDeleteChicken = async (chickenId) => {
    if (window.confirm('Are you sure you want to delete this dressed chicken record? This action cannot be undone.')) {
      try {
        setLoading(true);
        await deleteDressedChicken(chickenId);
        await loadDressedChickens();
        showSuccess('Dressed chicken record deleted successfully');
      } catch (error) {
        console.error('Failed to delete chicken:', error);
        showError('Failed to delete chicken record. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewTraceability = (chicken) => {
    setViewingTraceability(chicken);
  };

  const handleCloseTraceability = () => {
    setViewingTraceability(null);
  };

  return (
    <div className="dressed-chicken-container">
      {/* Page Header */}
      <div className="page-header">
        <h1>Dressed Chicken Stock</h1>
        <div className="header-actions">
          <button
            onClick={() => setShowProcessingModal(true)}
            className="btn btn-primary"
            disabled={loading}
          >
            Record Processing
          </button>
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
          <InventoryView
            dressedChickens={dressedChickens}
            chickenSizeCategories={chickenSizeCategories}
            onEdit={handleEditChicken}
            onDelete={handleDeleteChicken}
            onViewTraceability={handleViewTraceability}
            filters={inventoryFilters}
            onFiltersChange={setInventoryFilters}
            loading={loading}
          />
        )}

        {activeTab === 'processing' && (
          <ProcessingHistory
            batchRelationships={batchRelationships}
            liveChickens={liveChickens}
            dressedChickens={dressedChickens}
            filters={historyFilters}
            onFiltersChange={setHistoryFilters}
            loading={loading}
          />
        )}

        {activeTab === 'analytics' && (
          <DressedAnalyticsView
            dressedChickens={dressedChickens}
            chickenSizeCategories={chickenSizeCategories}
          />
        )}
      </div>

      {/* Processing Form Modal */}
      <ProcessingForm
        isOpen={showProcessingModal}
        onClose={() => setShowProcessingModal(false)}
        onSubmit={handleProcessingSubmit}
        liveChickens={liveChickens}
        chickenSizeCategories={chickenSizeCategories}
        loading={loading}
      />

      {/* Traceability Modal */}
      <TraceabilityModal
        isOpen={!!viewingTraceability}
        onClose={handleCloseTraceability}
        chicken={viewingTraceability}
        liveChickens={liveChickens}
        batchRelationships={batchRelationships}
      />
    </div>
  );
};

export default DressedChickenStock;
