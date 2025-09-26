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
import './BatchRelationshipMapping.css';

const BatchRelationshipMapping = () => {
  const { 
    liveChickens, 
    dressedChickens, 
    feedInventory, 
    batchRelationships, 
    addBatchRelationship, 
    updateBatchRelationship, 
    deleteBatchRelationship 
  } = useAppContext();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('relationships');
  
  // State for filters
  const [filters, setFilters] = useState({
    source_batch_type: '',
    target_batch_type: '',
    relationship_type: '',
    startDate: '',
    endDate: ''
  });
  
  // State for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState(null);
  
  // Form state for adding relationship
  const [addFormData, setAddFormData] = useState({
    source_batch_id: '',
    source_batch_type: 'live_chickens',
    target_batch_id: '',
    target_batch_type: 'dressed_chickens',
    relationship_type: 'processed_from',
    quantity: '',
    notes: ''
  });
  
  // Form state for editing relationship
  const [editFormData, setEditFormData] = useState({
    source_batch_id: '',
    source_batch_type: 'live_chickens',
    target_batch_id: '',
    target_batch_type: 'dressed_chickens',
    relationship_type: 'processed_from',
    quantity: '',
    notes: ''
  });

  // Column configurations
  const relationshipColumns = [
    { key: 'created_at', label: 'Date' },
    { key: 'source_batch', label: 'Source Batch' },
    { key: 'source_type', label: 'Source Type' },
    { key: 'target_batch', label: 'Target Batch' },
    { key: 'target_type', label: 'Target Type' },
    { key: 'relationship_type', label: 'Relationship' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'actions', label: 'Actions' }
  ];

  // Column visibility hook
  const columnConfig = useColumnConfig('batchRelationships', relationshipColumns);
  
  // Get filtered relationships
  const getFilteredRelationships = () => {
    let filtered = [...(batchRelationships || [])];
    
    if (filters.source_batch_type) {
      filtered = filtered.filter(item => item.source_batch_type === filters.source_batch_type);
    }
    
    if (filters.target_batch_type) {
      filtered = filtered.filter(item => item.target_batch_type === filters.target_batch_type);
    }
    
    if (filters.relationship_type) {
      filtered = filtered.filter(item => item.relationship_type === filters.relationship_type);
    }
    
    if (filters.startDate) {
      filtered = filtered.filter(item => 
        new Date(item.created_at) >= new Date(filters.startDate)
      );
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(item => 
        new Date(item.created_at) <= new Date(filters.endDate)
      );
    }
    
    return filtered;
  };
  
  const filteredRelationships = getFilteredRelationships();
  
  // Sorting hook
  const { sortedData, sortConfig, requestSort, resetSort, getSortIcon } = useTableSort(filteredRelationships);
  
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
      source_batch_type: '',
      target_batch_type: '',
      relationship_type: '',
      startDate: '',
      endDate: ''
    });
  };
  
  // Handle add form input changes
  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Open add modal
  const openAddModal = () => {
    setAddFormData({
      source_batch_id: '',
      source_batch_type: 'live_chickens',
      target_batch_id: '',
      target_batch_type: 'dressed_chickens',
      relationship_type: 'processed_from',
      quantity: '',
      notes: ''
    });
    setShowAddModal(true);
  };
  
  // Open edit modal
  const openEditModal = (relationship) => {
    setEditingRelationship(relationship);
    setEditFormData({
      source_batch_id: relationship.source_batch_id || '',
      source_batch_type: relationship.source_batch_type || 'live_chickens',
      target_batch_id: relationship.target_batch_id || '',
      target_batch_type: relationship.target_batch_type || 'dressed_chickens',
      relationship_type: relationship.relationship_type || 'processed_from',
      quantity: relationship.quantity || '',
      notes: relationship.notes || ''
    });
    setShowEditModal(true);
  };
  
  // Close modals
  const closeAddModal = () => {
    setShowAddModal(false);
  };
  
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingRelationship(null);
  };
  
  // Handle add form submission
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await addBatchRelationship({
        source_batch_id: addFormData.source_batch_id,
        source_batch_type: addFormData.source_batch_type,
        target_batch_id: addFormData.target_batch_id,
        target_batch_type: addFormData.target_batch_type,
        relationship_type: addFormData.relationship_type,
        quantity: parseInt(addFormData.quantity) || null,
        notes: addFormData.notes
      });
      
      closeAddModal();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };
  
  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateBatchRelationship(editingRelationship.id, {
        source_batch_id: editFormData.source_batch_id,
        source_batch_type: editFormData.source_batch_type,
        target_batch_id: editFormData.target_batch_id,
        target_batch_type: editFormData.target_batch_type,
        relationship_type: editFormData.relationship_type,
        quantity: parseInt(editFormData.quantity) || null,
        notes: editFormData.notes
      });
      
      closeEditModal();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };
  
  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this batch relationship?')) {
      try {
        await deleteBatchRelationship(id);
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  };
  
  // Get batch display name
  const getBatchDisplayName = (batchId, batchType) => {
    switch (batchType) {
      case 'live_chickens':
        const liveBatch = liveChickens?.find(b => b.id === batchId);
        return liveBatch ? `${liveBatch.batch_id} (${liveBatch.breed})` : batchId;
      case 'dressed_chickens':
        const dressedBatch = dressedChickens?.find(b => b.id === batchId);
        return dressedBatch ? `${dressedBatch.batch_id} (${dressedBatch.size_category})` : batchId;
      case 'feed_inventory':
        const feedBatch = feedInventory?.find(b => b.id === batchId);
        return feedBatch ? `${feedBatch.batch_number} (${feedBatch.feed_type})` : batchId;
      default:
        return batchId;
    }
  };
  
  // Get relationship type display name
  const getRelationshipTypeName = (type) => {
    const types = {
      'fed_to': 'Fed To',
      'processed_from': 'Processed From',
      'sold_to': 'Sold To',
      'transferred_to': 'Transferred To'
    };
    return types[type] || type;
  };
  
  // Get batch options for select dropdowns
  const getBatchOptions = (batchType) => {
    switch (batchType) {
      case 'live_chickens':
        return liveChickens?.filter(batch => batch.status !== 'completed').map(batch => ({
          value: batch.id,
          label: `${batch.batch_id} (${batch.breed}, ${batch.current_count} birds)`
        })) || [];
      case 'dressed_chickens':
        return dressedChickens?.map(batch => ({
          value: batch.id,
          label: `${batch.batch_id} (${batch.size_category}, ${batch.current_count} pcs)`
        })) || [];
      case 'feed_inventory':
        return feedInventory?.map(batch => ({
          value: batch.id,
          label: `${batch.batch_number} (${batch.feed_type}, ${batch.quantity_kg} kg)`
        })) || [];
      default:
        return [];
    }
  };
  
  // Update target batch options when source batch type changes
  useEffect(() => {
    if (addFormData.source_batch_type === addFormData.target_batch_type) {
      setAddFormData(prev => ({
        ...prev,
        target_batch_type: prev.target_batch_type === 'live_chickens' ? 'dressed_chickens' : 'live_chickens'
      }));
    }
  }, [addFormData.source_batch_type]);
  
  // Update target batch options when source batch type changes for edit form
  useEffect(() => {
    if (editFormData.source_batch_type === editFormData.target_batch_type && editingRelationship) {
      setEditFormData(prev => ({
        ...prev,
        target_batch_type: prev.target_batch_type === 'live_chickens' ? 'dressed_chickens' : 'live_chickens'
      }));
    }
  }, [editFormData.source_batch_type, editingRelationship]);

  return (
    <div className="batch-relationship-container">
      <div className="page-header">
        <h1>Batch Relationship Mapping</h1>
        <div className="header-actions">
          <button className="btn-primary" onClick={openAddModal}>
            Add Relationship
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'relationships' ? 'active' : ''}`}
          onClick={() => setActiveTab('relationships')}
        >
          Batch Relationships
        </button>
        <button 
          className={`tab-btn ${activeTab === 'visualization' ? 'active' : ''}`}
          onClick={() => setActiveTab('visualization')}
        >
          Visualization
        </button>
      </div>
      
      {/* Relationships Tab */}
      {activeTab === 'relationships' && (
        <>
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Relationships</h3>
              <p className="summary-value">{formatNumber(filteredRelationships.length)}</p>
            </div>
            <div className="summary-card">
              <h3>Feed Relationships</h3>
              <p className="summary-value">
                {formatNumber(filteredRelationships.filter(r => r.relationship_type === 'fed_to').length)}
              </p>
            </div>
            <div className="summary-card">
              <h3>Processing Relationships</h3>
              <p className="summary-value">
                {formatNumber(filteredRelationships.filter(r => r.relationship_type === 'processed_from').length)}
              </p>
            </div>
            <div className="summary-card">
              <h3>Unique Batches</h3>
              <p className="summary-value">
                {formatNumber(
                  new Set([
                    ...filteredRelationships.map(r => r.source_batch_id),
                    ...filteredRelationships.map(r => r.target_batch_id)
                  ]).size
                )}
              </p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="filters-container">
            <div className="filters-grid">
              <div className="filter-group">
                <label htmlFor="source_batch_type">Source Type</label>
                <select
                  id="source_batch_type"
                  name="source_batch_type"
                  value={filters.source_batch_type}
                  onChange={handleFilterChange}
                >
                  <option value="">All Source Types</option>
                  <option value="live_chickens">Live Chickens</option>
                  <option value="dressed_chickens">Dressed Chickens</option>
                  <option value="feed_inventory">Feed Inventory</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="target_batch_type">Target Type</label>
                <select
                  id="target_batch_type"
                  name="target_batch_type"
                  value={filters.target_batch_type}
                  onChange={handleFilterChange}
                >
                  <option value="">All Target Types</option>
                  <option value="live_chickens">Live Chickens</option>
                  <option value="dressed_chickens">Dressed Chickens</option>
                  <option value="feed_inventory">Feed Inventory</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="relationship_type">Relationship Type</label>
                <select
                  id="relationship_type"
                  name="relationship_type"
                  value={filters.relationship_type}
                  onChange={handleFilterChange}
                >
                  <option value="">All Relationships</option>
                  <option value="fed_to">Fed To</option>
                  <option value="processed_from">Processed From</option>
                  <option value="sold_to">Sold To</option>
                  <option value="transferred_to">Transferred To</option>
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
            <h3>Batch Relationships</h3>
            <ColumnFilter 
              columns={relationshipColumns}
              visibleColumns={columnConfig.visibleColumns}
              onColumnToggle={columnConfig.toggleColumn}
            />
          </div>
          
          {/* Sort Controls */}
          <SortControls 
            sortConfig={sortConfig}
            onReset={resetSort}
          />
          
          {/* Relationships Table */}
          <div className="table-container">
            <table className="relationships-table">
              <thead>
                <tr>
                  {columnConfig.isColumnVisible('created_at') && (
                    <SortableTableHeader sortKey="created_at" onSort={requestSort} getSortIcon={getSortIcon}>
                      Date
                    </SortableTableHeader>
                  )}
                  {columnConfig.isColumnVisible('source_batch') && (
                    <SortableTableHeader sortKey="source_batch_id" onSort={requestSort} getSortIcon={getSortIcon}>
                      Source Batch
                    </SortableTableHeader>
                  )}
                  {columnConfig.isColumnVisible('source_type') && (
                    <SortableTableHeader sortKey="source_batch_type" onSort={requestSort} getSortIcon={getSortIcon}>
                      Source Type
                    </SortableTableHeader>
                  )}
                  {columnConfig.isColumnVisible('target_batch') && (
                    <SortableTableHeader sortKey="target_batch_id" onSort={requestSort} getSortIcon={getSortIcon}>
                      Target Batch
                    </SortableTableHeader>
                  )}
                  {columnConfig.isColumnVisible('target_type') && (
                    <SortableTableHeader sortKey="target_batch_type" onSort={requestSort} getSortIcon={getSortIcon}>
                      Target Type
                    </SortableTableHeader>
                  )}
                  {columnConfig.isColumnVisible('relationship_type') && (
                    <SortableTableHeader sortKey="relationship_type" onSort={requestSort} getSortIcon={getSortIcon}>
                      Relationship
                    </SortableTableHeader>
                  )}
                  {columnConfig.isColumnVisible('quantity') && (
                    <SortableTableHeader sortKey="quantity" onSort={requestSort} getSortIcon={getSortIcon}>
                      Quantity
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
                  pagination.currentData.map(item => (
                    <tr key={item.id}>
                      {columnConfig.isColumnVisible('created_at') && <td>{formatDate(item.created_at)}</td>}
                      {columnConfig.isColumnVisible('source_batch') && (
                        <td>{getBatchDisplayName(item.source_batch_id, item.source_batch_type)}</td>
                      )}
                      {columnConfig.isColumnVisible('source_type') && <td>{item.source_batch_type.replace('_', ' ')}</td>}
                      {columnConfig.isColumnVisible('target_batch') && (
                        <td>{getBatchDisplayName(item.target_batch_id, item.target_batch_type)}</td>
                      )}
                      {columnConfig.isColumnVisible('target_type') && <td>{item.target_batch_type.replace('_', ' ')}</td>}
                      {columnConfig.isColumnVisible('relationship_type') && (
                        <td>{getRelationshipTypeName(item.relationship_type)}</td>
                      )}
                      {columnConfig.isColumnVisible('quantity') && <td>{item.quantity ? formatNumber(item.quantity) : '-'}</td>}
                      {columnConfig.isColumnVisible('actions') && (
                        <td>
                          <div className="action-buttons">
                            <button
                              className="edit-btn-icon"
                              onClick={() => openEditModal(item)}
                              title="Edit relationship"
                              aria-label="Edit relationship"
                            >
                              ✏️
                            </button>
                            <button
                              className="delete-btn-icon"
                              onClick={() => handleDelete(item.id)}
                              title="Delete relationship"
                              aria-label="Delete relationship"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columnConfig.visibleColumns.length} className="no-data">
                      No batch relationships found
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
      
      {/* Visualization Tab */}
      {activeTab === 'visualization' && (
        <div className="visualization-container">
          <h3>Batch Relationship Visualization</h3>
          <div className="visualization-content">
            <div className="visualization-placeholder">
              <p>Batch relationship visualization will be displayed here.</p>
              <p>This feature shows how different batches are connected through various relationships.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Relationship Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add Batch Relationship</h2>
            
            <form onSubmit={handleAddSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="add_source_batch_type">Source Batch Type*</label>
                  <select
                    id="add_source_batch_type"
                    name="source_batch_type"
                    value={addFormData.source_batch_type}
                    onChange={handleAddInputChange}
                    required
                  >
                    <option value="live_chickens">Live Chickens</option>
                    <option value="dressed_chickens">Dressed Chickens</option>
                    <option value="feed_inventory">Feed Inventory</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="add_source_batch_id">Source Batch*</label>
                  <select
                    id="add_source_batch_id"
                    name="source_batch_id"
                    value={addFormData.source_batch_id}
                    onChange={handleAddInputChange}
                    required
                  >
                    <option value="">Select a batch</option>
                    {getBatchOptions(addFormData.source_batch_type).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="add_target_batch_type">Target Batch Type*</label>
                  <select
                    id="add_target_batch_type"
                    name="target_batch_type"
                    value={addFormData.target_batch_type}
                    onChange={handleAddInputChange}
                    required
                  >
                    <option value="live_chickens">Live Chickens</option>
                    <option value="dressed_chickens">Dressed Chickens</option>
                    <option value="feed_inventory">Feed Inventory</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="add_target_batch_id">Target Batch*</label>
                  <select
                    id="add_target_batch_id"
                    name="target_batch_id"
                    value={addFormData.target_batch_id}
                    onChange={handleAddInputChange}
                    required
                  >
                    <option value="">Select a batch</option>
                    {getBatchOptions(addFormData.target_batch_type).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="add_relationship_type">Relationship Type*</label>
                  <select
                    id="add_relationship_type"
                    name="relationship_type"
                    value={addFormData.relationship_type}
                    onChange={handleAddInputChange}
                    required
                  >
                    <option value="fed_to">Fed To</option>
                    <option value="processed_from">Processed From</option>
                    <option value="sold_to">Sold To</option>
                    <option value="transferred_to">Transferred To</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="add_quantity">Quantity</label>
                  <input
                    type="number"
                    id="add_quantity"
                    name="quantity"
                    value={addFormData.quantity}
                    onChange={handleAddInputChange}
                    min="1"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="add_notes">Notes</label>
                <textarea
                  id="add_notes"
                  name="notes"
                  value={addFormData.notes}
                  onChange={handleAddInputChange}
                  rows="3"
                  placeholder="Any additional notes about this relationship"
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeAddModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Relationship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Relationship Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Edit Batch Relationship</h2>
            
            <form onSubmit={handleEditSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit_source_batch_type">Source Batch Type*</label>
                  <select
                    id="edit_source_batch_type"
                    name="source_batch_type"
                    value={editFormData.source_batch_type}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="live_chickens">Live Chickens</option>
                    <option value="dressed_chickens">Dressed Chickens</option>
                    <option value="feed_inventory">Feed Inventory</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit_source_batch_id">Source Batch*</label>
                  <select
                    id="edit_source_batch_id"
                    name="source_batch_id"
                    value={editFormData.source_batch_id}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="">Select a batch</option>
                    {getBatchOptions(editFormData.source_batch_type).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit_target_batch_type">Target Batch Type*</label>
                  <select
                    id="edit_target_batch_type"
                    name="target_batch_type"
                    value={editFormData.target_batch_type}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="live_chickens">Live Chickens</option>
                    <option value="dressed_chickens">Dressed Chickens</option>
                    <option value="feed_inventory">Feed Inventory</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit_target_batch_id">Target Batch*</label>
                  <select
                    id="edit_target_batch_id"
                    name="target_batch_id"
                    value={editFormData.target_batch_id}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="">Select a batch</option>
                    {getBatchOptions(editFormData.target_batch_type).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit_relationship_type">Relationship Type*</label>
                  <select
                    id="edit_relationship_type"
                    name="relationship_type"
                    value={editFormData.relationship_type}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="fed_to">Fed To</option>
                    <option value="processed_from">Processed From</option>
                    <option value="sold_to">Sold To</option>
                    <option value="transferred_to">Transferred To</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit_quantity">Quantity</label>
                  <input
                    type="number"
                    id="edit_quantity"
                    name="quantity"
                    value={editFormData.quantity}
                    onChange={handleEditInputChange}
                    min="1"
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
                  placeholder="Any additional notes about this relationship"
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Relationship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchRelationshipMapping;