-- Migration: Add product_photos table for multiple product images
CREATE TABLE IF NOT EXISTS product_photos (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    photo_order INTEGER DEFAULT 0
);
