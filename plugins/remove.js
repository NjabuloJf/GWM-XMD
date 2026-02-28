
import config from '../config.cjs';

const kick = async (m, gss) => {
  try {
    const botNumber = await gss.decodeJid(gss.user.id);
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();
    const validCommands = ['kick', 'remove'];

    if (!validCommands.includes(cmd)) return;
    if (!m.isGroup) {
      let responseMessage = "only be an use group";
      return await gss.sendMessage(m.from, {
        text: " ",
        contextInfo: {
        isForwarded: true,
          forwardedNewsletterMessageInfo: {
          newsletterJid: config.ID_CHANNEL,
          newsletterName: "╭••➤GWM-XMD",
          serverMessageId: 143,
         },
          forwardingScore: 999,
          externalAdReply: {
            title: "I am GWM-XMD for assistant ui",
            body: responseMessage,
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
    }

    const groupMetadata = await gss.groupMetadata(m.from);
    const participants = groupMetadata.participants;
    const botAdmin = participants.find(p => p.id === botNumber)?.admin;
    const senderAdmin = participants.find(p => p.id === m.sender)?.admin;

    if (!botAdmin) {
      let responseMessage = "any amdim use remove";
      return await gss.sendMessage(m.from, {
        text: " ",
        contextInfo: {
        isForwarded: true,
          forwardedNewsletterMessageInfo: {
          newsletterJid: config.ID_CHANNEL,
          newsletterName: "╭••➤GWM-XMD",
          serverMessageId: 143,
         },
          forwardingScore: 999,
          externalAdReply: {
            title: "I am GWM-XMD for assistant ui",
            body: responseMessage,
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
    }

    if (!senderAdmin) {
      let responseMessage = "any amdim use remove";
      return await gss.sendMessage(m.from, {
        text: " ",
        contextInfo: {
        isForwarded: true,
          forwardedNewsletterMessageInfo: {
          newsletterJid: config.ID_CHANNEL,
          newsletterName: "╭••➤GWM-XMD",
          serverMessageId: 143,
         },
          forwardingScore: 999,
          externalAdReply: {
            title: "I am GWM-XMD for assistant ui",
            body: responseMessage,
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
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
      let responseMessage = "MENTION OR QUOTE A USER TO KICK";
      return await gss.sendMessage(m.from, {
        text: " ",
        contextInfo: {
        isForwarded: true,
          forwardedNewsletterMessageInfo: {
          newsletterJid: config.ID_CHANNEL,
          newsletterName: "╭••➤GWM-XMD",
          serverMessageId: 143,
         },
          forwardingScore: 999,
          externalAdReply: {
            title: "I am GWM-XMD for assistant ui",
            body: responseMessage,
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
    }

    const validUsers = users.filter(Boolean);
    await gss.groupParticipantsUpdate(m.from, validUsers, 'remove')
      .then(() => {
        const kickedNames = validUsers.map(user => `@${user.split("@")[0]}`);
        let responseMessage = `*USERS ${kickedNames} KICKED SUCCESSFULLY FROM THE GROUP ${groupMetadata.subject}*`;
        gss.sendMessage(m.from, {
          text: " ",
          contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
          newsletterJid: config.ID_CHANNEL,
          newsletterName: "╭••➤GWM-XMD",
          serverMessageId: 143,
         },
          forwardingScore: 999,
            externalAdReply: {
              title: "I am GWM-XMD for assistant ui",
              body: responseMessage,
              thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
              mediaType: 1,
              renderLargerThumbnail: false,
              sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
            }
          }
        }, { quoted: m });
      })
      .catch(() => {
        let responseMessage = 'Failed to kick user(s) from the group.';
        gss.sendMessage(m.from, {
          text: " ",
          contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
          newsletterJid: config.ID_CHANNEL,
          newsletterName: "╭••➤GWM-XMD",
          serverMessageId: 143,
         },
          forwardingScore: 999,
            externalAdReply: {
              title: "I am GWM-XMD for assistant ui",
              body: responseMessage,
              thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
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
      isForwarded: true,
          forwardedNewsletterMessageInfo: {
          newsletterJid: config.ID_CHANNEL,
          newsletterName: "╭••➤GWM-XMD",
          serverMessageId: 143,
         },
          forwardingScore: 999,
        externalAdReply: {
          title: "I am GWM-XMD for assistant ui",
          body: responseMessage,
          thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
          mediaType: 1,
          renderLargerThumbnail: false,
          sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
        }
      }
    }, { quoted: m });
  }
};

export default kick;
