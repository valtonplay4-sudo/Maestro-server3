const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Servidor Spoofer Persistente</title>
      <style>
        body { font-family: sans-serif; background: #0f172a; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 25px; border-radius: 12px; text-align: center; max-width: 400px; border: 1px solid #334155; }
        code { background: #090d16; padding: 4px 8px; border-radius: 4px; color: #38bdf8; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Servidor Ativo (Persistência Total)</h2>
        <p>Ativar permanente: <code>?spoofer=on</code></p>
        <p>Desativar permanente: <code>?spoofer=off</code></p>
      </div>
    </body>
    </html>
  `);
});

// SCRIPT COM PERSISTÊNCIA DUPLA (LOCALSTORAGE + COOKIE DE 10 ANOS)
app.get('/device-spoofer.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  const scriptContent = `
(function() {
    'use strict';

    const STORAGE_KEY = 'user_spoofer_enabled';
    const VISITS_TO_RESET = 2;

    // Funções auxiliares para leitura/escrita de cookie de persistência (10 Anos)
    function setPersistCookie(value) {
        var expires = new Date(Date.now() + 315360000000).toUTCString(); // 10 anos
        document.cookie = STORAGE_KEY + '=' + value + ';expires=' + expires + ';path=/;SameSite=Lax';
    }

    function removePersistCookie() {
        document.cookie = STORAGE_KEY + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }

    function getPersistCookie() {
        var match = document.cookie.match(new RegExp('(^| )' + STORAGE_KEY + '=([^;]+)'));
        return match ? match[2] : null;
    }

    // 1. Processa gatilhos de URL (?spoofer=on / ?spoofer=off)
    try {
        if (window.location.search.indexOf('spoofer=on') !== -1) {
            localStorage.setItem(STORAGE_KEY, 'true');
            setPersistCookie('true');
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (window.location.search.indexOf('spoofer=off') !== -1) {
            localStorage.removeItem(STORAGE_KEY);
            removePersistCookie();
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }
    } catch(e) {}

    // Sincroniza e verifica o estado de ativação (Checa LocalStorage e Cookie)
    var isEnabledLocalStorage = localStorage.getItem(STORAGE_KEY) === 'true';
    var isEnabledCookie = getPersistCookie() === 'true';

    if (isEnabledCookie && !isEnabledLocalStorage) {
        localStorage.setItem(STORAGE_KEY, 'true');
        isEnabledLocalStorage = true;
    }

    // 2. Trava absoluta: Se não estiver ativo em nenhuma das memórias, interrompe a execução
    if (!isEnabledLocalStorage && !isEnabledCookie) {
        return;
    }

    // 3. Execução da simulação
    function generateNewUserId() {
        return 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    function clearTracking() {
        try {
            // Limpa cookies de terceiros sem apagar o cookie da chave spoofer
            document.cookie.split(";").forEach(function(cookie) {
                var name = cookie.split("=")[0].trim();
                if (name && name !== STORAGE_KEY) {
                    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
                }
            });
            
            sessionStorage.clear();
            localStorage.removeItem('visit_counter');
            localStorage.removeItem('current_device_id');
        } catch(e) {}
    }

    function spoofFingerprint() {
        try {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#' + Math.floor(Math.random()*16777215).toString(16);
                ctx.fillRect(0, 0, 220, 30);
            }
        } catch(e) {}
    }

    var visitCount = parseInt(localStorage.getItem('visit_counter') || '0', 10);
    var currentUserId = localStorage.getItem('current_device_id');

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

    console.log('[Spoofer Ativo - Persistente] Visita: ' + visitCount + ' | ID: ' + currentUserId);
})();
  `;

  res.status(200).send(scriptContent);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
