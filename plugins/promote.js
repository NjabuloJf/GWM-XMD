
import config from '../config.cjs';

const promote = async (m, gss) => {
  try {
    const botNumber = await gss.decodeJid(gss.user.id);
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();
    const validCommands = ['promote', 'admin', 'toadmin'];

    if (!validCommands.includes(cmd)) return;
    if (!m.isGroup) {
      let responseMessage = "⚠️ this bot or owner use it";
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
      let responseMessage = "❌ only amdim use it";
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
      let responseMessage = "🙏 you must any amdim use it";
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
      let responseMessage = "🏝️ please mention or quote a use to promote";
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
    const usernames = await Promise.all(
      validUsers.map(async (user) => {
        try {
          const contact = await gss.getContact(user);
          return contact.notify || contact.pushname || user.split('@')[0];
        } catch (error) {
          return user.split('@')[0];
        }
      })
    );

    await gss.groupParticipantsUpdate(m.from, validUsers, 'promote')
      .then(() => {
        const promotedNames = usernames.map(username => `@${username}`).join(', ');
        let responseMessage = `*Users ${promotedNames} promoted successfully in the group ${groupMetadata.subject}.*`;
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
        let responseMessage = 'Failed to promote user(s) in the group.';
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

export default promote;
