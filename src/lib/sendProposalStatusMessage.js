require('dotenv').config();

const { searchProposalByID } = require("../functions/contaLuz");
const { sendVideoMessage, sendSimpleMessage } = require("../functions/digisac");

const message = 
  "Excelente notícia!\n\n" +
  "Sua análise foi aprovada e agora só falta a assinatura digital!\n" +
  "Assista o vídeo explicativo e faça sua assinatura de forma rápida e segura. Seguem informações para acessar o aplicativo:\n\n" +
  "Login: Seu CPF\n" +
  "Senha: 6 primeiros dígitos do seu CPF\n\n" +
  "Link App:\n\n" +
  "https://play.google.com/store/apps/details?id=com.crefaz.meu_crefaz&hl=pt_BR&gl=US&pli=1\n\n" +
  "Se precisar de ajuda, entre em contato com a gente!";

async function sendProposalStatusMessage(data = {}) {
  const { token, propostaId, status } = data;

  console.log("@sendProposalStatusMessage", { propostaId, status });

  if(!token || !propostaId) return;

  if(status !== "Aguard. Assinatura") return;

  const proposal = await searchProposalByID({ proposalID: propostaId, token });
  const proposta = proposal?.data?.proposta;

  if(!proposta) {
    // throw error to retry the job
    throw new Error("Proposta not found");
  }

  const { telefone } = proposta.contatos.contato;

  if(!telefone) return;

  await sendSimpleMessage({ telefone: "55" + telefone, message });
  await sendVideoMessage({ telefone: "55" + telefone });
}


module.exports = { sendProposalStatusMessage };