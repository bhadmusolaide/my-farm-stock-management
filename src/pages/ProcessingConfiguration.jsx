import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context';
import Modal from '../components/Modal';
import './ProcessingConfiguration.css';

const ProcessingConfiguration = () => {
  const {
    chickenSizeCategories,
    chickenPartTypes,
    chickenPartStandards,
    chickenProcessingConfigs,
    loadChickenSizeCategories,
    loadChickenPartTypes,
    loadChickenPartStandards,
    loadChickenProcessingConfigs,
    addChickenSizeCategory,
    updateChickenSizeCategory,
    deleteChickenSizeCategory,
    addChickenPartType,
    updateChickenPartType,
    deleteChickenPartType,
    addChickenPartStandard,
    updateChickenPartStandard,
    deleteChickenPartStandard,
    addChickenProcessingConfig,
    updateChickenProcessingConfig,
    deleteChickenProcessingConfig
  } = useAppContext();

  const [activeTab, setActiveTab] = useState('size-categories');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // Size Category Form State
  const [sizeCategoryForm, setSizeCategoryForm] = useState({
    name: '',
    description: '',
    min_weight: '',
    max_weight: '',
    is_active: true,
    sort_order: 0
  });

  // Part Type Form State
  const [partTypeForm, setPartTypeForm] = useState({
    name: '',
    description: '',
    default_count_per_bird: 1,
    unit_of_measure: 'count',
    is_active: true,
    sort_order: 0
  });

  // Part Standard Form State
  const [partStandardForm, setPartStandardForm] = useState({
    breed: 'Broiler',
    size_category_id: '',
    part_type_id: '',
    standard_weight_kg: '',
    weight_variance_percent: 10,
    sample_size: '',
    measured_by: '',
    measurement_date: new Date().toISOString().split('T')[0],
    notes: '',
    is_active: true
  });

  // Processing Config Form State
  const [processingConfigForm, setProcessingConfigForm] = useState({
    config_name: '',
    config_type: 'global',
    breed: '',
    season_start_month: '',
    season_end_month: '',
    default_size_category_id: '',
    auto_calculate_parts: false,
    allow_part_editing: true,
    require_weight_validation: false,
    config_data: {}
  });

  // Load data on component mount
  useEffect(() => {
    loadChickenSizeCategories();
    loadChickenPartTypes();
    loadChickenPartStandards();
    loadChickenProcessingConfigs();
  }, []);

  // Form handlers
  const resetForm = (formType) => {
    switch (formType) {
      case 'size-category':
        setSizeCategoryForm({
          name: '',
          description: '',
          min_weight: '',
          max_weight: '',
          is_active: true,
          sort_order: 0
        });
        break;
      case 'part-type':
        setPartTypeForm({
          name: '',
          description: '',
          default_count_per_bird: 1,
          unit_of_measure: 'count',
          is_active: true,
          sort_order: 0
        });
        break;
      case 'part-standard':
        setPartStandardForm({
          breed: 'Broiler',
          size_category_id: '',
          part_type_id: '',
          standard_weight_kg: '',
          weight_variance_percent: 10,
          sample_size: '',
          measured_by: '',
          measurement_date: new Date().toISOString().split('T')[0],
          notes: '',
          is_active: true
        });
        break;
      case 'processing-config':
        setProcessingConfigForm({
          config_name: '',
          config_type: 'global',
          breed: '',
          season_start_month: '',
          season_end_month: '',
          default_size_category_id: '',
          auto_calculate_parts: false,
          allow_part_editing: true,
          require_weight_validation: false,
          config_data: {}
        });
        break;
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    resetForm(type);

    if (item) {
      // Populate form with existing data for editing
      switch (type) {
        case 'size-category':
          setSizeCategoryForm({
            name: item.name || '',
            description: item.description || '',
            min_weight: item.min_weight || '',
            max_weight: item.max_weight || '',
            is_active: item.is_active !== false,
            sort_order: item.sort_order || 0
          });
          break;
        case 'part-type':
          setPartTypeForm({
            name: item.name || '',
            description: item.description || '',
            default_count_per_bird: item.default_count_per_bird || 1,
            unit_of_measure: item.unit_of_measure || 'count',
            is_active: item.is_active !== false,
            sort_order: item.sort_order || 0
          });
          break;
        case 'part-standard':
          setPartStandardForm({
            breed: item.breed || 'Broiler',
            size_category_id: item.size_category_id || '',
            part_type_id: item.part_type_id || '',
            standard_weight_kg: item.standard_weight_kg || '',
            weight_variance_percent: item.weight_variance_percent || 10,
            sample_size: item.sample_size || '',
            measured_by: item.measured_by || '',
            measurement_date: item.measurement_date || new Date().toISOString().split('T')[0],
            notes: item.notes || '',
            is_active: item.is_active !== false
          });
          break;
        case 'processing-config':
          setProcessingConfigForm({
            config_name: item.config_name || '',
            config_type: item.config_type || 'global',
            breed: item.breed || '',
            season_start_month: item.season_start_month || '',
            season_end_month: item.season_end_month || '',
            default_size_category_id: item.default_size_category_id || '',
            auto_calculate_parts: item.auto_calculate_parts || false,
            allow_part_editing: item.allow_part_editing !== false,
            require_weight_validation: item.require_weight_validation || false,
            config_data: item.config_data || {}
          });
          break;
      }
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let data = {};
      let saveFunction = null;

      switch (modalType) {
        case 'size-category':
          data = {
            id: editingItem?.id || Date.now().toString(),
            ...sizeCategoryForm,
            min_weight: parseFloat(sizeCategoryForm.min_weight) || 0,
            max_weight: parseFloat(sizeCategoryForm.max_weight) || 0,
            sort_order: parseInt(sizeCategoryForm.sort_order) || 0
          };
          saveFunction = editingItem ? updateChickenSizeCategory : addChickenSizeCategory;
          break;

        case 'part-type':
          data = {
            id: editingItem?.id || Date.now().toString(),
            ...partTypeForm,
            default_count_per_bird: parseFloat(partTypeForm.default_count_per_bird) || 1,
            sort_order: parseInt(partTypeForm.sort_order) || 0
          };
          saveFunction = editingItem ? updateChickenPartType : addChickenPartType;
          break;

        case 'part-standard':
          data = {
            id: editingItem?.id || Date.now().toString(),
            ...partStandardForm,
            standard_weight_kg: parseFloat(partStandardForm.standard_weight_kg) || 0,
            weight_variance_percent: parseFloat(partStandardForm.weight_variance_percent) || 10,
            sample_size: parseInt(partStandardForm.sample_size) || null
          };
          saveFunction = editingItem ? updateChickenPartStandard : addChickenPartStandard;
          break;

        case 'processing-config':
          data = {
            id: editingItem?.id || Date.now().toString(),
            ...processingConfigForm,
            season_start_month: processingConfigForm.season_start_month ? parseInt(processingConfigForm.season_start_month) : null,
            season_end_month: processingConfigForm.season_end_month ? parseInt(processingConfigForm.season_end_month) : null,
            config_data: typeof processingConfigForm.config_data === 'string'
              ? JSON.parse(processingConfigForm.config_data)
              : processingConfigForm.config_data
          };
          saveFunction = editingItem ? updateChickenProcessingConfig : addChickenProcessingConfig;
          break;
      }

      if (saveFunction) {
        await saveFunction(data);
        closeModal();
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert(`Error saving: ${error.message}`);
    }
  };

  const handleDelete = async (type, item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name || item.config_name}"?`)) {
      try {
        switch (type) {
          case 'size-category':
            await deleteChickenSizeCategory(item.id);
            break;
          case 'part-type':
            await deleteChickenPartType(item.id);
            break;
          case 'part-standard':
            await deleteChickenPartStandard(item.id);
            break;
          case 'processing-config':
            await deleteChickenProcessingConfig(item.id);
            break;
        }
      } catch (error) {
        console.error('Error deleting:', error);
        alert(`Error deleting: ${error.message}`);
      }
    }
  };

  const renderSizeCategoriesTab = () => (
    <div className="config-section">
      <div className="section-header">
        <h2>Size Categories</h2>
        <button
          className="btn btn-primary"
          onClick={() => openModal('size-category')}
        >
          Add Size Category
        </button>
      </div>

      <div className="config-grid">
        {chickenSizeCategories.map(category => (
          <div key={category.id} className="config-card">
            <div className="card-header">
              <h3>{category.name}</h3>
              <span className={`status-badge ${category.is_active ? 'active' : 'inactive'}`}>
                {category.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="card-content">
              <p>{category.description}</p>
              <div className="weight-range">
                <span>Weight Range: {category.min_weight}kg - {category.max_weight}kg</span>
              </div>
              <div className="sort-order">Sort Order: {category.sort_order}</div>
            </div>
            <div className="card-actions">
              <button
                className="btn btn-secondary"
                onClick={() => openModal('size-category', category)}
              >
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete('size-category', category)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPartTypesTab = () => (
    <div className="config-section">
      <div className="section-header">
        <h2>Part Types</h2>
        <button
          className="btn btn-primary"
          onClick={() => openModal('part-type')}
        >
          Add Part Type
        </button>
      </div>

      <div className="config-grid">
        {chickenPartTypes.map(partType => (
          <div key={partType.id} className="config-card">
            <div className="card-header">
              <h3>{partType.name}</h3>
              <span className={`status-badge ${partType.is_active ? 'active' : 'inactive'}`}>
                {partType.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="card-content">
              <p>{partType.description}</p>
              <div className="part-details">
                <span>Default Count/Bird: {partType.default_count_per_bird}</span>
                <span>Unit: {partType.unit_of_measure}</span>
              </div>
              <div className="sort-order">Sort Order: {partType.sort_order}</div>
            </div>
            <div className="card-actions">
              <button
                className="btn btn-secondary"
                onClick={() => openModal('part-type', partType)}
              >
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete('part-type', partType)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPartStandardsTab = () => (
    <div className="config-section">
      <div className="section-header">
        <h2>Part Weight Standards</h2>
        <button
          className="btn btn-primary"
          onClick={() => openModal('part-standard')}
        >
          Add Part Standard
        </button>
      </div>

      <div className="config-grid">
        {chickenPartStandards.map(standard => {
          const sizeCategory = chickenSizeCategories.find(sc => sc.id === standard.size_category_id);
          const partType = chickenPartTypes.find(pt => pt.id === standard.part_type_id);

          return (
            <div key={standard.id} className="config-card">
              <div className="card-header">
                <h3>{standard.breed} - {sizeCategory?.name} - {partType?.name}</h3>
                <span className={`status-badge ${standard.is_active ? 'active' : 'inactive'}`}>
                  {standard.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="card-content">
                <div className="standard-weight">
                  <strong>Standard Weight: {standard.standard_weight_kg}kg</strong>
                </div>
                <div className="standard-details">
                  <span>Variance: ±{standard.weight_variance_percent}%</span>
                  <span>Sample Size: {standard.sample_size}</span>
                  <span>Measured by: {standard.measured_by}</span>
                </div>
                {standard.notes && <p className="notes">{standard.notes}</p>}
              </div>
              <div className="card-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => openModal('part-standard', standard)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete('part-standard', standard)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderProcessingConfigTab = () => (
    <div className="config-section">
      <div className="section-header">
        <h2>Processing Configuration</h2>
        <button
          className="btn btn-primary"
          onClick={() => openModal('processing-config')}
        >
          Add Processing Config
        </button>
      </div>

      <div className="config-grid">
        {chickenProcessingConfigs.map(config => (
          <div key={config.id} className="config-card">
            <div className="card-header">
              <h3>{config.config_name}</h3>
              <span className={`status-badge ${config.is_active ? 'active' : 'inactive'}`}>
                {config.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="card-content">
              <div className="config-type">
                <span>Type: {config.config_type}</span>
                {config.breed && <span>Breed: {config.breed}</span>}
              </div>
              <div className="config-options">
                <span>Auto Calculate Parts: {config.auto_calculate_parts ? 'Yes' : 'No'}</span>
                <span>Allow Part Editing: {config.allow_part_editing ? 'Yes' : 'No'}</span>
                <span>Require Weight Validation: {config.require_weight_validation ? 'Yes' : 'No'}</span>
              </div>
            </div>
            <div className="card-actions">
              <button
                className="btn btn-secondary"
                onClick={() => openModal('processing-config', config)}
              >
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete('processing-config', config)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <Modal isOpen={showModal} onClose={closeModal}>
        <div className="modal-header">
          <h2>
            {editingItem ? 'Edit' : 'Add'} {
              modalType === 'size-category' ? 'Size Category' :
              modalType === 'part-type' ? 'Part Type' :
              modalType === 'part-standard' ? 'Part Standard' :
              modalType === 'processing-config' ? 'Processing Config' : 'Item'
            }
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          {modalType === 'size-category' && (
            <div className="form-sections">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={sizeCategoryForm.name}
                  onChange={(e) => setSizeCategoryForm({...sizeCategoryForm, name: e.target.value})}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={sizeCategoryForm.description}
                  onChange={(e) => setSizeCategoryForm({...sizeCategoryForm, description: e.target.value})}
                  className="form-control"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Min Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sizeCategoryForm.min_weight}
                    onChange={(e) => setSizeCategoryForm({...sizeCategoryForm, min_weight: e.target.value})}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Max Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sizeCategoryForm.max_weight}
                    onChange={(e) => setSizeCategoryForm({...sizeCategoryForm, max_weight: e.target.value})}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={sizeCategoryForm.sort_order}
                    onChange={(e) => setSizeCategoryForm({...sizeCategoryForm, sort_order: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={sizeCategoryForm.is_active}
                      onChange={(e) => setSizeCategoryForm({...sizeCategoryForm, is_active: e.target.checked})}
                    />
                    Active
                  </label>
                </div>
              </div>
            </div>
          )}

          {modalType === 'part-type' && (
            <div className="form-sections">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={partTypeForm.name}
                  onChange={(e) => setPartTypeForm({...partTypeForm, name: e.target.value})}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={partTypeForm.description}
                  onChange={(e) => setPartTypeForm({...partTypeForm, description: e.target.value})}
                  className="form-control"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Default Count per Bird *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={partTypeForm.default_count_per_bird}
                    onChange={(e) => setPartTypeForm({...partTypeForm, default_count_per_bird: e.target.value})}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Unit of Measure *</label>
                  <select
                    value={partTypeForm.unit_of_measure}
                    onChange={(e) => setPartTypeForm({...partTypeForm, unit_of_measure: e.target.value})}
                    className="form-control"
                    required
                  >
                    <option value="count">Count</option>
                    <option value="kg">Kilograms</option>
                    <option value="lbs">Pounds</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={partTypeForm.sort_order}
                    onChange={(e) => setPartTypeForm({...partTypeForm, sort_order: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={partTypeForm.is_active}
                      onChange={(e) => setPartTypeForm({...partTypeForm, is_active: e.target.checked})}
                    />
                    Active
                  </label>
                </div>
              </div>
            </div>
          )}

          {modalType === 'part-standard' && (
            <div className="form-sections">
              <div className="form-row">
                <div className="form-group">
                  <label>Breed *</label>
                  <select
                    value={partStandardForm.breed}
                    onChange={(e) => setPartStandardForm({...partStandardForm, breed: e.target.value})}
                    className="form-control"
                    required
                  >
                    <option value="Broiler">Broiler</option>
                    <option value="Layer">Layer</option>
                    <option value="Free Range">Free Range</option>
                    <option value="Organic">Organic</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Size Category *</label>
                  <select
                    value={partStandardForm.size_category_id}
                    onChange={(e) => setPartStandardForm({...partStandardForm, size_category_id: e.target.value})}
                    className="form-control"
                    required
                  >
                    <option value="">Select Size Category</option>
                    {chickenSizeCategories.filter(sc => sc.is_active).map(sc => (
                      <option key={sc.id} value={sc.id}>{sc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Part Type *</label>
                  <select
                    value={partStandardForm.part_type_id}
                    onChange={(e) => setPartStandardForm({...partStandardForm, part_type_id: e.target.value})}
                    className="form-control"
                    required
                  >
                    <option value="">Select Part Type</option>
                    {chickenPartTypes.filter(pt => pt.is_active).map(pt => (
                      <option key={pt.id} value={pt.id}>{pt.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Standard Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.001"
                    value={partStandardForm.standard_weight_kg}
                    onChange={(e) => setPartStandardForm({...partStandardForm, standard_weight_kg: e.target.value})}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Weight Variance (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={partStandardForm.weight_variance_percent}
                    onChange={(e) => setPartStandardForm({...partStandardForm, weight_variance_percent: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Sample Size</label>
                  <input
                    type="number"
                    value={partStandardForm.sample_size}
                    onChange={(e) => setPartStandardForm({...partStandardForm, sample_size: e.target.value})}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Measured By</label>
                  <input
                    type="text"
                    value={partStandardForm.measured_by}
                    onChange={(e) => setPartStandardForm({...partStandardForm, measured_by: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Measurement Date</label>
                  <input
                    type="date"
                    value={partStandardForm.measurement_date}
                    onChange={(e) => setPartStandardForm({...partStandardForm, measurement_date: e.target.value})}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={partStandardForm.notes}
                  onChange={(e) => setPartStandardForm({...partStandardForm, notes: e.target.value})}
                  className="form-control"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={partStandardForm.is_active}
                    onChange={(e) => setPartStandardForm({...partStandardForm, is_active: e.target.checked})}
                  />
                  Active
                </label>
              </div>
            </div>
          )}

          {modalType === 'processing-config' && (
            <div className="form-sections">
              <div className="form-group">
                <label>Configuration Name *</label>
                <input
                  type="text"
                  value={processingConfigForm.config_name}
                  onChange={(e) => setProcessingConfigForm({...processingConfigForm, config_name: e.target.value})}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Configuration Type *</label>
                  <select
                    value={processingConfigForm.config_type}
                    onChange={(e) => setProcessingConfigForm({...processingConfigForm, config_type: e.target.value})}
                    className="form-control"
                    required
                  >
                    <option value="global">Global</option>
                    <option value="breed_specific">Breed Specific</option>
                    <option value="seasonal">Seasonal</option>
                  </select>
                </div>

                {processingConfigForm.config_type === 'breed_specific' && (
                  <div className="form-group">
                    <label>Breed</label>
                    <select
                      value={processingConfigForm.breed}
                      onChange={(e) => setProcessingConfigForm({...processingConfigForm, breed: e.target.value})}
                      className="form-control"
                    >
                      <option value="">Select Breed</option>
                      <option value="Broiler">Broiler</option>
                      <option value="Layer">Layer</option>
                      <option value="Free Range">Free Range</option>
                      <option value="Organic">Organic</option>
                    </select>
                  </div>
                )}
              </div>

              {processingConfigForm.config_type === 'seasonal' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Season Start Month</label>
                    <select
                      value={processingConfigForm.season_start_month}
                      onChange={(e) => setProcessingConfigForm({...processingConfigForm, season_start_month: e.target.value})}
                      className="form-control"
                    >
                      <option value="">Select Start Month</option>
                      {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>{new Date(2000, month - 1).toLocaleDateString('en', {month: 'long'})}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Season End Month</label>
                    <select
                      value={processingConfigForm.season_end_month}
                      onChange={(e) => setProcessingConfigForm({...processingConfigForm, season_end_month: e.target.value})}
                      className="form-control"
                    >
                      <option value="">Select End Month</option>
                      {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>{new Date(2000, month - 1).toLocaleDateString('en', {month: 'long'})}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Default Size Category</label>
                <select
                  value={processingConfigForm.default_size_category_id}
                  onChange={(e) => setProcessingConfigForm({...processingConfigForm, default_size_category_id: e.target.value})}
                  className="form-control"
                >
                  <option value="">Select Default Size Category</option>
                  {chickenSizeCategories.filter(sc => sc.is_active).map(sc => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={processingConfigForm.auto_calculate_parts}
                    onChange={(e) => setProcessingConfigForm({...processingConfigForm, auto_calculate_parts: e.target.checked})}
                  />
                  Auto Calculate Parts from Whole Chicken Count
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={processingConfigForm.allow_part_editing}
                    onChange={(e) => setProcessingConfigForm({...processingConfigForm, allow_part_editing: e.target.checked})}
                  />
                  Allow Part Count/Weight Editing
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={processingConfigForm.require_weight_validation}
                    onChange={(e) => setProcessingConfigForm({...processingConfigForm, require_weight_validation: e.target.checked})}
                  />
                  Require Weight Validation
                </label>
              </div>

              <div className="form-group">
                <label>Additional Configuration (JSON)</label>
                <textarea
                  value={JSON.stringify(processingConfigForm.config_data, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setProcessingConfigForm({...processingConfigForm, config_data: parsed});
                    } catch (error) {
                      // Invalid JSON, don't update state
                    }
                  }}
                  className="form-control"
                  rows="4"
                  placeholder='{"custom_field": "value"}'
                />
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  return (
    <div className="processing-configuration-container">
      <div className="page-header">
        <h1>Processing Configuration</h1>
        <p>Configure size categories, part types, weight standards, and processing rules for your farm</p>
      </div>

      <div className="tab-navigation">
        <nav>
          <button
            className={`tab-button ${activeTab === 'size-categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('size-categories')}
          >
            Size Categories
          </button>
          <button
            className={`tab-button ${activeTab === 'part-types' ? 'active' : ''}`}
            onClick={() => setActiveTab('part-types')}
          >
            Part Types
          </button>
          <button
            className={`tab-button ${activeTab === 'part-standards' ? 'active' : ''}`}
            onClick={() => setActiveTab('part-standards')}
          >
            Part Standards
          </button>
          <button
            className={`tab-button ${activeTab === 'processing-config' ? 'active' : ''}`}
            onClick={() => setActiveTab('processing-config')}
          >
            Processing Config
          </button>
        </nav>
      </div>

      <div className="tab-content">
        {activeTab === 'size-categories' && renderSizeCategoriesTab()}
        {activeTab === 'part-types' && renderPartTypesTab()}
        {activeTab === 'part-standards' && renderPartStandardsTab()}
        {activeTab === 'processing-config' && renderProcessingConfigTab()}
      </div>

      {renderModal()}
    </div>
  );
};

export default ProcessingConfiguration;