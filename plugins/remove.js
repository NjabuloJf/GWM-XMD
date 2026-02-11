import config from '../config.cjs';

const kick = async (m, gss) => {
  try {
    const botNumber = await gss.decodeJid(gss.user.id);
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();
    const validCommands = ['kick', 'remove'];

    if (!validCommands.includes(cmd)) return;

    if (!m.isGroup) {
      let responseMessage = "This command can only be used in groups.";
      return await gss.sendMessage(m.from, { text: responseMessage }, { quoted: m });
    }

    const groupMetadata = await gss.groupMetadata(m.from);
    const participants = groupMetadata.participants;
    const botAdmin = participants.find(p => p.id === botNumber)?.admin;
    const senderAdmin = participants.find(p => p.id === m.sender)?.admin;

    if (!botAdmin) {
      let responseMessage = "I need admin permissions to use this command.";
      return await gss.sendMessage(m.from, { text: responseMessage }, { quoted: m });
    }

    if (!senderAdmin) {
      let responseMessage = "You need admin permissions to use this command.";
      return await gss.sendMessage(m.from, { text: responseMessage }, { quoted: m });
    }

    if (!m.mentionedJid) m.mentionedJid = [];
    if (m.quoted?.participant) m.mentionedJid.push(m.quoted.participant);
    const users = m.mentionedJid.length > 0 ? m.mentionedJid : text.replace(/[^0-9]/g, '').length > 0 ? [text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'] : [];

    if (users.length === 0) {
      let responseMessage = "Please mention or quote a user to kick.";
      return await gss.sendMessage(m.from, text: responseMessage }, { quoted: m });
    }

    const validUsers = users.filter(Boolean);
    await gss.groupParticipantsUpdate(m.from, validUsers, 'remove')
      .then(() => {
        const kickedNames = validUsers.map(user => `@${user.split("@")[0]}`);
        let responseMessage = `Users ${kickedNames} kicked successfully from the group ${groupMetadata.subject}.`;
        gss.sendMessage(m.from, { text: responseMessage }, { quoted: m });
      })
      .catch((error) => {
        console.error('Error kicking users:', error);
        let responseMessage = 'Failed to kick user(s) from the group.';
        gss.sendMessage(m.from, { text: responseMessage }, { quoted: m });
      });
  } catch (error) {
    console.error('Error:', error);
    let responseMessage = 'An error occurred while processing the command.';
    await gss.sendMessage(m.from, { text: responseMessage }, { quoted: m });
  }
};

export default kick;

