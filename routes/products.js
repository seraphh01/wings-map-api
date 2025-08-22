const { authenticateToken, requireAdmin } = require('../middleware/auth');
const pool = require('../db');
const express = require('express');
const multer = require('multer');
const s3Client = require('../s3');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const router = express.Router();

// Use multer memory storage for S3
const upload = multer({ storage: multer.memoryStorage() });
// Upload a photo for a product (admin only, S3 v3)
router.post('/:id/photos', authenticateToken, requireAdmin, upload.single('photo'), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { alt_text, photo_order } = req.body;
  const bucket = process.env.S3_BUCKET_NAME;
  const ext = path.extname(req.file.originalname);
  const key = `products/${id}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  try {
    // Upload to S3 (v3)
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });
    await s3Client.send(putCommand);
    const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    // Save S3 URL in DB
    const result = await pool.query(
      'INSERT INTO product_photos (product_id, url, alt_text, photo_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, url, alt_text || null, photo_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// List all photos for a product
router.get('/:id/photos', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM product_photos WHERE product_id = $1 ORDER BY photo_order ASC, id ASC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Delete a photo (admin only, S3 v3)
router.delete('/photos/:photoId', authenticateToken, requireAdmin, async (req, res) => {
  const { photoId } = req.params;
  try {
    // Get photo info
    const photoRes = await pool.query('SELECT * FROM product_photos WHERE id = $1', [photoId]);
    if (!photoRes.rows.length) return res.status(404).json({ error: 'Photo not found' });
    const photo = photoRes.rows[0];
    // Delete from DB
    await pool.query('DELETE FROM product_photos WHERE id = $1', [photoId]);
    // Delete from S3 (v3)
    const bucket = process.env.S3_BUCKET_NAME;
    const url = photo.url;
    const keyMatch = url.match(/products\/[^\/]+\/[^\/]+$/);
    const key = keyMatch ? keyMatch[0] : null;
    if (key) {
      const delCommand = new DeleteObjectCommand({ Bucket: bucket, Key: key });
      await s3Client.send(delCommand);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete photo from S3' });
  }
});

// Get all products with photos
router.get('/', async (req, res) => {
  try {
    // Get all products
    const productsRes = await pool.query('SELECT * FROM products');
    const products = productsRes.rows;
    if (!products.length) return res.json([]);

    // Get all photos for these products
    const ids = products.map(p => p.id);
    const photosRes = await pool.query(
      'SELECT * FROM product_photos WHERE product_id = ANY($1) ORDER BY photo_order ASC, id ASC',
      [ids]
    );
    const photosByProduct = {};
    photosRes.rows.forEach(photo => {
      if (!photosByProduct[photo.product_id]) photosByProduct[photo.product_id] = [];
      photosByProduct[photo.product_id].push(photo.url);
    });

    // Attach photos array to each product
    const withPhotos = products.map(p => ({
      ...p,
      photos: photosByProduct[p.id] || []
    }));
    res.json(withPhotos);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch products' + err });
  }
});

// Add a product (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, price, height, inventory, stability, portability, idealFor } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, height, inventory, stability, portability, idealFor) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, description, price, height, inventory || 0, stability || null, portability || null, idealFor || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Update a product (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, height, inventory, stability, portability, idealFor } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET name=$1, description=$2, price=$3, height=$4, inventory=$5, stability=$6, portability=$7, idealFor=$8 WHERE id=$9 RETURNING *',
      [name, description, price, height, inventory, stability, portability, idealFor, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete a product (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
