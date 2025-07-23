import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './Dashboard.css'

const Dashboard = () => {
  const { calculateStats, chickens, transactions, addFunds, addExpense, withdrawFunds, clearBalance } = useAppContext()
  const [activeModal, setActiveModal] = useState(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  
  const stats = calculateStats()
  
  // Data for status pie chart
  const statusData = [
    { name: 'Paid', value: stats.paidCount, color: '#4caf50' },
    { name: 'Partial', value: stats.partialCount, color: '#ff9800' },
    { name: 'Pending', value: stats.pendingCount, color: '#f44336' }
  ].filter(item => item.value > 0)
  
  // Data for recent transactions
  const recentTransactions = transactions.slice(0, 5)
  
  // Data for monthly revenue chart (last 6 months)
  const getMonthlyRevenueData = () => {
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
  }
  
  const monthlyRevenueData = getMonthlyRevenueData()
  
  // Handle modal actions
  const openModal = (modalName) => {
    setActiveModal(modalName)
    setAmount('')
    setDescription('')
  }
  
  const closeModal = () => {
    setActiveModal(null)
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount')
      return
    }
    
    try {
      if (activeModal === 'addFunds') {
        await addFunds(parsedAmount, description)
      } else if (activeModal === 'addExpense') {
        await addExpense(parsedAmount, description)
      } else if (activeModal === 'withdrawFunds') {
        await withdrawFunds(parsedAmount, description)
      }
      
      closeModal()
    } catch (error) {
      alert(error.message)
    }
  }
  
  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      
      <div className="dashboard-actions">
        <button className="action-button add-funds" onClick={() => openModal('addFunds')}>
          Add Funds
        </button>
        <button className="action-button add-expense" onClick={() => openModal('addExpense')}>
          Add Expense
        </button>
        <button className="action-button withdraw" onClick={() => openModal('withdrawFunds')}>
          Withdraw
        </button>
        <button className="action-button clear" onClick={async () => {
          if (window.confirm('Are you sure you want to clear the balance to zero?')) {
            try {
              await clearBalance()
            } catch (error) {
              alert(`Error: ${error.message}`)
            }
          }
        }}>
          Clear
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Current Balance</h3>
          <p className="stat-value">₦{stats.balance.toFixed(2)}</p>
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
      
      {/* Modals */}
      {activeModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>
              {activeModal === 'addFunds' && 'Add Funds'}
              {activeModal === 'addExpense' && 'Add Expense'}
              {activeModal === 'withdrawFunds' && 'Withdraw Funds'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="amount">Amount ($)</label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">
                  {activeModal === 'withdrawFunds' ? 'Purpose' : 'Description'}
                </label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={activeModal === 'withdrawFunds' ? 'Purpose of withdrawal' : 'Description (optional)'}
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {activeModal === 'addFunds' && 'Add Funds'}
                  {activeModal === 'addExpense' && 'Add Expense'}
                  {activeModal === 'withdrawFunds' && 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard