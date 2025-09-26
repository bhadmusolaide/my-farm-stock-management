import { createContext, useContext, useState, useCallback } from 'react'
import Notification from '../components/Notification/Notification'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    const notification = { id, message, type, duration }
    
    setNotifications(prev => [...prev, notification])
    
    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const showSuccess = useCallback((message, duration) => {
    return addNotification(message, 'success', duration)
  }, [addNotification])

  const showError = useCallback((message, duration) => {
    return addNotification(message, 'error', duration)
  }, [addNotification])

  const showWarning = useCallback((message, duration) => {
    return addNotification(message, 'warning', duration)
  }, [addNotification])

  const showInfo = useCallback((message, duration) => {
    return addNotification(message, 'info', duration)
  }, [addNotification])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const value = {
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="notification-container">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}