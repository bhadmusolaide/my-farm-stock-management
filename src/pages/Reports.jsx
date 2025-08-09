import { useState, useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { formatNumber, formatDate } from '../utils/formatters'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import './Reports.css'

const Reports = () => {
  const { 
    chickens, 
    liveChickens, 
    feedInventory, 
    feedConsumption, 
    stock, 
    transactions, 
    balance,
    stats,
    generateReport, 
    exportToCSV 
  } = useAppContext()
  

  
  // State for date range
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // State for report data
  const [reportData, setReportData] = useState(null)
  
  // State for time period selection
  const [timePeriod, setTimePeriod] = useState('monthly')
  
  // State for active report tab
  const [activeTab, setActiveTab] = useState('overview')
  
  // State for advanced filters
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: 'last6months',
    breed: 'all',
    status: 'all',
    customer: 'all'
  })
  
  // Generate report
  const handleGenerateReport = () => {
    try {
      const report = generateReport(startDate, endDate)
      setReportData(report)
    } catch (error) {
      alert(error.message)
    }
  }
  
  // Export report to CSV
  const handleExportCSV = () => {
    if (!reportData || reportData.empty) {
      alert('No data to export')
      return
    }
    
    try {
      const dataToExport = reportData.orders.map(order => ({
        Date: order.date,
        Customer: order.customer,
        Phone: order.phone || '',
        Count: order.count,
        Size: order.size,
        Price: order.price,
        Total: order.count * order.size * order.price,
        'Amount Paid': order.amount_paid || 0,
        Balance: order.balance,
        Status: order.status
      }))
      
      exportToCSV(dataToExport, `report-${startDate}-to-${endDate}.csv`)
    } catch (error) {
      alert(`Export failed: ${error.message}`)
    }
  }
  
  // Memoized time-based data calculation for better performance
  const timeBasedData = useMemo(() => {
    const timeData = {}
    
    chickens.forEach(chicken => {
      const date = new Date(chicken.date)
      let timeKey
      
      if (timePeriod === 'weekly') {
        // Get week start (Monday)
        const weekStart = new Date(date)
        const day = weekStart.getDay()
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
        weekStart.setDate(diff)
        timeKey = `Week of ${formatDate(weekStart)}`
      } else if (timePeriod === 'monthly') {
        timeKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`
      } else if (timePeriod === 'quarterly') {
        const quarter = Math.floor(date.getMonth() / 3) + 1
        timeKey = `Q${quarter} ${date.getFullYear()}`
      }
      
      if (!timeData[timeKey]) {
        timeData[timeKey] = {
          name: timeKey,
          revenue: 0,
          count: 0,
          orders: 0
        }
      }
      
      timeData[timeKey].revenue += chicken.count * chicken.size * chicken.price
      timeData[timeKey].count += chicken.count
      timeData[timeKey].orders += 1
    })
    
    // Convert to array and sort by date
    const sortedData = Object.values(timeData).sort((a, b) => {
      if (timePeriod === 'weekly') {
        const dateA = new Date(a.name.replace('Week of ', ''))
        const dateB = new Date(b.name.replace('Week of ', ''))
        return dateA - dateB
      } else if (timePeriod === 'monthly') {
        const dateA = new Date(a.name)
        const dateB = new Date(b.name)
        return dateA - dateB
      } else if (timePeriod === 'quarterly') {
        const [qA, yearA] = a.name.split(' ')
        const [qB, yearB] = b.name.split(' ')
        if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB)
        return parseInt(qA.replace('Q', '')) - parseInt(qB.replace('Q', ''))
      }
      return 0
    })
    
    // Return appropriate number of periods
    const periodCount = timePeriod === 'weekly' ? 12 : timePeriod === 'monthly' ? 6 : 4
    return sortedData.slice(-periodCount)
  }, [chickens, timePeriod])
  
  // Memoized status distribution data for better performance
  const statusData = useMemo(() => {
    const statusCounts = {
      paid: 0,
      partial: 0,
      pending: 0
    }
    
    chickens.forEach(chicken => {
      statusCounts[chicken.status]++
    })
    
    return [
      { name: 'Paid', value: statusCounts.paid, color: '#4caf50' },
      { name: 'Partial', value: statusCounts.partial, color: '#ff9800' },
      { name: 'Pending', value: statusCounts.pending, color: '#f44336' }
    ].filter(item => item.value > 0)
  }, [chickens])

  // Advanced Analytics Calculations
  const advancedAnalytics = useMemo(() => {
    // Production Metrics
    const totalLiveChickens = liveChickens.reduce((sum, batch) => sum + (batch.current_count || 0), 0)
    const totalMortality = liveChickens.reduce((sum, batch) => 
      sum + ((batch.initial_count || 0) - (batch.current_count || 0)), 0)
    const averageMortalityRate = liveChickens.length > 0 
      ? (totalMortality / liveChickens.reduce((sum, batch) => sum + (batch.initial_count || 0), 0)) * 100 
      : 0
    
    // Feed Analytics
    const totalFeedCost = feedInventory.reduce((sum, feed) => 
      sum + ((feed.number_of_bags || 0) * (feed.cost_per_bag || 0)), 0)
    const totalFeedConsumed = feedConsumption.reduce((sum, consumption) => 
      sum + (consumption.quantity_consumed || 0), 0)
    
    // Financial Metrics
    const totalIncome = transactions
      .filter(t => t.type === 'fund')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = transactions
      .filter(t => t.type === 'expense' || t.type === 'stock_expense')
      .reduce((sum, t) => sum + t.amount, 0)
    const netProfit = stats.totalRevenue - totalExpenses
    const profitMargin = stats.totalRevenue > 0 ? (netProfit / stats.totalRevenue) * 100 : 0
    
    // Customer Analytics
    const customerData = chickens.reduce((acc, chicken) => {
      if (!acc[chicken.customer]) {
        acc[chicken.customer] = {
          orders: 0,
          revenue: 0,
          chickens: 0,
          balance: 0
        }
      }
      acc[chicken.customer].orders += 1
      acc[chicken.customer].revenue += chicken.count * chicken.size * chicken.price
      acc[chicken.customer].chickens += chicken.count
      acc[chicken.customer].balance += chicken.balance
      return acc
    }, {})
    
    const topCustomers = Object.entries(customerData)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
    
    // Breed Performance
    const breedPerformance = liveChickens.reduce((acc, batch) => {
      if (!acc[batch.breed]) {
        acc[batch.breed] = {
          batches: 0,
          totalChickens: 0,
          totalMortality: 0,
          averageWeight: 0,
          totalWeight: 0
        }
      }
      acc[batch.breed].batches += 1
      acc[batch.breed].totalChickens += batch.current_count || 0
      acc[batch.breed].totalMortality += (batch.initial_count || 0) - (batch.current_count || 0)
      acc[batch.breed].totalWeight += batch.current_weight || 0
      return acc
    }, {})
    
    Object.keys(breedPerformance).forEach(breed => {
      const data = breedPerformance[breed]
      data.averageWeight = data.batches > 0 ? data.totalWeight / data.batches : 0
      data.mortalityRate = data.totalChickens > 0 ? (data.totalMortality / (data.totalChickens + data.totalMortality)) * 100 : 0
    })
    
    return {
      production: {
        totalLiveChickens,
        totalMortality,
        averageMortalityRate,
        totalBatches: liveChickens.length,
        healthyBatches: liveChickens.filter(batch => batch.status === 'healthy').length
      },
      feed: {
        totalFeedCost,
        totalFeedConsumed,
        averageFeedCostPerKg: totalFeedConsumed > 0 ? totalFeedCost / totalFeedConsumed : 0,
        feedEfficiency: totalLiveChickens > 0 ? totalFeedConsumed / totalLiveChickens : 0
      },
      financial: {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin,
        roi: totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0
      },
      customers: {
        topCustomers,
        totalCustomers: Object.keys(customerData).length,
        averageOrderValue: chickens.length > 0 ? stats.totalRevenue / chickens.length : 0
      },
      breeds: breedPerformance
    }
  }, [chickens, liveChickens, feedInventory, feedConsumption, transactions, stats])
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'status-badge status-paid'
      case 'partial':
        return 'status-badge status-partial'
      case 'pending':
        return 'status-badge status-pending'
      default:
        return 'status-badge'
    }
  }
  
  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Advanced Reports & Analytics</h1>
        <p>Comprehensive business intelligence and performance insights</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="reports-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'production' ? 'active' : ''}`}
          onClick={() => setActiveTab('production')}
        >
          🐔 Production
        </button>
        <button 
          className={`tab-button ${activeTab === 'financial' ? 'active' : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          💰 Financial
        </button>
        <button 
          className={`tab-button ${activeTab === 'operational' ? 'active' : ''}`}
          onClick={() => setActiveTab('operational')}
        >
          ⚙️ Operational
        </button>
        <button 
          className={`tab-button ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          👥 Customers
        </button>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          {/* Enhanced KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card revenue">
              <div className="kpi-icon">💰</div>
              <div className="kpi-content">
                <h3>Total Revenue</h3>
                <p className="kpi-value">₦{formatNumber(stats.totalRevenue, 2)}</p>
                <span className="kpi-trend positive">+{advancedAnalytics.financial.profitMargin.toFixed(1)}% margin</span>
              </div>
            </div>
            
            <div className="kpi-card chickens">
              <div className="kpi-icon">🐔</div>
              <div className="kpi-content">
                <h3>Total Chickens</h3>
                <p className="kpi-value">{formatNumber(stats.totalChickens)}</p>
                <span className="kpi-trend">{advancedAnalytics.production.totalLiveChickens} live</span>
              </div>
            </div>
            
            <div className="kpi-card orders">
              <div className="kpi-icon">📋</div>
              <div className="kpi-content">
                <h3>Total Orders</h3>
                <p className="kpi-value">{chickens.length}</p>
                <span className="kpi-trend">{advancedAnalytics.customers.totalCustomers} customers</span>
              </div>
            </div>
            
            <div className="kpi-card profit">
              <div className="kpi-icon">📈</div>
              <div className="kpi-content">
                <h3>Net Profit</h3>
                <p className="kpi-value">₦{formatNumber(advancedAnalytics.financial.netProfit, 2)}</p>
                <span className={`kpi-trend ${advancedAnalytics.financial.roi >= 0 ? 'positive' : 'negative'}`}>
                  {advancedAnalytics.financial.roi.toFixed(1)}% ROI
                </span>
              </div>
            </div>
          </div>
          
          {/* Business Performance Metrics */}
          <div className="section">
            <h2 className="section-title">📊 Business Performance</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Active Live Chickens</h4>
                <p className="metric-value">{advancedAnalytics.production.totalLiveChickens}</p>
                <span className="metric-label">Current Stock</span>
              </div>
              <div className="metric-card">
                <h4>Outstanding Balance</h4>
                <p className="metric-value">₦{formatNumber(stats.outstandingBalance, 2)}</p>
                <span className="metric-label">Receivables</span>
              </div>
              <div className="metric-card">
                <h4>Paid Orders</h4>
                <p className="metric-value">{stats.paidCount}</p>
                <span className="metric-label">{((stats.paidCount / Math.max(chickens.length, 1)) * 100).toFixed(1)}% of total</span>
              </div>
              <div className="metric-card">
                <h4>Pending Orders</h4>
                <p className="metric-value">{stats.pendingCount}</p>
                <span className="metric-label">{((stats.pendingCount / Math.max(chickens.length, 1)) * 100).toFixed(1)}% of total</span>
              </div>
            </div>
          </div>
          
          <div className="time-period-selector">
            <label htmlFor="timePeriod">Time Period:</label>
            <select 
              id="timePeriod" 
              value={timePeriod} 
              onChange={(e) => setTimePeriod(e.target.value)}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          
          {/* Enhanced Charts */}
          <div className="charts-grid">
            {/* Revenue vs Expenses Chart */}
            <div className="chart-container">
              <h3>📈 Revenue vs Expenses Trends</h3>
              {timeBasedData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={timeBasedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      `₦${formatNumber(value, 2)}`, 
                      name === 'revenue' ? 'Revenue' : 'Trend'
                    ]} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#4caf50" name="Revenue" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="revenue" stroke="#2196f3" strokeWidth={3} dot={{ fill: '#4caf50', strokeWidth: 2, r: 4 }} name="Revenue Trend" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No revenue data available</p>
              )}
            </div>
            
            {/* Order Status Distribution */}
            <div className="chart-container">
              <h3>🎯 Order Status Distribution</h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} orders`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No order data available</p>
              )}
            </div>
            
            {/* Monthly Order Volume */}
            <div className="chart-container">
              <h3>📊 Monthly Order Volume</h3>
              {timeBasedData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={timeBasedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} orders`, 'Count']} />
                    <Legend />
                    <Bar dataKey="orders" fill="#2196f3" name="Orders" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No order volume data available</p>
              )}
            </div>
            
            {/* Live Stock Overview */}
            <div className="chart-container">
              <h3>🐔 Live Stock Overview</h3>
              {liveChickens.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={liveChickens.slice(-10).map((chicken, index) => ({
                    batch: `Batch ${index + 1}`,
                    count: chicken.current_count || 0,
                    mortality: chicken.mortality_count || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="batch" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="count" stackId="1" stroke="#4caf50" fill="#4caf50" name="Live Count" />
                    <Area type="monotone" dataKey="mortality" stackId="2" stroke="#f44336" fill="#f44336" name="Mortality" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No live stock data available</p>
              )}
            </div>
          </div>
          
          {/* Quick Stats Summary */}
          <div className="section">
            <h2 className="section-title">⚡ Quick Stats</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Average Order Value</h4>
                <p className="metric-value">₦{formatNumber(stats.totalRevenue / Math.max(chickens.length, 1), 2)}</p>
                <span className="metric-label">Per Order</span>
              </div>
              <div className="metric-card">
                <h4>Feed Inventory</h4>
                <p className="metric-value">{feedInventory.reduce((sum, item) => sum + (item.quantity || 0), 0)} kg</p>
                <span className="metric-label">Total Stock</span>
              </div>
              <div className="metric-card">
                <h4>Stock Items</h4>
                <p className="metric-value">{stock.length}</p>
                <span className="metric-label">Different Items</span>
              </div>
              <div className="metric-card">
                <h4>Total Transactions</h4>
                <p className="metric-value">{transactions.length}</p>
                <span className="metric-label">All Time</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Production Tab */}
      {activeTab === 'production' && (
        <div className="tab-content">
          <div className="production-metrics">
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Live Chickens</h4>
                <p className="metric-value">{advancedAnalytics.production.totalLiveChickens}</p>
                <span className="metric-label">Currently Active</span>
              </div>
              
              <div className="metric-card">
                <h4>Total Batches</h4>
                <p className="metric-value">{advancedAnalytics.production.totalBatches}</p>
                <span className="metric-label">{advancedAnalytics.production.healthyBatches} Healthy</span>
              </div>
              
              <div className="metric-card">
                <h4>Mortality Rate</h4>
                <p className="metric-value">{advancedAnalytics.production.averageMortalityRate.toFixed(1)}%</p>
                <span className="metric-label">{advancedAnalytics.production.totalMortality} Total Deaths</span>
              </div>
              
              <div className="metric-card">
                <h4>Feed Efficiency</h4>
                <p className="metric-value">{advancedAnalytics.feed.feedEfficiency.toFixed(2)}</p>
                <span className="metric-label">kg per chicken</span>
              </div>
            </div>
            
            {/* Breed Performance Chart */}
            <div className="chart-container">
              <h3>Breed Performance Analysis</h3>
              {Object.keys(advancedAnalytics.breeds).length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={Object.entries(advancedAnalytics.breeds).map(([breed, data]) => ({
                    breed,
                    chickens: data.totalChickens,
                    mortality: data.mortalityRate,
                    weight: data.averageWeight
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="breed" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="chickens" fill="#4caf50" name="Live Chickens" />
                    <Bar dataKey="weight" fill="#2196f3" name="Avg Weight (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No breed data available</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="tab-content">
          <div className="financial-metrics">
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Total Income</h4>
                <p className="metric-value">₦{formatNumber(advancedAnalytics.financial.totalIncome, 2)}</p>
                <span className="metric-label">Revenue Generated</span>
              </div>
              
              <div className="metric-card">
                <h4>Total Expenses</h4>
                <p className="metric-value">₦{formatNumber(advancedAnalytics.financial.totalExpenses, 2)}</p>
                <span className="metric-label">Operating Costs</span>
              </div>
              
              <div className="metric-card">
                <h4>Net Profit</h4>
                <p className="metric-value">₦{formatNumber(advancedAnalytics.financial.netProfit, 2)}</p>
                <span className="metric-label">{advancedAnalytics.financial.roi.toFixed(1)}% ROI</span>
              </div>
              
              <div className="metric-card">
                <h4>Profit Margin</h4>
                <p className="metric-value">{advancedAnalytics.financial.profitMargin.toFixed(1)}%</p>
                <span className="metric-label">Target: 15%</span>
              </div>
            </div>
            
            {/* Financial Charts */}
            <div className="chart-container">
              <h3>Revenue vs Expenses Trends</h3>
              {timeBasedData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={timeBasedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₦${formatNumber(value, 2)}`, 'Amount']} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#4caf50" name="Revenue" />
                    <Line type="monotone" dataKey="revenue" stroke="#2196f3" strokeWidth={2} name="Trend" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No financial data available</p>
              )}
            </div>
            
            {/* Expense Breakdown */}
            <div className="chart-container">
              <h3>Expense Breakdown</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Feed Costs', value: advancedAnalytics.feed.totalFeedCost, color: '#ff9800' },
                      { name: 'Operations', value: Math.max(0, advancedAnalytics.financial.totalExpenses - advancedAnalytics.feed.totalFeedCost), color: '#2196f3' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#ff9800" />
                    <Cell fill="#2196f3" />
                  </Pie>
                  <Tooltip formatter={(value) => [`₦${formatNumber(value, 2)}`, 'Amount']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      
      {/* Operational Tab */}
      {activeTab === 'operational' && (
        <div className="tab-content">
          <div className="operational-metrics">
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Total Feed Cost</h4>
                <p className="metric-value">₦{formatNumber(advancedAnalytics.feed.totalFeedCost, 2)}</p>
                <span className="metric-label">Feed Investment</span>
              </div>
              
              <div className="metric-card">
                <h4>Feed Consumed</h4>
                <p className="metric-value">{formatNumber(advancedAnalytics.feed.totalFeedConsumed, 1)} kg</p>
                <span className="metric-label">Total Consumption</span>
              </div>
              
              <div className="metric-card">
                <h4>Cost per kg</h4>
                <p className="metric-value">₦{formatNumber(advancedAnalytics.feed.averageFeedCostPerKg, 2)}</p>
                <span className="metric-label">Average Rate</span>
              </div>
              
              <div className="metric-card">
                <h4>Feed Efficiency</h4>
                <p className="metric-value">{formatNumber(advancedAnalytics.feed.feedEfficiency, 2)}</p>
                <span className="metric-label">kg per chicken</span>
              </div>
            </div>
            
            {/* Feed Consumption Chart */}
            <div className="chart-container">
              <h3>Feed Consumption Analysis</h3>
              {feedConsumption.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={feedConsumption.map(item => ({
                    date: formatDate(item.date),
                    consumed: item.quantity_consumed || 0,
                    cost: (item.quantity_consumed || 0) * advancedAnalytics.feed.averageFeedCostPerKg
                  })).slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="consumed" stackId="1" stroke="#4caf50" fill="#4caf50" name="Feed Consumed (kg)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No feed consumption data available</p>
              )}
            </div>
            
            {/* Stock Status */}
            <div className="chart-container">
              <h3>Current Stock Status</h3>
              {stock.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={stock.map(item => ({
                    name: item.item_name,
                    quantity: item.quantity,
                    value: item.unit_price * item.quantity
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'quantity' ? `${value} units` : `₦${formatNumber(value, 2)}`,
                      name === 'quantity' ? 'Quantity' : 'Value'
                    ]} />
                    <Legend />
                    <Bar dataKey="quantity" fill="#2196f3" name="Quantity" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No stock data available</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="tab-content">
          <div className="customer-analytics">
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Total Customers</h4>
                <p className="metric-value">{advancedAnalytics.customers.totalCustomers}</p>
                <span className="metric-label">Active Clients</span>
              </div>
              
              <div className="metric-card">
                <h4>Average Order Value</h4>
                <p className="metric-value">₦{formatNumber(advancedAnalytics.customers.averageOrderValue, 2)}</p>
                <span className="metric-label">Per Transaction</span>
              </div>
              
              <div className="metric-card">
                <h4>Top Customer Revenue</h4>
                <p className="metric-value">₦{formatNumber(advancedAnalytics.customers.topCustomers[0]?.revenue || 0, 2)}</p>
                <span className="metric-label">{advancedAnalytics.customers.topCustomers[0]?.name || 'N/A'}</span>
              </div>
              
              <div className="metric-card">
                <h4>Outstanding Balance</h4>
                <p className="metric-value">₦{formatNumber(advancedAnalytics.customers.topCustomers.reduce((sum, c) => sum + c.balance, 0), 2)}</p>
                <span className="metric-label">Total Receivables</span>
              </div>
            </div>
            
            {/* Top Customers Chart */}
            <div className="chart-container">
              <h3>Top 10 Customers by Revenue</h3>
              {advancedAnalytics.customers.topCustomers.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={advancedAnalytics.customers.topCustomers.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₦${formatNumber(value, 2)}`, 'Revenue']} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#4caf50" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No customer data available</p>
              )}
            </div>
            
            {/* Customer Orders Distribution */}
            <div className="chart-container">
              <h3>Customer Order Distribution</h3>
              {advancedAnalytics.customers.topCustomers.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={advancedAnalytics.customers.topCustomers.slice(0, 5).map((customer, index) => ({
                        name: customer.name,
                        value: customer.orders,
                        color: ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'][index]
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {advancedAnalytics.customers.topCustomers.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'][index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} orders`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No customer order data available</p>
              )}
            </div>
            
            {/* Customer Details Table */}
            <div className="table-container">
              <h3>Customer Performance Details</h3>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Orders</th>
                    <th>Chickens</th>
                    <th>Revenue</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {advancedAnalytics.customers.topCustomers.slice(0, 10).map(customer => (
                    <tr key={customer.name}>
                      <td>{customer.name}</td>
                      <td>{customer.orders}</td>
                      <td>{customer.chickens}</td>
                      <td>₦{formatNumber(customer.revenue, 2)}</td>
                      <td className={customer.balance > 0 ? 'negative' : 'positive'}>
                        ₦{formatNumber(customer.balance, 2)}
                      </td>
                      <td>
                        <span className={`status-badge ${customer.balance > 0 ? 'status-pending' : 'status-paid'}`}>
                          {customer.balance > 0 ? 'Outstanding' : 'Paid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      <div className="date-range-report">
        <h2>Date Range Report</h2>
        
        <div className="date-range-form">
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>&nbsp;</label>
            <button 
              className="btn-primary" 
              onClick={handleGenerateReport}
              disabled={!startDate || !endDate}
            >
              Generate Report
            </button>
          </div>
        </div>
        
        {reportData && (
          <div className="report-results">
            {reportData.empty ? (
              <p className="no-data">{reportData.message}</p>
            ) : (
              <>
                <div className="report-summary">
                  <div className="summary-item">
                    <h4>Date Range</h4>
                    <p>{formatDate(reportData.startDate)} - {formatDate(reportData.endDate)}</p>
                  </div>
                  
                  <div className="summary-item">
                    <h4>Total Orders</h4>
                    <p>{reportData.orderCount}</p>
                  </div>
                  
                  <div className="summary-item">
                    <h4>Total Chickens</h4>
                    <p>{reportData.totalChickens}</p>
                  </div>
                  
                  <div className="summary-item">
                    <h4>Total Revenue</h4>
                    <p>₦{reportData.totalRevenue.toFixed(2)}</p>
                  </div>
                  
                  <div className="summary-item">
                    <h4>Outstanding Balance</h4>
                    <p>₦{reportData.totalBalance.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="report-actions">
                  <button className="btn-export" onClick={handleExportCSV}>
                    Export to CSV
                  </button>
                </div>
                
                <div className="table-container">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Count</th>
                        <th>Size (kg)</th>
                        <th>Price</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.orders.map(order => (
                        <tr key={order.id}>
                          <td>{formatDate(order.date)}</td>
                          <td>
                            <div className="customer-info">
                              <span className="customer-name">{order.customer}</span>
                              {order.phone && (
                                <span className="customer-phone">{order.phone}</span>
                              )}
                            </div>
                          </td>
                          <td>{formatNumber(order.count)}</td>
                          <td>{formatNumber(order.size)}</td>
                          <td>₦{formatNumber(order.price, 2)}</td>
                          <td>₦{formatNumber(order.count * order.size * order.price, 2)}</td>
                          <td>₦{formatNumber(order.amount_paid || 0, 2)}</td>
                          <td>₦{formatNumber(order.balance, 2)}</td>
                          <td>
                            <span className={getStatusBadgeClass(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports