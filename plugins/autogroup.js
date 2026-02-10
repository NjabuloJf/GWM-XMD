
import cron from 'node-cron';
import moment from 'moment-timezone';
import config from '../config.cjs';

let scheduledTasks = {};

const groupSetting = async (m, gss) => {
  try {
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();
    const validCommands = ['group'];

    if (!validCommands.includes(cmd)) return;
    if (!m.isGroup) return m.reply("*📛 THIS COMMAND CAN ONLY BE USED IN GROUPS*");

    const groupMetadata = await gss.groupMetadata(m.from);
    const participants = groupMetadata.participants;
    const botNumber = await gss.decodeJid(gss.user.id);
    const botAdmin = participants.find(p => p.id === botNumber)?.admin;
    const senderAdmin = participants.find(p => p.id === m.sender)?.admin;

    if (!botAdmin) return m.reply("*📛 BOT MUST BE AN ADMIN TO USE THIS COMMAND*");
    if (!senderAdmin) return m.reply("*📛 YOU MUST BE AN ADMIN TO USE THIS COMMAND*");

    const args = m.body.slice(prefix.length + cmd.length).trim().split(/\s+/);
    if (args.length < 1) return m.reply(`Please specify a setting (open/close) and optionally a time.\n\nExample:\n*${prefix + cmd} open* or *${prefix + cmd} open 04:00 PM*`);

    const groupSetting = args[0].toLowerCase();
    const time = args.slice(1).join(' ');

    // Handle immediate setting if no time is provided
    if (!time) {
      if (groupSetting === 'close') {
        await gss.groupSettingUpdate(m.from, 'announcement');
        return m.reply({
          text: " ",
          contextInfo: {
            externalAdReply: {
              title: `👋hy ${m.pushName}`,
              body: "Group successfully closed.",
              thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
              mediaType: 1,
              renderLargerThumbnail: false,
              sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
            }
          }
        });
      } else if (groupSetting === 'open') {
        await gss.groupSettingUpdate(m.from, 'not_announcement');
        return m.reply({
          text: " ",
          contextInfo: {
            externalAdReply: {
              title: `👋hy ${m.pushName}`,
              body: "Group successfully opened.",
              thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
              mediaType: 1,
              renderLargerThumbnail: false,
              sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
            }
          }
        });
      } else {
        return m.reply({
          text: " ",
          contextInfo: {
            externalAdReply: {
              title: `👋hy ${m.pushName}`,
              body: `Example: ${prefix + cmd} open or *${prefix + cmd} close*`,
              thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
              mediaType: 1,
              renderLargerThumbnail: false,
              sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
            }
          }
        });
      }
    }

    // Check if the provided time is valid
    if (!/^\d{1,2}:\d{2}\s*(?:AM|PM)$/i.test(time)) {
      return m.reply({
        text: " ",
        contextInfo: {
          externalAdReply: {
            title: `👋hy ${m.pushName}`,
            body: `Invalid time format. Use HH:mm AM/PM format.`,
            thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      });
    }

    // Convert time to 24-hour format
    const [hour, minute] = moment(time, ['h:mm A', 'hh:mm A']).format('HH:mm').split(':').map(Number);
    const cronTime = `${minute} ${hour} * * *`;
    console.log(`Scheduling ${groupSetting} at ${cronTime} IST`);

    // Clear any existing scheduled task for this group
    if (scheduledTasks[m.from]) {
      scheduledTasks[m.from].stop();
      delete scheduledTasks[m.from];
    }

    scheduledTasks[m.from] = cron.schedule(cronTime, async () => {
      try {
        console.log(`Executing scheduled task for ${groupSetting} at ${moment().format('HH:mm')} IST`);
        if (groupSetting === 'close') {
          await gss.groupSettingUpdate(m.from, 'announcement');
          await gss.sendMessage(m.from, {
            text: " ",
            contextInfo: {
              externalAdReply: {
                title: `👋hy ${m.pushName}`,
                body: "Group successfully closed.",
                thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
                mediaType: 1,
                renderLargerThumbnail: false,
                sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
              }
            }
          });
        } else if (groupSetting === 'open') {
          await gss.groupSettingUpdate(m.from, 'not_announcement');
          await gss.sendMessage(m.from, {
            text: " ",
            contextInfo: {
              externalAdReply: {
                title: `👋hy ${m.pushName}`,
                body: "Group successfully opened.",
                thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
                mediaType: 1,
                renderLargerThumbnail: false,
                sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
              }
            }
          });
        }
      } catch (err) {
        console.error('Error during scheduled task execution:', err);
        await gss.sendMessage(m.from, {
          text: ' ',
          contextInfo: {
            externalAdReply: {
              title: `👋hy ${m.pushName}`,
              body: 'An error occurred while updating the group setting.',
              thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
              mediaType: 1,
              renderLargerThumbnail: false,
              sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
            }
          }
        });
      }
    }, { timezone: "Asia/Kolkata" });

    m.reply({
      text: ` `,
      contextInfo: {
        externalAdReply: {
          title: `👋hy ${m.pushName}`,
          body: `Group will be set to "${groupSetting}" at ${time} IST.`,
          thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
          mediaType: 1,
          renderLargerThumbnail: false,
          sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
        }
      }
    });
  } catch (error) {
    console.error('Error:', error);
    m.reply({
      text: ' ',
      contextInfo: {
        externalAdReply: {
          title: `👋hy ${m.pushName}`,
          body: 'An error occurred while processing the command.',
          thumbnailUrl: "https://raw.githubusercontent.com/NjabuloJf/Njabulo-Jb/main/public/fana.jpg",
          mediaType: 1,
          renderLargerThumbnail: false,
          sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
        }
      }
    });
  }
};

export default groupSetting;

