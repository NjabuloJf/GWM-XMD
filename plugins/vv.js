import { getContentType, downloadMediaMessage } from '@whiskeysockets/baileys';
import config from '../config.cjs';

const vv = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const validCommands = ['vv', 'view', 'open'];

  if (!validCommands.includes(cmd)) return;

  try {
    const quoted = m.quoted;

    if (!quoted) {
      await m.React("❌");
      return await Matrix.sendMessage(m.from, {
        text: '*Mention the message that you want to save*'
      }, { quoted: m });
    }

    const msg = quoted.message || quoted;
    const type = getContentType(msg);

    let message;

    if (type === 'conversation' || type === 'extendedTextMessage') {
      const text = msg.conversation || msg.extendedTextMessage?.text || '';
      message = { text };

    } else if (type === 'imageMessage') {
      const buffer = await downloadMediaMessage(
        { message: msg, key: quoted.key || m.key },
        'buffer',
        {},
        { logger: console, reuploadRequest: Matrix.updateMediaMessage }
      );
      message = {
        image: buffer,
        caption: msg.imageMessage?.caption || '',
      };

    } else if (type === 'videoMessage') {
      const buffer = await downloadMediaMessage(
        { message: msg, key: quoted.key || m.key },
        'buffer',
        {},
        { logger: console, reuploadRequest: Matrix.updateMediaMessage }
      );
      message = {
        video: buffer,
        caption: msg.videoMessage?.caption || '',
      };

    } else if (type === 'audioMessage') {
      const buffer = await downloadMediaMessage(
        { message: msg, key: quoted.key || m.key },
        'buffer',
        {},
        { logger: console, reuploadRequest: Matrix.updateMediaMessage }
      );
      message = {
        audio: buffer,
        mimetype: 'audio/mp4',
        ptt: msg.audioMessage?.ptt || false,
      };

    } else if (type === 'stickerMessage') {
      const buffer = await downloadMediaMessage(
        { message: msg, key: quoted.key || m.key },
        'buffer',
        {},
        { logger: console, reuploadRequest: Matrix.updateMediaMessage }
      );
      message = { sticker: buffer };

    } else if (type === 'documentMessage') {
      const buffer = await downloadMediaMessage(
        { message: msg, key: quoted.key || m.key },
        'buffer',
        {},
        { logger: console, reuploadRequest: Matrix.updateMediaMessage }
      );
      message = {
        document: buffer,
        mimetype: msg.documentMessage?.mimetype || 'application/octet-stream',
        fileName: msg.documentMessage?.fileName || 'file',
      };

    } else {
      await m.React("❌");
      return await Matrix.sendMessage(m.from, {
        text: `❌ Unsupported message type: *${type}*`
      }, { quoted: m });
    }

    await m.React("✅");
    await Matrix.sendMessage(m.from, message, { quoted: m });

  } catch (error) {
    console.error('Error in vv command:', error);
    await m.React("❌");
    await Matrix.sendMessage(m.from, {
      text: `❌ Error: ${error.message}`
    }, { quoted: m });
  }
};

export default vv;
