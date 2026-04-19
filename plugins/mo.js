import moment from 'moment-timezone';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import config from '../config.cjs';
import { pathToFileURL } from 'url';

const mo = async (m, Matrix) => {
  try {
    const prefix = config.PREFIX;
    const body = m.body || "";
    const inputCmd = body.startsWith(prefix) ? body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    
    if (!['mo', 'mi', 'me'].includes(inputCmd)) return;

    const uptime = process.uptime();
    const day = Math.floor(uptime / (24 * 3600));
    const hours = Math.floor((uptime % (24 * 3600)) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const time = moment().tz("Africa/Nairobi").format("HH:mm:ss");

    const pluginsPath = path.join(process.cwd(), 'plugins'); 
    let categories = {
      'DOWNLOAD': [],
      'GROUP': [],
      'OWNER': [],
      'TOOLS': [],
      'AI': [],
      'SEARCH': [],
      'STALK': [],
      'MAIN': []
    };

    if (fs.existsSync(pluginsPath)) {
      const files = fs.readdirSync(pluginsPath).filter(file => file.endsWith('.js'));
      
      for (const file of files) {
        try {
          const filePath = path.join(pluginsPath, file);
          const fileUrl = pathToFileURL(filePath).href;
          const plugin = await import(fileUrl);
          
          // Hapa tunasoma jina la command ndani ya file badala ya jina la file
          // Inatafuta 'cmd', 'command', au 'name' ndani ya file
          const cmdName = plugin.default?.cmd || plugin.default?.command || plugin.default?.name || file.replace('.js', '');
          const name = Array.isArray(cmdName) ? cmdName[0] : cmdName;

          // Categorization Logic kulingana na jina la command
          if (['ytmp3', 'ytmp4', 'play', 'song', 'video', 'fb', 'tiktok', 'insta', 'apk', 'gitclone', 'gdrive', 'mediafire'].some(v => name.includes(v))) {
            categories['DOWNLOAD'].push(name);
          } else if (['add', 'kick', 'promote', 'demote', 'hidetag', 'tagall', 'antilink', 'group', 'welcome', 'setname', 'setdesc', 'terminateall', 'tagnation', 'invite'].some(v => name.includes(v))) {
            categories['GROUP'].push(name);
          } else if (['setpp', 'block', 'unblock', 'join', 'leave', 'restart', 'mode', 'anticall', 'autotyping', 'autoread'].some(v => name.includes(v))) {
            categories['OWNER'].push(name);
          } else if (['ai', 'gpt', 'dalle', 'remini', 'gemini', 'bug', 'report'].some(v => name.includes(v))) {
            categories['AI'].push(name);
          } else if (['calc', 'tempmail', 'checkmail', 'trt', 'tts'].some(v => name.includes(v))) {
            categories['TOOLS'].push(name);
          } else if (['yts', 'imdb', 'google', 'gimage', 'pinterest', 'lyrics', 'ytsearch'].some(v => name.includes(v))) {
            categories['SEARCH'].push(name);
          } else if (['truecaller', 'instastalk', 'githubstalk'].some(v => name.includes(v))) {
            categories['STALK'].push(name);
          } else {
            categories['MAIN'].push(name); 
          }
        } catch (e) {
          console.error(`Error loading plugin ${file}:`, e);
        }
      }
    }

    let menuText = `
╭━━━〔 *${config.BOT_NAME || 'TIMNASA-TMD'}* 〕━━━┈⊷
┃★╭──────────────
┃★│ 👤 *User:* ${m.pushName}
┃★│ ⏳ *Uptime:* ${day}d ${hours}h ${minutes}m
┃★│ ⌚ *Time:* ${time}
┃★│ 🛠️ *Prefix:* [ ${prefix} ]
┃★│ 📚 *Commands:* Synchronized
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷

> Hello🌹 *${m.pushName}*! Here are the active commands from Timnasa Tmd:
`;

    Object.keys(categories).forEach(category => {
      if (categories[category].length > 0) {
        // Kuondoa marudio na kupanga (Unique & Sort)
        const uniqueCmds = [...new Set(categories[category])].sort();
        menuText += `\n╭━━〔 *${category} MENU* 〕━━┈⊷\n`;
        menuText += `┃◈╭─────────────·๏\n`;
        uniqueCmds.forEach(c => {
          menuText += `┃◈┃• ${prefix}${c}\n`;
        });
        menuText += `┃◈└───────────┈⊷\n`;
        menuText += `╰──────────────┈⊷\n`;
      }
    });

    menuText += `\n> *Timnasa Softwares © 2026*`;

    let menuImage;
    const defaultImg = 'https://files.catbox.moe/jmyv02.jpg';
    try {
      const imgUrl = config.MENU_IMAGE || defaultImg;
      const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
      menuImage = Buffer.from(response.data, 'binary');
    } catch {
      menuImage = fs.readFileSync('./public/fana.jpg'); 
    }

    await Matrix.sendMessage(m.from, {
      image: menuImage,
      caption: menuText,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363406146813524@newsletter',
          newsletterName: "Timnasa Tmd Developers",
          serverMessageId: 143
        },
        externalAdReply: {
            title: "TIMNASA-TMD PREMIUM MENU",
            body: "Command sync active...",
            thumbnail: menuImage,
            sourceUrl: "https://whatsapp.com/channel/0029Vb6uo9yJ3juwi9GYgS47",
            mediaType: 1,
            renderLargerThumbnail: true
        }
      }
    }, { quoted: m });

  } catch (error) {
    console.error('Menu Error:', error);
  }
};

export default mo;

