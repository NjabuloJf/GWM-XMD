
import config from '../config.cjs';

const setGroupName = async (m, gss) => {
  try {
    const botNumber = await gss.decodeJid(gss.user.id);
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();
    const validCommands = ['setgroupname', 'setname', 'setgname'];

    if (!validCommands.includes(cmd)) return;
    if (!m.isGroup) {
      let responseMessage = "ONLY BE USED IN GROUPS";
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

    // Check if it's a broadcast list (not a real group)
    if (m.from.endsWith('@broadcast')) {
      let responseMessage = "WORK IN BROADCAST LISTS";
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

    // Get bot and sender participant info
    const botParticipant = participants.find(p => p.id === botNumber);
    const senderParticipant = participants.find(p => p.id === m.sender);

    // Check if bot is admin - using different property names based on WhatsApp version
    const botAdmin = botParticipant?.admin || botParticipant?.isAdmin || botParticipant?.admin !== false;
    // Check if sender is admin
    const senderAdmin = senderParticipant?.admin || senderParticipant?.isAdmin || senderParticipant?.admin !== false;

    if (!botAdmin) {
      let responseMessage = "promote me to admin first!";
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
      let responseMessage = "AN ADMIN TO USE THIS COMMAND";
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

    if (!text) {
      let responseMessage = "Example:* " + prefix + cmd + " My New Group Name";
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

    // Check text length limits (WhatsApp group name limits)
    if (text.length > 100) {
      let responseMessage = "GROUP NAME TOO LONG Maximum 100 characters allowed";
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

    if (text.length < 1) {
      let responseMessage = "GROUP NAME CANNOT BE EMPTY";
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

    // Attempt to change group name with error handling
    await gss.groupUpdateSubject(m.from, text)
      .then(() => {
        let responseMessage = `✅ *Group Name Successfully Updated*\n*New Name:* ${text}`;
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
      .catch(async (error) => {
        console.error('Group update error:', error);
        // Check for specific error messages
        if (error.message?.includes('not admin') || error.message?.includes('permission')) {
          let responseMessage = "*📛 PERMISSION DENIED*\n*Make sure I have 'Edit Group Info' permission enabled*";
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
        // ... other error handling code ...
      });
  } catch (error) {
    console.error('Error in setGroupName:', error);
    let responseMessage = '*❌ AN ERROR OCCURRED*\n*Failed to update group name. Please try again.*';
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

export default setGroupName;
