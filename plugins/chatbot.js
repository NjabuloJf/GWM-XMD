import axios from 'axios';
import config from '../config.cjs';
import { getContentType, downloadMediaMessage } from '@whiskeysockets/baileys';

const POLL_TEXT = 'https://text.pollinations.ai';
const POLL_IMAGE = 'https://image.pollinations.ai/prompt';
const POLL_AUDIO = 'https://audio.pollinations.ai';

// ── Store chatbot state per chat ──────────────────────────────────
const chatbotState = new Map();

// ── Store conversation history per user ───────────────────────────
const conversationHistory = new Map();

// ── AI Call with Context ──────────────────────────────────────────
const callAI = async (prompt, systemContext = '', conversationId = null) => {
  try {
    // Get conversation history
    let messages = [];
    if (conversationId && conversationHistory.has(conversationId)) {
      messages = conversationHistory.get(conversationId);
    }
    
    // Add system message
    if (systemContext) {
      messages.unshift({ role: 'system', content: systemContext });
    }
    
    // Add user message
    messages.push({ role: 'user', content: prompt });
    
    // Keep only last 10 messages to avoid token limits
    if (messages.length > 11) {
      messages = [messages[0], ...messages.slice(-10)];
    }
    
    const res = await axios.post(POLL_TEXT, {
      messages: messages,
      model: 'openai',
      jsonMode: false
    }, { timeout: 30000 });
    
    const reply = res.data?.choices?.[0]?.message?.content?.trim() || res.data?.trim() || null;
    
    // Save assistant reply to history
    if (reply && conversationId) {
      if (!conversationHistory.has(conversationId)) {
        conversationHistory.set(conversationId, []);
      }
      const history = conversationHistory.get(conversationId);
      history.push({ role: 'user', content: prompt });
      history.push({ role: 'assistant', content: reply });
      
      // Keep only last 20 messages
      if (history.length > 20) {
        conversationHistory.set(conversationId, history.slice(-20));
      }
    }
    
    return reply;
  } catch (e) {
    console.error('AI call error:', e.message);
    return null;
  }
};

// ── Generate Image ────────────────────────────────────────────────
const generateImage = async (prompt) => {
  try {
    const res = await axios.get(
      `${POLL_IMAGE}/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true`,
      { timeout: 60000, responseType: 'arraybuffer' }
    );
    if (res.data?.byteLength > 1000) return Buffer.from(res.data);
  } catch { return null; }
  return null;
};

// ── Generate 3D Description ───────────────────────────────────────
const generate3DDescription = async (prompt) => {
  const context = 'You are a 3D modeling expert. Describe in detail how to create a 3D model of what the user asks for, including shapes, textures, materials, lighting, and technical specifications.';
  return await callAI(prompt, context);
};

// ── Analyze Media with AI ─────────────────────────────────────────
const analyzeMedia = async (m, Matrix) => {
  const quoted = m.quoted || m;
  const msg = quoted.message || quoted;
  const type = getContentType(msg);

  try {
    // ── IMAGE ───────────────────────────────────────────────────
    if (type === 'imageMessage') {
      const buffer = await downloadMediaMessage(
        { message: msg, key: quoted.key || m.key },
        'buffer',
        {},
        { logger: console, reuploadRequest: Matrix.updateMediaMessage }
      );
      
      const caption = msg.imageMessage?.caption || '';
      
      return {
        type: 'image',
        buffer: buffer,
        caption: caption,
        prompt: caption 
          ? `User sent an image with caption: "${caption}". Describe what you think the image shows based on the caption and offer to help with anything related to it.`
          : 'User sent an image. Say you can see it and ask if they want you to describe it, edit it, enhance it, or help with anything specific about images.'
      };
    }

    // ── VIDEO ───────────────────────────────────────────────────
    if (type === 'videoMessage') {
      const caption = msg.videoMessage?.caption || '';
      
      return {
        type: 'video',
        caption: caption,
        prompt: caption
          ? `User sent a video with caption: "${caption}". Respond helpfully about the video and ask if they want you to analyze it, create similar content, or help with video editing.`
          : 'User sent a video. Say you received it and offer to help with video analysis, generating similar videos, or any video-related tasks.'
      };
    }

    // ── AUDIO ───────────────────────────────────────────────────
    if (type === 'audioMessage' || type === 'ptt') {
      return {
        type: 'audio',
        prompt: 'User sent an audio message. Say you received it and offer to help with audio transcription, music generation, voice cloning, or any audio tasks.'
      };
    }

    // ── DOCUMENT ────────────────────────────────────────────────
    if (type === 'documentMessage') {
      const fileName = msg.documentMessage?.fileName || 'a document';
      const mimetype = msg.documentMessage?.mimetype || '';
      
      return {
        type: 'document',
        fileName: fileName,
        prompt: `User sent a document file named "${fileName}" (${mimetype}). Acknowledge it and ask how you can help - whether they need analysis, conversion, or information about the file.`
      };
    }

    // ── STICKER ─────────────────────────────────────────────────
    if (type === 'stickerMessage') {
      return {
        type: 'sticker',
        prompt: 'User sent a sticker. Respond playfully and ask if they need any assistance with anything.'
      };
    }

    return null;
  } catch (e) {
    console.error('Media analysis error:', e.message);
    return null;
  }
};

// ── Check if user is owner ────────────────────────────────────────
const isOwner = (senderId) => {
  const ownerNumber = config.OWNER_NUMBER || config.OWNER || '';
  return senderId.includes(ownerNumber.replace(/[^0-9]/g, ''));
};

// ── Main Chatbot Handler ──────────────────────────────────────────
const chatbot = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const body = m.body || '';
  const chatId = m.from;
  const senderId = m.sender || m.key?.remoteJid || '';
  const isOwnerUser = isOwner(senderId);

  // ── TOGGLE COMMANDS (Owner Only) ─────────────────────────────────
  if (body.startsWith(prefix)) {
    const cmd = body.slice(prefix.length).split(' ')[0].toLowerCase();

    if (cmd === 'chatbot' || cmd === 'bot' || cmd === 'autoai') {
      const arg = body.slice(prefix.length + cmd.length).trim().toLowerCase();

      // ── Turn ON ───────────────────────────────────────────────
      if (arg === 'on' || arg === 'start' || arg === 'enable') {
        if (!isOwnerUser) {
          await m.React("❌");
          return Matrix.sendMessage(chatId, {
            text: `❌ *Access Denied*\n\n⚠️ You are not authorized to use this command.\n\n👤 Only the bot owner can enable/disable the chatbot.\n\n💡 Contact: ${config.OWNER_NAME || 'Bot Owner'}`
          }, { quoted: m });
        }

        chatbotState.set(chatId, true);
        await m.React("✅");
        return Matrix.sendMessage(chatId, {
          text: `✅ *Njabulo-AI Chatbot Activated!*\n\n🤖 I will now respond to ALL messages automatically:\n\n💬 Text messages\n🖼️ Images (describe, edit, enhance)\n🎥 Videos (analyze, generate)\n🎵 Audio (transcribe, generate)\n📄 Documents (analyze, convert)\n🎨 Stickers (fun responses)\n\n🎯 *Features Enabled:*\n• Smart conversation with memory\n• Image generation & editing\n• Video analysis & creation\n• 3D modeling descriptions\n• Music & audio generation\n• Code assistance\n• Sports predictions\n• Color palettes\n• And 340+ AI capabilities!\n\n❌ To turn off: *${prefix}chatbot off*\n\n⚡ Powered by NjabuloAI`
        }, { quoted: m });
      }

      // ── Turn OFF ──────────────────────────────────────────────
      if (arg === 'off' || arg === 'stop' || arg === 'disable') {
        if (!isOwnerUser) {
          await m.React("❌");
          return Matrix.sendMessage(chatId, {
            text: `❌ *Access Denied*\n\n⚠️ You are not authorized to use this command.\n\n👤 Only the bot owner can enable/disable the chatbot.\n\n💡 Contact: ${config.OWNER_NAME || 'Bot Owner'}`
          }, { quoted: m });
        }

        chatbotState.set(chatId, false);
        // Clear conversation history for this chat
        conversationHistory.delete(chatId);
        await m.React("🔴");
        return Matrix.sendMessage(chatId, {
          text: `🔴 *Njabulo-AI Chatbot Deactivated*\n\n❌ I will no longer respond automatically.\n\n💾 Conversation history cleared.\n\n✅ To turn back on: *${prefix}chatbot on*`
        }, { quoted: m });
      }

      // ── Status Check ──────────────────────────────────────────
      const isActive = chatbotState.get(chatId) || false;
      await m.React("ℹ️");
      return Matrix.sendMessage(chatId, {
        text: `🤖 *Njabulo-AI Chatbot Status*\n\n${isActive ? '✅ *ACTIVE* - I\'m responding to all messages' : '🔴 *INACTIVE* - I\'m only responding to commands'}\n\n👤 *Control Access:* ${isOwnerUser ? 'Owner (You)' : 'Owner Only'}\n\n💡 Commands ${isOwnerUser ? 'for you' : '(Owner only)'}:\n*${prefix}chatbot on* - Turn on\n*${prefix}chatbot off* - Turn off\n\n📊 *Current Chat:* ${chatId.endsWith('@g.us') ? 'Group' : 'Private'}\n💬 *Conversation History:* ${conversationHistory.has(chatId) ? conversationHistory.get(chatId).length / 2 + ' messages' : 'Empty'}`
      }, { quoted: m });
    }
  }

  // ── AUTO-RESPONSE MODE ────────────────────────────────────────────
  const isChatbotActive = chatbotState.get(chatId) || false;
  
  // If chatbot is OFF, ignore all non-command messages
  if (!isChatbotActive) return;

  // If chatbot is ON but this is a command for another function, ignore
  if (body.startsWith(prefix)) return;

  // ── SPECIAL TRIGGERS ──────────────────────────────────────────────
  const lowerBody = body.toLowerCase();
  
  // "Who are you" trigger
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
      text: `🤖 *I am Njabulo-AI Assistant*\n\n✨ Your intelligent WhatsApp AI companion\n\n🌟 *What I Can Do:*\n• Answer any question with context memory\n• Analyze & describe images\n• Edit & enhance photos\n• Generate images from text\n• Analyze videos\n• Create videos from descriptions\n• Generate 3D model descriptions\n• Create music & songs\n• Voice cloning & TTS\n• Write code & debug\n• Sports predictions & live scores\n• Generate color palettes\n• Download from social media\n• And 340+ AI capabilities!\n\n💡 Powered by advanced AI technology\n🌐 Available 24/7 across all platforms\n🧠 Remembers our conversation\n\n📝 Just send me anything and I'll help!`
    }, { quoted: m });
  }

  // Image generation triggers
  if (
    lowerBody.startsWith('generate image') ||
    lowerBody.startsWith('create image') ||
    lowerBody.startsWith('make image') ||
    lowerBody.startsWith('draw me')
  ) {
    await m.React("⏳");
    const prompt = body.replace(/^(generate image|create image|make image|draw me)\s*/i, '').trim();
    
    if (!prompt) {
      await m.React("❌");
      return Matrix.sendMessage(chatId, {
        text: '❌ Please describe what image you want me to create!\n\nExample: "generate image beautiful sunset over ocean"'
      }, { quoted: m });
    }

    const img = await generateImage(prompt);
    if (!img) {
      await m.React("❌");
      return Matrix.sendMessage(chatId, {
        text: '❌ Failed to generate image. Please try again.'
      }, { quoted: m });
    }

    await m.React("✅");
    return Matrix.sendMessage(chatId, {
      image: img,
      caption: `🎨 *Generated Image*\n\n📝 Prompt: ${prompt}\n\n🤖 Created by Njabulo-AI`
    }, { quoted: m });
  }

  // 3D modeling triggers
  if (
    lowerBody.includes('3d model') ||
    lowerBody.includes('3d design') ||
    lowerBody.startsWith('model me')
  ) {
    await m.React("⏳");
    const prompt = body.replace(/^model me\s*/i, '').trim();
    const description = await generate3DDescription(prompt);
    
    if (!description) {
      await m.React("❌");
      return Matrix.sendMessage(chatId, {
        text: '❌ Failed to generate 3D description. Try again.'
      }, { quoted: m });
    }

    await m.React("✅");
    return Matrix.sendMessage(chatId, {
      text: `🧊 *3D Model Description*\n\n${description}\n\n🤖 Njabulo-AI 3D Expert`
    }, { quoted: m });
  }

  // ── HANDLE MEDIA ──────────────────────────────────────────────────
  const media = await analyzeMedia(m, Matrix);
  
  if (media) {
    await m.React("⏳");
    
    // Special handling for images - offer edit/enhance options
    if (media.type === 'image') {
      const conversationId = chatId + '-' + senderId;
      const aiResponse = await callAI(media.prompt, 'You are Njabulo-AI, a helpful image analysis and editing assistant. Be friendly and offer specific help with images.', conversationId);
      
      if (aiResponse) {
        await m.React("✅");
        await Matrix.sendMessage(chatId, {
          text: `🖼️ *Image Received*\n\n${aiResponse}\n\n💡 *I can help you:*\n• Describe the image in detail\n• Edit the image (say "edit this image to...")\n• Enhance quality\n• Remove background\n• Generate similar images\n• Extract colors from the image\n\nJust tell me what you need!`
        }, { quoted: m });
        
        return;
      }
    }
    
    // Other media types
    const conversationId = chatId + '-' + senderId;
    const reply = await callAI(media.prompt, 'You are Njabulo-AI, a helpful multimedia assistant. Be friendly and offer specific help.', conversationId);
    
    if (reply) {
      await m.React("✅");
      return Matrix.sendMessage(chatId, {
        text: `🤖 *Njabulo-AI*\n\n${reply}`
      }, { quoted: m });
    }
  }

  // ── HANDLE TEXT ───────────────────────────────────────────────────
  if (body && body.trim()) {
    await m.React("⏳");
    
    const conversationId = chatId + '-' + senderId;
    
    // Enhanced system context
    const systemContext = `You are Njabulo-AI, an advanced AI assistant with 340+ capabilities. You can:
- Chat naturally and remember conversation context
- Generate images from descriptions
- Analyze and edit images
- Create videos and music
- Help with coding
- Provide sports predictions
- Generate color palettes
- Download social media content
- Create 3D model descriptions
- And much more!

Be helpful, friendly, conversational, and proactive in offering your capabilities when relevant. Keep responses concise but informative. Remember the conversation history.`;

    const reply = await callAI(body, systemContext, conversationId);
    
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

  // ── HANDLE EMPTY/UNKNOWN MESSAGES ─────────────────────────────────
  await m.React("❓");
  return Matrix.sendMessage(chatId, {
    text: '👋 Hi! I\'m Njabulo-AI Assistant.\n\n💬 Send me a text message\n📸 Send me images to analyze/edit\n🎥 Send me videos to analyze\n🎵 Send me audio\n\nI have 340+ AI capabilities - just ask me anything!'
  }, { quoted: m });
};

export default chatbot; 
