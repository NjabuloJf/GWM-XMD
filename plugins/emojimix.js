
import fetch from 'node-fetch';
import fs from 'fs';
import config from '../config.cjs';

const emojimix = async (m, Matrix) => {
  try {
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();
    const validCommands = ['emojimix', 'emix'];

    if (!validCommands.includes(cmd)) return;
    let [emoji1, emoji2] = text.split('+');
    if (!emoji1 || !emoji2) {
      let responseMessage = `Example: ${prefix + cmd} 😅+🤔`;
      return await Matrix.sendMessage(m.from, {
        text: " ",
        contextInfo: {
          externalAdReply: {
            title: `👋hy ${m.pushName}`,
            body: responseMessage,
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
    }

    const url = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF-FXvalexVuL3d1v3kBe-bic&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kit&${encodeURIComponent(emoji1)}${encodeURIComponent(emoji2)}`;
    const response = await fetch(url);
    const anu = await response.json();

    // Handle case where no emoji mix is found
    if (!anu.results || anu.results.length === 0) {
      let responseMessage = 'No emoji mix found for the provided emojis.';
      return await Matrix.sendMessage(m.from, {
        text: " ",
        contextInfo: {
          externalAdReply: {
            title: `👋hy ${m.pushName}`,
            body: responseMessage,
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
    }

    // Send the emoji mix as a sticker
    const encmedia = await Matrix.sendImageAsSticker(m.from, anu.results[0].url, m, {
      packname: "Njabulo_Jb",
      author: "NjabuloJf",
      categories: ['Emoji Mix'] // You can customize the categories
    });
  } catch (error) {
    console.error('Error:', error);
    let responseMessage = 'An error occurred while processing the command.';
    await Matrix.sendMessage(m.from, {
      text: " ",
      contextInfo: {
        externalAdReply: {
          title: `👋hy ${m.pushName}`,
          body: responseMessage,
          thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
          mediaType: 1,
          renderLargerThumbnail: false,
          sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
        }
      }
    }, { quoted: m });
  }
};

export default emojimix;
