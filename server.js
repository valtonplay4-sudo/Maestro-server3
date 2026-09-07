async function checkLicense(key, referer) {
  try {
    // 1. Validar a chave
    if (!key || typeof key !== "string") {
      return {
        valid: false,
        reason: "Chave de licença inválida."
      };
    }

    // 2. Buscar licença no Firebase
    const response = await axios.get(
      `${FIREBASE_DB_URL}/licenses/${encodeURIComponent(key)}.json`,
      { timeout: 8000 }
    );

    const license = response.data;

    if (!license) {
      return {
        valid: false,
        reason: "Licença inexistente."
      };
    }

    // 3. Verificar estado da licença
    if (license.active !== true) {
      return {
        valid: false,
        reason: "Licença inativa ou pausada."
      };
    }

    // 4. Normalizar domínio com segurança
    function normalizeHostname(value) {
      if (!value || typeof value !== "string") return null;

      try {
        let url = value.trim();

        if (!/^https?:\/\//i.test(url)) {
          url = `https://${url}`;
        }

        const hostname = new URL(url).hostname
          .toLowerCase()
          .replace(/^www\./, "")
          .replace(/\.$/, "");

        return hostname || null;
      } catch {
        return null;
      }
    }

    const allowedDomain = normalizeHostname(license.domain);
    const requestDomain = normalizeHostname(referer);

    // 5. A licença precisa possuir um domínio válido
    if (!allowedDomain) {
      return {
        valid: false,
        reason: "Domínio da licença inválido."
      };
    }

    // 6. Não aceitar requisição sem domínio de origem
    if (!requestDomain) {
      return {
        valid: false,
        reason: "Domínio de origem não identificado."
      };
    }

    // 7. Comparação exata do domínio
    if (requestDomain !== allowedDomain) {
      return {
        valid: false,
        reason: "Domínio não autorizado para esta chave."
      };
    }

    // 8. Verificar expiração
    const now = Date.now();

    if (!license.expiresAt) {
      return {
        valid: false,
        reason: "Licença sem data de expiração."
      };
    }

    const expirationTime = new Date(license.expiresAt).getTime();

    if (!Number.isFinite(expirationTime)) {
      return {
        valid: false,
        reason: "Data de expiração inválida."
      };
    }

    if (now >= expirationTime) {
      return {
        valid: false,
        reason: "Licença expirada."
      };
    }

    // 9. Licença válida
    return {
      valid: true,
      license: {
        key,
        domain: allowedDomain,
        isTest: license.isTest === true,
        expiresAt: license.expiresAt
      }
    };

  } catch (error) {
    console.error("Erro em checkLicense:", error.message);

    return {
      valid: false,
      reason: "Erro interno na validação de licenças."
    };
  }
}
