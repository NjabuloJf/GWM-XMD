import { proto, delay } from '@whiskeysockets/baileys';
import config from '../config.cjs';

// ── Parse Channel URL ─────────────────────────────────────────────
const parseChannelUrl = (url) => {
  try {
    // https://whatsapp.com/channel/0029VbCZ6JNLY6dBhDfmCY1K/1
    const match = url.match(/channel\/([^\/]+)(?:\/(\d+))?/);
    if (!match) return null;
    
    return {
      channelId: match[1] + '@newsletter',
      postId: match[2] || '1'
    };
  } catch {
    return null;
  }
};

// ── Generate Random Emoji ─────────────────────────────────────────
const getRandomEmoji = () => {
  const emojis = [
    '❤️', '🔥', '👍', '😍', '🎉', '💯', '⭐', '✨', 
    '💪', '🙌', '👏', '🥰', '😊', '💖', '🌟', '🎊'
  ];
  return emojis[Math.floor(Math.random() * emojis.length)];
};

// ── Send Single Reaction ──────────────────────────────────────────
const sendSingleReaction = async (Matrix, channelId, postId, emoji) => {
  try {
    const key = {
      remoteJid: channelId,
      id: postId,
      fromMe: false
    };

    await Matrix.sendMessage(channelId, {
      react: {
        text: emoji,
        key: key
      }
    });
    
    return true;
  } catch (error) {
    console.error('Reaction send error:', error.message);
    return false;
  }
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
      text: `📱 *Channel React Bot*\n\n💡 *Usage:*\n*${prefix}chreact <channel-url> [amount]*\n\n📌 *Example:*\n*${prefix}chreact https://whatsapp.com/channel/0029VbCZ.../1 500*\n\n⚙️ *Default:* 100 reactions\n🎯 *Recommended:* 50-500 per run\n\n⚠️ *Note:* Large amounts may take time\n\n⚡ Powered by Njabulo-Jb`
    }, { quoted: m });
  }

  const url = args[0];
  const targetAmount = parseInt(args[1]) || 100;

  // Limit to reasonable amount per run
  const reactionCount = Math.min(Math.max(targetAmount, 10), 1000);

  // ── Parse Channel URL ─────────────────────────────────────────
  const channelData = parseChannelUrl(url);
  
  if (!channelData) {
    await m.React("❌");
    return Matrix.sendMessage(m.from, {
      text: `❌ *Invalid Channel URL*\n\n💡 Format:\nhttps://whatsapp.com/channel/CHANNEL_ID/POST_ID\n\n📝 Example:\nhttps://whatsapp.com/channel/0029VbCZ6JNLY6dBhDfmCY1K/1`
    }, { quoted: m });
  }

  const { channelId, postId } = channelData;

  await m.React("⏳");

  // ── Send initial message ──────────────────────────────────────
  const statusMsg = await Matrix.sendMessage(m.from, {
    text: `⏳ *Starting Reaction Sender...*\n\n🎯 *Channel ID:* ${channelId.replace('@newsletter', '')}\n📝 *Post ID:* ${postId}\n🎭 *Target:* ${reactionCount} reactions\n\n⚙️ Initializing...`
  }, { quoted: m });

  try {
    let successCount = 0;
    let failCount = 0;
    const usedEmojis = [];

    // ── Send reactions in batches ─────────────────────────────
    const batchSize = 10;
    const totalBatches = Math.ceil(reactionCount / batchSize);

    for (let batch = 0; batch < totalBatches; batch++) {
      const currentBatchSize = Math.min(batchSize, reactionCount - (batch * batchSize));
      
      // Send batch of reactions
      for (let i = 0; i < currentBatchSize; i++) {
        const emoji = getRandomEmoji();
        if (!usedEmojis.includes(emoji)) {
          usedEmojis.push(emoji);
        }

        const success = await sendSingleReaction(Matrix, channelId, postId, emoji);
        
        if (success) {
          successCount++;
        } else {
          failCount++;
        }

        // Small delay between reactions
        await delay(200);
      }

      // Update progress
      const progress = Math.round((successCount / reactionCount) * 100);
      const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));

      try {
        await Matrix.sendMessage(m.from, {
          text: `⏳ *Sending Reactions...*\n\n📊 Progress: ${progress}%\n[${progressBar}]\n\n✅ Sent: ${successCount}\n❌ Failed: ${failCount}\n🎯 Target: ${reactionCount}\n🔄 Batch: ${batch + 1}/${totalBatches}`,
          edit: statusMsg.key
        });
      } catch {
        // Continue if edit fails
      }

      // Delay between batches
      await delay(1000);
    }

    // ── Success message ───────────────────────────────────────
    await m.React("✅");
    
    const successRate = ((successCount / reactionCount) * 100).toFixed(1);
    
    await Matrix.sendMessage(m.from, {
      text: `✅ *Reactions Sent Successfully!*

━━━━━━━━━━━━━━━━━━━━━
📊 *DETAILS*
━━━━━━━━━━━━━━━━━━━━━

🎯 *Channel ID:*
\`${channelId.replace('@newsletter', '')}\`

📝 *Post ID:*
\`${postId}\`

😊 *Emojis Used:*
${usedEmojis.join(' ')}

📡 *Requests Sent:*
${successCount} successful
${failCount} failed

📈 *Success Rate:*
${successRate}%

⏱️ *Processing Time:*
${Math.floor((successCount + failCount) * 0.2)} seconds

━━━━━━━━━━━━━━━━━━━━━

✨ *Status:* ${successCount} reactions delivered
🔄 *Retry Queue:* ${failCount} pending

━━━━━━━━━━━━━━━━━━━━━

💡 *Tip:* For more reactions, run the command again!

⚡ Powered by Njabulo-Jb`
    }, { quoted: m });

  } catch (error) {
    console.error('Channel react error:', error.message);
    await m.React("❌");
    
    await Matrix.sendMessage(m.from, {
      text: `❌ *Reaction Send Failed*\n\n⚠️ Error: ${error.message}\n\n🔄 *Possible Issues:*\n• Channel may be private\n• Post ID may be incorrect\n• Network connection issue\n• Rate limit reached\n\n💡 *Try:*\n• Check the channel URL\n• Use a smaller amount\n• Wait a few minutes and retry\n\n⚡ Powered by Njabulo-Jb`
    }, { quoted: m });
  }
};

export default chreact;
