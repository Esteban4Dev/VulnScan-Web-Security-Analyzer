const puppeteer = require('puppeteer');

/**
 * Firmas simples para detección de tecnologías (estilo Wappalyzer, simplificado).
 * Se pueden ampliar fácilmente agregando más entradas.
 */
const TECH_SIGNATURES = [
  // Frontend frameworks
  { name: 'React', type: 'script', category: 'Frontend', pattern: /react(\.min)?\.js|__REACT_DEVTOOLS/i },
  { name: 'Vue.js', type: 'script', category: 'Frontend', pattern: /vue(\.min)?\.js|__VUE__/i },
  { name: 'Angular', type: 'script', category: 'Frontend', pattern: /angular(\.min)?\.js|ng-version/i },
  { name: 'Svelte', type: 'script', category: 'Frontend', pattern: /svelte/i },
  { name: 'Next.js', type: 'script', category: 'Frontend', pattern: /_next\/static|__NEXT_DATA__/i },
  { name: 'jQuery', type: 'script', category: 'Frontend', pattern: /jquery(\.min)?\.js/i },
  { name: 'Bootstrap', type: 'link', category: 'Frontend', pattern: /bootstrap(\.min)?\.css/i },
  { name: 'Tailwind CSS', type: 'link', category: 'Frontend', pattern: /tailwind/i },

  // CMS
  { name: 'WordPress', type: 'meta', category: 'CMS', pattern: /wp-content|wordpress/i },
  { name: 'Drupal', type: 'meta', category: 'CMS', pattern: /drupal/i },
  { name: 'Shopify', type: 'meta', category: 'CMS', pattern: /cdn\.shopify\.com|shopify/i },
  { name: 'Wix', type: 'meta', category: 'CMS', pattern: /wix\.com|wixstatic/i },

  // Analytics / Marketing
  { name: 'Google Analytics', type: 'script', category: 'Analytics', pattern: /googletagmanager|gtag\/js|analytics\.js/i },
  { name: 'Meta Pixel', type: 'script', category: 'Analytics', pattern: /connect\.facebook\.net|fbevents\.js/i },
  { name: 'Hotjar', type: 'script', category: 'Analytics', pattern: /hotjar/i },

  // CDN
  { name: 'Cloudflare', type: 'header', category: 'CDN/WAF', pattern: /cloudflare/i },
  { name: 'Amazon CloudFront', type: 'header', category: 'CDN/WAF', pattern: /cloudfront/i },
  { name: 'Fastly', type: 'header', category: 'CDN/WAF', pattern: /fastly/i },
  { name: 'Akamai', type: 'header', category: 'CDN/WAF', pattern: /akamai/i },

  // WAF
  { name: 'Cloudflare WAF', type: 'header', category: 'CDN/WAF', pattern: /cf-mitigated|__cfwaitingroom/i },
  { name: 'Sucuri WAF', type: 'header', category: 'CDN/WAF', pattern: /sucuri/i },
  { name: 'Imperva/Incapsula', type: 'header', category: 'CDN/WAF', pattern: /incap_ses|incapsula/i },
  { name: 'AWS WAF', type: 'header', category: 'CDN/WAF', pattern: /awselb|x-amzn-requestid/i },

  // Backend / servidor (vía headers)
  { name: 'Express (Node.js)', type: 'header', category: 'Backend', pattern: /express/i },
  { name: 'PHP', type: 'header', category: 'Backend', pattern: /php/i },
  { name: 'ASP.NET', type: 'header', category: 'Backend', pattern: /asp\.net|x-aspnet-version/i },
  { name: 'Django', type: 'header', category: 'Backend', pattern: /wsgiserver|django/i },
  { name: 'Ruby on Rails', type: 'header', category: 'Backend', pattern: /rails|passenger/i },
  { name: 'Nginx', type: 'header', category: 'Backend', pattern: /nginx/i },
  { name: 'Apache', type: 'header', category: 'Backend', pattern: /apache/i },
];

const SECURITY_HEADERS = [
  'content-security-policy',
  'strict-transport-security',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
];

async function analyzeUrl(targetUrl) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 WebSecurityAnalyzer/1.0'
    );

    const scriptSrcs = [];
    const linkHrefs = [];

    page.on('response', () => {}); // reservado para futura inspección de respuestas

    const response = await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: 20000,
    });

    const headers = response.headers();

    // Extraer scripts y links del DOM renderizado
    const domData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href);
      const metas = Array.from(document.querySelectorAll('meta')).map(
        m => `${m.getAttribute('name')}:${m.getAttribute('content')}`
      );
      const html = document.documentElement.outerHTML.slice(0, 20000); // limitar tamaño
      return { scripts, links, metas, html };
    });

    scriptSrcs.push(...domData.scripts);
    linkHrefs.push(...domData.links);

    // Detección de tecnologías
    const detectedTech = [];
    const seenNames = new Set();
    for (const sig of TECH_SIGNATURES) {
      let haystack = '';
      if (sig.type === 'script') haystack = scriptSrcs.join(' ') + ' ' + domData.html;
      if (sig.type === 'link') haystack = linkHrefs.join(' ');
      if (sig.type === 'meta') haystack = domData.metas.join(' ') + ' ' + domData.html;
      if (sig.type === 'header') haystack = JSON.stringify(headers);

      if (sig.pattern.test(haystack) && !seenNames.has(sig.name)) {
        detectedTech.push({ name: sig.name, category: sig.category || 'Otro' });
        seenNames.add(sig.name);
      }
    }

    // Análisis de headers de seguridad
    const securityAnalysis = SECURITY_HEADERS.map(header => ({
      header,
      present: Boolean(headers[header]),
      value: headers[header] || null,
    }));

    const missingCount = securityAnalysis.filter(h => !h.present).length;
    const securityScore = Math.round(
      ((SECURITY_HEADERS.length - missingCount) / SECURITY_HEADERS.length) * 100
    );

    return {
      url: targetUrl,
      statusCode: response.status(),
      technologies: detectedTech,
      securityHeaders: securityAnalysis,
      securityScore,
      scriptsFound: scriptSrcs.length,
      stylesheetsFound: linkHrefs.length,
      analyzedAt: new Date().toISOString(),
    };
  } finally {
    await browser.close();
  }
}

module.exports = { analyzeUrl };
