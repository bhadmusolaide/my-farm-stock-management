import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context';
import { useNotification } from '../context/NotificationContext';
import { TabNavigation } from '../components/UI';
import {
  OrderForm,
  OrderList,
  CustomerManagement,
  CustomerDetailModal,
  OrderAnalytics,
  BatchUpdateModal
} from '../components/ChickenOrders';
import './ChickenOrders.css';

const ChickenOrders = () => {
  const {
    addChicken,
    updateChicken,
    deleteChicken,
    exportToCSV,
    liveChickens,
    updateLiveChicken,
    dressedChickens,
    updateDressedChicken,
    logChickenTransaction,
    loadPaginatedData,
    loadLiveChickensData,
    loadDressedChickensData,
    pagination,
    refreshData
  } = useAppContext();

  const { showError, showSuccess, showWarning } = useNotification();

  // State management
  const [activeTab, setActiveTab] = useState('orders');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Paginated orders data
  const [paginatedOrders, setPaginatedOrders] = useState({ data: [], count: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger

  // Filter states
  const [orderFilters, setOrderFilters] = useState({
    customer: '',
    status: '',
    inventoryType: '',
    startDate: '',
    endDate: ''
  });

  // Load orders data
  useEffect(() => {
    const loadOrdersData = async () => {
      try {
        setLoading(true);
        const result = await loadPaginatedData('chickens', currentPage, 20, orderFilters);
        setPaginatedOrders(result);
      } catch (error) {
        console.error('Failed to load orders:', error);
        showError('Failed to load orders. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadOrdersData();
  }, [currentPage, orderFilters, loadPaginatedData, showError, refreshTrigger]);

  // Load supporting data
  useEffect(() => {
    const loadSupportingData = async () => {
      try {
        await Promise.all([
          loadLiveChickensData(),
          loadDressedChickensData()
        ]);
      } catch (error) {
        console.error('Failed to load supporting data:', error);
      }
    };

    loadSupportingData();
  }, [loadLiveChickensData, loadDressedChickensData]);

  // Tab configuration
  const tabs = [
    { 
      key: 'orders', 
      label: 'Orders', 
      icon: '📋',
      badge: paginatedOrders.count || 0
    },
    { 
      key: 'customers', 
      label: 'Customers', 
      icon: '👥' 
    },
    { 
      key: 'analytics', 
      label: 'Analytics', 
      icon: '📊' 
    }
  ];

  // Helper function to get actual whole chicken count from dressed chicken batch
  const getWholeChickenCount = (dressedChicken) => {
    if (!dressedChicken) return 0;
    
    if (dressedChicken.processing_quantity && dressedChicken.processing_quantity > 0) {
      return dressedChicken.processing_quantity;
    }
    
    const partsCount = dressedChicken.parts_count || {};
    const totalPartsCount = Object.values(partsCount).reduce((sum, count) => sum + (count || 0), 0);
    
    if (dressedChicken.current_count === totalPartsCount && totalPartsCount > 0) {
      const partsCounts = Object.values(partsCount).filter(c => c > 0);
      return partsCounts.length > 0 ? Math.min(...partsCounts) : dressedChicken.current_count;
    }
    
    return dressedChicken.current_count || 0;
  };

  // Handle inventory deduction
  const handleInventoryDeduction = async (inventoryType, batchId, count, partType, description, orderId) => {
    if (inventoryType === 'live') {
      const batch = liveChickens.find(b => b.id === batchId);
      if (batch) {
        const newCount = Math.max(0, batch.current_count - count);
        await updateLiveChicken(batchId, { ...batch, current_count: newCount });
        
        // Log transaction
        await logChickenTransaction({
          batch_id: batchId,
          transaction_type: 'sale',
          quantity: count,
          description,
          order_id: orderId
        });
      }
    } else if (inventoryType === 'dressed') {
      const batch = dressedChickens.find(b => b.id === batchId);
      if (batch) {
        if (partType && batch.parts_count) {
          // Deduct from specific part
          const newPartsCount = { ...batch.parts_count };
          newPartsCount[partType] = Math.max(0, (newPartsCount[partType] || 0) - count);
          await updateDressedChicken(batchId, { ...batch, parts_count: newPartsCount });
        } else {
          // Deduct from whole chickens
          const newCount = Math.max(0, getWholeChickenCount(batch) - count);
          await updateDressedChicken(batchId, { ...batch, current_count: newCount });
        }
        
        // Log transaction
        await logChickenTransaction({
          batch_id: batchId,
          transaction_type: 'sale',
          quantity: count,
          description,
          order_id: orderId,
          part_type: partType
        });
      }
    }
  };

  // Event handlers
  const handleOrderSubmit = async (orderData) => {
    try {
      setLoading(true);

      // Handle inventory deduction if batch is selected
      if (orderData.batch_id && orderData.calculationMode !== 'size_cost') {
        await handleInventoryDeduction(
          orderData.inventoryType,
          orderData.batch_id,
          orderData.count,
          orderData.part_type,
          `Order ${editingOrder ? 'update' : 'sale'} for ${orderData.customer}`,
          orderData.id || Date.now().toString()
        );
      }

      // Add or update the order
      if (editingOrder) {
        await updateChicken(orderData.id, {
          customer: orderData.customer,
          phone: orderData.phone,
          location: orderData.location,
          count: orderData.count,
          size: orderData.size,
          price: orderData.price,
          amountPaid: orderData.amountPaid, // Use camelCase for consistency
          status: orderData.status,
          calculationMode: orderData.calculationMode, // Use camelCase for consistency
          inventoryType: orderData.inventoryType, // Use camelCase for consistency
          batch_id: orderData.batch_id || null,
          part_type: orderData.part_type || null
        });
        showSuccess('Order updated successfully!');
      } else {
        await addChicken({
          customer: orderData.customer,
          phone: orderData.phone,
          location: orderData.location,
          count: orderData.count,
          size: orderData.size,
          price: orderData.price,
          amountPaid: orderData.amountPaid, // Use camelCase for consistency
          status: orderData.status,
          calculationMode: orderData.calculationMode, // Use camelCase for consistency
          inventoryType: orderData.inventoryType, // Use camelCase for consistency
          batch_id: orderData.batch_id || null,
          part_type: orderData.part_type || null
        });
        showSuccess('Order added successfully!');
      }

      // Trigger data refresh
      setRefreshTrigger(prev => prev + 1);

    } catch (error) {
      console.error('Failed to save order:', error);

      // If it's a "not found" error, try refreshing the context data
      if (error.message.includes('not found')) {
        console.log('Attempting to refresh context data due to "not found" error...');
        try {
          await refreshData();
          showError('Order data was out of sync. Please try again.');
        } catch (refreshError) {
          console.error('Failed to refresh data:', refreshError);
          showError(`Failed to save order: ${error.message}`);
        }
      } else {
        showError(`Failed to save order: ${error.message}`);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setShowOrderForm(true);
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        setLoading(true);
        await deleteChicken(orderId);
        
        // Refresh orders data
        const result = await loadPaginatedData('chickens', currentPage, 20, orderFilters);
        setPaginatedOrders(result);
        
        showSuccess('Order deleted successfully');
      } catch (error) {
        console.error('Failed to delete order:', error);
        showError('Failed to delete order. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBatchUpdate = async (batchData) => {
    try {
      setLoading(true);
      
      const updatePromises = batchData.orderIds.map(orderId => {
        const updateData = {};
        
        if (batchData.status) {
          updateData.status = batchData.status;
        }
        
        if (batchData.amountPaid !== undefined) {
          updateData.amount_paid = batchData.amountPaid;
        }
        
        return updateChicken(orderId, updateData);
      });

      await Promise.all(updatePromises);
      
      // Refresh orders data
      const result = await loadPaginatedData('chickens', currentPage, 20, orderFilters);
      setPaginatedOrders(result);
      
      setSelectedOrders([]);
      showSuccess(`Successfully updated ${batchData.orderIds.length} orders`);
      
    } catch (error) {
      console.error('Failed to batch update orders:', error);
      showError('Failed to update orders. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = (orderIds) => {
    setSelectedOrders(orderIds);
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetail(true);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="chicken-orders-container">
      {/* Page Header */}
      <div className="page-header">
        <h1>Chicken Orders</h1>
        <div className="header-actions">
          <button
            onClick={() => {
              setEditingOrder(null);
              setShowOrderForm(true);
            }}
            className="btn btn-primary"
            disabled={loading}
          >
            Add New Order
          </button>
          
          {selectedOrders.length > 0 && (
            <button
              onClick={() => setShowBatchModal(true)}
              className="btn btn-outline-primary"
              disabled={loading}
            >
              Batch Update ({selectedOrders.length})
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
        showBadges
      />

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'orders' && (
          <OrderList
            orders={paginatedOrders.data}
            onEdit={handleEditOrder}
            onDelete={handleDeleteOrder}
            onBatchUpdate={() => setShowBatchModal(true)}
            filters={orderFilters}
            onFiltersChange={setOrderFilters}
            selectedOrders={selectedOrders}
            onOrderSelect={handleOrderSelect}
            onSelectAll={handleSelectAll}
            loading={loading}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerManagement
            orders={paginatedOrders.data}
            onViewCustomer={handleViewCustomer}
            onEditOrder={handleEditOrder}
            loading={loading}
          />
        )}

        {activeTab === 'analytics' && (
          <OrderAnalytics
            orders={paginatedOrders.data}
          />
        )}
      </div>

      {/* Pagination Controls */}
      {activeTab === 'orders' && paginatedOrders.count > 20 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, paginatedOrders.count)} of {paginatedOrders.count} orders
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="btn btn-outline-secondary"
            >
              Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {Math.ceil(paginatedOrders.count / 20)}
            </span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= Math.ceil(paginatedOrders.count / 20) || loading}
              className="btn btn-outline-secondary"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      <OrderForm
        isOpen={showOrderForm}
        onClose={() => {
          setShowOrderForm(false);
          setEditingOrder(null);
        }}
        onSubmit={handleOrderSubmit}
        editingOrder={editingOrder}
        liveChickens={liveChickens}
        dressedChickens={dressedChickens}
        loading={loading}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={showCustomerDetail}
        onClose={() => {
          setShowCustomerDetail(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onEditOrder={handleEditOrder}
      />

      {/* Batch Update Modal */}
      <BatchUpdateModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onSubmit={handleBatchUpdate}
        selectedOrders={selectedOrders}
        orders={paginatedOrders.data}
        loading={loading}
      />
    </div>
  );
};

export default ChickenOrders;
