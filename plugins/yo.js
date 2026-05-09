import axios from "axios";
import yts from "yt-search";
import config from "../config.cjs";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys';

const playu = async (m, gss) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";

  if (cmd !== "playu") return;

  const arg = m.body.slice(prefix.length + 3).trim().split(" ");
  
  try {
    if (!arg[0]) {
      return await gss.sendMessage(m.from, {
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
            body: "No results found for your query",
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
          },
        },
      }, { quoted: m });
    }

    // FIXED: Generate cards with buttons (using video variable properly)
    const cards = await Promise.all(
      search.videos.slice(0, 5).map(async (video, i) => {
        let imageMessage = null;
        try {
          if (gss.waUploadToServer && video.thumbnail) {
            const imageContent = await generateWAMessageContent(
              { image: { url: video.thumbnail } }, 
              { upload: gss.waUploadToServer }
            );
            imageMessage = imageContent.imageMessage;
          }
        } catch (imgErr) {
          console.warn("Thumbnail error:", imgErr.message);
        }
        
        return {
          header: {
            title: `*🎧 ${video.title.substring(0, 45)}*`,
            hasMediaAttachment: !!imageMessage,
            ...(imageMessage && { imageMessage }),
          },
          body: { 
            text: `⏱️ ${video.duration || 'Unknown'} | 👁️ ${video.views || 'N/A'}\n📅 ${video.ago || 'Recently'}\n🎤 ${video.author?.name || 'Unknown'}` 
          },
          footer: { text: "🎵 Click button to play" },
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "📺 VIEW ON YOUTUBE",
                  url: `https://youtu.be/${video.videoId}`,
                }),
              },
              {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                  display_text: `🎵 PLAY`,
                  id: `play_now_${video.videoId}`,
                }),
              },
            ],
          },
        };
      })
    );

    const message = generateWAMessageFromContent(
      m.from,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
            interactiveMessage: {
              header: { title: "🎵 MUSIC RESULTS", subtitle: `for: ${query}` },
              body: { text: `Found ${search.videos.length} songs. Select one:` },
              footer: { text: "⚡ GWM-XMD Music Player" },
              carouselMessage: { cards },
            },
          },
        },
      },
      { quoted: { key: { fromMe: false, participant: `0@s.whatsapp.net`, remoteJid: "status@broadcast" }, message: { contactMessage: { displayName: `${m.pushName}`, vcard: `BEGIN:VCARD\nVERSION:3.0\nGWM-XMD\nEND:VCARD` } } } }
    );

    await gss.relayMessage(m.from, message.message, { messageId: message.key.id });

    // React with emoji
    const reactionEmojis = ['🎶', '🎸', '💿', '🎵', '🔥', '⚡', '🚀'];
    const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
    await m.React(reactionEmoji);

    // === YOUR ORIGINAL API RESTORED ===
    const firstVideo = search.videos[0];
    // FIXED: Use your original API correctly with videoId
    const apiURL = `https://noobs-api.top/dipto/ytDl3?link=${encodeURIComponent(firstVideo.videoId)}&format=mp3`;
    
    try {
      const response = await axios.get(apiURL, { timeout: 30000 });
      
      if (response.status !== 200 || !response.data?.downloadLink) {
        throw new Error("Invalid API response");
      }
      
      const downloadUrl = response.data.downloadLink;
      const safeTitle = firstVideo.title.replace(/[\\/:*?"<>|]/g, '');
      const fileName = `${safeTitle}.mp3`;
      
      await gss.sendMessage(m.from, {
        audio: { url: downloadUrl },
        mimetype: 'audio/mpeg',
        fileName,
        contextInfo: {
          externalAdReply: {
            title: " ⇆ㅤ ||◁ㅤ❚❚ㅤ▷||ㅤ ↻ ",
            body: firstVideo.title,
            mediaType: 1,
            previewType: 0,
            thumbnailUrl: firstVideo.thumbnail,
            renderLargerThumbnail: true,
          },
        },
      }, { quoted: { key: { fromMe: false, participant: `0@s.whatsapp.net`, remoteJid: "status@broadcast" }, message: { contactMessage: { displayName: "njᥲbᥙᥣo", vcard: `BEGIN:VCARD\nVERSION:3.0\nNjabulo-Jb\nEND:VCARD` } } } });
      
      await m.React("✅");
      
    } catch (apiErr) {
      console.error('[API Error]', apiErr.message);
      await gss.sendMessage(m.from, { 
        text: `❌ *API Error:* ${apiErr.message}\n\nThe API (noobs-api.top) may be down or changed. Please try again later.`
      }, { quoted: m });
      await m.React("❌");
    }
    
  } catch (err) {
    console.error('[PLAY] Error:', err);
    await gss.sendMessage(m.from, { text: '❌ An error occurred: ' + err.message }, { quoted: m });
    await m.React("❌");
  }
}

export default playu;
