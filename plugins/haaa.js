import axios from "axios";
import yts from "yt-search";
import config from "../config.cjs";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import {
  generateWAMessageContent,
  generateWAMessageFromContent,
} from "@whiskeysockets/baileys";

const play = async (m, gss) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix)
    ? m.body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  if (cmd !== "play") return;

  const arg = m.body.slice(prefix.length + 3).trim().split(" ");

  try {
    // ── No query provided ──────────────────────────────────────────────────────
    if (!arg[0]) {
      return await gss.sendMessage(
        m.from,
        {
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
              title: "GWM-XMD Music Bot 🎵",
              body: "Please provide a song name to search",
              thumbnailUrl:
                "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
              mediaType: 1,
              renderLargerThumbnail: false,
            },
          },
        },
        { quoted: m }
      );
    }

    const query = arg.join(" ");
    const search = await yts(query);

    // ── No results found ───────────────────────────────────────────────────────
    if (!search || !search.videos || !search.videos[0]) {
      return await gss.sendMessage(
        m.from,
        {
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
              title: "GWM-XMD Music Bot 🎵",
              body: `No results found for: ${query}`,
              thumbnailUrl:
                "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fanaa.jpg",
              mediaType: 1,
              renderLargerThumbnail: false,
            },
          },
        },
        { quoted: m }
      );
    }

    // ── Build carousel cards ───────────────────────────────────────────────────
    const cards = await Promise.all(
      search.videos.slice(0, 5).map(async (video) => ({
        header: {
          title: `*🎧 ${video.title}*`,
          hasMediaAttachment: true,
          imageMessage: (
            await generateWAMessageContent(
              { image: { url: video.thumbnail } },
              { upload: gss.waUploadToServer }
            )
          ).imageMessage,
        },
        body: {
          text: `⏱ Duration : ${video.timestamp}\n👁 Views   : ${Number(video.views).toLocaleString()}\n📅 Published: ${video.ago}`,
        },
        footer: { text: "🎵 GWM-XMD Music" },
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

    // ── Send carousel ──────────────────────────────────────────────────────────
    const carouselMsg = generateWAMessageFromContent(
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
              carouselMessage: { cards },
            },
          },
        },
      },
      {
        quoted: {
          key: {
            fromMe: false,
            participant: `0@s.whatsapp.net`,
            remoteJid: "status@broadcast",
          },
          message: {
            contactMessage: {
              displayName: `${m.pushName}`,
              vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Njabulo-Jb;BOT;;;\nFN:Njabulo-Jb\nitem1.TEL;waid=26777821911:+26777821911\nitem1.X-ABLabel:Bot\nEND:VCARD`,
            },
          },
        },
      }
    );

    await gss.relayMessage(m.from, carouselMsg.message, {
      messageId: carouselMsg.key.id,
    });

    // ── Reaction ───────────────────────────────────────────────────────────────
    const reactionEmojis = ["🔥", "⚡", "🚀", "💨", "🎯", "🎉", "🌟", "💥", "🕐", "🔹"];
    const textEmojis = ["🎶", "🎸", "💿"];
    const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
    let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
    while (textEmoji === reactionEmoji) {
      textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
    }
    await m.React(textEmoji);

    // ── Download & send audio ──────────────────────────────────────────────────
    // FIX: was using undefined `video` — now correctly uses `firstVideo`
    const firstVideo = search.videos[0];

    // Build a clean, readable song details caption
    const songDetails =
      `╭─────────────────────╮\n` +
      `│  🎵 *${firstVideo.title}*\n` +
      `│\n` +
      `│  ⏱ *Duration :* ${firstVideo.timestamp}\n` +
      `│  👁 *Views    :* ${Number(firstVideo.views).toLocaleString()}\n` +
      `│  📅 *Published:* ${firstVideo.ago}\n` +
      `│  🔗 *Channel  :* ${firstVideo.author?.name || "Unknown"}\n` +
      `╰─────────────────────╯`;

    // Send details text first
    await gss.sendMessage(m.from, { text: songDetails }, { quoted: m });

    const apiURL = `https://noobs-api.top/dipto/ytDl3?link=${encodeURIComponent(
      firstVideo.videoId
    )}&format=mp3`;

    try {
      const response = await axios.get(apiURL);

      if (response.status !== 200 || !response.data?.downloadLink) {
        return await gss.sendMessage(
          m.from,
          { text: "❌ Failed to retrieve the MP3 download link. Please try again later." },
          { quoted: m }
        );
      }

      const downloadLink = response.data.downloadLink;
      const safeTitle = firstVideo.title.replace(/[\\/:*?"<>|]/g, "");
      const fileName = `${safeTitle}.mp3`;

      // FIX: was `video.title` / `video.thumbnail` — now `firstVideo.title` / `firstVideo.thumbnail`
      await gss.sendMessage(
        m.from,
        {
          audio: { url: downloadLink },
          mimetype: "audio/mpeg",
          fileName,
          contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: config.ID_CHANNEL,
              newsletterName: "╭••➤GWM-XMD",
              serverMessageId: 143,
            },
            forwardingScore: 999,
            externalAdReply: {
              // Title shows song name
              title: firstVideo.title,
              // Body shows duration + month published
              body: `⏱ ${firstVideo.timestamp}  •  📅 ${firstVideo.ago}`,
              mediaType: 1,
              previewType: 0,
              // FIX: thumbnail now correctly references firstVideo
              thumbnailUrl: firstVideo.thumbnail,
              renderLargerThumbnail: true,
            },
          },
        },
        {
          quoted: {
            key: {
              fromMe: false,
              participant: `0@s.whatsapp.net`,
              remoteJid: "status@broadcast",
            },
            message: {
              contactMessage: {
                displayName: "GWM-XMD 🎵",
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Njabulo-Jb;BOT;;;\nFN:Njabulo-Jb\nitem1.TEL;waid=26777821911:+26777821911\nitem1.X-ABLabel:Bot\nEND:VCARD`,
              },
            },
          },
        }
      );
    } catch (err) {
      console.error("[PLAY] API Error:", err);
      await gss.sendMessage(
        m.from,
        { text: `❌ Download error: ${err.message}` },
        { quoted: m }
      );
    }
  } catch (err) {
    console.error("[PLAY] Error:", err);
    await gss.sendMessage(
      m.from,
      { text: `❌ An error occurred: ${err.message}` },
      { quoted: m }
    );
  }
};

export default play;
