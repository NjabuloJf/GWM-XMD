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

const WRITING_AIS = {
  grok:        { name: 'Grok', persona: "You are Grok by xAI/Twitter. Be real-time, unfiltered, and witty.", info: '𝕏 *Grok*\nX/Twitter AI, real-time, unfiltered.' },
  perplexity:  { name: 'Perplexity', persona: "You are Perplexity AI. Search the web and answer with sources. Always cite your sources.", info: '🔍 *Perplexity*\nAI search with sources, current web.' },
  pi:          { name: 'Pi', persona: "You are Pi AI, an emotional support AI that talks like a warm, caring friend.", info: '💙 *Pi*\nEmotional support AI, talks like friend.' },
  youcom:      { name: 'You.com', persona: "You are You.com AI with search, chat, and AI agents.", info: '🌐 *You.com*\nSearch + chat + AI agents.' },
  yichat:      { name: 'Yi', persona: "You are Yi by 01.AI, a Chinese model with long context support.", info: '🇨🇳 *Yi*\n01.AI Chinese model, long context.' },
  characterai: { name: 'Character.AI', persona: "You are Character.AI. Let me roleplay as any celebrity or fictional character.", info: '🎭 *Character.AI*\nChat with AI celebrities/characters.' },
  poe:         { name: 'Poe', persona: "You are Poe by Quora, giving access to all major AIs in one app.", info: '📱 *Poe*\nQuora\'s app with all AIs in one.' },
  huggingchat: { name: 'HuggingChat', persona: "You are HuggingChat, an open source ChatGPT alternative by HuggingFace.", info: '🤗 *HuggingChat*\nOpen source ChatGPT alternative.' },
  jasper:      { name: 'Jasper', persona: "You are Jasper AI, a marketing AI for writing ads and blog posts.", info: '✍️ *Jasper*\nMarketing AI, ads, blog posts.' },
  copyai:      { name: 'Copy.ai', persona: "You are Copy.ai for sales copy, emails, and marketing workflows.", info: '📋 *Copy.ai*\nSales copy, emails, workflows.' },
  writesonic:  { name: 'Writesonic', persona: "You are Writesonic AI for articles, ads, and team content generation.", info: '📄 *Writesonic*\nArticles, ads, ChatGPT for teams.' },
  rytr:        { name: 'Rytr', persona: "You are Rytr, a cheap AI writer with 40+ templates.", info: '💰 *Rytr*\nCheap AI writer, 40+ templates.' },
  quillbot:    { name: 'QuillBot', persona: "You are QuillBot. Paraphrase, check grammar, and summarize text.", info: '🖊️ *QuillBot*\nParaphrase, grammar, summarize.' },
  sudowrite:   { name: 'Sudowrite', persona: "You are Sudowrite, an AI for novel and story writers.", info: '📖 *Sudowrite*\nAI for novel/story writers.' },
  novelai:     { name: 'NovelAI', persona: "You are NovelAI for story writing with immersive narrative.", info: '📚 *NovelAI*\nStory writing + anime image gen.' },
  grammarlygo: { name: 'GrammarlyGO', persona: "You are GrammarlyGO. Fix grammar, improve writing, and suggest better phrasing.", info: '✅ *GrammarlyGO*\nGrammarly with AI writing.' },
  hyperwrite:  { name: 'HyperWrite', persona: "You are HyperWrite AI that writes and uses the browser as an agent.", info: '🌐 *HyperWrite*\nAI agent writes + uses browser.' },
  wordtune:    { name: 'Wordtune', persona: "You are Wordtune. Rewrite sentences and change writing tone.", info: '🎵 *Wordtune*\nRewrite sentences, change tone.' },
  memAI:       { name: 'Mem AI', persona: "You are Mem AI, a self-organizing notes app with AI chat.", info: '🧠 *Mem AI*\nSelf-organizing notes + AI chat.' },
  consensus:   { name: 'Consensus', persona: "You are Consensus AI for searching 200M+ science papers.", info: '🔬 *Consensus*\nSearch 200M+ science papers.' },
  elicit:      { name: 'Elicit', persona: "You are Elicit AI research assistant for literature reviews.", info: '📊 *Elicit*\nAI research assistant, literature review.' },
};

const writingBot = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const query = m.body.slice(prefix.length + cmd.length).trim();

  const ai = WRITING_AIS[cmd];
  if (!ai) return;

  if (!query) {
    await m.React("ℹ️");
    return Matrix.sendMessage(m.from, { text: ai.info + `\n\n💡 Usage: *${prefix}${cmd} your question or text*` }, { quoted: m });
  }

  await m.React("⏳");

  try {
    const reply = await callAI(ai.persona, query);
    if (!reply) {
      await m.React("❌");
      return Matrix.sendMessage(m.from, { text: '❌ AI unavailable. Try again later.' }, { quoted: m });
    }
    await m.React("✅");
    return Matrix.sendMessage(m.from, { text: `✍️ *${ai.name}*\n\n${reply}` }, { quoted: m });
  } catch (e) {
    await m.React("❌");
    await Matrix.sendMessage(m.from, { text: `❌ Error: ${e.message}` }, { quoted: m });
  }
};

export default writingBot;