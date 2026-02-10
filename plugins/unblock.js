
import config from '../config.cjs';

const unblock = async (m, gss) => {
  try {
    const botNumber = await gss.decodeJid(gss.user.id);
    const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();
    const validCommands = ['unblock'];

    if (!validCommands.includes(cmd)) return;
    if (!isCreator) return m.reply("*📛 THIS IS AN OWNER COMMAND*");

    let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

    await gss.updateBlockStatus(users, 'unblock')
      .then((res) => {
        m.reply({
          text: " ",
          contextInfo: {
            externalAdReply: {
              title: `👋hy ${m.pushName}`,
              body: `Unblocked ${users.split('@')[0]} successfully.`,
              thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
              mediaType: 1,
              renderLargerThumbnail: false,
              sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
            }
          }
        });
      })
      .catch((err) => {
        m.reply({
          text: " ",
          contextInfo: {
            externalAdReply: {
              title: `👋hy ${m.pushName}`,
              body: `Failed to unblock user: ${err}`,
              thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
              mediaType: 1,
              renderLargerThumbnail: false,
              sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
            }
          }
        });
      });
  } catch (error) {
    console.error('Error:', error);
    m.reply({
      text: ' ',
      contextInfo: {
        externalAdReply: {
          title: `👋hy ${m.pushName}`,
          body: 'An error occurred while processing the command.',
          thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
          mediaType: 1,
          renderLargerThumbnail: false,
          sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
        }
      }
    });
  }
};

export default unblock;
