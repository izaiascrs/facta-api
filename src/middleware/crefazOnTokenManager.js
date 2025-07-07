// src/middleware/energyTokenManager.js

const axios = require('axios');

// Armazenamento de tokens da API de energia por usuário
const energyTokens = {
  v1: {},
  v2: {}
};

// Cache de validação para a API de energia
const energyValidationCache = {
  v1: { lastCheck: 0, isValid: false },
  v2: { lastCheck: 0, isValid: false }
};

// Configurações da API de energia
const ENERGY_API_CONFIG = {
  baseURL: process.env.CREFAZ_ON_URL,
  loginEndpoint: '/usuario/login',
};

// Usa as mesmas credenciais do middleware anterior
const userCredentials = {
  v1: {
    login: process.env.CONTA_LUZ_USER,
    senha: process.env.CONTA_LUZ_PASSWORD,
  },
  v2: {
    login: process.env.CONTA_LUZ_USER_2,
    senha: process.env.CONTA_LUZ_PASSWORD_2,
  }
};

async function getEnergyToken(userVersion, userCredentials) {
  console.log(`getEnergyToken para usuário ${userVersion}....`);
  
  try {
    const { data } = await axios.post(
      `${ENERGY_API_CONFIG.baseURL}${ENERGY_API_CONFIG.loginEndpoint}`,
      userCredentials
    );
    
    const expiresDay = data.data.expires.split('T')[0];
    energyTokens[userVersion].token = data.data.token;
    energyTokens[userVersion].expires = expiresDay.replace(/-/g, '/');
    energyTokens[userVersion].user = data.data?.nome || '';
    
    // Atualiza o cache de validação
    energyValidationCache[userVersion] = {
      lastCheck: Date.now(),
      isValid: true
    };
    
    return energyTokens[userVersion];
  } catch (error) {
    console.log(error);
    return false;
  }
}

function isEnergyTokenValid(tokenData) {
  if (!tokenData || !tokenData.token || !tokenData.expires) {
    return false;
  }

  const currentDay = new Date();
  const expiresDay = new Date(tokenData.expires);
  
  // Adiciona margem de segurança de 5 minutos
  expiresDay.setMinutes(expiresDay.getMinutes() - 5);
  
  return currentDay < expiresDay;
}

function createEnergyTokenMiddleware() {
  return async (req, res, next) => {
    try {
      // Pega a versão do usuário do middleware anterior
      const userVersion = req.userVersion;
      
      if (!userVersion) {
        return res.status(400).json({ 
          error: 'Versão do usuário não encontrada' 
        });
      }

      const currentToken = energyTokens[userVersion];
      const cache = energyValidationCache[userVersion];
      
      // Verifica se o cache é recente (últimos 30 segundos)
      const cacheIsRecent = (Date.now() - cache.lastCheck) < 30000;
      
      // Se o token é válido e o cache é recente, usa o token existente
      if (cacheIsRecent && cache.isValid && isEnergyTokenValid(currentToken)) {
        req.crefazOnApiCredentials = currentToken;
        return next();
      }
      
      // Se não tem token ou token expirado, faz login
      if (!isEnergyTokenValid(currentToken)) {
        const result = await getEnergyToken(userVersion, userCredentials[userVersion]);
        if (!result) {
          return res.status(401).json({ 
            error: 'Falha na autenticação na API de energia' 
          });
        }
      }

      req.crefazOnApiCredentials = currentToken;
      
      next();
    } catch (error) {
      console.error('Erro no middleware de token da API de energia:', error);
      return res.status(500).json({ 
        error: 'Erro interno no gerenciamento de token da API de energia' 
      });
    }
  };
}

module.exports = {
  createEnergyTokenMiddleware
};