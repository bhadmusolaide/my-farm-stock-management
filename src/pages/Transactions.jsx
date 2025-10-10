import { useState, useEffect } from 'react'
import { useAppContext } from '../context'
import { formatNumber, formatDate } from '../utils/formatters'
import { supabase } from '../utils/supabaseClient'
import { DataTable, StatusBadge } from '../components/UI'
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner'
import './Transactions.css'

const Transactions = () => {
  const { addFunds, addExpense, withdrawFunds, deleteTransaction } = useAppContext()

  // Local state for all transactions (not just recent ones)
  const [allTransactions, setAllTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  // Load transactions with pagination on component mount
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true)

        // Load recent transactions (last 100) for better performance
        const { data, error } = await supabase
          .from('transactions')
          .select('id, date, type, amount, description, created_at, updated_at') // Select only needed columns
          .order('date', { ascending: false })
          .limit(100) // Limit to recent 100 transactions

        if (error && !error.message.includes('relation "transactions" does not exist')) {
          throw error
        }

        if (data) {
          setAllTransactions(data)
        } else {
          // Fallback to localStorage if Supabase fails
          const localTransactions = localStorage.getItem('transactions')
          if (localTransactions) {
            try {
              const parsed = JSON.parse(localTransactions)
              // Sort by date and limit to recent 100 for performance
              const sorted = parsed.sort((a, b) => new Date(b.date) - new Date(a.date))
              setAllTransactions(sorted.slice(0, 100))
            } catch (e) {
              console.warn('Invalid transactions in localStorage:', e)
            }
          }
        }
      } catch (err) {
        console.error('Error loading transactions:', err)
        // Fallback to localStorage
        const localTransactions = localStorage.getItem('transactions')
        if (localTransactions) {
          try {
            const parsed = JSON.parse(localTransactions)
            // Sort by date and limit to recent 100 for performance
            const sorted = parsed.sort((a, b) => new Date(b.date) - new Date(a.date))
            setAllTransactions(sorted.slice(0, 100))
          } catch (e) {
            console.warn('Invalid transactions in localStorage:', e)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [])
  
  // Add resetTransactions function here
  const resetTransactions = async () => {
    if (window.confirm('⚠️ CAUTION: This will permanently delete ALL financial transaction records EXCEPT chicken order payments. Chicken order data will be preserved. This action cannot be undone. Do you want to proceed?')) {
      try {
        // Filter out transactions that are related to chicken orders (payments)
        // These would typically be transactions with descriptions containing "Payment from" or "Additional payment from"
        const nonChickenTransactions = allTransactions.filter(transaction =>
          !transaction.description.includes('Payment from') &&
          !transaction.description.includes('Additional payment from') &&
          !transaction.description.includes('Refund for deleted chicken order')
        );
        
        // Delete all non-chicken-related transactions one by one
        for (const transaction of nonChickenTransactions) {
          await deleteTransaction(transaction.id);
        }
        
        // Refresh the page to ensure UI is updated
        window.location.reload();
      } catch (error) {
        console.error('Error resetting transactions:', error)
        alert('❌ Error resetting transactions: ' + error.message)
      }
    }
  }
  
  // State for filters
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: ''
  })
  
  // State for modal
  const [activeModal, setActiveModal] = useState(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  
  // Get filtered transactions
  const getFilteredTransactions = () => {
    let filtered = [...allTransactions]

    if (filters.type) {
      filtered = filtered.filter(transaction => transaction.type === filters.type)
    }

    if (filters.startDate) {
      filtered = filtered.filter(transaction =>
        new Date(transaction.date) >= new Date(filters.startDate)
      )
    }

    if (filters.endDate) {
      filtered = filtered.filter(transaction =>
        new Date(transaction.date) <= new Date(filters.endDate)
      )
    }

    return filtered
  }
  
  const filteredTransactions = getFilteredTransactions()
  
  // Table columns configuration
  const transactionColumns = [
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount' }
  ]

  // Custom cell renderer for transactions table
  const renderTransactionCell = (value, row, column) => {
    switch (column.key) {
      case 'date':
        return formatDate(row.date);
      case 'type':
        return (
          <StatusBadge
            status={row.type}
            type={getTransactionTypeVariant(row.type)}
          >
            {getTransactionTypeDisplay(row.type)}
          </StatusBadge>
        );
      case 'amount':
        return (
          <span className={`amount ${row.type === 'fund' ? 'positive' : 'negative'}`}>
            {row.type === 'fund' ? '+' : '-'}₦{formatNumber(row.amount, 2)}
          </span>
        );
      default:
        return value;
    }
  }
  
  // Calculate totals
  const calculateTotals = () => {
    let income = 0
    let expenses = 0
    
    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'fund' || transaction.type === 'income') {
        income += transaction.amount
      } else if (transaction.type === 'expense' || transaction.type === 'stock_expense' || transaction.type === 'withdrawal') {
        expenses += transaction.amount
      }
    })
    
    return {
      income,
      expenses,
      net: income - expenses
    }
  }
  
  const totals = calculateTotals()
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      type: '',
      startDate: '',
      endDate: ''
    })
  }
  
  // Open modal
  const openModal = (modalType) => {
    setActiveModal(modalType)
    setAmount('')
    setDescription('')
  }
  
  // Close modal
  const closeModal = () => {
    setActiveModal(null)
  }
  
  // Handle form submission
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
      alert(`Error: ${error.message}`)
    }
  }
  
  // Get transaction type display name
  const getTransactionTypeDisplay = (type) => {
    switch (type) {
      case 'fund':
        return 'Fund Addition'
      case 'expense':
        return 'Expense'
      case 'stock_expense':
        return 'Stock Purchase'
      case 'withdrawal':
        return 'Withdrawal'
      default:
        return type
    }
  }
  
  // Get transaction type variant for StatusBadge
  const getTransactionTypeVariant = (type) => {
    switch (type) {
      case 'fund':
        return 'success'
      case 'expense':
      case 'stock_expense':
        return 'warning'
      case 'withdrawal':
        return 'danger'
      default:
        return 'default'
    }
  }
  
  return (
    <div className="transactions-container">
      <div className="page-header">
        <h1>Transactions</h1>
        <div className="header-actions">
          <button className="btn-add-funds" onClick={() => openModal('addFunds')}>
            Add Funds
          </button>
          <button className="btn-add-expense" onClick={() => openModal('addExpense')}>
            Add Expense
          </button>
          <button className="btn-withdraw" onClick={() => openModal('withdrawFunds')}>
            Withdraw
          </button>
        </div>
      </div>
      
      <div className="filters-container">
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="type">Transaction Type</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              <option value="fund">Fund Addition</option>
              <option value="expense">Expense</option>
              <option value="stock_expense">Stock Purchase</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="startDate">From Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="endDate">To Date</label>
            <div className="date-reset-group">
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
              <button className="btn-secondary" onClick={resetFilters}>
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="transactions-summary">
        <div className="summary-card income">
          <h3>Income</h3>
          <p className="amount">₦{formatNumber(totals.income, 2)}</p>
        </div>
        
        <div className="summary-card expenses">
          <h3>Expenses</h3>
          <p className="amount">₦{formatNumber(totals.expenses, 2)}</p>
        </div>
        
        <div className="summary-card net">
          <h3>Net</h3>
          <p className="amount">₦{formatNumber(totals.net, 2)}</p>
        </div>
      </div>
      
      {/* Transactions Table */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-title-icon">📊</span>
            Transaction History
          </h3>
        </div>

        <DataTable
          data={filteredTransactions}
          columns={transactionColumns}
          renderCell={renderTransactionCell}
          enableSorting
          enablePagination
          defaultSort={{ key: 'date', direction: 'desc' }}
          pageSize={10}
          emptyMessage="No transactions found"
          loading={loading}
          rowClassName={(row) => `transaction-row ${row.type}`}
        />
      </section>
      
      {/* Transaction Modal */}
      {activeModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>
              {activeModal === 'addFunds' && 'Add Funds'}
              {activeModal === 'addExpense' && 'Add Expense'}
              {activeModal === 'withdrawFunds' && 'Withdraw Funds'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="amount">Amount ($)*</label>
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
                <button 
                  type="submit" 
                  className={`btn-primary ${activeModal === 'addFunds' ? 'btn-add-funds' : 
                    activeModal === 'addExpense' ? 'btn-add-expense' : 'btn-withdraw'}`}
                >
                  {activeModal === 'addFunds' && 'Add Funds'}
                  {activeModal === 'addExpense' && 'Add Expense'}
                  {activeModal === 'withdrawFunds' && 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Danger Zone Section - Moved to bottom */}
      <div className="danger-zone">
        <h3>🚨 Danger Zone</h3>
        <p>Reset all financial transactions except chicken order payments. This action cannot be undone.</p>
        <button 
          className="btn-danger" 
          onClick={resetTransactions}
          style={{ 
            backgroundColor: '#dc3545', 
            color: 'white',
            fontWeight: 'bold',
            border: '2px solid #bd2130'
          }}
        >
          Reset All Transactions
        </button>
      </div>
    </div>
  )
}

export default Transactions