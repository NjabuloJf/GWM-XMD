
import config from '../config.cjs';

const tagAll = async (m, gss) => {
  try {
    const prefix = config.PREFIX;
    const body = m.body || '';
    // Check if message starts with prefix
    if (!body.startsWith(prefix)) return;
    const cmd = body.slice(prefix.length).split(' ')[0].toLowerCase();
    const text = body.slice(prefix.length + cmd.length).trim();
    // Check for the valid command
    const validCommands = ['tagall', 'everyone', 'mentionall'];
    if (!validCommands.includes(cmd)) return;
    // Check if the message is from a group
    if (!m.isGroup) {
      let responseMessage = "Please use this command only in group chats.";
      await gss.sendMessage(m.from, {
        text: " ",
        contextInfo: {
          externalAdReply: {
            title: `👋hy ${m.pushName}`,
            body: responseMessage,
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
      return;
    }
    // ... rest of the code ...

    let responseMessage = `乂 *ATTENTION EVERYONE* 乂\n\n`;
    // Add custom message if provided
    if (text) {
      responseMessage += `*📢 Announcement:* ${text}\n\n`;
    } else {
      responseMessage += `*📢 Announcement:* Admin wants everyone's attention!\n\n`;
    }
    // ... rest of the code ...

    await gss.sendMessage(m.from, {
      text: responseMessage,
      mentions: mentionIds,
      contextInfo: {
        externalAdReply: {
          title: `👋hy ${m.pushName}`,
          body: responseMessage,
          thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
          mediaType: 1,
          renderLargerThumbnail: false,
          sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
        }
      }
    }, { quoted: m });
  } catch (error) {
    console.error('Error in tagAll command:', error);
    let responseMessage = '*❌ An error occurred while processing the command. Please try again.*';
    if (error.message && error.message.includes('not authorized')) {
      responseMessage = '*❌ Permission denied. Make sure the bot has admin permissions.*';
    } else if (error.message && error.message.includes('mentioned too many people')) {
      responseMessage = '*⚠️ Too many mentions! WhatsApp has limits on how many people can be mentioned at once.*';
    }
    await gss.sendMessage(m.from, {
      text: " ",
      contextInfo: {
        externalAdReply: {
          title: `👋hy ${m.pushName}`,
          body: responseMessage,
          thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
          mediaType: 1,
          renderLargerThumbnail: false,
          sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
        }
      }
    }, { quoted: m });
  }
};

export default tagAll;
