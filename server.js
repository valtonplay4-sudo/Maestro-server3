async function checkLicense(key, referer) {
  try {
    const response = await axios.get(`${FIREBASE_DB_URL}/licenses/${key}.json`);
    const license = response.data;

    // 1. Validação de existência e status ativo
    if (!license) return { valid: false, reason: "Licença inexistente." };
    if (license.active === false) return { valid: false, reason: "Licença inativa." };

    // 2. Normalização e Validação do Domínio (tolerante a cabeçalhos vazios)
    if (referer && license.domain) {
      let cleanReferer = referer.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].toLowerCase();
      let cleanAllowedDomain = license.domain.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].toLowerCase();

      if (!cleanReferer.includes(cleanAllowedDomain) && !cleanAllowedDomain.includes(cleanReferer)) {
        return { valid: false, reason: "Domínio não autorizado para esta chave." };
      }
    }

    // 3. REGRA DO TESTE GRÁTIS: Ativação no 1º acesso real
    if (license.isTest) {
      // Se ainda não iniciou o cronômetro no banco
      if (!license.startedAt) {
        const startTime = new Date().toISOString();
        const newEndTime = new Date(Date.now() + (10 * 60 * 1000)).toISOString(); 

        // Atualiza o Firebase com o horário real de início e fim
        await axios.patch(`${FIREBASE_DB_URL}/licenses/${key}.json`, {
          startedAt: startTime,
          expiresAt: newEndTime
        });

        return { valid: true, expiresAt: newEndTime };
      }

      // Se o teste já foi iniciado anteriormente, valida se os 10 minutos já passaram
      const now = Date.now();
      const expirationTime = new Date(license.expiresAt).getTime();

      if (now > expirationTime) {
        return { valid: false, reason: "Teste grátis de 10 minutos expirado." };
      }

      return { valid: true, expiresAt: license.expiresAt };
    }

    // 4. Validação para Planos Pagos (Diário, Semanal, Mensal)
    const now = Date.now();
    const expirationTime = new Date(license.expiresAt).getTime();

    if (now > expirationTime) {
      return { valid: false, reason: "Licença expirada." };
    }

    return { valid: true, expiresAt: license.expiresAt };
  } catch (error) {
    console.error("Erro no checkLicense:", error.message);
    return { valid: false, reason: "Erro interno na validação de licenças." };
  }
}
