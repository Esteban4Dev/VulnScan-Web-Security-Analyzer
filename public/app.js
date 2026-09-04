// ---------- Diccionario de idiomas ----------
const translations = {
  es: {
    'hero.eyebrow': 'análisis de superficie de ataque',
    'hero.title': 'Escanea cualquier sitio en segundos',
    'hero.subtitle': 'Detecta tecnologías expuestas y verifica headers de seguridad HTTP.',
    'hero.placeholder': 'https://ejemplo.com',
    'hero.button': 'Analizar',
    'loading.text': 'Escaneando objetivo, esto puede tardar unos segundos...',
    'export.json': '↓ Exportar JSON',
    'export.pdf': '↓ Exportar PDF',
    'panel.tech': 'Tecnologías detectadas',
    'panel.score': 'Puntaje de seguridad',
    'panel.headers': 'Headers de seguridad',
    'footer.text': 'VulnScan · Herramienta de análisis para portafolio',
    'tech.empty': 'No se detectaron tecnologías conocidas',
    'status.present': 'presente',
    'status.missing': 'ausente',
    'error.emptyUrl': 'Ingresa una URL válida.',
    'error.generic': 'Error desconocido',
  },
  en: {
    'hero.eyebrow': 'attack surface analysis',
    'hero.title': 'Scan any site in seconds',
    'hero.subtitle': 'Detect exposed technologies and verify HTTP security headers.',
    'hero.placeholder': 'https://example.com',
    'hero.button': 'Scan',
    'loading.text': 'Scanning target, this may take a few seconds...',
    'export.json': '↓ Export JSON',
    'export.pdf': '↓ Export PDF',
    'panel.tech': 'Detected technologies',
    'panel.score': 'Security score',
    'panel.headers': 'Security headers',
    'footer.text': 'VulnScan · Portfolio analysis tool',
    'tech.empty': 'No known technologies detected',
    'status.present': 'present',
    'status.missing': 'missing',
    'error.emptyUrl': 'Enter a valid URL.',
    'error.generic': 'Unknown error',
  },
};

const LANG_STORAGE_KEY = 'vulnscan-lang';
let currentLang = localStorage.getItem(LANG_STORAGE_KEY) || 'es';

function t(key) {
  return translations[currentLang][key] || key;
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('.lang-option').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-lang') === lang);
  });

  // Si ya hay resultados en pantalla, re-renderizarlos en el nuevo idioma
  if (lastResult) renderResults(lastResult);
}

document.getElementById('langToggle').addEventListener('click', () => {
  applyLanguage(currentLang === 'es' ? 'en' : 'es');
});

// ---------- Referencias DOM ----------
const urlInput = document.getElementById('urlInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const errorMsg = document.getElementById('errorMsg');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const techList = document.getElementById('techList');
const securityScore = document.getElementById('securityScore');
const scoreBarFill = document.getElementById('scoreBarFill');
const headersList = document.getElementById('headersList');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');

let lastResult = null;

// ---------- Análisis ----------
async function analyze() {
  const url = urlInput.value.trim();
  errorMsg.textContent = '';
  results.classList.add('d-none');

  if (!url) {
    errorMsg.textContent = t('error.emptyUrl');
    return;
  }

  loading.classList.remove('d-none');
  analyzeBtn.disabled = true;

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Lang': currentLang },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || t('error.generic'));
    }

    renderResults(data);
  } catch (err) {
    errorMsg.textContent = err.message;
  } finally {
    loading.classList.add('d-none');
    analyzeBtn.disabled = false;
  }
}

function renderResults(data) {
  lastResult = data;

  // Tecnologías
  techList.innerHTML = '';
  if (!data.technologies || data.technologies.length === 0) {
    techList.innerHTML = `<span class="tech-empty">${t('tech.empty')}</span>`;
  } else {
    data.technologies.forEach(tech => {
      const badge = document.createElement('span');
      badge.className = 'tech-badge';
      const name = typeof tech === 'string' ? tech : tech.name;
      const category = typeof tech === 'string' ? '' : tech.category;
      badge.innerHTML = category
        ? `${name}<span class="tech-category">${category}</span>`
        : name;
      techList.appendChild(badge);
    });
  }

  // Puntaje
  securityScore.textContent = data.securityScore;
  let barColor = 'var(--danger)';
  if (data.securityScore >= 70) barColor = 'var(--success)';
  else if (data.securityScore >= 40) barColor = 'var(--warning)';
  scoreBarFill.style.width = `${data.securityScore}%`;
  scoreBarFill.style.background = barColor;

  // Headers — filas expandibles, sin truncar información
  headersList.innerHTML = '';
  data.securityHeaders.forEach(h => {
    const row = document.createElement('div');
    row.className = 'header-row';

    const statusLabel = h.present ? t('status.present') : t('status.missing');
    const statusClass = h.present ? 'present' : 'missing';
    const preview = h.value ? h.value : '—';

    row.innerHTML = `
      <div class="header-row-top">
        <span class="header-name">${h.header}</span>
        <span class="header-status">
          <span class="status-dot ${statusClass}"></span>
          ${statusLabel}
        </span>
      </div>
      ${h.value ? `<div class="header-value-preview">${preview}</div>
      <div class="header-value-full">${h.value}</div>` : ''}
    `;

    if (h.value) {
      row.addEventListener('click', () => row.classList.toggle('expanded'));
    }

    headersList.appendChild(row);
  });

  results.classList.remove('d-none');
}

// ---------- Exportación ----------
async function downloadExport(format) {
  if (!lastResult) return;

  const btn = format === 'pdf' ? exportPdfBtn : exportJsonBtn;
  btn.disabled = true;

  try {
    const res = await fetch(`/api/export/${format}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Lang': currentLang },
      body: JSON.stringify(lastResult),
    });

    if (!res.ok) throw new Error(t('error.generic'));

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vulnscan-report.${format === 'pdf' ? 'pdf' : 'json'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    errorMsg.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
}

// ---------- Eventos ----------
analyzeBtn.addEventListener('click', analyze);
urlInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') analyze();
});
exportJsonBtn.addEventListener('click', () => downloadExport('json'));
exportPdfBtn.addEventListener('click', () => downloadExport('pdf'));

// Idioma inicial (recuerda la última elección del usuario)
applyLanguage(currentLang);
