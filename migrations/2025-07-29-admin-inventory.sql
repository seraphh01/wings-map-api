-- Add is_admin to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add inventory to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory INTEGER DEFAULT 0;
