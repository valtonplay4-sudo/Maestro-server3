const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Substitua pela URL exata do seu Firebase Realtime Database
const FIREBASE_DB_URL = "https://maestro-server-pro-default-rtdb.firebaseio.com";

/**
 * Função de validação de licenças
 */
async function checkLicense(key, referer) {
  try {
    const response = await axios.get(`${FIREBASE_DB_URL}/licenses/${key}.json`);
    const license = response.data;

    // 1. Validação de existência e status ativo
    if (!license) return { valid: false, reason: "Licenca inexistente." };
    if (license.active === false) return { valid: false, reason: "Licenca inativa." };

    // 2. Normalização e Validação do Domínio (tolerante a cabeçalhos)
    if (referer && license.domain) {
      let cleanReferer = referer.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].toLowerCase();
      let cleanAllowedDomain = license.domain.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].toLowerCase();

      if (!cleanReferer.includes(cleanAllowedDomain) && !cleanAllowedDomain.includes(cleanReferer)) {
        return { valid: false, reason: "Dominio nao autorizado para esta chave." };
      }
    }

    // 3. REGRA DO TESTE GRÁTIS DE 10 MINUTOS
    if (license.isTest) {
      // Primeiro acesso real no blog: Inicia o cronômetro no Firebase
      if (!license.startedAt) {
        const startTime = new Date().toISOString();
        const newEndTime = new Date(Date.now() + (10 * 60 * 1000)).toISOString(); 

        await axios.patch(`${FIREBASE_DB_URL}/licenses/${key}.json`, {
          startedAt: startTime,
          expiresAt: newEndTime
        });

        return { valid: true, expiresAt: newEndTime };
      }

      // Se o teste já foi iniciado anteriormente, valida se os 10 minutos expiraram
      const now = Date.now();
      const expirationTime = new Date(license.expiresAt).getTime();

      if (now > expirationTime) {
        return { valid: false, reason: "Teste gratis de 10 minutos expirado." };
      }

      return { valid: true, expiresAt: license.expiresAt };
    }

    // 4. Validação para Planos Pagos (Diário, Semanal, Mensal)
    const now = Date.now();
    const expirationTime = new Date(license.expiresAt).getTime();

    if (now > expirationTime) {
      return { valid: false, reason: "Licenca expirada." };
    }

    return { valid: true, expiresAt: license.expiresAt };
  } catch (error) {
    console.error("Erro em checkLicense:", error.message);
    return { valid: false, reason: "Erro interno na validacao." };
  }
}

/**
 * ROTA QUE ENTREGA O SCRIPT PARA O BLOGGER / SITE (<script src=".../agher.js?key=KEY"></script>)
 */
app.get('/agher.js', async (req, res) => {
  const key = req.query.key;
  const scriptSpooferParam = req.query.spoofer;
  const referer = req.get('Referer') || req.get('Origin') || '';

  if (!key) {
    res.type('text/javascript');
    return res.send(`console.warn("AdGhost: Chave de licenca nao fornecida.");`);
  }

  // Executa a checagem da licença (DISPARA OS 10 MINUTOS NO FIREBASE IMEDIATAMENTE)
  const licenseCheck = await checkLicense(key, referer);

  res.type('text/javascript');

  if (!licenseCheck.valid) {
    return res.send(`
      console.warn("AdGhost Block: ${licenseCheck.reason}");
      window.adghostActive = false;
    `);
  }

  // Código injetado no navegador do usuário final
  res.send(`
    (function() {
      console.log("👻 AdGhost: Licenca Ativa. Expira em: ${licenseCheck.expiresAt}");
      window.adghostActive = true;

      const urlParams = new URLSearchParams(window.location.search);
      const isUrlSpoofer = urlParams.get('spoofer') === 'on';
      const isScriptSpoofer = "${scriptSpooferParam}" === "on";
      const isDisabled = urlParams.get('spoofer') === 'off';

      // Executa se o parâmetro spoofer=on estiver presente na URL ou na tag do script
      if ((isUrlSpoofer || isScriptSpoofer) && !isDisabled) {
        console.log("⚡ AdGhost Spoofer Ativado!");
        
        // --- LÓGICA DO SPOOFER / DISPOSITIVO AQUI ---
        try {
          localStorage.setItem('adghost_device_id', 'spoofer_' + Math.random().toString(36).substring(2, 9));
          document.cookie = "adghost_spoofer=active; path=/";
        } catch(e) {
          console.error("Erro na execucao do Spoofer:", e);
        }
      }
    })();
  `);
});

/**
 * ROTA API PARA VERIFICAÇÃO DIRETA (JSON)
 */
app.get('/api/verify', async (req, res) => {
  const { key } = req.query;
  const referer = req.get('Referer') || req.get('Origin') || '';
  
  const result = await checkLicense(key, referer);
  res.json(result);
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor AdGhost rodando na porta ${PORT}`);
});
