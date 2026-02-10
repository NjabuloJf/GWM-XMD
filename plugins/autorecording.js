
import config from '../config.cjs';

const autorecordingCommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  if (cmd === 'autorecording') {
    if (!isCreator) return m.reply("*📛 THIS IS AN OWNER COMMAND*");

    let responseMessage;
    if (text === 'on') {
      config.AUTO_RECORDING = true;
      responseMessage = "Auto-Recording has been enabled.";
    } else if (text === 'off') {
      config.AUTO_RECORDING = false;
      responseMessage = "Auto-Recording has been disabled.";
    } else {
      responseMessage = "Usage:- `autorecording on or off`: Enable Auto-Recording\n- `autorecording off`: Disable Auto-Recording";
    }

    try {
      await Matrix.sendMessage(m.from, {
        text: " ",
        contextInfo: {
          externalAdReply: {
            title: `👋hy ${m.pushName}`,
            body: responseMessage,
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
    } catch (error) {
      console.error("Error processing your request:", error);
      await Matrix.sendMessage(m.from, {
        text: ' ',
        contextInfo: {
          externalAdReply: {
            title: `👋hy ${m.pushName}`,
            body: 'Error processing your request.',
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
    }
  }
};

export default autorecordingCommand;
