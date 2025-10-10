import React, { useMemo } from 'react';
import { formatNumber } from '../../utils/formatters';
import { SummaryCard } from '../UI';
import './LiveChicken.css';

const SummaryCards = ({ batches = [] }) => {
  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!batches || batches.length === 0) {
      return {
        totalBatches: 0,
        totalChickens: 0,
        averageAge: 0,
        totalMortality: 0,
        averageMortalityRate: 0,
        healthyBatches: 0
      };
    }

    // Helper function to calculate age
    const calculateAge = (hatchDate) => {
      if (!hatchDate) return 0;
      const today = new Date();
      const hatch = new Date(hatchDate);
      const diffTime = Math.abs(today - hatch);
      const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      return diffWeeks;
    };

    // Process batches with calculated fields
    const processedBatches = batches.map(batch => ({
      ...batch,
      age: calculateAge(batch.hatch_date),
      mortalityRate: batch.initial_count > 0 
        ? (((batch.initial_count - batch.current_count) / batch.initial_count) * 100).toFixed(1)
        : 0
    }));

    const totalChickens = processedBatches.reduce((sum, batch) => sum + (batch.current_count || 0), 0);
    const totalMortality = processedBatches.reduce((sum, batch) => 
      sum + ((batch.initial_count || 0) - (batch.current_count || 0)), 0
    );
    const averageAge = processedBatches.length > 0 
      ? processedBatches.reduce((sum, batch) => sum + batch.age, 0) / processedBatches.length
      : 0;
    const averageMortalityRate = processedBatches.length > 0
      ? processedBatches.reduce((sum, batch) => sum + parseFloat(batch.mortalityRate), 0) / processedBatches.length
      : 0;
    const healthyBatches = processedBatches.filter(batch => batch.status === 'healthy').length;

    return {
      totalBatches: processedBatches.length,
      totalChickens,
      averageAge: Math.round(averageAge),
      totalMortality,
      averageMortalityRate: averageMortalityRate.toFixed(1),
      healthyBatches
    };
  }, [batches]);

  return (
    <div className="summary-cards">
      <SummaryCard
        title="Total Batches"
        value={summaryStats.totalBatches}
        icon="📦"
        variant="primary"
        subtitle="Active batches"
      />

      <SummaryCard
        title="Live Chickens"
        value={formatNumber(summaryStats.totalChickens)}
        icon="🐔"
        variant="success"
        subtitle="Current livestock"
      />

      <SummaryCard
        title="Average Age"
        value={`${summaryStats.averageAge} weeks`}
        icon="📅"
        variant="info"
        subtitle="Batch maturity"
      />

      <SummaryCard
        title="Total Mortality"
        value={summaryStats.totalMortality}
        icon="⚠️"
        variant={summaryStats.totalMortality > 0 ? "warning" : "success"}
        subtitle="Lost chickens"
      />

      <SummaryCard
        title="Healthy Batches"
        value={`${summaryStats.healthyBatches}/${summaryStats.totalBatches}`}
        icon="✅"
        variant="success"
        subtitle="Status overview"
      />

      <SummaryCard
        title="Avg Mortality Rate"
        value={`${summaryStats.averageMortalityRate}%`}
        icon="📊"
        variant={parseFloat(summaryStats.averageMortalityRate) > 10 ? "danger" : "success"}
        subtitle="Performance metric"
      />
    </div>
  );
};

export default SummaryCards;
