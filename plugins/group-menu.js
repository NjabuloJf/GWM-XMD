import config from '../config.cjs';
import { generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys';

const groupMenu = async (m, Matrix) => {
  try {
    const prefix = config.PREFIX || '!'; // Default prefix if not configured
    const cmd = m.body?.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

    if (cmd === "groupmenu" || cmd === "gmenu" || cmd === "group") {
      console.log('Group menu command triggered!');
      
      // Check if this is a group chat
      if (!m.from.endsWith('@g.us')) {
        return await Matrix.sendMessage(m.from, { 
          text: "❌ This command can only be used in group chats!" 
        });
      }

      // Get group metadata
      let groupMetadata;
      try {
        groupMetadata = await Matrix.groupMetadata(m.from);
      } catch (error) {
        console.error("Error fetching group metadata:", error);
        return await Matrix.sendMessage(m.from, { 
          text: "❌ Failed to fetch group information!" 
        });
      }

      const groupImages = "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/group.jpg";

      // Group information
      const groupInfo = {
        name: groupMetadata.subject || "Unknown Group",
        description: groupMetadata.desc || "No description available",
        participants: groupMetadata.participants?.length || 0,
        admins: groupMetadata.participants?.filter(p => p.admin === 'admin' || p.admin === 'superadmin').length || 0,
        created: groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toLocaleDateString() : "Unknown",
        id: groupMetadata.id || m.from
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
            { image: { url: groupImages } }, 
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
            title: `Group Information`,
            hasMediaAttachment: !!imageMessage,
            ...(imageMessage && { imageMessage }),
          },
          body: {
            text: `*Name*: ${groupInfo.name}\n*Members*: ${groupInfo.participants}\n*Admins*: ${groupInfo.admins}\n*Created*: ${groupInfo.created}`,
          },
          footer: {
            text: `Response Time: ${responseTime.toFixed(2)}s`,
          },
          nativeFlowMessage: {
            buttons: [
              {
                buttonId: `${prefix}groupinfo`,
                buttonText: { displayText: "📋 Group Info"},
                type: 1
              },
              {
                buttonId: `${prefix}groupsetting`,
                buttonText: { displayText: "⚙️ Settings"},
                type: 1
              },            
            ],
          },
        },
        {
          header: {
            title: `Member Management`,
            hasMediaAttachment: !!imageMessage,
            ...(imageMessage && { imageMessage }),
          },
          body: {
            text: `*Admin Commands*\n\n👑 Promote members to admin\n👤 Demote admins to members\n🚪 Kick troublesome members\n📨 Generate invite links`,
          },
          footer: {
            text: "Admin privileges required",
          },
          nativeFlowMessage: {
            buttons: [
              {
                buttonId: `${prefix}promote`,
                buttonText: { displayText: "👑 Promote"},
                type: 1
              },
              {
                buttonId: `${prefix}demote`,
                buttonText: { displayText: "👤 Demote"},
                type: 1
              },
            ],
          },
        },
        {
          header: {
            title: `Group Actions`,
            hasMediaAttachment: !!imageMessage,
            ...(imageMessage && { imageMessage }),
          },
          body: {
            text: `*Quick Actions*\n\n🚪 Kick members\n📨 Create invite link\n📢 Tag all members\n⚙️ Group settings`,
          },
          footer: {
            text: "Manage your group easily",
          },
          nativeFlowMessage: {
            buttons: [
              {
                buttonId: `${prefix}kick`,
                buttonText: { displayText: "🚪 Kick"},
                type: 1
              },
              {
                buttonId: `${prefix}invite`,
                buttonText: { displayText: "📨 Invite"},
                type: 1
              },
            ],
          },
        },
        {
          header: {
            title: `Communication`,
            hasMediaAttachment: !!imageMessage,
            ...(imageMessage && { imageMessage }),
          },
          body: {
            text: `*Tag Everyone*\n\nUse ${prefix}tagall to mention all group members\n\n*Usage*: ${prefix}tagall [message]\n*Example*: ${prefix}tagall Meeting at 3 PM!`,
          },
          footer: {
            text: "Notify all members",
          },
          nativeFlowMessage: {
            buttons: [
              {
                buttonId: `${prefix}tagall`,
                buttonText: { displayText: "📢 Tag All"},
                type: 1
              },
              {
                buttonId: `${prefix}help`,
                buttonText: { displayText: "❓ Help"},
                type: 1
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
                  header: { text: `🏘️ Group Management Menu` },
                  body: { text: `*Welcome to ${groupInfo.name}*\n\nSelect an option below to manage your group` },
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
                  displayName: "Group Manager",
                  vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Group;Manager;;;\nFN:Group Manager\nitem1.TEL;waid=26777821911:+26777821911\nitem1.X-ABLabel:Bot\nEND:VCARD`
                }
              }
            } 
          }
        );
        
        const sentMessage = await Matrix.relayMessage(m.from, message.message, { messageId: message.key.id });
        
        // Add emoji reaction to the sent message
        try {
          const reactionEmojis = ['🏘️', '👥', '⚙️', '📋', '🎯'];
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
        console.error("Error in group menu command:", e);
        await Matrix.sendMessage(m.from, { text: `❌ An error occurred: ${e.message}` });
      }
    }
  } catch (error) {
    console.error("Error in group menu function:", error);
    await Matrix.sendMessage(m.from, { text: "❌ An unexpected error occurred while processing the group menu command." });
  }
};

export default groupMenu;
