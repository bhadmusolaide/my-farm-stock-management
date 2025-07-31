import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('chicken_stock_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem('chicken_stock_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      // Query the users table directly
      const { data: users, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .limit(1);

      if (queryError) {
        throw new Error('Database connection error');
      }

      if (!users || users.length === 0) {
        throw new Error('Invalid email or password');
      }

      const userData = users[0];

      // Use Supabase auth for password verification
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw new Error('Invalid email or password');
      }

      // Store user data
      const userSession = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        loginTime: new Date().toISOString()
      };

      setUser(userSession);
      localStorage.setItem('chicken_stock_user', JSON.stringify(userSession));

      // Log the login action
      await logAuditAction('LOGIN', 'users', userData.id, null, null);

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user) {
        // Log the logout action
        await logAuditAction('LOGOUT', 'users', user.id, null, null);
      }
    } catch (err) {
      console.error('Error logging logout:', err);
    }

    setUser(null);
    localStorage.removeItem('chicken_stock_user');
  };

  const logAuditAction = async (action, tableName, recordId, oldValues, newValues) => {
    try {
      if (!user && action !== 'LOGIN') return;

      const auditData = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: user?.id || 'anonymous',
        action,
        table_name: tableName,
        record_id: recordId,
        old_values: oldValues ? JSON.stringify(oldValues) : null,
        new_values: newValues ? JSON.stringify(newValues) : null,
        ip_address: 'localhost', // In production, get real IP
        user_agent: navigator.userAgent
      };

      await supabase.from('audit_logs').insert([auditData]);
    } catch (err) {
      console.error('Error logging audit action:', err);
    }
  };

  const createUser = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      // Check if user already exists
      const { data: existingUsers } = await supabase
        .from('users')
        .select('email')
        .eq('email', userData.email)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const newUser = {
        id: `user-${Date.now()}`,
        email: userData.email,
        password_hash: null, // Will be handled by Supabase auth
        full_name: userData.full_name,
        role: userData.role || 'user',
        is_active: true
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert([newUser]);

      if (insertError) {
        throw new Error('Failed to create user');
      }

      // Log the user creation
      await logAuditAction('CREATE', 'users', newUser.id, null, newUser);

      return { success: true, user: newUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    logAuditAction,
    createUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};