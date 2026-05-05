import config from '../config.cjs';
import { generateWAMessageFromContent, generateWAMessageContent } from '@whiskeysockets/baileys';

const ownerContact = async (m, Matrix) => {
    const { OWNER_NUMBER: ownerNumber, PREFIX: prefix } = config;
    const body = m.body || '';

    if (!body.startsWith(prefix)) return;

    const cmd = body.slice(prefix.length).split(' ')[0].toLowerCase();

    if (cmd !== 'owner') return;

    try {
        // Send vCard contact
        await Matrix.sendContact(m.from, [ownerNumber], m);

        // Load owner image
        const repoImages = "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg";
        let imageMessage = null;

        try {
            if (Matrix.waUploadToServer && typeof Matrix.waUploadToServer === 'function') {
                const imageContent = await generateWAMessageContent(
                    { image: { url: repoImages } },
                    { upload: Matrix.waUploadToServer }
                );
                imageMessage = imageContent.imageMessage;
            } else {
                console.warn("waUploadToServer not available, sending without image");
            }
        } catch (imageError) {
            console.error("Error generating image content:", imageError.message);
            // Continue without image
        }

        const cards = [
            {
                header: {
                    title: `*ɢᴡᴍ xᴍᴅ ᴏᴡɴᴇʀ*`,
                    hasMediaAttachment: !!imageMessage,
                    ...(imageMessage && { imageMessage }),
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
                                display_text: "💬 ᴄʜᴀᴛ ᴏᴡɴᴇʀ",
                                url: `https://wa.me/${ownerNumber}`,
                                merchant_url: `https://wa.me/${ownerNumber}`
                            }),
                        },
                        {
                            name: "cta_copy",
                            buttonParamsJson: JSON.stringify({
                                display_text: "GWM-XMD OWNER📃",
                                copy_code: `+${ownerNumber}`
                            }),
                        },
                    ],
                },
            },
            {
                header: {
                    title: `*ɢᴡᴍ xᴍᴅ ʟɪɴᴋs*`,
                    hasMediaAttachment: !!imageMessage,
                    ...(imageMessage && { imageMessage }),
                },
                body: {
                    text: `🔗 *ᴜsᴇғᴜʟ ʟɪɴᴋs*\n\n📢 ᴊᴏɪɴ ᴏᴜʀ ᴄʜᴀɴɴᴇʟ\n⭐ sᴜᴘᴘᴏʀᴛ ᴛʜᴇ ʙᴏᴛ`,
                },
                footer: {
                    text: "ᴀssɪsᴛᴀɴᴛ ʙʏ sɪʀ ɴᴊᴀʙᴜʟᴏ-ᴊʙ ᴜɪ",
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "📢 ᴊᴏɪɴ ᴄʜᴀɴɴᴇʟ",
                                url: config.URL_CHANNEL
                            }),
                        },
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "⭐ GitHub Repo",
                                url: `https://github.com/NjabuloJf/Njabulo-Jb`
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
                            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Njabulo-Jb;BOT;;;\nFN:Njabulo-Jb\nitem1.TEL;waid=${ownerNumber}:+${ownerNumber}\nitem1.X-ABLabel:Bot\nEND:VCARD`
                        }
                    }
                }
            }
        );

        const sentMessage = await Matrix.relayMessage(m.from, message.message, { messageId: message.key.id });

        await m.React("✅");

    } catch (error) {
        console.error('Error sending owner contact card:', error);
        await m.reply('Error sending owner contact.');
        await m.React("❌");
    }
};

export default ownerContact;
