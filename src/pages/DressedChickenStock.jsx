import React, { useState, useContext, useEffect, useCallback, memo, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import { formatWeight } from '../utils/formatters';
import Modal from '../components/Modal';
import ActionButtons from '../components/ActionButtons';
import { validateDressedChickenData } from '../utils/chickenProcessingValidation';
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
     loadChickenSizeCategories,
     chickenPartTypes
   } = useContext(AppContext);

  const { showSuccess, showError, showWarning } = useNotification();

  const [activeTab, setActiveTab] = useState('inventory');
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [editingChicken, setEditingChicken] = useState(null);
  const [viewingTraceability, setViewingTraceability] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Processing modal state
  const [selectedBatch, setSelectedBatch] = useState('');
  const [processingDate, setProcessingDate] = useState(new Date().toISOString().split('T')[0]);
  const [sizeCategoryId, setSizeCategoryId] = useState(''); // Changed to use ID
  const [sizeCategoryCustom, setSizeCategoryCustom] = useState(''); // For custom size names
  const [processingQuantity, setProcessingQuantity] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [createNewBatchForRemaining, setCreateNewBatchForRemaining] = useState(false);
  const [remainingBatchId, setRemainingBatchId] = useState('');
  const [neckCount, setNeckCount] = useState('');
  const [neckWeight, setNeckWeight] = useState('');
  const [feetCount, setFeetCount] = useState('');
  const [feetWeight, setFeetWeight] = useState('');
  const [gizzardCount, setGizzardCount] = useState('');
  const [gizzardWeight, setGizzardWeight] = useState('');
  const [dogFoodCount, setDogFoodCount] = useState('');
  const [dogFoodWeight, setDogFoodWeight] = useState('');

  // ========== HELPER FUNCTIONS (defined before hooks that use them) ==========

  // Helper to calculate default expiry date (3 months from processing date)
  const calculateDefaultExpiryDate = (processingDateStr) => {
    const date = new Date(processingDateStr);
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split('T')[0];
  };

  // Helper to check if item is expiring soon (within 7 days)
  const isExpiringSoon = (expiryDateStr) => {
    if (!expiryDateStr) return false;
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  };

  // Helper to check if item is expired
  const isExpired = (expiryDateStr) => {
    if (!expiryDateStr) return false;
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    return expiryDate < today;
  };

  // Helper to get expiry status badge
  const getExpiryStatusBadge = (expiryDateStr) => {
    if (!expiryDateStr) return null;

    if (isExpired(expiryDateStr)) {
      return <span style={{ color: '#c62828', fontWeight: 'bold' }}>⚠️ EXPIRED</span>;
    }

    if (isExpiringSoon(expiryDateStr)) {
      return <span style={{ color: '#f57f17', fontWeight: 'bold' }}>⚠️ Expiring Soon</span>;
    }

    return null;
  };

  // Helper to get actual whole chicken count (handles old and new data formats)
  const getWholeChickenCount = (chicken) => {
    // Prefer explicit processing_quantity (new format - most reliable)
    if (chicken.processing_quantity !== undefined && chicken.processing_quantity !== null) {
      return chicken.processing_quantity;
    }

    // Fall back to current_count (standard field)
    if (chicken.current_count !== undefined && chicken.current_count !== null) {
      return chicken.current_count;
    }

    // Last resort: use initial_count
    return chicken.initial_count || 0;
  };

  // Helper to get display name for size category (handles both old and new formats)
  const getSizeCategoryDisplay = (chicken) => {
    // Priority 1: Custom size name
    if (chicken.size_category_custom) {
      return chicken.size_category_custom;
    }

    // Priority 2: Look up size category by ID
    if (chicken.size_category_id && chickenSizeCategories.length > 0) {
      const category = chickenSizeCategories.find(sc => sc.id === chicken.size_category_id);
      if (category) {
        return category.name;
      }
    }

    // Priority 3: Old format - direct string value
    if (chicken.size_category) {
      // Capitalize first letter for display
      return chicken.size_category.charAt(0).toUpperCase() + chicken.size_category.slice(1);
    }

    return 'Not specified';
  };

  // Format weight using existing formatter
  const formatPartWeight = (weight) => formatWeight(weight);

  // Calculate total parts count
  const getTotalPartsCount = (partsCount) => {
    return Object.values(partsCount || {}).reduce((sum, count) => sum + count, 0);
  };

  // Calculate total parts weight
  const getTotalPartsWeight = (partsWeight) => {
    return Object.values(partsWeight || {}).reduce((sum, weight) => sum + weight, 0);
  };

  // ========== HOOKS AND CALLBACKS ==========

  // Memoized edit handler to prevent inline function churn
  const handleEditChicken = useCallback((chicken) => {
    setEditingChicken(chicken);
  }, []);

  // Load dressed chickens, batch relationships, and size categories on mount
  useEffect(() => {
    if (!dressedChickens || dressedChickens.length === 0) {
      loadDressedChickens();
    }
    if (!batchRelationships || batchRelationships.length === 0) {
      loadBatchRelationships();
    }
    if (!chickenSizeCategories || chickenSizeCategories.length === 0) {
      loadChickenSizeCategories();
    }
  }, [dressedChickens, loadDressedChickens, batchRelationships, loadBatchRelationships, chickenSizeCategories, loadChickenSizeCategories]);

  // Auto-calculate expiry date when processing date changes
  useEffect(() => {
    if (processingDate && !expiryDate) {
      setExpiryDate(calculateDefaultExpiryDate(processingDate));
    }
  }, [processingDate, expiryDate]);

  // Memoize expiry warnings calculation
  const expiryWarnings = useMemo(() => {
    const expiringSoon = dressedChickens.filter(dc =>
      dc.status === 'in-storage' && isExpiringSoon(dc.expiry_date)
    );
    const expired = dressedChickens.filter(dc =>
      dc.status === 'in-storage' && isExpired(dc.expiry_date)
    );
    return { expiringSoon, expired };
  }, [dressedChickens]);

  // Show expiry warnings on component mount
  useEffect(() => {
    if (expiryWarnings.expired.length > 0) {
      showError(`${expiryWarnings.expired.length} batch(es) have EXPIRED! Please review immediately.`);
    } else if (expiryWarnings.expiringSoon.length > 0) {
      showWarning(`${expiryWarnings.expiringSoon.length} batch(es) expiring within 7 days.`);
    }
  }, [expiryWarnings.expired.length, expiryWarnings.expiringSoon.length]);

  const handleProcessChickenForm = async (e) => {
    e.preventDefault();

    // Validate batch selection
    if (!selectedBatch) {
      showError('Please select a live chicken batch');
      return;
    }

    // Validate size category
    if (!sizeCategoryId) {
      showError('Please select a size category');
      return;
    }

    if (sizeCategoryId === 'custom' && !sizeCategoryCustom.trim()) {
      showError('Please enter a custom size name');
      return;
    }

    // Validate processing quantity
    const selectedBatchData = liveChickens.find(batch => batch.id === selectedBatch);
    const availableBirds = selectedBatchData?.current_count || 0;
    const quantityToProcess = parseInt(processingQuantity) || 0;

    if (quantityToProcess <= 0) {
      showError('Please enter a valid quantity to process (must be greater than 0)');
      return;
    }

    if (quantityToProcess > availableBirds) {
      showError(`Cannot process ${quantityToProcess} birds. Only ${availableBirds} birds available in this batch.`);
      return;
    }

    // Validate remaining batch ID if creating new batch
    if (createNewBatchForRemaining && !remainingBatchId.trim()) {
      showError('Please enter a batch ID for the remaining birds');
      return;
    }

    // Validate that remaining batch ID is unique
    if (createNewBatchForRemaining && remainingBatchId.trim()) {
      const isDuplicate = liveChickens.some(batch => batch.batch_id === remainingBatchId.trim());
      if (isDuplicate) {
        showError(`Batch ID "${remainingBatchId}" already exists. Please choose a different ID.`);
        return;
      }
    }

    // Validate parts data - each part type should not exceed the processing quantity
    const neckCountVal = parseInt(neckCount) || 0;
    const neckWeightVal = parseFloat(neckWeight) || 0;
    const feetCountVal = parseInt(feetCount) || 0;
    const feetWeightVal = parseFloat(feetWeight) || 0;
    const gizzardCountVal = parseInt(gizzardCount) || 0;
    const gizzardWeightVal = parseFloat(gizzardWeight) || 0;
    const dogFoodCountVal = parseInt(dogFoodCount) || 0;
    const dogFoodWeightVal = parseFloat(dogFoodWeight) || 0;

    // Check if at least one part has a count
    if (neckCountVal === 0 && feetCountVal === 0 && gizzardCountVal === 0 && dogFoodCountVal === 0) {
      showError('Please enter at least one part count');
      return;
    }

    // Validate weights are non-negative
    if (neckWeightVal < 0 || feetWeightVal < 0 || gizzardWeightVal < 0 || dogFoodWeightVal < 0) {
      showError('Part weights cannot be negative');
      return;
    }

    // Check individual part counts don't exceed processing quantity
    if (neckCountVal > quantityToProcess) {
      showError(`Neck count (${neckCountVal}) cannot exceed processing quantity (${quantityToProcess})`);
      return;
    }
    if (feetCountVal > quantityToProcess * 2) { // Feet come in pairs
      showWarning(`Feet count (${feetCountVal}) seems high for ${quantityToProcess} birds (expected ~${quantityToProcess * 2})`);
    }
    if (gizzardCountVal > quantityToProcess) {
      showError(`Gizzard count (${gizzardCountVal}) cannot exceed processing quantity (${quantityToProcess})`);
      return;
    }
    if (dogFoodCountVal > quantityToProcess) {
      showError(`Dog food count (${dogFoodCountVal}) cannot exceed processing quantity (${quantityToProcess})`);
      return;
    }

    const partsCount = {
      neck: parseInt(neckCount) || 0,
      feet: parseInt(feetCount) || 0,
      gizzard: parseInt(gizzardCount) || 0,
      dog_food: parseInt(dogFoodCount) || 0
    };

    const partsWeight = {
      neck: parseFloat(neckWeight) || 0,
      feet: parseFloat(feetWeight) || 0,
      gizzard: parseFloat(gizzardWeight) || 0,
      dog_food: parseFloat(dogFoodWeight) || 0
    };

    // Calculate total parts weight and average weight per chicken
    const totalPartsWeight = Object.values(partsWeight).reduce((a, b) => a + b, 0);
    const averageWeight = quantityToProcess > 0 ? (totalPartsWeight / quantityToProcess) : 0;

    const remainingBirds = availableBirds - quantityToProcess;

    const data = {
      id: Date.now().toString(),
      batch_id: selectedBatch,
      processing_date: processingDate,
      initial_count: quantityToProcess, // Number of whole chickens processed
      current_count: quantityToProcess, // Current number of whole chickens available
      average_weight: averageWeight,
      // Use new format: size_category_id and size_category_custom
      size_category_id: sizeCategoryId === 'custom' ? null : (sizeCategoryId || null),
      size_category_custom: sizeCategoryId === 'custom' ? sizeCategoryCustom : null,
      // Keep old format for backward compatibility (will be removed in future)
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

    setIsProcessing(true);

    try {
      // Add the dressed chicken record first
      await addDressedChicken(data);

      // Update live chicken count
      const sourceBatch = liveChickens.find(batch => batch.id === data.batch_id);
      if (sourceBatch) {
        const newCount = Math.max(0, sourceBatch.current_count - data.processing_quantity);

        // Update the source batch
        await updateLiveChicken(data.batch_id, {
          ...sourceBatch,
          current_count: newCount,
          updated_at: new Date().toISOString()
        });

        // If there are remaining birds and user wants to create a new batch
        if (data.remaining_birds > 0 && data.create_new_batch_for_remaining && data.remaining_batch_id) {
          // Create a new batch for remaining birds
          const newBatch = {
            id: Date.now().toString() + '_remaining',
            batch_id: data.remaining_batch_id,
            breed: sourceBatch.breed,
            initial_count: data.remaining_birds,
            current_count: data.remaining_birds,
            hatch_date: sourceBatch.hatch_date,
            expected_weight: sourceBatch.expected_weight,
            current_weight: sourceBatch.current_weight,
            feed_type: sourceBatch.feed_type,
            status: 'healthy',
            mortality: 0,
            notes: `Split from batch ${sourceBatch.batch_id} - Remaining birds after processing ${data.processing_quantity} birds`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          await addLiveChicken(newBatch);

          // Create batch relationship for the split
          await addBatchRelationship({
            id: Date.now().toString() + '_split',
            source_batch_id: data.batch_id,
            source_batch_type: 'live_chickens',
            target_batch_id: newBatch.id,
            target_batch_type: 'live_chickens',
            relationship_type: 'split_from',
            quantity: data.remaining_birds,
            notes: `Split ${data.remaining_birds} birds from original batch`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }

        // Create batch relationship for processing
        await addBatchRelationship({
          id: Date.now().toString() + '_processed',
          source_batch_id: data.batch_id,
          source_batch_type: 'live_chickens',
          target_batch_id: data.id,
          target_batch_type: 'dressed_chickens',
          relationship_type: 'partial_processed_from',
          quantity: data.processing_quantity,
          notes: `Processed ${data.processing_quantity} birds from batch ${sourceBatch.batch_id}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Reset form
      setSelectedBatch('');
      setProcessingQuantity('');
      setSizeCategoryId('');
      setSizeCategoryCustom('');
      setStorageLocation('');
      setExpiryDate('');
      setNotes('');
      setCreateNewBatchForRemaining(false);
      setRemainingBatchId('');
      setNeckCount('');
      setNeckWeight('');
      setFeetCount('');
      setFeetWeight('');
      setGizzardCount('');
      setGizzardWeight('');
      setDogFoodCount('');
      setDogFoodWeight('');

      // Refresh data to show new record
      await loadDressedChickens();
      await loadBatchRelationships();

      showSuccess(`Successfully processed ${quantityToProcess} birds from batch ${selectedBatchData.batch_id}`);

      // Close modal after all operations complete
      setShowProcessingModal(false);
    } catch (error) {
      console.error('Error processing chicken:', error);
      showError(`Failed to process chicken: ${error.message}`);
      // Keep modal open so user can retry
    } finally {
      setIsProcessing(false);
    }
  };



  const handleUpdateChickenForm = async (e) => {
    e.preventDefault();

    if (!editingChicken) return;

    const partsCount = {
      neck: parseInt(editingChicken.parts_count?.neck) || 0,
      feet: parseInt(editingChicken.parts_count?.feet) || 0,
      gizzard: parseInt(editingChicken.parts_count?.gizzard) || 0,
      dog_food: parseInt(editingChicken.parts_count?.dog_food) || 0
    };

    const partsWeight = {
      neck: parseFloat(editingChicken.parts_weight?.neck) || 0,
      feet: parseFloat(editingChicken.parts_weight?.feet) || 0,
      gizzard: parseFloat(editingChicken.parts_weight?.gizzard) || 0,
      dog_food: parseFloat(editingChicken.parts_weight?.dog_food) || 0
    };

    // Calculate total parts weight and average weight based on processing quantity (not current count)
    const totalPartsWeight = Object.values(partsWeight).reduce((a, b) => a + b, 0);
    const processingQuantity = editingChicken.processing_quantity || editingChicken.initial_count || 0;
    const averageWeight = processingQuantity > 0 ? (totalPartsWeight / processingQuantity) : 0;

    const data = {
      id: editingChicken.id,
      batch_id: editingChicken.batch_id,
      processing_date: editingChicken.processing_date || editingChicken.processingDate,
      initial_count: editingChicken.initial_count || editingChicken.initialCount,
      current_count: editingChicken.current_count, // Use the independently edited whole chicken count
      average_weight: averageWeight,
      // Use new flexible size category system
      size_category_id: editingChicken.size_category_id,
      size_category_custom: editingChicken.size_category_custom,
      // Keep old format for backward compatibility
      size_category: editingChicken.size_category,
      status: editingChicken.status,
      storage_location: editingChicken.storage_location,
      expiry_date: editingChicken.expiry_date,
      parts_count: partsCount,
      parts_weight: partsWeight,
      processing_quantity: editingChicken.processing_quantity,
      // Add any additional custom fields
      custom_fields: editingChicken.custom_fields || {}
    };

    setIsUpdating(true);

    try {
      await updateDressedChicken(data.id, data);

      // Refresh data to show updated record
      await loadDressedChickens();

      showSuccess('Dressed chicken record updated successfully');

      // Close modal after successful update
      setEditingChicken(null);

    } catch (error) {
      console.error('Error updating chicken:', error);
      showError(`Failed to update chicken: ${error.message}`);
      // Don't close modal on error so user can retry
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteChicken = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dressed chicken record? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDressedChicken(id);
      await loadDressedChickens();
      showSuccess('Dressed chicken record deleted successfully');
    } catch (error) {
      console.error('Error deleting chicken:', error);
      showError(`Failed to delete chicken: ${error.message}`);
    }
  };

  // Traceability Modal Component (Memoized)
  const TraceabilityModal = memo(({ chicken, onClose }) => {
    if (!chicken) return null;

    // Find the source batch relationship
    const sourceRelationship = batchRelationships.find(
      br => br.target_batch_id === chicken.id && br.target_batch_type === 'dressed_chickens'
    );
    const sourceBatch = sourceRelationship
      ? liveChickens.find(lc => lc.id === sourceRelationship.source_batch_id)
      : null;

    return (
      <Modal onClose={onClose}>
        <h2 style={{marginBottom: '20px'}}>Batch Traceability</h2>

        <div style={{marginBottom: '20px'}}>
          <h3 style={{fontSize: '1.1em', marginBottom: '10px', color: '#2e7d32'}}>
            📦 Dressed Chicken Batch
          </h3>
          <div style={{padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px'}}>
            <p><strong>Batch ID:</strong> {chicken.batch_id}</p>
            <p><strong>Processing Date:</strong> {new Date(chicken.processing_date).toLocaleDateString()}</p>
            <p><strong>Processed Quantity:</strong> {chicken.processing_quantity || chicken.initial_count} birds</p>
            <p><strong>Current Count:</strong> {chicken.current_count} birds</p>
            <p><strong>Size Category:</strong> {getSizeCategoryDisplay(chicken)}</p>
            <p><strong>Average Weight:</strong> {formatWeight(chicken.average_weight)}</p>
            <p><strong>Storage:</strong> {chicken.storage_location || 'Not specified'}</p>
            <p><strong>Expiry Date:</strong> {chicken.expiry_date ? new Date(chicken.expiry_date).toLocaleDateString() : 'Not set'}</p>
            {chicken.notes && <p><strong>Notes:</strong> {chicken.notes}</p>}
          </div>
        </div>

        {sourceRelationship && sourceBatch && (
          <div style={{marginBottom: '20px'}}>
            <h3 style={{fontSize: '1.1em', marginBottom: '10px', color: '#1976d2'}}>
              🐔 Source Live Chicken Batch
            </h3>
            <div style={{padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px'}}>
              <p><strong>Batch ID:</strong> {sourceBatch.batch_id}</p>
              <p><strong>Breed:</strong> {sourceBatch.breed}</p>
              <p><strong>Hatch Date:</strong> {new Date(sourceBatch.hatch_date).toLocaleDateString()}</p>
              <p><strong>Birds Processed:</strong> {sourceRelationship.quantity}</p>
              <p><strong>Relationship Type:</strong> {sourceRelationship.relationship_type.replace(/_/g, ' ')}</p>
              {sourceRelationship.notes && <p><strong>Notes:</strong> {sourceRelationship.notes}</p>}
            </div>
          </div>
        )}

        {!sourceRelationship && (
          <div style={{padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px', marginBottom: '20px'}}>
            <p style={{color: '#f57f17'}}>⚠️ No source batch information available</p>
          </div>
        )}

        <div className="form-actions">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </Modal>
    );
  });

  // Inventory View Component (Memoized)
  const InventoryView = memo(({ dressedChickens, onEdit, onDelete, onViewTraceability }) => {
    return (
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="dressed-chicken-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Size Category</th>
                <th>Whole Chickens</th>
                <th>Avg Weight</th>
                <th>Storage Location</th>
                <th>Expiry Date</th>
                <th>Parts Inventory</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dressedChickens.map((chicken) => (
                <tr key={chicken.id} style={{
                  backgroundColor: isExpired(chicken.expiry_date) ? '#ffebee' :
                                   isExpiringSoon(chicken.expiry_date) ? '#fff9c4' : 'transparent'
                }}>
                  <td className="font-medium">{chicken.batch_id}</td>
                  <td>
                    {getSizeCategoryDisplay(chicken)}
                  </td>
                  <td>
                    <strong>{getWholeChickenCount(chicken)}</strong>
                    <small style={{display: 'block', color: '#666'}}>
                      (Processed: {chicken.processing_quantity || chicken.initial_count || getWholeChickenCount(chicken)})
                    </small>
                  </td>
                  <td>{formatWeight(chicken.average_weight)}</td>
                  <td>
                    {chicken.storage_location || <span style={{color: '#999'}}>Not specified</span>}
                  </td>
                  <td>
                    <div>
                      {chicken.expiry_date ? new Date(chicken.expiry_date).toLocaleDateString() :
                        <span style={{color: '#999'}}>Not set</span>
                      }
                      {getExpiryStatusBadge(chicken.expiry_date) && (
                        <div style={{marginTop: '4px'}}>
                          {getExpiryStatusBadge(chicken.expiry_date)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Neck:</span>
                        <span>{chicken.parts_count?.neck || 0} ({formatWeight(chicken.parts_weight?.neck || 0)})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Feet:</span>
                        <span>{chicken.parts_count?.feet || 0} ({formatWeight(chicken.parts_weight?.feet || 0)})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gizzard:</span>
                        <span>{chicken.parts_count?.gizzard || 0} ({formatWeight(chicken.parts_weight?.gizzard || 0)})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dog Food:</span>
                        <span>{chicken.parts_count?.dog_food || 0} ({formatWeight(chicken.parts_weight?.dog_food || 0)})</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${chicken.status}`}>
                      {chicken.status}
                    </span>
                  </td>
                  <td>
                    <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                      <button
                        onClick={() => onViewTraceability(chicken)}
                        className="btn btn-sm"
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.85em',
                          backgroundColor: '#1976d2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        title="View batch traceability"
                      >
                        🔍 Trace
                      </button>
                      <ActionButtons
                        row={chicken}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  });

  // Processing History View Component (Memoized)
  const ProcessingHistoryView = memo(({ batchRelationships, liveChickens, dressedChickens }) => {
    const getLiveChickenById = (id) => {
      return liveChickens.find(lc => lc.id === id) || {};
    };

    const getDressedChickenById = (id) => {
      return dressedChickens.find(dc => dc.id === id) || {};
    };

    // Filter for processing relationships only
    const processingRelationships = batchRelationships.filter(br => br.relationship_type === 'partial_processed_from');

    return (
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="dressed-chicken-table">
            <thead>
              <tr>
                <th>Live Batch</th>
                <th>Birds Processed</th>
                <th>Processed Batch</th>
                <th>Dressed Count</th>
                <th>Processing Date</th>
                <th>Yield Rate</th>
              </tr>
            </thead>
            <tbody>
              {processingRelationships.map((relationship) => {
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

                return (
                  <tr key={relationship.id}>
                    <td className="font-medium">{source.batch_id || 'N/A'}</td>
                    <td>{birdsProcessed}</td>
                    <td className="font-medium">{target.batch_id || 'N/A'}</td>
                    <td>{dressedCount}</td>
                    <td>
                      {target.processing_date ? new Date(target.processing_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <span style={{
                        color: parseFloat(yieldRate) < 95 ? '#f57f17' : parseFloat(yieldRate) > 100 ? '#c62828' : '#2e7d32'
                      }}>
                        {yieldRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {processingRelationships.length === 0 && (
                <tr>
                  <td colSpan="6" className="no-data">
                    No processing history found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  });

  // Analytics View Component (Memoized)
  const AnalyticsView = memo(({ dressedChickens }) => {
    // Memoize expensive analytics calculations
    const analytics = useMemo(() => {
      const totalBatches = dressedChickens.length;
      const totalWholeChickens = dressedChickens.reduce((sum, dc) => sum + getWholeChickenCount(dc), 0);
      const totalWeight = dressedChickens.reduce((sum, dc) => sum + (getWholeChickenCount(dc) * (dc.average_weight || 0)), 0);

      const sizeDistribution = dressedChickens.reduce((acc, dc) => {
        const sizeKey = getSizeCategoryDisplay(dc);
        acc[sizeKey] = (acc[sizeKey] || 0) + getWholeChickenCount(dc);
        return acc;
      }, {});

      const partsStats = dressedChickens.reduce((acc, dc) => {
        const partsCount = dc.parts_count || {};
        const partsWeight = dc.parts_weight || {};

        acc.partsCount.neck = (acc.partsCount.neck || 0) + (partsCount.neck || 0);
        acc.partsCount.feet = (acc.partsCount.feet || 0) + (partsCount.feet || 0);
        acc.partsCount.gizzard = (acc.partsCount.gizzard || 0) + (partsCount.gizzard || 0);
        acc.partsCount.dog_food = (acc.partsCount.dog_food || 0) + (partsCount.dog_food || 0);

        acc.partsWeight.neck = (acc.partsWeight.neck || 0) + (partsWeight.neck || 0);
        acc.partsWeight.feet = (acc.partsWeight.feet || 0) + (partsWeight.feet || 0);
        acc.partsWeight.gizzard = (acc.partsWeight.gizzard || 0) + (partsWeight.gizzard || 0);
        acc.partsWeight.dog_food = (acc.partsWeight.dog_food || 0) + (partsWeight.dog_food || 0);

        return acc;
      }, { partsCount: {}, partsWeight: {} });

      return { totalBatches, totalWholeChickens, totalWeight, sizeDistribution, partsStats };
    }, [dressedChickens]);

    const { totalBatches, totalWholeChickens, totalWeight, sizeDistribution, partsStats } = analytics;

    // Status distribution
    const statusDistribution = dressedChickens.reduce((acc, dc) => {
      acc[dc.status] = (acc[dc.status] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="dressed-chicken-container">
        {/* Overall Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <div className="stat-content">
              <h3>Total Batches</h3>
              <p>{totalBatches}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div className="stat-content">
              <h3>Total Whole Chickens</h3>
              <p>{totalWholeChickens}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
              </svg>
            </div>
            <div className="stat-content">
              <h3>Total Weight</h3>
              <p>{formatWeight(totalWeight)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon yellow">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div className="stat-content">
              <h3>Avg. per Batch</h3>
              <p>
                {totalBatches > 0 ? ((totalWholeChickens / totalBatches) || 0).toFixed(1) : '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Charts and Distribution */}
        <div className="charts-grid">
          {/* Size Distribution */}
          <div className="chart-card">
            <h3>Size Distribution</h3>
            <div className="distribution-list">
              {Object.entries(sizeDistribution).map(([size, count]) => (
                <div key={size} className="distribution-item">
                  <div className="distribution-header">
                    <span className="distribution-label">{size}</span>
                    <span className="distribution-value">{count}</span>
                  </div>
                  <div className="distribution-bar">
                    <div
                      className="distribution-progress blue"
                      style={{ width: `${totalWholeChickens > 0 ? (count / totalWholeChickens) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {Object.keys(sizeDistribution).length === 0 && (
                <p className="no-data">No data available</p>
              )}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="chart-card">
            <h3>Status Distribution</h3>
            <div className="distribution-list">
              {Object.entries(statusDistribution).map(([status, count]) => (
                <div key={status} className="distribution-item">
                  <div className="distribution-header">
                    <span className="distribution-label">{status}</span>
                    <span className="distribution-value">{count}</span>
                  </div>
                  <div className="distribution-bar">
                    <div 
                      className={`distribution-progress ${
                        status === 'in-storage' ? 'green' : 
                        status === 'sold' ? 'yellow' : 'red'
                      }`} 
                      style={{ width: `${totalBatches > 0 ? (count / totalBatches) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {Object.keys(statusDistribution).length === 0 && (
                <p className="no-data">No data available</p>
              )}
            </div>
          </div>

          {/* Parts Count */}
          <div className="chart-card">
            <h3>Parts Count</h3>
            <div className="parts-grid">
              <div className="part-card">
                <h4>Neck</h4>
                <p>{partsStats.partsCount.neck || 0}</p>
              </div>
              <div className="part-card">
                <h4>Feet</h4>
                <p>{partsStats.partsCount.feet || 0}</p>
              </div>
              <div className="part-card">
                <h4>Gizzard</h4>
                <p>{partsStats.partsCount.gizzard || 0}</p>
              </div>
              <div className="part-card">
                <h4>Dog Food</h4>
                <p>{partsStats.partsCount.dog_food || 0}</p>
              </div>
            </div>
          </div>

          {/* Parts Weight */}
          <div className="chart-card">
            <h3>Parts Weight</h3>
            <div className="parts-grid">
              <div className="part-card">
                <h4>Neck</h4>
                <p>{formatPartWeight(partsStats.partsWeight.neck || 0)}</p>
              </div>
              <div className="part-card">
                <h4>Feet</h4>
                <p>{formatPartWeight(partsStats.partsWeight.feet || 0)}</p>
              </div>
              <div className="part-card">
                <h4>Gizzard</h4>
                <p>{formatPartWeight(partsStats.partsWeight.gizzard || 0)}</p>
              </div>
              <div className="part-card">
                <h4>Dog Food</h4>
                <p>{formatPartWeight(partsStats.partsWeight.dog_food || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });


  return (
    <div className="dressed-chicken-container">
      <div className="page-header">
        <h1>Dressed Chicken Stock</h1>
        <div className="header-actions">
          <button
            onClick={() => setShowProcessingModal(true)}
            className="btn btn-primary"
          >
            Record Processing
          </button>
        </div>
      </div>

      <div className="tab-navigation">
        <nav>
          <button
            className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
          <button
            className={`tab-button ${activeTab === 'processing' ? 'active' : ''}`}
            onClick={() => setActiveTab('processing')}
          >
            Processing History
          </button>
          <button
            className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <InventoryView
          dressedChickens={dressedChickens}
          onEdit={handleEditChicken}
          onDelete={handleDeleteChicken}
          onViewTraceability={setViewingTraceability}
        />
      )}

      {/* Processing History Tab */}
      {activeTab === 'processing' && (
        <ProcessingHistoryView 
          batchRelationships={batchRelationships}
          liveChickens={liveChickens}
          dressedChickens={dressedChickens}
        />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <AnalyticsView dressedChickens={dressedChickens} />
      )}

      {/* Processing Modal */}
      <Modal
        isOpen={showProcessingModal}
        onClose={() => setShowProcessingModal(false)}
      >
        <div className="modal-header">
          <h2>Record Chicken Processing</h2>
          <button
            onClick={() => setShowProcessingModal(false)}
            className="modal-close"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          handleProcessChickenForm(e);
        }}>
          <div className="form-group">
            <label>Live Chicken Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="form-control"
            >
              <option value="">Select Live Chicken Batch</option>
              {liveChickens
                .filter(batch => batch.status !== 'completed' && batch.current_count > 0) // Filter out completed batches and empty batches
                .map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batch_id} ({batch.breed}) - {batch.current_count} birds available
                </option>
              ))}
            </select>
          </div>

          {selectedBatch && (
            <div className="form-group">
              <label>Processing Quantity</label>
              <input
                type="number"
                placeholder="Number of birds to process"
                value={processingQuantity}
                onChange={(e) => setProcessingQuantity(e.target.value)}
                className="form-control"
                min="1"
                max={liveChickens.find(batch => batch.id === selectedBatch)?.current_count || 0}
                required
              />
              <small className="form-help">
                Available: {liveChickens.find(batch => batch.id === selectedBatch)?.current_count || 0} birds
              </small>
            </div>
          )}

          {selectedBatch && parseInt(processingQuantity) > 0 && (
            <div className="processing-summary">
              <h4>Processing Summary</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Available Birds:</span>
                  <span className="summary-value">{liveChickens.find(batch => batch.id === selectedBatch)?.current_count || 0}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Processing:</span>
                  <span className="summary-value">{processingQuantity}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Remaining:</span>
                  <span className="summary-value">{Math.max(0, (liveChickens.find(batch => batch.id === selectedBatch)?.current_count || 0) - parseInt(processingQuantity || 0))}</span>
                </div>
              </div>
            </div>
          )}

          {selectedBatch && parseInt(processingQuantity) > 0 && (
            <div className="batch-management-section">
              <h4>Remaining Birds Management</h4>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={createNewBatchForRemaining}
                    onChange={(e) => setCreateNewBatchForRemaining(e.target.checked)}
                  />
                  Create new batch for remaining birds
                </label>
              </div>

              {createNewBatchForRemaining && (
                <div className="form-group">
                  <label>Remaining Batch ID</label>
                  <input
                    type="text"
                    placeholder="e.g., BCH-2024-001-R"
                    value={remainingBatchId}
                    onChange={(e) => setRemainingBatchId(e.target.value)}
                    className="form-control"
                    required
                  />
                  <small className="form-help">
                    Remaining birds: {Math.max(0, (liveChickens.find(batch => batch.id === selectedBatch)?.current_count || 0) - parseInt(processingQuantity || 0))}
                  </small>
                </div>
              )}

              {!createNewBatchForRemaining && parseInt(processingQuantity) > 0 && (
                <div className="form-help">
                  <strong>Note:</strong> Remaining birds will stay in the current batch with updated count.
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Processing Date</label>
            <input
              type="date"
              value={processingDate}
              onChange={(e) => setProcessingDate(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Size Category</label>
            <select
              value={sizeCategoryId}
              onChange={(e) => {
                setSizeCategoryId(e.target.value);
                if (e.target.value !== 'custom') {
                  setSizeCategoryCustom(''); // Clear custom name if not custom
                }
              }}
              className="form-control"
              required
            >
              <option value="">Select Size Category</option>
              {chickenSizeCategories
                .filter(sc => sc.is_active)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(sc => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name} ({sc.min_weight}-{sc.max_weight}kg)
                  </option>
                ))
              }
              <option value="custom">Custom Size</option>
            </select>
          </div>

          {sizeCategoryId === 'custom' && (
            <div className="form-group">
              <label>Custom Size Name</label>
              <input
                type="text"
                placeholder="Enter custom size name (e.g., 'Farm Standard')"
                value={sizeCategoryCustom}
                onChange={(e) => setSizeCategoryCustom(e.target.value)}
                className="form-control"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Storage Location</label>
            <input
              type="text"
              placeholder="e.g., Freezer A, Cold Room 2"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              className="form-control"
            />
            <small style={{color: '#666', fontSize: '0.85em'}}>
              Optional: Specify where the dressed chickens will be stored
            </small>
          </div>

          <div className="form-group">
            <label>Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="form-control"
              min={processingDate}
            />
            <small style={{color: '#666', fontSize: '0.85em'}}>
              Default: 3 months from processing date
            </small>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              placeholder="Any additional notes about this processing batch..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-control"
              rows="3"
            />
          </div>

          <div className="form-section">
            <h3>Part Details</h3>

            {/* Neck */}
            <div className="form-row">
              <div className="form-group">
                <label>Neck Count</label>
                <input
                  type="number"
                  placeholder="Count"
                  value={neckCount}
                  onChange={(e) => setNeckCount(e.target.value)}
                  className="form-control"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Neck Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Weight"
                  value={neckWeight}
                  onChange={(e) => setNeckWeight(e.target.value)}
                  className="form-control"
                  min="0"
                />
              </div>
            </div>

            {/* Feet */}
            <div className="form-row">
              <div className="form-group">
                <label>Feet Count</label>
                <input
                  type="number"
                  placeholder="Count"
                  value={feetCount}
                  onChange={(e) => setFeetCount(e.target.value)}
                  className="form-control"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Feet Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Weight"
                  value={feetWeight}
                  onChange={(e) => setFeetWeight(e.target.value)}
                  className="form-control"
                  min="0"
                />
              </div>
            </div>

            {/* Gizzard */}
            <div className="form-row">
              <div className="form-group">
                <label>Gizzard Count</label>
                <input
                  type="number"
                  placeholder="Count"
                  value={gizzardCount}
                  onChange={(e) => setGizzardCount(e.target.value)}
                  className="form-control"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Gizzard Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Weight"
                  value={gizzardWeight}
                  onChange={(e) => setGizzardWeight(e.target.value)}
                  className="form-control"
                  min="0"
                />
              </div>
            </div>

            {/* Dog Food (Head & Liver) */}
            <div className="form-row">
              <div className="form-group">
                <label>Dog Food Count</label>
                <input
                  type="number"
                  placeholder="Count"
                  value={dogFoodCount}
                  onChange={(e) => setDogFoodCount(e.target.value)}
                  className="form-control"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Dog Food Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Weight"
                  value={dogFoodWeight}
                  onChange={(e) => setDogFoodWeight(e.target.value)}
                  className="form-control"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => setShowProcessingModal(false)}
              className="btn btn-secondary"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Save Processing'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editingChicken && (
        <>
          <Modal
            isOpen={true}
            onClose={() => {
              setEditingChicken(null);
            }}
          >
        <div className="modal-header">
          <h2>Edit Dressed Chicken</h2>
          <button
            onClick={() => {
              setEditingChicken(null);
            }}
            className="modal-close"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="form-group">
          <label>Batch ID</label>
          <input
            type="text"
            placeholder="Batch ID"
            value={editingChicken?.batch_id || ''}
            className="form-control"
            disabled
          />
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          handleUpdateChickenForm(e);
        }}>
          <div className="form-group">
            <label>Whole Chicken Count *</label>
            <input
              type="number"
              placeholder="Number of whole chickens"
              value={editingChicken?.current_count || ''}
              onChange={(e) => setEditingChicken({...editingChicken, current_count: parseInt(e.target.value) || 0})}
              className="form-control"
              min="0"
              required
            />
            <small className="form-help">Edit independently of parts</small>
          </div>

          <div className="form-group">
            <label>Size Category</label>
            <select
              value={editingChicken?.size_category_id || ''}
              onChange={(e) => {
                const value = e.target.value;
                setEditingChicken({
                  ...editingChicken,
                  size_category_id: value,
                  size_category_custom: value === 'custom' ? editingChicken?.size_category_custom || '' : '',
                  // Update old format for backward compatibility
                  size_category: value && value !== 'custom'
                    ? chickenSizeCategories.find(sc => sc.id === value)?.name?.toLowerCase()
                    : (value === 'custom' ? editingChicken?.size_category_custom : '')
                });
              }}
              className="form-control"
            >
              <option value="">Select Size Category</option>
              {chickenSizeCategories
                .filter(sc => sc.is_active)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(sc => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name} ({sc.min_weight}-{sc.max_weight}kg)
                  </option>
                ))
              }
              <option value="custom">Custom Size</option>
            </select>
          </div>

          {editingChicken?.size_category_id === 'custom' && (
            <div className="form-group">
              <label>Custom Size Name</label>
              <input
                type="text"
                placeholder="Enter custom size name"
                value={editingChicken?.size_category_custom || ''}
                onChange={(e) => setEditingChicken({
                  ...editingChicken,
                  size_category_custom: e.target.value,
                  // Update old format for backward compatibility
                  size_category: e.target.value
                })}
                className="form-control"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Status</label>
            <select
              value={editingChicken?.status || 'in-storage'}
              onChange={(e) => setEditingChicken({...editingChicken, status: e.target.value})}
              className="form-control"
            >
              <option value="in-storage">In Storage</option>
              <option value="sold">Sold</option>
              <option value="discarded">Discarded</option>
            </select>
          </div>

          <div className="form-group">
            <label>Storage Location</label>
            <input
              type="text"
              placeholder="Storage Location"
              value={editingChicken?.storage_location || ''}
              onChange={(e) => setEditingChicken({...editingChicken, storage_location: e.target.value})}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Expiry Date</label>
            <input
              type="date"
              value={editingChicken?.expiry_date || ''}
              onChange={(e) => setEditingChicken({...editingChicken, expiry_date: e.target.value})}
              className="form-control"
              min={editingChicken?.processing_date}
            />
            {editingChicken?.expiry_date && (
              <small style={{
                color: isExpired(editingChicken.expiry_date) ? '#c62828' :
                       isExpiringSoon(editingChicken.expiry_date) ? '#f57f17' : '#666',
                fontSize: '0.85em',
                display: 'block',
                marginTop: '4px'
              }}>
                {isExpired(editingChicken.expiry_date) && '⚠️ EXPIRED'}
                {isExpiringSoon(editingChicken.expiry_date) && !isExpired(editingChicken.expiry_date) && '⚠️ Expiring Soon'}
                {!isExpired(editingChicken.expiry_date) && !isExpiringSoon(editingChicken.expiry_date) &&
                  `Expires: ${new Date(editingChicken.expiry_date).toLocaleDateString()}`
                }
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              placeholder="Any additional notes..."
              value={editingChicken?.notes || ''}
              onChange={(e) => setEditingChicken({...editingChicken, notes: e.target.value})}
              className="form-control"
              rows="3"
            />
          </div>

          <div className="form-section">
            <h3>Part Details</h3>

            {/* Neck */}
            <div className="form-row">
              <div className="form-group">
                <label>Neck Count</label>
                <input
                  type="number"
                  placeholder="Count"
                  value={editingChicken?.parts_count?.neck || ''}
                  onChange={(e) => setEditingChicken({
                    ...editingChicken,
                    parts_count: {
                      ...editingChicken.parts_count,
                      neck: parseInt(e.target.value) || 0
                    }
                  })}
                  className="form-control"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Neck Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Weight"
                  value={editingChicken?.parts_weight?.neck || ''}
                  onChange={(e) => setEditingChicken({
                    ...editingChicken,
                    parts_weight: {
                      ...editingChicken.parts_weight,
                      neck: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="form-control"
                  min="0"
                />
              </div>
            </div>

            {/* Feet */}
            <div className="form-row">
              <div className="form-group">
                <label>Feet Count</label>
                <input
                  type="number"
                  placeholder="Count"
                  value={editingChicken?.parts_count?.feet || ''}
                  onChange={(e) => setEditingChicken({
                    ...editingChicken,
                    parts_count: {
                      ...editingChicken.parts_count,
                      feet: parseInt(e.target.value) || 0
                    }
                  })}
                  className="form-control"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Feet Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Weight"
                  value={editingChicken?.parts_weight?.feet || ''}
                  onChange={(e) => setEditingChicken({
                    ...editingChicken,
                    parts_weight: {
                      ...editingChicken.parts_weight,
                      feet: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="form-control"
                  min="0"
                />
              </div>
            </div>

            {/* Gizzard */}
            <div className="form-row">
              <div className="form-group">
                <label>Gizzard Count</label>
                <input
                  type="number"
                  placeholder="Count"
                  value={editingChicken?.parts_count?.gizzard || ''}
                  onChange={(e) => setEditingChicken({
                    ...editingChicken,
                    parts_count: {
                      ...editingChicken.parts_count,
                      gizzard: parseInt(e.target.value) || 0
                    }
                  })}
                  className="form-control"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Gizzard Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Weight"
                  value={editingChicken?.parts_weight?.gizzard || ''}
                  onChange={(e) => setEditingChicken({
                    ...editingChicken,
                    parts_weight: {
                      ...editingChicken.parts_weight,
                      gizzard: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="form-control"
                  min="0"
                />
              </div>
            </div>

            {/* Dog Food (Head & Liver) */}
            <div className="form-row">
              <div className="form-group">
                <label>Dog Food Count</label>
                <input
                  type="number"
                  placeholder="Count"
                  value={editingChicken?.parts_count?.dog_food || ''}
                  onChange={(e) => setEditingChicken({
                    ...editingChicken,
                    parts_count: {
                      ...editingChicken.parts_count,
                      dog_food: parseInt(e.target.value) || 0
                    }
                  })}
                  className="form-control"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Dog Food Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Weight"
                  value={editingChicken?.parts_weight?.dog_food || ''}
                  onChange={(e) => setEditingChicken({
                    ...editingChicken,
                    parts_weight: {
                      ...editingChicken.parts_weight,
                      dog_food: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="form-control"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => {
                setEditingChicken(null);
              }}
              className="btn btn-secondary"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
        </Modal>
        </>
      )}

      {/* Traceability Modal */}
      {viewingTraceability && (
        <TraceabilityModal
          chicken={viewingTraceability}
          onClose={() => setViewingTraceability(null)}
        />
      )}
    </div>
  );
};

export default DressedChickenStock;