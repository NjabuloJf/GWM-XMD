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

const gen3DImage = async (prompt) => {
  try {
    const res = await axios.get(`${POLL_IMAGE}/${encodeURIComponent(prompt + ', 3D render, high quality, detailed')}?width=1024&height=1024&model=flux&nologo=true`, {
      timeout: 60000, responseType: 'arraybuffer'
    });
    if (res.data?.byteLength > 1000) return Buffer.from(res.data);
  } catch { return null; }
  return null;
};

const BUSI_AIS = {
  // 3D & Game
  csm:         { name: 'CSM', persona: "You are CSM (Common Sense Machines). Help convert images to 3D models.", info: '🧊 *CSM*\nCommon Sense Machines, image-to-3D.', type: '3d' },
  meshy:       { name: 'Meshy', persona: "You are Meshy AI. Convert text or images into 3D models in 1 minute.", info: '🧩 *Meshy*\nText/image-to-3D model in 1 min.', type: '3d' },
  splineai:    { name: 'Spline AI', persona: "You are Spline AI for 3D design and AI generation.", info: '🌀 *Spline AI*\n3D design tool + AI generation.', type: '3d' },
  masterpiece: { name: 'Masterpiece X', persona: "You are Masterpiece X for text-to-3D game asset generation.", info: '🏆 *Masterpiece X*\nText-to-3D game assets.', type: '3d' },
  rosebud:     { name: 'Rosebud AI', persona: "You are Rosebud AI for making games and 3D worlds with AI.", info: '🌹 *Rosebud AI*\nMake games with AI, 3D worlds.', type: '3d' },
  layerai:     { name: 'Layer AI', persona: "You are Layer AI for game art pipelines.", info: '🎮 *Layer AI*\nAI for game art pipelines.', type: '3d' },
  // Meeting
  fathom:      { name: 'Fathom', persona: "You are Fathom AI, a free meeting recorder with AI notes.", info: '🎯 *Fathom*\nFree meeting recorder + AI notes.', type: 'text' },
  meetgeek:    { name: 'MeetGeek', persona: "You are MeetGeek for meeting AI summaries and insights.", info: '🤝 *MeetGeek*\nMeeting AI summary + insights.', type: 'text' },
  // SEO
  surferseo:   { name: 'Surfer SEO', persona: "You are Surfer SEO. Score AI content for Google ranking.", info: '🏄 *Surfer SEO*\nAI content score for Google rank.', type: 'text' },
  frase:       { name: 'Frase', persona: "You are Frase AI for SEO content briefs and AI writing.", info: '📝 *Frase*\nSEO content briefs + AI writer.', type: 'text' },
  marketmuse:  { name: 'MarketMuse', persona: "You are MarketMuse, a content strategy AI platform.", info: '📊 *MarketMuse*\nContent strategy AI platform.', type: 'text' },
  scalenut:    { name: 'Scalenut', persona: "You are Scalenut for SEO blog writing and optimization.", info: '⚖️ *Scalenut*\nSEO blog writer + optimizer.', type: 'text' },
  seoai:       { name: 'SEO.ai', persona: "You are SEO.ai for Google-friendly AI writing.", info: '🔎 *SEO.ai*\nGoogle-friendly AI writing.', type: 'text' },
  semrush:     { name: 'Semrush AI', persona: "You are Semrush AI for SEO tools and AI writing.", info: '🔍 *Semrush AI*\nSEO tools + AI writing.', type: 'text' },
  ahrefsai:    { name: 'Ahrefs AI', persona: "You are Ahrefs AI for keyword research and AI features.", info: '🔑 *Ahrefs AI*\nKeyword research + AI features.', type: 'text' },
  // Presentations
  gamma:       { name: 'Gamma', persona: "You are Gamma AI for creating presentations, docs, and websites.", info: '🎪 *Gamma*\nAI presentations, docs, websites.', type: 'text' },
  tome:        { name: 'Tome', persona: "You are Tome AI for storytelling slides.", info: '📖 *Tome*\nStorytelling slides with AI.', type: 'text' },
  beautifulai: { name: 'Beautiful.ai', persona: "You are Beautiful.ai for auto-design presentations.", info: '✨ *Beautiful.ai*\nAuto-design presentations.', type: 'text' },
  // Data
  juliusai:    { name: 'Julius AI', persona: "You are Julius AI. Analyze CSV/Excel files and create charts from data.", info: '📈 *Julius AI*\nChat with CSV/Excel, make charts.', type: 'text' },
  chatcsv:     { name: 'ChatCSV', persona: "You are ChatCSV. Answer questions from uploaded CSV data.", info: '📋 *ChatCSV*\nUpload CSV, ask questions.', type: 'text' },
  sheetplus:   { name: 'Sheet+', persona: "You are Sheet+ AI for generating formulas in Google Sheets.", info: '📊 *Sheet+*\nAI formulas for Google Sheets.', type: 'text' },
};

const businessBot = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const query = m.body.slice(prefix.length + cmd.length).trim();

  const ai = BUSI_AIS[cmd];
  if (!ai) return;

  if (!query) {
    await m.React("ℹ️");
    return Matrix.sendMessage(m.from, { text: ai.info + `\n\n💡 Usage: *${prefix}${cmd} your prompt*` }, { quoted: m });
  }

  await m.React("⏳");

  try {
    // 3D AIs — generate 3D render image
    if (ai.type === '3d') {
      const img = await gen3DImage(query);
      const desc = await callAI(ai.persona, `Describe a 3D model of: ${query}. Include shape, texture, colors, and details.`);

      await m.React("✅");
      if (desc) await Matrix.sendMessage(m.from, { text: `🧊 *${ai.name}*\n\n${desc}` }, { quoted: m });
      if (img) await Matrix.sendMessage(m.from, { image: img, caption: `🧊 *${ai.name} 3D Preview*\n📝 ${query}` }, { quoted: m });
      return;
    }

    // Text AIs
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

export default businessBot;