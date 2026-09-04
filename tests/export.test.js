const request = require('supertest');
const app = require('../src/server');

const sampleAnalysis = {
  url: 'https://ejemplo.com',
  statusCode: 200,
  technologies: [{ name: 'React', category: 'Frontend' }],
  securityHeaders: [
    { header: 'content-security-policy', present: true, value: "default-src 'self'" },
    { header: 'x-frame-options', present: false, value: null },
  ],
  securityScore: 50,
  scriptsFound: 2,
  stylesheetsFound: 1,
  analyzedAt: new Date().toISOString(),
};

describe('POST /api/export/json', () => {
  it('rechaza datos inválidos', async () => {
    const res = await request(app).post('/api/export/json').send({ foo: 'bar' });
    expect(res.status).toBe(400);
  });

  it('devuelve un archivo JSON descargable con los mismos datos', async () => {
    const res = await request(app).post('/api/export/json').send(sampleAnalysis);
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    const parsed = JSON.parse(res.text);
    expect(parsed.url).toBe(sampleAnalysis.url);
    expect(parsed.securityScore).toBe(50);
  });
});

describe('POST /api/export/pdf', () => {
  it('rechaza datos inválidos', async () => {
    const res = await request(app).post('/api/export/pdf').send({ foo: 'bar' });
    expect(res.status).toBe(400);
  });

  it('devuelve un PDF válido (magic bytes %PDF)', async () => {
    const res = await request(app)
      .post('/api/export/pdf')
      .send(sampleAnalysis)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.body.slice(0, 4).toString()).toBe('%PDF');
  });
});
