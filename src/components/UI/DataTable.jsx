import React, { useMemo } from 'react';
import SortableTableHeader from './SortableTableHeader';
import Pagination from './Pagination';
import ColumnFilter from './ColumnFilter';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import useTableSort from '../../hooks/useTableSort';
import useColumnConfig from '../../hooks/useColumnConfig';
import usePagination from '../../hooks/usePagination';
import './DataTable.css';

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  enableSorting = true,
  enablePagination = true,
  enableColumnFilter = true,
  enableSearch = false,
  searchPlaceholder = 'Search...',
  onRowClick = null,
  rowClassName = null,
  tableClassName = '',
  containerClassName = '',
  renderCell = null, // Custom cell renderer: (value, row, column) => JSX
  renderActions = null, // Custom actions renderer: (row) => JSX
  sortConfig: externalSortConfig = null,
  onSort: externalOnSort = null,
  storageKey = null // For column config persistence
}) => {
  // Internal sorting if not provided externally
  const internalSort = useTableSort(data);
  const sortConfig = externalSortConfig || internalSort.sortConfig;
  const onSort = externalOnSort || internalSort.requestSort;
  const getSortIcon = externalSortConfig ? 
    (key) => externalSortConfig.key === key ? 
      (externalSortConfig.direction === 'asc' ? 'sort-asc' : 'sort-desc') : 'sort-default'
    : internalSort.getSortIcon;

  // Use sorted data from external sort or internal sort
  const sortedData = externalSortConfig ? data : internalSort.sortedData;

  // Column configuration
  const columnConfig = useColumnConfig(storageKey || 'dataTable', columns);

  // Pagination
  const pagination = usePagination(sortedData, pageSize);

  // Filter visible columns
  const visibleColumns = useMemo(() => {
    if (!enableColumnFilter) return columns;
    return columns.filter(col => columnConfig.visibleColumns.includes(col.key));
  }, [columns, columnConfig.visibleColumns, enableColumnFilter]);

  // Search functionality
  const [searchTerm, setSearchTerm] = React.useState('');
  const searchedData = useMemo(() => {
    if (!enableSearch || !searchTerm.trim()) return sortedData;
    
    return sortedData.filter(row => {
      return visibleColumns.some(col => {
        const value = row[col.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [sortedData, searchTerm, visibleColumns, enableSearch]);

  // Final data for display (with pagination)
  const displayData = enablePagination ? 
    searchedData.slice(
      (pagination.currentPage - 1) * pagination.pageSize,
      pagination.currentPage * pagination.pageSize
    ) : searchedData;

  // Calculate total pages for searched data
  const totalPages = enablePagination ? 
    Math.ceil(searchedData.length / pagination.pageSize) : 1;

  // Default cell renderer
  const defaultRenderCell = (value, row, column) => {
    if (value == null) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  const cellRenderer = renderCell || defaultRenderCell;

  // Handle row click
  const handleRowClick = (row, index) => {
    if (onRowClick) {
      onRowClick(row, index);
    }
  };

  // Get row class name
  const getRowClassName = (row, index) => {
    let className = '';
    if (onRowClick) className += ' clickable-row';
    if (rowClassName) {
      if (typeof rowClassName === 'function') {
        className += ' ' + rowClassName(row, index);
      } else {
        className += ' ' + rowClassName;
      }
    }
    return className.trim();
  };

  if (loading) {
    return (
      <div className={`data-table-container ${containerClassName}`}>
        <div className="data-table-loading">
          <LoadingSpinner size="large" text="Loading data..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`data-table-container ${containerClassName}`}>
        <div className="data-table-error">
          <p>Error loading data: {typeof error === 'string' ? error : error?.message || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`data-table-container ${containerClassName}`}>
      {/* Table Controls */}
      <div className="data-table-controls">
        {enableSearch && (
          <div className="data-table-search">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        )}
        
        {enableColumnFilter && (
          <ColumnFilter
            columns={columns}
            visibleColumns={columnConfig.visibleColumns}
            onColumnToggle={columnConfig.toggleColumn}
            className="data-table-column-filter"
          />
        )}
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className={`data-table ${tableClassName}`}>
          <thead>
            <tr>
              {visibleColumns.map((column) => (
                <SortableTableHeader
                  key={column.key}
                  sortKey={column.key}
                  onSort={enableSorting ? onSort : null}
                  getSortIcon={getSortIcon}
                  sortable={enableSorting && column.sortable !== false}
                  className={column.headerClassName || ''}
                >
                  {column.label}
                </SortableTableHeader>
              ))}
              {renderActions && (
                <th className="actions-column">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {displayData.length === 0 ? (
              <tr>
                <td 
                  colSpan={visibleColumns.length + (renderActions ? 1 : 0)} 
                  className="empty-message"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={getRowClassName(row, index)}
                  onClick={() => handleRowClick(row, index)}
                >
                  {visibleColumns.map((column) => (
                    <td 
                      key={column.key} 
                      className={column.cellClassName || ''}
                    >
                      {cellRenderer(row[column.key], row, column)}
                    </td>
                  ))}
                  {renderActions && (
                    <td className="actions-cell">
                      {renderActions(row, index)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && searchedData.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={totalPages}
          onPageChange={pagination.goToPage}
          pageSize={pagination.pageSize}
          onPageSizeChange={pagination.setPageSize}
          totalItems={searchedData.length}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
};

export default DataTable;
