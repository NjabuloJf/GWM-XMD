import { serialize } from '../lib/Serializer.js';

const antilinkSettings = {}; // In-memory database to store antilink settings for each chat

export const handleAntilink = async (m, sock, logger, isBotAdmins, isAdmins, isCreator) => {
  try {
    console.log('Handling antilink...');

    if (!m || !m.body || !m.from) {
      console.log('Invalid message object');
      return;
    }

    const PREFIX = /^[\\/!#.]/;
    const isCOMMAND = (body) => PREFIX.test(body);
    const prefixMatch = isCOMMAND(m.body) ? m.body.match(PREFIX) : null;
    const prefix = prefixMatch ? prefixMatch[0] : '/';
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

    if (cmd === 'antilink') {
      try {
        const args = m.body.slice(prefix.length + cmd.length).trim().split(/\s+/);
        const action = args[0] ? args[0].toLowerCase() : '';

        if (!m.isGroup) {
          await sock.sendMessage(m.from, { text: 'This command can only be used in groups.' }, { quoted: m });
          return;
        }

        if (!isAdmins) {
          await sock.sendMessage(m.from, { text: 'Only admins can manage the antilink feature.' }, { quoted: m });
          return;
        }

        if (action === 'on') {
          antilinkSettings[m.from] = true;
          await sock.sendMessage(m.from, { text: 'Antilink feature has been enabled for this chat.' }, { quoted: m });
          return;
        }

        if (action === 'off') {
          antilinkSettings[m.from] = false;
          await sock.sendMessage(m.from, { text: 'Antilink feature has been disabled for this chat.' }, { quoted: m });
          return;
        }

        await sock.sendMessage(m.from, { text: `Usage: ${prefix + cmd} on\n ${prefix + cmd} off` }, { quoted: m });
        return;
      } catch (error) {
        console.error('Error in antilink command:', error);
        await sock.sendMessage(m.from, { text: 'An error occurred while processing your request.' }, { quoted: m });
      }
    }

    if (antilinkSettings[m.from]) {
      try {
        if (m.body.match(/(chat.whatsapp.com\/)/gi)) {
          if (!isBotAdmins) {
            await sock.sendMessage(m.from, { text: `The bot needs to be an admin to remove links.` });
            return;
          }

          if (isAdmins) {
            await sock.sendMessage(m.from, { text: `Admins are allowed to share links.` });
            return;
          }

          let gclink = `https://chat.whatsapp.com/${await sock.groupInviteCode(m.from)}`;
          let isLinkThisGc = new RegExp(gclink, 'i');
          let isgclink = isLinkThisGc.test(m.body);

          if (isgclink) {
            await sock.sendMessage(m.from, { text: `The link you shared is for this group, so you won't be removed.` });
            return;
          }

          // Send warning message first
          await sock.sendMessage(m.from, { text: `\`\`\`「 Group Link Detected 」\`\`\`\n\n@${m.sender.split("@")[0]}, please do not share group links in this group.`, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m });

          // Delete the link message
          await sock.sendMessage(m.from, { delete: { remoteJid: m.from, fromMe: false, id: m.key.id, participant: m.key.participant } });

          // Wait for a short duration before kicking
          setTimeout(async () => {
            try {
              await sock.groupParticipantsUpdate(m.from, [m.sender], 'remove');
            } catch (error) {
              console.error('Error removing user:', error);
              await sock.sendMessage(m.from, { text: 'Failed to remove user.' }, { quoted: m });
            }
          }, 5000); // 5 seconds delay before kick
        }
      } catch (error) {
        console.error('Error in antilink handler:', error);
        await sock.sendMessage(m.from, { text: 'An error occurred while processing your request.' }, { quoted: m });
      }
    }
  } catch (error) {
    console.error('Error in antilink:', error);
  }
};

