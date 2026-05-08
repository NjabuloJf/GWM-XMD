import axios from 'axios';
import config from '../config.cjs';

const POLL_TEXT = 'https://text.pollinations.ai';
const POLL_IMAGE = 'https://image.pollinations.ai/prompt';
const POLL_AUDIO = 'https://audio.pollinations.ai';

const callAI = async (persona, prompt) => {
  try {
    const res = await axios.post(POLL_TEXT, {
      messages: [
        { role: 'system', content: persona },
        { role: 'user', content: prompt }
      ],
      model: 'openai', jsonMode: false
    }, { timeout: 30000 });
    return res.data?.choices?.[0]?.message?.content?.trim() || res.data?.trim() || null;
  } catch {
    try {
      const res2 = await axios.get(`${POLL_TEXT}/${encodeURIComponent(prompt)}?system=${encodeURIComponent(persona)}`, { timeout: 30000 });
      return typeof res2.data === 'string' ? res2.data.trim() : null;
    } catch { return null; }
  }
};

const genImage = async (prompt) => {
  try {
    const res = await axios.get(`${POLL_IMAGE}/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true`, {
      timeout: 60000, responseType: 'arraybuffer'
    });
    if (res.data?.byteLength > 1000) return Buffer.from(res.data);
  } catch { return null; }
  return null;
};

const genAudio = async (text) => {
  try {
    const res = await axios.get(`${POLL_AUDIO}/${encodeURIComponent(text)}`, {
      timeout: 60000, responseType: 'arraybuffer'
    });
    if (res.data?.byteLength > 1000) return Buffer.from(res.data);
  } catch { return null; }
  return null;
};

const GOOGLE_AIS = {
  gemini:       { name: 'Gemini', persona: "You are Gemini, Google's main AI. Help with search, YouTube, Gmail, and image tasks. Be smart and accurate.", info: '✨ *Gemini*\nGoogle\'s main AI, search + YouTube + Gmail + image.' },
  geminipro:    { name: 'Gemini Pro', persona: "You are Gemini Pro by Google. You are a faster, developer-focused version of Gemini with API access.", info: '⚡ *Gemini Pro*\nFaster Gemini for devs, API access.' },
  geminilive:   { name: 'Gemini Live', persona: "You are Gemini Live by Google. You specialize in real-time voice conversations.", info: '🎙️ *Gemini Live*\nVoice chat with Gemini, real-time talk.' },
  geminitts:    { name: 'Gemini TTS', persona: "You are Google TTS. Convert text to natural speech.", info: '🔊 *Gemini TTS*\nGoogle text-to-speech voices.' },
  googleassist: { name: 'Google Assistant', persona: "You are Google Assistant. Help with voice commands, smart home, and quick answers.", info: '🏠 *Google Assistant*\nOld Google voice assistant, smart home.' },
  notebooklm:   { name: 'NotebookLM', persona: "You are NotebookLM by Google. You chat with PDFs, YouTube videos, and research documents.", info: '📓 *NotebookLM*\nChat with PDFs, YouTube, docs, research.' },
  googlestudio: { name: 'Google AI Studio', persona: "You are Google AI Studio. Help developers build apps using the Gemini API for free.", info: '🛠️ *Google AI Studio*\nBuild apps with Gemini API, free.' },
  veo:          { name: 'Veo', persona: "You are Veo by Google. You generate high quality videos from text descriptions.", info: '🎬 *Veo*\nGoogle text-to-video, Sora competitor.' },
  imagen:       { name: 'Imagen 3', persona: "You are Imagen 3 by Google. You generate stunning, photorealistic images from text.", info: '🖼️ *Imagen 3*\nGoogle\'s best image generator.' },
};

const googleAIBot = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const query = m.body.slice(prefix.length + cmd.length).trim();

  const ai = GOOGLE_AIS[cmd];
  if (!ai) return;

  if (!query) {
    await m.React("ℹ️");
    return Matrix.sendMessage(m.from, { text: ai.info + `\n\n💡 Usage: *${prefix}${cmd} your question*` }, { quoted: m });
  }

  await m.React("⏳");

  try {
    if (cmd === 'imagen' || cmd === 'veo') {
      const img = await genImage(query);
      if (!img) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, { text: '❌ Failed to generate.' }, { quoted: m });
      }
      await m.React("✅");
      return Matrix.sendMessage(m.from, {
        image: img,
        caption: `🖼️ *${ai.name}*\n📝 ${query}`
      }, { quoted: m });
    }

    if (cmd === 'geminitts') {
      const audio = await genAudio(query);
      if (!audio) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, { text: '❌ Failed to generate speech.' }, { quoted: m });
      }
      await m.React("✅");
      return Matrix.sendMessage(m.from, { audio, mimetype: 'audio/mpeg', ptt: false }, { quoted: m });
    }

    const reply = await callAI(ai.persona, query);
    if (!reply) {
      await m.React("❌");
      return Matrix.sendMessage(m.from, { text: '❌ AI unavailable. Try again later.' }, { quoted: m });
    }
    await m.React("✅");
    return Matrix.sendMessage(m.from, { text: `🤖 *${ai.name}*\n\n${reply}` }, { quoted: m });
  } catch (e) {
    await m.React("❌");
    await Matrix.sendMessage(m.from, { text: `❌ Error: ${e.message}` }, { quoted: m });
  }
};

export default googleAIBot;