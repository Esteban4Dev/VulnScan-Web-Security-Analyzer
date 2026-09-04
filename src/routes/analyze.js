const express = require('express');
const router = express.Router();
const { analyzeUrl } = require('../services/analyzer');
const { msg } = require('../i18n');

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: msg(req, 'invalidUrl') });
  }

  try {
    const result = await analyzeUrl(url);
    res.json(result);
  } catch (err) {
    console.error('Error analizando URL:', err.message);
    res.status(500).json({ error: msg(req, 'analyzeFailed'), detail: err.message });
  }
});

module.exports = router;
