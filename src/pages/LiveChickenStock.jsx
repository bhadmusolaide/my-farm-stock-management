import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { formatDate, formatNumber } from '../utils/formatters';
import './LiveChickenStock.css';

const LiveChickenStock = () => {
  const { liveChickens, addLiveChicken, deleteLiveChicken } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('batches');
  const [filters, setFilters] = useState({
    breed: '',
    status: '',
    ageRange: '',
    searchTerm: ''
  });
  
  const [formData, setFormData] = useState({
    batch_id: '',
    breed: '',
    initial_count: '',
    current_count: '',
    hatch_date: '',
    expected_weight: '',
    current_weight: '',
    feed_type: '',
    status: 'healthy',
    mortality: '0',
    notes: ''
  });

  // Calculate age in weeks
  const calculateAge = (hatch_date) => {
    const today = new Date();
    const hatch = new Date(hatch_date);
    const diffTime = Math.abs(today - hatch);
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  // Filter and process chicken data
  const processedChickens = useMemo(() => {
    if (!liveChickens) return [];
    
    return liveChickens
      .map(chicken => ({
        ...chicken,
        age: calculateAge(chicken.hatch_date),
        mortalityRate: ((chicken.initial_count - chicken.current_count) / chicken.initial_count * 100).toFixed(1),
        weightGain: chicken.current_weight - (chicken.expected_weight || 0)
      }))
      .filter(chicken => {
        const matchesBreed = !filters.breed || chicken.breed.toLowerCase().includes(filters.breed.toLowerCase());
        const matchesStatus = !filters.status || chicken.status === filters.status;
        const matchesSearch = !filters.searchTerm || 
          chicken.batch_id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          chicken.breed.toLowerCase().includes(filters.searchTerm.toLowerCase());
        
        let matchesAge = true;
        if (filters.ageRange) {
          const age = chicken.age;
          switch (filters.ageRange) {
            case '0-4': matchesAge = age <= 4; break;
            case '5-8': matchesAge = age >= 5 && age <= 8; break;
            case '9-12': matchesAge = age >= 9 && age <= 12; break;
            case '13+': matchesAge = age >= 13; break;
            default: matchesAge = true;
          }
        }
        
        return matchesBreed && matchesStatus && matchesSearch && matchesAge;
      });
  }, [liveChickens, filters]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!processedChickens.length) {
      return {
        totalBatches: 0,
        totalChickens: 0,
        averageAge: 0,
        totalMortality: 0,
        averageMortalityRate: 0,
        healthyBatches: 0
      };
    }

    const totalChickens = processedChickens.reduce((sum, batch) => sum + batch.current_count, 0);
    const totalMortality = processedChickens.reduce((sum, batch) => sum + (batch.initial_count - batch.current_count), 0);
    const averageAge = processedChickens.reduce((sum, batch) => sum + batch.age, 0) / processedChickens.length;
    const averageMortalityRate = processedChickens.reduce((sum, batch) => sum + parseFloat(batch.mortalityRate), 0) / processedChickens.length;
    const healthyBatches = processedChickens.filter(batch => batch.status === 'healthy').length;

    return {
      totalBatches: processedChickens.length,
      totalChickens,
      averageAge: Math.round(averageAge),
      totalMortality,
      averageMortalityRate: averageMortalityRate.toFixed(1),
      healthyBatches
    };
  }, [processedChickens]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!processedChickens.length) {
      return {
        growthRate: 0,
        feedConversionRatio: 0,
        productionEfficiency: 0,
        weightGainTrend: [],
        breedPerformance: [],
        ageDistribution: [],
        mortalityTrend: []
      };
    }

    // Calculate growth rate (average weight gain per week)
    const totalWeightGain = processedChickens.reduce((sum, batch) => {
      const weightGain = batch.current_weight - (batch.expected_weight || 0);
      return sum + (weightGain > 0 ? weightGain : 0);
    }, 0);
    const growthRate = (totalWeightGain / processedChickens.length).toFixed(2);

    // Calculate feed conversion ratio (estimated)
    const avgFeedConversion = 1.8; // Standard FCR for broilers
    const feedConversionRatio = avgFeedConversion;

    // Calculate production efficiency
    const avgWeight = processedChickens.reduce((sum, batch) => sum + batch.current_weight, 0) / processedChickens.length;
    const avgMortality = parseFloat(summaryStats.averageMortalityRate);
    const productionEfficiency = ((avgWeight * (100 - avgMortality)) / 100).toFixed(1);

    // Breed performance analysis
    const breedStats = {};
    processedChickens.forEach(batch => {
      if (!breedStats[batch.breed]) {
        breedStats[batch.breed] = {
          count: 0,
          totalWeight: 0,
          totalMortality: 0,
          batches: 0
        };
      }
      breedStats[batch.breed].count += batch.current_count;
      breedStats[batch.breed].totalWeight += batch.current_weight;
      breedStats[batch.breed].totalMortality += parseFloat(batch.mortalityRate);
      breedStats[batch.breed].batches += 1;
    });

    const breedPerformance = Object.entries(breedStats).map(([breed, stats]) => ({
      breed,
      avgWeight: (stats.totalWeight / stats.batches).toFixed(1),
      avgMortality: (stats.totalMortality / stats.batches).toFixed(1),
      totalCount: stats.count,
      batches: stats.batches
    }));

    // Age distribution
    const ageGroups = { 'Chick (0-4w)': 0, 'Grower (5-8w)': 0, 'Finisher (9-12w)': 0, 'Mature (13w+)': 0 };
    processedChickens.forEach(batch => {
      const category = getAgeCategory(batch.age);
      if (category === 'Chick') ageGroups['Chick (0-4w)'] += batch.current_count;
      else if (category === 'Grower') ageGroups['Grower (5-8w)'] += batch.current_count;
      else if (category === 'Finisher') ageGroups['Finisher (9-12w)'] += batch.current_count;
      else ageGroups['Mature (13w+)'] += batch.current_count;
    });

    const ageDistribution = Object.entries(ageGroups).map(([age, count]) => ({ age, count }));

    return {
      growthRate,
      feedConversionRatio,
      productionEfficiency,
      breedPerformance,
      ageDistribution
    };
  }, [processedChickens, summaryStats]);

  // Calculate health tracking data
  const healthData = useMemo(() => {
    if (!processedChickens.length) {
      return {
        healthStatus: [],
        riskBatches: [],
        vaccinationDue: [],
        healthAlerts: []
      };
    }

    // Health status distribution
    const statusCounts = { healthy: 0, sick: 0, quarantine: 0, processing: 0 };
    processedChickens.forEach(batch => {
      statusCounts[batch.status] = (statusCounts[batch.status] || 0) + batch.current_count;
    });

    const healthStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    // Risk batches (high mortality or sick)
    const riskBatches = processedChickens.filter(batch => 
      parseFloat(batch.mortalityRate) > 10 || batch.status === 'sick' || batch.status === 'quarantine'
    );

    // Vaccination schedule (simulated based on age)
    const vaccinationDue = processedChickens.filter(batch => {
      const age = batch.age;
      return (age === 1 || age === 3 || age === 6 || age === 12) && batch.status === 'healthy';
    }).map(batch => ({
      ...batch,
      vaccinationType: batch.age === 1 ? 'Newcastle Disease' : 
                      batch.age === 3 ? 'Infectious Bronchitis' :
                      batch.age === 6 ? 'Gumboro Disease' : 'Booster Shots'
    }));

    // Health alerts
    const healthAlerts = [];
    riskBatches.forEach(batch => {
      if (parseFloat(batch.mortalityRate) > 15) {
        healthAlerts.push({
          type: 'critical',
          message: `Critical mortality rate in batch ${batch.batchId} (${batch.mortalityRate}%)`,
          batchId: batch.batchId
        });
      } else if (batch.status === 'sick') {
        healthAlerts.push({
          type: 'warning',
          message: `Batch ${batch.batchId} marked as sick - requires attention`,
          batchId: batch.batchId
        });
      }
    });

    return {
      healthStatus,
      riskBatches,
      vaccinationDue,
      healthAlerts
    };
  }, [processedChickens]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newChicken = {
      id: Date.now().toString(),
      ...formData,
      initialCount: parseInt(formData.initialCount),
      currentCount: parseInt(formData.currentCount),
      expectedWeight: parseFloat(formData.expectedWeight),
      currentWeight: parseFloat(formData.currentWeight),
      mortality: parseInt(formData.mortality),
      createdAt: new Date().toISOString()
    };
    
    addLiveChicken(newChicken);
    setShowModal(false);
    setFormData({
      batchId: '',
      breed: '',
      initialCount: '',
      currentCount: '',
      hatchDate: '',
      expectedWeight: '',
      currentWeight: '',
      feedType: '',
      status: 'healthy',
      mortality: '0',
      notes: ''
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      deleteLiveChicken(id);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      healthy: 'status-badge healthy',
      sick: 'status-badge sick',
      quarantine: 'status-badge quarantine',
      processing: 'status-badge processing'
    };
    return statusClasses[status] || 'status-badge';
  };

  const getAgeCategory = (age) => {
    if (age <= 4) return 'Chick';
    if (age <= 8) return 'Grower';
    if (age <= 12) return 'Finisher';
    return 'Mature';
  };

  return (
    <div className="live-chicken-container">
      <div className="page-header">
        <h1>Live Chicken Stock Management</h1>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowModal(true)}
          >
            Add New Batch
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'batches' ? 'active' : ''}`}
          onClick={() => setActiveTab('batches')}
        >
          Chicken Batches
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          Health Tracking
        </button>
      </div>

      {activeTab === 'batches' && (
        <>
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Batches</h3>
              <p className="summary-value">{summaryStats.totalBatches}</p>
            </div>
            <div className="summary-card">
              <h3>Live Chickens</h3>
              <p className="summary-value">{formatNumber(summaryStats.totalChickens)}</p>
            </div>
            <div className="summary-card">
              <h3>Average Age</h3>
              <p className="summary-value">{summaryStats.averageAge} weeks</p>
            </div>
            <div className="summary-card alert">
              <h3>Total Mortality</h3>
              <p className="summary-value">{summaryStats.totalMortality}</p>
            </div>
            <div className="summary-card">
              <h3>Healthy Batches</h3>
              <p className="summary-value">{summaryStats.healthyBatches}/{summaryStats.totalBatches}</p>
            </div>
            <div className="summary-card">
              <h3>Avg Mortality Rate</h3>
              <p className="summary-value">{summaryStats.averageMortalityRate}%</p>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-container">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Search</label>
                <input
                  type="text"
                  name="searchTerm"
                  value={filters.searchTerm}
                  onChange={handleFilterChange}
                  placeholder="Search by batch ID or breed..."
                />
              </div>
              <div className="filter-group">
                <label>Breed</label>
                <select
                  name="breed"
                  value={filters.breed}
                  onChange={handleFilterChange}
                >
                  <option value="">All Breeds</option>
                  <option value="Arbor Acres">Arbor Acres</option>
                  <option value="Ross 308">Ross 308</option>
                  <option value="Cobb 500">Cobb 500</option>
                  <option value="ISA Brown">ISA Brown</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Statuses</option>
                  <option value="healthy">Healthy</option>
                  <option value="sick">Sick</option>
                  <option value="quarantine">Quarantine</option>
                  <option value="processing">Ready for Processing</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Age Range</label>
                <select
                  name="ageRange"
                  value={filters.ageRange}
                  onChange={handleFilterChange}
                >
                  <option value="">All Ages</option>
                  <option value="0-4">0-4 weeks (Chicks)</option>
                  <option value="5-8">5-8 weeks (Growers)</option>
                  <option value="9-12">9-12 weeks (Finishers)</option>
                  <option value="13+">13+ weeks (Mature)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chicken Batches Table */}
          <div className="table-container">
            <table className="chicken-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Breed</th>
                  <th>Age</th>
                  <th>Count</th>
                  <th>Weight (kg)</th>
                  <th>Mortality</th>
                  <th>Status</th>
                  <th>Feed Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedChickens.length > 0 ? (
                  processedChickens.map((chicken) => (
                    <tr key={chicken.id} className={chicken.status === 'sick' ? 'sick-batch' : ''}>
                      <td>{chicken.batch_id}</td>
                      <td>{chicken.breed}</td>
                      <td>
                        {chicken.age} weeks
                        <br />
                        <small className="age-category">({getAgeCategory(chicken.age)})</small>
                      </td>
                      <td>
                        {chicken.current_count}/{chicken.initial_count}
                        <br />
                        <small>({chicken.mortalityRate}% loss)</small>
                      </td>
                      <td>
                        {chicken.current_weight}
                        <br />
                        <small>Target: {chicken.expected_weight}</small>
                      </td>
                      <td className={chicken.mortalityRate > 10 ? 'high-mortality' : ''}>
                        {chicken.initial_count - chicken.current_count}
                      </td>
                      <td>
                        <span className={getStatusBadge(chicken.status)}>
                          {chicken.status}
                        </span>
                      </td>
                      <td>{chicken.feed_type}</td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(chicken.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="no-data">
                      No chicken batches found. Add your first batch to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="analytics-section">
          <h2>Analytics Dashboard</h2>
          
          {/* Performance Metrics */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Growth Rate</h3>
              <p className="summary-value">{analyticsData.growthRate} kg/week</p>
            </div>
            <div className="summary-card">
              <h3>Feed Conversion Ratio</h3>
              <p className="summary-value">{analyticsData.feedConversionRatio}:1</p>
            </div>
            <div className="summary-card">
              <h3>Production Efficiency</h3>
              <p className="summary-value">{analyticsData.productionEfficiency} kg</p>
            </div>
            <div className="summary-card">
              <h3>Total Production</h3>
              <p className="summary-value">{formatNumber(summaryStats.totalChickens)} birds</p>
            </div>
          </div>

          {/* Breed Performance Analysis */}
          <div className="analytics-table-container">
            <h3>Breed Performance Analysis</h3>
            <div className="table-container">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Breed</th>
                    <th>Batches</th>
                    <th>Total Birds</th>
                    <th>Avg Weight (kg)</th>
                    <th>Avg Mortality (%)</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.breedPerformance.length > 0 ? (
                    analyticsData.breedPerformance.map((breed, index) => (
                      <tr key={index}>
                        <td>{breed.breed}</td>
                        <td>{breed.batches}</td>
                        <td>{formatNumber(breed.totalCount)}</td>
                        <td>{breed.avgWeight}</td>
                        <td className={parseFloat(breed.avgMortality) > 10 ? 'high-mortality' : ''}>
                          {breed.avgMortality}%
                        </td>
                        <td>
                          <span className={`performance-badge ${
                            parseFloat(breed.avgMortality) < 5 ? 'excellent' :
                            parseFloat(breed.avgMortality) < 10 ? 'good' : 'poor'
                          }`}>
                            {parseFloat(breed.avgMortality) < 5 ? 'Excellent' :
                             parseFloat(breed.avgMortality) < 10 ? 'Good' : 'Needs Attention'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">
                        No breed data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Age Distribution */}
          <div className="analytics-table-container">
            <h3>Age Distribution</h3>
            <div className="table-container">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Age Group</th>
                    <th>Count</th>
                    <th>Percentage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.ageDistribution.map((group, index) => {
                    const percentage = summaryStats.totalChickens > 0 ? 
                      ((group.count / summaryStats.totalChickens) * 100).toFixed(1) : 0;
                    return (
                      <tr key={index}>
                        <td>{group.age}</td>
                        <td>{formatNumber(group.count)}</td>
                        <td>{percentage}%</td>
                        <td>
                          <span className="age-status">
                            {group.age.includes('Chick') ? '🐣 Growing' :
                             group.age.includes('Grower') ? '🐤 Developing' :
                             group.age.includes('Finisher') ? '🐔 Maturing' : '🐓 Ready'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="health-section">
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
          <div className="summary-cards">
            <div className="summary-card healthy">
              <h3>Healthy Birds</h3>
              <p className="summary-value">
                {healthData.healthStatus.find(s => s.status === 'healthy')?.count || 0}
              </p>
            </div>
            <div className="summary-card alert">
              <h3>Sick Birds</h3>
              <p className="summary-value">
                {healthData.healthStatus.find(s => s.status === 'sick')?.count || 0}
              </p>
            </div>
            <div className="summary-card warning">
              <h3>In Quarantine</h3>
              <p className="summary-value">
                {healthData.healthStatus.find(s => s.status === 'quarantine')?.count || 0}
              </p>
            </div>
            <div className="summary-card">
              <h3>Risk Batches</h3>
              <p className="summary-value">{healthData.riskBatches.length}</p>
            </div>
          </div>

          {/* Vaccination Schedule */}
          <div className="health-table-container">
            <h3>📅 Vaccination Schedule</h3>
            <div className="table-container">
              <table className="health-table">
                <thead>
                  <tr>
                    <th>Batch ID</th>
                    <th>Breed</th>
                    <th>Age (weeks)</th>
                    <th>Vaccination Type</th>
                    <th>Priority</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {healthData.vaccinationDue.length > 0 ? (
                    healthData.vaccinationDue.map((batch, index) => (
                      <tr key={index}>
                        <td>{batch.batchId}</td>
                        <td>{batch.breed}</td>
                        <td>{batch.age}</td>
                        <td>{batch.vaccinationType}</td>
                        <td>
                          <span className={`priority-badge ${
                            batch.age <= 3 ? 'high' : batch.age <= 6 ? 'medium' : 'low'
                          }`}>
                            {batch.age <= 3 ? 'High' : batch.age <= 6 ? 'Medium' : 'Low'}
                          </span>
                        </td>
                        <td>
                          <button className="btn-action">Schedule</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">
                        No vaccinations due at this time
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Batches */}
          <div className="health-table-container">
            <h3>⚠️ Risk Batches Monitoring</h3>
            <div className="table-container">
              <table className="health-table">
                <thead>
                  <tr>
                    <th>Batch ID</th>
                    <th>Breed</th>
                    <th>Status</th>
                    <th>Mortality Rate</th>
                    <th>Current Count</th>
                    <th>Risk Level</th>
                    <th>Action Required</th>
                  </tr>
                </thead>
                <tbody>
                  {healthData.riskBatches.length > 0 ? (
                    healthData.riskBatches.map((batch, index) => (
                      <tr key={index} className="risk-row">
                        <td>{batch.batch_id}</td>
                        <td>{batch.breed}</td>
                        <td>
                          <span className={getStatusBadge(batch.status)}>
                            {batch.status}
                          </span>
                        </td>
                        <td className={parseFloat(batch.mortalityRate) > 15 ? 'critical-mortality' : 'high-mortality'}>
                          {batch.mortalityRate}%
                        </td>
                        <td>{batch.current_count}</td>
                        <td>
                          <span className={`risk-badge ${
                            parseFloat(batch.mortalityRate) > 15 ? 'critical' :
                            batch.status === 'sick' ? 'high' : 'medium'
                          }`}>
                            {parseFloat(batch.mortalityRate) > 15 ? 'Critical' :
                             batch.status === 'sick' ? 'High' : 'Medium'}
                          </span>
                        </td>
                        <td>
                          <button className="btn-urgent">
                            {parseFloat(batch.mortalityRate) > 15 ? 'Immediate Action' :
                             batch.status === 'sick' ? 'Treat' : 'Monitor'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-data">
                        🎉 No risk batches - All chickens are healthy!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Health Status Distribution */}
          <div className="health-table-container">
            <h3>📊 Health Status Distribution</h3>
            <div className="table-container">
              <table className="health-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                    <th>Percentage</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {healthData.healthStatus.map((status, index) => {
                    const percentage = summaryStats.totalChickens > 0 ? 
                      ((status.count / summaryStats.totalChickens) * 100).toFixed(1) : 0;
                    return (
                      <tr key={index}>
                        <td>
                          <span className={getStatusBadge(status.status)}>
                            {status.status}
                          </span>
                        </td>
                        <td>{formatNumber(status.count)}</td>
                        <td>{percentage}%</td>
                        <td>
                          <span className="trend-indicator">
                            {status.status === 'healthy' ? '📈 Stable' :
                             status.status === 'sick' ? '📉 Monitor' :
                             status.status === 'quarantine' ? '⏸️ Isolated' : '✅ Ready'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Chicken Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Chicken Batch</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Batch ID *</label>
                  <input
                    type="text"
                    name="batch_id"
                    value={formData.batch_id}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., BCH-2024-001"
                  />
                </div>
                <div className="form-group">
                  <label>Breed *</label>
                  <select
                    name="breed"
                    value={formData.breed}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Breed</option>
                    <option value="Arbor Acres">Arbor Acres</option>
                    <option value="Ross 308">Ross 308</option>
                    <option value="Cobb 500">Cobb 500</option>
                    <option value="ISA Brown">ISA Brown</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Initial Count *</label>
                  <input
                    type="number"
                    name="initial_count"
                    value={formData.initial_count}
                    onChange={handleInputChange}
                    required
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Current Count *</label>
                  <input
                    type="number"
                    name="current_count"
                    value={formData.current_count}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Hatch Date *</label>
                  <input
                    type="date"
                    name="hatch_date"
                    value={formData.hatch_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="healthy">Healthy</option>
                    <option value="sick">Sick</option>
                    <option value="quarantine">Quarantine</option>
                    <option value="processing">Ready for Processing</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Expected Weight (kg)</label>
                  <input
                    type="number"
                    name="expected_weight"
                    value={formData.expected_weight}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Current Weight (kg)</label>
                  <input
                    type="number"
                    name="current_weight"
                    value={formData.current_weight}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Feed Type</label>
                <select
                  name="feed_type"
              value={formData.feed_type}
                  onChange={handleInputChange}
                >
                  <option value="">Select Feed Type</option>
                  <option value="Starter">Starter Feed</option>
                  <option value="Grower">Grower Feed</option>
                  <option value="Finisher">Finisher Feed</option>
                  <option value="Layer">Layer Feed</option>
                  <option value="Broiler">Broiler Feed</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes..."
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveChickenStock;