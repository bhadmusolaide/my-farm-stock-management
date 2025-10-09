import React, { useMemo } from 'react';
import { formatNumber } from '../../utils/formatters';
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

  const cards = [
    {
      title: 'Total Batches',
      value: summaryStats.totalBatches,
      icon: '📦',
      className: 'primary'
    },
    {
      title: 'Live Chickens',
      value: formatNumber(summaryStats.totalChickens),
      icon: '🐔',
      className: 'success'
    },
    {
      title: 'Average Age',
      value: `${summaryStats.averageAge} weeks`,
      icon: '📅',
      className: 'info'
    },
    {
      title: 'Total Mortality',
      value: summaryStats.totalMortality,
      icon: '⚠️',
      className: summaryStats.totalMortality > 0 ? 'warning' : 'success'
    },
    {
      title: 'Healthy Batches',
      value: `${summaryStats.healthyBatches}/${summaryStats.totalBatches}`,
      icon: '✅',
      className: 'success'
    },
    {
      title: 'Avg Mortality Rate',
      value: `${summaryStats.averageMortalityRate}%`,
      icon: '📊',
      className: parseFloat(summaryStats.averageMortalityRate) > 10 ? 'danger' : 'success'
    }
  ];

  return (
    <div className="summary-cards">
      {cards.map((card, index) => (
        <div key={index} className={`summary-card ${card.className}`}>
          <div className="summary-card__icon">
            {card.icon}
          </div>
          <div className="summary-card__content">
            <h3 className="summary-card__title">{card.title}</h3>
            <p className="summary-card__value">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
