
import axios from "axios";
import config from "../config.cjs";

const tiktok = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";
  const query = m.body.slice(prefix.length + cmd.length).trim();

  if (!["tiktok", "tt"].includes(cmd)) return;

  if (!query || !query.startsWith("http")) {
    let responseMessage = "❌ *Usage:* `.tiktok <TikTok URL>`";
    return Matrix.sendMessage(m.from, {
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

  try {
    await Matrix.sendMessage(m.from, { react: { text: "⏳", key: m.key } });

    const { data } = await axios.get(`https://api.davidcyriltech.my.id/download/tiktok?url=${query}`);
    if (!data.success || !data.result || !data.result.video) {
      let responseMessage = "⚠️ *Failed to fetch TikTok video. Please try again.*";
      return Matrix.sendMessage(m.from, {
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

    const { desc, author, statistics, video, music } = data.result;
    const caption = `🎵 *TikTok Video*\n\n💬 *${desc}*\n👤 *By:* ${author.nickname}\n❤️ *Likes:* ${statistics.likeCount}\n💬 *Comments:* ${statistics.commentCount}\n🔄 *Shares:* ${statistics.shareCount} ✅*`;

    await Matrix.sendMessage(m.from, {
      video: { url: video },
      mimetype: "video/mp4",
      caption,
      contextInfo: {
        mentionedJid: [m.sender],     
        externalAdReply: {
          title: `👋hy ${m.pushName}`,
          body: caption,
          thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
          mediaType: 1,
          renderLargerThumbnail: false,
          sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
        }
      },
    }, { quoted: m });

    await Matrix.sendMessage(m.from, { react: { text: "✅", key: m.key } });

    // Send the TikTok music separately
    await Matrix.sendMessage(m.from, {
      audio: { url: music },
      mimetype: "audio/mpeg",
      fileName: "TikTok_Audio.mp3",
      caption: "🎶 *TikTok Audio Downloaded*",
      contextInfo: {
        externalAdReply: {
          title: `👋hy ${m.pushName}`,
          body: "🎶 *TikTok Audio Downloaded*",
          thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
          mediaType: 1,
          renderLargerThumbnail: false,
          sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
        }
      }
    }, { quoted: m });
  } catch (error) {
    console.error("TikTok Downloader Error:", error);
    let responseMessage = "❌ *An error occurred while processing your request. Please try again later.*";
    Matrix.sendMessage(m.from, {
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

export default tiktok;
