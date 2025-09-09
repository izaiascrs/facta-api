require('dotenv').config();

const { searchProposalByID } = require("../functions/contaLuz");
const { sendVideoMessage, sendSimpleMessage } = require("../functions/digisac");
const sendSimulationMessage = process.env.SEND_SIMULATION_MESSAGE === 'true';

const messageWaitingSignature = 
  "Excelente notícia!\n\n" +
  "Sua análise foi aprovada e agora só falta a assinatura digital!\n\n" +
  "Assista o vídeo explicativo e faça sua assinatura de forma rápida e segura. Seguem informações para acessar: \n\n" +
  "Link Google: https://webapp.crefazon.com.br/\n\n" +
  "Login: CPF\n" +
  "Senha: 6 primeiros dígitos do CPF\n\n" +
  "Se precisar de ajuda, entre em contato com a gente!";

const messageWaitingAnalysis = 
  "Olá! Agradecemos por realizar sua simulação em nosso site.\n" +
  "Recebemos seus dados e o banco já está analisando a sua proposta. Esse processo pode levar alguns minutos.\n\n" +
  "Se preferir, você pode entrar em contato com a nossa equipe para acompanhar a verificação ou tirar qualquer dúvida.\n" +
  "Estamos à disposição para te ajudar! 😊";

async function sendProposalStatusMessage(data = {}) {
  const { token, propostaId, status, userVersion } = data;

  console.log("@sendProposalStatusMessage", { propostaId, status, userVersion });

  if(!token || !propostaId) return;
  if(status !== "Aguard. Assinatura" && status !== "Aguard. Análise") return;
  if(status === "Aguard. Análise" && userVersion !== "v2") return;

  const proposal = await searchProposalByID({ proposalID: propostaId, token });
  const proposta = proposal?.data?.proposta;

  if(!proposta) {
    // throw error to retry the job
    throw new Error("Proposta not found");
  }

  const { telefone } = proposta.contatos?.contato ?? {};

  if(!telefone) return;

  switch(status) {
    case "Aguard. Assinatura":
      await sendSimpleMessage({ telefone: "55" + telefone, message: messageWaitingSignature });
      await sendVideoMessage({ telefone: "55" + telefone });
      break;
    case "Aguard. Análise":
      if(!sendSimulationMessage) return;
      await sendSimpleMessage({ telefone: "55" + telefone, message: messageWaitingAnalysis });
      break;
    default:
      break;
  }
  return;
}

module.exports = { sendProposalStatusMessage };