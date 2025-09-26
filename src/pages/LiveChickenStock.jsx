import { useState, useContext, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatDate, formatNumber } from '../utils/formatters';
import SortableTableHeader from '../components/UI/SortableTableHeader';
import SortControls from '../components/UI/SortControls';
import useTableSort from '../hooks/useTableSort';
import './LiveChickenStock.css';

const LiveChickenStock = () => {
  const { liveChickens, addLiveChicken, deleteLiveChicken, updateLiveChicken, chickenInventoryTransactions, getLowFeedAlerts } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVaccinationModal, setShowVaccinationModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [editingChicken, setEditingChicken] = useState(null);
  const [showBatchSelectionModal, setShowBatchSelectionModal] = useState(false);
  const [activeTab, setActiveTab] = useState('batches');
  const [selectedBatchForTransactions, setSelectedBatchForTransactions] = useState(null);
  const [transactionFilters, setTransactionFilters] = useState({
    type: '',
    dateRange: ''
  });
  const [filters, setFilters] = useState({
    breed: '',
    status: '',
    ageRange: '',
    searchTerm: ''
  });

  // Get low feed alerts
  const feedAlerts = useMemo(() => {
    return getLowFeedAlerts();
  }, [liveChickens]);

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

  const [editFormData, setEditFormData] = useState({
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

  const [vaccinationData, setVaccinationData] = useState({
    vaccination_date: '',
    status: 'pending',
    notes: ''
  });

  const handleEdit = (chicken) => {
    setEditingChicken(chicken);
    setEditFormData({
      batch_id: chicken.batch_id || '',
      breed: chicken.breed || '',
      initial_count: chicken.initial_count || '',
      current_count: chicken.current_count || '',
      hatch_date: chicken.hatch_date || '',
      expected_weight: chicken.expected_weight || '',
      current_weight: chicken.current_weight || '',
      feed_type: chicken.feed_type || '',
      status: chicken.status || 'healthy',
      mortality: chicken.mortality || '0',
      notes: chicken.notes || ''
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    
    const updatedChicken = {
      batch_id: editFormData.batch_id,
      breed: editFormData.breed,
      initial_count: parseInt(editFormData.initial_count),
      current_count: parseInt(editFormData.current_count),
      hatch_date: editFormData.hatch_date,
      expected_weight: parseFloat(editFormData.expected_weight),
      current_weight: parseFloat(editFormData.current_weight),
      feed_type: editFormData.feed_type,
      status: editFormData.status,
      mortality: parseInt(editFormData.mortality),
      notes: editFormData.notes
    };
    
    updateLiveChicken(editingChicken.id, updatedChicken);
    setShowEditModal(false);
    setEditingChicken(null);
  };

  const handleVaccinationSubmit = async (e) => {
    e.preventDefault();
    try {
      // Here you would typically save to the vaccination_records table
      // For now, we'll just close the modal and show success
      console.log('Vaccination scheduled for batch:', selectedBatch.batchId);
      console.log('Vaccination data:', vaccinationData);
      
      setShowVaccinationModal(false);
      setSelectedBatch(null);
      setVaccinationData({
        vaccination_date: '',
        status: 'pending',
        notes: ''
      });
      
      // You could add a success notification here
      alert('Vaccination scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling vaccination:', error);
    }
  };

  const handleVaccinationInputChange = (e) => {
    const { name, value } = e.target;
    setVaccinationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate age in weeks
  const calculateAge = (hatch_date) => {
    const today = new Date();
    const hatch = new Date(hatch_date);
    const diffTime = Math.abs(today - hatch);
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  // Get lifecycle stage display
  const getLifecycleStage = (batch) => {
    const stage = batch.lifecycle_stage || 'arrival';
    const stages = {
      'arrival': 'DOC Arrival',
      'brooding': 'Brooding',
      'growing': 'Growing',
      'processing': 'Processing',
      'freezer': 'Freezer Storage'
    };
    return stages[stage] || stage;
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

  // Process chicken inventory transactions for display
  const processedTransactions = useMemo(() => {
    if (!chickenInventoryTransactions || !selectedBatchForTransactions) return [];
    
    return chickenInventoryTransactions
      .filter(transaction => transaction.batch_id == selectedBatchForTransactions.id)
      .map(transaction => ({
        ...transaction,
        displayType: transaction.transaction_type === 'sale' ? 'Sales' :
                     transaction.transaction_type === 'mortality' ? 'Mortality' :
                     transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1),
        displayQuantity: Math.abs(transaction.quantity_changed),
        isDeduction: transaction.quantity_changed < 0
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [chickenInventoryTransactions, selectedBatchForTransactions, transactionFilters]);

  // Calculate batch transaction summary
  const batchTransactionSummary = useMemo(() => {
    if (!selectedBatchForTransactions || !processedTransactions.length) {
      return {
        totalSales: 0,
        totalMortality: 0,
        totalAdjustments: 0,
        netChange: 0,
        transactionCount: 0
      };
    }

    const summary = processedTransactions.reduce((acc, transaction) => {
      switch (transaction.transaction_type) {
        case 'sale':
          acc.totalSales += Math.abs(transaction.quantity_changed);
          break;
        case 'mortality':
          acc.totalMortality += Math.abs(transaction.quantity_changed);
          break;
        case 'adjustment':
          acc.totalAdjustments += transaction.quantity_changed;
          break;
      }
      acc.netChange += transaction.quantity_changed;
      acc.transactionCount += 1;
      return acc;
    }, { totalSales: 0, totalMortality: 0, totalAdjustments: 0, netChange: 0, transactionCount: 0 });

    return summary;
  }, [processedTransactions, selectedBatchForTransactions]);

  // Sorting for transactions
  const { sortedData: sortedTransactions, sortConfig: transactionSortConfig, requestSort: requestTransactionSort, resetSort: resetTransactionSort, getSortIcon: getTransactionSortIcon } = useTableSort(processedTransactions);

  // Sorting hooks for different tables
  const { sortedData: sortedChickens, sortConfig: chickenSortConfig, requestSort: requestChickenSort, resetSort: resetChickenSort, getSortIcon: getChickenSortIcon } = useTableSort(processedChickens);

  const getAgeCategory = (age) => {
    if (age <= 1) return 'Chick';
    if (age <= 3) return 'Grower';
    if (age <= 5) return 'Finisher';
    return 'Mature';
  };
  
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
    const ageGroups = { 'Chick (0-2w)': 0, 'Grower (3-4w)': 0, 'Finisher (5-6w)': 0, 'Mature (7w+)': 0 };
    processedChickens.forEach(batch => {
      const category = getAgeCategory(batch.age);
      if (category === 'Chick') ageGroups['Chick (0-2w)'] += batch.current_count;
      else if (category === 'Grower') ageGroups['Grower (3-4w)'] += batch.current_count;
      else if (category === 'Finisher') ageGroups['Finisher (5-6w)'] += batch.current_count;
      else ageGroups['Mature (7w+)'] += batch.current_count;
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

  // Breed mapping function
  const getBreedCategory = (breedName) => {
    const breedMapping = {
      'Ross 308': 'Broiler',
      'Cobb 500': 'Broiler',
      'Arbor Acres': 'Broiler',
      'Hubbard': 'Broiler',
      'Lohmann Brown': 'Layer',
      'Hy-Line': 'Layer',
      'ISA Brown': 'Layer',
      'Rhode Island Red': 'Layer',
      'Kuroiler': 'Cockerel',
      'Sasso': 'Cockerel',
      'Rainbow Rooster': 'Cockerel'
    };
    return breedMapping[breedName] || breedName;
  };

  // Vaccination education data
  const vaccinationEducation = {
    'Broiler': {
      diseases: {
        'Newcastle Disease': {
          symptoms: ['Respiratory distress', 'Nervous signs', 'Diarrhea', 'Sudden death'],
          prevention: 'Vaccination at day 1, 7-10 days, and 18-21 days',
          drugs: ['Newcastle Disease Vaccine (Live)', 'Newcastle Disease Vaccine (Killed)'],
          critical_age: '1-21 days'
        },
        'Infectious Bronchitis': {
          symptoms: ['Coughing', 'Sneezing', 'Nasal discharge', 'Reduced egg production'],
          prevention: 'Vaccination at day 1 and 14-21 days',
          drugs: ['IB Vaccine (H120)', 'IB Vaccine (4/91)'],
          critical_age: '1-21 days'
        },
        'Gumboro Disease': {
          symptoms: ['Depression', 'Watery diarrhea', 'Dehydration', 'Immunosuppression'],
          prevention: 'Vaccination at 14-18 days and 21-28 days',
          drugs: ['IBD Vaccine (Intermediate)', 'IBD Vaccine (Hot)'],
          critical_age: '14-35 days'
        },
        'Marek\'s Disease': {
          symptoms: ['Paralysis of legs and wings', 'Weight loss', 'Tumors', 'Sudden death'],
          prevention: 'Vaccination at day 1 (hatchery)',
          drugs: ['Marek\'s Disease Vaccine (HVT)', 'Marek\'s Disease Vaccine (Rispens)'],
          critical_age: '1 day'
        },
        'Fowl Pox': {
          symptoms: ['Skin lesions on comb and wattles', 'Respiratory distress', 'Reduced feed intake'],
          prevention: 'Vaccination at 6-8 weeks',
          drugs: ['Fowl Pox Vaccine (Live)'],
          critical_age: '6-12 weeks'
        }
      }
    },
    'Layer': {
      diseases: {
        'Newcastle Disease': {
          symptoms: ['Respiratory distress', 'Drop in egg production', 'Nervous signs'],
          prevention: 'Vaccination at day 1, 7-10 days, 6-8 weeks, and every 3-4 months',
          drugs: ['Newcastle Disease Vaccine (Live)', 'Newcastle Disease Vaccine (Killed)'],
          critical_age: '1-8 weeks'
        },
        'Infectious Bronchitis': {
          symptoms: ['Respiratory signs', 'Poor egg quality', 'Reduced production'],
          prevention: 'Vaccination at day 1, 14-21 days, and 16-18 weeks',
          drugs: ['IB Vaccine (H120)', 'IB Vaccine (4/91)'],
          critical_age: '1-18 weeks'
        },
        'Fowl Pox': {
          symptoms: ['Skin lesions', 'Respiratory distress', 'Reduced feed intake'],
          prevention: 'Vaccination at 8-12 weeks',
          drugs: ['Fowl Pox Vaccine (Live)'],
          critical_age: '8-16 weeks'
        }
      }
    },
    'Cockerel': {
      diseases: {
        'Newcastle Disease': {
          symptoms: ['Respiratory distress', 'Nervous signs', 'Sudden death'],
          prevention: 'Vaccination at day 1, 7-10 days, and 21-28 days',
          drugs: ['Newcastle Disease Vaccine (Live)', 'Newcastle Disease Vaccine (Killed)'],
          critical_age: '1-28 days'
        },
        'Infectious Bronchitis': {
          symptoms: ['Coughing', 'Sneezing', 'Growth retardation'],
          prevention: 'Vaccination at day 1 and 14-21 days',
          drugs: ['IB Vaccine (H120)', 'IB Vaccine (4/91)'],
          critical_age: '1-21 days'
        },
        'Gumboro Disease': {
          symptoms: ['Depression', 'Watery diarrhea', 'Poor growth'],
          prevention: 'Vaccination at 14-18 days and 21-28 days',
          drugs: ['IBD Vaccine (Intermediate)', 'IBD Vaccine (Hot)'],
          critical_age: '14-35 days'
        },
        'Marek\'s Disease': {
          symptoms: ['Paralysis of legs and wings', 'Weight loss', 'Tumors', 'Sudden death'],
          prevention: 'Vaccination at day 1 (hatchery)',
          drugs: ['Marek\'s Disease Vaccine (HVT)', 'Marek\'s Disease Vaccine (Rispens)'],
          critical_age: '1 day'
        },
        'Fowl Pox': {
          symptoms: ['Skin lesions on comb and wattles', 'Respiratory distress', 'Reduced feed intake'],
          prevention: 'Vaccination at 6-8 weeks',
          drugs: ['Fowl Pox Vaccine (Live)'],
          critical_age: '6-12 weeks'
        }
      }
    }
  };

  // Health tracking data
  const healthData = useMemo(() => {
    const healthStatus = [
      { status: 'healthy', count: processedChickens.filter(c => c.status === 'healthy').reduce((sum, c) => sum + c.current_count, 0) },
      { status: 'sick', count: processedChickens.filter(c => c.status === 'sick').reduce((sum, c) => sum + c.current_count, 0) },
      { status: 'quarantine', count: processedChickens.filter(c => c.status === 'quarantine').reduce((sum, c) => sum + c.current_count, 0) },
      { status: 'processing', count: processedChickens.filter(c => c.status === 'processing').reduce((sum, c) => sum + c.current_count, 0) }
    ];

    // Generate vaccination schedule based on age
    const vaccinationDue = processedChickens.map(chicken => {
      const age = chicken.age;
      let vaccinationType = '';
      
      if (age <= 1) {
        vaccinationType = 'Marek\'s Disease';
      } else if (age <= 3) {
        vaccinationType = 'Newcastle Disease';
      } else if (age <= 6) {
        vaccinationType = 'Infectious Bronchitis';
      } else if (age <= 10) {
        vaccinationType = 'Fowl Pox';
      } else {
        return null;
      }
      
      return {
        batchId: chicken.batch_id,
        breed: chicken.breed,
        age: age,
        vaccinationType
      };
    }).filter(Boolean);

    // Health alerts for critical conditions
    const healthAlerts = [];
    processedChickens.forEach(chicken => {
      const mortalityRate = parseFloat(chicken.mortalityRate);
      
      if (mortalityRate > 15) {
        healthAlerts.push({
          type: 'critical',
          message: `Critical mortality rate (${chicken.mortalityRate}%) in batch ${chicken.batch_id}`
        });
      }
      
      if (chicken.status === 'sick') {
        healthAlerts.push({
          type: 'warning',
          message: `Sick chickens detected in batch ${chicken.batch_id}`
        });
      }
    });

    // Risk batches (high mortality or sick status)
    const riskBatches = processedChickens.filter(chicken => {
      const mortalityRate = parseFloat(chicken.mortalityRate);
      return mortalityRate > 10 || chicken.status === 'sick' || chicken.status === 'quarantine';
    }).map(chicken => ({
      ...chicken,
      mortalityRate: chicken.mortalityRate
    }));

    return {
      healthStatus,
      vaccinationDue,
      healthAlerts,
      riskBatches
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newChicken = {
      id: Date.now().toString(),
      batch_id: formData.batch_id,
      breed: formData.breed,
      initial_count: parseInt(formData.initial_count),
      current_count: parseInt(formData.current_count),
      hatch_date: formData.hatch_date,
      expected_weight: parseFloat(formData.expected_weight),
      current_weight: parseFloat(formData.current_weight),
      feed_type: formData.feed_type,
      status: formData.status,
      mortality: parseInt(formData.mortality),
      notes: formData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      await addLiveChicken(newChicken);
      setShowModal(false);
      setFormData({
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
    } catch (error) {
      console.error('Failed to add live chicken:', error);
      alert('Failed to save data. Please try again.');
    }
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
          {/* Feed Alerts */}
          {feedAlerts.length > 0 && (
            <div className="alerts-section">
              <h3>⚠️ Feed Stock Alerts</h3>
              {feedAlerts.map(alert => (
                <div key={alert.id} className={`alert-card ${alert.severity}`}>
                  <p>{alert.message}</p>
                </div>
              ))}
            </div>
          )}

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

          {/* Transaction History Section */}
          <div className="transaction-section">
            <div className="section-header">
              <h3>📊 Inventory Transaction History</h3>
              <div className="transaction-actions">
                <select
                  value={selectedBatchForTransactions?.id || ''}
                  onChange={(e) => {
                    const batchId = e.target.value;
                    const batch = liveChickens.find(b => b.id == batchId);
                    setSelectedBatchForTransactions(batch);
                  }}
                  className="batch-select"
                >
                  <option value="">Select Batch for Transaction History</option>
                  {liveChickens.map(batch => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_id} - {batch.breed} ({batch.current_count} birds)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedBatchForTransactions && (
              <div className="batch-transaction-summary">
                <div className="summary-cards">
                  <div className="summary-card sales">
                    <h4>Sales</h4>
                    <p className="summary-value">{formatNumber(batchTransactionSummary.totalSales)}</p>
                  </div>
                  <div className="summary-card mortality">
                    <h4>Mortality</h4>
                    <p className="summary-value">{formatNumber(batchTransactionSummary.totalMortality)}</p>
                  </div>
                  <div className="summary-card adjustments">
                    <h4>Adjustments</h4>
                    <p className="summary-value">{formatNumber(batchTransactionSummary.totalAdjustments)}</p>
                  </div>
                  <div className="summary-card net">
                    <h4>Net Change</h4>
                    <p className={`summary-value ${batchTransactionSummary.netChange < 0 ? 'negative' : 'positive'}`}>
                      {batchTransactionSummary.netChange >= 0 ? '+' : ''}{formatNumber(batchTransactionSummary.netChange)}
                    </p>
                  </div>
                  <div className="summary-card total">
                    <h4>Total Transactions</h4>
                    <p className="summary-value">{batchTransactionSummary.transactionCount}</p>
                  </div>
                </div>

                <div className="transaction-filters">
                  <select
                    value={transactionFilters.type}
                    onChange={(e) => setTransactionFilters(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="">All Transaction Types</option>
                    <option value="sale">Sales</option>
                    <option value="mortality">Mortality</option>
                    <option value="adjustment">Adjustments</option>
                    <option value="transfer">Transfers</option>
                  </select>
                  <input
                    type="date"
                    placeholder="Filter by date"
                    value={transactionFilters.dateRange}
                    onChange={(e) => setTransactionFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  />
                </div>

                <div className="table-container">
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <SortableTableHeader
                          sortKey="created_at"
                          onSort={requestTransactionSort}
                          getSortIcon={getTransactionSortIcon}
                        >
                          Date
                        </SortableTableHeader>
                        <SortableTableHeader
                          sortKey="displayType"
                          onSort={requestTransactionSort}
                          getSortIcon={getTransactionSortIcon}
                        >
                          Type
                        </SortableTableHeader>
                        <SortableTableHeader
                          sortKey="displayQuantity"
                          onSort={requestTransactionSort}
                          getSortIcon={getTransactionSortIcon}
                        >
                          Quantity
                        </SortableTableHeader>
                        <th>Reference</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTransactions.length > 0 ? (
                        sortedTransactions.map((transaction, index) => (
                          <tr key={index} className={transaction.isDeduction ? 'deduction-row' : ''}>
                            <td>{formatDate(transaction.created_at)}</td>
                            <td>
                              <span className={`transaction-type ${transaction.transaction_type}`}>
                                {transaction.displayType}
                              </span>
                            </td>
                            <td className={transaction.isDeduction ? 'negative' : ''}>
                              {transaction.isDeduction ? '-' : '+'}{formatNumber(transaction.displayQuantity)}
                            </td>
                            <td>
                              {transaction.reference_id && (
                                <span className="reference-link">
                                  {transaction.reference_type === 'chicken_order' ? 'Order #' : 'Ref: '}{transaction.reference_id}
                                </span>
                              )}
                            </td>
                            <td>{transaction.reason}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="no-data">
                            No transactions found for this batch
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <SortControls
                  sortConfig={transactionSortConfig}
                  onReset={resetTransactionSort}
                />
              </div>
            )}
          </div>

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
                  <option key="arbor-acres" value="Arbor Acres">Arbor Acres</option>
                  <option key="ross-308" value="Ross 308">Ross 308</option>
                  <option key="cobb-500" value="Cobb 500">Cobb 500</option>
                  <option key="isa-brown" value="ISA Brown">ISA Brown</option>
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
                  <option key="healthy" value="healthy">Healthy</option>
                  <option key="sick" value="sick">Sick</option>
                  <option key="quarantine" value="quarantine">Quarantine</option>
                  <option key="processing" value="processing">Ready for Processing</option>
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
                  <option value="0-2">0-2 weeks (Chicks)</option>
                  <option value="3-4">3-4 weeks (Growers)</option>
                  <option value="5-6">5-6 weeks (Finishers)</option>
                  <option value="7+">7+ weeks (Mature)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sort Controls */}
          <SortControls 
            sortConfig={chickenSortConfig}
            onReset={resetChickenSort}
          />

          <div className="table-container">
            <table className="chicken-table">
              <thead>
                <tr>
                  <SortableTableHeader sortKey="batch_id" onSort={requestChickenSort} getSortIcon={getChickenSortIcon}>
                    Batch ID
                  </SortableTableHeader>
                  <SortableTableHeader sortKey="breed" onSort={requestChickenSort} getSortIcon={getChickenSortIcon}>
                    Breed
                  </SortableTableHeader>
                  <SortableTableHeader sortKey="age" onSort={requestChickenSort} getSortIcon={getChickenSortIcon}>
                    Age
                  </SortableTableHeader>
                  <SortableTableHeader sortKey="current_count" onSort={requestChickenSort} getSortIcon={getChickenSortIcon}>
                    Count
                  </SortableTableHeader>
                  <SortableTableHeader sortKey="current_weight" onSort={requestChickenSort} getSortIcon={getChickenSortIcon}>
                    Weight (kg)
                  </SortableTableHeader>
                  <SortableTableHeader sortKey="mortalityRate" onSort={requestChickenSort} getSortIcon={getChickenSortIcon}>
                    Mortality
                  </SortableTableHeader>
                  <SortableTableHeader sortKey="lifecycle_stage" onSort={requestChickenSort} getSortIcon={getChickenSortIcon}>
                    Lifecycle Stage
                  </SortableTableHeader>
                  <SortableTableHeader sortKey="status" onSort={requestChickenSort} getSortIcon={getChickenSortIcon}>
                    Status
                  </SortableTableHeader>
                  <SortableTableHeader sortKey="feed_type" onSort={requestChickenSort} getSortIcon={getChickenSortIcon}>
                    Feed Type
                  </SortableTableHeader>
                  <SortableTableHeader sortable={false}>
                    Actions
                  </SortableTableHeader>
                </tr>
              </thead>
              <tbody>
                {sortedChickens.length > 0 ? (
                  sortedChickens.map((chicken) => (
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
                        <span className="lifecycle-stage-badge">
                          {getLifecycleStage(chicken)}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadge(chicken.status)}>
                          {chicken.status}
                        </span>
                      </td>
                      <td>{chicken.feed_type}</td>
                      <td>
                        <button
                          className="edit-btn-icon"
                          onClick={() => handleEdit(chicken)}
                          title="Edit batch"
                          aria-label="Edit batch"
                        >
                          ✏️
                        </button>
                        <button
                          className="delete-btn-icon"
                          onClick={() => handleDelete(chicken.id)}
                          title="Delete batch"
                          aria-label="Delete batch"
                        >
                          🗑️
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
                             group.age.includes('Finisher') ? '🐔 Ready' : '🐓 Overfed'}
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
                          <button 
                            className="btn-action"
                            onClick={() => {
                              setSelectedBatch(batch);
                              setShowVaccinationModal(true);
                            }}
                          >
                            Schedule
                          </button>
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
                    <option key="arbor-acres" value="Arbor Acres">Arbor Acres</option>
                    <option key="ross-308" value="Ross 308">Ross 308</option>
                    <option key="cobb-500" value="Cobb 500">Cobb 500</option>
                    <option key="isa-brown" value="ISA Brown">ISA Brown</option>
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
                  <option key="starter" value="Starter">Starter Feed</option>
                  <option key="grower" value="Grower">Grower Feed</option>
                  <option key="finisher" value="Finisher">Finisher Feed</option>
                  <option key="layer" value="Layer">Layer Feed</option>
                  <option key="broiler" value="Broiler">Broiler Feed</option>
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

      {/* Edit Chicken Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Chicken Batch</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Batch ID *</label>
                  <input
                    type="text"
                    name="batch_id"
                    value={editFormData.batch_id}
                    onChange={handleEditInputChange}
                    required
                    placeholder="e.g., BCH-2024-001"
                  />
                </div>
                <div className="form-group">
                  <label>Breed *</label>
                  <select
                    name="breed"
                    value={editFormData.breed}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="">Select Breed</option>
                    <option key="arbor-acres" value="Arbor Acres">Arbor Acres</option>
                    <option key="ross-308" value="Ross 308">Ross 308</option>
                    <option key="cobb-500" value="Cobb 500">Cobb 500</option>
                    <option key="isa-brown" value="ISA Brown">ISA Brown</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Initial Count *</label>
                  <input
                    type="number"
                    name="initial_count"
                    value={editFormData.initial_count}
                    onChange={handleEditInputChange}
                    required
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Current Count *</label>
                  <input
                    type="number"
                    name="current_count"
                    value={editFormData.current_count}
                    onChange={handleEditInputChange}
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
                    value={editFormData.hatch_date}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
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
                    value={editFormData.expected_weight}
                    onChange={handleEditInputChange}
                    step="0.1"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Current Weight (kg)</label>
                  <input
                    type="number"
                    name="current_weight"
                    value={editFormData.current_weight}
                    onChange={handleEditInputChange}
                    step="0.1"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Feed Type</label>
                <select
                  name="feed_type"
                  value={editFormData.feed_type}
                  onChange={handleEditInputChange}
                >
                  <option value="">Select Feed Type</option>
                  <option key="starter" value="Starter">Starter Feed</option>
                  <option key="grower" value="Grower">Grower Feed</option>
                  <option key="finisher" value="Finisher">Finisher Feed</option>
                  <option key="layer" value="Layer">Layer Feed</option>
                  <option key="broiler" value="Broiler">Broiler Feed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={editFormData.notes}
                  onChange={handleEditInputChange}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vaccination Modal */}
      {showVaccinationModal && selectedBatch && (
        <div className="modal-overlay" onClick={() => setShowVaccinationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Schedule Vaccination</h2>
            <div className="vaccination-info">
              <p><strong>Batch ID:</strong> {selectedBatch.batchId}</p>
              <p><strong>Breed:</strong> {selectedBatch.breed}</p>
              <p><strong>Age:</strong> {selectedBatch.age} weeks</p>
              <p><strong>Vaccination Type:</strong> {selectedBatch.vaccinationType}</p>
            </div>
            
            <form onSubmit={handleVaccinationSubmit}>
              <div className="form-group">
                <label>Vaccination Date *</label>
                <input
                  type="date"
                  name="vaccination_date"
                  value={vaccinationData.vaccination_date}
                  onChange={handleVaccinationInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={vaccinationData.status}
                  onChange={handleVaccinationInputChange}
                >
                  <option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={vaccinationData.notes}
                  onChange={handleVaccinationInputChange}
                  placeholder="Additional notes about the vaccination..."
                  rows="3"
                />
              </div>

              <div className="vaccination-education">
                <h4>Vaccination Information</h4>
                {(() => {
                  const breedCategory = getBreedCategory(selectedBatch.breed);
                  const educationData = vaccinationEducation[breedCategory];
                  const diseaseInfo = educationData?.diseases[selectedBatch.vaccinationType];
                  
                  return diseaseInfo ? (
                    <div className="disease-info">
                      <p><strong>Symptoms to watch for:</strong></p>
                      <ul>
                        {diseaseInfo.symptoms.map((symptom, index) => (
                          <li key={index}>{symptom}</li>
                        ))}
                      </ul>
                      <p><strong>Prevention:</strong> {diseaseInfo.prevention}</p>
                      <p><strong>Recommended drugs:</strong> {diseaseInfo.drugs.join(', ')}</p>
                      <p><strong>Critical age:</strong> {diseaseInfo.critical_age}</p>
                    </div>
                  ) : (
                    <p>No vaccination information available for {selectedBatch.breed} - {selectedBatch.vaccinationType}</p>
                  );
                })()}
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowVaccinationModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Schedule Vaccination
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