import './LoadingSpinner.css'

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  text = '', 
  overlay = false,
  className = '' 
}) => {
  const spinnerClasses = [
    'loading-spinner',
    `loading-spinner-${size}`,
    `loading-spinner-${color}`,
    className
  ].filter(Boolean).join(' ')

  const content = (
    <div className={spinnerClasses}>
      <div className="spinner-circle">
        <div className="spinner-inner"></div>
      </div>
      {text && <span className="spinner-text">{text}</span>}
    </div>
  )

  if (overlay) {
    return (
      <div className="loading-overlay">
        {content}
      </div>
    )
  }

  return content
}

export default LoadingSpinner