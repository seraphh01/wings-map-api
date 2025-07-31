-- Rename guest_email to email
ALTER TABLE orders RENAME COLUMN guest_email TO email;

-- For orders with a user_id, set email to the user's email
UPDATE orders o
SET email = u.email
FROM users u
WHERE o.user_id = u.id;

-- (user_id column is kept for reference, but all lookups should use email)
