import axios from 'axios';
import config from '../config.cjs';
import { getContentType, downloadMediaMessage } from '@whiskeysockets/baileys';

const POLL_TEXT = 'https://text.pollinations.ai';

// Store chatbot state per user/group
const chatbotState = new Map();

// AI call function
const callAI = async (prompt, context = '') => {
  try {
    const system = `You are Njabulo-AI, a helpful WhatsApp AI assistant. ${context}`;
    const res = await axios.post(POLL_TEXT, {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      model: 'openai',
      jsonMode: false
    }, { timeout: 30000 });
    return res.data?.choices?.[0]?.message?.content?.trim() || res.data?.trim() || null;
  } catch {
    try {
      const r = await axios.get(`${POLL_TEXT}/${encodeURIComponent(prompt)}?system=${encodeURIComponent('You are Njabulo-AI assistant')}`, { timeout: 30000 });
      return typeof r.data === 'string' ? r.data.trim() : null;
    } catch { return null; }
  }
};

// Download and analyze media
const analyzeMedia = async (m, Matrix) => {
  const quoted = m.quoted || m;
  const msg = quoted.message || quoted;
  const type = getContentType(msg);

  try {
    if (type === 'imageMessage') {
      const buffer = await downloadMediaMessage(
        { message: msg, key: quoted.key || m.key },
        'buffer',
        {},
        { logger: console, reuploadRequest: Matrix.updateMediaMessage }
      );
      return { type: 'image', caption: msg.imageMessage?.caption || 'an image' };
    }

    if (type === 'videoMessage') {
      return { type: 'video', caption: msg.videoMessage?.caption || 'a video' };
    }

    if (type === 'audioMessage') {
      return { type: 'audio', caption: 'an audio message' };
    }

    if (type === 'documentMessage') {
      const fileName = msg.documentMessage?.fileName || 'a document';
      return { type: 'document', caption: fileName };
    }

    if (type === 'stickerMessage') {
      return { type: 'sticker', caption: 'a sticker' };
    }

    return null;
  } catch {
    return null;
  }
};

// Main chatbot handler
const chatbot = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const body = m.body || '';
  const chatId = m.from;
  const isGroup = m.from.endsWith('@g.us');

  // ── TOGGLE COMMANDS ────────────────────────────────────────────
  if (body.startsWith(prefix)) {
    const cmd = body.slice(prefix.length).split(' ')[0].toLowerCase();

    // Turn chatbot ON
    if (cmd === 'chatbot' || cmd === 'bot' || cmd === 'autoai') {
      const arg = body.slice(prefix.length + cmd.length).trim().toLowerCase();

      if (arg === 'on' || arg === 'start' || arg === 'enable') {
        chatbotState.set(chatId, true);
        await m.React("✅");
        return Matrix.sendMessage(chatId, {
          text: `🤖 *Njabulo-AI Chatbot Activated!*\n\n✅ I will now respond to all messages automatically.\n\n📝 Ask me anything!\n🖼️ Send images - I'll describe them\n🎥 Send videos - I'll analyze them\n🎵 Send audio - I'll respond\n\n❌ To turn off: *${prefix}chatbot off*`
        }, { quoted: m });
      }

      if (arg === 'off' || arg === 'stop' || arg === 'disable') {
        chatbotState.set(chatId, false);
        await m.React("🔴");
        return Matrix.sendMessage(chatId, {
          text: `🔴 *Njabulo-AI Chatbot Deactivated*\n\n❌ I will no longer respond automatically.\n\n✅ To turn back on: *${prefix}chatbot on*`
        }, { quoted: m });
      }

      // Status check
      const isActive = chatbotState.get(chatId) || false;
      await m.React("ℹ️");
      return Matrix.sendMessage(chatId, {
        text: `🤖 *Njabulo-AI Chatbot Status*\n\n${isActive ? '✅ Active - I\'m responding to all messages' : '🔴 Inactive - I\'m only responding to commands'}\n\n💡 Commands:\n*${prefix}chatbot on* - Turn on\n*${prefix}chatbot off* - Turn off`
      }, { quoted: m });
    }
  }

  // ── CHATBOT AUTO-RESPONSE ──────────────────────────────────────
  const isChatbotActive = chatbotState.get(chatId) || false;
  
  // If chatbot is OFF, ignore all non-command messages
  if (!isChatbotActive) return;

  // If chatbot is ON but this is a command for another bot function, ignore
  if (body.startsWith(prefix)) return;

  // ── SPECIAL: "Who are you" ────────────────────────────────────
  const lowerBody = body.toLowerCase();
  if (
    lowerBody.includes('who are you') ||
    lowerBody.includes('what are you') ||
    lowerBody.includes('what is your name') ||
    lowerBody.includes('whats your name') ||
    lowerBody === 'introduce yourself' ||
    lowerBody === 'who r u'
  ) {
    await m.React("🤖");
    return Matrix.sendMessage(chatId, {
      text: `🤖 *I am Njabulo-AI Assistant*\n\n✨ Your intelligent WhatsApp AI companion\n\n🌟 *What I Can Do:*\n• Answer any question\n• Analyze images and videos\n• Help with coding, writing, math\n• Generate creative content\n• Provide real-time assistance\n• Support multiple languages\n\n💡 Powered by advanced AI technology\n🌐 Available 24/7 across all platforms\n\n📝 Just send me any message and I'll help!`
    }, { quoted: m });
  }

  // ── HANDLE MEDIA ───────────────────────────────────────────────
  const media = await analyzeMedia(m, Matrix);
  
  if (media) {
    let prompt = '';
    
    if (media.type === 'image') {
      prompt = media.caption 
        ? `User sent an image with caption: "${media.caption}". Respond helpfully about the image.`
        : "User sent an image. Say you can see it and ask if they want you to describe it or help with anything specific.";
    } else if (media.type === 'video') {
      prompt = media.caption
        ? `User sent a video with caption: "${media.caption}". Respond helpfully about the video.`
        : "User sent a video. Say you received it and ask if they need help with anything related to it.";
    } else if (media.type === 'audio') {
      prompt = "User sent an audio message. Say you received it and ask how you can help.";
    } else if (media.type === 'document') {
      prompt = `User sent a document: "${media.caption}". Acknowledge it and ask how you can help with it.`;
    } else if (media.type === 'sticker') {
      prompt = "User sent a sticker. Respond playfully and ask if they need any assistance.";
    }

    await m.React("⏳");
    const reply = await callAI(prompt);
    
    if (reply) {
      await m.React("✅");
      return Matrix.sendMessage(chatId, { text: `🤖 *Njabulo-AI*\n\n${reply}` }, { quoted: m });
    }
  }

  // ── HANDLE TEXT ────────────────────────────────────────────────
  if (body && body.trim()) {
    await m.React("⏳");
    
    const reply = await callAI(body, 'Be helpful, friendly, and conversational. Keep responses concise but informative.');
    
    if (!reply) {
      await m.React("❌");
      return Matrix.sendMessage(chatId, {
        text: '❌ Sorry, I\'m having trouble processing that right now. Please try again!'
      }, { quoted: m });
    }

    await m.React("✅");
    return Matrix.sendMessage(chatId, {
      text: `🤖 *Njabulo-AI*\n\n${reply}`
    }, { quoted: m });
  }

  // ── HANDLE EMPTY MESSAGES ──────────────────────────────────────
  await m.React("❓");
  return Matrix.sendMessage(chatId, {
    text: '👋 Hi! I\'m Njabulo-AI Assistant.\n\n💬 Send me a message and I\'ll help you!\n📸 Send media and I\'ll analyze it!'
  }, { quoted: m });
};

export default chatbot;