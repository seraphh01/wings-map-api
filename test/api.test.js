const request = require('supertest');
const express = require('express');
const app = require('../index');

describe('API Endpoints', () => {
  let server;
  beforeAll((done) => {
    server = app.listen(4000, done);
  });
  afterAll((done) => {
    server.close(done);
  });

  describe('Auth', () => {
    it('should register a new user', async () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const res = await request(server)
        .post('/api/auth/register')
        .send({ email: uniqueEmail, password: 'testpass123' });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('email', uniqueEmail);
    });
    it('should login the user', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: 'testuser@example.com', password: 'testpass123' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
  });

  describe('Products', () => {
    let productId;
    it('should add a product', async () => {
      const res = await request(server)
        .post('/api/products')
        .send({ name: 'Parallel Bars', description: 'Wooden bars', price: 99.99, size: 'medium' });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('name', 'Parallel Bars');
      productId = res.body.id;
    });
    it('should get all products', async () => {
      const res = await request(server).get('/api/products');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
    it('should update a product', async () => {
      const res = await request(server)
        .put(`/api/products/${productId}`)
        .send({ name: 'Parallel Bars XL', description: 'Bigger bars', price: 129.99, size: 'large' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', 'Parallel Bars XL');
    });
    it('should delete a product', async () => {
      const res = await request(server).delete(`/api/products/${productId}`);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('Orders', () => {
    it('should place an order as guest', async () => {
      const res = await request(server)
        .post('/api/orders')
        .send({ email: 'guest@example.com', items: [], shipping_address: '123 Street' });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
    });
  });
});
