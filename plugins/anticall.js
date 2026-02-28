
import config from '../config.cjs';

// Main command function
const anticallcommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  if (cmd === 'anticall') {
    if (!isCreator) return m.reply("⚠️only owner use bot");

    let responseMessage;
    if (text === 'on') {
      config.REJECT_CALL = true;
      responseMessage = "Anti-Call has been enabled✅";
    } else if (text === 'off') {
      config.REJECT_CALL = false;
      responseMessage = "Anti-Call has been disabled❎";
    } else {
      responseMessage = "Usage:- anticall on or off🔄";
    }

    try {
      await Matrix.sendMessage(m.from, {
        document: { url: "https://files.catbox.moe/qtvynm.jpg" }, 
         mimetype: 'application/pdf',
         fileName: "GWM-XMD",
         contextInfo: {
         isForwarded: true,
          forwardedNewsletterMessageInfo: {
          newsletterJid: config.ID_CHANNEL,
          newsletterName: "╭••➤GWM-XMD",
          serverMessageId: 143,
         },
          forwardingScore: 999,
          externalAdReply: {
            title: "I am GWM-XMD for assistant ui",
            body: responseMessage,
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
          }
        }
      }, { quoted: m });
    } catch (error) {
      console.error("Error processing your request:", error);
      await Matrix.sendMessage(m.from, {
        text: ' ',
        contextInfo: {
                  isForwarded: true,
          forwardedNewsletterMessageInfo: {
          newsletterJid: config.ID_CHANNEL,
          newsletterName: "╭••➤GWM-XMD",
          serverMessageId: 143,
         },
          forwardingScore: 999,
          externalAdReply: {
            title: "I am GWM-XMD for assistant ui",
            body: '❌Error processing your request.',
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
          }
        }
      }, { quoted: m });
    }
  }
};

export default anticallcommand;

