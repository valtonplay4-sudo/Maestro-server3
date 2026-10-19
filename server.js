const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());

// ===== CONFIG =====
const ALLOWED_DOMAINS = [
  'blogspot.com',
  'blogger.com',
  'blogspot.com.br',
  // adicione seu domínio customizado aqui se usar:
  // 'seudominio.com',
];

const BAD_AGENTS = [
  'curl', 'wget', 'python', 'scrapy', 'httpie', 'postman',
  'insomnia', 'go-http-client', 'java/', 'libwww', 'okhttp',
  'axios', 'node-fetch', 'bot', 'crawler', 'spider',
  'scanner', 'nmap', 'nikto', 'masscan', 'zgrab', 'nuclei', 'sqlmap',
];
// =================

function sendFakeAnalytics(res) {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(200).send(
    `/* Google Analytics Loader */\n` +
    `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':` +
    `new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],` +
    `j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;` +
    `j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;` +
    `f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','G-0000000');`
  );
}

function sendFakeAPI(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Powered-By', 'Analytics Gateway');
  res.status(200).send(JSON.stringify({
    status: 'ok',
    service: 'analytics-collector',
    version: '4.2.1',
    timestamp: new Date().toISOString(),
    region: 'us-east-1'
  }, null, 2));
}

// ============================================================
// SCRIPT REAL — corrigido
// BUGS CORRIGIDOS:
//  1. clearTracking() agora preserva o flag 'user_spoofer_enabled'
//  2. Ordem: limpa ANTES de setar novo ID
//  3. Aceita spoofer=on/off/n (n = liga também, alias de on)
//  4. Não apaga o próprio flag do spoofer
// ============================================================
const realCode = String.raw`
(function(){
'use strict';

var FLAG = 'user_spoofer_enabled';
var VISITS_TO_RESET = 2;

// ---------- 1. Ler query string ----------
var params;
try { params = new URLSearchParams(location.search); } catch(e){ params = null; }

if (params) {
  var s = params.get('spoofer');
  if (s === 'on' || s === 'n' || s === '1' || s === 'true') {
    try { localStorage.setItem(FLAG, 'true'); } catch(e){}
    try { history.replaceState({}, '', location.pathname + location.hash); } catch(e){}
  } else if (s === 'off' || s === '0' || s === 'false') {
    try { localStorage.removeItem(FLAG); } catch(e){}
    try { history.replaceState({}, '', location.pathname + location.hash); } catch(e){}
    return; // desliga tudo
  }
}

// ---------- 2. Checar se está ativo ----------
var ativo = false;
try { ativo = localStorage.getItem(FLAG) === 'true'; } catch(e){}
if (!ativo) return;

// ---------- 3. Helpers ----------
function genId(){
  return 'device_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
}

// Limpa TUDO, exceto o flag do spoofer (senão ele se auto-desliga)
function clearTracking(){
  try {
    document.cookie.split(';').forEach(function(c){
      var name = c.split('=')[0].trim();
      if (name) {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + location.hostname;
      }
    });
  } catch(e){}
  try {
    sessionStorage.clear();
  } catch(e){}
  try {
    // remove só as chaves do spoofer, preservando FLAG
    var keep = {};
    keep[FLAG] = localStorage.getItem(FLAG);
    localStorage.clear();
    if (keep[FLAG] !== null && keep[FLAG] !== undefined) {
      localStorage.setItem(FLAG, keep[FLAG]);
    }
  } catch(e){}
}

function spoofFingerprint(){
  try {
    var c = document.createElement('canvas');
    var x = c.getContext('2d');
    if (!x) return;
    x.fillStyle = '#' + Math.floor(Math.random()*16777215).toString(16);
    x.fillRect(0, 0, 220, 30);
    x.fillStyle = '#ffffff';
    x.font = '14px Arial';
    x.fillText('Device ' + Math.random().toString(36).slice(2, 8), 10, 20);
  } catch(e){}
}

// ---------- 4. Lógica principal ----------
var visitCount = 0;
var currentUserId = null;
try {
  visitCount = parseInt(localStorage.getItem('visit_counter') || '0', 10);
  currentUserId = localStorage.getItem('current_device_id');
} catch(e){}

visitCount++;

if (visitCount >= VISITS_TO_RESET || !currentUserId) {
  // PRIMEIRO limpa, DEPOIS gera novo ID
  clearTracking();
  currentUserId = genId();
  visitCount = 1;
}

try {
  localStorage.setItem('visit_counter', String(visitCount));
  localStorage.setItem('current_device_id', currentUserId);
} catch(e){}

window.currentFakeUserId = currentUserId;

spoofFingerprint();

try {
  console.log(
    '%c[Custom Ads] Visita ' + visitCount + '/' + VISITS_TO_RESET +
    ' | Device ID: ' + currentUserId,
    'color: #00ff88; font-weight: bold'
  );
} catch(e){}

})();
`;

// =====================================

// Página inicial (disfarçada)
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html><html><head><title>Analytics Gateway</title>` +
    `<style>body{font-family:sans-serif;max-width:600px;margin:60px auto;color:#333}` +
    `code{background:#f0f0f0;padding:2px 6px;border-radius:3px}</style></head>` +
    `<body><h1>Analytics Gateway API</h1>` +
    `<p>Serviço de coleta e agregação de métricas.</p>` +
    `<p>Status: <b style="color:green">operacional</b></p>` +
    `<p>Versão 4.2.1 · Região us-east-1</p></body></html>`);
});

// Rota PRINCIPAL do script
app.get(['/analytics/tracker.js', '/device-spoofer.js'], (req, res) => {
  const ua = (req.headers['user-agent'] || '').toLowerCase();

  // Bots/scanners → resposta falsa
  if (!ua || BAD_AGENTS.some(b => ua.includes(b))) {
    return sendFakeAPI(res);
  }

  const ref = req.headers.referer || req.headers.referrer || '';
  const org = req.headers.origin || '';
  const src = ref || org;

  // Se não tiver referer (acesso direto p/ teste), ENTREGA O SCRIPT
  // (antes bloqueava, e isso quebrava o teste no navegador)
  if (src) {
    const valid = ALLOWED_DOMAINS.some(d => src.includes(d));
    if (!valid) {
      // Domínio não autorizado → finge ser loader do GA
      return sendFakeAnalytics(res);
    }
  }

  // === Requisição legítima ===
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

  // Envia código LIMPO (sem obfuscação que quebrava o parser)
  res.status(200).send(realCode);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
