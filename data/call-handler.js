
import config from '../config.cjs';

const Callupdate = async (json, sock) => {
  for (const id of json) {
    if (id.status === 'offer' && config.REJECT_CALL) {
      let responseMessage = `*_📞 Auto Reject Call Mode Activated__📵 No Calls Allowed_*`;
      let msg = await sock.sendMessage(id.from, {
        text: " ",
        mentions: [id.from],
        contextInfo: {
          externalAdReply: {
            title: `👋hy`,
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
