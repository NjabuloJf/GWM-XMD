import config from '../config.cjs';
import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';

const ownerContact = async (m, Matrix) => {
    const { OWNER_NUMBER: ownerNumber, PREFIX: prefix } = config;
    const body = m.body || '';

    if (!body.startsWith(prefix)) return;

    const cmd = body.slice(prefix.length).split(' ')[0].toLowerCase();

    if (cmd !== 'owner') return;

    try {
        const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:Njabulo-Jb;BOT;;;\nFN:Njabulo-Jb\nitem1.TEL;waid=${ownerNumber}:+${ownerNumber}\nitem1.X-ABLabel:Bot\nEND:VCARD`;

        const cards = [
            {
                header: {
                    title: `*ɢᴡᴍ xᴍᴅ ᴏᴡɴᴇʀ*`,
                    hasMediaAttachment: false,
                },
                body: {
                    text: `👑 *ᴏᴡɴᴇʀ ɪɴғᴏ*\n\n📛 ɴᴀᴍᴇ: ɳʝαႦυʅσ ʝႦ\n📞 ɴᴜᴍʙᴇʀ: +${ownerNumber}\n\n_ᴄᴏɴᴛᴀᴄᴛ ᴛʜᴇ ᴏᴡɴᴇʀ ᴜsɪɴɢ ᴛʜᴇ ʙᴜᴛᴛᴏɴs ʙᴇʟᴏᴡ_`,
                },
                footer: {
                    text: "ᴀssɪsᴛᴀɴᴛ ʙʏ sɪʀ ɴᴊᴀʙᴜʟᴏ-ᴊʙ ᴜɪ",
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "💬 Chat Owner",
                                url: `https://wa.me/${ownerNumber}`,
                                merchant_url: `https://wa.me/${ownerNumber}`
                            }),
                        },
                        {
                            name: "cta_copy",
                            buttonParamsJson: JSON.stringify({
                                display_text: "📋 Copy Number",
                                copy_code: `+${ownerNumber}`
                            }),
                        },
                        {
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "📞 Get vCard",
                                id: `${prefix}vcard`
                            }),
                        },
                    ],
                },
            },
        ];

        const message = generateWAMessageFromContent(
            m.from,
            {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2,
                        },
                        interactiveMessage: {
                            header: {
                                title: `👑 GWM-XMD Owner`,
                                subtitle: `by Njabulo-Jb`
                            },
                            body: {
                                text: `📋 ᴏᴡɴᴇʀ ᴄᴏɴᴛᴀᴄᴛ ɪɴғᴏ`
                            },
                            footer: {
                                text: ` `
                            },
                            headerType: 1,
                            carouselMessage: { cards },
                        },
                    },
                },
            },
            {
                quoted: {
                    key: {
                        fromMe: false,
                        participant: `0@s.whatsapp.net`,
                        remoteJid: "status@broadcast"
                    },
                    message: {
                        contactMessage: {
                            displayName: "ɳʝαႦυʅσ ʝႦ",
                            vcard: vcard
                        }
                    }
                }
            }
        );

        await Matrix.relayMessage(m.from, message.message, { messageId: message.key.id });

        const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
        const randomEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
        await m.React(randomEmoji);

    } catch (error) {
        console.error('Error sending owner contact card:', error);
        await m.reply('Error sending owner contact.');
        await m.React("❌");
    }
};

export default ownerContact;
