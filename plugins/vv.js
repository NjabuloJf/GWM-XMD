
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import config from '../config.cjs';

const vv = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const validCommands = ['vv', 'view', 'open'];

  if (!validCommands.includes(cmd)) return;

  try {
    const msgRepondu = m.quoted;

    if (!msgRepondu) {
      return await Matrix.sendMessage(m.from, {
        text: '*Mention the message that you want to save*'
      }, { quoted: m });
    }

    const type = getContentType(msgRepondu.message);
    let message;

    if (type === 'conversation') {
      message = { text: msgRepondu.message.conversation };

    } else if (type === 'imageMessage') {
      const media = await Matrix.downloadAndSaveMediaMessage(msgRepondu.message.imageMessage);
      message = {
        image: { url: media },
        caption: msgRepondu.message.imageMessage.caption || '',
      };

    } else if (type === 'videoMessage') {
      const media = await Matrix.downloadAndSaveMediaMessage(msgRepondu.message.videoMessage);
      message = {
        video: { url: media },
        caption: msgRepondu.message.videoMessage.caption || '',
      };

    } else if (type === 'stickerMessage') {
      const media = await Matrix.downloadAndSaveMediaMessage(msgRepondu.message.stickerMessage);
      const stickerMess = new Sticker(media, {
        pack: 'Njabulo',
        type: StickerTypes.CROPPED,
        categories: ['🤩', '🎉'],
        id: '12345',
        quality: 70,
        background: 'transparent',
      });
      const stickerBuffer = await stickerMess.toBuffer();
      message = { sticker: stickerBuffer };

    } else {
      message = { text: 'Unsupported message type' };
    }

    await m.React("✅");
    await Matrix.sendMessage(m.from, message, { quoted: m });

  } catch (error) {
    console.error('Error in vv command:', error);
    await m.React("❌");
    await Matrix.sendMessage(m.from, {
      text: '❌ Error processing message. Try again.'
    }, { quoted: m });
  }
};

export default vv;
