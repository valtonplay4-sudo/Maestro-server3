const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;

// Permite requisições de qualquer origem (necessário para o Blogger)
app.use(cors());

// Rota para verificar se o servidor está rodando
app.get('/', (req, res) => {
  res.send('Servidor Ativo!');
});

// Rota principal que entrega o script para o Blogger
app.get('/device-spoofer.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  
  const scriptContent = `
(function() {
    'use strict';

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

    console.log(\`%c[Custom Ads] Visita (\${visitCount}/\${VISITS_TO_RESET}) | Device ID: \${currentUserId}\`, 'color: #00ff88; font-weight: bold');
})();
  `;

  res.status(200).send(scriptContent);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
