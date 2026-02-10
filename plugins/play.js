
import axios from "axios";
import yts from "yt-search";
import config from "../config.cjs";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import moment from "moment-timezone";

const play = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(/\s+/)[0]?.toLowerCase() : "";
  const args = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(/\s+/).slice(1) : [];

  if (cmd !== "play") return;

  try {
    await gss.sendMessage(m.from, {
      text: 'searching for your song',
      contextInfo: {
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363399999197102@newsletter',
          newsletterName: "╭••➤®Njabulo Jb",
          serverMessageId: 143,
        },
      },
    }, { quoted: m });

    if (!args.length) {
      return gss.sendMessage(m.from, {
        text: 'Please provide a song name or keyword.',
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363399999197102@newsletter',
            newsletterName: "╭••➤®Njabulo Jb",
            serverMessageId: 143,
          },
        },
      }, { quoted: m });
    }

    const query = args.join(' ');
    const search = await yts(query);

    if (!search || !search.videos || !search.videos[0]) {
      return gss.sendMessage(m.from, {
        text: 'No results found for your query.',
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363399999197102@newsletter',
            newsletterName: "╭••➤®Njabulo Jb",
            serverMessageId: 143,
          },
        },
      }, { quoted: m });
    }

    const video = search.videos[0];
    const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, '');
    const fileName = `${safeTitle}.mp3`;
    const apiURL = `https://noobs-api.top/dipto/ytDl3?link=${encodeURIComponent(video.videoId)}&format=mp3`;

    try {
      const response = await axios.get(apiURL);

      if (response.status !== 200) {
        return gss.sendMessage(m.from, {
          text: 'Failed to retrieve the MP3 download link. Please try again later.',
          contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363399999197102@newsletter',
              newsletterName: "╭••➤®Njabulo Jb",
              serverMessageId: 143,
            },
          },
        }, { quoted: m });
      }

      const data = response.data;

      if (!data.downloadLink) {
        return gss.sendMessage(m.from, {
          text: 'Failed to retrieve the MP3 download link.',
          contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363399999197102@newsletter',
              newsletterName: "╭••➤®Njabulo Jb",
              serverMessageId: 143,
            },
          },
        }, { quoted: m });
      }

      
      await gss.sendMessage(m.from, {
        document: { url: video.thumbnail },
         mimetype: 'application/pdf',
         fileName: `${video.title}`,
        caption: `🎧title: *${video.title}*
🎼views: *${video.views.toLocaleString()}*
*⇆ㅤ ||◁ㅤ❚❚ㅤ▷||ㅤ ↻*
0:00 ──〇─────── : *${video.timestamp}*
         
 __________________
*⿻│①◦ (Audio Song)*
*⿻│②◦ (Document song)*
*⿻│③◦ (Video Ytmp4)*
___________________

*①◦ visit njabulobot.vercel.app*
=====================¬¦`,
        contextInfo: {
          externalAdReply: {
            title: " ⇆ㅤ ||◁ㅤ❚❚ㅤ▷||ㅤ ↻ ",
            mediaType: 1,
            previewType: 0,
            thumbnailUrl: video.thumbnail,
            renderLargerThumbnail: true,
          },
        },
      }, { quoted: m });

      await gss.sendMessage(m.from, {
        audio: { url: data.downloadLink },
        mimetype: 'audio/mpeg',
        fileName,
        contextInfo: {
          externalAdReply: {
            title: " ⇆ㅤ ||◁ㅤ❚❚ㅤ▷||ㅤ ↻ ",
            mediaType: 1,
            previewType: 0,
            thumbnailUrl: video.thumbnail,
            renderLargerThumbnail: true,
          },
        },
      }, { quoted: m });
    } catch (err) {
      console.error('[PLAY] API Error:', err);

      if (err.response && err.response.status === 500) {
        await gss.sendMessage(m.from, {
          text: 'The API is currently experiencing issues. Please try again later.',
          contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363399999197102@newsletter',
              newsletterName: "╭••➤®Njabulo Jb",
              serverMessageId: 143,
            },
          },
        }, { quoted: m });
      } else {
        await gss.sendMessage(m.from, { text: 'An error occurred: ' + err.message });
      }
    }
  } catch (err) {
    console.error('[PLAY] Error:', err);
    await gss.sendMessage(m.from, { text: 'An error occurred: ' + err.message });
  }
};

export default play;

