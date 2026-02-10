
import axios from "axios";
import config from "../config.cjs";

const facebook = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";
  const query = m.body.slice(prefix.length + cmd.length).trim();

  if (!["fb", "facebook"].includes(cmd)) return;

  if (!query || !query.startsWith("http")) {
    let responseMessage = "❌ *Usage:* `.fb <Facebook Video URL>`";
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

    const { data } = await axios.get(`https://api.davidcyriltech.my.id/facebook2?url=${query}`);
    if (!data.status || !data.video || !data.video.downloads) {
      let responseMessage = "⚠️ *Failed to fetch Facebook video. Please try again.*";
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

    const { title, downloads } = data.video;
    const bestQuality = downloads.find(v => v.quality === "HD") || downloads.find(v => v.quality === "SD");

    if (!bestQuality) {
      let responseMessage = "⚠️ *No downloadable video found.*";
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

    const caption = `📹 *Facebook Video*\n\n🎬 *Title:* ${title}\n📥 *Quality:* ${bestQuality.quality} ✅*`;



    await Matrix.sendMessage(m.from, {
      caption,      
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
    
    await Matrix.sendMessage(m.from, {
      video: { url: bestQuality.downloadUrl },
      mimetype: "video/mp4",    
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
  } catch (error) {
    console.error("Facebook Downloader Error:", error);
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

export default facebook;
