-- Add docs_json column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS docs_json JSONB DEFAULT '{}';

-- Update existing projects to have empty docs_json
UPDATE projects SET docs_json = '{}' WHERE docs_json IS NULL;
