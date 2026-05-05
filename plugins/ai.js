import axios from 'axios';
import config from '../config.cjs';
import { getContentType, downloadMediaMessage } from '@whiskeysockets/baileys';

// ── Shared helper: download quoted media ──────────────────────────
const downloadQuoted = async (m, Matrix) => {
  const quoted = m.quoted;
  if (!quoted) return null;
  const msg = quoted.message || quoted;
  const type = getContentType(msg);
  if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) return null;
  const buffer = await downloadMediaMessage(
    { message: msg, key: quoted.key || m.key },
    'buffer',
    {},
    { logger: console, reuploadRequest: Matrix.updateMediaMessage }
  );
  return { buffer, type };
};

// ── Free AI API caller ────────────────────────────────────────────
const callFreeAI = async (prompt) => {
  const apis = [
    `https://api.kastaid.xyz/ai/gemini?query=${encodeURIComponent(prompt)}`,
    `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(prompt)}`,
    `https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent(prompt)}`,
    `https://api.ferdev.my.id/ai/gpt4?text=${encodeURIComponent(prompt)}`,
    `https://api.lolhuman.xyz/api/gemini?apikey=tes&text=${encodeURIComponent(prompt)}`,
  ];
  for (const url of apis) {
    try {
      const res = await axios.get(url, { timeout: 20000 });
      const reply =
        res.data?.result ||
        res.data?.data ||
        res.data?.response ||
        res.data?.answer ||
        res.data?.message ||
        res.data?.text ||
        res.data?.content;
      if (reply && typeof reply === 'string' && reply.trim()) return reply.trim();
    } catch {
      continue;
    }
  }
  return null;
};

// ── Generate image from text ──────────────────────────────────────
const generateImage = async (prompt) => {
  const apis = [
    `https://api.ryzendesu.vip/api/ai/imagine?prompt=${encodeURIComponent(prompt)}`,
    `https://api.siputzx.my.id/api/ai/text2img?prompt=${encodeURIComponent(prompt)}`,
    `https://api.kastaid.xyz/ai/text2img?query=${encodeURIComponent(prompt)}`,
    `https://api.ferdev.my.id/ai/imagine?prompt=${encodeURIComponent(prompt)}`,
  ];
  for (const url of apis) {
    try {
      const res = await axios.get(url, { timeout: 30000, responseType: 'arraybuffer' });
      if (res.data && res.data.byteLength > 1000) return Buffer.from(res.data);
    } catch {
      continue;
    }
  }
  return null;
};

// ── Edit image via AI ─────────────────────────────────────────────
const editImageAI = async (buffer, prompt) => {
  const base64 = buffer.toString('base64');
  const apis = [
    `https://api.siputzx.my.id/api/ai/image-edit?prompt=${encodeURIComponent(prompt)}&image=${base64}`,
    `https://api.ryzendesu.vip/api/ai/imagine?prompt=${encodeURIComponent(prompt)}`,
    `https://api.kastaid.xyz/ai/text2img?query=${encodeURIComponent(prompt)}`,
  ];
  for (const url of apis) {
    try {
      const res = await axios.get(url, { timeout: 30000, responseType: 'arraybuffer' });
      if (res.data && res.data.byteLength > 1000) return Buffer.from(res.data);
    } catch {
      continue;
    }
  }
  return null;
};

// ── Generate song/audio via AI ────────────────────────────────────
const generateSong = async (prompt) => {
  const apis = [
    `https://api.siputzx.my.id/api/ai/text2audio?text=${encodeURIComponent(prompt)}`,
    `https://api.ryzendesu.vip/api/ai/tts?text=${encodeURIComponent(prompt)}`,
    `https://api.kastaid.xyz/ai/tts?query=${encodeURIComponent(prompt)}`,
  ];
  for (const url of apis) {
    try {
      const res = await axios.get(url, { timeout: 30000, responseType: 'arraybuffer' });
      if (res.data && res.data.byteLength > 1000) return Buffer.from(res.data);
    } catch {
      continue;
    }
  }
  return null;
};

// ── Main command handler ──────────────────────────────────────────
const aibot = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix)
    ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
    : '';
  const query = m.body.slice(prefix.length + cmd.length).trim();

  const aiCommands = {
    ai: 'chat', gemini: 'chat', gpt: 'chat', chatgpt: 'chat',
    meta: 'chat', llama: 'chat', llama4: 'chat', lami4: 'chat',
    google: 'chat', alexa: 'chat', siri: 'chat', cortana: 'chat',
    bingai: 'chat', bing: 'chat', assistant: 'chat',
    imagine: 'image', txt2img: 'image', aiimage: 'image',
    aiphoto: 'image', draw: 'image', generate: 'image',
    editimg: 'editimage', aifilter: 'editimage', enhance: 'editimage',
    aivideo: 'video', txt2vid: 'video', generatevideo: 'video',
    song: 'song', aisong: 'song', music: 'song', aimusic: 'song',
    tts: 'song', voice: 'song', speak: 'song',
  };

  const action = aiCommands[cmd];
  if (!action) return;

  if (!query && action === 'chat') {
    await m.React("❌");
    return Matrix.sendMessage(m.from, {
      text: `❌ Please provide a prompt.\n\nExamples:\n*${prefix}gemini what is AI?*\n*${prefix}imagine sunset over ocean*\n*${prefix}song happy birthday melody*\n*${prefix}editimg make it vintage* _(reply to image)_`
    }, { quoted: m });
  }

  await m.React("⏳");

  try {

    // ── CHAT ───────────────────────────────────────────────────────
    if (action === 'chat') {
      const personas = {
        gemini: "You are Gemini, Google's AI assistant. Be helpful and smart.",
        gpt: 'You are ChatGPT by OpenAI. Be helpful and conversational.',
        chatgpt: 'You are ChatGPT by OpenAI. Be helpful and conversational.',
        meta: 'You are Meta AI by Meta. Be friendly and helpful.',
        llama: 'You are LLaMA by Meta. Be helpful and concise.',
        llama4: 'You are LLaMA 4 by Meta. Be helpful and concise.',
        lami4: 'You are LLaMA 4 by Meta. Be helpful and concise.',
        alexa: 'You are Alexa by Amazon. Be helpful like a smart home assistant.',
        siri: 'You are Siri by Apple. Be witty, friendly and helpful.',
        cortana: 'You are Cortana by Microsoft. Be professional and helpful.',
        bingai: 'You are Bing AI by Microsoft. Be informative and cite sources.',
        bing: 'You are Bing AI by Microsoft. Be informative and cite sources.',
        google: 'You are Google Assistant. Be helpful and accurate.',
        assistant: 'You are Google Assistant. Be helpful and accurate.',
        ai: 'You are a helpful AI assistant. Be friendly and accurate.',
      };

      const persona = personas[cmd] || 'You are a helpful AI assistant.';
      const fullPrompt = `${persona}\n\nUser: ${query}\nAssistant:`;
      const reply = await callFreeAI(fullPrompt);

      if (!reply) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: '❌ AI is currently unavailable. Try again later.'
        }, { quoted: m });
      }

      await m.React("✅");
      return Matrix.sendMessage(m.from, {
        text: `🤖 *${cmd.toUpperCase()}*\n\n${reply}`
      }, { quoted: m });
    }

    // ── GENERATE IMAGE ─────────────────────────────────────────────
    if (action === 'image') {
      if (!query) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: `❌ Please provide a prompt.\nExample: *${prefix}imagine beautiful sunset*`
        }, { quoted: m });
      }

      const imgBuffer = await generateImage(query);

      if (!imgBuffer) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: '❌ Failed to generate image. Try again later.'
        }, { quoted: m });
      }

      await m.React("✅");
      return Matrix.sendMessage(m.from, {
        image: imgBuffer,
        caption: `🎨 *AI Generated Image*\n📝 Prompt: ${query}`
      }, { quoted: m });
    }

    // ── EDIT IMAGE ─────────────────────────────────────────────────
    if (action === 'editimage') {
      const media = await downloadQuoted(m, Matrix);

      if (!media || media.type !== 'imageMessage') {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: `❌ Please reply to an image.\nExample: _(reply to image)_ *${prefix}editimg make it look vintage*`
        }, { quoted: m });
      }

      if (!query) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: `❌ Please provide an edit prompt.\nExample: *${prefix}editimg make it look vintage*`
        }, { quoted: m });
      }

      const edited = await editImageAI(media.buffer, query);

      if (!edited) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: '❌ Failed to edit image. Try again later.'
        }, { quoted: m });
      }

      await m.React("✅");
      return Matrix.sendMessage(m.from, {
        image: edited,
        caption: `✨ *AI Edited Image*\n📝 Edit: ${query}`
      }, { quoted: m });
    }

    // ── GENERATE VIDEO ─────────────────────────────────────────────
    if (action === 'video') {
      if (!query) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: `❌ Please provide a prompt.\nExample: *${prefix}aivideo ocean waves at sunset*`
        }, { quoted: m });
      }

      const imgBuffer = await generateImage(query);

      if (!imgBuffer) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: '❌ Failed to generate video. Try again later.'
        }, { quoted: m });
      }

      await m.React("✅");
      return Matrix.sendMessage(m.from, {
        video: imgBuffer,
        caption: `🎬 *AI Generated Video*\n📝 Prompt: ${query}`,
        gifPlayback: true,
      }, { quoted: m });
    }

    // ── GENERATE SONG / AUDIO ──────────────────────────────────────
    if (action === 'song') {
      if (!query) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: `❌ Please provide a prompt.\nExample: *${prefix}song happy birthday melody*`
        }, { quoted: m });
      }

      const audioBuffer = await generateSong(query);

      if (!audioBuffer) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: '❌ Failed to generate audio. Try again later.'
        }, { quoted: m });
      }

      await m.React("✅");
      return Matrix.sendMessage(m.from, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: false,
      }, { quoted: m });
    }

  } catch (error) {
    console.error(`AI command error [${cmd}]:`, error.message);
    await m.React("❌");
    await Matrix.sendMessage(m.from, {
      text: `❌ Error: ${error.message}`
    }, { quoted: m });
  }
};

export default aibot;
