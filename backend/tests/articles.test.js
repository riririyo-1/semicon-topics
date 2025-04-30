import request from 'supertest';
import express from 'express';
import pool from '../src/db.js';
import dotenv from 'dotenv';
import appModule from '../src/index.js';

dotenv.config();

let app;

beforeAll(() => {
  // src/index.jsがappをexportしている場合はそれを使う
  app = appModule.app || appModule;
});

afterAll(async () => {
  await pool.end();
});

describe('GET /api/articles', () => {
  it('should return 200 and an array', async () => {
    const res = await request(app).get('/api/articles');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});