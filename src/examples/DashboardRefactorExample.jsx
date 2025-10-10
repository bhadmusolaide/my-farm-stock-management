import React from 'react';
import { SummaryCard, StatCard, AlertCard } from '../components/UI';
import { formatNumber } from '../utils/formatters';

// This file demonstrates how to refactor the Dashboard stats section
// to use the new global components

// BEFORE: Using custom CSS classes (old approach)
const DashboardStatsOld = ({ stats, totalWeight }) => {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <h3>Current Balance</h3>
        <p className="stat-value">₦{formatNumber(stats.balance, 2)}</p>
      </div>
      
      <div className="stat-card">
        <h3>Total Weight</h3>
        <p className="stat-value">{formatNumber(totalWeight, 2)} kg</p>
      </div>
      
      <div className="stat-card">
        <h3>Total Chickens</h3>
        <p className="stat-value">{formatNumber(stats.totalChickens)}</p>
      </div>
      
      <div className="stat-card">
        <h3>Total Revenue</h3>
        <p className="stat-value">₦{formatNumber(stats.totalRevenue, 2)}</p>
      </div>
      
      <div className="stat-card">
        <h3>Outstanding Balance</h3>
        <p className="stat-value">₦{formatNumber(stats.outstandingBalance, 2)}</p>
      </div>
    </div>
  );
};

// AFTER: Using global components (new approach)
const DashboardStatsNew = ({ stats, totalWeight }) => {
  return (
    <div className="summary-cards">
      <SummaryCard
        title="Current Balance"
        value={`₦${formatNumber(stats.balance, 2)}`}
        icon="💰"
        variant="success"
        subtitle="Available funds"
      />
      
      <SummaryCard
        title="Total Weight"
        value={`${formatNumber(totalWeight, 2)} kg`}
        icon="⚖️"
        variant="info"
        subtitle="Livestock weight"
      />
      
      <SummaryCard
        title="Total Chickens"
        value={formatNumber(stats.totalChickens)}
        icon="🐔"
        variant="primary"
        subtitle="Active livestock"
      />
      
      <SummaryCard
        title="Total Revenue"
        value={`₦${formatNumber(stats.totalRevenue, 2)}`}
        icon="📈"
        variant="success"
        subtitle="All time earnings"
      />
      
      <SummaryCard
        title="Outstanding Balance"
        value={`₦${formatNumber(stats.outstandingBalance, 2)}`}
        icon="⏳"
        variant={stats.outstandingBalance > 0 ? "warning" : "success"}
        subtitle="Pending payments"
      />
    </div>
  );
};

// Example of adding health alerts using the new AlertCard component
const HealthAlertsSection = ({ alerts = [] }) => {
  if (!alerts.length) return null;

  return (
    <section className="alert-section">
      <h3>🚨 Health Alerts</h3>
      {alerts.map((alert, index) => (
        <AlertCard
          key={index}
          type="danger"
          title={alert.title}
          message={alert.message}
          icon="🚨"
          dismissible={true}
        />
      ))}
    </section>
  );
};

// Complete refactored dashboard section example
const RefactoredDashboardExample = ({ stats, totalWeight, healthAlerts }) => {
  return (
    <div className="dashboard-container">
      <h1>Farm Management Dashboard</h1>
      
      {/* Health Alerts - New component */}
      <HealthAlertsSection alerts={healthAlerts} />
      
      {/* Stats Section - Refactored to use global components */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-title-icon">📊</span>
            Key Metrics
          </h2>
        </div>
        <DashboardStatsNew stats={stats} totalWeight={totalWeight} />
      </section>
      
      {/* Performance Metrics - Using StatCard for smaller metrics */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-title-icon">🎯</span>
            Performance Indicators
          </h2>
        </div>
        <div className="stats-grid">
          <StatCard
            label="Feed Conversion"
            value="1.8:1"
            icon="🌾"
            variant="success"
          />
          <StatCard
            label="Mortality Rate"
            value="3.2%"
            icon="⚠️"
            variant="warning"
          />
          <StatCard
            label="Growth Rate"
            value="45g/day"
            icon="📈"
            variant="info"
          />
          <StatCard
            label="Efficiency"
            value="92%"
            icon="⚡"
            variant="success"
          />
        </div>
      </section>
    </div>
  );
};

// Benefits of the new approach:
// 1. Consistent styling across all pages
// 2. Automatic dark mode support
// 3. Built-in responsive design
// 4. Reduced CSS maintenance
// 5. Better accessibility
// 6. Cleaner, more readable code

export { 
  DashboardStatsOld, 
  DashboardStatsNew, 
  HealthAlertsSection, 
  RefactoredDashboardExample 
};
