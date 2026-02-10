
import axios from 'axios';
import config from '../config.cjs';
import ytdl from 'ytdl-core';

const imdb = async (m, gss) => {
  try {
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();
    const validCommands = ['imdb'];

    if (!validCommands.includes(cmd)) return;
    if (!text) {
      let responseMessage = 'Give me a series or movie name';
      return await gss.sendMessage(m.from, {
        text: responseMessage,
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
    }

    let fids = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(text)}&plot=full&apikey=${config.OMDB_API_KEY}`);
    let imdbt = "";

    if (fids.data.Response === "False") {
      let responseMessage = 'Movie or series not found';
      return await gss.sendMessage(m.from, {
        text: responseMessage,
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
    }

    imdbt += "⚍⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚍\n";
    imdbt += " ```IMDB SEARCH```\n";
    imdbt += "⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎\n";
    imdbt += `🎬Title : ${fids.data.Title}\n`;
    imdbt += `📅Year : ${fids.data.Year}\n`;
    imdbt += `⭐Rated : ${fids.data.Rated}\n`;
    imdbt += `📆Released : ${fids.data.Released}\n`;
    imdbt += `⏳Runtime : ${fids.data.Runtime}\n`;
    imdbt += `🌀Genre : ${fids.data.Genre}\n`;
    imdbt += `👨🏻‍💻Director : ${fids.data.Director}\n`;
    imdbt += `✍Writer : ${fids.data.Writer}\n`;
    imdbt += `👨Actors : ${fids.data.Actors}\n`;
    imdbt += `📃Plot : ${fids.data.Plot}\n`;
    imdbt += `🌐Language : ${fids.data.Language}\n`;
    imdbt += `🌍Country : ${fids.data.Country}\n`;
    imdbt += `🎖️Awards : ${fids.data.Awards}\n`;
    imdbt += `📦BoxOffice : ${fids.data.BoxOffice}\n`;
    imdbt += `🏙️Production : ${fids.data.Production}\n`;
    imdbt += `🌟imdbRating : ${fids.data.imdbRating}\n`;
    imdbt += `✅imdbVotes : ${fids.data.imdbVotes}\n`;

    // Fetch video URL from YouTube
    let videoUrl = await getVideoUrl(text);
    if (videoUrl) {
      await gss.sendMessage(m.from, {
        video: { url: videoUrl },
        mimetype: 'video/mp4',
        caption: imdbt,
        contextInfo: {
          externalAdReply: {
            title: `👋hy ${m.pushName}`,
            body: fids.data.Title,
            thumbnailUrl: fids.data.Poster,
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
    } else {
      await gss.sendMessage(m.from, {
        text: imdbt,
        contextInfo: {
          externalAdReply: {
            title: `👋hy ${m.pushName}`,
            body: fids.data.Title,
            thumbnailUrl: fids.data.Poster,
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://github.com/NjabuloJf/Njabulo-Jb",
          }
        }
      }, { quoted: m });
    }
  } catch (error) {
    console.error('Error:', error);
    let responseMessage = 'An error occurred while fetching the data.';
    await gss.sendMessage(m.from, {
      text: responseMessage,
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
  }
};

const getVideoUrl = async (query) => {
  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
      params: {
        part: 'id',
        q: query,
        type: 'video',
        key: config.YOUTUBE_API_KEY,
      },
    });
    const videoId = response.data.items[0].id.videoId;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, { quality: '360p' });
    return format.url;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

export default imdb;


