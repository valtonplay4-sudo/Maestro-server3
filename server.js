const express = require('express');
const app = express();

const PORT = process.env.PORT || 10000;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const BAD_AGENTS = [
  'curl', 'wget', 'python', 'scrapy', 'httpie', 'postman',
  'insomnia', 'go-http-client', 'java/', 'libwww', 'okhttp',
  'axios', 'node-fetch', 'bot', 'crawler', 'spider',
  'scanner', 'nmap', 'nikto', 'masscan', 'zgrab', 'nuclei', 'sqlmap',
];

// O código do spoofer — EXATAMENTE o que está acima
const realCode = String.raw`(function(){
'use strict';
var TAG = '%c[CustomAds]';
var OK  = 'color:#00ff88;font-weight:bold';
var ERR = 'color:#ff5555;font-weight:bold';
var INF = 'color:#66ccff;font-weight:bold';
function log(msg, style){ try { console.log(TAG + ' ' + msg, style || INF); } catch(e){} }
log('=== script carregado ===', INF);
var FLAG = 'user_spoofer_enabled';
var VISITS_TO_RESET = 2;
var LS_OK = false;
try { localStorage.setItem('__t','1'); localStorage.removeItem('__t'); LS_OK = true; log('localStorage: OK', OK); }
catch(e){ log('localStorage BLOQUEADO: ' + e.message, ERR); }
var MEM = {};
function lsGet(k){ if (LS_OK) { try { return localStorage.getItem(k); } catch(e){} } return (k in MEM) ? MEM[k] : null; }
function lsSet(k,v){ if (LS_OK) { try { localStorage.setItem(k, v); return; } catch(e){} } MEM[k] = v; }
function lsDel(k){ if (LS_OK) { try { localStorage.removeItem(k); } catch(e){} } delete MEM[k]; }
var qs = ''; try { qs = location.search || ''; } catch(e){}
log('URL: ' + (location.href || '?'), INF);
var s = null;
try {
  if (typeof URLSearchParams !== 'undefined') { s = new URLSearchParams(qs).get('spoofer'); }
  else { var m = qs.match(/[?&]spoofer=([^&]*)/); s = m ? decodeURIComponent(m[1]) : null; }
} catch(e){ log('URLSearchParams falhou: ' + e.message, ERR); }
log('spoofer = "' + s + '"', INF);
if (s === 'on' || s === 'n' || s === '1' || s === 'true') {
  lsSet(FLAG, 'true'); log('spoofer LIGADO', OK);
  try { var clean = location.href.replace(/([?&])spoofer=[^&]*(&|$)/, function(_,a,b){ return b ? a : ''; }).replace(/[?&]$/, ''); history.replaceState({}, '', clean); } catch(e){}
} else if (s === 'off' || s === '0' || s === 'false') {
  lsDel(FLAG); lsDel('visit_counter'); lsDel('current_device_id');
  log('spoofer DESLIGADO', ERR);
  try { var clean2 = location.href.replace(/([?&])spoofer=[^&]*(&|$)/, function(_,a,b){ return b ? a : ''; }).replace(/[?&]$/, ''); history.replaceState({}, '', clean2); } catch(e){}
  return;
}
var ativo = (lsGet(FLAG) === 'true');
log('ativo = ' + ativo, ativo ? OK : INF);
if (!ativo) { log('INATIVO. Acesse com ?spoofer=on para ativar.', ERR); return; }
function genId(){ return 'device_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11); }
function clearTracking(){
  try { sessionStorage.clear(); } catch(e){}
  var keep = lsGet(FLAG);
  if (LS_OK) { try { localStorage.clear(); } catch(e){} }
  MEM = {};
  if (keep !== null) lsSet(FLAG, keep);
  try {
    document.cookie.split(';').forEach(function(c){
      var name = c.split('=')[0].trim(); if (!name) return;
      if (/^(SID|HSID|SSID|APISID|SAPISID|NID|__Secure|_ga)/.test(name)) return;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    });
  } catch(e){}
}
function spoofFingerprint(){
  try {
    var c = document.createElement('canvas'); var x = c.getContext('2d'); if (!x) return;
    x.fillStyle = '#' + Math.floor(Math.random()*16777215).toString(16);
    x.fillRect(0, 0, 220, 30);
    x.fillStyle = '#ffffff'; x.font = '14px Arial';
    x.fillText('Device ' + Math.random().toString(36).slice(2, 8), 10, 20);
  } catch(e){}
}
var visitCount = parseInt(lsGet('visit_counter') || '0', 10) || 0;
var currentUserId = lsGet('current_device_id');
visitCount++;
log('visita #' + visitCount + ' (ID anterior: ' + (currentUserId || 'nenhum') + ')', INF);
if (visitCount >= VISITS_TO_RESET || !currentUserId) {
  log('-> resetando e gerando NOVO device ID', OK);
  clearTracking();
  currentUserId = genId();
  visitCount = 1;
}
lsSet('visit_counter', String(visitCount));
lsSet('current_device_id', currentUserId);
window.currentFakeUserId = currentUserId;
spoofFingerprint();
log('✓ Visita ' + visitCount + '/' + VISITS_TO_RESET + ' | Device ID: ' + currentUserId, OK);
})();`;

function sendFakeAPI(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).send(JSON.stringify({ status: 'ok', service: 'analytics' }));
}

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send('<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:60px auto">' +
    '<h1>Analytics Gateway</h1><p>Status: <b style="color:green">operacional</b></p>' +
    '<p><a href="/device-spoofer.js">/device-spoofer.js</a></p></body></html>');
});

app.get(['/device-spoofer.js', '/analytics/tracker.js', '/spoofer.js'], (req, res) => {
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  if (!ua || BAD_AGENTS.some(b => ua.includes(b))) return sendFakeAPI(res);
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(200).send(realCode);
});

app.listen(PORT, () => console.log('Servidor rodando na porta ' + PORT));
