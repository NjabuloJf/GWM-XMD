

import axios from "axios";
import yts from "yt-search";
import config from "../config.cjs";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys';
import moment from "moment-timezone";

const son = async (m, gss) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";

  if (cmd !== "play") return;

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

    const firstVideo = search.videos[0];
    const apiURL = `https://noobs-api.top/dipto/ytDl3?link=${encodeURIComponent(firstVideo.videoId)}&format=mp3`;
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

      const loadingMessage = await gss.sendMessage(m.from, {
        video: { url: data.downloadLink },
        mimetype: 'video/mp4',
        ptv: true
      });

      await gss.sendMessage(m.from, { delete: loadingMessage.key });

      const safeTitle = firstVideo.title.replace(/[\\/:*?"<>|]/g, '');
      const fileName = `${safeTitle}.mp3`;
      const duration = moment.duration(firstVideo.duration.seconds, 'seconds').format('mm:ss');
      const text = `Name: ${firstVideo.title}\nTime: ${duration}\nArtist: ${firstVideo.author.name}`;
      const imageUrl = firstVideo.thumbnail;
      await gss.sendMessage(m.from, {
        image: { url: imageUrl },
        caption: text,
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363399999197102@newsletter',
            newsletterName: "╭••➤®Njabulo Jb",
            serverMessageId: 143,
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
            thumbnailUrl: "https://files.catbox.moe/vddrok.jpg",
            renderLargerThumbnail: true,
          },
        },
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

export default son;


