
import config from '../config.cjs';

const Callupdate = async (json, sock) => {
  for (const id of json) {
    if (id.status === 'offer' && config.REJECT_CALL) {
      let responseMessage = `📞 Auto Reject No Calls Allowed`;
      let msg = await sock.sendMessage(id.from, {
        text: " ",
        mentions: [id.from],
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
          newsletterJid: config.ID_CHANNEL,
          newsletterName: "╭••➤GWM-XMD",
          serverMessageId: 143,
         },
          forwardingScore: 999,
          externalAdReply: {
            title: `GWM-XMD BOT NOT ALLOWED CALL`,
            body: responseMessage,
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      });
      await sock.rejectCall(id.id, id.from);
    }
  }
};

export default Callupdate;
