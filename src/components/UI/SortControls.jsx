import './SortControls.css'

const SortControls = ({ sortConfig, onReset, className = '' }) => {
  if (!sortConfig) {
    return null
  }

  const getSortLabel = () => {
    if (!sortConfig.key) return ''
    
    const direction = sortConfig.direction === 'asc' ? 'ascending' : 'descending'
    const columnName = sortConfig.key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
    const formattedColumnName = columnName.charAt(0).toUpperCase() + columnName.slice(1)
    
    return `Sorted by ${formattedColumnName} (${direction})`
  }

  return (
    <div className={`sort-controls ${className}`}>
      <div className="sort-status">
        <span className="sort-label">{getSortLabel()}</span>
      </div>
      <button 
        type="button"
        className="reset-sort-btn"
        onClick={onReset}
        title="Reset sorting to default"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
        </svg>
        Reset Sort
      </button>
    </div>
  )
}

export default SortControls