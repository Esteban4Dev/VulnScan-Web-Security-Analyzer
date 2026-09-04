const MESSAGES = {
  es: {
    invalidUrl: 'URL inválida. Debe incluir http:// o https://',
    analyzeFailed: 'No se pudo analizar la URL',
    tooManyRequests: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.',
    invalidAnalysisData: 'Datos de análisis inválidos o incompletos',
  },
  en: {
    invalidUrl: 'Invalid URL. It must include http:// or https://',
    analyzeFailed: 'Could not analyze the URL',
    tooManyRequests: 'Too many requests. Please try again in a few minutes.',
    invalidAnalysisData: 'Invalid or incomplete analysis data',
  },
};

function getLang(req) {
  const lang = (req.headers['x-lang'] || 'es').toLowerCase();
  return MESSAGES[lang] ? lang : 'es';
}

function msg(req, key) {
  const lang = getLang(req);
  return MESSAGES[lang][key];
}

module.exports = { MESSAGES, getLang, msg };
