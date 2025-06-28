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
  console.log("getToken....");
  
  try {
    const { data } = await axios.post(
      `${process.env.CREFAZ_BASE_URL}/api/usuario/login`,
      userCredentials
    );
    const expiresDay = data.data.expires.split('T')[0];
    userTokens.token = data.data.token;
    userTokens.expires = expiresDay.replace(/-/g, '/');
    userTokens.user = data.data?.nome || '';
    
    // Atualiza o cache de validação
    validationCache[userVersion] = {
      lastCheck: Date.now(),
      isValid: true
    };
    
    return userTokens;
  } catch (error) {
    console.log(error);
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
 * Middleware para gerenciar tokens de diferentes usuários
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
      
      // Se não tem token ou token expirado, faz login
      if (!isTokenValid(currentToken)) {
        const result = await getToken(currentToken, USER_CONFIGS[userVersion], userVersion);
        if (!result) {
          return res.status(401).json({ 
            error: 'Falha na autenticação' 
          });
        }
      }

      req.apiCredentials = currentToken;
      req.userVersion = userVersion;
      req.user = currentToken.user;
      
      next();
    } catch (error) {
      console.error('Erro no middleware de token:', error);
      return res.status(500).json({ 
        error: 'Erro interno no gerenciamento de token' 
      });
    }
  };
}

/**
 * Função para obter token de um usuário específico
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
      throw new Error('Falha na autenticação');
    }
  }

  return currentToken;
}

module.exports = {
  createTokenMiddleware,
  getUserToken,
  USER_CONFIGS
};