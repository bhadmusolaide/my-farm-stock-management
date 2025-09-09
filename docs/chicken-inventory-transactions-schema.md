# Chicken Inventory Transactions Schema Design

## Purpose
This schema design creates a comprehensive audit trail for all changes to live chicken inventory, distinguishing between different reasons for count changes (sales, mortality, transfers, etc.). This enables accurate reporting, inventory reconciliation, and business analytics.

## Table: `chicken_inventory_transactions`

### Columns
- `id` (UUID or SERIAL PRIMARY KEY): Unique identifier for each transaction record
- `batch_id` (INTEGER REFERENCES live_chickens(id)): Foreign key to the affected chicken batch
- `transaction_type` (VARCHAR(50) NOT NULL): Type of transaction ('sale', 'mortality', 'transfer', 'adjustment')
- `quantity_changed` (INTEGER NOT NULL): Number of chickens affected (positive for additions, negative for deductions)
- `reason` (TEXT): Detailed description of the transaction
- `reference_id` (VARCHAR(255)): Reference to related record (chicken order ID for sales, mortality report ID, etc.)
- `reference_type` (VARCHAR(50)): Type of referenced record ('chicken_order', 'mortality_report', 'manual_adjustment')
- `transaction_date` (DATE NOT NULL DEFAULT CURRENT_DATE): Date of the transaction
- `created_at` (TIMESTAMP WITH TIME ZONE DEFAULT NOW()): When the record was created
- `updated_at` (TIMESTAMP WITH TIME ZONE DEFAULT NOW()): When the record was last updated
- `user_id` (UUID REFERENCES auth.users(id)): Who performed the transaction (for audit trail)

### Indexes
- PRIMARY KEY (`id`)
- INDEX on `batch_id` for batch-specific queries
- INDEX on `transaction_date` for date-range reporting
- INDEX on `transaction_type` for type-based analytics
- COMPOSITE INDEX on `(batch_id, transaction_date)` for batch history
- INDEX on `reference_id, reference_type` for linking to source records

### Constraints
- CHECK (`quantity_changed != 0`) - No zero-quantity transactions
- FOREIGN KEY (`batch_id`) REFERENCES `live_chickens(id)` ON DELETE CASCADE
- ENUM constraint on `transaction_type` (if using PostgreSQL enums)

## SQL Schema

```sql
-- Create the table
CREATE TABLE IF NOT EXISTS chicken_inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES live_chickens(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('sale', 'mortality', 'transfer', 'adjustment')),
    quantity_changed INTEGER NOT NULL CHECK (quantity_changed != 0),
    reason TEXT,
    reference_id VARCHAR(255),
    reference_type VARCHAR(50),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_chicken_transactions_batch ON chicken_inventory_transactions(batch_id);
CREATE INDEX idx_chicken_transactions_date ON chicken_inventory_transactions(transaction_date);
CREATE INDEX idx_chicken_transactions_type ON chicken_inventory_transactions(transaction_type);
CREATE INDEX idx_chicken_transactions_batch_date ON chicken_inventory_transactions(batch_id, transaction_date);
CREATE INDEX idx_chicken_transactions_reference ON chicken_inventory_transactions(reference_id, reference_type);

-- Trigger to auto-update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chicken_transactions_updated_at 
    BEFORE UPDATE ON chicken_inventory_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Usage Examples

### 1. Recording a Sale (Chicken Order)
```sql
-- When a chicken order deducts from a batch
INSERT INTO chicken_inventory_transactions (
    batch_id, 
    transaction_type, 
    quantity_changed, 
    reason, 
    reference_id, 
    reference_type, 
    transaction_date
) VALUES (
    123,  -- batch_id from live_chickens
    'sale',
    -50,   -- negative for deduction
    'Chicken order sale to customer John Doe',
    'CHICKEN_ORDER_456',  -- reference to chicken order
    'chicken_order',
    '2025-01-15'
);
```

### 2. Recording Mortality
```sql
-- When recording chicken mortality
INSERT INTO chicken_inventory_transactions (
    batch_id, 
    transaction_type, 
    quantity_changed, 
    reason, 
    reference_id, 
    reference_type, 
    transaction_date
) VALUES (
    123,
    'mortality',
    -10,
    'Natural mortality - respiratory illness',
    'MORTALITY_REPORT_789',
    'mortality_report',
    '2025-01-15'
);
```

### 3. Manual Adjustment
```sql
-- For manual count corrections
INSERT INTO chicken_inventory_transactions (
    batch_id, 
    transaction_type, 
    quantity_changed, 
    reason
) VALUES (
    123,
    'adjustment',
    5,
    'Manual count correction after physical verification'
);
```

## Reporting Queries

### Total Sales vs Mortality by Batch
```sql
SELECT 
    lc.batch_id,
    lc.breed,
    SUM(CASE WHEN cit.transaction_type = 'sale' THEN ABS(cit.quantity_changed) ELSE 0 END) as total_sold,
    SUM(CASE WHEN cit.transaction_type = 'mortality' THEN ABS(cit.quantity_changed) ELSE 0 END) as total_mortality,
    SUM(cit.quantity_changed) as net_change,
    lc.current_count as remaining
FROM live_chickens lc
LEFT JOIN chicken_inventory_transactions cit ON lc.id = cit.batch_id
WHERE cit.transaction_date >= '2025-01-01'
GROUP BY lc.id, lc.batch_id, lc.breed, lc.current_count
ORDER BY lc.batch_id;
```

### Monthly Sales and Mortality Report
```sql
SELECT 
    DATE_TRUNC('month', transaction_date) as month,
    SUM(CASE WHEN transaction_type = 'sale' THEN ABS(quantity_changed) ELSE 0 END) as monthly_sales,
    SUM(CASE WHEN transaction_type = 'mortality' THEN ABS(quantity_changed) ELSE 0 END) as monthly_mortality,
    SUM(CASE WHEN transaction_type = 'sale' THEN ABS(quantity_changed) ELSE 0 END) - 
    SUM(CASE WHEN transaction_type = 'mortality' THEN ABS(quantity_changed) ELSE 0 END) as net_available
FROM chicken_inventory_transactions
WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', transaction_date)
ORDER BY month DESC;
```

## Integration Points

1. **Chicken Orders**: When batch deduction occurs, insert a 'sale' transaction record
2. **Mortality Recording**: New UI component to record mortality with transaction logging
3. **Live Chicken Stock Page**: Display transaction history and breakdowns
4. **Reports Page**: Add chicken inventory analytics with sales vs mortality metrics
5. **Audit Trail**: All inventory changes are tracked with user attribution

## Data Integrity

- **Referential Integrity**: Foreign key constraints ensure valid batch references
- **Atomic Updates**: Use transactions to ensure batch count and transaction log are updated together
- **Audit Trail**: All changes are logged with timestamps and user attribution
- **Reconciliation**: Current_count in live_chickens can be verified against transaction history sum

## Migration Strategy

1. Create the new table with the schema above
2. Add triggers and indexes
3. Update AppContext to handle transaction logging for existing operations
4. Modify UI components to use the new logging functionality
5. Backfill historical data if needed (optional)
6. Test all integration points thoroughly