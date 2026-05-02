import moment from 'moment-timezone';
import fs from 'fs';
import os from 'os';
import config from '../config.cjs';
import axios from 'axios';
import { generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys';


const totalMemoryBytes = os.totalmem();
const freeMemoryBytes = os.freemem();

const byteToKB = 1 / 1024;
const byteToMB = byteToKB / 1024;
const byteToGB = byteToMB / 1024;

function formatBytes(bytes) {
  if (bytes >= Math.pow(1024, 3)) return (bytes * byteToGB).toFixed(2) + ' GB';
  if (bytes >= Math.pow(1024, 2)) return (bytes * byteToMB).toFixed(2) + ' MB';
  if (bytes >= 1024) return (bytes * byteToKB).toFixed(2) + ' KB';
  return bytes.toFixed(2) + ' bytes';
}

const uptime = process.uptime();
const day = Math.floor(uptime / (24 * 3600));
const hours = Math.floor((uptime % (24 * 3600)) / 3600);
const minutes = Math.floor((uptime % 3600) / 60);
const seconds = Math.floor(uptime % 60);

const uptimeMessage = `*I am alive now since ${day}d ${hours}h ${minutes}m ${seconds}s*`;
const runMessage = `${day} Day ${hours} Hour ${minutes} Minutes ${seconds} Seconds`;

const xtime = moment.tz("Asia/Colombo").format("HH:mm:ss");
const xdate = moment.tz("Asia/Colombo").format("DD/MM/YYYY");
const time2 = moment().tz("Asia/Colombo").format("HH:mm:ss");

// safer greeting: compare minutes since midnight
const [hh, mm] = time2.split(':').map(Number);
const nowMinutes = hh * 60 + mm;

let pushwish = "";
const goodMorningStart = 0;
const goodMorningEnd = 11 * 60;   // < 11:00
const goodAfternoonEnd = 15 * 60; // < 15:00
const goodEveningEnd = 18 * 60;   // < 18:00

if (nowMinutes < 11 * 60) pushwish = "Good Morning 🌄";
else if (nowMinutes < 15 * 60) pushwish = "Good Afternoon 🌅";
else if (nowMinutes < 18 * 60) pushwish = "Good Evening 🌃";
else if (nowMinutes < 19 * 60) pushwish = "Good Evening 🌃";
else pushwish = "Good Night 🌌";

const menu = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  const mode = config.MODE === 'public' ? 'public' : 'private';
  const pref = config.PREFIX;

  const validCommands = ['menu'];
  if (!validCommands.includes(cmd)) return;

  const mainMenu = `*┌─❖*
*│𝐆𝐖𝐌-𝐗𝐌𝐃*    
*└┬❖*
   *│🔕${pushwish}*
   *└────────┈❖*
▬▬▬▬▬▬▬▬▬▬  
> 🕵️ᴜsᴇʀ ɴᴀᴍᴇ:  ${m.pushName}
> 📅ᴅᴀᴛᴇ: ${xdate} 
> ⏰ᴛɪᴍᴇ: ${xtime}    
> ⭐ᴜsᴇʀs: ${runMessage}     
▬▬▬▬▬▬▬▬▬▬

‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎
*📋 MENU OPTIONS GWM-XMD*

*1^.* 🤖 AI MENU
> <(type) *[Gai]* _to see commands ai assistant ui_

*2^.* 📥 DOWNLOAD MENU
> <(type)> *[Gdownload]* _to see search mp4 & mp4_

*3^.* 👨‍👨‍👦‍👦 GROUP MENU
> <(type)> *[Ggroup]* _to see cmd group control_

*4^.* ⚙️ SETTINGS MENU
> <(type)> *[Gsettings]* _to see more commands control bot_

*5^.* 😂 OWNER MENU
> <(type)>  *[Gowner]* _to protect bot and whatsApp_

*6^.* 🌍 GENERAL MENU
> <(type)> *[General]* _to see main menu commands_

*7^* 📃MENU COMMANDS 
> <(type)> *[Gmenu]* _to see page menu commands_

*8^* 📑 MAIN MENU 
> <(type) > *[Gmain]* _to see other cmd plugins_

*┊ Am GWM XMÐ assistant ui*
└┬───────────❖ 
┌┤ _choose to use cmd [Gai]  or (menu-ai)_
┊▬▬▬▬▬▬▬▬▬▬
*└─────────────┈❖*
`;

  await Matrix.sendMessage(m.from, {
    video: fs.readFileSync('./public/menuvidei.mp4'),
    mimetype: 'video/mp4',
    ptv: true
  });

  await Matrix.sendMessage(
    m.from,
    {
      image: fs.readFileSync('./public/fanaa.jpg'),
      caption: mainMenu,
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
    },
    {
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
    }
  );
};

export default menu;
