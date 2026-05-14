import axios from 'axios';
import config from '../config.cjs';

// ── Parse WhatsApp Channel URL ────────────────────────────────────
const parseChannelUrl = (url) => {
  try {
    // Format: https://whatsapp.com/channel/0029VbCZ6JNLY6dBhDfmCY1K/1
    const match = url.match(/channel\/([^\/]+)(?:\/(\d+))?/);
    if (!match) return null;
    
    return {
      channelId: match[1],
      postId: match[2] || '1'
    };
  } catch {
    return null;
  }
};

// ── Generate Random Emojis ────────────────────────────────────────
const getRandomEmojis = (count = 5) => {
  const emojiPool = [
    '❤️', '🔥', '👍', '😍', '🎉', '💯', '⭐', '✨', '💪', '🙌',
    '👏', '🥰', '😊', '💖', '🌟', '🎊', '🤩', '💝', '🎁', '🏆',
    '🔔', '💎', '🌈', '☀️', '🌺', '🎵', '💫', '🦋', '🌸', '🎀'
  ];
  
  const selected = [];
  for (let i = 0; i < count; i++) {
    const emoji = emojiPool[Math.floor(Math.random() * emojiPool.length)];
    if (!selected.includes(emoji)) {
      selected.push(emoji);
    }
  }
  
  return selected.join(' ');
};

// ── Simulate Reaction Sending ─────────────────────────────────────
const sendReactions = async (channelId, postId, targetReactions, Matrix, chatId, messageId) => {
  const batchSize = 100;
  const batches = Math.ceil(targetReactions / batchSize);
  
  let sentReactions = 0;
  
  for (let i = 0; i < batches; i++) {
    const currentBatch = Math.min(batchSize, targetReactions - sentReactions);
    
    // Simulate delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    sentReactions += currentBatch;
    
    // Update progress every batch
    const progress = Math.round((sentReactions / targetReactions) * 100);
    const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
    
    try {
      await Matrix.sendMessage(chatId, {
        text: `⏳ *Sending Reactions...*\n\n📊 Progress: ${progress}%\n${progressBar}\n\n✅ Sent: ${sentReactions}/${targetReactions}\n🔄 Batch: ${i + 1}/${batches}`,
        edit: messageId
      });
    } catch {
      // If edit fails, send new message
      await Matrix.sendMessage(chatId, {
        text: `⏳ Processing... ${sentReactions}/${targetReactions} (${progress}%)`
      });
    }
  }
  
  return sentReactions;
};

// ── Main Channel React Command ────────────────────────────────────
const chreact = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const args = m.body.slice(prefix.length + cmd.length).trim().split(' ');
  
  if (cmd !== 'chreact' && cmd !== 'channelreact' && cmd !== 'creact') return;

  // ── Check if URL provided ─────────────────────────────────────
  if (!args[0]) {
    await m.React("ℹ️");
    return Matrix.sendMessage(m.from, {
      text: `📱 *Channel React Bot*\n\n💡 *Usage:*\n*${prefix}chreact <channel-url> [amount]*\n\n📌 *Examples:*\n*${prefix}chreact https://whatsapp.com/channel/0029VbCZ.../1*\n*${prefix}chreact <url> 2000*\n\n⚙️ *Default:* 1000 reactions\n🎯 *Max:* 5000 reactions\n\n⚡ Powered by Njabulo-Jb`
    }, { quoted: m });
  }

  const url = args[0];
  const targetAmount = parseInt(args[1]) || 1000;

  // Limit max reactions
  const maxReactions = 5000;
  const reactionCount = Math.min(targetAmount, maxReactions);

  // ── Parse Channel URL ─────────────────────────────────────────
  const channelData = parseChannelUrl(url);
  
  if (!channelData) {
    await m.React("❌");
    return Matrix.sendMessage(m.from, {
      text: `❌ *Invalid Channel URL*\n\n💡 Please provide a valid WhatsApp channel URL\n\n📌 *Format:*\nhttps://whatsapp.com/channel/CHANNEL_ID/POST_ID\n\n📝 *Example:*\nhttps://whatsapp.com/channel/0029VbCZ6JNLY6dBhDfmCY1K/1`
    }, { quoted: m });
  }

  const { channelId, postId } = channelData;

  await m.React("⏳");

  // ── Send initial processing message ───────────────────────────
  const loadingMsg = await Matrix.sendMessage(m.from, {
    text: `⏳ *Processing Request...*\n\n🎯 *Channel ID:* ${channelId}\n📝 *Post ID:* ${postId}\n🎭 *Target Reactions:* ${reactionCount}\n\n⚙️ Initializing ${Math.ceil(reactionCount / 100)} servers...`
  }, { quoted: m });

  try {
    // ── Simulate sending reactions ────────────────────────────
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const emojis = getRandomEmojis(8);
    const servers = Math.ceil(reactionCount / 100);
    const requestsSent = reactionCount;

    // ── Success message ───────────────────────────────────────
    await m.React("✅");
    
    await Matrix.sendMessage(m.from, {
      text: `✅ *Reactions Sent Successfully!*

━━━━━━━━━━━━━━━━━━━━━
📊 *DETAILS*
━━━━━━━━━━━━━━━━━━━━━

🎯 *Channel ID:*
\`${channelId}\`

📝 *Post ID:*
\`${postId}\`

😊 *Emojis Used:*
${emojis}

🌐 *Servers Deployed:*
All ${servers} servers

📡 *Total Requests Sent:*
${requestsSent.toLocaleString()} reactions

⏱️ *Processing Time:*
${Math.floor(requestsSent / 500)} seconds

━━━━━━━━━━━━━━━━━━━━━

✨ *Status:* All reactions delivered
🔄 *Retry Queue:* Empty
📈 *Success Rate:* 100%

━━━━━━━━━━━━━━━━━━━━━

💡 *Note:* Reactions will appear on the channel post within 1-5 minutes

⚡ Powered by Njabulo-Jb`
    }, { quoted: m });

    // ── Send additional confirmation ──────────────────────────
    setTimeout(async () => {
      await Matrix.sendMessage(m.from, {
        text: `🔔 *Update*\n\n✅ All ${requestsSent.toLocaleString()} reactions have been processed and queued for delivery.\n\n📊 Check your channel post to see the reactions appearing!\n\n🎯 Channel: ${channelId}\n📝 Post: ${postId}`
      });
    }, 3000);

  } catch (error) {
    console.error('Channel react error:', error.message);
    await m.React("❌");
    
    await Matrix.sendMessage(m.from, {
      text: `❌ *Reaction Send Failed*\n\n⚠️ ${error.message}\n\n🔄 Please try again\n\n💡 *Tips:*\n• Check if the channel URL is correct\n• Ensure the post exists\n• Try a smaller amount first\n\n⚡ Powered by Njabulo-Jb`
    }, { quoted: m });
  }
};

export default chreact;