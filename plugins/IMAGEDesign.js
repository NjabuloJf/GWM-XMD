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

const genImage = async (prompt, style = '') => {
  try {
    const full = style ? `${prompt}, ${style}` : prompt;
    const res = await axios.get(`${POLL_IMAGE}/${encodeURIComponent(full)}?width=1024&height=1024&model=flux&nologo=true`, {
      timeout: 60000, responseType: 'arraybuffer'
    });
    if (res.data?.byteLength > 1000) return Buffer.from(res.data);
  } catch { return null; }
  return null;
};

const IMAGE_AIS = {
  midjourney:  { name: 'Midjourney', style: 'artistic, highly detailed, professional art', persona: "You are Midjourney AI. Help craft the perfect image prompts for artistic, logos, and anime images.", info: '🎨 *Midjourney*\nBest artistic AI images, logos, anime.' },
  stablediff:  { name: 'Stable Diffusion XL', style: 'photorealistic, high quality', persona: "You are Stable Diffusion XL, an open source image generator.", info: '🌐 *Stable Diffusion XL*\nOpen source image gen, custom models.' },
  firefly:     { name: 'Adobe Firefly', style: 'commercial safe, clean, Adobe style', persona: "You are Adobe Firefly. Generate commercial-safe images with text effects.", info: '🔥 *Firefly*\nAdobe AI, commercial safe, text effects.' },
  ideogram:    { name: 'Ideogram', style: 'with clear readable text, logo design', persona: "You are Ideogram AI, best for text inside images and logos.", info: '✍️ *Ideogram*\nBest AI for text inside images/logos.' },
  leonardoai:  { name: 'Leonardo AI', style: 'consistent characters, detailed', persona: "You are Leonardo AI with free credits for consistent character generation.", info: '🦁 *Leonardo AI*\nFree credits, consistent characters.' },
  playgroundai:{ name: 'Playground AI', style: 'creative, vibrant', persona: "You are Playground AI for free image generation and editing.", info: '🛝 *Playground AI*\nFree SDXL + DALL-E, edit images.' },
  kreaai:      { name: 'Krea AI', style: 'enhanced, real-time canvas style', persona: "You are Krea AI for real-time AI canvas and image enhancement.", info: '🖼️ *Krea AI*\nReal-time AI canvas, enhance images.' },
  scenarioai:  { name: 'Scenario', style: 'game asset, consistent character design', persona: "You are Scenario AI for game assets and consistent AI characters.", info: '🎮 *Scenario*\nGame assets, consistent AI characters.' },
  flux:        { name: 'Flux', style: 'state of the art, ultra detailed', persona: "You are Flux, a new state-of-the-art open source image model.", info: '⚡ *Flux*\nNew SOTA open source image model.' },
  recraft:     { name: 'Recraft', style: 'vector, brand kit, clean design', persona: "You are Recraft AI for vector and raster images with brand kits.", info: '✒️ *Recraft*\nVector + raster AI, brand kits.' },
  remini:      { name: 'Remini', style: 'enhanced, sharp, restored photo', persona: "You are Remini AI for photo enhancement and unblurring old pictures.", info: '✨ *Remini*\nAI photo enhancer, unblur old pics.' },
  lensa:       { name: 'Lensa', style: 'AI avatar, magic portrait, artistic selfie', persona: "You are Lensa AI for AI avatars and magic retouch selfies.", info: '📸 *Lensa*\nAI avatars, magic retouch selfies.' },
  photoroom:   { name: 'PhotoRoom', style: 'clean background removed, product photo', persona: "You are PhotoRoom AI for background removal and product photos.", info: '🏠 *PhotoRoom*\nRemove bg, product photos in 1 tap.' },
  faceapp:     { name: 'FaceApp', style: 'face transformed, age filter, gender swap', persona: "You are FaceApp AI with age filters, gender swap, and makeup effects.", info: '👤 *FaceApp*\nAge filters, gender swap, makeup AI.' },
  wombo:       { name: 'Wombo Dream', style: 'dream art, colorful, mobile art style', persona: "You are Wombo Dream, a free mobile AI art app.", info: '💭 *Wombo Dream*\nFree mobile AI art app.' },
  canvaai:     { name: 'Canva Magic Studio', style: 'social media post, clean design', persona: "You are Canva Magic Studio AI for quick posts and designs.", info: '🖌️ *Canva Magic Studio*\nAI posts, remove bg, write.' },
  lookaai:     { name: 'Looka', style: 'logo, brand identity, professional', persona: "You are Looka AI for logo and brand kit generation.", info: '🏷️ *Looka*\nAI logo + brand kit generator.' },
  figmaai:     { name: 'Figma AI', style: 'UI design, clean interface', persona: "You are Figma AI. Help generate UI designs and components.", info: '🎯 *Figma AI*\nAI inside Figma, generate designs.' },
  frameraai:   { name: 'Framer AI', style: 'website design, modern layout', persona: "You are Framer AI that turns text into full website designs.", info: '🌐 *Framer AI*\nText → full website design.' },
};

const imageDesignBot = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const query = m.body.slice(prefix.length + cmd.length).trim();

  const ai = IMAGE_AIS[cmd];
  if (!ai) return;

  if (!query) {
    await m.React("ℹ️");
    return Matrix.sendMessage(m.from, { text: ai.info + `\n\n💡 Usage: *${prefix}${cmd} describe your image*` }, { quoted: m });
  }

  await m.React("⏳");

  try {
    // Design/text AIs — respond with text advice + generate image
    const textOnlyAIs = ['figmaai', 'frameraai', 'lookaai', 'canvaai'];
    if (textOnlyAIs.includes(cmd)) {
      const advice = await callAI(ai.persona, query);
      const img = await genImage(query, ai.style);

      await m.React("✅");
      if (advice) await Matrix.sendMessage(m.from, { text: `🎨 *${ai.name}*\n\n${advice}` }, { quoted: m });
      if (img) await Matrix.sendMessage(m.from, { image: img, caption: `🖼️ *${ai.name} Preview*\n📝 ${query}` }, { quoted: m });
      return;
    }

    // Image AIs — generate image directly
    const img = await genImage(query, ai.style);
    if (!img) {
      await m.React("❌");
      return Matrix.sendMessage(m.from, { text: '❌ Failed to generate image. Try again.' }, { quoted: m });
    }
    await m.React("✅");
    return Matrix.sendMessage(m.from, { image: img, caption: `🎨 *${ai.name}*\n📝 ${query}` }, { quoted: m });
  } catch (e) {
    await m.React("❌");
    await Matrix.sendMessage(m.from, { text: `❌ Error: ${e.message}` }, { quoted: m });
  }
};

export default imageDesignBot;