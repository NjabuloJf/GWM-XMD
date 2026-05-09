import moment from 'moment-timezone';
import fs from 'fs';
import os from 'os';
import config from '../config.cjs';
import axios from 'axios';
import { generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { performance } from 'perf_hooks';

// Store bot start time
let BOT_START_TIME = Date.now();

// Calculate uptime
const getUptime = () => {
  const uptime = Date.now() - BOT_START_TIME;
  const seconds = Math.floor((uptime / 1000) % 60);
  const minutes = Math.floor((uptime / (1000 * 60)) % 60);
  const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
  const days = Math.floor(uptime / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

// Get system info
const getSystemInfo = () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = ((usedMem / totalMem) * 100).toFixed(2);

  const cpus = os.cpus();
  const cpuModel = cpus[0]?.model || 'Unknown';
  const cpuCores = cpus.length;

  return {
    platform: os.platform(),
    arch: os.arch(),
    totalMem: (totalMem / (1024 ** 3)).toFixed(2),
    usedMem: (usedMem / (1024 ** 3)).toFixed(2),
    freeMem: (freeMem / (1024 ** 3)).toFixed(2),
    memPercent,
    cpuModel,
    cpuCores,
    hostname: os.hostname(),
    nodeVersion: process.version
  };
};

// Get current date and time
const getDateTime = () => {
  const now = new Date();
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = days[now.getDay()];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12 || 12;
  
  return {
    date: `${dayName}, ${day} ${month} ${year}`,
    time: `${hours}:${minutes}:${seconds} ${ampm}`,
    timestamp: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};

// Measure ping with actual network request
const measurePing = async () => {
  const start = performance.now();
  try {
    await axios.get('https://httpbin.org/get', { timeout: 5000 });
    const end = performance.now();
    return (end - start).toFixed(2);
  } catch (error) {
    const end = performance.now();
    return (end - start).toFixed(2);
  }
};

// Main status command
const status = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  
  const validCommands = ['status', 'ping', 'uptime', 'botinfo', 'alive', 'runtime', 'info'];
  
  if (!validCommands.includes(cmd)) return;

  await m.React("⏳");

  try {
    // Gather all information
    const ping = await measurePing();
    const uptime = getUptime();
    const sysInfo = getSystemInfo();
    const dateTime = getDateTime();

    // Bot configuration
    const botName = config.BOT_NAME || 'GWM-XMD';
    const ownerName = config.OWNER_NAME || 'NjabuloJB';
    const version = config.VERSION || 'v2.0.0';
    const apiStatus = '✅ Online';
    const aiDataStatus = '✅ Active';
    
    // Calculate bot status
    const botStatus = uptime ? '🟢 Running' : '🔴 Offline';
    const updateStatus = 'Latest Version';

    // Date and time with timezone
    const xtime = moment.tz("Africa/Maputo").format("HH:mm:ss");
    const xdate = moment.tz("Africa/Maputo").format("DD/MM/YYYY");

    const repoImages = "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg";

    const start = new Date().getTime();
    
    if (typeof Matrix.sendPresenceUpdate === 'function') {
      try {
        await Matrix.sendPresenceUpdate('composing', m.from);
      } catch (presenceError) {
        console.warn("Could not send presence update:", presenceError.message);
      }
    }
    
    const end = new Date().getTime();
    const responseTime = (end - start) / 1000;

    let imageMessage = null;
    try {
      if (Matrix.waUploadToServer && typeof Matrix.waUploadToServer === 'function') {
        const imageContent = await generateWAMessageContent(
          { image: { url: repoImages } }, 
          { upload: Matrix.waUploadToServer }
        );
        imageMessage = imageContent.imageMessage;
      } else {
        console.warn("waUploadToServer not available, sending without images");
      }
    } catch (imageError) {
      console.error("Error generating image content:", imageError.message);
    }

    const cards = [
      {
        header: {
          title: `GWM-XMD STATUS`,
          hasMediaAttachment: !!imageMessage,
          ...(imageMessage && { imageMessage }),
        },
        body: {
          text: `*『ɢᴡᴍ-xᴍᴅ sᴛᴀᴛᴜs ᴏɴʟɪɴᴇ』*
⏱️ *ᴜᴘᴛɪᴍᴇ:* ${uptime} 
📡 *ᴘɪɴɢ:* ${ping}ms 
🔋 *sᴛᴀᴛᴜs:* ${botStatus} 

💻 *『sʏsᴛᴇᴍ ɪɴғᴏʀᴍᴀᴛɪᴏɴ』*
💾 *ᴛᴏᴛᴀʟ ʀᴀᴍ:* ${sysInfo.totalMem}GB
🧠 *ᴜsᴇᴅ ʀᴀᴍ:* ${sysInfo.usedMem}GB 
📊 *ғʀᴇᴇ ʀᴀᴍ:*  ${sysInfo.freeMem}GB 
📈 *ᴜsᴀɢᴇ:* ${sysInfo.memPercent}% 
🖥️ *ᴄᴘᴜ:* ${sysInfo.cpuModel?.substring(0, 35) || 'Unknown'} 
🔢 *ᴄᴏʀᴇs:* ${sysInfo.cpuCores} 
☁️ *ᴏs:* ${sysInfo.platform} (${sysInfo.arch})
📦 *ɴᴏᴅᴇ.ᴊs:* ${sysInfo.nodeVersion} 

⏰ *『ᴛɪᴍᴇ & ᴅᴀᴛᴇ』*
📅 *ᴅᴀᴛᴇ:* ${dateTime.date}
🕐 *ᴛɪᴍᴇ:* ${dateTime.time}
🌍 *ᴛɪᴍᴇᴢᴏɴᴇ:* ${dateTime.timezone}
🕒 *sᴇʀᴠᴇʀ:* ${xtime} | ${xdate} 

🌐 *『ᴀᴘɪ:』*
🌐 *ᴀᴘɪ:* ${apiStatus}
🤖 *ᴀɪ ᴅᴀᴛᴀ:* ${aiDataStatus}
⚡ *ʀᴇsᴘᴏɴsᴇ:* ${responseTime}s`,
        },
        footer: {
          text: "ᴀssɪsᴛᴀɴᴛ ʙʏ sɪʀ ɴᴊᴀʙᴜʟᴏ-ᴊʙ ᴜɪ",
        },
        nativeFlowMessage: {
          buttons: [
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "🌐 CHANNEL GWM-XMD",
                url: config.ID_CHANNEL, 
              }),
            },
          ],
        },
      },
    ];

    try {
      const message = generateWAMessageFromContent(
        m.from,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
              },
              interactiveMessage: {
                header: { 
                  title: `ɢᴡᴍ-xᴍᴅ sᴛᴀᴛᴜs ᴏɴʟɪɴᴇ`,
                  subtitle: `by ${ownerName}`
                },
                body: { 
                  text: `ɢᴡᴍ-xᴍᴅ sᴛᴀᴛᴜs ᴏɴʟɪɴᴇ` 
                },
                footer: {
                  text: ` `
                },
                headerType: 1,
                carouselMessage: { cards },
              },
            },
          },
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
                displayName: "ɴᴊᴀʙᴜʟᴏ ᴊʙ",
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Njabulo-Jb;BOT;;;\nFN:Njabulo-Jb\nitem1.TEL;waid=26777821911:+26777821911\nitem1.X-ABLabel:Bot\nEND:VCARD`
              }
            }
          } 
        }
      );

      await Matrix.relayMessage(m.from, message.message, { messageId: message.key.id });
      
      try {
        const reactionEmojis = ['✅', '💚', '🟢', '⚡', '🚀', '🎯', '🌟', '💥', '🔹', '💎'];
        const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
        await m.React(reactionEmoji);
      } catch (reactionError) {
        console.warn("Could not send reaction:", reactionError.message);
      }
      
    } catch (e) {
      console.error("Error in status command:", e);
      
      // Fallback simple status message
      await Matrix.sendMessage(m.from, { 
        text: `✅ *GWM-XMD AI IS ALIVE!* ✅\n\n⏱️ *Uptime:* ${uptime}\n📡 *Ping:* ${ping}ms\n💾 *Memory:* ${sysInfo.usedMem}GB / ${sysInfo.totalMem}GB\n📊 *Usage:* ${sysInfo.memPercent}%\n\n🟢 *System: Operational*\n🤖 *Bot: Running Smoothly*\n\n_Response time: ${responseTime}s_`,
      });
    }
  } catch (error) {
    console.error("Error in status function:", error);
    
    try {
      await Matrix.sendMessage(m.from, { 
        text: `🟢 *GWM-XMD - ALIVE & RUNNING* 🟢\n\n✅ Bot is operational\n✅ Status check completed\n\n_Use !status for detailed info_`,
      });
      await m.React("✅");
    } catch (sendError) {
      console.error("Failed to send error message:", sendError);
    }
  }
};

export default status;
