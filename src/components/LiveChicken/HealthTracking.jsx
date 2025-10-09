import React, { useMemo } from 'react';
import { DataTable, StatusBadge } from '../UI';
import { formatDate } from '../../utils/formatters';
import './LiveChicken.css';

const HealthTracking = ({ batches = [] }) => {
  // Calculate health data
  const healthData = useMemo(() => {
    if (!batches || batches.length === 0) {
      return {
        healthStatus: { healthy: 0, sick: 0, quarantine: 0, processing: 0 },
        vaccinationDue: [],
        healthAlerts: [],
        riskBatches: []
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

    // Health status distribution
    const healthStatus = processedBatches.reduce((acc, batch) => {
      acc[batch.status] = (acc[batch.status] || 0) + 1;
      return acc;
    }, { healthy: 0, sick: 0, quarantine: 0, processing: 0 });

    // Vaccination due (example logic - batches that need vaccination at certain ages)
    const vaccinationDue = processedBatches.filter(batch => {
      const age = batch.age;
      // Example vaccination schedule: 1 week, 3 weeks, 5 weeks
      return age === 1 || age === 3 || age === 5;
    }).map(batch => ({
      ...batch,
      vaccinationType: batch.age === 1 ? 'Newcastle Disease' : 
                      batch.age === 3 ? 'Infectious Bronchitis' : 
                      'Gumboro Disease'
    }));

    // Health alerts
    const healthAlerts = [];
    
    processedBatches.forEach(batch => {
      const mortalityRate = parseFloat(batch.mortalityRate);
      
      if (mortalityRate > 20) {
        healthAlerts.push({
          type: 'critical',
          message: `Critical mortality rate (${batch.mortalityRate}%) in batch ${batch.batch_id}`,
          batchId: batch.batch_id
        });
      } else if (mortalityRate > 10) {
        healthAlerts.push({
          type: 'warning',
          message: `High mortality rate (${batch.mortalityRate}%) in batch ${batch.batch_id}`,
          batchId: batch.batch_id
        });
      }

      if (batch.status === 'sick') {
        healthAlerts.push({
          type: 'warning',
          message: `Batch ${batch.batch_id} is marked as sick and needs attention`,
          batchId: batch.batch_id
        });
      }

      if (batch.status === 'quarantine') {
        healthAlerts.push({
          type: 'critical',
          message: `Batch ${batch.batch_id} is in quarantine`,
          batchId: batch.batch_id
        });
      }
    });

    // Risk batches (high mortality or sick status)
    const riskBatches = processedBatches.filter(batch => {
      const mortalityRate = parseFloat(batch.mortalityRate);
      return mortalityRate > 10 || batch.status === 'sick' || batch.status === 'quarantine';
    });

    return {
      healthStatus,
      vaccinationDue,
      healthAlerts,
      riskBatches
    };
  }, [batches]);

  // Health status cards
  const healthStatusCards = [
    { status: 'healthy', label: 'Healthy', icon: '✅', color: 'success' },
    { status: 'sick', label: 'Sick', icon: '🤒', color: 'warning' },
    { status: 'quarantine', label: 'Quarantine', icon: '🚫', color: 'danger' },
    { status: 'processing', label: 'Processing', icon: '⚙️', color: 'info' }
  ];

  // Vaccination table columns
  const vaccinationColumns = [
    { key: 'batch_id', label: 'Batch ID' },
    { key: 'breed', label: 'Breed' },
    { key: 'age', label: 'Age (weeks)' },
    { key: 'vaccinationType', label: 'Vaccination Type' },
    { key: 'current_count', label: 'Birds Count' },
    { key: 'status', label: 'Status' }
  ];

  // Risk batches table columns
  const riskColumns = [
    { key: 'batch_id', label: 'Batch ID' },
    { key: 'breed', label: 'Breed' },
    { key: 'status', label: 'Status' },
    { key: 'mortalityRate', label: 'Mortality Rate' },
    { key: 'current_count', label: 'Current Count' },
    { key: 'riskLevel', label: 'Risk Level' }
  ];

  // Custom cell renderer for vaccination table
  const renderVaccinationCell = (value, row, column) => {
    switch (column.key) {
      case 'status':
        return <StatusBadge status={row.status} showIcon />;
      case 'age':
        return `${row.age} weeks`;
      default:
        return value;
    }
  };

  // Custom cell renderer for risk batches table
  const renderRiskCell = (value, row, column) => {
    switch (column.key) {
      case 'status':
        return <StatusBadge status={row.status} showIcon />;
      case 'mortalityRate':
        return (
          <span className={parseFloat(row.mortalityRate) > 15 ? 'critical-mortality' : 'high-mortality'}>
            {row.mortalityRate}%
          </span>
        );
      case 'riskLevel':
        const mortalityRate = parseFloat(row.mortalityRate);
        const riskLevel = mortalityRate > 20 ? 'Critical' : 
                         mortalityRate > 15 ? 'High' : 
                         row.status === 'quarantine' ? 'Critical' :
                         row.status === 'sick' ? 'High' : 'Medium';
        const riskColor = riskLevel === 'Critical' ? 'danger' : 
                         riskLevel === 'High' ? 'warning' : 'info';
        return <StatusBadge status={riskLevel.toLowerCase()} type={riskColor}>{riskLevel}</StatusBadge>;
      default:
        return value;
    }
  };

  return (
    <div className="health-tracking">
      <h2>Health Tracking Dashboard</h2>
      
      {/* Health Alerts */}
      {healthData.healthAlerts.length > 0 && (
        <div className="health-alerts">
          <h3>🚨 Health Alerts</h3>
          <div className="alerts-container">
            {healthData.healthAlerts.map((alert, index) => (
              <div key={index} className={`alert alert-${alert.type}`}>
                <span className="alert-icon">
                  {alert.type === 'critical' ? '🔴' : '⚠️'}
                </span>
                <span className="alert-message">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Status Overview */}
      <div className="health-status-overview">
        <h3>📊 Health Status Overview</h3>
        <div className="health-status-cards">
          {healthStatusCards.map(card => (
            <div key={card.status} className={`health-status-card ${card.color}`}>
              <div className="health-status-card__icon">{card.icon}</div>
              <div className="health-status-card__content">
                <h4>{card.label}</h4>
                <p className="health-status-card__count">
                  {healthData.healthStatus[card.status] || 0}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vaccination Schedule */}
      {healthData.vaccinationDue.length > 0 && (
        <div className="vaccination-section">
          <h3>💉 Vaccination Schedule</h3>
          <DataTable
            data={healthData.vaccinationDue}
            columns={vaccinationColumns}
            renderCell={renderVaccinationCell}
            enableSorting
            enablePagination={false}
            emptyMessage="No vaccinations due"
          />
        </div>
      )}

      {/* Risk Batches */}
      <div className="risk-batches-section">
        <h3>⚠️ Risk Batches Monitoring</h3>
        <DataTable
          data={healthData.riskBatches}
          columns={riskColumns}
          renderCell={renderRiskCell}
          enableSorting
          enablePagination
          emptyMessage="No risk batches identified"
          rowClassName={(row) => {
            const mortalityRate = parseFloat(row.mortalityRate);
            if (mortalityRate > 20 || row.status === 'quarantine') return 'critical-risk';
            if (mortalityRate > 15 || row.status === 'sick') return 'high-risk';
            return 'medium-risk';
          }}
        />
      </div>
    </div>
  );
};

export default HealthTracking;
