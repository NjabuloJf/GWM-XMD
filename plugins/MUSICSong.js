import axios from 'axios';
import config from '../config.cjs';

const POLL_TEXT = 'https://text.pollinations.ai';
const POLL_AUDIO = 'https://audio.pollinations.ai';

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

const genAudio = async (text) => {
  try {
    const res = await axios.get(`${POLL_AUDIO}/${encodeURIComponent(text)}`, {
      timeout: 60000, responseType: 'arraybuffer'
    });
    if (res.data?.byteLength > 1000) return Buffer.from(res.data);
  } catch { return null; }
  return null;
};

const MUSIC_AIS = {
  suno:        { name: 'Suno', persona: "You are Suno AI. Generate full song lyrics with structure (verse, chorus, bridge) based on prompts.", info: '🎵 *Suno*\nText → full song with vocals, 2 min.' },
  udio:        { name: 'Udio', persona: "You are Udio AI, specializing in high quality AI music with beats and vocals.", info: '🎶 *Udio*\nHigh quality AI music, beat + vocals.' },
  riffusion:   { name: 'Riffusion', persona: "You are Riffusion, real-time AI music spectrogram generator.", info: '🌊 *Riffusion*\nReal-time AI music spectrograms.' },
  soundraw:    { name: 'Soundraw', persona: "You are Soundraw, generating royalty-free AI music for videos.", info: '🎼 *Soundraw*\nRoyalty-free AI music for videos.' },
  boomy:       { name: 'Boomy', persona: "You are Boomy AI. Help create and release songs to Spotify automatically.", info: '🎤 *Boomy*\nMake + release songs to Spotify auto.' },
  aiva:        { name: 'AIVA', persona: "You are AIVA, an AI composer specializing in game and film scores.", info: '🎻 *AIVA*\nAI composer for games/film scores.' },
  loudly:      { name: 'Loudly', persona: "You are Loudly AI, generating music library content for content creators.", info: '📢 *Loudly*\nAI music library for content creators.' },
  mubert:      { name: 'Mubert', persona: "You are Mubert AI, streaming royalty-free music via API.", info: '🎧 *Mubert*\nAI royalty-free music streams/API.' },
  stableaudio: { name: 'Stable Audio', persona: "You are Stable Audio by Stability AI for text-to-music generation.", info: '🔊 *Stable Audio*\nStability AI text-to-music.' },
  musicgen:    { name: 'MusicGen', persona: "You are MusicGen by Meta, an open source music generation model.", info: '🎹 *MusicGen*\nMeta\'s open source music model.' },
  elevenlabs:  { name: 'ElevenLabs', persona: "You are ElevenLabs, the best AI voice cloning and TTS platform. Generate voice scripts.", info: '🗣️ *ElevenLabs*\nBest AI voice cloning + TTS.' },
  playht:      { name: 'PlayHT', persona: "You are PlayHT with 900+ ultra-realistic TTS voices.", info: '▶️ *PlayHT*\nUltra-realistic TTS, 900+ voices.' },
  murfai:      { name: 'Murf AI', persona: "You are Murf AI, a studio TTS platform with multiple voice styles.", info: '🎙️ *Murf AI*\nStudio TTS with voice styles.' },
  resembleai:  { name: 'Resemble AI', persona: "You are Resemble AI, real-time voice cloning API.", info: '🔄 *Resemble AI*\nReal-time voice cloning API.' },
  lovoai:      { name: 'Lovo AI', persona: "You are Lovo AI, combining TTS with AI video avatar voices.", info: '🤖 *Lovo AI*\nTTS + AI video avatar voices.' },
  descript:    { name: 'Descript Overdub', persona: "You are Descript Overdub. Help clone voices for audio/video editing.", info: '✂️ *Descript Overdub*\nClone your voice for edits.' },
  adobepodcast:{ name: 'Adobe Podcast AI', persona: "You are Adobe Podcast AI. Help clean audio, remove echo and background noise.", info: '🎚️ *Adobe Podcast AI*\nClean audio, remove echo/noise.' },
  podcastle:   { name: 'Podcastle', persona: "You are Podcastle AI. Help record and edit podcasts.", info: '🏰 *Podcastle*\nRecord + edit podcasts with AI.' },
  riversideai: { name: 'Riverside AI', persona: "You are Riverside AI for studio-quality recording and AI show notes.", info: '🎬 *Riverside AI*\nStudio recording + AI show notes.' },
  cleanvoice:  { name: 'Cleanvoice', persona: "You are Cleanvoice AI. Remove filler words and mouth sounds from recordings.", info: '🧹 *Cleanvoice*\nRemove filler words, mouth sounds.' },
  auphonic:    { name: 'Auphonic', persona: "You are Auphonic AI for automatic audio post-production.", info: '⚙️ *Auphonic*\nAuto audio post-production.' },
};

const musicBot = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const query = m.body.slice(prefix.length + cmd.length).trim();

  const ai = MUSIC_AIS[cmd];
  if (!ai) return;

  if (!query) {
    await m.React("ℹ️");
    return Matrix.sendMessage(m.from, { text: ai.info + `\n\n💡 Usage: *${prefix}${cmd} your prompt*` }, { quoted: m });
  }

  await m.React("⏳");

  try {
    // TTS/voice commands — generate real audio
    const ttsCommands = ['elevenlabs', 'playht', 'murfai', 'resembleai', 'lovoai', 'cleanvoice', 'auphonic', 'adobepodcast'];
    if (ttsCommands.includes(cmd)) {
      const audio = await genAudio(query);
      if (!audio) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, { text: '❌ Failed to generate audio.' }, { quoted: m });
      }
      await m.React("✅");
      return Matrix.sendMessage(m.from, { audio, mimetype: 'audio/mpeg', ptt: false }, { quoted: m });
    }

    // Song/music commands — generate lyrics + audio
    const songCommands = ['suno', 'udio', 'riffusion', 'boomy', 'aiva', 'musicgen', 'soundraw', 'loudly', 'mubert', 'stableaudio'];
    if (songCommands.includes(cmd)) {
      const lyricsPrompt = `Write full song lyrics for: "${query}". Include [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro] sections.`;
      const lyrics = await callAI(ai.persona, lyricsPrompt);
      const audio = await genAudio(query + ' music melody');

      await m.React("✅");

      if (lyrics) {
        await Matrix.sendMessage(m.from, { text: `🎵 *${ai.name} - Song Lyrics*\n\n${lyrics}` }, { quoted: m });
      }
      if (audio) {
        await Matrix.sendMessage(m.from, { audio, mimetype: 'audio/mpeg', ptt: false }, { quoted: m });
      }
      if (!lyrics && !audio) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, { text: '❌ Failed to generate song.' }, { quoted: m });
      }
      return;
    }

    const reply = await callAI(ai.persona, query);
    if (!reply) {
      await m.React("❌");
      return Matrix.sendMessage(m.from, { text: '❌ AI unavailable. Try again later.' }, { quoted: m });
    }
    await m.React("✅");
    return Matrix.sendMessage(m.from, { text: `🎵 *${ai.name}*\n\n${reply}` }, { quoted: m });
  } catch (e) {
    await m.React("❌");
    await Matrix.sendMessage(m.from, { text: `❌ Error: ${e.message}` }, { quoted: m });
  }
};

export default musicBot;