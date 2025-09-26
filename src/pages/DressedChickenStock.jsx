import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { formatWeight } from '../utils/formatters';
import './DressedChickenStock.css';

// Memoized modal components to prevent re-creation on every render
const ProcessingModal = React.memo(({ show, onClose, onSubmit, liveChickens }) => {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [processingDate, setProcessingDate] = useState(new Date().toISOString().split('T')[0]);
  const [sizeCategory, setSizeCategory] = useState('medium');
  const [processingQuantity, setProcessingQuantity] = useState('');
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

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    // Validate batch selection
    if (!selectedBatch) {
      alert('Please select a live chicken batch');
      return;
    }

    // Validate processing quantity
    const selectedBatchData = liveChickens.find(batch => batch.id === selectedBatch);
    const availableBirds = selectedBatchData?.current_count || 0;
    const quantityToProcess = parseInt(processingQuantity) || 0;

    if (quantityToProcess <= 0) {
      alert('Please enter a valid quantity to process (must be greater than 0)');
      return;
    }

    if (quantityToProcess > availableBirds) {
      alert(`Cannot process ${quantityToProcess} birds. Only ${availableBirds} birds available in this batch.`);
      return;
    }

    // Validate remaining batch ID if creating new batch
    if (createNewBatchForRemaining && !remainingBatchId.trim()) {
      alert('Please enter a batch ID for the remaining birds');
      return;
    }

    // Validate that remaining batch ID is unique
    if (createNewBatchForRemaining && remainingBatchId.trim()) {
      const isDuplicate = liveChickens.some(batch => batch.batch_id === remainingBatchId.trim());
      if (isDuplicate) {
        alert(`Batch ID "${remainingBatchId}" already exists. Please choose a different ID.`);
        return;
      }
    }

    // Validate parts data - each part type should not exceed the correct maximum per bird
    const neckCountVal = parseInt(neckCount) || 0;
    const feetCountVal = parseInt(feetCount) || 0;
    const gizzardCountVal = parseInt(gizzardCount) || 0;
    const dogFoodCountVal = parseInt(dogFoodCount) || 0;

    // Check if at least one part has a count
    if (neckCountVal === 0 && feetCountVal === 0 && gizzardCountVal === 0 && dogFoodCountVal === 0) {
      alert('Please enter at least one part count');
      return;
    }

    // Check individual part counts based on parts per bird
    // Neck: 1 per bird, Gizzard: 1 per bird
    const maxNecks = quantityToProcess; // 1 neck per bird
    const maxGizzards = quantityToProcess; // 1 gizzard per bird

    if (neckCountVal > maxNecks) {
      alert(`Neck count (${neckCountVal}) cannot exceed ${maxNecks} (1 neck per bird)`);
      return;
    }
    if (gizzardCountVal > maxGizzards) {
      alert(`Gizzard count (${gizzardCountVal}) cannot exceed ${maxGizzards} (1 gizzard per bird)`);
      return;
    }

    // Feet: 2 per bird, Dog food: 2 per bird (head + liver)
    const maxFeet = quantityToProcess * 2; // 2 feet per bird
    const maxDogFood = quantityToProcess * 2; // 2 dog food items per bird

    if (feetCountVal > maxFeet) {
      alert(`Feet count (${feetCountVal}) cannot exceed ${maxFeet} (2 feet per bird)`);
      return;
    }
    if (dogFoodCountVal > maxDogFood) {
      alert(`Dog food count (${dogFoodCountVal}) cannot exceed ${maxDogFood} (2 items per bird)`);
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

    // Calculate total count and average weight
    const totalCount = Object.values(partsCount).reduce((a, b) => a + b, 0);
    const totalWeight = Object.values(partsWeight).reduce((a, b) => a + b, 0);
    const averageWeight = totalCount > 0 ? (totalWeight / totalCount) : 0;

    const remainingBirds = availableBirds - quantityToProcess;

    onSubmit({
      id: Date.now().toString(),
      batch_id: selectedBatch,
      processing_date: processingDate,
      initial_count: totalCount,
      current_count: totalCount,
      average_weight: averageWeight,
      size_category: sizeCategory,
      status: 'in-storage',
      storage_location: '',
      expiry_date: new Date(new Date(processingDate).setMonth(new Date(processingDate).getMonth() + 3)).toISOString().split('T')[0], // 3 months expiry
      parts_count: partsCount,
      parts_weight: partsWeight,
      processing_quantity: quantityToProcess,
      remaining_birds: remainingBirds,
      create_new_batch_for_remaining: createNewBatchForRemaining,
      remaining_batch_id: remainingBatchId
    });

    onClose();
  }, [neckCount, feetCount, gizzardCount, dogFoodCount, neckWeight, feetWeight, gizzardWeight, dogFoodWeight, selectedBatch, processingDate, sizeCategory, processingQuantity, createNewBatchForRemaining, remainingBatchId, liveChickens, onSubmit, onClose]);

  // Handle clicks on the modal overlay
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Record Chicken Processing</h2>
          <button
            onClick={onClose}
            className="modal-close"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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
              value={sizeCategory}
              onChange={(e) => setSizeCategory(e.target.value)}
              className="form-control"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
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
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Processing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

const EditModal = ({ show, chicken, onClose, onSubmit }) => {
  const [batchId, setBatchId] = useState('');
  const [sizeCategory, setSizeCategory] = useState('');
  const [status, setStatus] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [neckCount, setNeckCount] = useState('');
  const [neckWeight, setNeckWeight] = useState('');
  const [feetCount, setFeetCount] = useState('');
  const [feetWeight, setFeetWeight] = useState('');
  const [gizzardCount, setGizzardCount] = useState('');
  const [gizzardWeight, setGizzardWeight] = useState('');
  const [dogFoodCount, setDogFoodCount] = useState('');
  const [dogFoodWeight, setDogFoodWeight] = useState('');

  // Initialize state when chicken data changes
  useEffect(() => {
    console.log('EditModal useEffect triggered:', { show, chicken: !!chicken });

    if (chicken && show) {
      console.log('EditModal received chicken data:', chicken);
      console.log('Chicken data structure:', {
        id: chicken.id,
        batch_id: chicken.batch_id,
        size_category: chicken.size_category,
        status: chicken.status,
        storage_location: chicken.storage_location,
        expiry_date: chicken.expiry_date,
        parts_count: chicken.parts_count,
        parts_weight: chicken.parts_weight
      });

      // Set form values with proper fallbacks
      setBatchId(chicken.batch_id || '');
      setSizeCategory(chicken.size_category || 'medium');
      setStatus(chicken.status || 'in-storage');
      setStorageLocation(chicken.storage_location || '');
      setExpiryDate(chicken.expiry_date || '');

      // Handle parts_count and parts_weight - ensure they are objects
      const partsCount = chicken.parts_count || {};
      const partsWeight = chicken.parts_weight || {};

      console.log('Parts data:', { partsCount, partsWeight });

      setNeckCount(partsCount.neck !== undefined ? String(partsCount.neck) : '');
      setNeckWeight(partsWeight.neck !== undefined ? String(partsWeight.neck) : '');
      setFeetCount(partsCount.feet !== undefined ? String(partsCount.feet) : '');
      setFeetWeight(partsWeight.feet !== undefined ? String(partsWeight.feet) : '');
      setGizzardCount(partsCount.gizzard !== undefined ? String(partsCount.gizzard) : '');
      setGizzardWeight(partsWeight.gizzard !== undefined ? String(partsWeight.gizzard) : '');
      setDogFoodCount(partsCount.dog_food !== undefined ? String(partsCount.dog_food) : '');
      setDogFoodWeight(partsWeight.dog_food !== undefined ? String(partsWeight.dog_food) : '');
    } else if (!show) {
      // Reset form when modal is closed
      console.log('EditModal: Resetting form (modal closed)');
      setBatchId('');
      setSizeCategory('');
      setStatus('');
      setStorageLocation('');
      setExpiryDate('');
      setNeckCount('');
      setNeckWeight('');
      setFeetCount('');
      setFeetWeight('');
      setGizzardCount('');
      setGizzardWeight('');
      setDogFoodCount('');
      setDogFoodWeight('');
    }
  }, [chicken, show]);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();

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

    // Calculate total count and average weight
    const totalCount = Object.values(partsCount).reduce((a, b) => a + b, 0);
    const totalWeight = Object.values(partsWeight).reduce((a, b) => a + b, 0);
    const averageWeight = totalCount > 0 ? (totalWeight / totalCount) : 0;

    onSubmit({
      id: chicken.id,
      batch_id: batchId,
      processing_date: chicken.processing_date || chicken.processingDate,
      initial_count: chicken.initial_count || chicken.initialCount,
      current_count: totalCount,
      average_weight: averageWeight,
      size_category: sizeCategory,
      status: status,
      storage_location: storageLocation,
      expiry_date: expiryDate,
      parts_count: partsCount,
      parts_weight: partsWeight
    });

    onClose();
  }, [chicken, batchId, sizeCategory, status, storageLocation, expiryDate, neckCount, neckWeight, feetCount, feetWeight, gizzardCount, gizzardWeight, dogFoodCount, dogFoodWeight, onSubmit, onClose]);

  // Handle clicks on the modal overlay
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  console.log('EditModal render condition:', { show, chicken: !!chicken });

  if (!show) {
    console.log('EditModal: Not showing because show is false');
    return null;
  }

  if (!chicken) {
    console.log('EditModal: Not showing because chicken is null/undefined');
    return null;
  }

  console.log('EditModal: Rendering modal with chicken data:', {
    id: chicken.id,
    batch_id: chicken.batch_id,
    size_category: chicken.size_category,
    status: chicken.status
  });

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Dressed Chicken</h2>
          <button
            onClick={onClose}
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
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="form-control"
            disabled
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Size Category</label>
            <select
              value={sizeCategory}
              onChange={(e) => setSizeCategory(e.target.value)}
              className="form-control"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="form-control"
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
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
    addLiveChicken
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState('inventory');
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [selectedChicken, setSelectedChicken] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Debug logging for selectedChicken state changes
  useEffect(() => {
    console.log('DressedChickenStock: selectedChicken changed:', {
      selectedChicken: !!selectedChicken,
      chickenId: selectedChicken?.id,
      showModal: !!selectedChicken,
      isUpdating
    });
  }, [selectedChicken, isUpdating]);

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

  const handleProcessChicken = async (data) => {
    try {
      console.log('Starting chicken processing with data:', data);

      // Add the dressed chicken record first
      const savedDressedChicken = await addDressedChicken(data);
      console.log('Dressed chicken saved successfully:', savedDressedChicken);

      // Update live chicken count
      const sourceBatch = liveChickens.find(batch => batch.id === data.batch_id);
      if (sourceBatch) {
        const newCount = Math.max(0, sourceBatch.current_count - data.processing_quantity);
        console.log(`Updating source batch ${sourceBatch.batch_id} from ${sourceBatch.current_count} to ${newCount} birds`);

        // Update the source batch
        await updateLiveChicken(data.batch_id, {
          ...sourceBatch,
          current_count: newCount,
          updated_at: new Date().toISOString()
        });

        // If there are remaining birds and user wants to create a new batch
        if (data.remaining_birds > 0 && data.create_new_batch_for_remaining && data.remaining_batch_id) {
          console.log(`Creating new batch ${data.remaining_batch_id} with ${data.remaining_birds} remaining birds`);

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

      console.log('Chicken processing completed successfully');
      // Close modal after all operations complete
      setShowProcessingModal(false);
    } catch (error) {
      console.error('Error processing chicken:', error);
      alert(`Error processing chicken: ${error.message}\n\nPlease check:\n1. Database connection\n2. Table permissions\n3. Required database tables exist\n\nCheck the browser console for more details.`);
      setShowProcessingModal(false);
    }
  };

  const handleUpdateChicken = async (data) => {
    try {
      console.log('handleUpdateChicken called with data:', data);
      console.log('Updating chicken with ID:', data.id);
      console.log('Current selectedChicken state:', selectedChicken);

      // Don't close modal immediately - wait for successful update
      const result = await updateDressedChicken(data.id, data);
      console.log('Chicken updated successfully:', result);

      // Only close modal after successful update
      setTimeout(() => {
        console.log('Closing modal after successful update');
        setSelectedChicken(null);
      }, 100); // Small delay to ensure state is properly updated

    } catch (error) {
      console.error('Error updating chicken:', error);
      alert(`Error updating chicken: ${error.message}`);
      // Don't close modal on error so user can retry
    }
  };

  // Inventory View Component
  const InventoryView = ({ dressedChickens, onEdit, onDelete }) => {
    return (
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="dressed-chicken-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Size Category</th>
                <th>Count</th>
                <th>Avg Weight</th>
                <th>Parts</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dressedChickens.map((chicken) => (
                <tr key={chicken.id}>
                  <td className="font-medium">{chicken.batch_id}</td>
                  <td>{chicken.size_category}</td>
                  <td>{chicken.current_count}</td>
                  <td>{formatWeight(chicken.average_weight)}</td>
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
                    <div className="action-buttons">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Edit button clicked, chicken data:', chicken);
                          console.log('Chicken ID:', chicken.id);
                          console.log('Chicken has required fields:', {
                            batch_id: !!chicken.batch_id,
                            size_category: !!chicken.size_category,
                            status: !!chicken.status,
                            parts_count: !!chicken.parts_count,
                            parts_weight: !!chicken.parts_weight
                          });
                          onEdit(chicken);
                        }}
                        className="btn btn-secondary"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(chicken.id)}
                        className="btn btn-danger"
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Processing History View Component
  const ProcessingHistoryView = ({ batchRelationships, liveChickens, dressedChickens }) => {
    const getLiveChickenByBatchId = (batchId) => {
      return liveChickens.find(lc => lc.batch_id === batchId) || {};
    };

    const getDressedChickenByBatchId = (batchId) => {
      return dressedChickens.find(dc => dc.batch_id === batchId) || {};
    };

    // Filter for processing relationships only
    const processingRelationships = batchRelationships.filter(br => br.relationship_type === 'processed_from');

    return (
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="dressed-chicken-table">
            <thead>
              <tr>
                <th>Live Batch</th>
                <th>Live Count</th>
                <th>Processed Batch</th>
                <th>Processed Count</th>
                <th>Processing Date</th>
                <th>Yield Rate</th>
              </tr>
            </thead>
            <tbody>
              {processingRelationships.map((relationship) => {
                const source = getLiveChickenByBatchId(relationship.source_batch_id);
                const target = getDressedChickenByBatchId(relationship.target_batch_id);
                const yieldRate = source.current_count && target.current_count ? 
                  ((target.current_count / source.current_count) * 100).toFixed(1) : '0';
                
                return (
                  <tr key={relationship.id}>
                    <td className="font-medium">{relationship.source_batch_id}</td>
                    <td>{source.current_count || 0}</td>
                    <td className="font-medium">{relationship.target_batch_id}</td>
                    <td>{target.current_count || 0}</td>
                    <td>
                      {target.processing_date ? new Date(target.processing_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>{yieldRate}%</td>
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
  };

  // Analytics View Component
  const AnalyticsView = ({ dressedChickens }) => {
    // Overall statistics
    const totalBatches = dressedChickens.length;
    const totalChickenCount = dressedChickens.reduce((sum, dc) => sum + (dc.current_count || 0), 0);
    const totalWeight = dressedChickens.reduce((sum, dc) => sum + ((dc.current_count || 0) * (dc.average_weight || 0)), 0);
    
    // Size distribution
    const sizeDistribution = dressedChickens.reduce((acc, dc) => {
      acc[dc.size_category] = (acc[dc.size_category] || 0) + (dc.current_count || 0);
      return acc;
    }, {});

    // Parts statistics
    const partsStats = dressedChickens.reduce((acc, dc) => {
      const partsCount = dc.parts_count || {};
      const partsWeight = dc.parts_weight || {};
      
      // Count
      acc.partsCount.neck = (acc.partsCount.neck || 0) + (partsCount.neck || 0);
      acc.partsCount.feet = (acc.partsCount.feet || 0) + (partsCount.feet || 0);
      acc.partsCount.gizzard = (acc.partsCount.gizzard || 0) + (partsCount.gizzard || 0);
      acc.partsCount.dog_food = (acc.partsCount.dog_food || 0) + (partsCount.dog_food || 0);
      
      // Weight
      acc.partsWeight.neck = (acc.partsWeight.neck || 0) + (partsWeight.neck || 0);
      acc.partsWeight.feet = (acc.partsWeight.feet || 0) + (partsWeight.feet || 0);
      acc.partsWeight.gizzard = (acc.partsWeight.gizzard || 0) + (partsWeight.gizzard || 0);
      acc.partsWeight.dog_food = (acc.partsWeight.dog_food || 0) + (partsWeight.dog_food || 0);
      
      return acc;
    }, { partsCount: {}, partsWeight: {} });

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
              <h3>Total Chickens</h3>
              <p>{totalChickenCount}</p>
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
              <h3>Avg. Yield</h3>
              <p>
                {totalBatches > 0 ? ((totalChickenCount / totalBatches) || 0).toFixed(1) : '0'}
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
                      style={{ width: `${totalChickenCount > 0 ? (count / totalChickenCount) * 100 : 0}%` }}
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
  };


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
          onEdit={setSelectedChicken}
          onDelete={deleteDressedChicken}
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
      <ProcessingModal
        show={showProcessingModal}
        onClose={() => setShowProcessingModal(false)}
        onSubmit={handleProcessChicken}
        liveChickens={liveChickens}
      />

      {/* Edit Modal */}
      <EditModal
        show={!!selectedChicken}
        chicken={selectedChicken}
        onClose={() => setSelectedChicken(null)}
        onSubmit={handleUpdateChicken}
      />
    </div>
  );
};

export default DressedChickenStock;