import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context';
import { EnhancedModal } from '../UI';
import { formatNumber, formatDate } from '../../utils/formatters';
import './FeedManagement.css';

const BatchFeedSummary = ({ isOpen, onClose, batchId }) => {
  const {
    liveChickens = [],
    feedConsumption = [],
    feedInventory = [],
    batchFeedSummaries = [],
    generateBatchFeedSummary,
    calculateBatchFCR,
    weightHistory = []
  } = useAppContext();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Get batch data
  const batch = liveChickens.find(b => b.id === batchId);

  // Load or generate summary
  useEffect(() => {
    if (isOpen && batchId) {
      loadSummary();
    }
  }, [isOpen, batchId]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      // Check if summary already exists
      const existingSummary = batchFeedSummaries.find(s => s.chicken_batch_id === batchId);
      
      if (existingSummary) {
        setSummary(existingSummary);
      } else {
        // Generate new summary
        await handleGenerateSummary();
      }
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!generateBatchFeedSummary || !batch) return;

    setGenerating(true);
    try {
      const newSummary = await generateBatchFeedSummary(batchId);
      setSummary(newSummary);
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate batch summary. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Calculate additional stats
  const calculateStats = () => {
    if (!batch) return null;

    const batchConsumption = feedConsumption.filter(c => c.chicken_batch_id === batchId);
    const totalFeedKg = batchConsumption.reduce((sum, c) => sum + c.quantity_consumed, 0);
    
    // Calculate total cost
    let totalCost = 0;
    batchConsumption.forEach(consumption => {
      const feed = feedInventory.find(f => f.id === consumption.feed_id);
      if (feed) {
        const costPerKg = feed.cost_per_kg || (feed.cost_per_bag * feed.number_of_bags) / feed.quantity_kg;
        totalCost += consumption.quantity_consumed * costPerKg;
      }
    });

    // Calculate bags (assuming 25kg per bag)
    const totalBags = totalFeedKg / 25;

    // Get FCR data
    const fcrData = calculateBatchFCR ? calculateBatchFCR(batchId, liveChickens, weightHistory) : null;

    // Calculate feed per bird
    const feedPerBird = totalFeedKg / (batch.current_count || 1);
    const costPerBird = totalCost / (batch.current_count || 1);

    return {
      totalFeedKg,
      totalBags,
      totalCost,
      feedPerBird,
      costPerBird,
      fcr: fcrData?.fcr || 0,
      fcrRating: fcrData?.rating || 'N/A',
      fcrColor: fcrData?.color || '#999',
      totalWeightGain: fcrData?.totalWeightGain || 0,
      consumptionDays: batchConsumption.length,
      avgDailyConsumption: totalFeedKg / (batchConsumption.length || 1)
    };
  };

  const stats = calculateStats();

  // Export to CSV
  const handleExportCSV = () => {
    if (!batch || !stats) return;

    const csvData = [
      ['Batch Feed Summary Report'],
      ['Generated on:', new Date().toLocaleString()],
      [''],
      ['Batch Information'],
      ['Batch ID:', batch.batch_id],
      ['Breed:', batch.breed],
      ['Current Count:', batch.current_count],
      ['Status:', batch.status],
      [''],
      ['Feed Consumption Summary'],
      ['Total Feed Consumed (kg):', stats.totalFeedKg.toFixed(2)],
      ['Total Feed Consumed (bags):', stats.totalBags.toFixed(2)],
      ['Total Feed Cost (₦):', stats.totalCost.toFixed(2)],
      ['Feed per Bird (kg):', stats.feedPerBird.toFixed(2)],
      ['Cost per Bird (₦):', stats.costPerBird.toFixed(2)],
      [''],
      ['Performance Metrics'],
      ['Feed Conversion Ratio (FCR):', stats.fcr.toFixed(2)],
      ['FCR Rating:', stats.fcrRating],
      ['Total Weight Gain (kg):', stats.totalWeightGain.toFixed(2)],
      ['Consumption Days:', stats.consumptionDays],
      ['Avg Daily Consumption (kg):', stats.avgDailyConsumption.toFixed(2)]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_${batch.batch_id}_feed_summary_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Print summary
  const handlePrint = () => {
    window.print();
  };

  if (!batch) {
    return null;
  }

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Feed Summary - ${batch.batch_id}`}
      size="large"
      loading={loading}
    >
      <div className="batch-feed-summary">
        {/* Header Actions */}
        <div className="summary-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleGenerateSummary}
            disabled={generating}
          >
            {generating ? '⏳ Generating...' : '🔄 Regenerate Summary'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExportCSV}
            disabled={!stats}
          >
            📥 Export CSV
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handlePrint}
            disabled={!stats}
          >
            🖨️ Print
          </button>
        </div>

        {stats && (
          <>
            {/* Batch Information */}
            <div className="summary-section">
              <h4>📋 Batch Information</h4>
              <div className="info-grid">
                <div className="info-item">
                  <label>Batch ID:</label>
                  <span>{batch.batch_id}</span>
                </div>
                <div className="info-item">
                  <label>Breed:</label>
                  <span>{batch.breed}</span>
                </div>
                <div className="info-item">
                  <label>Current Count:</label>
                  <span>{formatNumber(batch.current_count)} birds</span>
                </div>
                <div className="info-item">
                  <label>Status:</label>
                  <span className={`status-badge ${batch.status}`}>{batch.status}</span>
                </div>
                <div className="info-item">
                  <label>Start Date:</label>
                  <span>{formatDate(batch.purchase_date)}</span>
                </div>
                <div className="info-item">
                  <label>Age:</label>
                  <span>{batch.age_weeks || 0} weeks</span>
                </div>
              </div>
            </div>

            {/* Feed Consumption Summary */}
            <div className="summary-section">
              <h4>🍽️ Feed Consumption Summary</h4>
              <div className="summary-cards-grid">
                <div className="summary-stat-card primary">
                  <div className="stat-icon">📦</div>
                  <div className="stat-content">
                    <h5>Total Feed Consumed</h5>
                    <p className="stat-value">{formatNumber(stats.totalFeedKg, 2)} kg</p>
                    <small>{formatNumber(stats.totalBags, 2)} bags</small>
                  </div>
                </div>

                <div className="summary-stat-card success">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <h5>Total Feed Cost</h5>
                    <p className="stat-value">₦{formatNumber(stats.totalCost, 2)}</p>
                    <small>₦{formatNumber(stats.costPerBird, 2)} per bird</small>
                  </div>
                </div>

                <div className="summary-stat-card info">
                  <div className="stat-icon">🐔</div>
                  <div className="stat-content">
                    <h5>Feed per Bird</h5>
                    <p className="stat-value">{formatNumber(stats.feedPerBird, 2)} kg</p>
                    <small>Average consumption</small>
                  </div>
                </div>

                <div className="summary-stat-card warning">
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <h5>Consumption Days</h5>
                    <p className="stat-value">{formatNumber(stats.consumptionDays)}</p>
                    <small>{formatNumber(stats.avgDailyConsumption, 2)} kg/day avg</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="summary-section">
              <h4>📊 Performance Metrics</h4>
              <div className="fcr-summary-display">
                <div className="fcr-summary-main">
                  <div className="fcr-label">Feed Conversion Ratio (FCR)</div>
                  <div 
                    className="fcr-value-huge" 
                    style={{ color: stats.fcrColor }}
                  >
                    {stats.fcr > 0 ? formatNumber(stats.fcr, 2) : 'N/A'}
                  </div>
                  <div 
                    className="fcr-rating-large" 
                    style={{ backgroundColor: stats.fcrColor }}
                  >
                    {stats.fcrRating}
                  </div>
                </div>
                <div className="fcr-summary-details">
                  <div className="fcr-detail-item">
                    <span className="fcr-detail-label">Total Weight Gain</span>
                    <span className="fcr-detail-value">{formatNumber(stats.totalWeightGain, 2)} kg</span>
                  </div>
                  <div className="fcr-detail-item">
                    <span className="fcr-detail-label">Formula</span>
                    <span className="fcr-detail-value">Feed ÷ Weight Gain</span>
                  </div>
                  <div className="fcr-detail-item">
                    <span className="fcr-detail-label">Calculation</span>
                    <span className="fcr-detail-value">
                      {formatNumber(stats.totalFeedKg, 2)} ÷ {formatNumber(stats.totalWeightGain, 2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Notes */}
            {summary?.notes && (
              <div className="summary-section">
                <h4>📝 Notes</h4>
                <p className="summary-notes">{summary.notes}</p>
              </div>
            )}
          </>
        )}

        {!stats && !loading && (
          <div className="no-data-message">
            <p>No feed consumption data available for this batch.</p>
            <button className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </EnhancedModal>
  );
};

export default BatchFeedSummary;

