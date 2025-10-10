import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { formatNumber } from '../utils/formatters';
import { useAuth } from './AuthContext';

const FinancialContext = createContext();

export function useFinancialContext() {
  return useContext(FinancialContext);
}

export function FinancialProvider({ children }) {
  const { logAuditAction } = useAuth();
  
  // State management
  const [balance, setBalanceState] = useState(0);
  const [transactions, setTransactionsState] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper functions to update state and save to localStorage
  const setBalance = (newBalance) => {
    setBalanceState(newBalance);
    try {
      localStorage.setItem('balance', newBalance.toString());
    } catch (e) {
      console.warn('Failed to save balance to localStorage:', e);
    }
  };

  const setTransactions = (newTransactions) => {
    setTransactionsState(newTransactions);
    try {
      localStorage.setItem('transactions', JSON.stringify(newTransactions));
    } catch (e) {
      console.warn('Failed to save transactions to localStorage:', e);
    }
  };

  // Load data from Supabase
  useEffect(() => {
    const loadFinancialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });

        if (transactionsError) throw transactionsError;
        setTransactions(transactionsData || []);

        // Load balance
        const { data: balanceData, error: balanceError } = await supabase
          .from('balance')
          .select('amount')
          .eq('id', 1)
          .single();

        if (balanceError && !balanceError.message.includes('relation "balance" does not exist')) {
          throw balanceError;
        }
        const currentBalance = balanceData?.amount || 0;
        setBalance(currentBalance);

      } catch (err) {
        console.error('Error loading financial data:', err);
        
        // Fallback to localStorage if Supabase fails
        const localBalance = localStorage.getItem('balance');
        if (localBalance && localBalance !== 'undefined') {
          setBalance(parseFloat(localBalance));
        }

        const localTransactions = localStorage.getItem('transactions');
        if (localTransactions && localTransactions !== 'undefined') {
          try {
            setTransactions(JSON.parse(localTransactions));
          } catch (e) {
            console.warn('Invalid transactions data in localStorage:', e);
          }
        }

        setError('Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    loadFinancialData();
  }, []);

  // Financial operations
  const addFunds = async (amount, description = 'Funds added') => {
    try {
      const transaction = {
        id: Date.now().toString(),
        type: 'fund',
        amount: parseFloat(amount),
        description,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      // Save transaction to Supabase
      const { error: transactionError } = await supabase.from('transactions').insert(transaction);
      if (transactionError) throw transactionError;

      // Update balance
      const newBalance = balance + parseFloat(amount);
      const { error: balanceError } = await supabase
        .from('balance')
        .upsert({ id: 1, amount: newBalance });
      if (balanceError) throw balanceError;

      // Update local state
      setTransactions(prev => [transaction, ...prev]);
      setBalance(newBalance);

      // Log audit action
      await logAuditAction('CREATE', 'transactions', transaction.id, null, transaction);

      return { transaction, newBalance };
    } catch (err) {
      console.error('Error adding funds:', err);
      throw err;
    }
  };

  const addExpense = async (amount, description = 'Expense') => {
    try {
      const transaction = {
        id: Date.now().toString(),
        type: 'expense',
        amount: parseFloat(amount),
        description,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      // Save transaction to Supabase
      const { error: transactionError } = await supabase.from('transactions').insert(transaction);
      if (transactionError) throw transactionError;

      // Update balance
      const newBalance = balance - parseFloat(amount);
      const { error: balanceError } = await supabase
        .from('balance')
        .upsert({ id: 1, amount: newBalance });
      if (balanceError) throw balanceError;

      // Update local state
      setTransactions(prev => [transaction, ...prev]);
      setBalance(newBalance);

      // Log audit action
      await logAuditAction('CREATE', 'transactions', transaction.id, null, transaction);

      return { transaction, newBalance };
    } catch (err) {
      console.error('Error adding expense:', err);
      throw err;
    }
  };

  const withdrawFunds = async (amount, description = 'Funds withdrawn') => {
    try {
      if (parseFloat(amount) > balance) {
        throw new Error('Insufficient funds');
      }

      const transaction = {
        id: Date.now().toString(),
        type: 'withdrawal',
        amount: parseFloat(amount),
        description,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      // Save transaction to Supabase
      const { error: transactionError } = await supabase.from('transactions').insert(transaction);
      if (transactionError) throw transactionError;

      // Update balance
      const newBalance = balance - parseFloat(amount);
      const { error: balanceError } = await supabase
        .from('balance')
        .upsert({ id: 1, amount: newBalance });
      if (balanceError) throw balanceError;

      // Update local state
      setTransactions(prev => [transaction, ...prev]);
      setBalance(newBalance);

      // Log audit action
      await logAuditAction('CREATE', 'transactions', transaction.id, null, transaction);

      return { transaction, newBalance };
    } catch (err) {
      console.error('Error withdrawing funds:', err);
      throw err;
    }
  };

  const clearBalance = async () => {
    try {
      const transaction = {
        id: Date.now().toString(),
        type: 'clear',
        amount: balance,
        description: 'Balance cleared',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      // Save transaction to Supabase
      const { error: transactionError } = await supabase.from('transactions').insert(transaction);
      if (transactionError) throw transactionError;

      // Update balance to 0
      const { error: balanceError } = await supabase
        .from('balance')
        .upsert({ id: 1, amount: 0 });
      if (balanceError) throw balanceError;

      // Update local state
      setTransactions(prev => [transaction, ...prev]);
      setBalance(0);

      // Log audit action
      await logAuditAction('CREATE', 'transactions', transaction.id, null, transaction);

      return { transaction, newBalance: 0 };
    } catch (err) {
      console.error('Error clearing balance:', err);
      throw err;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const transactionToDelete = transactions.find(t => t.id === id);
      if (!transactionToDelete) throw new Error('Transaction not found');

      // Delete from Supabase
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;

      // Recalculate balance by removing this transaction's effect
      let balanceAdjustment = 0;
      if (transactionToDelete.type === 'fund') {
        balanceAdjustment = -transactionToDelete.amount;
      } else if (transactionToDelete.type === 'expense' || transactionToDelete.type === 'withdrawal') {
        balanceAdjustment = transactionToDelete.amount;
      } else if (transactionToDelete.type === 'clear') {
        // For clear transactions, we need to restore the previous balance
        // This is complex, so we'll just recalculate from all remaining transactions
        const remainingTransactions = transactions.filter(t => t.id !== id);
        const recalculatedBalance = remainingTransactions.reduce((acc, t) => {
          if (t.type === 'fund') return acc + t.amount;
          if (t.type === 'expense' || t.type === 'withdrawal') return acc - t.amount;
          if (t.type === 'clear') return 0;
          return acc;
        }, 0);
        
        const { error: balanceError } = await supabase
          .from('balance')
          .upsert({ id: 1, amount: recalculatedBalance });
        if (balanceError) throw balanceError;
        
        setBalance(recalculatedBalance);
        setTransactions(prev => prev.filter(t => t.id !== id));
        
        // Log audit action
        await logAuditAction('DELETE', 'transactions', id, transactionToDelete, null);
        
        return { transaction: transactionToDelete, newBalance: recalculatedBalance };
      }

      if (transactionToDelete.type !== 'clear') {
        const newBalance = balance + balanceAdjustment;
        const { error: balanceError } = await supabase
          .from('balance')
          .upsert({ id: 1, amount: newBalance });
        if (balanceError) throw balanceError;
        
        setBalance(newBalance);
      }

      // Update local state
      setTransactions(prev => prev.filter(t => t.id !== id));

      // Log audit action
      await logAuditAction('DELETE', 'transactions', id, transactionToDelete, null);

      return { transaction: transactionToDelete, newBalance: balance + balanceAdjustment };
    } catch (err) {
      console.error('Error deleting transaction:', err);
      throw err;
    }
  };

  // Financial statistics
  const financialStats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'fund')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense' || t.type === 'stock_expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = transactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    const netIncome = totalIncome - totalExpenses - totalWithdrawals;

    // Monthly breakdown
    const monthlyData = {};
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, withdrawals: 0 };
      }
      
      if (transaction.type === 'fund') {
        monthlyData[monthKey].income += transaction.amount;
      } else if (transaction.type === 'expense' || transaction.type === 'stock_expense') {
        monthlyData[monthKey].expenses += transaction.amount;
      } else if (transaction.type === 'withdrawal') {
        monthlyData[monthKey].withdrawals += transaction.amount;
      }
    });

    return {
      totalIncome,
      totalExpenses,
      totalWithdrawals,
      netIncome,
      currentBalance: balance,
      transactionCount: transactions.length,
      monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data,
        net: data.income - data.expenses - data.withdrawals
      }))
    };
  }, [transactions, balance]);

  // Utility functions
  const getTransactionsByType = (type) => {
    return transactions.filter(t => t.type === type);
  };

  const getTransactionsByDateRange = (startDate, endDate) => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
    });
  };

  const value = {
    // State
    balance,
    transactions,
    loading,
    error,

    // Operations
    addFunds,
    addExpense,
    withdrawFunds,
    clearBalance,
    deleteTransaction,

    // Statistics
    financialStats,

    // Utility functions
    getTransactionsByType,
    getTransactionsByDateRange
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
}

export { FinancialContext };
