
import config from '../config.cjs';

const modeCommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  if (cmd === 'mode') {
    if (!isCreator) {
      let responseMessage = "*📛 THIS IS AN OWNER COMMAND*";
      await Matrix.sendMessage(m.from, {
        text: " ",
        contextInfo: {
          externalAdReply: {
            title: `👋hy ${m.pushName}`,
            body: responseMessage,
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
      return;
    }

    if (['public', 'private'].includes(text)) {
      if (text === 'public') {
        Matrix.public = true;
        config.MODE = "public";
        let responseMessage = 'Mode has been changed to public.';
        await Matrix.sendMessage(m.from, {
          text: " ",
          contextInfo: {
            externalAdReply: {
              title: `👋hy ${m.pushName}`,
              body: responseMessage,
              thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
              mediaType: 1,
              renderLargerThumbnail: false,
              sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
            }
          }
        }, { quoted: m });
      } else if (text === 'private') {
        Matrix.public = false;
        config.MODE = "private";
        let responseMessage = 'Mode has been changed to private.';
        await Matrix.sendMessage(m.from, {
          text: " ",
          contextInfo: {
            externalAdReply: {
              title: `👋hy ${m.pushName}`,
              body: responseMessage,
              thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
              mediaType: 1,
              renderLargerThumbnail: false,
              sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
            }
          }
        }, { quoted: m });
      }
    } else {
      let responseMessage = "Usage:\n.Mode public/private";
      await Matrix.sendMessage(m.from, {
        text: " ",
        contextInfo: {
          externalAdReply: {
            title: `👋hy ${m.pushName}`,
            body: responseMessage,
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
    }
  }
};

export default modeCommand;
