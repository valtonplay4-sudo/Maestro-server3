// Exemplo de como a rota do seu servidor processa sem alterar suas funções:
app.get('/device-spoofer.js', async (req, res) => {
  const clientKey = req.query.key;
  const referer = req.get('Referer') || req.get('Origin') || '';

  // 1. SE FOR O SEU BLOG PRÓPRIO (Sem key) -> Libera direto
  if (!clientKey) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(scriptContentOriginal); // Suas funções sem alterações
  }

  // 2. SE FOR CLIENTE (Com key) -> Valida no Firebase
  const isLicenseValid = await validateFirebaseLicense(clientKey, referer);

  if (!isLicenseValid) {
    res.setHeader('Content-Type', 'application/javascript');
    return res.status(403).send('console.error("[Spoofer] Acesso negado: Licença inválida ou domínio não autorizado.");');
  }

  // Se a licença for válida, envia o mesmo script
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(200).send(scriptContentOriginal);
});
