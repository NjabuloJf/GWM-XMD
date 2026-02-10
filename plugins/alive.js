import fs from 'fs';
import config from '../config.cjs';

const alive = async (m, Matrix) => {
  const uptimeSeconds = process.uptime();
  const days = Math.floor(uptimeSeconds / (3600 * 24));
  const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  const timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  if (!['alive', 'uptime', 'runtime'].includes(cmd)) return;

  const str = `Uptime: ${timeString}`;

  await Matrix.sendMessage(m.from, {
    contextInfo: {
      audio: { url: 'https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.m4a' }, 
      mimetype: 'audio/mpeg',
     ptt: true, // Important for voice note
      contextInfo: {
        externalAdReply: {
          title: `👋hy ${m.pushName}`,
          body: str,
          thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
          mediaType: 1,
          renderLargerThumbnail: false,
          sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
        }
      }
    }, { quoted: m });
};

export default alive;
