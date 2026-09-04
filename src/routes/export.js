const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { msg } = require('../i18n');

function isValidAnalysis(data) {
  return data && typeof data.url === 'string' && Array.isArray(data.securityHeaders);
}

// POST /api/export/json  -> descarga el resultado tal cual como archivo .json
router.post('/json', (req, res) => {
  const data = req.body;
  if (!isValidAnalysis(data)) {
    return res.status(400).json({ error: msg(req, 'invalidAnalysisData') });
  }

  const filename = `vulnscan-report-${Date.now()}.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(data, null, 2));
});

// POST /api/export/pdf -> genera un reporte PDF a partir del resultado del análisis
router.post('/pdf', (req, res) => {
  const data = req.body;
  if (!isValidAnalysis(data)) {
    return res.status(400).json({ error: msg(req, 'invalidAnalysisData') });
  }

  const filename = `vulnscan-report-${Date.now()}.pdf`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/pdf');

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  const lang = require('../i18n').getLang(req);
  const L = lang === 'en'
    ? {
        title: 'VulnScan — Web Security Report',
        generated: 'Generated',
        general: 'General information',
        analyzedUrl: 'Analyzed URL',
        statusCode: 'HTTP status code',
        score: 'Security score',
        scripts: 'Scripts found',
        stylesheets: 'Stylesheets found',
        techTitle: 'Detected technologies',
        noTech: 'No known technologies detected.',
        headersTitle: 'Security headers',
        present: 'Present',
        absent: 'Missing',
      }
    : {
        title: 'VulnScan — Reporte de Seguridad Web',
        generated: 'Generado',
        general: 'Información general',
        analyzedUrl: 'URL analizada',
        statusCode: 'Código de estado HTTP',
        score: 'Puntaje de seguridad',
        scripts: 'Scripts encontrados',
        stylesheets: 'Hojas de estilo encontradas',
        techTitle: 'Tecnologías detectadas',
        noTech: 'No se detectaron tecnologías conocidas.',
        headersTitle: 'Headers de seguridad',
        present: 'Presente',
        absent: 'Ausente',
      };

  // Encabezado
  doc.fontSize(20).text(L.title, { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).fillColor('#555').text(`${L.generated}: ${new Date().toLocaleString(lang === 'en' ? 'en-US' : 'es-CL')}`, {
    align: 'center',
  });
  doc.moveDown(2);

  // Datos generales
  doc.fillColor('#000').fontSize(14).text(L.general, { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11);
  doc.text(`${L.analyzedUrl}: ${data.url}`);
  doc.text(`${L.statusCode}: ${data.statusCode}`);
  doc.text(`${L.score}: ${data.securityScore}/100`);
  doc.text(`${L.scripts}: ${data.scriptsFound}`);
  doc.text(`${L.stylesheets}: ${data.stylesheetsFound}`);
  doc.moveDown(1.5);

  // Tecnologías
  doc.fontSize(14).text(L.techTitle, { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11);
  if (!data.technologies || data.technologies.length === 0) {
    doc.text(L.noTech);
  } else {
    data.technologies.forEach(tech => {
      const label = typeof tech === 'string' ? tech : `${tech.name} (${tech.category})`;
      doc.text(`• ${label}`);
    });
  }
  doc.moveDown(1.5);

  // Headers de seguridad
  doc.fontSize(14).text(L.headersTitle, { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11);
  data.securityHeaders.forEach(h => {
    const status = h.present ? L.present : L.absent;
    doc.text(`${h.header}: ${status}${h.value ? ' — ' + h.value : ''}`);
  });

  doc.end();
});

module.exports = router;
