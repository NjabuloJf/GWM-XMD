import axios from "axios";
import yts from "yt-search";
import config from "../config.cjs";
import {
  generateWAMessageContent,
  generateWAMessageFromContent,
} from "@whiskeysockets/baileys";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: download & send a specific song
// ─────────────────────────────────────────────────────────────────────────────
const sendSong = async (gss, m, videoId, title, timestamp, views, ago, author, thumbnail) => {
  const songDetails =
    `╭─────────────────────╮\n` +
    `│  🎵 *${title}*\n` +
    `│\n` +
    `│  ⏱ *Duration  :* ${timestamp}\n` +
    `│  👁 *Views     :* ${Number(views || 0).toLocaleString()}\n` +
    `│  📅 *Published :* ${ago}\n` +
    `│  🔗 *Channel   :* ${author || "Unknown"}\n` +
    `╰─────────────────────╯`;

  await gss.sendMessage(m.from, { text: songDetails }, { quoted: m });

  const apiURL = `https://noobs-api.top/dipto/ytDl3?link=${encodeURIComponent(videoId)}&format=mp3`;
  const response = await axios.get(apiURL);

  if (response.status !== 200 || !response.data?.downloadLink) {
    return await gss.sendMessage(
      m.from,
      { text: "❌ Failed to retrieve the MP3 download link. Please try again." },
      { quoted: m }
    );
  }

  const downloadLink = response.data.downloadLink;
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, "");

  await gss.sendMessage(
    m.from,
    {
      audio: { url: downloadLink },
      mimetype: "audio/mpeg",
      fileName: `${safeTitle}.mp3`,
      contextInfo: {
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: config.ID_CHANNEL,
          newsletterName: "╭••➤GWM-XMD",
          serverMessageId: 143,
        },
        forwardingScore: 999,
        externalAdReply: {
          title: title,
          body: `⏱ ${timestamp}  •  📅 ${ago}`,
          mediaType: 1,
          previewType: 0,
          thumbnailUrl: thumbnail,
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
};

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────
const haaa = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";

  // ── BUTTON RESPONSE: user tapped "🎵 Select This Song" ──────────────────────
  // Payload format:  PLAY_SONG::videoId::title::timestamp::ago::views::author
  if (body.startsWith("PLAY_SONG::")) {
    try {
      const parts = body.split("::");
      const videoId   = parts[1] || "";
      const title     = parts[2] || "Unknown Title";
      const timestamp = parts[3] || "0:00";
      const ago       = parts[4] || "";
      const views     = parts[5] || "0";
      const author    = parts[6] || "Unknown";
      // Standard YouTube HQ thumbnail from videoId — no need to pass full URL
      const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      const emojis = ["🔥", "⚡", "🚀", "🎯", "🎉", "🌟", "💥"];
      await m.React(emojis[Math.floor(Math.random() * emojis.length)]);

      await sendSong(gss, m, videoId, title, timestamp, views, ago, author, thumbnail);
    } catch (err) {
      console.error("[PLAY] Button handler error:", err);
      await gss.sendMessage(m.from, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
    return; // do not fall through to search
  }

  // ── COMMAND: !play <query> ────────────────────────────────────────────────
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  if (cmd !== "haaa") return;

  const arg = body.slice(prefix.length + 3).trim().split(" ");

  try {
    // No query provided
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

    // No results
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

    // ── Build carousel cards ─────────────────────────────────────────────────
    const cards = await Promise.all(
      search.videos.slice(0, 5).map(async (video) => {
        // Payload for the select button — joined with :: delimiter
        const selectPayload = [
          "PLAY_SONG",
          video.videoId,
          video.title,
          video.timestamp,
          video.ago,
          String(video.views || 0),
          video.author?.name || "Unknown",
        ].join("::");

        return {
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
            text:
              `⏱ *Duration  :* ${video.timestamp}\n` +
              `👁 *Views     :* ${Number(video.views || 0).toLocaleString()}\n` +
              `📅 *Published :* ${video.ago}\n` +
              `🔗 *Channel   :* ${video.author?.name || "Unknown"}`,
          },
          footer: { text: "🎵 GWM-XMD Music" },
          nativeFlowMessage: {
            buttons: [
              // ── Select & download this specific song ──
              {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                  display_text: "🎵 Select This Song",
                  id: selectPayload,
                }),
              },
              // ── Open on YouTube ──
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "▶️ View on YouTube",
                  url: `https://youtu.be/${video.videoId}`,
                }),
              },
            ],
          },
        };
      })
    );

    // ── Send carousel ────────────────────────────────────────────────────────
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
              body: {
                text:
                  `🔍 Search Results for: *${query}*\n` +
                  `Tap *🎵 Select This Song* on any card to download it.`,
              },
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

    // Reaction on search
    const textEmojis = ["🎶", "🎸", "💿"];
    await m.React(textEmojis[Math.floor(Math.random() * textEmojis.length)]);

  } catch (err) {
    console.error("[PLAY] Error:", err);
    await gss.sendMessage(
      m.from,
      { text: `❌ An error occurred: ${err.message}` },
      { quoted: m }
    );
  }
};

export default haaa;
