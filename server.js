const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());

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

// Arquivo do script fornecido ao Blogger
app.get('/device-spoofer.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const scriptContent = `
(function() {
    'use strict';

    const STORAGE_KEY = 'user_spoofer_enabled';
    const VISITS_TO_RESET = 2;

    // ==================== REMOVER AVISO DE COOKIES AUTOMATICAMENTE ====================
    function removerAvisoCookies() {
        try {
            // Remove banners de cookies do Google
            const seletores = [
                '.cookie-consent',
                '.cc-banner',
                '.cc-window',
                '.cookie-notice',
                '.google-cookie-banner',
                '.cookies-banner',
                '.cookie-banner',
                '#cookie-banner',
                '#cookie-notice',
                '.consent-banner',
                '.gdpr-banner'
            ];

            seletores.forEach(seletor => {
                const elementos = document.querySelectorAll(seletor);
                elementos.forEach(el => {
                    if (el) {
                        el.style.display = 'none';
                        el.style.opacity = '0';
                        el.style.visibility = 'hidden';
                        el.style.pointerEvents = 'none';
                    }
                });
            });

            // Remove também por texto (fallback)
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                if (el && el.innerText && (
                    el.innerText.includes('cookies do Google') ||
                    el.innerText.includes('Google cookies') ||
                    el.innerText.includes('cookie consent') ||
                    el.innerText.includes('Este site usa cookies')
                )) {
                    el.style.display = 'none';
                    el.style.opacity = '0';
                    el.style.visibility = 'hidden';
                    el.style.pointerEvents = 'none';
                }
            });
        } catch(e) {}
    }

    // Executa imediatamente
    removerAvisoCookies();

    // Executa novamente após o DOM carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removerAvisoCookies);
    }

    // Executa novamente após o carregamento completo
    window.addEventListener('load', function() {
        setTimeout(removerAvisoCookies, 1000);
        setTimeout(removerAvisoCookies, 3000);
    });

    // Observer para remover banners que aparecem depois
    try {
        const observer = new MutationObserver(function() {
            removerAvisoCookies();
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });
    } catch(e) {}

    console.log('🍪 Aviso de cookies removido automaticamente!');

    // 1. Verifica se o usuário enviou o comando de ativação ou desativação pela URL
    try {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('spoofer') === 'on') {
            localStorage.setItem(STORAGE_KEY, 'true');
            // Limpa o parâmetro da URL sem recarregar a página
            window.history.replaceState({}, document.title, window.location.pathname);
            console.log('👻 ANÚNCIO FANTASMA ATIVADO!');
            alert('✅ Anúncio Fantasma ATIVADO neste dispositivo!');
        } else if (urlParams.get('spoofer') === 'off') {
            localStorage.removeItem(STORAGE_KEY);
            window.history.replaceState({}, document.title, window.location.pathname);
            console.log('👻 ANÚNCIO FANTASMA DESATIVADO!');
            alert('❌ Anúncio Fantasma DESATIVADO neste dispositivo!');
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
