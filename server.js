const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Lista mantida no servidor
const authorizedDevices = new Set();

// 1. PAINEL DE CONTROLE (Render)
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Painel de Controle - Spoofer</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #0f172a;
          color: #f8fafc;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .container {
          background-color: #1e293b;
          border-radius: 16px;
          padding: 32px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          text-align: center;
          border: 1px solid #334155;
        }
        h1 { font-size: 20px; font-weight: 600; margin-bottom: 12px; color: #94a3b8; }
        .device-id { font-size: 11px; color: #64748b; margin-bottom: 20px; word-break: break-all; }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 28px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .active-badge { background-color: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid #22c55e; }
        .inactive-badge { background-color: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; }
        .button-group { display: flex; flex-direction: column; gap: 12px; }
        .btn {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          border: none;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-enable { background-color: #22c55e; color: #052e16; }
        .btn-disable { background-color: #ef4444; color: #ffffff; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Painel do Dispositivo</h1>
        <div id="deviceIdDisplay" class="device-id">Identificando...</div>
        <div id="status" class="status-badge inactive-badge">CARREGANDO...</div>
        
        <div class="button-group">
          <button class="btn btn-enable" onclick="setStatus(true)">ATIVAR NESTE DISPOSITIVO</button>
          <button class="btn btn-disable" onclick="setStatus(false)">DESATIVAR NESTE DISPOSITIVO</button>
        </div>
      </div>

      <script>
        function getDeviceId() {
          let id = localStorage.getItem('spoofer_device_token');
          if (!id) {
            id = 'dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('spoofer_device_token', id);
          }
          return id;
        }

        const deviceId = getDeviceId();
        document.getElementById('deviceIdDisplay').textContent = "ID: " + deviceId;

        function checkStatus() {
          fetch('/api/status?deviceId=' + encodeURIComponent(deviceId))
            .then(res => res.json())
            .then(data => {
              const statusEl = document.getElementById('status');
              if (data.active) {
                statusEl.textContent = 'ESTE DISPOSITIVO: ATIVO';
                statusEl.className = 'status-badge active-badge';
              } else {
                statusEl.textContent = 'ESTE DISPOSITIVO: INATIVO';
                statusEl.className = 'status-badge inactive-badge';
              }
            });
        }

        function setStatus(active) {
          fetch('/api/set-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: deviceId, active: active })
          })
          .then(res => res.json())
          .then(() => {
            checkStatus();
          });
        }

        checkStatus();
      </script>
    </body>
    </html>
  `);
});

// Bridge Cross-Domain (Permite o Blog consultar o Token seguro do Render)
app.get('/auth-bridge', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html>
    <body>
      <script>
        const deviceId = localStorage.getItem('spoofer_device_token');
        window.parent.postMessage({ type: 'SPOOFER_DEVICE_ID', deviceId: deviceId }, '*');
      </script>
    </body>
    </html>
  `);
});

// 2. ENDPOINTS DA API
app.post('/api/set-status', (req, res) => {
  const { deviceId, active } = req.body;
  if (deviceId) {
    if (active) {
      authorizedDevices.add(deviceId);
    } else {
      authorizedDevices.delete(deviceId);
    }
  }
  res.json({ success: true, active: authorizedDevices.has(deviceId) });
});

app.get('/api/status', (req, res) => {
  const deviceId = req.query.deviceId;
  const isAuthorized = deviceId ? authorizedDevices.has(deviceId) : false;
  res.json({ active: isAuthorized });
});

// 3. SCRIPT ENTREGUE PARA O BLOGGER
app.get('/device-spoofer.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  
  const scriptContent = `
(function() {
    'use strict';

    // Cria iframe invisível para consultar o token no domínio do Render
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'https://maestro-server3.onrender.com/auth-bridge';
    document.body.appendChild(iframe);

    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'SPOOFER_DEVICE_ID') {
            const deviceId = event.data.deviceId;
            if (!deviceId) return;

            fetch('https://maestro-server3.onrender.com/api/status?deviceId=' + encodeURIComponent(deviceId))
              .then(res => res.json())
              .then(data => {
                if (data.active) {
                  executeSpoofer();
                }
              })
              .catch(() => {});
        }
    }, false);

    function executeSpoofer() {
        const VISITS_TO_RESET = 2;

        function generateNewUserId() {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 15);
            return 'device_' + timestamp + '_' + random;
        }

        function clearTracking() {
            try {
                document.cookie.split(";").forEach(cookie => {
                    const name = cookie.split("=")[0].trim();
                    if (name) {
                        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
                    }
                });
                localStorage.clear();
                sessionStorage.clear();
            } catch(e) {}
        }

        function spoofFingerprint() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#' + Math.floor(Math.random()*16777215).toString(16);
                ctx.fillRect(0, 0, 220, 30);
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px Arial';
                ctx.fillText('Device ' + Math.random().toString(36).substr(2, 6), 10, 20);
            }
        }

        let visitCount = parseInt(localStorage.getItem('visit_counter') || '0');
        let currentUserId = localStorage.getItem('current_device_id');

        visitCount++;

        if (visitCount >= VISITS_TO_RESET || !currentUserId) {
            currentUserId = generateNewUserId();
            visitCount = 1;
            clearTracking();
        }

        localStorage.setItem('visit_counter', visitCount);
        localStorage.setItem('current_device_id', currentUserId);

        window.currentFakeUserId = currentUserId;

        spoofFingerprint();

        console.log(\`%c[Custom Ads] Dispositivo Autorizado | Visita (\${visitCount}/\${VISITS_TO_RESET}) | ID: \${currentUserId}\`, 'color: #00ff88; font-weight: bold');
    }
})();
  `;

  res.status(200).send(scriptContent);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
