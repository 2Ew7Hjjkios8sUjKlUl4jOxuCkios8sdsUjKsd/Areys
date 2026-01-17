
-- Add default_booking_reference and default_flight_number to airlines table
ALTER TABLE airlines ADD COLUMN IF NOT EXISTS default_booking_reference TEXT;
ALTER TABLE airlines ADD COLUMN IF NOT EXISTS default_flight_number TEXT;
