import { useState, useMemo, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { formatNumber, formatDate } from '../utils/formatters'
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, ComposedChart
} from 'recharts'

import './Dashboard.css'

const Dashboard = () => {
  const { stats, chickens, transactions } = useAppContext()
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [itemsPerView, setItemsPerView] = useState(1)
  
  // Enhanced dashboard state
  const [selectedTimeRange, setSelectedTimeRange] = useState('6months')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')
  const [revenueViewType, setRevenueViewType] = useState('monthly')
  const [showRevenueComparison, setShowRevenueComparison] = useState(false)
  
  // Enhanced status data with filtering and trends - optimized for performance
  const enhancedStatusData = useMemo(() => {
    const filteredChickens = selectedStatusFilter === 'all' 
      ? chickens 
      : chickens.filter(chicken => chicken.status === selectedStatusFilter)
    
    // Single pass through data for better performance
    const statusData = filteredChickens.reduce((acc, chicken) => {
      const status = chicken.status
      const revenue = chicken.count * chicken.size * chicken.price
      
      if (!acc[status]) {
        acc[status] = { count: 0, revenue: 0, balance: 0 }
      }
      
      acc[status].count += 1
      acc[status].revenue += revenue
      acc[status].balance += chicken.balance
      
      return acc
    }, {})
    
    // Ensure all status types exist
    const statusCounts = {
      paid: statusData.paid?.count || 0,
      partial: statusData.partial?.count || 0,
      pending: statusData.pending?.count || 0
    }
    
    const statusRevenue = {
      paid: statusData.paid?.revenue || 0,
      partial: statusData.partial?.revenue || 0,
      pending: statusData.pending?.revenue || 0
    }
    
    const statusBalance = {
      paid: 0, // Paid orders have no balance
      partial: statusData.partial?.balance || 0,
      pending: statusData.pending?.balance || 0
    }
    
    return {
      pieData: [
        { name: 'Paid', value: statusCounts.paid, color: '#4caf50', revenue: statusRevenue.paid, balance: statusBalance.paid },
        { name: 'Partial', value: statusCounts.partial, color: '#ff9800', revenue: statusRevenue.partial, balance: statusBalance.partial },
        { name: 'Pending', value: statusCounts.pending, color: '#f44336', revenue: statusRevenue.pending, balance: statusBalance.pending }
      ].filter(item => item.value > 0),
      counts: statusCounts,
      revenue: statusRevenue,
      balance: statusBalance,
      total: statusCounts.paid + statusCounts.partial + statusCounts.pending
    }
  }, [chickens, selectedStatusFilter])
  
  // Memoized data for recent transactions
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions])
  
  // Get pending and partial orders for carousel
  const pendingPartialOrders = useMemo(() => {
    return chickens.filter(chicken => chicken.status === 'pending' || chicken.status === 'partial')
  }, [chickens])


  
  // Calculate responsive items per view
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerView(3)
      } else if (window.innerWidth >= 768) {
        setItemsPerView(2)
      } else {
        setItemsPerView(1)
      }
    }
    
    updateItemsPerView()
    window.addEventListener('resize', updateItemsPerView)
    return () => window.removeEventListener('resize', updateItemsPerView)
  }, [])
  
  // Calculate max index based on items per view
  const maxIndex = Math.max(0, pendingPartialOrders.length - itemsPerView)
  
  // Carousel navigation functions
  const goToPrevious = () => {
    setCurrentCarouselIndex(prev => Math.max(0, prev - 1))
    setIsAutoPlaying(false)
  }
  
  const goToNext = () => {
    setCurrentCarouselIndex(prev => Math.min(maxIndex, prev + 1))
    setIsAutoPlaying(false)
  }
  
  const goToSlide = (index) => {
    setCurrentCarouselIndex(Math.min(index, maxIndex))
    setIsAutoPlaying(false)
  }
  
  // Carousel auto-rotation
  useEffect(() => {
    if (pendingPartialOrders.length > itemsPerView && isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentCarouselIndex(prev => {
          const nextIndex = prev + 1
          return nextIndex > maxIndex ? 0 : nextIndex
        })
      }, 4000) // Change every 4 seconds
      
      return () => clearInterval(interval)
    }
  }, [pendingPartialOrders.length, itemsPerView, isAutoPlaying, maxIndex])
  
  // Calculate total weight in KG
  const totalWeight = useMemo(() => {
    return chickens.reduce((sum, chicken) => {
      return sum + (chicken.count * chicken.size)
    }, 0)
  }, [chickens])

  // Enhanced revenue data calculation with multiple time ranges
  const revenueData = useMemo(() => {
    const today = new Date()
    const data = []
    
    // Determine periods based on view type and time range
    const getPeriodsCount = () => {
      if (revenueViewType === 'weekly') return selectedTimeRange === '3months' ? 12 : 24
      if (revenueViewType === 'monthly') return selectedTimeRange === '3months' ? 3 : selectedTimeRange === '6months' ? 6 : 12
      if (revenueViewType === 'quarterly') return selectedTimeRange === '6months' ? 2 : 4
      return 6
    }
    
    const periodsCount = getPeriodsCount()
    
    for (let i = periodsCount - 1; i >= 0; i--) {
      let periodStart, periodEnd, periodName
      
      if (revenueViewType === 'weekly') {
        periodStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (i * 7) - today.getDay())
        periodEnd = new Date(periodStart.getTime() + 6 * 24 * 60 * 60 * 1000)
        periodName = `Week ${formatDate(periodStart)}`
      } else if (revenueViewType === 'monthly') {
        periodStart = new Date(today.getFullYear(), today.getMonth() - i, 1)
        periodEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0)
        periodName = `${periodStart.toLocaleString('default', { month: 'short' })} ${periodStart.getFullYear().toString().slice(-2)}`
      } else if (revenueViewType === 'quarterly') {
        const quarterStart = Math.floor(today.getMonth() / 3) * 3 - (i * 3)
        periodStart = new Date(today.getFullYear(), quarterStart, 1)
        periodEnd = new Date(today.getFullYear(), quarterStart + 3, 0)
        periodName = `Q${Math.floor(quarterStart / 3) + 1} ${periodStart.getFullYear().toString().slice(-2)}`
      }
      
      // Calculate revenue and other metrics for this period
      const periodRevenue = chickens.reduce((sum, chicken) => {
        const chickenDate = new Date(chicken.date)
        if (chickenDate >= periodStart && chickenDate <= periodEnd) {
          return sum + (chicken.count * chicken.size * chicken.price)
        }
        return sum
      }, 0)
      
      const periodOrders = chickens.filter(chicken => {
        const chickenDate = new Date(chicken.date)
        return chickenDate >= periodStart && chickenDate <= periodEnd
      }).length
      
      const periodChickens = chickens.reduce((sum, chicken) => {
        const chickenDate = new Date(chicken.date)
        if (chickenDate >= periodStart && chickenDate <= periodEnd) {
          return sum + chicken.count
        }
        return sum
      }, 0)
      
      data.push({
        name: periodName,
        revenue: periodRevenue,
        orders: periodOrders,
        chickens: periodChickens,
        avgOrderValue: periodOrders > 0 ? periodRevenue / periodOrders : 0
      })
    }
    
    return data
  }, [chickens, revenueViewType, selectedTimeRange])
  

  
  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      
      {pendingPartialOrders.length > 0 && (
        <div className="orders-carousel">
          <div className="carousel-header">
            <h3 className="carousel-title">Pending & Partial Orders</h3>
            <span className="carousel-count">
              {pendingPartialOrders.length} order{pendingPartialOrders.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="carousel-container">
            <div 
              className="carousel-track"
              style={{
                transform: `translateX(-${(currentCarouselIndex * 100) / itemsPerView}%)`
              }}
            >
              {pendingPartialOrders.map((order, index) => (
                <div key={order.id || index} className="carousel-item">
                  <div className="order-info">
                    <span className="customer-name">{order.customer}</span>
                    <span className={`order-status ${order.status}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="order-details">
                    <span className="order-quantity">
                      {formatNumber(order.count)} chicken{order.count !== 1 ? 's' : ''}
                    </span>
                    <span className="order-balance">
                      ₦{formatNumber(order.balance, 2)} balance
                    </span>
                  </div>
                  <div className="order-meta">
                    <span className="order-date">
                      {formatDate(order.date)}
                    </span>
                    <span className="order-size">
                      Size: {formatNumber(order.size)}kg
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {pendingPartialOrders.length > itemsPerView && (
              <div className="carousel-navigation">
                <button 
                  className="carousel-nav-btn"
                  onClick={goToPrevious}
                  disabled={currentCarouselIndex === 0}
                  aria-label="Previous orders"
                >
                  ‹
                </button>
                
                <div className="carousel-indicators">
                  {Array.from({ length: maxIndex + 1 }, (_, index) => (
                    <span 
                      key={index} 
                      className={`indicator ${index === currentCarouselIndex ? 'active' : ''}`}
                      onClick={() => goToSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
                
                <button 
                  className="carousel-nav-btn"
                  onClick={goToNext}
                  disabled={currentCarouselIndex >= maxIndex}
                  aria-label="Next orders"
                >
                  ›
                </button>
              </div>
            )}
            
            {isAutoPlaying && pendingPartialOrders.length > itemsPerView && (
              <div className="carousel-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{
                      width: `${((currentCarouselIndex + 1) / (maxIndex + 1)) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
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
      
      <div className="dashboard-charts">
        {/* Enhanced Order Status Chart */}
        <div className="chart-container status-chart enhanced">
          <div className="chart-header">
            <h3>Order Status Analytics</h3>
            <div className="chart-controls">
              <select 
                value={selectedStatusFilter} 
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Orders</option>
                <option value="paid">Paid Only</option>
                <option value="partial">Partial Only</option>
                <option value="pending">Pending Only</option>
              </select>
            </div>
          </div>
          
          {enhancedStatusData.pieData.length > 0 ? (
            <div className="status-analytics">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={enhancedStatusData.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    animationBegin={0}
                    animationDuration={800}
                    isAnimationActive={true}
                  >
                    {enhancedStatusData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} orders`,
                      name,
                      `Revenue: ₦${formatNumber(props.payload.revenue, 2)}`,
                      `Balance: ₦${formatNumber(props.payload.balance, 2)}`
                    ]}
                    animationDuration={200}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="status-breakdown">
                {enhancedStatusData.pieData.map((status, index) => (
                  <div key={index} className="status-item">
                    <div className="status-indicator" style={{ backgroundColor: status.color }}></div>
                    <div className="status-details">
                      <span className="status-name">{status.name}</span>
                      <span className="status-count">{status.value} orders</span>
                      <span className="status-revenue">₦{formatNumber(status.revenue, 2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="no-data">No order data available</p>
          )}
        </div>
        
        {/* Enhanced Revenue Chart */}
        <div className="chart-container revenue-chart enhanced">
          <div className="chart-header">
            <h3>Revenue Analytics</h3>
            <div className="chart-controls">
              <div className="control-group">
                <select 
                  value={revenueViewType} 
                  onChange={(e) => setRevenueViewType(e.target.value)}
                  className="filter-select"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
                <select 
                  value={selectedTimeRange} 
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="filter-select"
                >
                  <option value="3months">3 Months</option>
                  <option value="6months">6 Months</option>
                  <option value="12months">12 Months</option>
                </select>
              </div>
              <button 
                className={`toggle-btn ${showRevenueComparison ? 'active' : ''}`}
                onClick={() => setShowRevenueComparison(!showRevenueComparison)}
              >
                {showRevenueComparison ? 'Simple View' : 'Detailed View'}
              </button>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            {showRevenueComparison ? (
              <ComposedChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis yAxisId="left" orientation="left" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'revenue') return [`₦${formatNumber(value, 2)}`, 'Revenue']
                    if (name === 'orders') return [formatNumber(value), 'Orders']
                    if (name === 'avgOrderValue') return [`₦${formatNumber(value, 2)}`, 'Avg Order Value']
                    return [formatNumber(value), name]
                  }}
                  labelStyle={{ color: '#333' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <Bar yAxisId="left" dataKey="revenue" fill="#4caf50" name="revenue" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#2196f3" strokeWidth={2} name="orders" />
                <Line yAxisId="right" type="monotone" dataKey="avgOrderValue" stroke="#ff9800" strokeWidth={2} name="avgOrderValue" />
              </ComposedChart>
            ) : (
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value) => [`₦${formatNumber(value, 2)}`, 'Revenue']}
                  labelStyle={{ color: '#333' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4caf50" 
                  fill="url(#revenueGradient)" 
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4caf50" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4caf50" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            )}
          </ResponsiveContainer>
          
          <div className="revenue-summary">
            <div className="summary-item">
              <span className="summary-label">Avg per Period</span>
              <span className="summary-value">₦{formatNumber(revenueData.reduce((sum, item) => sum + item.revenue, 0) / revenueData.length || 0, 2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="recent-transactions">
        <h3>Recent Transactions</h3>
        {recentTransactions.length > 0 ? (
          <div className="transactions-list">
            {recentTransactions.map(transaction => (
              <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                <div className="transaction-info">
                  <span className="transaction-date">{formatDate(transaction.date)}</span>
                  <span className="transaction-description">{transaction.description}</span>
                </div>
                <span className="transaction-amount">
                  {transaction.type === 'fund' ? '+' : '-'}₦{formatNumber(transaction.amount, 2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No recent transactions</p>
        )}
      </div>
      

    </div>
  )
}

export default Dashboard