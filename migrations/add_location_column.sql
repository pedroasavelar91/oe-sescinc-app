-- Migration: Add location column to classes table
-- Date: 2025-12-15
-- Description: Adds location/locality field for class training location

ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS location TEXT;

COMMENT ON COLUMN classes.location IS 'Training location/locality for the class';
