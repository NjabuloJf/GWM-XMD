import config from '../config.cjs';
import { generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys';

const repository = async (m, Matrix) => {
  try {
    const prefix = config.PREFIX || '!'; // Default prefix if not configured
    const cmd = m.body?.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

    if (cmd === "repo1" || cmd === "repository1" || cmd === "github") {
      console.log('Repository command triggered!');
      
      const repoImages = "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg";

      // Repository information
      const repoInfo = {
        name: config.REPO_NAME || "Njabulo-Jb",
        owner: config.REPO_OWNER || "NjabuloJ",
        description: config.REPO_DESC || "Advanced WhatsApp Bot with Multiple Features",
        language: config.REPO_LANG || "JavaScript",
        version: config.BOT_VERSION || "1.0.0",
        stars: config.REPO_STARS || "Star this repo!",
        url: config.REPO_URL || "https://github.com/NjabuloJ/Njabulo-Jb"
      };

      const start = new Date().getTime();
      
      // Check if Matrix methods exist before using them
      if (typeof Matrix.sendPresenceUpdate === 'function') {
        try {
          await Matrix.sendPresenceUpdate('composing', m.from);
        } catch (presenceError) {
          console.warn("Could not send presence update:", presenceError.message);
        }
      }
      
      const end = new Date().getTime();
      const responseTime = (end - start) / 1000;

      // Generate image content with proper error handling
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
        // Continue without image
      }

      const cards = [
        {
          header: {
            title: `Repository Info`,
            hasMediaAttachment: !!imageMessage,
            ...(imageMessage && { imageMessage }),
          },
          body: {
            text: `*Name*: ${repoInfo.name}\n*Owner*: ${repoInfo.owner}\n*Description*: ${repoInfo.description}\n*Language*: ${repoInfo.language}`,
          },
          footer: {
            text: `Version: ${repoInfo.version}`,
          },
          nativeFlowMessage: {
            buttons: [
              {
                buttonId: `${prefix}info`,
                buttonText: { displayText: "Bot Info"},
                type: 1
              },
              { 
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Star Repository",
                  url: repoInfo.url
                }),
              },            
            ],
          },
        },
        {
          header: {
            title: `Quick Links`,
            hasMediaAttachment: !!imageMessage,
            ...(imageMessage && { imageMessage }),
          },
          body: {
            text: `*Response Time*: ${responseTime.toFixed(2)}s\n${repoInfo.stars}\n\n*Status*: Active & Maintained`,
          },
          footer: {
            text: "Open Source Project",
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "View Source Code",
                  url: repoInfo.url
                }),           
              },
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Report Issues",
                  url: `${repoInfo.url}/issues`
                }),           
              },
            ],
          },
        },
        {
          header: {
            title: `Get Started`,
            hasMediaAttachment: !!imageMessage,
            ...(imageMessage && { imageMessage }),
          },
          body: {
            text: `*Clone*: git clone ${repoInfo.url}\n*Install*: npm install\n*Run*: npm start\n\n*Need Help?* Check the README!`,
          },
          footer: {
            text: "Easy Setup Guide",
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Documentation",
                  url: `${repoInfo.url}#readme`
                }),           
              },
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Join Community",
                  url: config.GURL || "https://whatsapp.com/channel/0029VaihcQVDeON3dLG8Ub0k"
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
                  header: { text: `Repository Information` },
                  body: { text: `*Repository details and quick access links*` },
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
        
        // Add emoji reaction to the sent message
        try {
          const reactionEmojis = ['⭐', '🚀', '💻', '📂', '🔥'];
          const randomEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
          
          await Matrix.sendMessage(m.from, {
            react: {
              text: randomEmoji,
              key: sentMessage.key
            }
          });
        } catch (reactionError) {
          console.warn("Could not send reaction:", reactionError.message);
        }
        
      } catch (e) {
        console.error("Error in repository command:", e);
        await Matrix.sendMessage(m.from, { text: `An error occurred: ${e.message}` });
      }
    }
  } catch (error) {
    console.error("Error in repository function:", error);
    await Matrix.sendMessage(m.from, { text: "An unexpected error occurred while processing the repository command." });
  }
};

export default repository;
