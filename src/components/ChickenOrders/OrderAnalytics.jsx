import React, { useMemo } from 'react';
import { DataTable } from '../UI';
import { formatNumber, formatDate } from '../../utils/formatters';
import './ChickenOrders.css';

const OrderAnalytics = ({
  orders = []
}) => {
  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Overall statistics
    const totalOrders = orders.length;
    let totalRevenue = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    // Status counts
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };

    // Inventory type analysis
    const inventoryTypes = {
      live: { count: 0, revenue: 0 },
      dressed: { count: 0, revenue: 0 },
      parts: { count: 0, revenue: 0 }
    };

    // Monthly trends
    const monthlyData = new Map();
    
    // Customer analysis
    const customerMap = new Map();

    // Recent orders (last 30 days)
    let recentOrders = 0;
    let weeklyOrders = 0;

    orders.forEach(order => {
      const orderDate = new Date(order.date);
      
      // Calculate order total
      let orderTotal = 0;
      if (order.calculation_mode === 'count_cost') {
        orderTotal = order.count * order.price;
      } else if (order.calculation_mode === 'size_cost') {
        orderTotal = order.size * order.price;
      } else {
        orderTotal = order.size * order.price;
      }

      totalRevenue += orderTotal;
      totalPaid += order.amount_paid || 0;
      totalBalance += orderTotal - (order.amount_paid || 0);

      // Status counts
      statusCounts[order.status]++;

      // Inventory type analysis
      if (inventoryTypes[order.inventory_type]) {
        inventoryTypes[order.inventory_type].count++;
        inventoryTypes[order.inventory_type].revenue += orderTotal;
      }

      // Monthly trends
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          orders: 0,
          revenue: 0,
          customers: new Set()
        });
      }
      const monthData = monthlyData.get(monthKey);
      monthData.orders++;
      monthData.revenue += orderTotal;
      monthData.customers.add(order.customer.toLowerCase());

      // Customer analysis
      const customerKey = order.customer.toLowerCase();
      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          name: order.customer,
          orders: 0,
          revenue: 0,
          lastOrder: orderDate
        });
      }
      const customerData = customerMap.get(customerKey);
      customerData.orders++;
      customerData.revenue += orderTotal;
      if (orderDate > customerData.lastOrder) {
        customerData.lastOrder = orderDate;
      }

      // Recent activity
      if (orderDate >= thirtyDaysAgo) {
        recentOrders++;
      }
      if (orderDate >= sevenDaysAgo) {
        weeklyOrders++;
      }
    });

    // Convert monthly data to array and sort
    const monthlyTrends = Array.from(monthlyData.values())
      .map(month => ({
        ...month,
        customers: month.customers.size
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Top customers
    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Payment completion rate
    const paymentCompletionRate = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;

    return {
      overview: {
        totalOrders,
        totalRevenue,
        totalPaid,
        totalBalance,
        avgOrderValue,
        paymentCompletionRate,
        recentOrders,
        weeklyOrders
      },
      statusCounts,
      inventoryTypes,
      monthlyTrends,
      topCustomers
    };
  }, [orders]);

  // Monthly trends table columns
  const monthlyColumns = [
    {
      key: 'month',
      label: 'Month',
      sortable: true
    },
    {
      key: 'orders',
      label: 'Orders',
      sortable: true,
      render: (row) => formatNumber(row.orders)
    },
    {
      key: 'revenue',
      label: 'Revenue',
      sortable: true,
      render: (row) => `₦${formatNumber(row.revenue, 2)}`
    },
    {
      key: 'customers',
      label: 'Unique Customers',
      sortable: true,
      render: (row) => formatNumber(row.customers)
    },
    {
      key: 'avgOrderValue',
      label: 'Avg Order Value',
      render: (row) => `₦${formatNumber(row.orders > 0 ? row.revenue / row.orders : 0, 2)}`
    }
  ];

  // Top customers table columns
  const customerColumns = [
    {
      key: 'name',
      label: 'Customer',
      sortable: true
    },
    {
      key: 'orders',
      label: 'Orders',
      sortable: true,
      render: (row) => formatNumber(row.orders)
    },
    {
      key: 'revenue',
      label: 'Revenue',
      sortable: true,
      render: (row) => `₦${formatNumber(row.revenue, 2)}`
    },
    {
      key: 'avgOrderValue',
      label: 'Avg Order Value',
      render: (row) => `₦${formatNumber(row.orders > 0 ? row.revenue / row.orders : 0, 2)}`
    },
    {
      key: 'lastOrder',
      label: 'Last Order',
      sortable: true,
      render: (row) => formatDate(row.lastOrder)
    }
  ];

  return (
    <div className="order-analytics">
      {/* Overview Statistics */}
      <div className="analytics-overview">
        <h3>📊 Overview Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h4>Total Orders</h4>
              <p className="stat-value">{formatNumber(analytics.overview.totalOrders)}</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h4>Total Revenue</h4>
              <p className="stat-value">₦{formatNumber(analytics.overview.totalRevenue, 2)}</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h4>Amount Paid</h4>
              <p className="stat-value">₦{formatNumber(analytics.overview.totalPaid, 2)}</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h4>Balance Due</h4>
              <p className="stat-value">₦{formatNumber(analytics.overview.totalBalance, 2)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h4>Avg Order Value</h4>
              <p className="stat-value">₦{formatNumber(analytics.overview.avgOrderValue, 2)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💳</div>
            <div className="stat-content">
              <h4>Payment Rate</h4>
              <p className="stat-value">{analytics.overview.paymentCompletionRate.toFixed(1)}%</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <h4>Recent Orders</h4>
              <p className="stat-value">{formatNumber(analytics.overview.recentOrders)}</p>
              <small>(Last 30 days)</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h4>This Week</h4>
              <p className="stat-value">{formatNumber(analytics.overview.weeklyOrders)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="status-analysis">
        <h3>📊 Order Status Distribution</h3>
        <div className="status-cards">
          {Object.entries(analytics.statusCounts).map(([status, count]) => (
            <div key={status} className={`status-card status-${status}`}>
              <div className="status-header">
                <span className={`status-badge status-${status}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
              <div className="status-count">{formatNumber(count)}</div>
              <div className="status-percentage">
                {analytics.overview.totalOrders > 0 
                  ? ((count / analytics.overview.totalOrders) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Type Analysis */}
      <div className="inventory-analysis">
        <h3>🐔 Inventory Type Analysis</h3>
        <div className="inventory-cards">
          {Object.entries(analytics.inventoryTypes).map(([type, data]) => (
            <div key={type} className={`inventory-card type-${type}`}>
              <div className="inventory-header">
                <span className={`type-badge type-${type}`}>
                  {type === 'live' ? 'Live Chickens' : 
                   type === 'dressed' ? 'Dressed Chickens' : 'Chicken Parts'}
                </span>
              </div>
              <div className="inventory-stats">
                <div className="inventory-count">
                  <label>Orders:</label>
                  <span>{formatNumber(data.count)}</span>
                </div>
                <div className="inventory-revenue">
                  <label>Revenue:</label>
                  <span>₦{formatNumber(data.revenue, 2)}</span>
                </div>
                <div className="inventory-percentage">
                  <label>Share:</label>
                  <span>
                    {analytics.overview.totalRevenue > 0 
                      ? ((data.revenue / analytics.overview.totalRevenue) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="monthly-trends">
        <h3>📈 Monthly Trends</h3>
        <DataTable
          data={analytics.monthlyTrends}
          columns={monthlyColumns}
          enableSorting
          enablePagination
          emptyMessage="No monthly data available"
          pageSize={12}
        />
      </div>

      {/* Top Customers */}
      <div className="top-customers-analytics">
        <h3>👑 Top Customers</h3>
        <DataTable
          data={analytics.topCustomers}
          columns={customerColumns}
          enableSorting
          enablePagination
          emptyMessage="No customer data available"
          pageSize={10}
        />
      </div>
    </div>
  );
};

export default OrderAnalytics;
