import axios from "axios";
import yts from "yt-search";
import config from "../config.cjs";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys';

const playl = async (m, gss) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";

  if (cmd !== "playl") return;

  const arg = m.body.slice(prefix.length + 3).trim().split(" ");
  
  try {
    if (!arg[0]) {
      return await gss.sendMessage(m.from, {
        text: "🎵 *GWM-XMD MUSIC PLAYER* 🎵\n\nPlease provide a song name or YouTube link.\n\nExample: *!play Believer*",
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
            body: "Please provide a song name",
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
          },
        },
      }, { quoted: m });
    }
    
    const query = arg.join(' ');
    const search = await yts(query);
    
    if (!search || !search.videos || !search.videos[0]) {
      return await gss.sendMessage(m.from, {
        text: "❌ No results found for your query. Please try a different song name.",
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
            body: "No results found for your query",
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
          },
        },
      }, { quoted: m });
    }

    // Process the first video for playing
    const firstVideo = search.videos[0];
    
    await m.React("⏳");
    
    // Send "Processing" message
    await gss.sendMessage(m.from, {
      text: `🎵 *Processing your request...*\n\n📀 *Song:* ${firstVideo.title}\n⏱️ *Duration:* ${firstVideo.duration}\n👁️ *Views:* ${firstVideo.views}\n\n_⬇️ Fetching audio..._`
    }, { quoted: m });

    // Use multiple API endpoints as fallback
    let downloadUrl = null;
    let apiError = null;
    
    // Try first API
    const apiURL1 = `https://p.oceansaver.in/ajax/download.php?copyright=0&format=mp3&url=https://www.youtube.com/watch?v=${firstVideo.videoId}&api=dfcb6d76f2f6a9894dbc6201519f2d48`;
    
    try {
      const response1 = await axios.get(apiURL1, { timeout: 15000 });
      if (response1.data && response1.data.success && response1.data.download_url) {
        downloadUrl = response1.data.download_url;
      } else if (response1.data && response1.data.url) {
        downloadUrl = response1.data.url;
      }
    } catch (err) {
      apiError = err;
    }
    
    // Try second API if first failed
    if (!downloadUrl) {
      const apiURL2 = `https://api.ryzendesu.vip/api/downloader/ytmp3?url=https://youtu.be/${firstVideo.videoId}`;
      try {
        const response2 = await axios.get(apiURL2, { timeout: 15000 });
        if (response2.data && response2.data.url) {
          downloadUrl = response2.data.url;
        }
      } catch (err) {
        apiError = err;
      }
    }
    
    // Try third API
    if (!downloadUrl) {
      const apiURL3 = `https://api.siputzx.my.id/api/download/ytmp3?url=https://youtu.be/${firstVideo.videoId}`;
      try {
        const response3 = await axios.get(apiURL3, { timeout: 15000 });
        if (response3.data && response3.data.data && response3.data.data.link) {
          downloadUrl = response3.data.data.link;
        }
      } catch (err) {
        apiError = err;
      }
    }
    
    if (!downloadUrl) {
      await gss.sendMessage(m.from, { 
        text: `❌ *Failed to fetch audio*\n\nCould not retrieve download link for:\n🎵 ${firstVideo.title}\n\nPlease try another song or try again later.`
      }, { quoted: m });
      await m.React("❌");
      return;
    }
    
    // Send the audio
    const safeTitle = firstVideo.title.replace(/[\\/:*?"<>|]/g, '');
    const durationInSeconds = firstVideo.duration.seconds || 180;
    
    await gss.sendMessage(m.from, {
      audio: { url: downloadUrl },
      mimetype: 'audio/mpeg',
      fileName: `${safeTitle}.mp3`,
      ptt: false,
      contextInfo: {
        externalAdReply: {
          title: firstVideo.title.substring(0, 50),
          body: `🎵 ${firstVideo.author?.name || 'Unknown Artist'} • ${firstVideo.duration || 'Unknown'}`,
          mediaType: 1,
          previewType: 0,
          thumbnailUrl: firstVideo.thumbnail,
          renderLargerThumbnail: true,
          sourceUrl: `https://youtu.be/${firstVideo.videoId}`,
        },
      },
    }, { quoted: m });
    
    await m.React("✅");
    
  } catch (err) {
    console.error('[PLAY] Error:', err);
    await gss.sendMessage(m.from, { 
      text: `❌ *An error occurred:*\n${err.message}\n\nPlease try again later.`
    }, { quoted: m });
    await m.React("❌");
  }
}

export default playl;
