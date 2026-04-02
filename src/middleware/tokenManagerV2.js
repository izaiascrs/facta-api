const axios = require('axios');

const userTokens = {};

let validationCache = { lastCheck: 0, isValid: false };

const USER_CONFIGS = {
  usuario: {
    login: process.env.CONTA_LUZ_USER_2,
    senha: process.env.CONTA_LUZ_PASSWORD_2,
    apiKey: process.env.CONTA_LUZ_KEY_2,
  }
};

async function getToken(userTokens, userCredentials) {
  try {
    const { data } = await axios.post(
      `${process.env.CREFAZ_BASE_URL_V2}/usuarios/login`,
      userCredentials
    );
    
    if (!data || !data.data || !data.data.autenticacao || !data.data.autenticacao.token) {
      validationCache = {
        lastCheck: 0,
        isValid: false
      };
      return false;
    }

    userTokens.token = data.data.autenticacao.token;
    userTokens.expires =data.data.autenticacao.expira;
    userTokens.user = data.data.autenticacao?.nome || '';
    
    validationCache = {
      lastCheck: Date.now(),
      isValid: true
    };
    
    return userTokens;
  } catch (error) {
    console.error(`Erro ao obter token`, error.response?.data || error.message);
    validationCache = {
      lastCheck: 0,
      isValid: false
    };
    return false;
  }
}

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

function createTokenMiddleware() {
  return async (req, res, next) => {
    try {
      if (!USER_CONFIGS) {
        return res.status(400).json({ 
          error: `Configuração de usuário não encontrada` 
        });
      }

      const currentToken = userTokens;
      const cache = validationCache;
      
      const cacheIsRecent = (Date.now() - cache.lastCheck) < 30000;
      
      if (cacheIsRecent && cache.isValid && isTokenValid(currentToken)) {
        req.apiCredentials = currentToken;
        req.user = currentToken.user;
        return next();
      }
      
      if (!isTokenValid(currentToken)) {
        const result = await getToken(currentToken, USER_CONFIGS);
        if (!result) {
          return res.status(500).json({ 
            error: 'Internal server error',
            code: 'AUTH_FAILED'
          });
        }
      }

      req.apiCredentials = currentToken;
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

async function getUserToken() {
  if (!USER_CONFIGS) {
    throw new Error(`Configuração de usuário não encontrada`);
  }

  const currentToken = userTokens;
  
  if (!isTokenValid(currentToken)) {
    const result = await getToken(currentToken, USER_CONFIGS);
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
