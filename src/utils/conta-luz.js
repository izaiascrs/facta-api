const cities = require("../../cities.json");

function normalizeSimulationData(data = {}) {
  const state = data.estado ?? "";
  const userCity = data.cidade ?? "";
  const cidadeId =
    cities[state]?.find((city) => city?.nome === userCity)?.id ?? 0;
    
  return {
    cliente: {
      cpf: data.cpf,
      nome: data.nome,
      nascimento: data.nascimento,
    },
    profissional: {
      ocupacaoId: data.ocupacaoId,
    },
    contato: {
      telefone: data.telefone,
    },
    endereco: {
      logradouro: data.logradouro ?? "",
      bairro: data.bairro ?? "",
      cep: data.cep,
      cidadeId: cidadeId,
    },
    operacao: {
      urlNotificacao: "https://api.crediconfiance.com.br/api/luz/webhook",
    },
  };
}

module.exports = {
  normalizeSimulationData,
};
