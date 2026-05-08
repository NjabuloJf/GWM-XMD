import os from 'os';
import config from '../config.cjs';
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
    totalMem: (totalMem / (1024 ** 3)).toFixed(2), // GB
    usedMem: (usedMem / (1024 ** 3)).toFixed(2),   // GB
    freeMem: (freeMem / (1024 ** 3)).toFixed(2),   // GB
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

// Measure ping
const measurePing = async () => {
  const start = performance.now();
  // Simulate a small operation
  await new Promise(resolve => setTimeout(resolve, 1));
  const end = performance.now();
  return (end - start).toFixed(2);
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
    const botName = config.BOT_NAME || 'Njabulo-AI Bot';
    const ownerName = config.OWNER_NAME || 'Njabulo';
    const version = config.VERSION || 'v2.0.0';
    const apiStatus = '✅ Online';
    const aiDataStatus = '✅ Active';
    
    // Calculate bot status
    const status = uptime ? '🟢 Running' : '🔴 Offline';
    const updateStatus = 'Latest Version';

    // Create status message
    const statusMessage = `
┏ *NJABULO-AI STATUS* ┓ 
*┗━━━━━━━━━━━━┈❖*

┏ *⚡ PERFORMANCE* ┓
  📡 *Ping:* ${ping}ms
  🔋 *Status:* ${status}
  📊 *CPU Usage:* ${sysInfo.memPercent}%
  💾 *Memory:* ${sysInfo.usedMem}GB / ${sysInfo.totalMem}GB
*❖* 🧠 *Free RAM:* ${sysInfo.freeMem}GB
*┗━━━━━━━━━━━━┈❖*

┏ *🌐 API & DATA* ┓
  🔌 *API Status:* ${apiStatus}
  🤖 *AI Data:* ${aiDataStatus}
  ☁️ *Platform:* ${sysInfo.platform} (${sysInfo.arch})
  🖥️ *CPU:* ${sysInfo.cpuModel}
  🔢 *Cores:* ${sysInfo.cpuCores}
*❖* 📦 *Node.js:* ${sysInfo.nodeVersion}
*┗━━━━━━━━━━━━┈❖*
 

┏ *⏰ TIME INFO* ┓
  ⏱️ *Uptime:* ${uptime}
  📅 *Date:* ${dateTime.date}
  🕐 *Time:* ${dateTime.time}
  🌍 *Timezone:* ${dateTime.timezone}
*┗━━━━━━━━━━━━┈❖*

┏ *🤖 BOT INFO* ┓
  📱 *Bot Name:* ${botName}
  👤 *Owner:* ${ownerName}
  🏗️ *Base:* fananjabulo
  🔄 *Version:* ${version}
  📦 *Update:* ${updateStatus}
❖ 💯 *Percent:* ${sysInfo.memPercent}%
*┗━━━━━━━━━━━━┈❖*

> ⚡ Power by sir NjabuloAI 2026  │
*┗━━━━━━━━━━━━┈❖*

`.trim();

    await m.React("✅");
    
    await Matrix.sendMessage(m.from, {
      text: statusMessage
    }, { quoted: m });

  } catch (error) {
    console.error('Status error:', error.message);
    await m.React("❌");
    
    await Matrix.sendMessage(m.from, {
      text: `❌ *Error Getting Status*\n\n${error.message}`
    }, { quoted: m });
  }
};

export default status;
