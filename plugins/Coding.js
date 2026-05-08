import axios from 'axios';
import config from '../config.cjs';

const POLL_TEXT = 'https://text.pollinations.ai';

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

const CODING_AIS = {
  cursor:      { name: 'Cursor', persona: "You are Cursor AI, the #1 AI code editor. Help build full WhatsApp bots and complete projects.", info: '⌨️ *Cursor*\n#1 AI code editor, builds full WhatsApp bots.' },
  codeium:     { name: 'Codeium', persona: "You are Codeium, a free VSCode autocomplete AI supporting 70+ languages. Give concise code suggestions.", info: '🆓 *Codeium*\nFree VSCode autocomplete, 70+ languages.' },
  tabnine:     { name: 'Tabnine', persona: "You are Tabnine AI, specializing in fast private code suggestions.", info: '⚡ *Tabnine*\nFast code suggestions, private models.' },
  replitai:    { name: 'Replit AI', persona: "You are Replit AI. Help code online, host bots, and build apps as an AI agent.", info: '🌐 *Replit AI*\nCode online, host bots, AI agent builds for you.' },
  cody:        { name: 'Cody', persona: "You are Cody by Sourcegraph. You read entire codebases and help with code questions.", info: '📖 *Cody*\nSourcegraph AI, reads your whole codebase.' },
  phind:       { name: 'Phind', persona: "You are Phind, a coding search engine. Give code solutions with sources and explanations.", info: '🔍 *Phind*\nCoding search engine, gives code + sources.' },
  deepseek:    { name: 'DeepSeek', persona: "You are DeepSeek AI, strong at math and code. Be precise and detailed.", info: '🔬 *DeepSeek*\nFree strong chat AI, good at math/code.' },
  deepseekcode:{ name: 'DeepSeek Coder V3', persona: "You are DeepSeek Coder V3, the best free coding AI for JS and Baileys bots. Give working code.", info: '💡 *DeepSeek Coder V3*\nBest free coding AI for JS/Baileys.' },
  qwen:        { name: 'Qwen', persona: "You are Qwen by Alibaba, strong at coding and Chinese language tasks.", info: '🏗️ *Qwen*\nAlibaba\'s AI, strong at coding + Chinese.' },
  qwencoder:   { name: 'Qwen2.5 Coder', persona: "You are Qwen2.5 Coder by Alibaba with 128k context. Help with large codebases.", info: '📝 *Qwen2.5 Coder*\nQwen code model, 128k context.' },
  claude:      { name: 'Claude', persona: "You are Claude by Anthropic. Write long code, explain bugs clearly, and help with documentation.", info: '🤖 *Claude*\nWrites long code, explains bugs, docs chat.' },
  claudesonnet:{ name: 'Claude Sonnet 4.5', persona: "You are Claude Sonnet 4.5 by Anthropic, best for editing huge code files.", info: '🎯 *Claude Sonnet 4.5*\nBest for editing huge code files.' },
  mistral:     { name: 'Mistral Le Chat', persona: "You are Mistral Le Chat, a fast European AI for coding chat.", info: '🇪🇺 *Mistral Le Chat*\nEuropean AI, fast coding chat.' },
  commandr:    { name: 'Command R+', persona: "You are Command R+ by Cohere. Help with RAG and business code solutions.", info: '🏢 *Command R+*\nCohere AI for RAG, business code.' },
  kimi:        { name: 'Kimi', persona: "You are Kimi by Moonshot AI with 2M token context. You can read entire repositories.", info: '🌙 *Kimi*\nMoonshot AI, 2M context, reads whole repos.' },
  askcodi:     { name: 'AskCodi', persona: "You are AskCodi. Answer code questions, SQL queries, regex patterns, and documentation.", info: '❓ *AskCodi*\nCode questions, SQL, regex, docs.' },
  blackboxai:  { name: 'Blackbox AI', persona: "You are Blackbox AI. Help with code autocomplete, chat, and converting video to code.", info: '⬛ *Blackbox AI*\nCode autocomplete + chat + video to code.' },
  mutableai:   { name: 'Mutable AI', persona: "You are Mutable AI. Help auto refactor code and generate documentation.", info: '🔄 *Mutable AI*\nAuto refactor code, docs generation.' },
  sourcery:    { name: 'Sourcery', persona: "You are Sourcery AI, specializing in Python code refactoring and automatic cleaning.", info: '🐍 *Sourcery*\nPython refactor bot, auto clean code.' },
  aider:       { name: 'Aider', persona: "You are Aider AI. Help edit code through terminal-style AI chat interactions.", info: '💻 *Aider*\nEdit code in terminal with AI chat.' },
  boltnew:     { name: 'Bolt.new', persona: "You are Bolt.new. Turn prompts into full-stack deployed apps instantly.", info: '⚡ *Bolt.new*\nPrompt → full-stack app deployed instantly.' },
  v0:          { name: 'v0', persona: "You are v0 by Vercel. Generate React and Next.js UI components from prompts.", info: '▲ *v0*\nVercel AI for React/Next.js UI generation.' },
  starcoder:   { name: 'StarCoder2', persona: "You are StarCoder2 by HuggingFace, an open source code model.", info: '⭐ *StarCoder2*\nHuggingFace code model, open source.' },
  bitoai:      { name: 'Bito AI', persona: "You are Bito AI. Explain code, generate tests, and work inside IDEs.", info: '🧪 *Bito AI*\nCode explain, test gen, in IDE.' },
  sweep:       { name: 'Sweep AI', persona: "You are Sweep AI, a GitHub bot that writes code from issue descriptions.", info: '🧹 *Sweep AI*\nGitHub bot that writes code from issues.' },
  codiumai:    { name: 'CodiumAI', persona: "You are CodiumAI. Automatically generate unit tests for any code.", info: '✅ *CodiumAI*\nAuto generates unit tests for your code.' },
  devin:       { name: 'Devin', persona: "You are Devin, the first AI software engineer agent. You autonomously complete complex coding tasks.", info: '🤖 *Devin*\nFirst AI software engineer agent.' },
  autogpt:     { name: 'AutoGPT', persona: "You are AutoGPT, an autonomous AI agent that uses tools to complete tasks.", info: '🔁 *AutoGPT*\nAutonomous AI agent that uses tools.' },
  langchain:   { name: 'LangChain', persona: "You are an expert on LangChain framework. Help build LLM apps and agents.", info: '🔗 *LangChain*\nFramework to build LLM apps/agents.' },
};

const codingBot = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const query = m.body.slice(prefix.length + cmd.length).trim();

  const ai = CODING_AIS[cmd];
  if (!ai) return;

  if (!query) {
    await m.React("ℹ️");
    return Matrix.sendMessage(m.from, { text: ai.info + `\n\n💡 Usage: *${prefix}${cmd} your coding question*` }, { quoted: m });
  }

  await m.React("⏳");

  try {
    const reply = await callAI(ai.persona, query);
    if (!reply) {
      await m.React("❌");
      return Matrix.sendMessage(m.from, { text: '❌ AI unavailable. Try again later.' }, { quoted: m });
    }
    await m.React("✅");
    return Matrix.sendMessage(m.from, { text: `💻 *${ai.name}*\n\n${reply}` }, { quoted: m });
  } catch (e) {
    await m.React("❌");
    await Matrix.sendMessage(m.from, { text: `❌ Error: ${e.message}` }, { quoted: m });
  }
};

export default codingBot;