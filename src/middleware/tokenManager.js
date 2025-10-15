const axios = require('axios');

// Armazenamento de tokens por usuário com cache de validação
const userTokens = {
  v1: {},
  v2: {}
};

// Cache de validação para evitar verificações desnecessárias
const validationCache = {
  v1: { lastCheck: 0, isValid: false },
  v2: { lastCheck: 0, isValid: false }
};

// Configurações de usuários
const USER_CONFIGS = {
  v1: {
    login: process.env.CONTA_LUZ_USER,
    senha: process.env.CONTA_LUZ_PASSWORD,
    apiKey: process.env.CONTA_LUZ_KEY,
  },
  v2: {
    login: process.env.CONTA_LUZ_USER_2,
    senha: process.env.CONTA_LUZ_PASSWORD_2,
    apiKey: process.env.CONTA_LUZ_KEY_2,
  }
};

async function getToken(userTokens, userCredentials, userVersion) {
  console.log(`getToken para ${userVersion}....`);
  
  try {
    const { data } = await axios.post(
      `${process.env.CREFAZ_BASE_URL}/api/usuario/login`,
      userCredentials
    );
    
    if (!data || !data.data || !data.data.token) {
      console.error(`Resposta inválida da API para ${userVersion}:`, data);
      // Limpa o cache de validação em caso de erro
      validationCache[userVersion] = {
        lastCheck: 0,
        isValid: false
      };
      return false;
    }
    
    const expiresDay = data.data.expires.split('T')[0];
    userTokens.token = data.data.token;
    userTokens.expires = expiresDay.replace(/-/g, '/');
    userTokens.user = data.data?.nome || '';
    
    // Atualiza o cache de validação
    validationCache[userVersion] = {
      lastCheck: Date.now(),
      isValid: true
    };
    
    console.log(`Token obtido com sucesso para ${userVersion}`);
    return userTokens;
  } catch (error) {
    console.error(`Erro ao obter token para ${userVersion}:`, error.response?.data || error.message);
    // Limpa o cache de validação em caso de erro
    validationCache[userVersion] = {
      lastCheck: 0,
      isValid: false
    };
    return false;
  }
}

/**
 * Verifica se o token é válido sem fazer login desnecessário
 */
function isTokenValid(tokenData) {
  if (!tokenData || !tokenData.token || !tokenData.expires) {
    return false;
  }

  const currentDay = new Date();
  const expiresDay = new Date(tokenData.expires);
  
  // Adiciona margem de segurança de 5 minutos
  expiresDay.setMinutes(expiresDay.getMinutes() - 5);
  
  return currentDay < expiresDay;
}

/**
 * Middleware para gerenciar tokens de diferentes usuários (sem fallback automático)
 * @param {string} userVersion - Versão do usuário (v1, v2, etc.)
 */
function createTokenMiddleware(userVersion) {
  return async (req, res, next) => {
    try {
      if (!USER_CONFIGS[userVersion]) {
        return res.status(400).json({ 
          error: `Configuração de usuário '${userVersion}' não encontrada` 
        });
      }

      const currentToken = userTokens[userVersion];
      const cache = validationCache[userVersion];
      
      // Verifica se o cache é recente (últimos 30 segundos)
      const cacheIsRecent = (Date.now() - cache.lastCheck) < 30000;
      
      // Se o token é válido e o cache é recente, usa o token existente
      if (cacheIsRecent && cache.isValid && isTokenValid(currentToken)) {
        req.apiCredentials = currentToken;
        req.userVersion = userVersion;
        req.user = currentToken.user;
        return next();
      }
      
      // Se não tem token ou token expirado, faz login apenas para o usuário específico
      if (!isTokenValid(currentToken)) {
        const result = await getToken(currentToken, USER_CONFIGS[userVersion], userVersion);
        if (!result) {
          return res.status(500).json({ 
            error: 'Internal server error',
            code: 'AUTH_FAILED'
          });
        }
      }

      req.apiCredentials = currentToken;
      req.userVersion = userVersion;
      req.user = currentToken.user;
      
      next();
    } catch (error) {
      return res.status(500).json({ 
        error: 'Internal server error',
        code: 'AUTH_FAILED'
      });
    }
  };
}


/**
 * Função para obter token de um usuário específico (mantida para compatibilidade)
 * @param {string} userVersion - Versão do usuário
 * @returns {Object} Credenciais do usuário
 */
async function getUserToken(userVersion) {
  if (!USER_CONFIGS[userVersion]) {
    throw new Error(`Configuração de usuário '${userVersion}' não encontrada`);
  }

  const currentToken = userTokens[userVersion];
  
  if (!isTokenValid(currentToken)) {
    const result = await getToken(currentToken, USER_CONFIGS[userVersion], userVersion);
    if (!result) {
      throw new Error('AUTH_FAILED');
    }
  }

  return currentToken;
}

module.exports = {
  createTokenMiddleware,
  getUserToken,
  USER_CONFIGS
};
