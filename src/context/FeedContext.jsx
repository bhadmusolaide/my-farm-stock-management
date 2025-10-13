import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

const FeedContext = createContext();

export function useFeedContext() {
  return useContext(FeedContext);
}

export function FeedProvider({ children }) {
  const { logAuditAction } = useAuth();
  
  // State management
  const [feedInventory, setFeedInventoryState] = useState([]);
  const [feedConsumption, setFeedConsumptionState] = useState([]);
  const [feedBatchAssignments, setFeedBatchAssignmentsState] = useState([]);
  const [feedAlerts, setFeedAlertsState] = useState([]);
  const [batchFeedSummaries, setBatchFeedSummariesState] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper functions to update state and save to localStorage
  const setFeedInventory = (newFeedInventory) => {
    setFeedInventoryState(newFeedInventory);
    try {
      localStorage.setItem('feedInventory', JSON.stringify(newFeedInventory));
    } catch (e) {
      console.warn('Failed to save feedInventory to localStorage:', e);
    }
  };

  const setFeedConsumption = (newFeedConsumption) => {
    setFeedConsumptionState(newFeedConsumption);
    try {
      localStorage.setItem('feedConsumption', JSON.stringify(newFeedConsumption));
    } catch (e) {
      console.warn('Failed to save feedConsumption to localStorage:', e);
    }
  };

  const setFeedBatchAssignments = (newAssignments) => {
    setFeedBatchAssignmentsState(newAssignments);
    try {
      localStorage.setItem('feedBatchAssignments', JSON.stringify(newAssignments));
    } catch (e) {
      console.warn('Failed to save feedBatchAssignments to localStorage:', e);
    }
  };

  const setFeedAlerts = (newAlerts) => {
    setFeedAlertsState(newAlerts);
    try {
      localStorage.setItem('feedAlerts', JSON.stringify(newAlerts));
    } catch (e) {
      console.warn('Failed to save feedAlerts to localStorage:', e);
    }
  };

  const setBatchFeedSummaries = (newSummaries) => {
    setBatchFeedSummariesState(newSummaries);
    try {
      localStorage.setItem('batchFeedSummaries', JSON.stringify(newSummaries));
    } catch (e) {
      console.warn('Failed to save batchFeedSummaries to localStorage:', e);
    }
  };

  // Load data from Supabase
  useEffect(() => {
    const loadFeedData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load feed inventory
        const { data: feedInventoryData, error: feedInventoryError } = await supabase
          .from('feed_inventory')
          .select('*')
          .order('purchase_date', { ascending: false });

        if (feedInventoryError && !feedInventoryError.message.includes('relation "feed_inventory" does not exist')) {
          throw feedInventoryError;
        }

        // Load feed batch assignments separately for joining
        const { data: batchAssignmentsForFeed, error: batchAssignmentsError } = await supabase
          .from('feed_batch_assignments')
          .select('*')
          .order('assigned_date', { ascending: false });

        if (batchAssignmentsError && !batchAssignmentsError.message.includes('relation "feed_batch_assignments" does not exist')) {
          console.warn('Error loading batch assignments:', batchAssignmentsError);
        }

        // Transform the data to match frontend expectations and manually join assignments
        const transformedFeedData = feedInventoryData?.map(feed => {
          const feedAssignments = batchAssignmentsForFeed?.filter(a => a.feed_id === feed.id) || [];
          return {
            ...feed,
            remaining_kg: feed.remaining_kg ?? feed.quantity_kg,
            assigned_batches: feedAssignments.map(assignment => ({
              batch_id: assignment.chicken_batch_id,
              assigned_quantity_kg: assignment.assigned_quantity_kg,
              auto_assigned: assignment.auto_assigned
            }))
          };
        }) || [];

        if (transformedFeedData && transformedFeedData.length > 0) {
          setFeedInventory(transformedFeedData);
        } else {
          const localFeedInventory = localStorage.getItem('feedInventory');
          if (localFeedInventory && localFeedInventory !== 'undefined') {
            try {
              setFeedInventory(JSON.parse(localFeedInventory));
            } catch (e) {
              console.warn('Invalid feedInventory data in localStorage:', e);
              setFeedInventory([]);
            }
          }
        }

        // Load feed consumption
        const { data: feedConsumptionData, error: feedConsumptionError } = await supabase
          .from('feed_consumption')
          .select('*')
          .order('consumption_date', { ascending: false });

        if (feedConsumptionError && !feedConsumptionError.message.includes('relation "feed_consumption" does not exist')) {
          throw feedConsumptionError;
        }

        if (feedConsumptionData && feedConsumptionData.length > 0) {
          setFeedConsumption(feedConsumptionData);
        } else {
          const localFeedConsumption = localStorage.getItem('feedConsumption');
          if (localFeedConsumption && localFeedConsumption !== 'undefined') {
            try {
              setFeedConsumption(JSON.parse(localFeedConsumption));
            } catch (e) {
              console.warn('Invalid feedConsumption data in localStorage:', e);
              setFeedConsumption([]);
            }
          }
        }

        // Load feed batch assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('feed_batch_assignments')
          .select('*')
          .order('assigned_date', { ascending: false });

        if (assignmentsError && !assignmentsError.message.includes('relation "feed_batch_assignments" does not exist')) {
          throw assignmentsError;
        }

        if (assignmentsData && assignmentsData.length > 0) {
          setFeedBatchAssignments(assignmentsData);
        }

        // Load feed alerts
        const { data: alertsData, error: alertsError } = await supabase
          .from('feed_alerts')
          .select('*')
          .eq('acknowledged', false)
          .order('created_at', { ascending: false });

        if (alertsError && !alertsError.message.includes('relation "feed_alerts" does not exist')) {
          throw alertsError;
        }

        if (alertsData && alertsData.length > 0) {
          setFeedAlerts(alertsData);
        }

        // Load batch feed summaries
        const { data: summariesData, error: summariesError } = await supabase
          .from('batch_feed_summary')
          .select('*')
          .order('summary_date', { ascending: false });

        if (summariesError && !summariesError.message.includes('relation "batch_feed_summary" does not exist')) {
          throw summariesError;
        }

        if (summariesData && summariesData.length > 0) {
          setBatchFeedSummaries(summariesData);
        }

      } catch (err) {
        console.error('Error loading feed data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadFeedData();
  }, []);

  // CRUD operations for feed inventory
  const addFeedInventory = async (feedData) => {
    try {
      const { assigned_batches, ...feedItemData } = feedData;
      
      const feedItem = {
        id: Date.now().toString(),
        ...feedItemData,
        remaining_kg: feedItemData.quantity_kg,
        total_cost: feedItemData.number_of_bags * feedItemData.cost_per_bag,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('feed_inventory').insert(feedItem);
      if (error) throw error;

      setFeedInventory(prev => [feedItem, ...prev]);

      // Handle batch assignments if any
      if (assigned_batches && assigned_batches.length > 0) {
        const assignments = assigned_batches.map(ab => ({
          id: `${feedItem.id}-${ab.batch_id}-${Date.now()}`,
          feed_id: feedItem.id,
          chicken_batch_id: ab.batch_id,
          assigned_quantity_kg: parseFloat(ab.assigned_quantity_kg),
          assigned_date: new Date().toISOString().split('T')[0],
          auto_assigned: ab.auto_assigned || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: assignmentError } = await supabase
          .from('feed_batch_assignments')
          .insert(assignments);

        if (assignmentError) {
          console.error('Error creating batch assignments:', assignmentError);
        } else {
          setFeedBatchAssignments(prev => [...assignments, ...prev]);
        }
      }

      await logAuditAction('CREATE', 'feed_inventory', feedItem.id, null, feedItem);

      return feedItem;
    } catch (err) {
      console.error('Error adding feed inventory:', err);
      throw err;
    }
  };

  const updateFeedInventory = async (id, updatedData) => {
    try {
      const oldFeed = feedInventory.find(f => f.id === id);
      
      const feedUpdate = {
        ...updatedData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('feed_inventory')
        .update(feedUpdate)
        .eq('id', id);

      if (error) throw error;

      setFeedInventory(prev => prev.map(f => f.id === id ? { ...f, ...feedUpdate } : f));

      await logAuditAction('UPDATE', 'feed_inventory', id, oldFeed, feedUpdate);

      return { ...oldFeed, ...feedUpdate };
    } catch (err) {
      console.error('Error updating feed inventory:', err);
      throw err;
    }
  };

  const deleteFeedInventory = async (id) => {
    try {
      const feedToDelete = feedInventory.find(f => f.id === id);

      const { error } = await supabase
        .from('feed_inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFeedInventory(prev => prev.filter(f => f.id !== id));

      await logAuditAction('DELETE', 'feed_inventory', id, feedToDelete, null);

      return feedToDelete;
    } catch (err) {
      console.error('Error deleting feed inventory:', err);
      throw err;
    }
  };

  // CRUD operations for feed consumption
  const addFeedConsumption = async (consumptionData) => {
    try {
      const consumption = {
        id: Date.now().toString(),
        ...consumptionData,
        consumption_date: consumptionData.consumption_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('feed_consumption').insert(consumption);
      if (error) throw error;

      setFeedConsumption(prev => [consumption, ...prev]);

      // Update feed inventory remaining quantity
      const feed = feedInventory.find(f => f.id === consumption.feed_id);
      if (feed) {
        const newRemainingKg = Math.max(0, (feed.remaining_kg || feed.quantity_kg) - consumption.quantity_consumed);
        await updateFeedInventory(feed.id, {
          ...feed,
          remaining_kg: newRemainingKg
        });
      }

      // Recalculate FCR for the batch
      await recalculateBatchFCR(consumption.chicken_batch_id);

      await logAuditAction('CREATE', 'feed_consumption', consumption.id, null, consumption);

      return consumption;
    } catch (err) {
      console.error('Error adding feed consumption:', err);
      throw err;
    }
  };

  const deleteFeedConsumption = async (id) => {
    try {
      const consumptionToDelete = feedConsumption.find(c => c.id === id);

      const { error } = await supabase
        .from('feed_consumption')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFeedConsumption(prev => prev.filter(c => c.id !== id));

      // Restore feed inventory quantity
      if (consumptionToDelete) {
        const feed = feedInventory.find(f => f.id === consumptionToDelete.feed_id);
        if (feed) {
          const newRemainingKg = (feed.remaining_kg || feed.quantity_kg) + consumptionToDelete.quantity_consumed;
          await updateFeedInventory(feed.id, {
            ...feed,
            remaining_kg: newRemainingKg
          });
        }

        // Recalculate FCR for the batch
        await recalculateBatchFCR(consumptionToDelete.chicken_batch_id);
      }

      await logAuditAction('DELETE', 'feed_consumption', id, consumptionToDelete, null);

      return consumptionToDelete;
    } catch (err) {
      console.error('Error deleting feed consumption:', err);
      throw err;
    }
  };

  // CRUD operations for feed batch assignments
  const addFeedBatchAssignment = async (assignmentData) => {
    try {
      const assignment = {
        id: Date.now().toString(),
        ...assignmentData,
        assigned_date: assignmentData.assigned_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('feed_batch_assignments').insert(assignment);
      if (error) throw error;

      setFeedBatchAssignments(prev => [assignment, ...prev]);

      await logAuditAction('CREATE', 'feed_batch_assignments', assignment.id, null, assignment);

      return assignment;
    } catch (err) {
      console.error('Error adding feed batch assignment:', err);
      throw err;
    }
  };

  const deleteFeedBatchAssignment = async (id) => {
    try {
      const assignmentToDelete = feedBatchAssignments.find(a => a.id === id);

      const { error } = await supabase
        .from('feed_batch_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFeedBatchAssignments(prev => prev.filter(a => a.id !== id));

      await logAuditAction('DELETE', 'feed_batch_assignments', id, assignmentToDelete, null);

      return assignmentToDelete;
    } catch (err) {
      console.error('Error deleting feed batch assignment:', err);
      throw err;
    }
  };

  // Auto-assign feed to active batches
  const autoAssignFeedToBatches = async (feedId, activeBatches) => {
    try {
      const feed = feedInventory.find(f => f.id === feedId);
      if (!feed || !activeBatches || activeBatches.length === 0) {
        return [];
      }

      // Calculate total bird count
      const totalBirds = activeBatches.reduce((sum, batch) => sum + (batch.current_count || 0), 0);

      if (totalBirds === 0) {
        return [];
      }

      // Distribute feed proportionally based on bird count
      const assignments = activeBatches.map(batch => {
        const proportion = (batch.current_count || 0) / totalBirds;
        const assignedQuantity = feed.quantity_kg * proportion;

        return {
          id: `${feedId}-${batch.id}-${Date.now()}`,
          feed_id: feedId,
          chicken_batch_id: batch.id,
          assigned_quantity_kg: parseFloat(assignedQuantity.toFixed(2)),
          assigned_date: new Date().toISOString().split('T')[0],
          auto_assigned: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      const { error } = await supabase
        .from('feed_batch_assignments')
        .insert(assignments);

      if (error) throw error;

      setFeedBatchAssignments(prev => [...assignments, ...prev]);

      // Update feed to mark as auto-assigned
      await updateFeedInventory(feedId, {
        ...feed,
        auto_assigned: true
      });

      return assignments;
    } catch (err) {
      console.error('Error auto-assigning feed to batches:', err);
      throw err;
    }
  };

  // FCR Calculation
  const calculateBatchFCR = (batchId, liveChickens, weightHistory) => {
    try {
      const batch = liveChickens?.find(b => b.id === batchId);
      if (!batch) return null;

      // Get total feed consumed for this batch
      const batchConsumption = feedConsumption.filter(c => c.chicken_batch_id === batchId);
      const totalFeedKg = batchConsumption.reduce((sum, c) => sum + c.quantity_consumed, 0);

      // Calculate weight gain
      const batchWeightHistory = weightHistory?.filter(w => w.chicken_batch_id === batchId) || [];

      let totalWeightGain = 0;
      if (batchWeightHistory.length > 0) {
        // Sort by date
        const sortedWeights = [...batchWeightHistory].sort((a, b) =>
          new Date(a.recorded_date) - new Date(b.recorded_date)
        );

        const initialWeight = sortedWeights[0]?.weight || batch.expected_weight || 0;
        const currentWeight = batch.current_weight || sortedWeights[sortedWeights.length - 1]?.weight || 0;

        totalWeightGain = (currentWeight - initialWeight) * batch.current_count;
      } else {
        // Fallback to batch data
        const initialWeight = batch.expected_weight || 0;
        const currentWeight = batch.current_weight || 0;
        totalWeightGain = (currentWeight - initialWeight) * batch.current_count;
      }

      if (totalWeightGain <= 0) return null;

      const fcr = totalFeedKg / totalWeightGain;

      // Determine FCR rating
      let rating = 'average';
      let color = 'yellow';

      if (fcr < 1.5) {
        rating = 'excellent';
        color = 'green';
      } else if (fcr < 1.8) {
        rating = 'good';
        color = 'green';
      } else if (fcr < 2.2) {
        rating = 'average';
        color = 'yellow';
      } else {
        rating = 'poor';
        color = 'red';
      }

      return {
        fcr: parseFloat(fcr.toFixed(4)),
        totalFeedKg,
        totalWeightGain,
        rating,
        color
      };
    } catch (err) {
      console.error('Error calculating FCR:', err);
      return null;
    }
  };

  const recalculateBatchFCR = async (batchId) => {
    try {
      // This will be called after consumption is logged
      // The actual FCR will be calculated on-demand when needed
      // We can optionally store it in batch_feed_summary table
      return true;
    } catch (err) {
      console.error('Error recalculating FCR:', err);
      return false;
    }
  };

  // Generate batch feed summary
  const generateBatchFeedSummary = async (batchId, liveChickens, weightHistory) => {
    try {
      const batch = liveChickens?.find(b => b.id === batchId);
      if (!batch) throw new Error('Batch not found');

      // Get all consumption for this batch
      const batchConsumption = feedConsumption.filter(c => c.chicken_batch_id === batchId);
      const totalFeedKg = batchConsumption.reduce((sum, c) => sum + c.quantity_consumed, 0);
      const totalFeedBags = totalFeedKg / 25; // Assuming 25kg per bag

      // Calculate total cost
      let totalFeedCost = 0;
      batchConsumption.forEach(consumption => {
        const feed = feedInventory.find(f => f.id === consumption.feed_id);
        if (feed) {
          totalFeedCost += consumption.quantity_consumed * feed.cost_per_kg;
        }
      });

      // Calculate FCR
      const fcrData = calculateBatchFCR(batchId, liveChickens, weightHistory);

      const summary = {
        id: `${batchId}-${Date.now()}`,
        chicken_batch_id: batchId,
        total_feed_kg: parseFloat(totalFeedKg.toFixed(2)),
        total_feed_bags: parseFloat(totalFeedBags.toFixed(2)),
        total_feed_cost: parseFloat(totalFeedCost.toFixed(2)),
        average_fcr: fcrData?.fcr || null,
        total_weight_gain: fcrData?.totalWeightGain || null,
        feed_efficiency_rating: fcrData?.rating || 'unknown',
        summary_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('batch_feed_summary').insert(summary);
      if (error) throw error;

      setBatchFeedSummaries(prev => [summary, ...prev]);

      await logAuditAction('CREATE', 'batch_feed_summary', summary.id, null, summary);

      return summary;
    } catch (err) {
      console.error('Error generating batch feed summary:', err);
      throw err;
    }
  };

  // Get last consumption for a batch
  const getLastConsumptionForBatch = (batchId) => {
    const batchConsumptions = feedConsumption
      .filter(c => c.chicken_batch_id === batchId)
      .sort((a, b) => new Date(b.consumption_date) - new Date(a.consumption_date));

    return batchConsumptions[0] || null;
  };

  // Get 3-day average consumption for a batch
  const get3DayAverageConsumption = (batchId) => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const recentConsumptions = feedConsumption.filter(c =>
      c.chicken_batch_id === batchId &&
      new Date(c.consumption_date) >= threeDaysAgo
    );

    if (recentConsumptions.length === 0) return 0;

    const totalConsumed = recentConsumptions.reduce((sum, c) => sum + c.quantity_consumed, 0);
    return totalConsumed / recentConsumptions.length;
  };

  // Generate feed alerts
  const generateFeedAlerts = async (liveChickens, weightHistory) => {
    try {
      const alerts = [];

      // Check for low stock
      feedInventory.forEach(feed => {
        const remainingKg = feed.remaining_kg ?? feed.quantity_kg;
        const lowStockThreshold = feed.quantity_kg * 0.2; // 20% threshold

        if (remainingKg <= lowStockThreshold && remainingKg > 0) {
          alerts.push({
            id: `low-stock-${feed.id}-${Date.now()}`,
            alert_type: 'low_stock',
            severity: remainingKg <= feed.quantity_kg * 0.1 ? 'critical' : 'warning',
            feed_id: feed.id,
            chicken_batch_id: null,
            message: `Low stock alert: ${feed.feed_type} - ${feed.brand} has only ${remainingKg.toFixed(2)} kg remaining`,
            action_link: '/feed-management?action=purchase',
            acknowledged: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });

      // Check for no consumption logged (last 3 days)
      if (liveChickens) {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        liveChickens.forEach(batch => {
          if (batch.status === 'healthy' || batch.status === 'active') {
            const recentConsumption = feedConsumption.filter(c =>
              c.chicken_batch_id === batch.id &&
              new Date(c.consumption_date) >= threeDaysAgo
            );

            if (recentConsumption.length === 0) {
              alerts.push({
                id: `no-consumption-${batch.id}-${Date.now()}`,
                alert_type: 'no_consumption',
                severity: 'warning',
                feed_id: null,
                chicken_batch_id: batch.id,
                message: `No feed consumption logged for batch ${batch.batch_id} in the last 3 days`,
                action_link: `/feed-management?action=log-consumption&batch=${batch.id}`,
                acknowledged: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          }
        });

        // Check for FCR deviations
        liveChickens.forEach(batch => {
          const fcrData = calculateBatchFCR(batch.id, liveChickens, weightHistory);

          if (fcrData && (fcrData.rating === 'poor' || fcrData.fcr > 2.5)) {
            alerts.push({
              id: `fcr-deviation-${batch.id}-${Date.now()}`,
              alert_type: 'fcr_deviation',
              severity: fcrData.fcr > 3.0 ? 'critical' : 'warning',
              feed_id: null,
              chicken_batch_id: batch.id,
              message: `Poor FCR detected for batch ${batch.batch_id}: ${fcrData.fcr.toFixed(2)} (Rating: ${fcrData.rating})`,
              action_link: `/feed-management?action=review-data&batch=${batch.id}`,
              acknowledged: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        });
      }

      // Check for expiring feed
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      feedInventory.forEach(feed => {
        if (feed.expiry_date) {
          const expiryDate = new Date(feed.expiry_date);
          if (expiryDate <= thirtyDaysFromNow && expiryDate > new Date()) {
            const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
            alerts.push({
              id: `expiry-warning-${feed.id}-${Date.now()}`,
              alert_type: 'expiry_warning',
              severity: daysUntilExpiry <= 7 ? 'critical' : 'warning',
              feed_id: feed.id,
              chicken_batch_id: null,
              message: `Feed expiring soon: ${feed.feed_type} - ${feed.brand} expires in ${daysUntilExpiry} days`,
              action_link: '/feed-management',
              acknowledged: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      });

      // Save alerts to database
      if (alerts.length > 0) {
        const { error } = await supabase.from('feed_alerts').insert(alerts);
        if (error) {
          console.error('Error saving alerts:', error);
        } else {
          setFeedAlerts(prev => [...alerts, ...prev]);
        }
      }

      return alerts;
    } catch (err) {
      console.error('Error generating feed alerts:', err);
      return [];
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = async (alertId, userId) => {
    try {
      const { error } = await supabase
        .from('feed_alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      setFeedAlerts(prev => prev.filter(a => a.id !== alertId));

      return true;
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      throw err;
    }
  };

  // Predictive feed forecasting
  const calculateFeedForecast = (feedId, days = 14) => {
    try {
      const feed = feedInventory.find(f => f.id === feedId);
      if (!feed) return null;

      // Get consumption history for this feed (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentConsumption = feedConsumption.filter(c =>
        c.feed_id === feedId &&
        new Date(c.consumption_date) >= thirtyDaysAgo
      );

      if (recentConsumption.length === 0) {
        return {
          feedId,
          feedName: `${feed.feed_type} - ${feed.brand}`,
          currentStock: feed.remaining_kg ?? feed.quantity_kg,
          avgDailyConsumption: 0,
          projectedDaysRemaining: Infinity,
          depletionDate: null,
          suggestedPurchaseQuantity: 0,
          forecast: 'No consumption data available'
        };
      }

      // Calculate average daily consumption
      const totalConsumed = recentConsumption.reduce((sum, c) => sum + c.quantity_consumed, 0);
      const daysWithData = recentConsumption.length;
      const avgDailyConsumption = totalConsumed / daysWithData;

      // Calculate projected days remaining
      const currentStock = feed.remaining_kg ?? feed.quantity_kg;
      const projectedDaysRemaining = avgDailyConsumption > 0
        ? currentStock / avgDailyConsumption
        : Infinity;

      // Calculate depletion date
      let depletionDate = null;
      if (projectedDaysRemaining !== Infinity) {
        depletionDate = new Date();
        depletionDate.setDate(depletionDate.getDate() + Math.ceil(projectedDaysRemaining));
      }

      // Suggest purchase quantity for next X days
      const suggestedPurchaseQuantity = avgDailyConsumption * days;
      const suggestedBags = Math.ceil(suggestedPurchaseQuantity / 25); // 25kg per bag

      return {
        feedId,
        feedName: `${feed.feed_type} - ${feed.brand}`,
        currentStock: parseFloat(currentStock.toFixed(2)),
        avgDailyConsumption: parseFloat(avgDailyConsumption.toFixed(2)),
        projectedDaysRemaining: Math.ceil(projectedDaysRemaining),
        depletionDate: depletionDate ? depletionDate.toISOString().split('T')[0] : null,
        suggestedPurchaseQuantity: parseFloat(suggestedPurchaseQuantity.toFixed(2)),
        suggestedBags,
        forecast: projectedDaysRemaining < 7
          ? 'Critical - Purchase needed urgently'
          : projectedDaysRemaining < 14
          ? 'Warning - Purchase needed soon'
          : 'Good - Stock sufficient'
      };
    } catch (err) {
      console.error('Error calculating feed forecast:', err);
      return null;
    }
  };

  // Get all forecasts
  const getAllFeedForecasts = (days = 14) => {
    return feedInventory
      .filter(feed => feed.status === 'active')
      .map(feed => calculateFeedForecast(feed.id, days))
      .filter(forecast => forecast !== null)
      .sort((a, b) => a.projectedDaysRemaining - b.projectedDaysRemaining);
  };

  // Legacy functions for backward compatibility
  const getLowFeedAlerts = () => {
    return feedInventory
      .filter(feed => {
        const remainingKg = feed.remaining_kg ?? feed.quantity_kg;
        return remainingKg <= feed.quantity_kg * 0.2;
      })
      .map(feed => ({
        ...feed,
        remainingKg: feed.remaining_kg ?? feed.quantity_kg,
        alertLevel: (feed.remaining_kg ?? feed.quantity_kg) <= feed.quantity_kg * 0.1 ? 'critical' : 'warning'
      }));
  };

  const calculateProjectedFeedNeeds = (days = 7) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyConsumption = {};
    feedConsumption.forEach(consumption => {
      if (new Date(consumption.consumption_date) >= thirtyDaysAgo) {
        if (!dailyConsumption[consumption.feed_id]) {
          dailyConsumption[consumption.feed_id] = { total: 0, days: 0 };
        }
        dailyConsumption[consumption.feed_id].total += consumption.quantity_consumed;
        dailyConsumption[consumption.feed_id].days += 1;
      }
    });

    return feedInventory.map(feed => {
      const consumption = dailyConsumption[feed.id];
      const avgDailyConsumption = consumption ? consumption.total / consumption.days : 0;
      const projectedNeed = avgDailyConsumption * days;
      const currentStock = feed.remaining_kg ?? feed.quantity_kg;
      const shortfall = Math.max(0, projectedNeed - currentStock);

      return {
        ...feed,
        avgDailyConsumption,
        projectedNeed,
        currentStock,
        shortfall,
        daysRemaining: avgDailyConsumption > 0 ? currentStock / avgDailyConsumption : Infinity
      };
    });
  };

  const value = {
    // State
    feedInventory,
    feedConsumption,
    feedBatchAssignments,
    feedAlerts,
    batchFeedSummaries,
    loading,
    error,

    // CRUD operations
    addFeedInventory,
    updateFeedInventory,
    deleteFeedInventory,
    addFeedConsumption,
    deleteFeedConsumption,
    addFeedBatchAssignment,
    deleteFeedBatchAssignment,

    // Auto-assignment
    autoAssignFeedToBatches,

    // FCR calculations
    calculateBatchFCR,
    recalculateBatchFCR,

    // Batch summary
    generateBatchFeedSummary,

    // Consumption helpers
    getLastConsumptionForBatch,
    get3DayAverageConsumption,

    // Alerts
    generateFeedAlerts,
    acknowledgeAlert,

    // Forecasting
    calculateFeedForecast,
    getAllFeedForecasts,

    // Legacy functions
    getLowFeedAlerts,
    calculateProjectedFeedNeeds
  };

  return (
    <FeedContext.Provider value={value}>
      {children}
    </FeedContext.Provider>
  );
}

export { FeedContext };

