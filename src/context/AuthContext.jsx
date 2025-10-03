import { createContext, useContext, useState, useEffect } from 'react';
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

  // Audit logging batch state
  const [auditBatch, setAuditBatch] = useState([]);
  const [auditBatchTimeout, setAuditBatchTimeout] = useState(null);

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

  // Cleanup effect to flush remaining audit logs
  useEffect(() => {
    return () => {
      if (auditBatchTimeout) {
        clearTimeout(auditBatchTimeout);
      }
      // Flush any remaining audit logs
      if (auditBatch.length > 0) {
        flushAuditBatch();
      }
    };
  }, [auditBatch, auditBatchTimeout]);

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

  // Batch flush function for audit logs
  const flushAuditBatch = async () => {
    if (auditBatch.length === 0) return;

    try {
      const batchToFlush = [...auditBatch];
      setAuditBatch([]);

      await supabase.from('audit_logs').insert(batchToFlush);
    } catch (err) {
      console.error('Error flushing audit batch:', err);
      // Re-queue failed batch items
      setAuditBatch(prev => [...prev, ...auditBatch]);
    }
  };

  const logAuditAction = async (action, tableName, recordId, oldValues, newValues, forceImmediate = false) => {
    try {
      if (!user && action !== 'LOGIN') return;

      // Conditional logging: skip certain non-critical actions
      const skipActions = ['VIEW', 'SEARCH', 'FILTER'];
      if (skipActions.includes(action) && !forceImmediate) return;

      const auditData = {
        user_id: user?.id || null,
        action,
        table_name: tableName,
        record_id: recordId,
        old_values: oldValues ? JSON.stringify(oldValues) : null,
        new_values: newValues ? JSON.stringify(newValues) : null,
        ip_address: 'localhost', // In production, get real IP
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      };

      // For critical actions, log immediately
      const criticalActions = ['DELETE', 'LOGIN', 'LOGOUT', 'CREATE'];
      if (criticalActions.includes(action) || forceImmediate) {
        await supabase.from('audit_logs').insert([auditData]);
        return;
      }

      // Add to batch
      setAuditBatch(prev => [...prev, auditData]);

      // Set timeout to flush batch if not already set
      if (!auditBatchTimeout) {
        const timeout = setTimeout(() => {
          flushAuditBatch();
          setAuditBatchTimeout(null);
        }, 5000); // Flush every 5 seconds
        setAuditBatchTimeout(timeout);
      }

      // Flush immediately if batch gets too large
      if (auditBatch.length >= 10) {
        if (auditBatchTimeout) {
          clearTimeout(auditBatchTimeout);
          setAuditBatchTimeout(null);
        }
        await flushAuditBatch();
      }
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