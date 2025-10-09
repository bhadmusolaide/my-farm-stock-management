import React, { useMemo } from 'react';
import { EnhancedModal } from '../UI';
import { formatDate, formatWeight, formatNumber } from '../../utils/formatters';
import './DressedChicken.css';

const TraceabilityModal = ({
  isOpen,
  onClose,
  chicken,
  liveChickens = [],
  batchRelationships = []
}) => {
  // Find the source live chicken batch
  const sourceInfo = useMemo(() => {
    if (!chicken || !batchRelationships.length) return null;

    // Find the relationship that created this dressed chicken batch
    const relationship = batchRelationships.find(
      rel => rel.target_batch_id === chicken.id && rel.relationship_type === 'partial_processed_from'
    );

    if (!relationship) return null;

    // Find the source live chicken batch
    const sourceBatch = liveChickens.find(lc => lc.id === relationship.source_batch_id);

    return {
      relationship,
      sourceBatch,
      birdsProcessed: relationship.quantity || 0
    };
  }, [chicken, liveChickens, batchRelationships]);

  const getSizeCategoryDisplay = (chicken) => {
    if (chicken?.size_category_custom) {
      return chicken.size_category_custom;
    }
    
    if (chicken?.size_category_id) {
      // Would need chickenSizeCategories to resolve this properly
      return `Size Category ID: ${chicken.size_category_id}`;
    }
    
    return chicken?.size_category || 'Medium';
  };

  const getPartsInventoryDisplay = (chicken) => {
    if (!chicken?.parts_count) return 'No parts recorded';
    
    const parts = [];
    const partsCount = chicken.parts_count;
    const partsWeight = chicken.parts_weight || {};
    
    if (partsCount.neck > 0) {
      parts.push(`Neck: ${partsCount.neck} pieces (${(partsWeight.neck || 0).toFixed(2)} kg)`);
    }
    if (partsCount.feet > 0) {
      parts.push(`Feet: ${partsCount.feet} pieces (${(partsWeight.feet || 0).toFixed(2)} kg)`);
    }
    if (partsCount.gizzard > 0) {
      parts.push(`Gizzard: ${partsCount.gizzard} pieces (${(partsWeight.gizzard || 0).toFixed(2)} kg)`);
    }
    if (partsCount.dog_food > 0) {
      parts.push(`Dog Food: ${partsCount.dog_food} pieces (${(partsWeight.dog_food || 0).toFixed(2)} kg)`);
    }
    
    return parts.length > 0 ? parts : ['No parts recorded'];
  };

  if (!chicken) return null;

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Batch Traceability - ${chicken.batch_id}`}
      size="large"
    >
      <div className="traceability-content">
        {/* Source Live Chicken Information */}
        {sourceInfo && (
          <div className="traceability-section">
            <h3 className="section-title">🐣 Source Live Chicken Batch</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Batch ID:</label>
                <span>{sourceInfo.sourceBatch?.batch_id || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Breed:</label>
                <span>{sourceInfo.sourceBatch?.breed || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Hatch Date:</label>
                <span>{sourceInfo.sourceBatch?.hatch_date ? formatDate(sourceInfo.sourceBatch.hatch_date) : 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Initial Count:</label>
                <span>{formatNumber(sourceInfo.sourceBatch?.initial_count || 0)} birds</span>
              </div>
              <div className="info-item">
                <label>Birds Processed:</label>
                <span>{formatNumber(sourceInfo.birdsProcessed)} birds</span>
              </div>
              <div className="info-item">
                <label>Feed Type:</label>
                <span>{sourceInfo.sourceBatch?.feed_type || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Processing Information */}
        <div className="traceability-section">
          <h3 className="section-title">⚙️ Processing Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Processing Date:</label>
              <span>{chicken.processing_date ? formatDate(chicken.processing_date) : 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Processed Quantity:</label>
              <span>{formatNumber(chicken.processing_quantity || chicken.initial_count || 0)} birds</span>
            </div>
            <div className="info-item">
              <label>Current Count:</label>
              <span>{formatNumber(chicken.current_count || chicken.initial_count || 0)} birds</span>
            </div>
            <div className="info-item">
              <label>Size Category:</label>
              <span>{getSizeCategoryDisplay(chicken)}</span>
            </div>
            <div className="info-item">
              <label>Average Weight:</label>
              <span>{formatWeight(chicken.average_weight)}</span>
            </div>
            <div className="info-item">
              <label>Processing Notes:</label>
              <span>{chicken.notes || 'No notes recorded'}</span>
            </div>
          </div>
        </div>

        {/* Current Storage Information */}
        <div className="traceability-section">
          <h3 className="section-title">🏪 Current Storage Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Storage Location:</label>
              <span>{chicken.storage_location || 'Not specified'}</span>
            </div>
            <div className="info-item">
              <label>Status:</label>
              <span className={`status-badge status-${chicken.status}`}>
                {chicken.status}
              </span>
            </div>
            <div className="info-item">
              <label>Expiry Date:</label>
              <span>{chicken.expiry_date ? formatDate(chicken.expiry_date) : 'Not set'}</span>
            </div>
            <div className="info-item">
              <label>Days Until Expiry:</label>
              <span>
                {chicken.expiry_date ? (() => {
                  const today = new Date();
                  const expiry = new Date(chicken.expiry_date);
                  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                  
                  if (daysUntilExpiry < 0) {
                    return <span className="expired">Expired {Math.abs(daysUntilExpiry)} days ago</span>;
                  } else if (daysUntilExpiry <= 7) {
                    return <span className="expiring-soon">{daysUntilExpiry} days (Expiring Soon)</span>;
                  } else {
                    return <span className="fresh">{daysUntilExpiry} days</span>;
                  }
                })() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Parts Inventory */}
        <div className="traceability-section">
          <h3 className="section-title">🍗 Parts Inventory</h3>
          <div className="parts-inventory">
            {getPartsInventoryDisplay(chicken).map((part, index) => (
              <div key={index} className="part-item">
                {part}
              </div>
            ))}
          </div>
        </div>

        {/* Processing Yield Analysis */}
        {sourceInfo && (
          <div className="traceability-section">
            <h3 className="section-title">📊 Processing Yield Analysis</h3>
            <div className="yield-analysis">
              <div className="yield-item">
                <label>Birds Processed:</label>
                <span>{formatNumber(sourceInfo.birdsProcessed)}</span>
              </div>
              <div className="yield-item">
                <label>Dressed Chickens Produced:</label>
                <span>{formatNumber(chicken.processing_quantity || chicken.initial_count || 0)}</span>
              </div>
              <div className="yield-item">
                <label>Yield Rate:</label>
                <span>
                  {(() => {
                    const yieldRate = sourceInfo.birdsProcessed > 0 
                      ? ((chicken.processing_quantity || chicken.initial_count || 0) / sourceInfo.birdsProcessed * 100).toFixed(1)
                      : '0';
                    const rate = parseFloat(yieldRate);
                    const className = rate < 95 ? 'low-yield' : rate > 100 ? 'high-yield' : 'normal-yield';
                    return <span className={className}>{yieldRate}%</span>;
                  })()}
                </span>
              </div>
              <div className="yield-item">
                <label>Total Weight Produced:</label>
                <span>
                  {((chicken.processing_quantity || chicken.initial_count || 0) * (chicken.average_weight || 0)).toFixed(2)} kg
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="traceability-section">
          <h3 className="section-title">📅 Timeline</h3>
          <div className="timeline">
            {sourceInfo?.sourceBatch?.hatch_date && (
              <div className="timeline-item">
                <div className="timeline-date">{formatDate(sourceInfo.sourceBatch.hatch_date)}</div>
                <div className="timeline-event">
                  <strong>Hatched:</strong> {formatNumber(sourceInfo.sourceBatch.initial_count)} chicks hatched
                </div>
              </div>
            )}
            
            {chicken.processing_date && (
              <div className="timeline-item">
                <div className="timeline-date">{formatDate(chicken.processing_date)}</div>
                <div className="timeline-event">
                  <strong>Processed:</strong> {formatNumber(sourceInfo?.birdsProcessed || 0)} birds processed into {formatNumber(chicken.processing_quantity || chicken.initial_count || 0)} dressed chickens
                </div>
              </div>
            )}
            
            {chicken.expiry_date && (
              <div className="timeline-item">
                <div className="timeline-date">{formatDate(chicken.expiry_date)}</div>
                <div className="timeline-event">
                  <strong>Expiry Date:</strong> Product expires
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </EnhancedModal>
  );
};

export default TraceabilityModal;
