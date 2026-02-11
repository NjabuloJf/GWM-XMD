import config from '../config.cjs';

const linkgc = async (m, gss) => {
  try {
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();
    const validCommands = ['invite', 'link'];

    if (!validCommands.includes(cmd)) return;

    if (!m.isGroup) {
      let responseMessage = "*📛 THIS COMMAND CAN ONLY BE USED IN GROUPS.*";
      return await gss.sendMessage(m.from, { text: " ", contextInfo: { externalAdReply: { title: `👋hy ${m.pushName}`, body: responseMessage, thumbnailUrl: "", mediaType: 1, renderLargerThumbnail: false, sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb", } } }, { quoted: m });
    }

    const response = await gss.groupInviteCode(m.from);
    const groupMetadata = await gss.groupMetadata(m.from);
    let responseMessage = `https://chat.whatsapp.com/${response}\n\nGroup Link: ${groupMetadata.subject}`;
    await gss.sendMessage(m.from, { text: responseMessage, contextInfo: { externalAdReply: { title: `👋hy ${m.pushName}`, body: responseMessage, thumbnailUrl: "", mediaType: 1, renderLargerThumbnail: false, sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb", } } }, { quoted: m });
  } catch (error) {
    console.error('Error:', error);
    let responseMessage = 'An error occurred while processing the command.';
    await gss.sendMessage(m.from, { text: " ", contextInfo: { externalAdReply: { title: `👋hy ${m.pushName}`, body: responseMessage, thumbnailUrl: "", mediaType: 1, renderLargerThumbnail: false, sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb", } } }, { quoted: m });
  }
};

export default linkgc;

