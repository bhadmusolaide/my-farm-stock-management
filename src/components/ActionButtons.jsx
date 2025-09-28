import React, { memo } from 'react';

const ActionButtons = memo(({ row, onEdit, onDelete }) => {
  return (
    <div className="action-buttons">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit(row);
        }}
        className="btn btn-secondary"
        type="button"
      >
        Edit
      </button>
      <button
        onClick={() => onDelete(row.id)}
        className="btn btn-danger"
        type="button"
      >
        Delete
      </button>
    </div>
  );
});

export default ActionButtons;