/**
 * ROTA QUE ENTREGA O SCRIPT PARA O BLOGGER / SITE
 */
app.get('/agher.js', async (req, res) => {
  const key = req.query.key;
  const scriptSpooferParam = req.query.spoofer;
  const referer = req.get('Referer') || req.get('Origin') || '';

  if (!key) {
    res.type('text/javascript');
    return res.send(`console.warn("AdGhost: Chave de licenca nao fornecida.");`);
  }

  // 1. Valida a licença e inicia o cronômetro no Firebase
  const licenseCheck = await checkLicense(key, referer);

  res.type('text/javascript');

  if (!licenseCheck.valid) {
    return res.send(`
      console.warn("AdGhost Block: ${licenseCheck.reason}");
      window.adghostActive = false;
    `);
  }

  // 2. Código JavaScript enviado para o blog
  res.send(`
    (function() {
      console.log("👻 AdGhost: Licença Ativa.");

      const urlParams = new URLSearchParams(window.location.search);
      const hasUrlSpoofer = urlParams.get('spoofer') === 'on';
      const isSpooferDisabled = urlParams.get('spoofer') === 'off';

      // Verifica se o dispositivo já foi ativado anteriormente
      let isDeviceActivated = localStorage.getItem('adghost_spoofer_active') === 'true';

      // Se a URL contiver ?spoofer=off, desativa o dispositivo imediatamente
      if (isSpooferDisabled) {
        localStorage.removeItem('adghost_spoofer_active');
        console.log("🚫 AdGhost Spoofer DESATIVADO para este dispositivo.");
        return;
      }

      // Se acessar com ?spoofer=on, ativa e salva a permissão no dispositivo
      if (hasUrlSpoofer || "${scriptSpooferParam}" === "on") {
        localStorage.setItem('adghost_spoofer_active', 'true');
        isDeviceActivated = true;
      }

      // 🔴 REGRA DE BLOQUEIO: Se o dispositivo NÃO estiver ativado, cancela a exibição de anúncios!
      if (!isDeviceActivated) {
        console.log("🙈 AdGhost: Visitante comum. Anúncios OCULTOS para este dispositivo.");
        return; 
      }

      // 🟢 EXIBIÇÃO APENAS PARA O DISPOSITIVO COM SPOOFER ATIVO
      console.log("⚡ AdGhost Spoofer ATIVO! Exibindo anúncios apenas para você.");

      // --- INSIRA AQUI O SEU CÓDIGO/TAGS DE ANÚNCIOS QUE DEVEM APARECER ---
      try {
        window.adghostActive = true;
        
        // Exemplo: Torna visíveis os blocos de anúncios que estavam ocultos
        const adElements = document.querySelectorAll('.adghost-ad, ins.adsbygoogle');
        adElements.forEach(el => {
          el.style.display = 'block';
          el.style.visibility = 'visible';
        });
      } catch(e) {
        console.error("Erro ao carregar anúncios do AdGhost:", e);
      }
    })();
  `);
});
