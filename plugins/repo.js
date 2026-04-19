

import axios from "axios";
import config from '../config.cjs';
import fs from "fs";

const repo = async (m, gss) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";
  
  if (["repo", "sc", "script", "info"].includes(cmd)) {
    try {
      const response = await axios.get(`https://api.github.com/repos/NjabuloJ/Njabulo-Jb`);
      const data = response.data;
      const msg = `
*┌─❖*
*│𝐆𝐖𝐌-𝐗𝐌𝐃*
*└┬❖*
   *│🔕${m.pushName}*
   *└────────┈❖*
▬▬▬▬▬▬▬▬▬▬
> 🕵️ ${data.stargazers_count} stars
> 📅 ${data.forks_count} forks
> ⏰ ${data.description}
> ⭐ ${data.html_url}
▬▬▬▬▬▬▬▬▬▬
      `;
      await gss.sendMessage(m.from, { react: { text: "👍", key: m.key } });
      await gss.sendMessage(m.from, { video: fs.readFileSync('./public/menuvidei.mp4'), mimetype: 'video/mp4', ptv: true });
      await gss.sendMessage(m.from, { 
        video: fs.readFileSync('./public/menuvid.mp4'), 
        caption: msg, 
        contextInfo: { 
          mentionedJid: [m.sender], 
          forwardingScore: 999, 
          isForwarded: true, 
          forwardedNewsletterMessageInfo: { 
            newsletterJid: config.ID_CHANNEL, 
            newsletterName: "╭••➤GWM-XMD", 
            serverMessageId: 143, 
          } 
        } 
      }, { 
        quoted: { 
          key: { 
            fromMe: false, 
            participant: `0@s.whatsapp.net`, 
            remoteJid: "status@broadcast" 
          }, 
          message: { 
            contactMessage: { 
              displayName: `${m.pushName}`, 
              vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Njabulo-Jb;BOT;;;\nFN:Njabulo-Jb\nitem1.TEL;waid=26777821911:+26777821911\nitem1.X-ABLabel:Bot\nEND:VCARD` 
            } 
          } 
        } 
      });
    } catch (error) {
      console.error(error);
      await gss.sendMessage(m.from, { text: "Error fetching repo info 😕" });
    }
  }
}

export default repo;


