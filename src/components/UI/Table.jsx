import React from 'react';
import './Table.css';

// Base Table Component
export const Table = ({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'default',
  striped = false,
  hover = true,
  bordered = true,
  responsive = true,
  ...props 
}) => {
  const tableClasses = [
    'ui-table',
    `ui-table--${variant}`,
    `ui-table--${size}`,
    striped && 'ui-table--striped',
    hover && 'ui-table--hover',
    bordered && 'ui-table--bordered',
    className
  ].filter(Boolean).join(' ');

  const TableElement = (
    <table className={tableClasses} {...props}>
      {children}
    </table>
  );

  if (responsive) {
    return (
      <div className="ui-table-responsive">
        {TableElement}
      </div>
    );
  }

  return TableElement;
};

// Table Header Component
export const TableHeader = ({ children, className = '', ...props }) => {
  return (
    <thead className={`ui-table__header ${className}`} {...props}>
      {children}
    </thead>
  );
};

// Table Body Component
export const TableBody = ({ children, className = '', ...props }) => {
  return (
    <tbody className={`ui-table__body ${className}`} {...props}>
      {children}
    </tbody>
  );
};

// Table Row Component
export const TableRow = ({ 
  children, 
  className = '', 
  variant = 'default',
  clickable = false,
  onClick,
  ...props 
}) => {
  const rowClasses = [
    'ui-table__row',
    `ui-table__row--${variant}`,
    clickable && 'ui-table__row--clickable',
    className
  ].filter(Boolean).join(' ');

  return (
    <tr 
      className={rowClasses} 
      onClick={clickable ? onClick : undefined}
      {...props}
    >
      {children}
    </tr>
  );
};

// Table Header Cell Component
export const TableHeaderCell = ({ 
  children, 
  className = '', 
  sortable = false,
  sorted,
  sortDirection,
  onSort,
  align = 'left',
  width,
  ...props 
}) => {
  const cellClasses = [
    'ui-table__header-cell',
    `ui-table__header-cell--${align}`,
    sortable && 'ui-table__header-cell--sortable',
    sorted && 'ui-table__header-cell--sorted',
    className
  ].filter(Boolean).join(' ');

  const style = width ? { width, minWidth: width } : {};

  return (
    <th 
      className={cellClasses} 
      style={style}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="ui-table__header-content">
        <span className="ui-table__header-text">{children}</span>
        {sortable && (
          <span className="ui-table__sort-indicator">
            {sorted && sortDirection === 'asc' && '↑'}
            {sorted && sortDirection === 'desc' && '↓'}
            {!sorted && '↕'}
          </span>
        )}
      </div>
    </th>
  );
};

// Table Cell Component
export const TableCell = ({ 
  children, 
  className = '', 
  align = 'left',
  variant = 'default',
  width,
  ...props 
}) => {
  const cellClasses = [
    'ui-table__cell',
    `ui-table__cell--${align}`,
    `ui-table__cell--${variant}`,
    className
  ].filter(Boolean).join(' ');

  const style = width ? { width, minWidth: width } : {};

  return (
    <td className={cellClasses} style={style} {...props}>
      {children}
    </td>
  );
};

// Data Table Component (Enhanced version of existing DataTable)
export const DataTable = ({ 
  data = [],
  columns = [],
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  onRowClick,
  rowKey = 'id',
  ...tableProps
}) => {
  if (loading) {
    return (
      <div className="ui-table-loading">
        <div className="ui-table-loading__spinner"></div>
        <div className="ui-table-loading__text">Loading...</div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="ui-table-empty">
        <div className="ui-table-empty__message">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <Table className={`data-table ${className}`} {...tableProps}>
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHeaderCell
              key={column.key || index}
              sortable={column.sortable}
              sorted={column.sorted}
              sortDirection={column.sortDirection}
              onSort={column.onSort}
              align={column.align}
              width={column.width}
            >
              {column.title}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, rowIndex) => (
          <TableRow
            key={row[rowKey] || rowIndex}
            clickable={!!onRowClick}
            onClick={() => onRowClick && onRowClick(row, rowIndex)}
          >
            {columns.map((column, colIndex) => (
              <TableCell
                key={column.key || colIndex}
                align={column.align}
                variant={column.variant}
                width={column.width}
              >
                {column.render 
                  ? column.render(row[column.key], row, rowIndex)
                  : row[column.key]
                }
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Performance Table Component (for analytics/metrics)
export const PerformanceTable = ({ 
  data = [],
  title,
  className = '',
  ...props
}) => {
  const columns = [
    { key: 'metric', title: 'Metric', align: 'left' },
    { key: 'value', title: 'Value', align: 'right' },
    { key: 'change', title: 'Change', align: 'right', render: (value) => (
      <span className={`performance-change ${value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'}`}>
        {value > 0 ? '+' : ''}{value}%
      </span>
    )}
  ];

  return (
    <div className={`performance-table-container ${className}`}>
      {title && <h3 className="performance-table__title">{title}</h3>}
      <DataTable 
        data={data} 
        columns={columns}
        size="compact"
        {...props}
      />
    </div>
  );
};

// Status Table Component (for monitoring/health)
export const StatusTable = ({ 
  data = [],
  title,
  className = '',
  statusColumn = 'status',
  ...props
}) => {
  const enhancedColumns = props.columns?.map(column => {
    if (column.key === statusColumn) {
      return {
        ...column,
        render: (value) => (
          <span className={`status-badge status-badge--${value?.toLowerCase()}`}>
            {value}
          </span>
        )
      };
    }
    return column;
  }) || [];

  return (
    <div className={`status-table-container ${className}`}>
      {title && <h3 className="status-table__title">{title}</h3>}
      <DataTable 
        data={data} 
        columns={enhancedColumns}
        {...props}
      />
    </div>
  );
};

export default Table;
