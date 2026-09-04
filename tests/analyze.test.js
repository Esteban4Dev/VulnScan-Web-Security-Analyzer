// Mockeamos el servicio de análisis para no depender de un navegador real
// (Puppeteer) durante los tests; así son rápidos y deterministas.
jest.mock('../src/services/analyzer', () => ({
  analyzeUrl: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/server');
const { analyzeUrl } = require('../src/services/analyzer');

describe('POST /api/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rechaza si no se envía url', async () => {
    const res = await request(app).post('/api/analyze').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/URL inválida/i);
  });

  it('rechaza urls con formato inválido', async () => {
    const res = await request(app).post('/api/analyze').send({ url: 'no-es-una-url' });
    expect(res.status).toBe(400);
  });

  it('rechaza protocolos no http/https', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ url: 'ftp://ejemplo.com' });
    expect(res.status).toBe(400);
  });

  it('devuelve el resultado del análisis para una url válida', async () => {
    const fakeResult = {
      url: 'https://ejemplo.com',
      statusCode: 200,
      technologies: [{ name: 'React', category: 'Frontend' }],
      securityHeaders: [
        { header: 'content-security-policy', present: true, value: "default-src 'self'" },
      ],
      securityScore: 83,
      scriptsFound: 3,
      stylesheetsFound: 1,
      analyzedAt: new Date().toISOString(),
    };
    analyzeUrl.mockResolvedValue(fakeResult);

    const res = await request(app)
      .post('/api/analyze')
      .send({ url: 'https://ejemplo.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeResult);
    expect(analyzeUrl).toHaveBeenCalledWith('https://ejemplo.com');
  });

  it('devuelve 500 si el análisis falla', async () => {
    analyzeUrl.mockRejectedValue(new Error('timeout al cargar la página'));

    const res = await request(app)
      .post('/api/analyze')
      .send({ url: 'https://ejemplo.com' });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/no se pudo analizar/i);
  });
});
