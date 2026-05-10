import moment from 'moment-timezone';
import fs from 'fs';
import os from 'os';
import config from '../config.cjs';
import axios from 'axios';
import { generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys';

// Date and time — defined at top level so they're accessible everywhere
const xtime = moment.tz("Asia/Colombo").format("HH:mm:ss");
const xdate = moment.tz("Asia/Colombo").format("DD/MM/YYYY");

// Function to fetch GitHub repository data
const fetchGitHubData = async (owner, repo) => {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
      watchers: data.watchers_count || 0,
      openIssues: data.open_issues_count || 0,
      language: data.language || 'JavaScript',
      description: data.description || 'No description available',
      lastUpdated: data.updated_at ? new Date(data.updated_at).toLocaleDateString() : 'Unknown'
    };
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return {
      stars: 'N/A',
      forks: 'N/A',
      watchers: 'N/A',
      openIssues: 'N/A',
      language: config.REPO_LANG || 'JavaScript',
      description: config.REPO_DESC || 'Advanced WhatsApp Bot with Multiple Features',
      lastUpdated: 'N/A'
    };
  }
};

const coloraii = async (m, Matrix) => {
  try {
    const prefix = config.PREFIX || '!';
    const cmd = m.body?.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

    if (cmd === "color.ai.menu" || cmd === "color-ai-menu") {
      console.log('Repository command triggered!');
      
      const repoImages = "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg";

      const repoInfo = {
        name: config.REPO_NAME || "Njabulo-Jb",
        owner: config.REPO_OWNER || "NjabuloJ",
        description: config.REPO_DESC || "Advanced WhatsApp Bot with Multiple Features",
        language: config.REPO_LANG || "JavaScript",
        version: config.BOT_VERSION || "1.0.0",
        url: config.REPO_URL || "https://github.com/NjabuloJ/Njabulo-Jb"
      };

      const start = new Date().getTime();
      
      if (typeof Matrix.sendPresenceUpdate === 'function') {
        try {
          await Matrix.sendPresenceUpdate('composing', m.from);
        } catch (presenceError) {
          console.warn("Could not send presence update:", presenceError.message);
        }
      }

      console.log('Fetching GitHub repository data...');
      const githubData = await fetchGitHubData(repoInfo.owner, repoInfo.name);
      
      const end = new Date().getTime();
      const responseTime = (end - start) / 1000;

      let imageMessage = null;
      try {
        if (Matrix.waUploadToServer && typeof Matrix.waUploadToServer === 'function') {
          const imageContent = await generateWAMessageContent(
            { image: { url: repoImages } }, 
            { upload: Matrix.waUploadToServer }
          );
          imageMessage = imageContent.imageMessage;
        } else {
          console.warn("waUploadToServer not available, sending without images");
        }
      } catch (imageError) {
        console.error("Error generating image content:", imageError.message);
      }

      const cards = [
        {
          header: {
            title: `*ɢᴡᴍ xᴍᴅ ᴍᴇɴᴜᴄᴏᴍᴍᴀɴᴅᴀs*`,
            hasMediaAttachment: !!imageMessage,
            ...(imageMessage && { imageMessage }),
          },
          body: {
            text: `ᴜsᴇʀ ɴᴀᴍᴇ:  ${m.pushName}
📅ᴅᴀᴛᴇ: ${xdate} 
⏰ᴛɪᴍᴇ: ${xtime}
⭐ᴛᴏᴛᴀʟ ᴜsᴇ: ${githubData.stars}

*『Coding ai』*
.ᴋʜʀᴏᴍᴀ
.ᴄᴏᴏʟᴏʀs
.ᴄᴏʟᴏʀʜᴜɴᴛ
.ᴘᴀʟᴇᴛᴛᴏɴ
.ᴀᴅᴏʙᴇ_ᴄᴏʟᴏʀ
.ᴄᴏʟᴏʀᴍɪɴᴅ
.ʜᴜᴇᴍɪɴᴛ
.ᴘᴀʟᴇᴛᴛᴇʀ
.ᴄᴏʟᴏʀғғʏ
.ᴍᴜᴢʟɪ_ᴄᴏʟᴏʀ
.ᴄᴏʟᴏʀᴛʜᴇᴏʀʏ
.ᴄᴏʟᴏʀᴘsʏᴄʜ
.ᴄᴏʟᴏʀᴡᴄᴀɢ
.ᴄᴏʟᴏʀᴄᴏɴᴠᴇʀᴛ
.ᴄᴏʟᴏʀɴᴀᴍᴇʀ
.ᴄᴏʟᴏʀʙʟɪɴᴅ
.ɢʀᴀᴅɪᴇɴᴛᴀɪ
.ᴄssᴄᴏʟᴏʀ
.ʙʀᴀɴᴅᴄᴏʟᴏʀ
.ᴜɪᴄᴏʟᴏʀ
.ғᴀsʜɪᴏɴᴄᴏʟᴏʀ
.ɪɴᴛᴇʀɪᴏʀᴄᴏʟᴏʀ
.ᴀʀᴛᴄᴏʟᴏʀ
.ᴘʀɪɴᴛᴄᴏʟᴏʀ
.ᴄᴏʟᴏʀᴛʀᴇɴᴅ
.ᴍᴏᴏᴅᴄᴏʟᴏʀ
.sᴇᴀsᴏɴᴄᴏʟᴏʀ
.ɴᴀᴛᴜʀᴇᴄᴏʟᴏʀ
.ᴍᴏᴠɪᴇᴄᴏʟᴏʀ`,
          },
          footer: {
            text: "ᴀssɪsᴛᴀɴᴛ ʙʏ sɪʀ ɴᴊᴀʙᴜʟᴏ-ᴊʙ ᴜɪ",
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: "GWM-XMD LIST📃",
                  copy_code: ' '
                }),
              },
            ],
          },
        },
      ];

      try {
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
                    title: `ɢᴡᴍ-xᴍᴅ sᴛᴀᴛᴜs ᴏɴʟɪɴᴇ`,
                    subtitle: `by ${repoInfo.owner}`
                  },
                  body: { 
                    text: ` ` 
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
                  vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Njabulo-Jb;BOT;;;\nFN:Njabulo-Jb\nitem1.TEL;waid=26777821911:+26777821911\nitem1.X-ABLabel:Bot\nEND:VCARD`
                }
              }
            } 
          }
        );

        const sentMessage = await Matrix.relayMessage(m.from, message.message, { messageId: message.key.id });
        
        try {
          const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
          const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];

          const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
          let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

          while (textEmoji === reactionEmoji) {
            textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
          }

          await m.React(textEmoji);

         setTimeout(async () => {
         try {
          await Matrix.sendMessage(m.from, {
          voice: fs.readFileSync('./media/menuaudio.mp3'),
          mimetype: 'audio/mpeg',
          contextInfo: {
          externalAdReply: {
            title: " ⇆ㅤ ||◁ㅤ❚❚ㅤ▷||ㅤ ↻ ",
            mediaType: 1,
            previewType: 0,
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg", 
            renderLargerThumbnail: true,
          },
        },
      }, { quoted: { key: { fromMe: false, participant: `0@s.whatsapp.net`, remoteJid: "status@broadcast" }, message: { contactMessage: { displayName: "njᥲbᥙᥣo", vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Njabulo-Jb;BOT;;;\nFN:Njabulo-Jb\nitem1.TEL;waid=26777821911:+26777821911\nitem1.X-ABLabel:Bot\nEND:VCARD` } } } });

            } catch (followUpError) {
              console.warn("Could not send voice note:", followUpError.message);
            }
          }, 2000); 
          
        } catch (reactionError) {
          console.warn("Could not send reaction:", reactionError.message);
        }
        
      } catch (e) {
        console.error("Error in repository command:", e);
        
        await Matrix.sendMessage(m.from, { 
          text: `❌ *Repository Command Error*\n\n*Error Details:*\n${e.message}\n\n*Possible Solutions:*\n• Check internet connection\n• Verify GitHub repository exists\n• Try again in a few moments\n\n_Contact support if issue persists_`,
          contextInfo: {
            externalAdReply: {
              title: "Error - Repository Command",
              body: "Something went wrong",
              thumbnailUrl: "https://via.placeholder.com/300x200/ff0000/ffffff?text=ERROR",
              sourceUrl: repoInfo.url,
              mediaType: 1
            }
          }
        });
      }
    }
  } catch (error) {
    console.error("Error in repository function:", error);
    
    try {
      await Matrix.sendMessage(m.from, { 
        text: `🚨 *Unexpected Repository Error*\n\n*Error Type:* ${error.name || 'Unknown'}\n*Message:* ${error.message || 'No details available'}\n\n*Troubleshooting:*\n• GitHub API might be temporarily unavailable\n• Network connectivity issues\n• Repository configuration problems\n\n*Quick Actions:*\n• Try the command again\n• Check repository URL in config\n• Verify GitHub repository exists\n\n_Error logged for debugging_`,
        contextInfo: {
          externalAdReply: {
            title: "🚨 Repository Command Failed",
            body: "Global error occurred",
            thumbnailUrl: "https://via.placeholder.com/300x200/ff4444/ffffff?text=SYSTEM+ERROR",
            sourceUrl: config.REPO_URL || "https://github.com",
            mediaType: 1,
            renderLargerThumbnail: false
          }
        }
      });
    } catch (sendError) {
      console.error("Failed to send error message:", sendError);
    }
  }
};

export default coloraii;
