import axios from 'axios';
import config from '../config.cjs';

const POLL_TEXT = 'https://text.pollinations.ai';

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

const AGENT_AIS = {
  voiceflow:   { name: 'Voiceflow', persona: "You are Voiceflow. Help build chat/voice AI agents with no-code.", info: '🎙️ *Voiceflow*\nBuild chat/voice AI agents no-code.' },
  zapierai:    { name: 'Zapier AI', persona: "You are Zapier AI. Help connect 6000+ apps with AI automation.", info: '⚡ *Zapier AI*\nConnect 6000+ apps with AI.' },
  makeai:      { name: 'Make.com AI', persona: "You are Make.com AI for visual automation and AI scenarios.", info: '🔧 *Make.com AI*\nVisual automation, AI scenarios.' },
  bardeen:     { name: 'Bardeen AI', persona: "You are Bardeen AI, a browser automation agent.", info: '🌐 *Bardeen AI*\nBrowser automation agent.' },
  lindyai:     { name: 'Lindy AI', persona: "You are Lindy AI, creating AI employees for email and meetings.", info: '👥 *Lindy AI*\nAI employees for email, meetings.' },
  reworkd:     { name: 'Reworkd', persona: "You are Reworkd AI for web scraping with AI agents.", info: '🕷️ *Reworkd*\nWeb scraping agents with AI.' },
  multion:     { name: 'MultiOn', persona: "You are MultiOn AI, an agent that uses your browser to complete tasks.", info: '🤖 *MultiOn*\nAI agent uses your browser.' },
  notionai:    { name: 'Notion AI', persona: "You are Notion AI. Help write, summarize, and answer questions in Notion.", info: '📓 *Notion AI*\nWrite, summarize, Q&A in Notion.' },
  clickupai:   { name: 'ClickUp AI', persona: "You are ClickUp AI for project management automation.", info: '✅ *ClickUp AI*\nProject management AI.' },
  taskadeai:   { name: 'Taskade AI', persona: "You are Taskade AI for mind maps, tasks, and docs.", info: '🗺️ *Taskade AI*\nAI mind maps, tasks, docs.' },
  botpress:    { name: 'BotPress', persona: "You are BotPress, an open source chatbot builder. Help design chatbot flows.", info: '🤖 *BotPress*\nOpen source chatbot builder.' },
  rasa:        { name: 'Rasa', persona: "You are Rasa, an open source conversational AI framework.", info: '💬 *Rasa*\nOpen source conversational AI.' },
  dialogflow:  { name: 'Dialogflow', persona: "You are Dialogflow by Google. Help build chatbots and voice apps.", info: '🌊 *Dialogflow*\nGoogle\'s chatbot platform.' },
  manychat:    { name: 'ManyChat AI', persona: "You are ManyChat AI for Instagram, WhatsApp, and Messenger bots.", info: '📱 *ManyChat AI*\nInstagram/WhatsApp/Messenger bots.' },
  tidioai:     { name: 'Tidio AI', persona: "You are Tidio AI, an e-commerce chatbot with live chat.", info: '🛒 *Tidio AI*\nE-commerce chatbot + live chat.' },
  wati:        { name: 'Wati AI', persona: "You are Wati AI for WhatsApp Business API and chatbots.", info: '💚 *Wati AI*\nWhatsApp Business API + chatbot.' },
  inworldai:   { name: 'Inworld AI', persona: "You are Inworld AI for creating AI NPCs for games and metaverse.", info: '🎮 *Inworld AI*\nAI NPCs for games/metaverse.' },
  convai:      { name: 'Convai', persona: "You are Convai for talking AI characters in games.", info: '🗣️ *Convai*\nTalking AI characters for games.' },
  krispai:     { name: 'Krisp AI', persona: "You are Krisp AI for removing background noise on calls.", info: '🔇 *Krisp AI*\nRemove background noise on calls.' },
  otterai:     { name: 'Otter.ai', persona: "You are Otter.ai for recording and transcribing meetings.", info: '🦦 *Otter.ai*\nRecord + transcribe meetings.' },
  firefliesai: { name: 'Fireflies.ai', persona: "You are Fireflies.ai, a meeting bot that takes notes and summaries.", info: '✨ *Fireflies.ai*\nMeeting bot, notes, summary.' },
};

const agentBot = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const query = m.body.slice(prefix.length + cmd.length).trim();

  const ai = AGENT_AIS[cmd];
  if (!ai) return;

  if (!query) {
    await m.React("ℹ️");
    return Matrix.sendMessage(m.from, { text: ai.info + `\n\n💡 Usage: *${prefix}${cmd} your question*` }, { quoted: m });
  }

  await m.React("⏳");

  try {
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

export default agentBot;
