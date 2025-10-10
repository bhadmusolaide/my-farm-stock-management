# Global Components Migration Guide

This guide explains how to migrate existing pages to use the new global card and table components for consistent styling across the application.

## Overview

We've created a comprehensive set of global components that provide:
- Consistent styling across all pages
- Automatic dark mode support
- Responsive design built-in
- Reduced code duplication
- Easy maintenance and updates

## Available Components

### Card Components
- `Card` - Base card component
- `SummaryCard` - For displaying key metrics with icons
- `StatCard` - For simple statistics display
- `MetricCard` - For performance metrics with change indicators
- `AlertCard` - For alerts and notifications
- `HealthStatusCard` - For health status displays

### Table Components
- `Table` - Base table component
- `TableHeader`, `TableBody`, `TableRow`, `TableHeaderCell`, `TableCell` - Table building blocks
- `DataTable` - Enhanced data table with built-in features
- `PerformanceTable` - For performance metrics
- `StatusTable` - For status monitoring

## Migration Examples

### Before: Custom Card Styling
```jsx
// Old approach - custom CSS for each page
<div className="summary-card">
  <div className="summary-card__content">
    <div className="summary-card__icon">🐔</div>
    <div className="summary-card__info">
      <div className="summary-card__title">Total Chickens</div>
      <div className="summary-card__value">1,250</div>
    </div>
  </div>
</div>
```

### After: Global Component
```jsx
// New approach - global component
import { SummaryCard } from '../components/UI';

<SummaryCard
  title="Total Chickens"
  value="1,250"
  icon="🐔"
  variant="primary"
  subtitle="Active livestock"
/>
```

### Before: Custom Table Styling
```jsx
// Old approach - custom table with manual styling
<div className="data-table-wrapper">
  <table className="data-table">
    <thead>
      <tr>
        <th>Batch Name</th>
        <th>Status</th>
        <th>Count</th>
      </tr>
    </thead>
    <tbody>
      {data.map(row => (
        <tr key={row.id}>
          <td>{row.name}</td>
          <td>
            <span className={`status-badge status-${row.status}`}>
              {row.status}
            </span>
          </td>
          <td>{row.count}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### After: Global Component
```jsx
// New approach - global component
import { DataTable } from '../components/UI';

const columns = [
  { key: 'name', title: 'Batch Name', align: 'left' },
  { key: 'status', title: 'Status', align: 'center' },
  { key: 'count', title: 'Count', align: 'right' }
];

<DataTable
  data={data}
  columns={columns}
  hover={true}
  striped={true}
/>
```

## Step-by-Step Migration Process

### 1. Import Global Components
```jsx
import { 
  SummaryCard, 
  HealthStatusCard, 
  DataTable,
  AlertCard 
} from '../components/UI';
```

### 2. Replace Custom Cards
- Find existing card elements with custom CSS classes
- Replace with appropriate global card components
- Remove custom CSS that's no longer needed

### 3. Replace Custom Tables
- Find existing table elements
- Replace with global table components
- Configure columns array for DataTable component

### 4. Update Styling References
- Remove page-specific CSS for cards and tables
- Use global utility classes where needed
- Leverage CSS variables for consistent theming

### 5. Test Dark Mode
- Verify components work in both light and dark modes
- Check responsive behavior on different screen sizes

## Benefits After Migration

1. **Consistency**: All cards and tables look the same across pages
2. **Maintainability**: Changes to styling only need to be made in one place
3. **Dark Mode**: Automatic support without additional CSS
4. **Responsive**: Built-in responsive design
5. **Accessibility**: Better accessibility features built-in
6. **Performance**: Reduced CSS bundle size

## Common Patterns

### Health Status Overview
```jsx
<div className="health-status-cards">
  <HealthStatusCard status="healthy" count="1,100" percentage="88" icon="✅" />
  <HealthStatusCard status="sick" count="120" percentage="9.6" icon="🤒" />
  <HealthStatusCard status="critical" count="25" percentage="2" icon="🚨" />
</div>
```

### Performance Metrics
```jsx
<div className="stats-grid">
  <MetricCard
    title="Feed Efficiency"
    value="1.8"
    unit=":1"
    change="+5%"
    changeType="positive"
    icon="📊"
  />
  <MetricCard
    title="Average Weight"
    value="2.1"
    unit="kg"
    change="-2%"
    changeType="negative"
    icon="⚖️"
  />
</div>
```

### Alert Section
```jsx
<section className="alert-section">
  <h3>🚨 Health Alerts</h3>
  <AlertCard
    type="danger"
    title="Critical Mortality Alert"
    message="Batch Vertex 51 has exceeded critical mortality threshold (39.2%)"
    icon="🚨"
    dismissible={true}
  />
</section>
```

## CSS Classes to Remove

After migration, you can remove these page-specific CSS classes:
- `.summary-card`, `.summary-card__*`
- `.stat-card`, `.stat-card__*`
- `.health-status-card`, `.health-status-card__*`
- `.data-table`, `.data-table__*`
- `.performance-table`, `.performance-table__*`
- Custom table styling classes

## Global CSS Classes Available

Use these global utility classes:
- `.summary-cards` - Grid layout for summary cards
- `.health-status-cards` - Grid layout for health status cards
- `.stats-grid` - Grid layout for statistics
- `.section` - Section container
- `.section-header` - Section header with title and actions
- `.btn`, `.btn-primary`, `.btn-secondary` - Button styles
- `.text-muted`, `.text-primary`, `.text-success` - Text utilities

## Testing Checklist

- [ ] All cards display correctly in light mode
- [ ] All cards display correctly in dark mode
- [ ] Tables are responsive on mobile devices
- [ ] Status badges show correct colors
- [ ] Hover effects work properly
- [ ] No console errors
- [ ] Page loads faster (reduced CSS)

## Need Help?

Check the `ComponentExamples.jsx` file for live examples of all components in action.
