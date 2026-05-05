import { serialize } from '../lib/Serializer.js';
import config from '../config.js'; // Make sure config is imported

const antilinkSettings = {}; // In-memory database to store antilink settings for each chat

// Reusable styled message sender
const sendStyledMessage = async (sock, jid, responseMessage, quotedMsg) => {
    await sock.sendMessage(jid, {
        text: "  ",
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
            }
        }
    }, { quoted: quotedMsg });
};

export const handleAntilink = async (m, sock, logger, isBotAdmins, isAdmins, isCreator) => {
    const PREFIX = /^[\\/!#.]/;
    const isCOMMAND = (body) => PREFIX.test(body);
    const prefixMatch = isCOMMAND(m.body) ? m.body.match(PREFIX) : null;
    const prefix = prefixMatch ? prefixMatch[0] : '/';
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

    if (cmd === 'antilink') {
        const args = m.body.slice(prefix.length + cmd.length).trim().split(/\s+/);
        const action = args[0] ? args[0].toLowerCase() : '';

        if (!m.isGroup) {
            await sendStyledMessage(sock, m.from, 'This command can only be used in groups.', m);
            return;
        }

        if (!isBotAdmins) {
            await sendStyledMessage(sock, m.from, 'The bot needs to be an admin to manage the antilink feature.', m);
            return;
        }

        if (action === 'on') {
            if (isAdmins) {
                antilinkSettings[m.from] = true;
                await sendStyledMessage(sock, m.from, 'Antilink feature has been enabled for this chat.', m);
            } else {
                await sendStyledMessage(sock, m.from, 'Only admins can enable the antilink feature.', m);
            }
            return;
        }

        if (action === 'off') {
            if (isAdmins) {
                antilinkSettings[m.from] = false;
                await sendStyledMessage(sock, m.from, 'Antilink feature has been disabled for this chat.', m);
            } else {
                await sendStyledMessage(sock, m.from, 'Only admins can disable the antilink feature.', m);
            }
            return;
        }

        await sendStyledMessage(sock, m.from, `Usage: ${prefix + cmd} on\n ${prefix + cmd} off`, m);
        return;
    }

    if (antilinkSettings[m.from]) {
        if (m.body.match(/(chat.whatsapp.com\/)/gi)) {
            if (!isBotAdmins) {
                await sendStyledMessage(sock, m.from, 'The bot needs to be an admin to remove links.', m);
                return;
            }

            let gclink = `https://chat.whatsapp.com/${await sock.groupInviteCode(m.from)}`;
            let isLinkThisGc = new RegExp(gclink, 'i');
            let isgclink = isLinkThisGc.test(m.body);

            if (isgclink) {
                await sendStyledMessage(sock, m.from, "The link you shared is for this group, so you won't be removed.", m);
                return;
            }

            if (isAdmins) {
                await sendStyledMessage(sock, m.from, 'Admins are allowed to share links.', m);
                return;
            }

            if (isCreator) {
                await sendStyledMessage(sock, m.from, 'The owner is allowed to share links.', m);
                return;
            }

            // Send styled warning message
            await sock.sendMessage(m.from, {
                text: "  ",
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
                        body: `「 Group Link Detected 」\n\n@${m.sender.split("@")[0]}, please do not share group links in this group.`,
                        thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
                        mediaType: 1,
                        renderLargerThumbnail: false,
                    },
                    mentionedJid: [m.sender]
                }
            }, { quoted: m });

            // Delete the link message
            await sock.sendMessage(m.from, {
                delete: {
                    remoteJid: m.from,
                    fromMe: false,
                    id: m.key.id,
                    participant: m.key.participant
                }
            });

            // Wait before kicking
            setTimeout(async () => {
                await sock.groupParticipantsUpdate(m.from, [m.sender], 'remove');
            }, 5000);
        }
    }
};
