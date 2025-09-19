import { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { formatNumber, formatDate } from '../utils/formatters'
import Pagination from '../components/UI/Pagination'
import usePagination from '../hooks/usePagination'
import SortableTableHeader from '../components/UI/SortableTableHeader'
import SortControls from '../components/UI/SortControls'
import useTableSort from '../hooks/useTableSort'
import './Transactions.css'

const Transactions = () => {
  const { transactions, addFunds, addExpense, withdrawFunds } = useAppContext()
  

  
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
    let filtered = [...transactions]
    
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
  
  // Sorting hook with initial sort by date descending
  const { sortedData, sortConfig, requestSort, resetSort, getSortIcon } = useTableSort(
    filteredTransactions, 
    { key: 'date', direction: 'desc' } // Initial sort by date descending
  )
  
  // Pagination for transactions
  const transactionsPagination = usePagination(sortedData, 10)
  
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
  
  // Get transaction type class
  const getTransactionTypeClass = (type) => {
    switch (type) {
      case 'fund':
        return 'transaction-fund'
      case 'expense':
      case 'stock_expense':
        return 'transaction-expense'
      case 'withdrawal':
        return 'transaction-withdrawal'
      default:
        return ''
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
      
      {/* Sort Controls */}
      <SortControls 
        sortConfig={sortConfig}
        onReset={resetSort}
      />

      <div className="table-container">
        <table className="transactions-table">
          <thead>
            <tr>
              <SortableTableHeader sortKey="date" onSort={requestSort} getSortIcon={getSortIcon}>
                Date
              </SortableTableHeader>
              <SortableTableHeader sortKey="type" onSort={requestSort} getSortIcon={getSortIcon}>
                Type
              </SortableTableHeader>
              <SortableTableHeader sortKey="description" onSort={requestSort} getSortIcon={getSortIcon}>
                Description
              </SortableTableHeader>
              <SortableTableHeader sortKey="amount" onSort={requestSort} getSortIcon={getSortIcon}>
                Amount
              </SortableTableHeader>
            </tr>
          </thead>
          <tbody>
            {transactionsPagination.currentData.length > 0 ? (
              transactionsPagination.currentData.map(transaction => (
                <tr 
                  key={transaction.id}
                  className={getTransactionTypeClass(transaction.type)}
                >
                  <td>{formatDate(transaction.date)}</td>
                  <td>
                    <span className={`transaction-type ${transaction.type}`}>
                      {getTransactionTypeDisplay(transaction.type)}
                    </span>
                  </td>
                  <td>{transaction.description}</td>
                  <td className="amount">
                    {transaction.type === 'fund' ? '+' : '-'}
                    ₦{formatNumber(transaction.amount, 2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-data">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Transactions Pagination */}
      <Pagination
        currentPage={transactionsPagination.currentPage}
        totalPages={transactionsPagination.totalPages}
        onPageChange={transactionsPagination.handlePageChange}
        pageSize={transactionsPagination.pageSize}
        onPageSizeChange={transactionsPagination.handlePageSizeChange}
        totalItems={transactionsPagination.totalItems}
      />
      
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
    </div>
  )
}

export default Transactions