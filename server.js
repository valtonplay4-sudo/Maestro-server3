const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Token Secreto Global para Autorização do Seu Dispositivo
const MASTER_KEY = "maestro_authorized_dev";

// 1. INTERFACE REDESENHADA (NOVO VISUAL E MODO DE DIAGNÓSTICO)
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Painel Maestro v2.0 - Controle de Dispositivo</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #090d16;
          color: #e2e8f0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }
        .panel-card {
          background: #111827;
          border: 2px solid #1f2937;
          border-radius: 20px;
          padding: 28px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .header {
          text-align: center;
          margin-bottom: 24px;
        }
        .header h1 {
          font-size: 22px;
          color: #38bdf8;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .header p {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }
        .status-box {
          background: #1e293b;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin-bottom: 24px;
          border: 1px solid #334155;
        }
        .status-indicator {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
        }
        .status-text {
          font-size: 16px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .state-active { color: #4ade80; }
        .state-active .status-indicator { background: #22c55e; box-shadow: 0 0 12px #22c55e; }
        .state-inactive { color: #f87171; }
        .state-inactive .status-indicator { background: #ef4444; box-shadow: 0 0 12px #ef4444; }
        
        .btn-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .btn {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          border: none;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-activate {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #ffffff;
        }
        .btn-deactivate {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #ffffff;
        }
        .info-card {
          background: #0f172a;
          border-radius: 10px;
          padding: 14px;
          font-size: 12px;
          color: #94a3b8;
          border-left: 4px solid #38bdf8;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="panel-card">
        <div class="header">
          <h1>MAESTRO SPOOFER v2.0</h1>
          <p>Painel de Ativação por Dispositivo</p>
        </div>

        <div id="statusContainer" class="status-box state-inactive">
          <span class="status-indicator"></span>
          <span id="statusLabel" class="status-text">VERIFICANDO DISPOSITIVO...</span>
        </div>

        <div class="btn-group">
          <button class="btn btn-activate" onclick="setDeviceStatus(true)">ATIVAR NESTE DISPOSITIVO</button>
          <button class="btn btn-deactivate" onclick="setDeviceStatus(false)">DESATIVAR NESTE DISPOSITIVO</button>
        </div>

        <div class="info-card">
          <strong>Como funciona:</strong> Ao clicar em Ativar, uma chave de identificação única é salva no armazenamento seguro deste navegador. O script nos blogs só rodará quando este aparelho acessar o site.
        </div>
      </div>

      <script>
        const AUTH_KEY = 'maestro_device_authorized';

        function updateUI() {
          const isAuthorized = localStorage.getItem(AUTH_KEY) === 'true';
          const container = document.getElementById('statusContainer');
          const label = document.getElementById('statusLabel');

          if (isAuthorized) {
            container.className = 'status-box state-active';
            label.textContent = 'DISPOSITIVO AUTORIZADO';
          } else {
            container.className = 'status-box state-inactive';
            label.textContent = 'DISPOSITIVO NÃO AUTORIZADO';
          }
        }

        function setDeviceStatus(active) {
          if (active) {
            localStorage.setItem(AUTH_KEY, 'true');
          } else {
            localStorage.removeItem(AUTH_KEY);
          }
          updateUI();
        }

        updateUI();
      </script>
    </body>
    </html>
  `);
});

// 2. SCRIPT EXECUTÁVEL NOS BLOGS DO BLOGGER
app.get('/device-spoofer.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  
  const scriptContent = `
(function() {
    'use strict';

    const AUTH_KEY = 'maestro_device_authorized';
    const MASTER_TOKEN = "${MASTER_KEY}";

    // 1. Verificação via URL Param (Permite ativar abrindo o blog com ?spoofer=on no final)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('spoofer') === 'on' || urlParams.get('token') === MASTER_TOKEN) {
        localStorage.setItem(AUTH_KEY, 'true');
    } else if (urlParams.get('spoofer') === 'off') {
        localStorage.removeItem(AUTH_KEY);
    }

    // 2. Trava de Execução: Só roda se o dispositivo estiver autorizado no localStorage
    const isAuthorized = localStorage.getItem(AUTH_KEY) === 'true';
    if (!isAuthorized) {
        return;
    }

    // 3. Lógica do Spoofer
    const VISITS_TO_RESET = 2;

    function generateNewUserId() {
        return 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    }

    function clearTracking() {
        try {
            document.cookie.split(";").forEach(cookie => {
                const name = cookie.split("=")[0].trim();
                if (name) {
                    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
                }
            });
            
            // Preserva a autorização do dispositivo durante o reset de rastreamento
            const savedAuth = localStorage.getItem(AUTH_KEY);
            localStorage.clear();
            sessionStorage.clear();
            if (savedAuth) {
                localStorage.setItem(AUTH_KEY, savedAuth);
            }
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

    console.log(\`%c[Maestro Spoofer v2.0] Ativo | Visita (\${visitCount}/\${VISITS_TO_RESET}) | ID: \${currentUserId}\`, 'color: #00ff88; font-weight: bold; background: #000; padding: 4px;');
})();
  `;

  res.status(200).send(scriptContent);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
