const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());

// ===== CONFIG =====
const ALLOWED_DOMAINS = [
  'blogspot.com',
  'blogger.com',
  'blogspot.com.br',
];

const BAD_AGENTS = [
  'curl', 'wget', 'python', 'scrapy', 'httpie', 'postman',
  'insomnia', 'go-http-client', 'java/', 'libwww', 'okhttp',
  'axios', 'node-fetch', 'bot', 'crawler', 'spider',
  'scanner', 'nmap', 'nikto', 'masscan', 'zgrab', 'nuclei', 'sqlmap',
];
// =================

// ===== DISFARCE: Analytics falso =====
function sendFakeAnalytics(res) {
  // JS mínimo e realista, parece um loader do Google Analytics
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

// Ofuscador simples (rotação de string + base64 + eval wrapper)
function obfuscate(code) {
  const key = crypto.randomBytes(16).toString('hex');
  const encoded = Buffer.from(code, 'utf8').toString('base64');
  // quebra em pedaços pra não ficar gigante numa linha
  const chunks = encoded.match(/.{1,80}/g).join('\\\n');
  return `(function(){var _k='${key}';var _d='${chunks}';` +
         `var _c=atob(_d.replace(/\\s/g,''));` +
         `(new Function(_c))();})();`;
}
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

// Rota PRINCIPAL — disfarçada de Google Analytics
// Aceita /analytics/tracker.js E /device-spoofer.js (compatibilidade)
app.get(['/analytics/tracker.js', '/device-spoofer.js'], (req, res) => {
  const ua = (req.headers['user-agent'] || '').toLowerCase();

  // Bots/scanners → resposta falsa de API
  if (!ua || BAD_AGENTS.some(b => ua.includes(b))) {
    return sendFakeAPI(res);
  }

  const ref = req.headers.referer || req.headers.referrer || '';
  const org = req.headers.origin || '';
  const src = ref || org;
  const valid = ALLOWED_DOMAINS.some(d => src.includes(d));

  // Acesso direto (sem Referer) → finge ser um loader do Analytics
  if (!valid) {
    return sendFakeAnalytics(res);
  }

  // === Requisição legítima do blog ===
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

  const realCode = `
(function(){
'use strict';
var K='user_spoofer_enabled',V=2;
try{
  var p=new URLSearchParams(location.search);
  if(p.get('spoofer')==='on'){localStorage.setItem(K,'true');
    history.replaceState({},'',location.pathname);}
  else if(p.get('spoofer')==='off'){localStorage.removeItem(K);
    history.replaceState({},'',location.pathname);return;}
}catch(e){}
if(localStorage.getItem(K)!=='true')return;
function gen(){return'device_'+Date.now()+'_'+Math.random().toString(36).slice(2,9);}
function clr(){try{
  document.cookie.split(';').forEach(function(c){
    var n=c.split('=')[0].trim();
    if(n)document.cookie=n+'=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  });
  sessionStorage.clear();
  localStorage.removeItem('visit_counter');
  localStorage.removeItem('current_device_id');
}catch(e){}}
function fp(){try{
  var c=document.createElement('canvas'),x=c.getContext('2d');
  if(x){x.fillStyle='#'+Math.floor(Math.random()*16777215).toString(16);
    x.fillRect(0,0,220,30);}
}catch(e){}}
var v=parseInt(localStorage.getItem('visit_counter')||'0');
var u=localStorage.getItem('current_device_id');
v++;
if(v>=V||!u){clr();u=gen();v=1;}
localStorage.setItem('visit_counter',v.toString());
localStorage.setItem('current_device_id',u);
window.currentFakeUserId=u;
fp();
})();
  `;

  res.status(200).send(obfuscate(realCode));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
