const request = require('supertest');
const app = require('../src/server');

describe('GET /api/health', () => {
  it('responde con status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });
});
