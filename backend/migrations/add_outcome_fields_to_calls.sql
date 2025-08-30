-- Add outcome fields to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS outcome VARCHAR(50);
ALTER TABLE calls ADD COLUMN IF NOT EXISTS outcome_notes TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS next_action TEXT;

-- Update existing calls to have empty outcome fields
UPDATE calls SET outcome = NULL, outcome_notes = NULL, next_action = NULL WHERE outcome IS NULL;
