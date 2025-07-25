import { useState, useMemo, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import './Dashboard.css'

const Dashboard = () => {
  const { stats, chickens, transactions } = useAppContext()
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [itemsPerView, setItemsPerView] = useState(1)
  
  // Data for status pie chart
  const statusData = [
    { name: 'Paid', value: stats.paidCount, color: '#4caf50' },
    { name: 'Partial', value: stats.partialCount, color: '#ff9800' },
    { name: 'Pending', value: stats.pendingCount, color: '#f44336' }
  ].filter(item => item.value > 0)
  
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

  // Memoized monthly revenue data calculation for better performance
  const monthlyRevenueData = useMemo(() => {
    const today = new Date()
    const monthlyData = []
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthName = month.toLocaleString('default', { month: 'short' })
      const monthYear = `${monthName} ${month.getFullYear()}`
      
      // Filter chickens for this month
      const monthRevenue = chickens.reduce((sum, chicken) => {
        const chickenDate = new Date(chicken.date)
        if (chickenDate.getMonth() === month.getMonth() && 
            chickenDate.getFullYear() === month.getFullYear()) {
          return sum + (chicken.count * chicken.size * chicken.price)
        }
        return sum
      }, 0)
      
      monthlyData.push({
        name: monthName,
        revenue: monthRevenue
      })
    }
    
    return monthlyData
  }, [chickens])
  

  
  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      
      <div className="orders-carousel">
        <div className="carousel-header">
          <h3 className="carousel-title">Pending & Partial Orders</h3>
          {pendingPartialOrders.length > 0 && (
            <span className="carousel-count">
              {pendingPartialOrders.length} order{pendingPartialOrders.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {pendingPartialOrders.length > 0 ? (
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
                      {order.count} chicken{order.count !== 1 ? 's' : ''}
                    </span>
                    <span className="order-balance">
                      ₦{order.balance.toFixed(2)} balance
                    </span>
                  </div>
                  <div className="order-meta">
                    <span className="order-date">
                      {new Date(order.date).toLocaleDateString()}
                    </span>
                    <span className="order-size">
                      Size: {order.size}kg
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
        ) : (
          <p className="no-data">No pending or partial orders</p>
        )}
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Current Balance</h3>
          <p className="stat-value">₦{stats.balance.toFixed(2)}</p>
        </div>
        
        <div className="stat-card">
          <h3>Total Weight</h3>
          <p className="stat-value">{totalWeight.toFixed(2)} kg</p>
        </div>
        
        <div className="stat-card">
          <h3>Total Chickens</h3>
          <p className="stat-value">{stats.totalChickens}</p>
        </div>
        
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">₦{stats.totalRevenue.toFixed(2)}</p>
        </div>
        
        <div className="stat-card">
          <h3>Outstanding Balance</h3>
          <p className="stat-value">₦{stats.outstandingBalance.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="dashboard-charts">
        <div className="chart-container status-chart">
          <h3>Order Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} orders`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No order data available</p>
          )}
        </div>
        
        <div className="chart-container revenue-chart">
          <h3>Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`₦${value.toFixed(2)}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#4caf50" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="recent-transactions">
        <h3>Recent Transactions</h3>
        {recentTransactions.length > 0 ? (
          <div className="transactions-list">
            {recentTransactions.map(transaction => (
              <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                <div className="transaction-info">
                  <span className="transaction-date">{new Date(transaction.date).toLocaleDateString()}</span>
                  <span className="transaction-description">{transaction.description}</span>
                </div>
                <span className="transaction-amount">
                  {transaction.type === 'fund' ? '+' : '-'}₦{transaction.amount.toFixed(2)}
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