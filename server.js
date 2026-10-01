const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());

// ===== CONFIGURAÇÃO DE PROTEÇÃO =====
// Domínios autorizados a carregar o script (adicione os seus)
const ALLOWED_DOMAINS = [
  'blogspot.com',
  'blogger.com',
  'blogspot.com.br',
  // 'seudominio.com',
];

// Opcional: se quiser exigir token secreto via ?t=SEU_TOKEN
// Deixe null para desativar essa checagem extra
const SECRET_TOKEN = process.env.SCRIPT_TOKEN || null;

// Bots/scanners conhecidos que tentam baixar scripts
const BAD_AGENTS = [
  'curl', 'wget', 'python', 'python-requests', 'scrapy',
  'httpie', 'postman', 'insomnia', 'go-http-client',
  'java/', 'libwww', 'okhttp', 'axios', 'node-fetch',
  'bot', 'crawler', 'spider', 'scanner', 'nmap', 'nikto',
  'masscan', 'zgrab', 'nuclei', 'sqlmap',
];
// =====================================

// Página informativa simples para o servidor
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Servidor de Script</title>
      <style>
        body { font-family: sans-serif; background: #0f172a; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 25px; border-radius: 12px; text-align: center; max-width: 400px; border: 1px solid #334155; }
        code { background: #090d16; padding: 4px 8px; border-radius: 4px; color: #38bdf8; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Ativação Individual</h2>
        <p>Para ativar o script no seu navegador, acesse o seu blog adicionando:</p>
        <p><code>?spoofer=on</code></p>
        <p>Para desativar no seu navegador, acesse:</p>
        <p><code>?spoofer=off</code></p>
      </div>
    </body>
    </html>
  `);
});

// Arquivo do script fornecido ao Blogger (PROTEGIDO)
app.get('/device-spoofer.js', (req, res) => {
  // --- PROTEÇÃO 1: bloqueia bots/scanners conhecidos ---
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  if (!ua || BAD_AGENTS.some(bad => ua.includes(bad))) {
    return res.status(403).type('text/plain').send('Forbidden');
  }

  // --- PROTEÇÃO 2: exige Referer de domínio autorizado ---
  const referer = req.headers.referer || req.headers.referrer || '';
  const origin  = req.headers.origin || '';
  const source  = referer || origin;

  const hasValidSource = ALLOWED_DOMAINS.some(domain => source.includes(domain));

  if (!hasValidSource) {
    // Retorna um JS inofensivo em vez de 403 puro,
    // para o site não "quebrar" caso o Referer falhe
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).send('/* resource unavailable */');
  }

  // --- PROTEÇÃO 3 (opcional): token secreto via query ---
  if (SECRET_TOKEN && req.query.t !== SECRET_TOKEN) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).send('/* resource unavailable */');
  }

  // --- Headers de segurança ---
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  const scriptContent = `
(function() {
    'use strict';

    const STORAGE_KEY = 'user_spoofer_enabled';
    const VISITS_TO_RESET = 2;

    // 1. Verifica se o usuário enviou o comando de ativação ou desativação pela URL
    try {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('spoofer') === 'on') {
            localStorage.setItem(STORAGE_KEY, 'true');
            // Limpa o parâmetro da URL sem recarregar a página
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (urlParams.get('spoofer') === 'off') {
            localStorage.removeItem(STORAGE_KEY);
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }
    } catch(e) {}

    // 2. Bloqueia a execução se este navegador específico não ativou a chave
    if (localStorage.getItem(STORAGE_KEY) !== 'true') {
        return;
    }

    // 3. Execução da simulação para navegadores autorizados
    function generateNewUserId() {
        return 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    function clearTracking() {
        try {
            document.cookie.split(";").forEach(cookie => {
                const name = cookie.split("=")[0].trim();
                if (name) {
                    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
                }
            });
            
            // Apaga dados temporários mantendo a chave de permissão
            sessionStorage.clear();
            localStorage.removeItem('visit_counter');
            localStorage.removeItem('current_device_id');
        } catch(e) {}
    }

    function spoofFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#' + Math.floor(Math.random()*16777215).toString(16);
                ctx.fillRect(0, 0, 220, 30);
            }
        } catch(e) {}
    }

    let visitCount = parseInt(localStorage.getItem('visit_counter') || '0');
    let currentUserId = localStorage.getItem('current_device_id');

    visitCount++;

    if (visitCount >= VISITS_TO_RESET || !currentUserId) {
        clearTracking();
        currentUserId = generateNewUserId();
        visitCount = 1;
    }

    localStorage.setItem('visit_counter', visitCount.toString());
    localStorage.setItem('current_device_id', currentUserId);

    window.currentFakeUserId = currentUserId;

    spoofFingerprint();

    console.log('[Spoofer Ativo no Dispositivo] Visita: ' + visitCount + ' | ID: ' + currentUserId);
})();
  `;

  res.status(200).send(scriptContent);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
