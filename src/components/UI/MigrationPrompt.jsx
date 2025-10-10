import { useState } from 'react'
import { useAppContext } from '../../context'
import './MigrationPrompt.css'

const MigrationPrompt = () => {
  const { performMigration, migrationStatus } = useAppContext()
  const [isConfirming, setIsConfirming] = useState(false)

  const handleMigration = async () => {
    if (!isConfirming) {
      setIsConfirming(true)
      return
    }

    try {
      await performMigration()
    } catch (error) {
      console.error('Migration failed:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="migration-container">
      <div className="migration-card">
        <h2>Data Migration Required</h2>
        <p>
          We've detected data in your browser's local storage that needs to be migrated to our new database system.
          This will allow you to access your data from any device and ensure it's safely backed up.
        </p>
        
        {migrationStatus.error && (
          <div className="migration-error">
            <p>Error: {migrationStatus.error}</p>
          </div>
        )}
        
        {migrationStatus.inProgress ? (
          <div className="migration-progress">
            <p>Migration in progress... Please don't close this window.</p>
            <div className="loader"></div>
          </div>
        ) : (
          <div className="migration-actions">
            {isConfirming ? (
              <>
                <p className="confirm-text">Are you sure you want to migrate your data?</p>
                <div className="button-group">
                  <button 
                    className="btn btn-primary" 
                    onClick={handleMigration}
                  >
                    Yes, Migrate My Data
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setIsConfirming(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={handleMigration}
              >
                Migrate Data Now
              </button>
            )}
          </div>
        )}
        
        <div className="migration-info">
          <h3>What will be migrated:</h3>
          <ul>
            <li>Chicken orders</li>
            <li>Stock inventory</li>
            <li>Transaction history</li>
            <li>Current balance</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default MigrationPrompt