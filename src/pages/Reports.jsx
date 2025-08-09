import { useState, useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { formatNumber, formatDate } from '../utils/formatters'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import './Reports.css'

const Reports = () => {
  const { chickens, generateReport, exportToCSV } = useAppContext()
  

  
  // State for date range
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // State for report data
  const [reportData, setReportData] = useState(null)
  
  // State for time period selection
  const [timePeriod, setTimePeriod] = useState('monthly')
  
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
    <div className="reports-container">
      <h1>Reports</h1>
      
      <div className="reports-overview">
        <div className="time-period-selector">
          <label htmlFor="timePeriod">View by:</label>
          <select 
            id="timePeriod" 
            value={timePeriod} 
            onChange={(e) => setTimePeriod(e.target.value)}
            className="time-period-dropdown"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>
        
        <div className="overview-charts">
          <div className="chart-container">
            <h3>{timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeBasedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`₦${value.toFixed(2)}`, 'Revenue']} />
                <Legend />
                <Bar dataKey="revenue" fill="#4caf50" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="chart-container">
            <h3>{timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Chicken Count</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeBasedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#2196f3" name="Chicken Count" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="chart-container">
            <h3>Order Status Distribution</h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
        </div>
      </div>
      
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