-- Migration: Create payments table in Supabase
-- This table stores payment records for instructors

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    schedule_item_id TEXT NOT NULL,
    instructor_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    date_paid TIMESTAMP NOT NULL,
    paid_by TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_schedule_item ON payments(schedule_item_id);
CREATE INDEX IF NOT EXISTS idx_payments_instructor ON payments(instructor_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date_paid);

-- Add comment
COMMENT ON TABLE payments IS 'Payment records for instructor classes and setup/teardown assignments';
COMMENT ON COLUMN payments.schedule_item_id IS 'ID of the schedule item or setup/teardown assignment';
COMMENT ON COLUMN payments.instructor_id IS 'ID of the instructor receiving payment';
COMMENT ON COLUMN payments.amount IS 'Payment amount in BRL';
COMMENT ON COLUMN payments.date_paid IS 'Date when payment was registered';
COMMENT ON COLUMN payments.paid_by IS 'ID of user who registered the payment';
