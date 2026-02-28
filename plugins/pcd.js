
import axios from 'axios';
import config from '../config.cjs';

const paircode = async (m, Matrix) => {
  // Get prefix from config
  const prefix = config.PREFIX || '.';

  // Check if command matches
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  if (cmd !== 'paircode') return;

  try {
    // Extract number from message
    const args = m.body.slice(prefix.length).trim().split(' ').slice(1);
    if (args.length === 0) {
      let responseMessage = `👀 Usage: ${prefix}paircode Example 267`;
      return await Matrix.sendMessage(m.from, {
        text: " ",
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
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
    }

    let number = args[0].trim();
    // Clean the number
    if (number.startsWith('+')) number = number.slice(1);
    if (number.startsWith('254')) number = number.slice(3);
    if (!/^\d{9,}$/.test(number)) {
      let responseMessage = `❌ Please provide 9+ digits Example:* 712345678`;
      return await Matrix.sendMessage(m.from, {
        text: " ",
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
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
    }

    // Prepare request data
    const requestData = { number: `254${number}` };

    // Send request to API
    let responseMessage = '⏳ Requesting pair code...';
    await Matrix.sendMessage(m.from, {
      text: " ",
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
          sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
        }
      }
    }, { quoted: m });

    const response = await axios.post('', requestData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    // Handle response
    if (response.data && response.data.pairCode) {
      const pairCode = response.data.pairCode;
      responseMessage = `✅  Pair Code: ${pairCode}`;
      await Matrix.sendMessage(m.from, {
        text: " ",
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
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
    } else if (response.data && response.data.error) {
      responseMessage = `❌ Error: ${response.data.error}Please try again with a different number.`;
      await Matrix.sendMessage(m.from, {
        text: " ",
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
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('Paircode error:', error);
    let errorMessage = '❌ *Failed to generate pair code*';
    if (error.response) {
      // API error
      errorMessage += `*Status:* ${error.response.status}`;
      if (error.response.data) {
        errorMessage += `*Response:* ${JSON.stringify(error.response.data)}`;
      }
    } else if (error.request) {
      // No response
      errorMessage += '*Server is not responding*';
    } else {
      // Other errors
      errorMessage += `*Error:* ${error.message}`;
    }

    await Matrix.sendMessage(m.from, {
      text: " ",
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
          body: errorMessage,
          thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
          mediaType: 1,
          renderLargerThumbnail: false,
          sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
        }
      }
    }, { quoted: m });
  }
};

export default paircode;
