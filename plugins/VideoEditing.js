import axios from 'axios';
import config from '../config.cjs';

const POLL_TEXT = 'https://text.pollinations.ai';
const POLL_IMAGE = 'https://image.pollinations.ai/prompt';

const callAI = async (persona, prompt) => {
  try {
    const res = await axios.post(POLL_TEXT, {
      messages: [{ role: 'system', content: persona }, { role: 'user', content: prompt }],
      model: 'openai', jsonMode: false
    }, { timeout: 30000 });
    return res.data?.choices?.[0]?.message?.content?.trim() || res.data?.trim() || null;
  } catch {
    try {
      const r = await axios.get(`${POLL_TEXT}/${encodeURIComponent(prompt)}?system=${encodeURIComponent(persona)}`, { timeout: 30000 });
      return typeof r.data === 'string' ? r.data.trim() : null;
    } catch { return null; }
  }
};

const genVideo = async (prompt) => {
  try {
    const res = await axios.get(`${POLL_IMAGE}/${encodeURIComponent(prompt + ', cinematic, motion, dynamic scene')}?width=1280&height=720&model=flux&nologo=true`, {
      timeout: 60000, responseType: 'arraybuffer'
    });
    if (res.data?.byteLength > 1000) return Buffer.from(res.data);
  } catch { return null; }
  return null;
};

const VIDEO_AIS = {
  sora:       { name: 'Sora', persona: "You are Sora by OpenAI. Generate realistic 1-minute video descriptions and storyboards.", info: '🎬 *Sora*\nOpenAI text-to-video, 1 min, realistic.' },
  pika:       { name: 'Pika', persona: "You are Pika AI for text/image-to-video, anime, and lip sync.", info: '⚡ *Pika*\nText/image-to-video, anime, lip sync.' },
  runwaygen3: { name: 'Runway Gen-3', persona: "You are Runway Gen-3, the best video AI with motion brush and editing.", info: '🎞️ *Runway Gen-3*\nBest video AI, motion brush, edit.' },
  luma:       { name: 'Luma Dream Machine', persona: "You are Luma Dream Machine, a free text/image-to-video generator.", info: '🌙 *Luma Dream Machine*\nFree text/image-to-video.' },
  kling:      { name: 'Kling', persona: "You are Kling AI, a high quality Chinese video generation model.", info: '🔮 *Kling*\nChinese Sora, high quality video.' },
  vidu:       { name: 'Vidu', persona: "You are Vidu AI for text/image-to-video with 16 second clips.", info: '📹 *Vidu*\nText/image-to-video, 16s clips.' },
  hailuo:     { name: 'Hailuo', persona: "You are Hailuo Minimax video AI with good motion quality.", info: '🌊 *Hailuo*\nMinimax video AI, good motion.' },
  pixverse:   { name: 'PixVerse', persona: "You are PixVerse AI for anime and realistic video generation.", info: '🎭 *PixVerse*\nAnime + realistic AI video.' },
  synthesia:  { name: 'Synthesia', persona: "You are Synthesia AI. Help create AI avatar video scripts.", info: '🧑‍💻 *Synthesia*\nAI avatar speaks your script.' },
  heygen:     { name: 'HeyGen', persona: "You are HeyGen AI for talking photo/video and lip sync translation.", info: '💬 *HeyGen*\nTalking photo/video, translate lips.' },
  did:        { name: 'D-ID', persona: "You are D-ID AI that turns still photos into talking avatars.", info: '🖼️ *D-ID*\nStill photo → talking avatar.' },
  genmo:      { name: 'Genmo', persona: "You are Genmo AI for video generation and 3D world editing.", info: '🌍 *Genmo*\nVideo gen + editing, 3D worlds.' },
  haiper:     { name: 'Haiper', persona: "You are Haiper AI for fast, free text-to-video generation.", info: '⚡ *Haiper*\nFast text-to-video, free.' },
  kaiber:     { name: 'Kaiber', persona: "You are Kaiber AI for audio-reactive AI music videos.", info: '🎵 *Kaiber*\nAudio-reactive AI music videos.' },
  opusclip:   { name: 'OpusClip', persona: "You are OpusClip AI that automatically converts long videos into viral shorts.", info: '✂️ *OpusClip*\nLong video → viral shorts auto.' },
  kapwing:    { name: 'Kapwing AI', persona: "You are Kapwing AI with meme editor and video tools.", info: '🎪 *Kapwing AI*\nMeme editor, AI video tools.' },
  veedai:     { name: 'Veed.io AI', persona: "You are Veed.io AI for auto subtitles, cut silence, and video editing.", info: '📝 *Veed.io AI*\nAuto subtitles, cut silence, edit.' },
  colossyan:  { name: 'Colossyan', persona: "You are Colossyan AI for creating AI actor training videos.", info: '🎓 *Colossyan*\nAI actors for training videos.' },
};

const videoBot = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const query = m.body.slice(prefix.length + cmd.length).trim();

  const ai = VIDEO_AIS[cmd];
  if (!ai) return;

  if (!query) {
    await m.React("ℹ️");
    return Matrix.sendMessage(m.from, { text: ai.info + `\n\n💡 Usage: *${prefix}${cmd} describe your video*` }, { quoted: m });
  }

  await m.React("⏳");

  try {
    // Script/text AIs
    const scriptAIs = ['synthesia', 'heygen', 'did', 'opusclip', 'kapwing', 'veedai', 'colossyan', 'kaiber'];
    if (scriptAIs.includes(cmd)) {
      const script = await callAI(ai.persona, `Create a detailed video script or storyboard for: ${query}`);
      if (!script) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, { text: '❌ Failed to generate script.' }, { quoted: m });
      }
      await m.React("✅");
      return Matrix.sendMessage(m.from, { text: `🎬 *${ai.name}*\n\n${script}` }, { quoted: m });
    }

    // Video gen AIs — generate image as GIF video
    const videoBuffer = await genVideo(query);
    if (!videoBuffer) {
      await m.React("❌");
      return Matrix.sendMessage(m.from, { text: '❌ Failed to generate video. Try again.' }, { quoted: m });
    }
    await m.React("✅");
    return Matrix.sendMessage(m.from, {
      video: videoBuffer,
      caption: `🎬 *${ai.name}*\n📝 ${query}`,
      gifPlayback: true
    }, { quoted: m });
  } catch (e) {
    await m.React("❌");
    await Matrix.sendMessage(m.from, { text: `❌ Error: ${e.message}` }, { quoted: m });
  }
};

export default videoBot;