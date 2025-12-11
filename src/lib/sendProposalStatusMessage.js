require('dotenv').config();

const { searchProposalByID, getProposalOffers } = require("../functions/contaLuz");
const { sendVideoMessage, sendSimpleMessage, getContactIdByPhone, getContactMessagesByContactId, checkIfContactHasRepliedMessage } = require("../functions/digisac");
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

const cpAutoMessage = 
  "Oi, tudo bem?\n\n" +
  "*Sua análise foi concluída!*\n\n" +
  "Neste momento, o crédito pela conta de luz não está disponível, mas temos uma excelente oportunidade para você!\n\n" +
  "*Você foi pré-aprovado na modalidade refinanciamento de veículos!*\n\n" +
  "Crédito facilitado com condições especiais e liberação rápida* 🚗💰\n\n" +
  "*Com juros 4 vezes menor e valor liberado maior do que a modalidade de crédito na conta de luz. 🙌🏻*\n\n" +
  "Posso te enviar uma simulação com essa oferta exclusiva? 😉\n\n" +
  "*Oferta liberado por tempo limitado 🚀*"

async function sendProposalStatusMessage(data = {}) {
  const { token, propostaId, status, userVersion } = data;

  console.log("@sendProposalStatusMessage", { propostaId, status, userVersion });
  const validStatuses = ["Aguard. Assinatura", "Aguard. Análise", "Seleção Oferta", "Negada"];

  if(!token || !propostaId) return;
  if(!validStatuses.includes(status)) return;
  if(status === "Aguard. Análise" && userVersion !== "v2") return;

  const proposal = await searchProposalByID({ proposalID: propostaId, token });
  const proposta = proposal?.data?.proposta;

  if(!proposta) {
    // throw error to retry the job
    throw new Error("Proposta not found");
  }

  const { telefone } = proposta.contatos?.contato ?? {};

  if(!telefone) return;

  let formattedPhone = "55" + String(telefone).replace(/\D/g, "");

  switch(status) {
    case "Negada":
      // only send the message if the contact has replied to the message
      const motivo = proposta?.motivo ?? [];
      const motivoMessage = new Set(motivo.map(item => item.nome ?? ""));
      if(motivoMessage.size > 0) {
        // check if the contact exists in digisac
        let contactId = await getContactIdByPhone(formattedPhone);
        if(!contactId) {
          // if the phone number has less than 13 digits, it means it doesn't have a 9 after the DDD
          if(formattedPhone.length < 13) return;
          // remove the 9 from the phone number after DDD
          formattedPhone = "55" + String(telefone).replace(/^\d{3}/, (match) => {
            // match includes ddd and 9 after it
            const lastDigit = match.slice(-1);
            return lastDigit === "9" ? match.slice(0, -1) : match;
          });
          contactId = await getContactIdByPhone(formattedPhone);
          if(!contactId) return;
        }
        // check if the contact has replied to the message
        const messages = await getContactMessagesByContactId(contactId);
        if(!checkIfContactHasRepliedMessage(messages)) return;
        // send the message to the contact
        const message = Array.from(motivoMessage).join("\n");
        await sendSimpleMessage({ telefone: formattedPhone, message: message });
      }
      break;
    case "Seleção Oferta":
      // cp auto is a new product, so we need to send the message to the user since we don't have an api for now
      const offers = await getProposalOffers({ proposalID: propostaId, token });
      if(!offers || offers.success === false) return;
      const products = offers.data.produtos ?? [];
      
      // if we have energy product, we don't need to send the message
      const energyProduct = products.find(product => product.nome === "Energia");
      if(energyProduct) return;

      // check if we have cp auto product
      const cpAutoProduct = products.find(product => product.nome === "CP Auto"); // vehicle refinancing CP Auto
      if(!cpAutoProduct) return;
      // for now use test phone
      await sendSimpleMessage({ telefone: formattedPhone, message: cpAutoMessage });
      break;
    case "Aguard. Assinatura":
      await sendSimpleMessage({ telefone: formattedPhone, message: messageWaitingSignature });
      await sendVideoMessage({ telefone: formattedPhone });
      break;
    case "Aguard. Análise":
      if(!sendSimulationMessage) return;
      await sendSimpleMessage({ telefone: formattedPhone, message: messageWaitingAnalysis });
      break;
    default:
      break;
  }
  return;
}

module.exports = { sendProposalStatusMessage };