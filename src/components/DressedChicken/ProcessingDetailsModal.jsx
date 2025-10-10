import React from 'react';
import { EnhancedModal } from '../UI';
import { formatDate, formatNumber } from '../../utils/formatters';
import './DressedChicken.css';

const ProcessingDetailsModal = ({
  isOpen,
  onClose,
  processingRecord,
  liveChicken,
  dressedChicken
}) => {
  if (!processingRecord) return null;

  const partsCount = dressedChicken?.parts_count || {};
  const partsWeight = dressedChicken?.parts_weight || {};

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Processing Details"
      size="large"
    >
      <div className="processing-details">
        {/* Source Batch Information */}
        <section className="details-section">
          <h3>Source Batch (Live Chicken)</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Batch ID:</label>
              <span>{processingRecord.liveBatchId || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Breed:</label>
              <span>{processingRecord.breed || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Age at Processing:</label>
              <span>{processingRecord.ageAtProcessing || 'N/A'} days</span>
            </div>
            <div className="detail-item">
              <label>Birds Processed:</label>
              <span>{formatNumber(processingRecord.birdsProcessed)}</span>
            </div>
          </div>
        </section>

        {/* Processing Information */}
        <section className="details-section">
          <h3>Processing Information</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Processing Date:</label>
              <span>{formatDate(processingRecord.processingDate)}</span>
            </div>
            <div className="detail-item">
              <label>Dressed Batch ID:</label>
              <span>{processingRecord.dressedBatchId || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Dressed Count:</label>
              <span>{formatNumber(processingRecord.dressedCount)}</span>
            </div>
            <div className="detail-item">
              <label>Yield Rate:</label>
              <span className={processingRecord.yieldRate < 95 ? 'warning-text' : 'success-text'}>
                {processingRecord.yieldRate}%
              </span>
            </div>
            <div className="detail-item">
              <label>Average Weight:</label>
              <span>{formatNumber(processingRecord.averageWeight, 2)} kg</span>
            </div>
            <div className="detail-item">
              <label>Size Category:</label>
              <span>{processingRecord.sizeCategory || 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* Storage Information */}
        {dressedChicken && (
          <section className="details-section">
            <h3>Storage Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Storage Location:</label>
                <span>{dressedChicken.storage_location || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Status:</label>
                <span className="capitalize">{dressedChicken.status || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Expiry Date:</label>
                <span>{dressedChicken.expiry_date ? formatDate(dressedChicken.expiry_date) : 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Current Count:</label>
                <span>{formatNumber(dressedChicken.current_count || 0)}</span>
              </div>
            </div>
          </section>
        )}

        {/* Parts Breakdown */}
        {(Object.keys(partsCount).length > 0 || Object.keys(partsWeight).length > 0) && (
          <section className="details-section">
            <h3>Parts Breakdown</h3>
            <div className="parts-table">
              <table>
                <thead>
                  <tr>
                    <th>Part Type</th>
                    <th>Count</th>
                    <th>Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {['neck', 'feet', 'gizzard', 'dog_food'].map(partType => {
                    const count = partsCount[partType] || 0;
                    const weight = partsWeight[partType] || 0;
                    
                    if (count === 0 && weight === 0) return null;
                    
                    return (
                      <tr key={partType}>
                        <td className="capitalize">{partType.replace('_', ' ')}</td>
                        <td>{formatNumber(count)}</td>
                        <td>{formatNumber(weight, 2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Notes */}
        {dressedChicken?.notes && (
          <section className="details-section">
            <h3>Notes</h3>
            <p className="notes-text">{dressedChicken.notes}</p>
          </section>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </EnhancedModal>
  );
};

export default ProcessingDetailsModal;

