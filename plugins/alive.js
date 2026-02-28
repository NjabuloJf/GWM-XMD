
import fs from 'fs';
import config from '../config.cjs';

const alive = async (m, Matrix) => {
  try {
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    const timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

    if (!['alive', 'uptime', 'runtime'].includes(cmd)) return;

    const str = `*🤖 Bot Status: Online*\n*⏳ Uptime: ${timeString}*`;
    const videoBuffer = fs.readFileSync('./media/menuvid.mp4');

    await Matrix.sendMessage(m.from, {
      video: videoBuffer,
      caption: str,
      contextInfo: {
        forwardingScore: 999,
        mentionedJid: [m.sender],
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: config.ID_CHANNEL,
          newsletterName: "╭••➤GWM-XMD",
          serverMessageId: 143,
        }
      }
    }, { quoted: m });
  } catch (error) {
    console.error('Error in alive script:', error);
    await Matrix.sendMessage(m.from, { text: 'Error sending message' }, { quoted: m });
  }
};

export default alive;


