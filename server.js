(function(){
'use strict';

var TAG = '%c[CustomAds]';
var OK  = 'color:#00ff88;font-weight:bold';
var ERR = 'color:#ff5555;font-weight:bold';
var INF = 'color:#66ccff;font-weight:bold';

function log(msg, style){
  try { console.log(TAG + ' ' + msg, style || INF); } catch(e){}
}

log('=== script carregado ===', INF);

var FLAG = 'user_spoofer_enabled';
var VISITS_TO_RESET = 2;

// ---------- 1. Detectar localStorage ----------
var LS_OK = false;
try {
  localStorage.setItem('__t','1');
  localStorage.removeItem('__t');
  LS_OK = true;
  log('localStorage: OK', OK);
} catch(e) {
  log('localStorage BLOQUEADO: ' + e.message + ' — usando fallback em memória', ERR);
}

var MEM = {};
function lsGet(k){
  if (LS_OK) { try { return localStorage.getItem(k); } catch(e){} }
  return (k in MEM) ? MEM[k] : null;
}
function lsSet(k,v){
  if (LS_OK) { try { localStorage.setItem(k, v); return; } catch(e){} }
  MEM[k] = v;
}
function lsDel(k){
  if (LS_OK) { try { localStorage.removeItem(k); } catch(e){} }
  delete MEM[k];
}

// ---------- 2. Ler ?spoofer= ----------
var qs = '';
try { qs = location.search || ''; } catch(e){}
log('URL: ' + (location.href || '?'), INF);

var s = null;
try {
  if (typeof URLSearchParams !== 'undefined') {
    s = new URLSearchParams(qs).get('spoofer');
  } else {
    var m = qs.match(/[?&]spoofer=([^&]*)/);
    s = m ? decodeURIComponent(m[1]) : null;
  }
} catch(e){ log('URLSearchParams falhou: ' + e.message, ERR); }

log('spoofer = "' + s + '"', INF);

if (s === 'on' || s === 'n' || s === '1' || s === 'true') {
  lsSet(FLAG, 'true');
  log('spoofer LIGADO', OK);
  try {
    var clean = location.href.replace(/([?&])spoofer=[^&]*(&|$)/, function(_, a, b){ return b ? a : ''; });
    clean = clean.replace(/[?&]$/, '');
    history.replaceState({}, '', clean);
  } catch(e){}
} else if (s === 'off' || s === '0' || s === 'false') {
  lsDel(FLAG);
  lsDel('visit_counter');
  lsDel('current_device_id');
  log('spoofer DESLIGADO', ERR);
  try {
    var clean2 = location.href.replace(/([?&])spoofer=[^&]*(&|$)/, function(_, a, b){ return b ? a : ''; });
    clean2 = clean2.replace(/[?&]$/, '');
    history.replaceState({}, '', clean2);
  } catch(e){}
  return;
}

// ---------- 3. Verificar ativação ----------
var ativo = (lsGet(FLAG) === 'true');
log('ativo = ' + ativo, ativo ? OK : INF);
if (!ativo) {
  log('INATIVO. Acesse com ?spoofer=on para ativar.', ERR);
  return;
}

// ---------- 4. Helpers ----------
function genId(){
  return 'device_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
}

// Limpa rastros MAS preserva FLAG e NÃO apaga cookies do Blogger
function clearTracking(){
  // NÃO limpa cookies (evita derrubar sessão do blog / redirect loop)
  try { sessionStorage.clear(); } catch(e){}
  var keep = lsGet(FLAG);
  if (LS_OK) {
    try { localStorage.clear(); } catch(e){}
  }
  MEM = {};
  if (keep !== null) lsSet(FLAG, keep);
  // limpa só cookies do próprio domínio atual, exceto os do Blogger
  try {
    document.cookie.split(';').forEach(function(c){
      var name = c.split('=')[0].trim();
      if (!name) return;
      // preserva cookies de sessão do Blogger
      if (/^(SID|HSID|SSID|APISID|SAPISID|NID|__Secure|_ga)/.test(name)) return;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    });
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

// ---------- 5. Lógica principal ----------
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

// log FINAL correto (com interpolação)
log('✓ Visita ' + visitCount + '/' + VISITS_TO_RESET + ' | Device ID: ' + currentUserId, OK);

})();
