import axios from 'axios';
import config from '../config.cjs';
import { getContentType, downloadMediaMessage, generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys';

const njabulox = [
  "https://files.catbox.moe/xjeyjh.jpg",
  "https://files.catbox.moe/mh36c7.jpg",
  "https://files.catbox.moe/u6v5ir.jpg",
  "https://files.catbox.moe/bnb3vx.jpg",
];

const imageCommand = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const query = m.body.slice(prefix.length + cmd.length).trim();
  const validCommands = ['image', 'img', 'gimage'];

  if (!validCommands.includes(cmd)) return;

  if (!query) {
    await m.React("❌");
    return Matrix.sendMessage(m.from, {
      text: '❌ Please provide a search query.\nExample: *image sunset*'
    }, { quoted: m });
  }

  await m.React("⏳");

  try {
    const apiUrl = `https://apiskeith.vercel.app/search/images?query=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl, { timeout: 10000 });
    const results = res.data?.result;

    if (!Array.isArray(results) || results.length === 0) {
      await m.React("❌");
      return Matrix.sendMessage(m.from, {
        text: `❌ No images found for: *${query}*`
      }, { quoted: m });
    }

    const images = results.slice(0, 8);

    const picked = await Promise.all(
      images.map(async (img) => {
        try {
          const bufferRes = await axios.get(img.url, { responseType: 'arraybuffer', timeout: 10000 });
          return { buffer: Buffer.from(bufferRes.data), directLink: img.url };
        } catch {
          console.error('Image download failed:', img.url);
          return null;
        }
      })
    );

    const validImages = picked.filter(Boolean);

    if (validImages.length === 0) {
      await m.React("❌");
      return Matrix.sendMessage(m.from, {
        text: `❌ Could not download images for: *${query}*`
      }, { quoted: m });
    }

    const randomThumb = njabulox[Math.floor(Math.random() * njabulox.length)];

    const cards = await Promise.all(
      validImages.map(async (item, i) => ({
        header: {
          title: `📸 Image ${i + 1}`,
          hasMediaAttachment: true,
          imageMessage: (
            await generateWAMessageContent(
              { image: item.buffer },
              { upload: Matrix.waUploadToServer }
            )
          ).imageMessage,
        },
        body: { text: `🔍 Search: *${query}*` },
        footer: { text: ' ' },
        nativeFlowMessage: {
          buttons: [
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: '🌐 View Original',
                url: item.directLink,
              }),
            },
            {
              name: 'cta_copy',
              buttonParamsJson: JSON.stringify({
                display_text: '📋 Copy Link',
                copy_code: item.directLink,
              }),
            },
          ],
        },
      }))
    );

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
              body: { text: `🔍 Search Results for: *${query}*` },
              footer: { text: `📂 Found ${validImages.length} images` },
              carouselMessage: { cards },
              contextInfo: {
                externalAdReply: {
                  title: `☘️ Image Search: ${query}`,
                  mediaType: 1,
                  previewType: 0,
                  thumbnailUrl: randomThumb,
                  renderLargerThumbnail: false,
                },
              },
            },
          },
        },
      },
      { quoted: m }
    );

    await Matrix.relayMessage(m.from, message.message, { messageId: message.key.id });
    await m.React("✅");

  } catch (error) {
    console.error('Image search error:', error.message);
    await m.React("❌");
    await Matrix.sendMessage(m.from, {
      text: `❌ Error: ${error.message}`
    }, { quoted: m });
  }
};

export default imageCommand;
