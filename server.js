const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());

// ===== CONFIGURAÇÃO DE PROTEÇÃO =====
// Domínios autorizados a carregar o script (adicione os seus)
const ALLOWED_DOMAINS = [
  'blogspot.com',
  'blogger.com',
  'blogspot.com.br',
  // 'seudominio.com',
];

// Opcional: se quiser exigir token secreto via ?t=SEU_TOKEN
// Deixe null para desativar essa checagem extra
const SECRET_TOKEN = process.env.SCRIPT_TOKEN || null;

// Bots/scanners conhecidos que tentam baixar scripts
const BAD_AGENTS = [
  'curl', 'wget', 'python', 'python-requests', 'scrapy',
  'httpie', 'postman', 'insomnia', 'go-http-client',
  'java/', 'libwww', 'okhttp', 'axios', 'node-fetch',
  'bot', 'crawler', 'spider', 'scanner', 'nmap', 'nikto',
  'masscan', 'zgrab', 'nuclei', 'sqlmap',
];
// =====================================

// ===== DISFARCE: API DE NOTÍCIAS FALSA =====
// Retorna uma resposta de "API de notícias" plausível para curiosos
function sendFakeNewsAPI(res, type = 'json') {
  const fakeNews = {
    status: 'ok',
    api_version: '2.1.4',
    endpoint: '/v2/news',
    generated_at: new Date().toISOString(),
    total_results: 5,
    articles: [
      {
        id: 'nws_' + Math.random().toString(36).substring(2, 10),
        title: 'Mercados globais fecham em alta após dados de inflação',
        summary: 'Índices europeus e americanos registraram ganhos moderados nesta terça-feira.',
        source: 'Reuters',
        category: 'economia',
        published_at: new Date(Date.now() - 3600000).toISOString(),
        url: 'https://example-news.com/article/mercados-alta'
      },
      {
        id: 'nws_' + Math.random().toString(36).substring(2, 10),
        title: 'Nova atualização de segurança é liberada para navegadores',
        summary: 'Fabricantes recomendam atualização imediata para correção de vulnerabilidades.',
        source: 'TechDaily',
        category: 'tecnologia',
        published_at: new Date(Date.now() - 7200000).toISOString(),
        url: 'https://example-news.com/article/update-seguranca'
      },
      {
        id: 'nws_' + Math.random().toString(36).substring(2, 10),
        title: 'Pesquisa aponta crescimento no uso de energia solar residencial',
        summary: 'Adoção aumentou 18% no último trimestre segundo relatório do setor.',
        source: 'GreenReport',
        category: 'meio-ambiente',
        published_at: new Date(Date.now() - 10800000).toISOString(),
        url: 'https://example-news.com/article/energia-solar'
      },
      {
        id: 'nws_' + Math.random().toString(36).substring(2, 10),
        title: 'Seleção nacional divulga convocação para amistosos',
        summary: 'Lista conta com três estreantes e retorno de jogadores experientes.',
        source: 'SportsWire',
        category: 'esportes',
        published_at: new Date(Date.now() - 14400000).toISOString(),
        url: 'https://example-news.com/article/convocacao'
      },
      {
        id: 'nws_' + Math.random().toString(36).substring(2, 10),
        title: 'Estudo indica benefícios de pausas regulares no trabalho',
        summary: 'Pesquisadores apontam melhora na produtividade e redução do estresse.',
        source: 'HealthToday',
        category: 'saude',
        published_at: new Date(Date.now() - 18000000).toISOString(),
        url: 'https://example-news.com/article/pausas-trabalho'
      }
    ],
    pagination: {
      page: 1,
      per_page: 20,
      next_page: null
    },
    license: 'Free tier - non-commercial use'
  };

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('X-Powered-By', 'NewsAPI Gateway');
  res.setHeader('Server', 'nginx');

  if (type === 'json') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).send(JSON.stringify(fakeNews, null, 2));
  }

  // Versão HTML amigável (para quem abre no navegador)
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NewsAPI Gateway</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f6f8; color: #1a1a1a; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        header { background: #fff; padding: 20px 25px; border-radius: 8px; border: 1px solid #e0e3e8; margin-bottom: 15px; }
        header h1 { margin: 0 0 8px 0; font-size: 20px; color: #0a66c2; }
        header p { margin: 0; color: #666; font-size: 13px; }
        .badge { display: inline-block; background: #e7f3ff; color: #0a66c2; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-left: 8px; }
        .article { background: #fff; padding: 18px 22px; border-radius: 8px; border: 1px solid #e0e3e8; margin-bottom: 10px; }
        .article h2 { margin: 0 0 6px 0; font-size: 16px; color: #222; }
        .article p { margin: 0 0 10px 0; color: #555; font-size: 14px; line-height: 1.5; }
        .article .meta { font-size: 12px; color: #888; }
        .article .meta .source { color: #0a66c2; font-weight: 600; }
        footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; padding: 15px; }
        code { background: #eef1f5; padding: 2px 6px; border-radius: 3px; font-size: 12px; color: #c7254e; }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>NewsAPI Gateway <span class="badge">v2.1.4</span></h1>
          <p>Endpoint público de agregação de notícias. Documentação disponível em <code>/docs</code></p>
        </header>
        ${fakeNews.articles.map(a => `
          <div class="article">
            <h2>${a.title}</h2>
            <p>${a.summary}</p>
            <div class="meta">
              <span class="source">${a.source}</span> · ${a.category} · ${new Date(a.published_at).toLocaleString('pt-BR')}
            </div>
          </div>
        `).join('')}
        <footer>
          NewsAPI Gateway © ${new Date().getFullYear()} · Todos os direitos reservados<br>
          <small>Uso livre para fins não comerciais</small>
        </footer>
      </div>
    </body>
    </html>
  `);
}
// ==========================================

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

// Arquivo do script fornecido ao Blogger (PROTEGIDO + DISFARÇADO)
app.get('/device-spoofer.js', (req, res) => {
  // --- PROTEÇÃO 1: bloqueia bots/scanners conhecidos ---
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  if (!ua || BAD_AGENTS.some(bad => ua.includes(bad))) {
    return sendFakeNewsAPI(res, 'json');
  }

  // --- PROTEÇÃO 2: exige Referer de domínio autorizado ---
  const referer = req.headers.referer || req.headers.referrer || '';
  const origin  = req.headers.origin || '';
  const source  = referer || origin;

  const hasValidSource = ALLOWED_DOMAINS.some(domain => source.includes(domain));

  if (!hasValidSource) {
    // Quem abrir a URL direto vê uma "API de notícias" em vez do script
    return sendFakeNewsAPI(res, 'html');
  }

  // --- PROTEÇÃO 3 (opcional): token secreto via query ---
  if (SECRET_TOKEN && req.query.t !== SECRET_TOKEN) {
    return sendFakeNewsAPI(res, 'html');
  }

  // --- Headers de segurança ---
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const scriptContent = `
(function() {
    'use strict';

    const STORAGE_KEY = 'user_spoofer_enabled';
    const VISITS_TO_RESET = 2;

    // 1. Verifica se o usuário enviou o comando de ativação ou desativação pela URL
    try {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('spoofer') === 'on') {
            localStorage.setItem(STORAGE_KEY, 'true');
            // Limpa o parâmetro da URL sem recarregar a página
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (urlParams.get('spoofer') === 'off') {
            localStorage.removeItem(STORAGE_KEY);
            window.history.replaceState({}, document.title, window.location.pathname);
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
