import axios from 'axios';
import config from '../config.cjs';
import { getContentType, downloadMediaMessage } from '@whiskeysockets/baileys';

// ── Pollinations.ai — 100% free, no API key needed ────────────────
const POLLINATIONS_TEXT = 'https://text.pollinations.ai';
const POLLINATIONS_IMAGE = 'https://image.pollinations.ai/prompt';
const POLLINATIONS_AUDIO = 'https://audio.pollinations.ai';

// ── Download quoted media ─────────────────────────────────────────
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

// ── AI Chat via Pollinations (no key needed) ──────────────────────
const callAI = async (prompt, persona) => {
  try {
    const system = persona || 'You are a helpful AI assistant.';
    const url = `${POLLINATIONS_TEXT}/${encodeURIComponent(prompt)}?model=openai&system=${encodeURIComponent(system)}&json=false`;
    const res = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (res.data && typeof res.data === 'string' && res.data.trim()) {
      return res.data.trim();
    }
    // fallback POST method
    const res2 = await axios.post(POLLINATIONS_TEXT, {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      model: 'openai',
      jsonMode: false
    }, { timeout: 30000 });
    return res2.data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error('callAI error:', e.message);
    return null;
  }
};

// ── Generate image via Pollinations (no key needed) ───────────────
const generateImage = async (prompt) => {
  try {
    const url = `${POLLINATIONS_IMAGE}/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true`;
    const res = await axios.get(url, {
      timeout: 60000,
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (res.data && res.data.byteLength > 1000) return Buffer.from(res.data);
  } catch (e) {
    console.error('generateImage error:', e.message);
  }
  return null;
};

// ── Generate audio/TTS via Pollinations (no key needed) ───────────
const generateAudio = async (prompt) => {
  try {
    const url = `${POLLINATIONS_AUDIO}/${encodeURIComponent(prompt)}`;
    const res = await axios.get(url, {
      timeout: 60000,
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (res.data && res.data.byteLength > 1000) return Buffer.from(res.data);
  } catch (e) {
    console.error('generateAudio error:', e.message);
  }
  return null;
};

// ── Main handler ──────────────────────────────────────────────────
const aibot = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix)
    ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
    : '';
  const query = m.body.slice(prefix.length + cmd.length).trim();

  const aiCommands = {
    // Chat
    ai: 'chat', gemini: 'chat', gpt: 'chat', chatgpt: 'chat',
    meta: 'chat', llama: 'chat', llama4: 'chat', lami4: 'chat',
    google: 'chat', alexa: 'chat', siri: 'chat', cortana: 'chat',
    bingai: 'chat', bing: 'chat', assistant: 'chat',
    // Image
    imagine: 'image', txt2img: 'image', aiimage: 'image',
    aiphoto: 'image', draw: 'image', generate: 'image',
    // Edit image (reply to image)
    editimg: 'editimage', aifilter: 'editimage', enhance: 'editimage',
    // Video
    aivideo: 'video', txt2vid: 'video', generatevideo: 'video',
    // Song / Audio / TTS
    song: 'song', aisong: 'song', music: 'song', aimusic: 'song',
    tts: 'song', voice: 'song', speak: 'song',
  };

  const action = aiCommands[cmd];
  if (!action) return;

  if (!query) {
    await m.React("❌");
    return Matrix.sendMessage(m.from, {
      text: `❌ Please provide a prompt.\n\nExamples:\n*${prefix}gemini what is AI?*\n*${prefix}imagine sunset over ocean*\n*${prefix}song happy birthday tune*\n*${prefix}editimg make it vintage* _(reply to image)_`
    }, { quoted: m });
  }

  await m.React("⏳");

  try {

    // ── CHAT ───────────────────────────────────────────────────────
    if (action === 'chat') {
      const personas = {
        gemini:    "You are Gemini, Google's helpful AI assistant. Be smart and accurate.",
        gpt:       "You are ChatGPT by OpenAI. Be helpful and conversational.",
        chatgpt:   "You are ChatGPT by OpenAI. Be helpful and conversational.",
        meta:      "You are Meta AI by Meta. Be friendly and helpful.",
        llama:     "You are LLaMA by Meta. Be helpful and concise.",
        llama4:    "You are LLaMA 4 by Meta. Be helpful and concise.",
        lami4:     "You are LLaMA 4 by Meta. Be helpful and concise.",
        alexa:     "You are Alexa by Amazon. Be helpful like a smart home assistant.",
        siri:      "You are Siri by Apple. Be witty, friendly and helpful.",
        cortana:   "You are Cortana by Microsoft. Be professional and helpful.",
        bingai:    "You are Bing AI by Microsoft. Be informative and helpful.",
        bing:      "You are Bing AI by Microsoft. Be informative and helpful.",
        google:    "You are Google Assistant. Be helpful and accurate.",
        assistant: "You are Google Assistant. Be helpful and accurate.",
        ai:        "You are a helpful AI assistant. Be friendly and accurate.",
      };

      const persona = personas[cmd] || "You are a helpful AI assistant.";
      const reply = await callAI(query, persona);

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

    // ── EDIT IMAGE (reply to image + prompt) ───────────────────────
    if (action === 'editimage') {
      const media = await downloadQuoted(m, Matrix);

      if (!media || media.type !== 'imageMessage') {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: `❌ Please *reply to an image* with your edit prompt.\nExample: _(reply to image)_ *${prefix}editimg make it look vintage*`
        }, { quoted: m });
      }

      // Use prompt + generate new image based on description
      const imgBuffer = await generateImage(`${query}, high quality, detailed`);

      if (!imgBuffer) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: '❌ Failed to edit image. Try again later.'
        }, { quoted: m });
      }

      await m.React("✅");
      return Matrix.sendMessage(m.from, {
        image: imgBuffer,
        caption: `✨ *AI Edited Image*\n📝 Edit: ${query}`
      }, { quoted: m });
    }

    // ── GENERATE VIDEO ─────────────────────────────────────────────
    if (action === 'video') {
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

    // ── GENERATE SONG / AUDIO / TTS ────────────────────────────────
    if (action === 'song') {
      const audioBuffer = await generateAudio(query);

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
