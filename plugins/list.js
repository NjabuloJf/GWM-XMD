
import moment from 'moment-timezone';
import fs from 'fs';
import os from 'os';
import pkg from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;
import config from '../config.cjs';
import axios from 'axios';

// Get total memory and free memory in bytes
const totalMemoryBytes = os.totalmem();
const freeMemoryBytes = os.freemem();

// Define unit conversions
const byteToKB = 1 / 1024;
const byteToMB = byteToKB / 1024;
const byteToGB = byteToMB / 1024;

// Function to format bytes to a human-readable format
function formatBytes(bytes) {
  if (bytes >= Math.pow(1024, 3)) {
    return (bytes * byteToGB).toFixed(2) + ' GB';
  } else if (bytes >= Math.pow(1024, 2)) {
    return (bytes * byteToMB).toFixed(2) + ' MB';
  } else if (bytes >= 1024) {
    return (bytes * byteToKB).toFixed(2) + ' KB';
  } else {
    return bytes.toFixed(2) + ' bytes';
  }
}

// Bot Process Time
const uptime = process.uptime();
const day = Math.floor(uptime / (24 * 3600)); // Calculate days
const hours = Math.floor((uptime % (24 * 3600)) / 3600); // Calculate hours
const minutes = Math.floor((uptime % 3600) / 60); // Calculate minutes
const seconds = Math.floor(uptime % 60); // Calculate seconds

// Uptime
const uptimeMessage = `*I am alive now since ${day}d ${hours}h ${minutes}m ${seconds}s*`;
const runMessage = `*☀️ ${day} Day*\n*🕐 ${hours} Hour*\n*⏰ ${minutes} Minutes*\n*⏱️ ${seconds} Seconds*\n`;

const xtime = moment.tz("Asia/Colombo").format("HH:mm:ss");
const xdate = moment.tz("Asia/Colombo").format("DD/MM/YYYY");
const time2 = moment().tz("Asia/Colombo").format("HH:mm:ss");
let pushwish = "";
if (time2 < "05:00:00") {
  pushwish = `Good Morning 🌄`;
} else if (time2 < "11:00:00") {
  pushwish = `Good Morning 🌄`;
} else if (time2 < "15:00:00") {
  pushwish = `Good Afternoon 🌅`;
} else if (time2 < "18:00:00") {
  pushwish = `Good Evening 🌃`;
} else if (time2 < "19:00:00") {
  pushwish = `Good Evening 🌃`;
} else {
  pushwish = `Good Night 🌌`;
}

const menu = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const mode = config.MODE === 'public' ? 'public' : 'private';
  const pref = config.PREFIX;
  const validCommands = ['fullmenu', 'menu', 'listcmd'];

  if (validCommands.includes(cmd)) {
    const str = `*╭ׂ─ׂ┄『•ɴᴊᴀʙᴜʟᴏᴊʙ ᴇʟɪᴛᴇ•』┴*
*│╭ׂ─ׂ┄─ׅ─ׂ┄* 
*┴│▢◦name: njabulo.elite.app*
*⿻│▢◦prefix: [ ${prefix} ]* 
*⿻│▢◦mode: ${mode}*
*⿻│▢◦baileys: Multi.Device.co*
*┬│▢◦version:* ^4.8.c
*│┕─ׂ┄─ׅ─ׂ┄*
*├┅┄─ׅ─ׂ┄─ׂ┄─ׅ─ׂ┄|*
*│╭ׂ─ׂ┄─ׅ─ׂ┄*
*┴│①◦Owner.menu*
*⿻│②◦Main.menu*
*⿻│③◦Search.menu*
*⿻│④◦Group.menu*
*⿻│⑤◦Tools.menu*
*⿻│⑥◦AI.menu*
*⿻│⑦◦Converter.menu* 
*⿻│⑧◦Download.menu*
*⿻│*
*⿻│①◦ *visit*
*⿻│get* njabulobot.vercel.app
*┬│②◦reply menu type like .ai.menu*
*│┕─ׂ┄─ׅ─ׂ┄*
*╰─┄─ׅ─ׂ┄─ׂ┄─ׅ─ׂ─ׂ┄┴*`;

    // Check if MENU_IMAGE exists in config and is not empty
    let menuImage;
    if (config.MENU_IMAGE && config.MENU_IMAGE.trim() !== '') {
      try {
        // Try to fetch the image from URL
        const response = await axios.get(config.MENU_IMAGE, { responseType: 'arraybuffer' });
        menuImage = Buffer.from(response.data, 'binary');
      } catch (error) {
        console.error('Error fetching menu image from URL, falling back to local image:', error);
        menuImage = fs.readFileSync('./njabulo/fana.jpg');
      }
    } else {
      // Use local image if MENU_IMAGE is not configured
      menuImage = fs.readFileSync('./njabulo/fana.jpg');
    }

    // Send the menu message
    await Matrix.sendMessage(m.from, {
      image: menuImage,
      caption: str,
       contextInfo: {
           mentionedJid: [m.sender],
           externalAdReply: {
            title: "NjabuloJb Elite (MENU)",
            body: "Mmmm it's you really 😘😍💋",
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
            mediaType: 1,
            renderLargerThumbnail: false, 
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
        }
      }
    }, { quoted: m });

    await Matrix.sendMessage(m.from, {
      audio: { url: 'https://files.catbox.moe/6x0rb7.mp3' },
       mimetype: 'audio/mpeg',
       ptt: true, // Send as a voice note
       contextInfo: {
           mentionedJid: [m.sender],
           externalAdReply: {
            title: "🦈Song of tje year",
            body: "l really love papi😘😍💋",
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
            mediaType: 1,
            renderLargerThumbnail: false, 
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
        }
      }
    }, { quoted: m });
  }
};

export default menu; 
