
import config from '../config.cjs';

const demote = async (m, gss) => {
  try {
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();
    const validCommands = ['demote', 'unadmin'];

    if (!validCommands.includes(cmd)) return;
    if (!m.isGroup) {
      let responseMessage = "*📛 THIS COMMAND CAN ONLY BE USED IN GROUPS*";
      return await gss.sendMessage(m.from, {
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

    const groupMetadata = await gss.groupMetadata(m.from);
    const participants = groupMetadata.participants;
    const botNumber = await gss.decodeJid(gss.user.id);
    const botAdmin = participants.find(p => p.id === botNumber)?.admin;
    const senderAdmin = participants.find(p => p.id === m.sender)?.admin;

    if (!botAdmin) {
      let responseMessage = "*📛 BOT MUST BE AN ADMIN TO USE THIS COMMAND*";
      return await gss.sendMessage(m.from, {
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

    if (!senderAdmin) {
      let responseMessage = "*📛 YOU MUST BE AN ADMIN TO USE THIS COMMAND*";
      return await gss.sendMessage(m.from, {
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

    if (!m.mentionedJid) m.mentionedJid = [];
    if (m.quoted?.participant) m.mentionedJid.push(m.quoted.participant);
    const users = m.mentionedJid.length > 0 ? m.mentionedJid : text.replace(/[^0-9]/g, '').length > 0 ? [text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'] : [];

    if (users.length === 0) {
      let responseMessage = "*📛 PLEASE MENTION OR QUOTE A USER TO DEMOTE*";
      return await gss.sendMessage(m.from, {
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

    const validUsers = users.filter(Boolean);
    await gss.groupParticipantsUpdate(m.from, validUsers, 'demote')
      .then(() => {
        const demotedNames = validUsers.map(user => `@${user.split("@")[0]}`);
        let responseMessage = `*USERS ${demotedNames} DEMOTED SUCCESSFULLY IN THE GROUP ${groupMetadata.subject}*`;
        gss.sendMessage(m.from, {
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
      })
      .catch(() => {
        let responseMessage = 'Failed to demote user(s) in the group.';
        gss.sendMessage(m.from, {
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
      });
  } catch (error) {
    console.error('Error:', error);
    let responseMessage = 'An error occurred while processing the command.';
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

export default demote;
