
import Tesseract from 'tesseract.js';
import { writeFile, unlink } from 'fs/promises';
import config from '../config.cjs';

const givetextCommand = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const arg = m.body.slice(prefix.length + cmd.length).trim();
  const validCommands = ['givetext', 'extract'];

  if (validCommands.includes(cmd)) {
    if (!m.quoted || m.quoted.mtype !== 'imageMessage') {
      let responseMessage = `Send/Reply with an image to extract text ${prefix + cmd}`;
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

    let lang = 'eng';
    if (arg) {
      lang = arg;
    }

    try {
      const media = await m.quoted.download();
      if (!media) throw new Error('Failed to download media.');
      const filePath = `./${Date.now()}.png`;
      await writeFile(filePath, media);
      const { data: { text } } = await Tesseract.recognize(filePath, lang, { logger: m => console.log(m) });
      const responseMessage = `Extracted Text:\n\n${text}`;
      await Matrix.sendMessage(m.from, {
        text: responseMessage,
        contextInfo: {
          externalAdReply: {
            title: `👋hy ${m.pushName}`,
            body: " ",
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
      await unlink(filePath);
    } catch (error) {
      console.error("Error extracting text from image:", error);
      let responseMessage = 'Error extracting text from image.';
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
  }
};

export default givetextCommand;
