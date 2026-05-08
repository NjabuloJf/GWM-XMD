import axios from 'axios';
import config from '../config.cjs';

const POLL_TEXT = 'https://text.pollinations.ai';
const POLL_IMAGE = 'https://image.pollinations.ai/prompt';

const callAI = async (persona, prompt) => {
  try {
    const res = await axios.post(POLL_TEXT, {
      messages: [
        { role: 'system', content: persona },
        { role: 'user', content: prompt }
      ],
      model: 'openai',
      jsonMode: false
    }, { timeout: 30000 });
    return res.data?.choices?.[0]?.message?.content?.trim() || res.data?.trim() || null;
  } catch (e) {
    try {
      const res2 = await axios.get(`${POLL_TEXT}/${encodeURIComponent(prompt)}?model=openai&system=${encodeURIComponent(persona)}`, { timeout: 30000 });
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

const AI_INFO = {
  metaai:    { name: 'Meta AI', persona: "You are Meta AI by Meta. You help with chat, search, image generation, code, and WhatsApp assistance. Be friendly and helpful.", info: '🤖 *Meta AI*\nAll-in-one chat, search, image, code, WhatsApp help by Meta.' },
  llama:     { name: 'LLaMA', persona: "You are LLaMA, Meta's open source AI model. Be helpful, concise and powerful.", info: '🦙 *LLaMA*\nOpen source AI models by Meta for building your own bots.' },
  codellama: { name: 'Code Llama 70B', persona: "You are Code Llama 70B by Meta. You specialize in fixing JS/Python bugs and writing clean code.", info: '💻 *Code Llama 70B*\nMeta\'s code model, fixes JS/Python bugs.' },
  chatgpt:   { name: 'ChatGPT', persona: "You are ChatGPT by OpenAI. Help with writing, coding, math, ideas, analysis, and homework.", info: '🧠 *ChatGPT*\nWriting, coding, math, ideas, analysis, homework by OpenAI.' },
  gpt5:      { name: 'GPT-5', persona: "You are GPT-5, OpenAI's latest and most powerful model. You excel at planning apps and long context coding.", info: '🚀 *GPT-5*\nLatest OpenAI model, plans apps, long context coding.' },
  dalle:     { name: 'DALL-E 3', persona: "You are DALL-E 3 by OpenAI. You generate images from prompts with great detail.", info: '🎨 *DALL-E 3*\nImage gen inside ChatGPT, follows prompts well.' },
  copilot:   { name: 'Microsoft Copilot', persona: "You are Microsoft Copilot. You assist with coding in VSCode, documents in Office, and Windows tasks.", info: '🪟 *Copilot*\nMicrosoft AI in Windows/Office/VSCode, coding + docs.' },
  codewhisperer: { name: 'CodeWhisperer', persona: "You are Amazon CodeWhisperer. You autocomplete code for AWS and JavaScript projects.", info: '☁️ *CodeWhisperer*\nAmazon\'s code autocomplete for AWS/JS.' },
  msdesigner:{ name: 'Microsoft Designer', persona: "You are Microsoft Designer AI. Help create posters, social media posts, and AI graphics.", info: '🎭 *Microsoft Designer*\nMake posters, posts, AI graphics with Microsoft AI.' },
  amazonq:   { name: 'Amazon Q', persona: "You are Amazon Q, a business AI for AWS, data analysis, and company documents.", info: '📊 *Amazon Q*\nBusiness AI for AWS, data, company docs by Amazon.' },
  alexa:     { name: 'Alexa+', persona: "You are Alexa+ by Amazon. Help with smart home commands, shopping, and music.", info: '🔊 *Alexa+*\nSmart home, voice commands, shopping, music by Amazon.' },
  bixby:     { name: 'Bixby', persona: "You are Bixby by Samsung. You control Samsung devices and phone functions.", info: '📱 *Bixby*\nSamsung phone assistant, device control.' },
  erniebot:  { name: 'Ernie Bot', persona: "You are Ernie Bot by Baidu. You assist with Chinese search and chat queries.", info: '🇨🇳 *Ernie Bot*\nBaidu\'s Chinese AI, search + chat.' },
  siri:      { name: 'Siri', persona: "You are Siri by Apple. Be witty and helpful. Assist with iPhone tasks, and Apple Intelligence features.", info: '🍎 *Siri*\niPhone voice assistant, image/video/song via Apple Intelligence.' },
};

const bigtechBot = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const query = m.body.slice(prefix.length + cmd.length).trim();

  const ai = AI_INFO[cmd];
  if (!ai) return;

  if (!query) {
    await m.React("ℹ️");
    return Matrix.sendMessage(m.from, { text: ai.info + `\n\n💡 Usage: *${prefix}${cmd} your question*` }, { quoted: m });
  }

  await m.React("⏳");

  try {
    // Special image command for dalle
    if (cmd === 'dalle') {
      const img = await genImage(query);
      if (!img) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, { text: '❌ Failed to generate image.' }, { quoted: m });
      }
      await m.React("✅");
      return Matrix.sendMessage(m.from, { image: img, caption: `🎨 *DALL-E 3*\n📝 ${query}` }, { quoted: m });
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

export default bigtechBot;