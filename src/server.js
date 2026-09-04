const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const analyzeRoute = require('./routes/analyze');
const exportRoute = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: false // desactivado para servir el frontend simple
}));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rate limiting: máximo 10 análisis por IP cada 15 minutos.
// Cada análisis abre un Chromium headless, así que es costoso en CPU/memoria.
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: (req) => ({ error: require('./i18n').msg(req, 'tooManyRequests') }),
});

app.use('/api/analyze', analyzeLimiter, analyzeRoute);
app.use('/api/export', exportRoute);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Solo levantamos el servidor si este archivo se ejecuta directamente
// (evita abrir un puerto real cuando lo importan los tests con supertest).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🛡️  VulnScan corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
