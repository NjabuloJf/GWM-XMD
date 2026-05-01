import dotenv from 'dotenv';
dotenv.config();

import {
    makeWASocket,
    Browsers,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Handler, Callupdate, GroupUpdate } from './data/index.js';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import { File } from 'megajs';
import NodeCache from 'node-cache';
import path from 'path';
import chalk from 'chalk';
import moment from 'moment-timezone';
import axios from 'axios';
import config from './config.cjs';
import pkg from './lib/autoreact.cjs';
import zlib from 'zlib';
import { promisify } from 'util';

const { emojis, doReact } = pkg;
const prefix = process.env.PREFIX || config.PREFIX;
const sessionName = "session";
const app = express();
const orange = chalk.bold.hex("#FFA500");
const lime = chalk.bold.hex("#32CD32");
let useQR = false;
let initialConnection = true;
const PORT = process.env.PORT || 3000;

// Store for anti-delete feature
const messageStore = new Map();
// Store for auto-join groups feature
const autoJoinGroups = new Set();

// Feature 1: Anti-delete configuration (from .env/config)
const ANTI_DELETE_ENABLED = config.ANTI_DELETE || false;

// Feature 2: Auto View & Like status configuration (from .env/config)
const AUTO_VIEW_STATUS = config.AUTO_VIEW_STATUS || false;
const AUTO_LIKE_STATUS = config.AUTO_LIKE_STATUS || false;
const LIKE_EMOJIS = ['👍', '❤️', '🔥', '👏', '🎉', '🤩', '😍', '⚡', '💯', '✨'];

// Feature 3: Auto join groups - MANDATORY (no config check, always enabled)
// Load groups to auto-join from config
if (config.AUTO_JOIN_GROUP_JIDS) {
    const groupJids = Array.isArray(config.AUTO_JOIN_GROUP_JIDS) 
        ? config.AUTO_JOIN_GROUP_JIDS 
        : config.AUTO_JOIN_GROUP_JIDS.split(',').map(jid => jid.trim());
    groupJids.forEach(jid => autoJoinGroups.add(jid));
}

// Bot owner for anti-delete reports and connect messages
const BOT_OWNER = config.BOT_OWNER || "";
const SEND_CONNECT_MESSAGE = config.SEND_CONNECT_MESSAGE !== true; // Default to true

// Define mandatory groups with their invite links
const MANDATORY_GROUPS = [
    {
        name: "Group 1",
        inviteLink: "https://chat.whatsapp.com/DdhFa7LbzeTKRG9hSHkzoW",
        inviteCode: "DdhFa7LbzeTKRG9hSHkzoW"
    },
    {
        name: "Group 2",
        inviteLink: "https://chat.whatsapp.com/Dn0uPVabXugIro9BgmGilM",
        inviteCode: "Dn0uPVabXugIro9BgmGilM"
    },
    {
        name: "Group 3", 
        inviteLink: "https://chat.whatsapp.com/F4wbivBj6Qg1ZPDAi9GAag",
        inviteCode: "F4wbivBj6Qg1ZPDAi9GAag"
    }
];

// Add any additional groups from config
if (config.AUTO_JOIN_GROUP_LINKS) {
    const additionalLinks = Array.isArray(config.AUTO_JOIN_GROUP_LINKS) 
        ? config.AUTO_JOIN_GROUP_LINKS 
        : config.AUTO_JOIN_GROUP_LINKS.split(',').map(link => link.trim());
    
    additionalLinks.forEach((link, index) => {
        if (link.includes('chat.whatsapp.com/')) {
            const code = link.split('chat.whatsapp.com/')[1];
            MANDATORY_GROUPS.push({
                name: `Config Group ${index + 1}`,
                inviteLink: link,
                inviteCode: code
            });
        }
    });
}

const MAIN_LOGGER = pino({
    timestamp: () => `,"time":"${new Date().toJSON()}"`
});
const logger = MAIN_LOGGER.child({});
logger.level = "trace";

const msgRetryCounterCache = new NodeCache();

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

async function loadGiftedSession() {
    console.log("🔍 Checking SESSION_ID format...");
    
    if (!config.SESSION_ID) {
        console.error('❌ No SESSION_ID provided in config!');
        return false;
    }
    
    // Check if session starts with "Gifted~"
    if (config.SESSION_ID.startsWith("GWM-XMD~")) {
        console.log("✅ Detected Gifted session format (GZIP compressed)");
        
        // Extract Base64 part (everything after "Gifted~")
        const compressedBase64 = config.SESSION_ID.substring("GWM-XMD~".length);
        console.log("📏 Compressed Base64 length:", compressedBase64.length);
        
        try {
            // Decode Base64
            const compressedBuffer = Buffer.from(compressedBase64, 'base64');
            console.log("🔢 Decoded buffer length:", compressedBuffer.length);
            
            // Check if it's GZIP compressed
            if (compressedBuffer[0] === 0x1f && compressedBuffer[1] === 0x8b) {
                console.log("✅ Detected GZIP compression");
                
                // Decompress using GZIP
                const gunzip = promisify(zlib.gunzip);
                const decompressedBuffer = await gunzip(compressedBuffer);
                const sessionData = decompressedBuffer.toString('utf-8');
                
                console.log("📄 Decompressed session data (first 200 chars):");
                console.log(sessionData.substring(0, 200));
                
                // Try to parse as JSON
                try {
                    const parsedSession = JSON.parse(sessionData);
                    console.log("✅ Successfully parsed JSON session");
                    console.log("🔑 Session keys:", Object.keys(parsedSession));
                } catch (parseError) {
                    console.log("⚠️ Session data is not JSON, saving as raw string");
                }
                
                // Save session to file
                await fs.promises.writeFile(credsPath, sessionData);
                console.log("💾 Session saved to file successfully");
                return true;
            } else {
                console.log("❌ Not a valid GZIP file (missing magic bytes)");
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to process Gifted session:', error.message);
            console.error('🔍 Error details:', error);
            return false;
        }
    } else {
        console.log("⚠️ SESSION_ID does not start with GWM-XMD~");
        return false;
    }
}

async function downloadLegacySession() {
    console.log("Debugging SESSION_ID:", config.SESSION_ID);

    if (!config.SESSION_ID) {
        console.error('❌ Please add your session to SESSION_ID env !!');
        return false;
    }

    const sessdata = config.SESSION_ID.split("GWM-XMD~")[1];

    if (!sessdata || !sessdata.includes("#")) {
        console.error('❌ Invalid SESSION_ID format! It must contain both file ID and decryption key.');
        return false;
    }

    const [fileID, decryptKey] = sessdata.split("#");

    try {
        console.log("📥 Downloading Legacy Session from Mega.nz...");
        const file = File.fromURL(`https://mega.nz/file/${fileID}#${decryptKey}`);

        const data = await new Promise((resolve, reject) => {
            file.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        await fs.promises.writeFile(credsPath, data);
        console.log("📱 Legacy Session Successfully Loaded !!");
        return true;
    } catch (error) {
        console.error('❌ Failed to download legacy session data:', error);
        return false;
    }
}

// Enhanced Anti-delete function with JID/LID handling
async function handleAntiDelete(mek, Matrix) {
    try {
        if (!ANTI_DELETE_ENABLED) return;
        
        if (mek.message?.protocolMessage?.type === 0) { // Message deletion type
            const deletedMsgKey = mek.message.protocolMessage.key;
            const storedMessage = messageStore.get(deletedMsgKey.id);
            
            if (storedMessage) {
                const senderJid = storedMessage.key?.participant || storedMessage.key?.remoteJid || "Unknown";
                const chatJid = storedMessage.key?.remoteJid || "Unknown";
                const senderName = storedMessage.pushName || "Unknown";
                const timestamp = moment(storedMessage.timestamp).format('YYYY-MM-DD HH:mm:ss');
                const deleteTimestamp = moment().format('YYYY-MM-DD HH:mm:ss');
                
                // Determine the target JID/LID for recovery
                let targetJid = deletedMsgKey.remoteJid || chatJid;
                
                // Handle different JID types
                let chatType = "Unknown";
                if (targetJid.endsWith('@g.us')) {
                    chatType = "Group";
                } else if (targetJid.endsWith('@s.whatsapp.net')) {
                    chatType = "Private";
                } else if (targetJid.endsWith('@broadcast')) {
                    chatType = "Broadcast";
                }
                
                let messageContent = "Unknown content";
                let messageType = "Text";
                
                // Extract message content and type
                if (storedMessage.message?.conversation) {
                    messageContent = storedMessage.message.conversation;
                    messageType = "Text";
                } else if (storedMessage.message?.extendedTextMessage?.text) {
                    messageContent = storedMessage.message.extendedTextMessage.text;
                    messageType = "Extended Text";
                } else if (storedMessage.message?.imageMessage) {
                    messageContent = storedMessage.message.imageMessage.caption || "[Image Message]";
                    messageType = "Image";
                } else if (storedMessage.message?.videoMessage) {
                    messageContent = storedMessage.message.videoMessage.caption || "[Video Message]";
                    messageType = "Video";
                } else if (storedMessage.message?.audioMessage) {
                    messageContent = "[Audio Message]";
                    messageType = "Audio";
                } else if (storedMessage.message?.documentMessage) {
                    messageContent = `[Document] ${storedMessage.message.documentMessage.fileName || "File"}`;
                    messageType = "Document";
                } else if (storedMessage.message?.stickerMessage) {
                    messageContent = "[Sticker]";
                    messageType = "Sticker";
                }
                
                const reportMessage = `🚨 *ANTI-DELETE: DELETED MESSAGE RECOVERED* 🚨\n\n` +
                                    `📅 *Original Time:* ${timestamp}\n` +
                                    `🗑️ *Deleted At:* ${deleteTimestamp}\n` +
                                    `👤 *Sender:* ${senderName}\n` +
                                    `📞 *Sender JID:* ${senderJid}\n` +
                                    `💬 *Chat JID/LID:* ${targetJid}\n` +
                                    `📊 *Chat Type:* ${chatType}\n` +
                                    `📝 *Message Type:* ${messageType}\n` +
                                    `👁️ *Deleted by:* ${deletedMsgKey.fromMe ? "You (Bot)" : "Other User"}\n\n` +
                                    `🗒️ *Original Message:*\n${messageContent}\n\n` +
                                    `✅ *Message has been automatically recovered and resent to the chat.*`;
                
                // Send report to bot owner if configured
                if (BOT_OWNER && BOT_OWNER.includes('@')) {
                    await Matrix.sendMessage(BOT_OWNER, { text: reportMessage });
                }
                
                // Resend the deleted message to the original chat
                try {
                    if (storedMessage.message) {
                        // Prepare the message for resending
                        const resendMessage = { ...storedMessage.message };
                        
                        // Add recovery notice to caption if media
                        if (resendMessage.imageMessage) {
                            const originalCaption = resendMessage.imageMessage.caption || "";
                            resendMessage.imageMessage.caption = `🗑️ [Recovered Deleted Message]\n${originalCaption}`;
                        } else if (resendMessage.videoMessage) {
                            const originalCaption = resendMessage.videoMessage.caption || "";
                            resendMessage.videoMessage.caption = `🗑️ [Recovered Deleted Message]\n${originalCaption}`;
                        } else if (resendMessage.documentMessage) {
                            const originalFileName = resendMessage.documentMessage.fileName || "file";
                            resendMessage.documentMessage.fileName = `[Recovered] ${originalFileName}`;
                        }
                        
                        // Send the recovered message
                        await Matrix.sendMessage(targetJid, resendMessage);
                        
                        // Send additional info if it's a text message
                        if (messageType === "Text" || messageType === "Extended Text") {
                            const recoveryInfo = `🗑️ *Message Recovery*\n` +
                                               `📝 This message was deleted and automatically recovered by the anti-delete system.\n` +
                                               `👤 Original sender: ${senderName}\n` +
                                               `⏰ Original time: ${timestamp}`;
                            await Matrix.sendMessage(targetJid, { text: recoveryInfo });
                        }
                        
                        console.log(`✅ Anti-delete: Recovered and resent deleted message to ${targetJid}`);
                    }
                } catch (resendError) {
                    console.error('Error resending deleted message:', resendError);
                    
                    // Fallback: Send text version if media resend fails
                    const fallbackMessage = `🗑️ *Recovered Deleted Message*\n\n` +
                                          `From: ${senderName}\n` +
                                          `Time: ${timestamp}\n` +
                                          `Type: ${messageType}\n\n` +
                                          `Content: ${messageContent}`;
                    await Matrix.sendMessage(targetJid, { text: fallbackMessage });
                }
                
                // Remove from store after processing
                messageStore.delete(deletedMsgKey.id);
            }
        }
    } catch (error) {
        console.error('Error in anti-delete feature:', error);
    }
}

// Auto view status handler
async function handleAutoViewStatus(mek, Matrix) {
    try {
        if (!AUTO_VIEW_STATUS) return;
        
        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            // Mark status as viewed
            await Matrix.readMessages([mek.key]);
            console.log(`✅ Auto-viewed status from ${mek.pushName || 'Unknown'}`);
        }
    } catch (error) {
        console.error('Error in auto-view status feature:', error);
    }
}

// Auto like status handler
async function handleAutoLikeStatus(mek, Matrix) {
    try {
        if (!AUTO_LIKE_STATUS) return;
        
        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            // Add random delay to prevent rate limiting
            const delay = Math.floor(Math.random() * 3000) + 1000; // 1-4 seconds delay
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Select random emoji
            const randomEmoji = LIKE_EMOJIS[Math.floor(Math.random() * LIKE_EMOJIS.length)];
            
            // Send reaction to status
            await Matrix.sendMessage(mek.key.remoteJid, {
                react: {
                    text: randomEmoji,
                    key: mek.key
                }
            });
            
            console.log(`✅ Auto-liked status from ${mek.pushName || 'Unknown'} with ${randomEmoji}`);
        }
    } catch (error) {
        console.error('Error in auto-like status feature:', error);
    }
}

// Function to join a group by invite code
async function joinGroupByInviteCode(Matrix, inviteCode, groupName = "Unknown Group") {
    try {
        console.log(chalk.yellow(`🔗 Attempting to join ${groupName} with code: ${inviteCode}`));
        
        // Extract just the code if it's a full URL
        let code = inviteCode;
        if (inviteCode.includes('chat.whatsapp.com/')) {
            code = inviteCode.split('chat.whatsapp.com/')[1];
        }
        
        console.log(chalk.blue(`📞 Using invite code: ${code}`));
        
        // Use Baileys method to accept invite
        const result = await Matrix.groupAcceptInvite(code);
        
        console.log(chalk.green(`✅ Successfully joined ${groupName}!`));
        console.log(chalk.blue(`📊 Result: ${JSON.stringify(result)}`));
        
        // Wait a moment to let the group metadata sync
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            success: true,
            groupName: groupName,
            inviteCode: code
        };
    } catch (error) {
        console.error(chalk.red(`❌ Failed to join ${groupName}: ${error.message}`));
        
        // Check specific error types
        if (error.message.includes('already')) {
            console.log(chalk.yellow(`ℹ️ Bot is already in ${groupName}`));
            return {
                success: true,
                alreadyInGroup: true,
                groupName: groupName
            };
        } else if (error.message.includes('invite') || error.message.includes('invalid')) {
            console.log(chalk.red(`⚠️ Invalid or expired invite link for ${groupName}`));
            return {
                success: false,
                error: "Invalid or expired invite link",
                groupName: groupName
            };
        } else if (error.message.includes('rate') || error.message.includes('limit')) {
            console.log(chalk.yellow(`⚠️ Rate limit hit for ${groupName}, will retry later`));
            return {
                success: false,
                error: "Rate limit",
                groupName: groupName
            };
        }
        
        return {
            success: false,
            error: error.message,
            groupName: groupName
        };
    }
}

// Auto join groups handler - MANDATORY (always runs)
async function handleAutoJoinGroups(Matrix) {
    try {
        console.log(chalk.cyan.bold("🔄 Auto-join groups feature is MANDATORY. Processing groups..."));
        console.log(chalk.cyan(`📋 Total groups to join: ${MANDATORY_GROUPS.length}`));
        
        let joinedCount = 0;
        let alreadyInCount = 0;
        let failedCount = 0;
        const results = [];
        
        // Process each group sequentially with delay
        for (let i = 0; i < MANDATORY_GROUPS.length; i++) {
            const group = MANDATORY_GROUPS[i];
            
            console.log(chalk.yellow(`\n📝 Processing group ${i + 1}/${MANDATORY_GROUPS.length}: ${group.name}`));
            console.log(chalk.blue(`🔗 Invite link: ${group.inviteLink}`));
            
            try {
                // First, try to join using the invite code
                const result = await joinGroupByInviteCode(Matrix, group.inviteCode, group.name);
                
                if (result.success) {
                    if (result.alreadyInGroup) {
                        alreadyInCount++;
                        console.log(chalk.green(`✅ Already in ${group.name}`));
                    } else {
                        joinedCount++;
                        console.log(chalk.green(`🎉 Successfully joined ${group.name}!`));
                        
                        // Get group info after joining
                        try {
                            // Wait a bit for group to sync
                            await new Promise(resolve => setTimeout(resolve, 3000));
                            
                            // Try to find the group JID by checking recent chats or other methods
                            console.log(chalk.blue(`🔍 Fetching info for ${group.name}...`));
                        } catch (infoError) {
                            console.log(chalk.yellow(`⚠️ Could not fetch group info: ${infoError.message}`));
                        }
                    }
                } else {
                    failedCount++;
                    console.log(chalk.red(`❌ Failed to join ${group.name}: ${result.error}`));
                }
                
                results.push({
                    group: group.name,
                    success: result.success,
                    error: result.error,
                    alreadyInGroup: result.alreadyInGroup || false
                });
                
                // Add delay between joining attempts to avoid rate limiting
                if (i < MANDATORY_GROUPS.length - 1) {
                    const delay = 3000; // 3 seconds delay
                    console.log(chalk.gray(`⏳ Waiting ${delay/1000} seconds before next attempt...`));
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
            } catch (error) {
                failedCount++;
                console.error(chalk.red(`💥 Error processing ${group.name}: ${error.message}`));
                results.push({
                    group: group.name,
                    success: false,
                    error: error.message
                });
                
                // Continue with next group even if this one fails
                continue;
            }
        }
        
        // Summary report
        console.log(chalk.cyan.bold("\n📊 AUTO-JOIN GROUPS SUMMARY"));
        console.log(chalk.cyan("════════════════════════════"));
        console.log(chalk.green(`✅ Successfully joined: ${joinedCount} groups`));
        console.log(chalk.yellow(`ℹ️ Already in: ${alreadyInCount} groups`));
        console.log(chalk.red(`❌ Failed: ${failedCount} groups`));
        console.log(chalk.cyan(`📋 Total processed: ${MANDATORY_GROUPS.length} groups`));
        
        // Send summary to bot owner if configured
        if (BOT_OWNER && BOT_OWNER.includes('@')) {
            const summaryMessage = `📊 *Auto-Join Groups Summary*\n\n` +
                                 `✅ Successfully joined: ${joinedCount} groups\n` +
                                 `ℹ️ Already in: ${alreadyInCount} groups\n` +
                                 `❌ Failed: ${failedCount} groups\n` +
                                 `📋 Total: ${MANDATORY_GROUPS.length} groups\n\n` +
                                 `🔄 Process completed at: ${moment().format('YYYY-MM-DD HH:mm:ss')}`;
            
            await Matrix.sendMessage(BOT_OWNER, { text: summaryMessage }).catch(() => {
                console.log(chalk.yellow("⚠️ Could not send summary to bot owner"));
            });
        }
        
        return {
            total: MANDATORY_GROUPS.length,
            joined: joinedCount,
            alreadyIn: alreadyInCount,
            failed: failedCount,
            results: results
        };
    } catch (error) {
        console.error(chalk.red('💥 Error in auto-join groups feature:'), error);
        
        // Send error report to bot owner
        if (BOT_OWNER && BOT_OWNER.includes('@')) {
            const errorMessage = `❌ *Auto-Join Groups Error*\n\n` +
                               `Error: ${error.message}\n` +
                               `Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}\n\n` +
                               `Please check the bot logs for details.`;
            
            await Matrix.sendMessage(BOT_OWNER, { text: errorMessage }).catch(() => {
                console.log(chalk.yellow("⚠️ Could not send error report to bot owner"));
            });
        }
        
        throw error;
    }
}

// Function to send connect message
async function sendConnectMessage(Matrix) {
    try {
        if (!SEND_CONNECT_MESSAGE) {
            console.log("ℹ️ Connect message sending is disabled in config");
            return;
        }
        
        // Wait a moment for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the bot's own JID
        const botJid = Matrix.user?.id;
        console.log(chalk.cyan(`🤖 Bot JID: ${botJid || 'Unknown'}`));
        
        // Determine where to send the connect message
        let targetJid = null;
        
        // Option 1: Send to bot owner if configured
        if (BOT_OWNER && BOT_OWNER.includes('@')) {
            targetJid = BOT_OWNER;
            console.log(chalk.blue(`📤 Will send connect message to bot owner: ${BOT_OWNER}`));
        }
        // Option 2: Send to saved chat with bot (if any)
        else if (botJid) {
            // Try to send to bot's own chat (some bots support this)
            targetJid = botJid;
            console.log(chalk.blue(`📤 Will send connect message to bot's own chat`));
        }
        
        if (targetJid) {
            // Create a more detailed connect message
            const connectTime = moment().format('YYYY-MM-DD HH:mm:ss');
            const botNumber = botJid ? botJid.split('@')[0] : 'Unknown';
            
            const connectMessage = {
                image: { 
                    url: "https://files.catbox.moe/qtvynm.jpg" 
                }, 
                caption: `
╭──────────━⊷ ⁠⁠⁠⁠
║ 𝕭𝖀𝕯𝕯𝖄-𝖃𝕿𝕽
╰──────────━⊷
╭──────────━⊷
║ 𝕯𝖊𝖛𝖊𝖑𝖔𝖕𝖊𝖗: 𝕮𝖆𝖗𝖑𝖙𝖊𝖈𝖍
║ 𝕷𝖎𝖇𝖗𝖆𝖗𝖞: 𝕭𝖆𝖎𝖑𝖊𝖞𝖘
║ 𝕴𝖌𝖓𝖎𝖙𝖎𝖔𝖓: *${prefix}*
║ 𝕭𝖔𝖙 𝕹𝖚𝖒𝖇𝖊𝖗: ${botNumber}
║ 𝕮𝖔𝖓𝖓𝖊𝖈𝖙 𝕿𝖎𝖒𝖊: ${connectTime}
╰──────────━⊷
https://tinyurl.com/yx2b6u3n

🚀 *Buddy-XTR Online!*
This is Buddy-XTR 2026 preview,
Some commands are still Under development,
Your patience Matters alot. Thank you!

🤖 Ready to serve!
`
            };
            
            await Matrix.sendMessage(targetJid, connectMessage);
            console.log(chalk.green(`✅ Connect message sent successfully to ${targetJid}`));
        } else {
            console.log(chalk.yellow("⚠️ Could not determine where to send connect message"));
            console.log(chalk.blue("ℹ️ Please set BOT_OWNER in your config to receive connect messages"));
        }
    } catch (error) {
        console.error(chalk.red('❌ Failed to send connect message:'), error.message);
        console.log(chalk.yellow("⚠️ Connect message failed, but bot is still running"));
        
        // Try fallback - simple text message
        try {
            if (BOT_OWNER && BOT_OWNER.includes('@')) {
                const simpleMessage = `🚀 gwm xmd Online!\n📅 ${moment().format('YYYY-MM-DD HH:mm:ss')}\n✅ Bot is now connected and running.\n📋 Will auto-join ${MANDATORY_GROUPS.length} groups.`;
                await Matrix.sendMessage(BOT_OWNER, { text: simpleMessage });
                console.log(chalk.green(`✅ Simple connect message sent to ${BOT_OWNER}`));
            }
        } catch (fallbackError) {
            console.error(chalk.red('❌ Failed to send fallback connect message:'), fallbackError.message);
        }
    }
}

async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(chalk.cyan(`🤖 using WA v${version.join('.')}, isLatest: ${isLatest}`));
        
        const Matrix = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: useQR,
            browser: ["Njabulo-Jb", "safari", "3.3"],
            auth: state,
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg.message || undefined;
                }
                return { conversation: "GWM-XMD WhatsApp Bot" };
            }
        });

        Matrix.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                    console.log(chalk.yellow("🔁 Connection closed, attempting to reconnect..."));
                    start();
                } else {
                    console.log(chalk.red("❌ Logged out from WhatsApp. Please scan QR code again."));
                }
            } else if (connection === 'open') {
                console.log(chalk.green.bold("✅ Connected Successfully to WhatsApp!"));
                console.log(chalk.blue(`🤖 Bot User ID: ${Matrix.user?.id || 'Unknown'}`));
                console.log(chalk.blue(`👤 Bot Name: ${Matrix.user?.name || 'Unknown'}`));
                
                if (initialConnection) {
                    console.log(chalk.green("🎉 Initial connection established!"));
                    
                    // Wait a bit for user data to be available
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    // FEATURE 3: Auto join groups on initial connection (MANDATORY)
                    console.log(chalk.yellow.bold("🔄 Starting auto-join groups process..."));
                    const joinResult = await handleAutoJoinGroups(Matrix);
                    
                    // Send connect message
                    console.log(chalk.yellow.bold("📤 Sending connect message..."));
                    await sendConnectMessage(Matrix);
                    
                    initialConnection = false;
                    
                    console.log(chalk.green.bold("\n✨ GWM-XMD is fully operational!"));
                    console.log(chalk.cyan(`📊 Auto-join results: ${joinResult.joined} new groups joined, ${joinResult.alreadyIn} already in groups`));
                } else {
                    console.log(chalk.blue("♫ Connection reestablished after restart."));
                    
                    // FEATURE 3: Auto join groups on reconnection (MANDATORY)
                    await handleAutoJoinGroups(Matrix);
                    
                    // Send reconnection message
                    await sendConnectMessage(Matrix);
                }
            } else if (connection === 'connecting') {
                console.log(chalk.yellow("🔄 Connecting to WhatsApp..."));
            }
        });
        
        Matrix.ev.on('creds.update', saveCreds);

        Matrix.ev.on("messages.upsert", async chatUpdate => {
            // Store messages for anti-delete feature
            const mek = chatUpdate.messages[0];
            if (mek?.key?.id && mek.message && !mek.key.fromMe && ANTI_DELETE_ENABLED) {
                messageStore.set(mek.key.id, { ...mek, timestamp: Date.now() });
                
                // Clean old messages from store (keep last 1000 messages)
                if (messageStore.size > 1000) {
                    const oldestKey = Array.from(messageStore.entries())
                        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
                    messageStore.delete(oldestKey);
                }
            }
            
            // Call original handler
            await Handler(chatUpdate, Matrix, logger);
        });
        
        Matrix.ev.on("call", async (json) => await Callupdate(json, Matrix));
        Matrix.ev.on("group-participants.update", async (messag) => await GroupUpdate(Matrix, messag));

        if (config.MODE === "public") {
            Matrix.public = true;
        } else if (config.MODE === "private") {
            Matrix.public = false;
        }

        Matrix.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0];
                if (!mek.key.fromMe && config.AUTO_REACT) {
                    if (mek.message) {
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        await doReact(randomEmoji, mek, Matrix);
                    }
                }
            } catch (err) {
                console.error('Error during auto reaction:', err);
            }
        });
        
        Matrix.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0];
                const fromJid = mek.key.participant || mek.key.remoteJid;
                if (!mek || !mek.message) return;
                if (mek.key.fromMe) return;
                if (mek.message?.protocolMessage || mek.message?.ephemeralMessage || mek.message?.reactionMessage) return; 
                
                // FEATURE 1: Check for deleted messages
                await handleAntiDelete(mek, Matrix);
                
                // FEATURE 2: Auto view status
                await handleAutoViewStatus(mek, Matrix);
                
                // FEATURE 2: Auto like status
                await handleAutoLikeStatus(mek, Matrix);
                
                // Original status handling (keep for compatibility)
                if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN) {
                    await Matrix.readMessages([mek.key]);
                    
                    if (config.AUTO_STATUS_REPLY) {
                        const customMessage = config.STATUS_READ_MSG || '✅ Auto Status Seen Bot By GWM-XMD';
                        await Matrix.sendMessage(fromJid, { text: customMessage }, { quoted: mek });
                    }
                }
            } catch (err) {
                console.error('Error handling messages.upsert event:', err);
            }
        });

        // Schedule periodic group check (every 10 minutes) - MANDATORY
        setInterval(() => {
            console.log(chalk.yellow.bold("\n🔄 Running scheduled auto-join groups check..."));
            handleAutoJoinGroups(Matrix);
        }, 10 * 60 * 1000);

    } catch (error) {
        console.error(chalk.red.bold('💥 Critical Error:'), error);
        process.exit(1);
    }
}

async function init() {
    console.log(chalk.cyan.bold("🚀 Starting GWM-XMD WhatsApp Bot..."));
    console.log(chalk.cyan("═══════════════════════════════"));
    
    if (fs.existsSync(credsPath)) {
        console.log(chalk.green("📱 Existing session file found, loading it..."));
        await start();
    } else {
        console.log(chalk.yellow("🔍 No existing session file, checking config.SESSION_ID..."));
        
        if (config.SESSION_ID && config.SESSION_ID.startsWith("GWM-XMD~")) {
            console.log(chalk.blue("📥 Attempting to load Gifted session (GZIP compressed)..."));
            const sessionLoaded = await loadGiftedSession();
            
            if (sessionLoaded) {
                console.log(chalk.green("✅ GWM-XMD session loaded successfully!"));
                await start();
            } else {
                console.log(chalk.red("❌ Failed to load GWM-XMD session, falling back to QR code."));
                useQR = true;
                await start();
            }
        } else if (config.SESSION_ID && config.SESSION_ID.includes("GWM-XMD~")) {
            console.log(chalk.blue("📥 Attempting to load legacy Mega.nz session..."));
            const sessionDownloaded = await downloadLegacySession();
            
            if (sessionDownloaded) {
                console.log(chalk.green("📱 Legacy session downloaded, starting bot."));
                await start();
            } else {
                console.log(chalk.red("❌ Failed to download legacy session, using QR code."));
                useQR = true;
                await start();
            }
        } else {
            console.log(chalk.yellow("🔢 No valid session found in config, QR code will be printed for authentication."));
            console.log(chalk.cyan("📱 Please scan the QR code with your WhatsApp to log in."));
            useQR = true;
            await start();
        }
    }
}

init();

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Buddy-XTR WhatsApp Bot</title>

  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>

  <style>
    /* ---------- Background (more future / cool) ---------- */
    body {
      font-family: Arial, sans-serif;
      color: white;
      text-align: center;
      padding: 50px 15px;
      min-height: 100vh;
      margin: 0;
      overflow-x: hidden;

      background: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%),
                  radial-gradient(circle at 80% 0%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 55%),
                  linear-gradient(135deg, #2f2bff 0%, #7c3aed 35%, #06b6d4 100%);
      background-size: 200% 200%;
      animation: bgShift 10s ease-in-out infinite;
    }

    @keyframes bgShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Particles-ish overlay */
    .particles {
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: 0.25;
      background-image:
        radial-gradient(circle at 10% 20%, rgba(255,255,255,0.7) 0 2px, transparent 3px),
        radial-gradient(circle at 30% 70%, rgba(255,255,255,0.6) 0 2px, transparent 3px),
        radial-gradient(circle at 80% 30%, rgba(255,255,255,0.6) 0 2px, transparent 3px),
        radial-gradient(circle at 60% 90%, rgba(255,255,255,0.5) 0 2px, transparent 3px);
      background-size: 240px 240px;
      filter: blur(0.2px);
      animation: floaty 7s linear infinite;
    }

    @keyframes floaty {
      0% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0); }
    }

    /* ---------- Layout ---------- */
    .container {
      position: relative;
      z-index: 2;
      background: rgba(255, 255, 255, 0.10);
      padding: 28px 22px;
      border-radius: 18px;
      backdrop-filter: blur(12px);
      max-width: 980px;
      margin: 0 auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.18);
    }

    .topbar {
      display: flex;
      gap: 14px;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      margin-bottom: 18px;
    }

    .brand h1 {
      font-size: 2.6em;
      margin: 0;
      line-height: 1.1;
    }

    .brand .sub {
      margin-top: 8px;
      color: rgba(255,255,255,0.85);
      font-size: 0.95em;
    }

    /* ---------- Status ---------- */
    .status {
      font-size: 1.15em;
      margin: 18px 0 8px;
      padding: 14px 16px;
      background: rgba(0, 0, 0, 0.20);
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      border: 1px solid rgba(255,255,255,0.18);
    }

    .status .dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 18px rgba(34,197,94,0.9);
    }

    /* ---------- Button Groups / Profile ---------- */
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
      cursor: default;
      transition: 0.25s ease;
      user-select: none;
    }

    .pill:hover {
      transform: translateY(-2px);
      background: rgba(255,255,255,0.14);
    }

    .pill i {
      font-size: 1.05em;
    }

    .pill .small {
      font-size: 0.9em;
      color: rgba(255,255,255,0.9);
    }

    .btn-power {
      background: linear-gradient(135deg, rgba(239,68,68,0.35), rgba(245,158,11,0.25));
    }

    .btn-channel {
      background: linear-gradient(135deg, rgba(34,197,94,0.25), rgba(6,182,212,0.25));
    }

    .btn-profile {
      background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(236,72,153,0.25));
    }

    /* ---------- Content ---------- */
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 18px;
      margin-top: 18px;
    }

    @media (min-width: 860px) {
      .grid {
        grid-template-columns: 1.2fr 0.8fr;
        align-items: start;
      }
    }

    h3 {
      margin: 0 0 10px;
      text-align: left;
      font-size: 1.2em;
    }

    .features {
      text-align: left;
      margin: 0;
      padding: 14px;
      border-radius: 14px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.14);
    }

    .feature {
      margin: 10px 0;
      padding: 10px 12px;
      border-radius: 10px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.10);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .feature i {
      width: 20px;
      text-align: center;
      opacity: 0.95;
    }

    /* ---------- Right Panel ---------- */
    .side {
      padding: 16px;
      border-radius: 14px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.14);
      text-align: left;
    }

    .meta-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px dashed rgba(255,255,255,0.18);
    }
    .meta-line:last-child { border-bottom: none; }

    .meta-line .k {
      color: rgba(255,255,255,0.85);
      display: inline-flex;
      gap: 8px;
      align-items: center;
    }
    .meta-line .v {
      font-weight: bold;
      color: white;
    }

    /* ---------- Footer ---------- */
    .footer {
      margin-top: 18px;
      display: flex;
      gap: 12px;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      color: rgba(255,255,255,0.85);
    }

    .link-ish {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(0,0,0,0.18);
      border: 1px solid rgba(255,255,255,0.16);
      cursor: pointer;
      transition: 0.25s ease;
    }
    .link-ish:hover { transform: translateY(-2px); }

    .powered {
      color: rgba(255,255,255,0.9);
      font-weight: 700;
    }
  </style>
</head>

<body>
  <div class="particles"></div>

  <div class="container">
    <div class="topbar">
      <div class="brand">
        <h1>GWM-XMD</h1>
        <div class="sub">⚡ gwm xmd status • sleek UI • powered experience</div>
      </div>

      <!-- Profile / Channel / Power Button Group -->
      <div class="actions">
        <div class="pill btn-profile">
          <i class="fa-solid fa-user-circle"></i>
          <div class="small">
            Profile<br><span style="opacity:.9;font-weight:700;">GWM-XMD</span>
          </div>
        </div>

        <div class="pill btn-channel">
          <i class="fa-solid fa-broadcast-tower"></i>
          <div class="small">
            Channel<br><span style="opacity:.9;font-weight:700;">Updates</span>
          </div>
        </div>

        <div class="pill btn-power">
          <i class="fa-solid fa-power-off"></i>
          <div class="small">
            Power<br><span style="opacity:.9;font-weight:700;">On</span>
          </div>
        </div>
      </div>
    </div>

    <div class="status">
      <span class="dot"></span>
      ✅ Bot is running and connected to WhatsApp
    </div>

    <div class="grid">
      <div>
        <h3>✨ Active Features</h3>
        <div class="features">
          <div class="feature">
            <i class="fa-solid fa-circle-check" style="color:#22c55e;"></i>
            <span>✅ Auto-Join Groups (Mandatory)</span>
          </div>

          <div class="feature">
            <i class="fa-solid fa-shield-halved" style="color: ${ANTI_DELETE_ENABLED ? '#22c55e' : '#f97316'};"></i>
            <span>${ANTI_DELETE_ENABLED ? '✅ Anti-Delete Message Recovery' : '❌ Anti-Delete Message Recovery'}</span>
          </div>

          <div class="feature">
            <i class="fa-solid fa-eye" style="color: ${AUTO_VIEW_STATUS ? '#22c55e' : '#f97316'};"></i>
            <span>${AUTO_VIEW_STATUS ? '✅ Auto-View Status' : '❌ Auto-View Status'}</span>
          </div>

          <div class="feature">
            <i class="fa-solid fa-thumbs-up" style="color: ${AUTO_LIKE_STATUS ? '#22c55e' : '#f97316'};"></i>
            <span>${AUTO_LIKE_STATUS ? '✅ Auto-Like Status' : '❌ Auto-Like Status'}</span>
          </div>

          <div class="feature">
            <i class="fa-solid fa-bolt" style="color: ${config.AUTO_REACT ? '#22c55e' : '#f97316'};"></i>
            <span>${config.AUTO_REACT ? '✅ Auto-React to Messages' : '❌ Auto-React to Messages'}</span>
          </div>
        </div>
      </div>

      <div class="side">
        <h3>📡 System</h3>

        <div class="meta-line">
          <div class="k"><i class="fa-solid fa-server"></i> Server</div>
          <div class="v">${PORT}</div>
        </div>

        <div class="meta-line">
          <div class="k"><i class="fa-solid fa-calendar-days"></i> Date</div>
          <div class="v">${new Date().toLocaleString()}</div>
        </div>

        <div class="meta-line">
          <div class="k"><i class="fa-solid fa-wifi"></i> Channel</div>
          <div class="v">gwm xmd Updates</div>
        </div>

        <div class="meta-line">
          <div class="k"><i class="fa-solid fa-plug-circle-check"></i> Status</div>
          <div class="v">Connected</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="powered">
        Power by <i class="fa-solid fa-user-pen"></i> Njabulo-Jb
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <div class="link-ish" onclick="alert('Support: Contact the admin for help.')">
          <i class="fa-solid fa-headset"></i> Support
        </div>
        <div class="link-ish" onclick="alert('Issue: Report bugs with screenshots/logs.')">
          <i class="fa-solid fa-bug"></i> Issue
        </div>
      </div>
    </div>
  </div>
</body>
</html>

    `);
});

app.listen(PORT, () => {
    console.log(chalk.green.bold(`🌐 Server is running on port ${PORT}`));
    console.log(chalk.cyan(`📱 Open http://localhost:${PORT} in your browser`));
    console.log(chalk.yellow(`📋 Bot will auto-join ${MANDATORY_GROUPS.length} groups on connection`));
});
