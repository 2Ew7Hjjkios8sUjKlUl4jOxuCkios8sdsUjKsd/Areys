-- Add date_of_issue column to passengers table
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS date_of_issue DATE DEFAULT CURRENT_DATE;

-- Update RLS if necessary (usually not needed for just a new column if policies are broad)
COMMENT ON COLUMN passengers.date_of_issue IS 'The date the ticket was issued';
