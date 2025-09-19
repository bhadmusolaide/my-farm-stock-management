import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatNumber, formatDate } from '../utils/formatters';
import ColumnFilter from '../components/UI/ColumnFilter';
import SortableTableHeader from '../components/UI/SortableTableHeader';
import SortControls from '../components/UI/SortControls';
import useColumnConfig from '../hooks/useColumnConfig';
import useTableSort from '../hooks/useTableSort';
import Pagination from '../components/UI/Pagination';
import usePagination from '../hooks/usePagination';
import './ProcessingManagement.css';

const ProcessingManagement = () => {
  const { liveChickens, dressedChickens, addDressedChicken, updateDressedChicken, deleteDressedChicken } = useAppContext();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('processing');
  
  // State for filters
  const [filters, setFilters] = useState({
    batch_id: '',
    size_category: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  
  // State for modals
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDressedChicken, setEditingDressedChicken] = useState(null);
  
  // Form state for processing
  const [processingFormData, setProcessingFormData] = useState({
    batch_id: '',
    processing_date: '',
    initial_count: '',
    average_weight: '',
    size_category: 'medium',
    storage_location: '',
    expiry_date: '',
    notes: ''
  });
  
  // Form state for editing
  const [editFormData, setEditFormData] = useState({
    batch_id: '',
    processing_date: '',
    initial_count: '',
    current_count: '',
    average_weight: '',
    size_category: 'medium',
    status: 'in-storage',
    storage_location: '',
    expiry_date: '',
    notes: ''
  });

  // Column configurations
  const processingColumns = [
    { key: 'processing_date', label: 'Processing Date' },
    { key: 'batch_id', label: 'Batch ID' },
    { key: 'initial_count', label: 'Initial Count' },
    { key: 'current_count', label: 'Current Count' },
    { key: 'average_weight', label: 'Avg Weight (kg)' },
    { key: 'size_category', label: 'Size Category' },
    { key: 'status', label: 'Status' },
    { key: 'storage_location', label: 'Storage Location' },
    { key: 'expiry_date', label: 'Expiry Date' },
    { key: 'actions', label: 'Actions' }
  ];

  // Column visibility hook
  const columnConfig = useColumnConfig('processingManagement', processingColumns);
  
  // Get filtered dressed chickens
  const getFilteredDressedChickens = () => {
    let filtered = [...(dressedChickens || [])];
    
    if (filters.batch_id) {
      filtered = filtered.filter(item => 
        item.batch_id.toLowerCase().includes(filters.batch_id.toLowerCase())
      );
    }
    
    if (filters.size_category) {
      filtered = filtered.filter(item => item.size_category === filters.size_category);
    }
    
    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    
    if (filters.startDate) {
      filtered = filtered.filter(item => 
        new Date(item.processing_date) >= new Date(filters.startDate)
      );
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(item => 
        new Date(item.processing_date) <= new Date(filters.endDate)
      );
    }
    
    return filtered;
  };
  
  const filteredDressedChickens = getFilteredDressedChickens();
  
  // Sorting hook
  const { sortedData, sortConfig, requestSort, resetSort, getSortIcon } = useTableSort(filteredDressedChickens);
  
  // Pagination
  const pagination = usePagination(sortedData, 10);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      batch_id: '',
      size_category: '',
      status: '',
      startDate: '',
      endDate: ''
    });
  };
  
  // Handle processing form input changes
  const handleProcessingInputChange = (e) => {
    const { name, value } = e.target;
    setProcessingFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Open processing modal
  const openProcessingModal = () => {
    setProcessingFormData({
      batch_id: '',
      processing_date: '',
      initial_count: '',
      average_weight: '',
      size_category: 'medium',
      storage_location: '',
      expiry_date: '',
      notes: ''
    });
    setShowProcessingModal(true);
  };
  
  // Open edit modal
  const openEditModal = (dressedChicken) => {
    setEditingDressedChicken(dressedChicken);
    setEditFormData({
      batch_id: dressedChicken.batch_id || '',
      processing_date: dressedChicken.processing_date || '',
      initial_count: dressedChicken.initial_count || '',
      current_count: dressedChicken.current_count || '',
      average_weight: dressedChicken.average_weight || '',
      size_category: dressedChicken.size_category || 'medium',
      status: dressedChicken.status || 'in-storage',
      storage_location: dressedChicken.storage_location || '',
      expiry_date: dressedChicken.expiry_date || '',
      notes: dressedChicken.notes || ''
    });
    setShowEditModal(true);
  };
  
  // Close modals
  const closeProcessingModal = () => {
    setShowProcessingModal(false);
  };
  
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingDressedChicken(null);
  };
  
  // Handle processing form submission
  const handleProcessingSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await addDressedChicken({
        batch_id: processingFormData.batch_id,
        processing_date: processingFormData.processing_date,
        initial_count: parseInt(processingFormData.initial_count),
        current_count: parseInt(processingFormData.initial_count), // Initially same as initial count
        average_weight: parseFloat(processingFormData.average_weight),
        size_category: processingFormData.size_category,
        storage_location: processingFormData.storage_location,
        expiry_date: processingFormData.expiry_date,
        notes: processingFormData.notes
      });
      
      closeProcessingModal();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };
  
  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateDressedChicken(editingDressedChicken.id, {
        batch_id: editFormData.batch_id,
        processing_date: editFormData.processing_date,
        initial_count: parseInt(editFormData.initial_count),
        current_count: parseInt(editFormData.current_count),
        average_weight: parseFloat(editFormData.average_weight),
        size_category: editFormData.size_category,
        status: editFormData.status,
        storage_location: editFormData.storage_location,
        expiry_date: editFormData.expiry_date,
        notes: editFormData.notes
      });
      
      closeEditModal();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };
  
  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this dressed chicken record?')) {
      try {
        await deleteDressedChicken(id);
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  };
  
  // Calculate summary statistics
  const calculateTotalProcessed = () => {
    return filteredDressedChickens.reduce((total, item) => total + item.initial_count, 0);
  };
  
  const calculateTotalInStorage = () => {
    return filteredDressedChickens.reduce((total, item) => total + item.current_count, 0);
  };
  
  const calculateTotalWeight = () => {
    return filteredDressedChickens.reduce((total, item) => total + (item.current_count * item.average_weight), 0);
  };
  
  // Get available batches for processing
  const getAvailableBatches = () => {
    return liveChickens?.filter(batch => 
      batch.status === 'processing' && 
      !dressedChickens?.some(dc => dc.batch_id === batch.batch_id)
    ) || [];
  };
  
  return (
    <div className="processing-management-container">
      <div className="page-header">
        <h1>Processing & Dressed Chicken Management</h1>
        <div className="header-actions">
          <button className="btn-primary" onClick={openProcessingModal}>
            Process Chickens
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'processing' ? 'active' : ''}`}
          onClick={() => setActiveTab('processing')}
        >
          Dressed Chicken Inventory
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>
      
      {/* Processing Inventory Tab */}
      {activeTab === 'processing' && (
        <>
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Processed</h3>
              <p className="summary-value">{formatNumber(calculateTotalProcessed())} pcs</p>
            </div>
            <div className="summary-card">
              <h3>In Storage</h3>
              <p className="summary-value">{formatNumber(calculateTotalInStorage())} pcs</p>
            </div>
            <div className="summary-card">
              <h3>Total Weight</h3>
              <p className="summary-value">{formatNumber(calculateTotalWeight(), 2)} kg</p>
            </div>
            <div className="summary-card">
              <h3>Batches</h3>
              <p className="summary-value">{filteredDressedChickens.length}</p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="filters-container">
            <div className="filters-grid">
              <div className="filter-group">
                <label htmlFor="batch_id">Batch ID</label>
                <input
                  type="text"
                  id="batch_id"
                  name="batch_id"
                  value={filters.batch_id}
                  onChange={handleFilterChange}
                  placeholder="Search batch ID"
                />
              </div>
              
              <div className="filter-group">
                <label htmlFor="size_category">Size Category</label>
                <select
                  id="size_category"
                  name="size_category"
                  value={filters.size_category}
                  onChange={handleFilterChange}
                >
                  <option value="">All Sizes</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Statuses</option>
                  <option value="in-storage">In Storage</option>
                  <option value="sold">Sold</option>
                  <option value="expired">Expired</option>
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
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            
            <button className="btn-secondary" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
          
          {/* Table Header Controls */}
          <div className="table-header-controls">
            <h3>Dressed Chicken Inventory</h3>
            <ColumnFilter 
              columns={processingColumns}
              visibleColumns={columnConfig.visibleColumns}
              onColumnToggle={columnConfig.toggleColumn}
            />
          </div>
          
          {/* Sort Controls */}
          <SortControls 
            sortConfig={sortConfig}
            onReset={resetSort}
          />
          
          {/* Processing Table */}
          <div className="table-container">
            <table className="processing-table">
              <thead>
                <tr>
                  {columnConfig.isColumnVisible('processing_date') && (
                    <SortableTableHeader sortKey="processing_date" onSort={requestSort} getSortIcon={getSortIcon}>
                      Processing Date
                    </SortableTableHeader>
                  )}
                  {columnConfig.isColumnVisible('batch_id') && (
                    <SortableTableHeader sortKey="batch_id" onSort={requestSort} getSortIcon={getSortIcon}>
                      Batch ID
                    </SortableTableHeader>
                  )}
                  {columnConfig.isColumnVisible('initial_count') && (
                    <SortableTableHeader sortKey="initial_count" onSort={requestSort} getSortIcon={getSortIcon}>
                      Initial Count
                    </SortableTableHeader>
                  )}
                  {columnConfig.isColumnVisible('current_count') && (
                    <SortableTableHeader sortKey="current_count" onSort={requestSort} getSortIcon={getSortIcon}>
                      Current Count
                    </SortableTableHeader>
                  )}
                  {columnConfig.isColumnVisible('average_weight') && (
                    <SortableTableHeader sortKey="average_weight" onSort={requestSort} getSortIcon={getSortIcon}>
                      Avg Weight (kg)
                    </SortableTableHeader>
                  )}
                  {columnConfig.isColumnVisible('size_category') && (
                    <SortableTableHeader sortKey="size_category" onSort={requestSort} getSortIcon={getSortIcon}>
                      Size Category
                    </SortableTableHeader>
                  )}
                  {columnConfig.isColumnVisible('status') && (
                    <SortableTableHeader sortKey="status" onSort={requestSort} getSortIcon={getSortIcon}>
                      Status
                    </SortableTableHeader>
                  )}
                  {columnConfig.isColumnVisible('storage_location') && (
                    <SortableTableHeader sortKey="storage_location" onSort={requestSort} getSortIcon={getSortIcon}>
                      Storage Location
                    </SortableTableHeader>
                  )}
                  {columnConfig.isColumnVisible('expiry_date') && (
                    <SortableTableHeader sortKey="expiry_date" onSort={requestSort} getSortIcon={getSortIcon}>
                      Expiry Date
                    </SortableTableHeader>
                  )}
                  {columnConfig.isColumnVisible('actions') && (
                    <SortableTableHeader sortable={false}>
                      Actions
                    </SortableTableHeader>
                  )}
                </tr>
              </thead>
              <tbody>
                {pagination.currentData.length > 0 ? (
                  pagination.currentData.map(item => {
                    const isExpiringSoon = item.expiry_date && new Date(item.expiry_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
                    
                    return (
                      <tr key={item.id}>
                        {columnConfig.isColumnVisible('processing_date') && <td>{formatDate(item.processing_date)}</td>}
                        {columnConfig.isColumnVisible('batch_id') && <td>{item.batch_id}</td>}
                        {columnConfig.isColumnVisible('initial_count') && <td>{formatNumber(item.initial_count)}</td>}
                        {columnConfig.isColumnVisible('current_count') && <td>{formatNumber(item.current_count)}</td>}
                        {columnConfig.isColumnVisible('average_weight') && <td>{formatNumber(item.average_weight, 2)}</td>}
                        {columnConfig.isColumnVisible('size_category') && <td>{item.size_category}</td>}
                        {columnConfig.isColumnVisible('status') && (
                          <td>
                            <span className={`status-badge ${item.status}`}>
                              {item.status.replace('-', ' ')}
                            </span>
                          </td>
                        )}
                        {columnConfig.isColumnVisible('storage_location') && <td>{item.storage_location || '-'}</td>}
                        {columnConfig.isColumnVisible('expiry_date') && (
                          <td className={isExpiringSoon ? 'expiring-soon' : ''}>
                            {item.expiry_date ? formatDate(item.expiry_date) : '-'}
                          </td>
                        )}
                        {columnConfig.isColumnVisible('actions') && (
                          <td>
                            <div className="action-buttons">
                              <button
                                className="edit-btn-icon"
                                onClick={() => openEditModal(item)}
                                title="Edit record"
                                aria-label="Edit record"
                              >
                                ✏️
                              </button>
                              <button
                                className="delete-btn-icon"
                                onClick={() => handleDelete(item.id)}
                                title="Delete record"
                                aria-label="Delete record"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={columnConfig.visibleColumns.length} className="no-data">
                      No dressed chicken records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.handlePageChange}
            pageSize={pagination.pageSize}
            onPageSizeChange={pagination.handlePageSizeChange}
            totalItems={pagination.totalItems}
          />
        </>
      )}
      
      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <>
          {/* Analytics Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Average Weight</h3>
              <p className="summary-value">
                {filteredDressedChickens.length > 0 
                  ? formatNumber(
                      filteredDressedChickens.reduce((sum, item) => sum + item.average_weight, 0) / 
                      filteredDressedChickens.length, 2
                    ) + ' kg'
                  : '0.00 kg'}
              </p>
            </div>
            <div className="summary-card">
              <h3>Size Distribution</h3>
              <p className="summary-value">
                {(() => {
                  const sizeCounts = filteredDressedChickens.reduce((acc, item) => {
                    acc[item.size_category] = (acc[item.size_category] || 0) + 1;
                    return acc;
                  }, {});
                  return Object.keys(sizeCounts).length > 0 
                    ? Object.entries(sizeCounts).map(([size, count]) => `${size}: ${count}`).join(', ')
                    : 'No data';
                })()}
              </p>
            </div>
            <div className="summary-card">
              <h3>Near Expiry</h3>
              <p className="summary-value">
                {filteredDressedChickens.filter(item => 
                  item.expiry_date && new Date(item.expiry_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                ).length} items
              </p>
            </div>
            <div className="summary-card">
              <h3>Utilization Rate</h3>
              <p className="summary-value">
                {filteredDressedChickens.length > 0 
                  ? formatNumber(
                      (calculateTotalInStorage() / calculateTotalProcessed()) * 100, 1
                    ) + '%'
                  : '0.0%'}
              </p>
            </div>
          </div>

          {/* Size Category Analysis */}
          <div className="analytics-section">
            <h3>Size Category Analysis</h3>
            <div className="table-container">
              <table className="processing-table">
                <thead>
                  <tr>
                    <th>Size Category</th>
                    <th>Total Count</th>
                    <th>Average Weight (kg)</th>
                    <th>Total Weight (kg)</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const sizeCategories = ['small', 'medium', 'large', 'extra-large'];
                    const totalItems = filteredDressedChickens.length;
                    
                    return sizeCategories.map(size => {
                      const items = filteredDressedChickens.filter(item => item.size_category === size);
                      const totalCount = items.reduce((sum, item) => sum + item.current_count, 0);
                      const totalWeight = items.reduce((sum, item) => sum + (item.current_count * item.average_weight), 0);
                      const avgWeight = items.length > 0 
                        ? items.reduce((sum, item) => sum + item.average_weight, 0) / items.length 
                        : 0;
                      
                      return (
                        <tr key={size}>
                          <td>{size.charAt(0).toUpperCase() + size.slice(1)}</td>
                          <td>{formatNumber(totalCount)}</td>
                          <td>{formatNumber(avgWeight, 2)}</td>
                          <td>{formatNumber(totalWeight, 2)}</td>
                          <td>{totalItems > 0 ? formatNumber((totalCount / calculateTotalInStorage()) * 100, 1) + '%' : '0.0%'}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Processing Trends */}
          <div className="analytics-section">
            <h3>Recent Processing Trends (Last 7 Days)</h3>
            <div className="table-container">
              <table className="processing-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Batches Processed</th>
                    <th>Total Count</th>
                    <th>Average Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const last7Days = [];
                    for (let i = 0; i <= 6; i++) {
                      const date = new Date();
                      date.setDate(date.getDate() - i);
                      last7Days.push(date.toISOString().split('T')[0]);
                    }
                    
                    return last7Days.map(date => {
                      const dayItems = filteredDressedChickens.filter(item => item.processing_date === date);
                      const batchesProcessed = dayItems.length;
                      const totalCount = dayItems.reduce((sum, item) => sum + item.initial_count, 0);
                      const avgWeight = dayItems.length > 0 
                        ? dayItems.reduce((sum, item) => sum + item.average_weight, 0) / dayItems.length 
                        : 0;
                      
                      return (
                        <tr key={date}>
                          <td>{formatDate(date)}</td>
                          <td>{batchesProcessed}</td>
                          <td>{formatNumber(totalCount)}</td>
                          <td>{formatNumber(avgWeight, 2)}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {/* Process Chickens Modal */}
      {showProcessingModal && (
        <div className="modal-overlay" onClick={closeProcessingModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Process Chickens</h2>
            
            <form onSubmit={handleProcessingSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="batch_id">Batch ID*</label>
                  <select
                    id="batch_id"
                    name="batch_id"
                    value={processingFormData.batch_id}
                    onChange={handleProcessingInputChange}
                    required
                  >
                    <option value="">Select a batch</option>
                    {getAvailableBatches().map(batch => (
                      <option key={batch.id} value={batch.batch_id}>
                        {batch.batch_id} ({batch.breed}, {batch.current_count} birds)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="processing_date">Processing Date*</label>
                  <input
                    type="date"
                    id="processing_date"
                    name="processing_date"
                    value={processingFormData.processing_date}
                    onChange={handleProcessingInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="initial_count">Count Processed*</label>
                  <input
                    type="number"
                    id="initial_count"
                    name="initial_count"
                    value={processingFormData.initial_count}
                    onChange={handleProcessingInputChange}
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="average_weight">Average Weight (kg)*</label>
                  <input
                    type="number"
                    id="average_weight"
                    name="average_weight"
                    value={processingFormData.average_weight}
                    onChange={handleProcessingInputChange}
                    step="0.01"
                    min="0.1"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="size_category">Size Category*</label>
                  <select
                    id="size_category"
                    name="size_category"
                    value={processingFormData.size_category}
                    onChange={handleProcessingInputChange}
                    required
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra-large">Extra Large</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="storage_location">Storage Location</label>
                  <input
                    type="text"
                    id="storage_location"
                    name="storage_location"
                    value={processingFormData.storage_location}
                    onChange={handleProcessingInputChange}
                    placeholder="e.g., Freezer Unit A"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expiry_date">Expiry Date</label>
                  <input
                    type="date"
                    id="expiry_date"
                    name="expiry_date"
                    value={processingFormData.expiry_date}
                    onChange={handleProcessingInputChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={processingFormData.notes}
                  onChange={handleProcessingInputChange}
                  rows="3"
                  placeholder="Any additional notes about this processing batch"
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeProcessingModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Process Chickens
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Edit Dressed Chicken Record</h2>
            
            <form onSubmit={handleEditSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit_batch_id">Batch ID*</label>
                  <input
                    type="text"
                    id="edit_batch_id"
                    name="batch_id"
                    value={editFormData.batch_id}
                    onChange={handleEditInputChange}
                    required
                    readOnly
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit_processing_date">Processing Date*</label>
                  <input
                    type="date"
                    id="edit_processing_date"
                    name="processing_date"
                    value={editFormData.processing_date}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit_initial_count">Initial Count*</label>
                  <input
                    type="number"
                    id="edit_initial_count"
                    name="initial_count"
                    value={editFormData.initial_count}
                    onChange={handleEditInputChange}
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit_current_count">Current Count*</label>
                  <input
                    type="number"
                    id="edit_current_count"
                    name="current_count"
                    value={editFormData.current_count}
                    onChange={handleEditInputChange}
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit_average_weight">Average Weight (kg)*</label>
                  <input
                    type="number"
                    id="edit_average_weight"
                    name="average_weight"
                    value={editFormData.average_weight}
                    onChange={handleEditInputChange}
                    step="0.01"
                    min="0.1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit_size_category">Size Category*</label>
                  <select
                    id="edit_size_category"
                    name="size_category"
                    value={editFormData.size_category}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra-large">Extra Large</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit_status">Status*</label>
                  <select
                    id="edit_status"
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="in-storage">In Storage</option>
                    <option value="sold">Sold</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit_storage_location">Storage Location</label>
                  <input
                    type="text"
                    id="edit_storage_location"
                    name="storage_location"
                    value={editFormData.storage_location}
                    onChange={handleEditInputChange}
                    placeholder="e.g., Freezer Unit A"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit_expiry_date">Expiry Date</label>
                  <input
                    type="date"
                    id="edit_expiry_date"
                    name="expiry_date"
                    value={editFormData.expiry_date}
                    onChange={handleEditInputChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="edit_notes">Notes</label>
                <textarea
                  id="edit_notes"
                  name="notes"
                  value={editFormData.notes}
                  onChange={handleEditInputChange}
                  rows="3"
                  placeholder="Any additional notes about this processing batch"
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingManagement;