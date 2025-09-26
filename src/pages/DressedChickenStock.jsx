import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { formatWeight } from '../utils/formatters';
import './DressedChickenStock.css';

// Memoized modal components to prevent re-creation on every render
const ProcessingModal = React.memo(({ show, onClose, onSubmit, liveChickens }) => {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [processingDate, setProcessingDate] = useState(new Date().toISOString().split('T')[0]);
  const [sizeCategory, setSizeCategory] = useState('medium');
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
      parts_weight: partsWeight
    });

    onClose();
  }, [neckCount, feetCount, gizzardCount, dogFoodCount, neckWeight, feetWeight, gizzardWeight, dogFoodWeight, selectedBatch, processingDate, sizeCategory, onSubmit, onClose]);

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
              {liveChickens.map((batch) => (
                <option key={batch.id} value={batch.batch_id}>
                  {batch.batch_id} ({batch.current_count} chickens)
                </option>
              ))}
            </select>
          </div>

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

const EditModal = React.memo(({ show, chicken, onClose, onSubmit }) => {
  const [batchId, setBatchId] = useState(chicken?.batch_id || '');
  const [sizeCategory, setSizeCategory] = useState(chicken?.size_category || '');
  const [status, setStatus] = useState(chicken?.status || '');
  const [storageLocation, setStorageLocation] = useState(chicken?.storage_location || '');
  const [expiryDate, setExpiryDate] = useState(chicken?.expiry_date || '');
  const [neckCount, setNeckCount] = useState(chicken?.parts_count?.neck || '');
  const [neckWeight, setNeckWeight] = useState(chicken?.parts_weight?.neck || '');
  const [feetCount, setFeetCount] = useState(chicken?.parts_count?.feet || '');
  const [feetWeight, setFeetWeight] = useState(chicken?.parts_weight?.feet || '');
  const [gizzardCount, setGizzardCount] = useState(chicken?.parts_count?.gizzard || '');
  const [gizzardWeight, setGizzardWeight] = useState(chicken?.parts_weight?.gizzard || '');
  const [dogFoodCount, setDogFoodCount] = useState(chicken?.parts_count?.dog_food || '');
  const [dogFoodWeight, setDogFoodWeight] = useState(chicken?.parts_weight?.dog_food || '');

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
      processing_date: chicken.processing_date,
      initial_count: chicken.initial_count,
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

  if (!show || !chicken) return null;

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
});

const DressedChickenStock = () => {
  const { 
    dressedChickens, 
    liveChickens,
    addDressedChicken,
    updateDressedChicken,
    deleteDressedChicken,
    batchRelationships,
    addBatchRelationship
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState('inventory');
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [selectedChicken, setSelectedChicken] = useState(null);

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

  const handleProcessChicken = (data) => {
    addDressedChicken(data);
    setShowProcessingModal(false);
  };

  const handleUpdateChicken = (data) => {
    updateDressedChicken(data.id, data);
    setSelectedChicken(null);
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
                        onClick={() => onEdit(chicken)}
                        className="btn btn-secondary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(chicken.id)}
                        className="btn btn-danger"
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