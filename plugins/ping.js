import config from '../config.cjs';

const ping = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  if (cmd === "ping") {
    const start = new Date().getTime();

    const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
    const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];

    const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
    let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

    // Ensure reaction and text emojis are different
    while (textEmoji === reactionEmoji) {
      textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
    }

    await m.React(textEmoji);

    const end = new Date().getTime();
    const responseTime = (end - start) / 1000;
    const randomAudioUrl = "https://files.catbox.moe/6x0rb7.mp3"; 
    

    await Matrix.sendMessage(m.from, {
           audio: { url: 'https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.m4a' },
            mimetype: 'audio/mpeg',
            ptt: true, // Send as a voice note
           contextInfo: {
           externalAdReply: {
            title: `👋hy ${m.pushName}`,
            body: `pong: ${responseTime.toFixed(2)}ms ${reactionEmoji}`,
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
            mediaType: 1,
            renderLargerThumbnail: false, 
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
        }
      }
    }, { quoted: m });
  }
};

export default ping;
