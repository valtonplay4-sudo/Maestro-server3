async function checkLicense(key, referer) {
  try {
    const response = await axios.get(`${FIREBASE_DB_URL}/licenses/${key}.json`);
    const license = response.data;

    // 1. Validação de existência e status
    if (!license) return { valid: false, reason: "Licença inexistente." };
    if (!license.active) return { valid: false, reason: "Licença inativa ou pausada." };

    // 2. Normalização e Validação do Domínio (Executada antes do tempo)
    let cleanReferer = (referer || '').replace(/^https?:\/\//, '').split('/')[0].split(':')[0].toLowerCase();
    let cleanAllowedDomain = license.domain.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].toLowerCase();

    if (referer && !cleanReferer.includes(cleanAllowedDomain)) {
      return { valid: false, reason: "Domínio não autorizado para esta chave." };
    }

    // 3. REGRA DO TESTE GRÁTIS: Inicialização no primeiro acesso ao salvar no Blogger
    if (license.isTest && !license.startedAt) {
      const startTime = new Date().toISOString();
      // Define a expiração exata para 10 minutos a partir DESTE MOMENTO
      const newEndTime = new Date(Date.now() + (10 * 60 * 1000)).toISOString(); 

      // Atualiza o Firebase em segundo plano
      await axios.patch(`${FIREBASE_DB_URL}/licenses/${key}.json`, {
        startedAt: startTime,
        expiresAt: newEndTime
      });

      // Como acabou de ser ativado, a licença é imediatamente válida
      return { valid: true };
    }

    // 4. Validação do Tempo de Expiracão (Para licenças normais ou testes já iniciados)
    const now = Date.now();
    const expirationTime = new Date(license.expiresAt).getTime();

    if (now > expirationTime) {
      return { valid: false, reason: "Licença expirada." };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, reason: "Erro interno na validação de licenças." };
  }
}
