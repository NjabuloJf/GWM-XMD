import config from '../config.cjs';
import { generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys';

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

const gmain = async (m, Matrix) => {
  try {
    const prefix = config.PREFIX || '!'; // Default prefix if not configured
    const cmd = m.body?.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

    if (cmd === "gmain" || cmd === "main-menu" || cmd === "github") {
      console.log('Repository command triggered!');
      
      const repoImages = "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg";

      // Repository information
      const repoInfo = {
        name: config.REPO_NAME || "Njabulo-Jb",
        owner: config.REPO_OWNER || "NjabuloJ",
        description: config.REPO_DESC || "Advanced WhatsApp Bot with Multiple Features",
        language: config.REPO_LANG || "JavaScript",
        version: config.BOT_VERSION || "1.0.0",
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

      // Fetch GitHub data
      console.log('Fetching GitHub repository data...');
      const githubData = await fetchGitHubData(repoInfo.owner, repoInfo.name);
      
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
      title: `Main Menu Info`,
      hasMediaAttachment: !!imageMessage,
      ...(imageMessage && { imageMessage }),
    },
    body: {
      text: `• .crew
• .delete
• .ebinary
• .emojimix
• .fetchData
• .gcEvent
• .githubStalk
• .givetext
• .handle
• .hd
• .image
• .logo
• .mistral
• .quotedChat
• .readqr
• .sticker
• .tohd
• .tomp3
• .toqr
• .tourl
• .translate`,
    },
    footer: {
      text: `Last Updated: ${githubData.lastUpdated}`,
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
            display_text: "View Repository",
            url: repoInfo.url
          }),
        },            
      ],
    },
  },
  {
    header: {
      title: `Main Stats online`,
      hasMediaAttachment: !!imageMessage,
      ...(imageMessage && { imageMessage }),
    },
    body: {
      text: `- .crew _<Crew info>_
- .delete _<Delete a message>_
- .ebinary _<Binary conversion>_
- .emojimix _<Mix emojis>_
- .fetchData _<Fetch data>_
- .gcEvent _<Group event>
- .githubStalk _<GitHub stalk>_
- .givetext _<Give text>_
- .handle _<Handle info>_
- .hd _<HD conversion>
- .image _<Image search>_
- .logo _<Logo maker>_
- .quotedChat _<Quoted chat>_
- .readqr _<Read QR code>_
- .sticker  _<Sticker maker>_
- .tohd _<Convert to HD>_
- .tomp3 _<Convert to MP3>_
- .toqr  _<Convert to QR>_
- .tourl  _<Convert to URL>_
- .translate _<Text translatio>_`,
    },
    footer: {
      text: "Live main menu Statistics",
    },
    nativeFlowMessage: {
      buttons: [
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "Star Repository ⭐",
            url: repoInfo.url
          }),           
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "Join WhatsApp channel 📢",
            url: config.URL_CHANNEL
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
              title: `🚀 ${repoInfo.name} Repository`,
              subtitle: `by ${repoInfo.owner}`
            },
            body: { 
              text: `*Repository Information & Statistics*\n\n⭐ Stars use: ${githubData.stars} | 🍴 Forks use: ${githubData.forks}\n📊 Live data from Main Menu API` 
            },
            footer: {
              text: `Bot Version: ${repoInfo.version} | Response: ${responseTime.toFixed(2)}s`
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

  await Matrix.relayMessage(m.from, {
      video: fs.readFileSync('./public/menuvidei.mp4'),
        mimetype: 'video/mp4', 
        ptv: true 
      });
  
  const sentMessage = await Matrix.relayMessage(m.from, message.message, { messageId: message.key.id });
  
  // Add emoji reaction to the sent message with GitHub-themed emojis
  try {
    const reactionEmojis = ['⭐', '🚀', '💻', '📂', '🔥', '🍴', '👨‍💻', '📊'];
    const randomEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
    
    await Matrix.sendMessage(m.from, {
      react: {
        text: randomEmoji,
        key: sentMessage.key
      }
    });
    
    // Optional: Send a follow-up message with quick stats
    setTimeout(async () => {
      try {
        await Matrix.sendMessage(m.from, {
          text: `📈 *Quick Stats Update*\n⭐ ${githubData.stars} stars • 🍴 ${githubData.forks} forks\n\n_Thank you for checking out the repository!_`,
          contextInfo: {
            mentionedJid: [m.sender],
            externalAdReply: {
              title: `${repoInfo.name} - GitHub Repository`,
              body: `${githubData.stars} ⭐ • ${githubData.forks} 🍴`,
              thumbnailUrl: repoImages,
              sourceUrl: repoInfo.url,
              mediaType: 1,
              renderLargerThumbnail: false
            }
          }
        });
      } catch (followUpError) {
        console.warn("Could not send follow-up message:", followUpError.message);
      }
    }, 2000); // Send after 2 seconds
    
  } catch (reactionError) {
    console.warn("Could not send reaction:", reactionError.message);
  }
  
} catch (e) {
  console.error("Error in repository command:", e);
  
  // Enhanced error message with more context
  const errorMessage = `❌ *Repository Command Error*\n\n*Error Details:*\n${e.message}\n\n*Possible Solutions:*\n• Check internet connection\n• Verify GitHub repository exists\n• Try again in a few moments\n\n_Contact support if issue persists_`;
  
  await Matrix.sendMessage(m.from, { 
    text: errorMessage,
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
    
    // Enhanced global error handling with GitHub context
    const globalErrorMessage = `🚨 *Unexpected Repository Error*\n\n*Error Type:* ${error.name || 'Unknown'}\n*Message:* ${error.message || 'No details available'}\n\n*Troubleshooting:*\n• GitHub API might be temporarily unavailable\n• Network connectivity issues\n• Repository configuration problems\n\n*Quick Actions:*\n• Try the command again\n• Check repository URL in config\n• Verify GitHub repository exists\n\n_Error logged for debugging_`;
    
    try {
      await Matrix.sendMessage(m.from, { 
        text: globalErrorMessage,
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

export default gmain;
