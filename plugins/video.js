
import axios from "axios";
import yts from "yt-search";
import config from "../config.cjs";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys';

const video = async (m, gss) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";

  if (cmd !== "video") return;

  const arg = m.body.slice(prefix.length + 3).trim().split(" ");
  try {
    if (!arg[0]) {
      return await gss.sendMessage(m.from, {
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
    const query = arg.join(' ');
    const search = await yts(query);
    if (!search || !search.videos || !search.videos[0]) {
      return await gss.sendMessage(m.from, {
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

    const cards = await Promise.all(
      search.videos.slice(0, 5).map(async (video, i) => ({
        header: {
          title: `*🎧 ${video.title}*`,
          hasMediaAttachment: true,
          imageMessage: (await generateWAMessageContent({ image: { url: video.thumbnail } }, { upload: gss.waUploadToServer })).imageMessage,
        },
        body: { text: `` },
        footer: { text: "" },
        nativeFlowMessage: {
          buttons: [
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "𝗩𝗶𝗲𝘄 𝗼𝗻 𝗬𝗼𝘂𝗧𝘂𝗯𝗲",
                url: `https://youtu.be/${video.videoId}`,
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
            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
            interactiveMessage: {
              body: { text: `*𝐆𝐖𝐌-𝐗𝐌𝐃 𝐒𝐎𝐍𝐆*\n🔍 Search Results for: ${query}` },
              
              carouselMessage: { cards },
            },
          },
        },
      },
      { quoted: { key: { fromMe: false, participant: `0@s.whatsapp.net`, remoteJid: "status@broadcast" }, message: { contactMessage: { displayName: `${m.pushName}`, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Njabulo-Jb;BOT;;;\nFN:Njabulo-Jb\nitem1.TEL;waid=26777821911:+26777821911\nitem1.X-ABLabel:Bot\nEND:VCARD` } } } }
    );

    await gss.relayMessage(m.from, message.message, { messageId: message.key.id });

    const firstVideo = search.videos[0];
    const apiURL = `https://noobs-api.top/dipto/ytDl3?link=${encodeURIComponent(firstVideo.videoId)}&format=mp4`;
    try {
      const response = await axios.get(apiURL);
      if (response.status !== 200) {
        await gss.sendMessage(m.from, { text: 'Failed to retrieve the MP3 download link. Please try again later.' }, { quoted: m });
        return;
      }
      const data = response.data;
      if (!data.downloadLink) {
        await gss.sendMessage(m.from, { text: 'Failed to retrieve the MP3 download link.' }, { quoted: m });
        return;
      }
      const safeTitle = firstVideo.title.replace(/[\\/:*?"<>|]/g, '');
      const fileName = `${safeTitle}.mp3`;
      await gss.sendMessage(m.from, {
        video: { url: data.downloadLink },
        mimetype: 'video/mp4',
        fileName,        
      }, { quoted: { key: { fromMe: false, participant: `0@s.whatsapp.net`, remoteJid: "status@broadcast" }, message: { contactMessage: { displayName: "njᥲbᥙᥣo", vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Njabulo-Jb;BOT;;;\nFN:Njabulo-Jb\nitem1.TEL;waid=26777821911:+26777821911\nitem1.X-ABLabel:Bot\nEND:VCARD` } } } });
    } catch (err) {
      console.error('[PLAY] API Error:', err);
      await gss.sendMessage(m.from, { text: 'An error occurred: ' + err.message }, { quoted: m });
    }
  } catch (err) {
    console.error('[PLAY] Error:', err);
    await gss.sendMessage(m.from, { text: 'An error occurred: ' + err.message }, { quoted: m });
  }
}

export default video;




