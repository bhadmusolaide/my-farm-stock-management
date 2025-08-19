import './SortableTableHeader.css'

const SortableTableHeader = ({ 
  children, 
  sortKey, 
  onSort, 
  getSortIcon, 
  className = '',
  sortable = true 
}) => {
  const handleClick = () => {
    if (sortable && onSort) {
      onSort(sortKey)
    }
  }

  const getSortIconElement = () => {
    if (!sortable) return null
    
    const iconType = getSortIcon(sortKey)
    
    switch (iconType) {
      case 'sort-asc':
        return (
          <svg className="sort-icon sort-asc" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 2L9 8H3L6 2Z" />
          </svg>
        )
      case 'sort-desc':
        return (
          <svg className="sort-icon sort-desc" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 10L3 4H9L6 10Z" />
          </svg>
        )
      default:
        return (
          <svg className="sort-icon sort-default" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 2L8 5H4L6 2Z" />
            <path d="M6 10L4 7H8L6 10Z" />
          </svg>
        )
    }
  }

  return (
    <th 
      className={`sortable-header ${sortable ? 'clickable' : ''} ${className}`}
      onClick={handleClick}
      style={{ cursor: sortable ? 'pointer' : 'default' }}
    >
      <div className="header-content">
        <span>{children}</span>
        {getSortIconElement()}
      </div>
    </th>
  )
}

export default SortableTableHeader