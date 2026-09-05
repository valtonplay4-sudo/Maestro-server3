const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());

// Estado global mantido no servidor
let systemActive = true;

// PAINEL DE CONTROLE VISUAL
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Painel Maestro Spoofer</title>
      <style>
        body { font-family: sans-serif; background: #0f172a; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 30px; border-radius: 16px; text-align: center; max-width: 350px; width: 90%; border: 1px solid #334155; }
        .status { font-size: 18px; font-weight: bold; padding: 12px; border-radius: 8px; margin: 20px 0; }
        .on { background: #166534; color: #4ade80; }
        .off { background: #991b1b; color: #f87171; }
        .btn { width: 100%; padding: 14px; font-size: 16px; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; margin-bottom: 10px; }
        .btn-on { background: #22c55e; color: #000; }
        .btn-off { background: #ef4444; color: #fff; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Painel de Controle</h2>
        <div class="status ${systemActive ? 'on' : 'off'}">
          ${systemActive ? 'SISTEMA ATIVO' : 'SISTEMA DESATIVADO'}
        </div>
        <button class="btn btn-on" onclick="location.href='/toggle?state=true'">ATIVAR SCRIPT</button>
        <button class="btn btn-off" onclick="location.href='/toggle?state=false'">DESATIVAR SCRIPT</button>
      </div>
    </body>
    </html>
  `);
});

app.get('/toggle', (req, res) => {
  systemActive = req.query.state === 'true';
  res.redirect('/');
});

app.get('/status', (req, res) => {
  res.json({ active: systemActive });
});

// SCRIPT SERVIDO PARA O BLOGGER
app.get('/device-spoofer.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const scriptContent = `
(function() {
    'use strict';

    // Se a chave de desativação manual estiver no localStorage do blog, para.
    if (localStorage.getItem('spoofer_disabled') === 'true') {
        return;
    }

    const VISITS_TO_RESET = 2;

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
            
            // Limpa dados de rastreamento SEM apagar configurações do sistema
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

    console.log('[Spoofer Executado] Visita: ' + visitCount + ' | Novo ID: ' + currentUserId);
})();
  `;

  res.status(200).send(scriptContent);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
