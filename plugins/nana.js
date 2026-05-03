import config from '../config.cjs';

const nana = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix)? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  if (cmd === "nana") {
    const start = new Date().getTime();

    const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
    const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];

    const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
    let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

    while (textEmoji === reactionEmoji) {
      textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
    }

    await m.React(textEmoji);

    const end = new Date().getTime();
    const responseTime = (end - start).toFixed(2);

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    // This creates the "Table preview" card like in your screenshot
    const listMsg = {
      text: `*Timnasa-Tmd Status* ${reactionEmoji}`,
      footer: config.FOOTER || "Timnasa-Tmd Bot",
      title: "Bot Information",
      buttonText: "View all",
      sections: [
        {
          title: "Bot Stats",
          rows: [
            {title: "Speed", rowId: "speed", description: `${responseTime}ms`},
            {title: "Uptime", rowId: "uptime", description: `${hours}h ${minutes}m ${seconds}s`},
            {title: "Status", rowId: "status", description: "Online ✅"},
            {title: "Mode", rowId: "mode", description: config.MODE || "Public"}
          ]
        }
      ],
      listType: 1
    };

    await Matrix.sendMessage(m.from, listMsg, { quoted: m });
  }
};

export default nana;
