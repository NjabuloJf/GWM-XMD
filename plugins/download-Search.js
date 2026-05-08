import axios from 'axios';
import config from '../config.cjs';

const POLL_TEXT = 'https://text.pollinations.ai';

// ── Helper: AI Search ─────────────────────────────────────────────
const aiSearch = async (query, context) => {
  try {
    const res = await axios.post(POLL_TEXT, {
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: query }
      ],
      model: 'openai',
      jsonMode: false
    }, { timeout: 30000 });
    return res.data?.choices?.[0]?.message?.content?.trim() || res.data?.trim() || null;
  } catch {
    try {
      const r = await axios.get(`${POLL_TEXT}/${encodeURIComponent(query)}?system=${encodeURIComponent(context)}`, { timeout: 30000 });
      return typeof r.data === 'string' ? r.data.trim() : null;
    } catch { return null; }
  }
};

// ── Download & Search APIs ────────────────────────────────────────
const APIS = {
  // Git
  gitclone: async (url) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '');
    return {
      download: `https://api.github.com/repos/${owner}/${cleanRepo}/zipball`,
      info: `Repository: ${owner}/${cleanRepo}\nClone URL: ${url}`
    };
  },

  // Snack Video
  snack: async (url) => {
    try {
      const apis = [
        `https://api.snackvideo.download/v1/download?url=${encodeURIComponent(url)}`,
        `https://snackvideo-downloader.com/api/download?url=${encodeURIComponent(url)}`
      ];
      for (const api of apis) {
        try {
          const res = await axios.get(api, { timeout: 20000 });
          if (res.data?.video || res.data?.url) {
            return { video: res.data.video || res.data.url, title: res.data.title || 'Snack Video' };
          }
        } catch { continue; }
      }
    } catch { return null; }
    return null;
  },

  // Dailymotion
  dailymotion: async (url) => {
    try {
      const videoId = url.match(/video\/([a-zA-Z0-9]+)/)?.[1];
      if (!videoId) return null;
      const api = `https://api.dailymotion.com/video/${videoId}?fields=title,url,thumbnail_url`;
      const res = await axios.get(api, { timeout: 20000 });
      return {
        video: res.data?.url || `https://www.dailymotion.com/embed/video/${videoId}`,
        title: res.data?.title || 'Dailymotion Video',
        thumbnail: res.data?.thumbnail_url
      };
    } catch { return null; }
  },

  // Pinterest
  pinterest: async (url) => {
    try {
      const apis = [
        `https://api.pinterestdownloader.com/download?url=${encodeURIComponent(url)}`,
        `https://pinterestvideodownloader.com/download.php?url=${encodeURIComponent(url)}`
      ];
      for (const api of apis) {
        try {
          const res = await axios.get(api, { timeout: 20000 });
          if (res.data?.image || res.data?.video) {
            return { media: res.data.image || res.data.video, type: res.data.image ? 'image' : 'video' };
          }
        } catch { continue; }
      }
    } catch { return null; }
    return null;
  },

  // Twitter
  twitter: async (url) => {
    try {
      const apis = [
        `https://api.twitter-video-downloader.com/download?url=${encodeURIComponent(url)}`,
        `https://twitsave.com/info?url=${encodeURIComponent(url)}`
      ];
      for (const api of apis) {
        try {
          const res = await axios.get(api, { timeout: 20000 });
          if (res.data?.video || res.data?.url) {
            return { video: res.data.video || res.data.url, title: res.data.title || 'Twitter Video' };
          }
        } catch { continue; }
      }
    } catch { return null; }
    return null;
  },

  // Spotify
  spotify: async (url) => {
    try {
      const apis = [
        `https://api.spotifydown.com/download/${encodeURIComponent(url)}`,
        `https://api.spotify-downloader.com/api?url=${encodeURIComponent(url)}`
      ];
      for (const api of apis) {
        try {
          const res = await axios.get(api, { timeout: 20000 });
          if (res.data?.link || res.data?.download) {
            return {
              audio: res.data.link || res.data.download,
              title: res.data.title || res.data.name || 'Spotify Track',
              artist: res.data.artist || 'Unknown'
            };
          }
        } catch { continue; }
      }
    } catch { return null; }
    return null;
  },

  // SoundCloud
  soundcloud: async (url) => {
    try {
      const api = `https://api.soundcloud-downloader.com/download?url=${encodeURIComponent(url)}`;
      const res = await axios.get(api, { timeout: 20000 });
      return {
        audio: res.data?.link || res.data?.download,
        title: res.data?.title || 'SoundCloud Track'
      };
    } catch { return null; }
  },

  // Likee
  likee: async (url) => {
    try {
      const api = `https://api.likeedownloader.com/download?url=${encodeURIComponent(url)}`;
      const res = await axios.get(api, { timeout: 20000 });
      return {
        video: res.data?.video || res.data?.url,
        title: res.data?.title || 'Likee Video'
      };
    } catch { return null; }
  },

  // APK Search
  apk: async (name) => {
    try {
      const api = `https://api.apkpure.com/api/search?q=${encodeURIComponent(name)}`;
      const res = await axios.get(api, { timeout: 20000 });
      const apps = res.data?.results || [];
      if (apps.length === 0) return null;
      const app = apps[0];
      return {
        name: app.name,
        package: app.package,
        version: app.version,
        size: app.size,
        download: app.download_url || `https://apkpure.com/${app.package}`
      };
    } catch { return null; }
  },

  // Play Store
  playstore: async (name) => {
    try {
      const api = `https://play.google.com/store/search?q=${encodeURIComponent(name)}&c=apps`;
      const res = await axios.get(api, { timeout: 20000 });
      return { url: api, found: true };
    } catch { return null; }
  },

  // Google Images
  gimg: async (query) => {
    try {
      const api = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&client_id=demo`;
      const res = await axios.get(api, { timeout: 20000 });
      const images = res.data?.results || [];
      return images.map(img => ({
        url: img.urls?.regular,
        thumb: img.urls?.thumb,
        author: img.user?.name
      }));
    } catch { return null; }
  },

  // Wikipedia
  wiki: async (query) => {
    try {
      const api = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const res = await axios.get(api, { timeout: 20000 });
      return {
        title: res.data?.title,
        extract: res.data?.extract,
        url: res.data?.content_urls?.desktop?.page,
        image: res.data?.thumbnail?.source
      };
    } catch { return null; }
  },

  // Dictionary
  dictionary: async (word) => {
    try {
      const api = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
      const res = await axios.get(api, { timeout: 20000 });
      const data = res.data[0];
      const meanings = data?.meanings?.[0];
      return {
        word: data?.word,
        phonetic: data?.phonetic,
        definition: meanings?.definitions?.[0]?.definition,
        example: meanings?.definitions?.[0]?.example,
        partOfSpeech: meanings?.partOfSpeech
      };
    } catch { return null; }
  },

  // YTS Movies
  yts: async (query) => {
    try {
      const api = `https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(query)}&limit=5`;
      const res = await axios.get(api, { timeout: 20000 });
      const movies = res.data?.data?.movies || [];
      return movies.map(m => ({
        title: m.title,
        year: m.year,
        rating: m.rating,
        genres: m.genres?.join(', '),
        image: m.medium_cover_image,
        url: m.url,
        torrents: m.torrents?.map(t => `${t.quality} - ${t.size}`)
      }));
    } catch { return null; }
  },

  // News
  news: async (query) => {
    try {
      const api = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=demo&pageSize=5`;
      const res = await axios.get(api, { timeout: 20000 });
      const articles = res.data?.articles || [];
      return articles.map(a => ({
        title: a.title,
        source: a.source?.name,
        description: a.description,
        url: a.url,
        image: a.urlToImage,
        date: a.publishedAt
      }));
    } catch { return null; }
  },
};

// ── Main Handler ──────────────────────────────────────────────────
const downloadSearch = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  const commands = {
    // Downloads
    gitclone: { type: 'download', service: 'gitclone', name: 'GitHub Clone', example: 'https://github.com/user/repo' },
    snackdl: { type: 'download', service: 'snack', name: 'Snack Video', example: 'snack video url' },
    dailymotiondl: { type: 'download', service: 'dailymotion', name: 'Dailymotion', example: 'dailymotion url' },
    pinterest: { type: 'download', service: 'pinterest', name: 'Pinterest', example: 'pinterest url' },
    twitter: { type: 'download', service: 'twitter', name: 'Twitter', example: 'twitter url' },
    spotify: { type: 'download', service: 'spotify', name: 'Spotify', example: 'spotify track url' },
    soundcloud: { type: 'download', service: 'soundcloud', name: 'SoundCloud', example: 'soundcloud url' },
    likee: { type: 'download', service: 'likee', name: 'Likee', example: 'likee url' },

    // Search
    google: { type: 'search', service: 'google', name: 'Google Search' },
    wiki: { type: 'search', service: 'wiki', name: 'Wikipedia' },
    define: { type: 'search', service: 'dictionary', name: 'Dictionary' },
    dictionary: { type: 'search', service: 'dictionary', name: 'Dictionary' },
    playstore: { type: 'search', service: 'playstore', name: 'Play Store' },
    apk: { type: 'search', service: 'apk', name: 'APK Download' },
    gimg: { type: 'search', service: 'gimg', name: 'Google Images' },
    yts: { type: 'search', service: 'yts', name: 'YTS Movies' },
    news: { type: 'search', service: 'news', name: 'News Search' },

    // AI-powered searches
    drama: { type: 'ai', service: 'drama', name: 'Drama Info', context: 'You are a drama/TV series expert. Provide detailed information about dramas, including plot, cast, ratings, and where to watch.' },
    dramasearch: { type: 'ai', service: 'drama', name: 'Drama Search', context: 'You are a drama search engine. Find and list dramas based on the user query with titles, years, genres, and brief descriptions.' },
    dramainfo: { type: 'ai', service: 'drama', name: 'Drama Details', context: 'You are a drama database. Provide comprehensive information including synopsis, cast, episodes, ratings, and streaming platforms.' },
    lyrics: { type: 'ai', service: 'lyrics', name: 'Song Lyrics', context: 'You are a lyrics database. Provide complete song lyrics with artist name and song title. Format lyrics with verse/chorus labels.' },
    lyricsai: { type: 'ai', service: 'lyrics', name: 'AI Lyrics', context: 'You are a lyrics finder. Search and display song lyrics accurately. Include artist, song title, and full lyrics.' },
    spotifylyrics: { type: 'ai', service: 'lyrics', name: 'Spotify Lyrics', context: 'You are a Spotify lyrics provider. Show lyrics for songs with timing and structure.' },
    ringtone: { type: 'ai', service: 'ringtone', name: 'Ringtone Search', context: 'You are a ringtone search engine. Suggest popular ringtones and where to download them.' },
    bible: { type: 'ai', service: 'bible', name: 'Bible Search', context: 'You are a Bible reference tool. Provide Bible verses, explanations, and context for any query.' },
    wagroup: { type: 'ai', service: 'wagroup', name: 'WhatsApp Groups', context: 'You are a WhatsApp group directory. Suggest relevant WhatsApp groups based on interests and provide joining guidelines.' },
    playlist: { type: 'ai', service: 'playlist', name: 'Playlist Creator', context: 'You are a music playlist curator. Create playlists based on mood, genre, or activity with 10-15 song suggestions.' },
    hearthis: { type: 'ai', service: 'music', name: 'Hearthis Music', context: 'You are a Hearthis.at music guide. Help users find and download music from Hearthis platform.' },
    shazam: { type: 'ai', service: 'music', name: 'Shazam Search', context: 'You are a music identifier. Help identify songs based on descriptions, lyrics fragments, or artist info.' },
    brave: { type: 'ai', service: 'search', name: 'Brave Search', context: 'You are Brave Search AI. Provide privacy-focused search results and summaries.' },
    unsplash: { type: 'ai', service: 'images', name: 'Unsplash Photos', context: 'You are an Unsplash photo curator. Suggest high-quality free stock photos based on query.' },
    happymod: { type: 'ai', service: 'apk', name: 'HappyMod Search', context: 'You are a HappyMod guide. Help users find modded apps and games with installation tips.' },
    apkmirror: { type: 'ai', service: 'apk', name: 'APKMirror Search', context: 'You are an APKMirror navigator. Guide users to find and download APK files safely.' },
    fm: { type: 'ai', service: 'music', name: 'Last.fm', context: 'You are a Last.fm music expert. Provide music recommendations, artist info, and similar tracks.' },

    // Adult content (18+)
    hentaivid: { type: 'ai', service: 'adult', name: 'Hentai Search [18+]', context: 'You are an anime adult content guide. Help users find hentai content (text descriptions only, no explicit details).' },
    porn: { type: 'ai', service: 'adult', name: 'Adult Search [18+]', context: 'You are an adult content guide. Provide general information about adult entertainment platforms and safety tips.' },
    xxxvideo: { type: 'ai', service: 'adult', name: 'XXX Search [18+]', context: 'You are an adult content directory. Provide information about adult video platforms and safety guidelines.' },
  };

  const cmdInfo = commands[cmd];
  if (!cmdInfo) return;

  // Check if query is provided
  if (!text) {
    await m.React("ℹ️");
    const example = cmdInfo.example || 'your search query';
    return Matrix.sendMessage(m.from, {
      text: `📋 *${cmdInfo.name}*\n\n💡 Usage:\n*${prefix}${cmd} ${example}*\n\n📌 Example:\n*${prefix}${cmd} ${example}*`
    }, { quoted: m });
  }

  await m.React("⏳");

  try {
    // ── AI-powered commands ─────────────────────────────────────
    if (cmdInfo.type === 'ai') {
      const result = await aiSearch(text, cmdInfo.context);
      if (!result) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: '❌ Failed to get results. Try again later.'
        }, { quoted: m });
      }
      await m.React("✅");
      return Matrix.sendMessage(m.from, {
        text: `📋 *${cmdInfo.name}*\n\n${result}`
      }, { quoted: m });
    }

    // ── Download commands ───────────────────────────────────────
    if (cmdInfo.type === 'download') {
      const result = await APIS[cmdInfo.service](text);
      
      if (!result) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: `❌ Failed to download from ${cmdInfo.name}\n\n💡 Check if the URL is valid`
        }, { quoted: m });
      }

      // Handle different download types
      if (result.video) {
        const videoRes = await axios.get(result.video, { responseType: 'arraybuffer', timeout: 60000 });
        await m.React("✅");
        return Matrix.sendMessage(m.from, {
          video: Buffer.from(videoRes.data),
          caption: `📹 *${cmdInfo.name}*\n\n📝 ${result.title || 'Downloaded Video'}`
        }, { quoted: m });
      }

      if (result.audio) {
        const audioRes = await axios.get(result.audio, { responseType: 'arraybuffer', timeout: 60000 });
        await m.React("✅");
        return Matrix.sendMessage(m.from, {
          audio: Buffer.from(audioRes.data),
          mimetype: 'audio/mpeg',
          ptt: false
        }, { quoted: m });
      }

      if (result.media) {
        const mediaRes = await axios.get(result.media, { responseType: 'arraybuffer', timeout: 60000 });
        await m.React("✅");
        if (result.type === 'image') {
          return Matrix.sendMessage(m.from, {
            image: Buffer.from(mediaRes.data),
            caption: `🖼️ *${cmdInfo.name}*`
          }, { quoted: m });
        } else {
          return Matrix.sendMessage(m.from, {
            video: Buffer.from(mediaRes.data),
            caption: `📹 *${cmdInfo.name}*`
          }, { quoted: m });
        }
      }

      if (result.download) {
        await m.React("✅");
        return Matrix.sendMessage(m.from, {
          text: `📦 *${cmdInfo.name}*\n\n${result.info || ''}\n\n🔗 Download: ${result.download}`
        }, { quoted: m });
      }
    }

    // ── Search commands ─────────────────────────────────────────
    if (cmdInfo.type === 'search') {
      const result = await APIS[cmdInfo.service](text);

      if (!result) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: `❌ No results found for: *${text}*`
        }, { quoted: m });
      }

      await m.React("✅");

      // Wikipedia
      if (cmdInfo.service === 'wiki') {
        let msg = `📚 *Wikipedia - ${result.title}*\n\n${result.extract}\n\n🔗 ${result.url}`;
        if (result.image) {
          const imgRes = await axios.get(result.image, { responseType: 'arraybuffer', timeout: 30000 });
          return Matrix.sendMessage(m.from, {
            image: Buffer.from(imgRes.data),
            caption: msg
          }, { quoted: m });
        }
        return Matrix.sendMessage(m.from, { text: msg }, { quoted: m });
      }

      // Dictionary
      if (cmdInfo.service === 'dictionary') {
        return Matrix.sendMessage(m.from, {
          text: `📖 *Dictionary - ${result.word}*\n\n🔊 Phonetic: ${result.phonetic || 'N/A'}\n📝 Part of Speech: ${result.partOfSpeech}\n\n*Definition:*\n${result.definition}\n\n*Example:*\n${result.example || 'N/A'}`
        }, { quoted: m });
      }

      // Images
      if (cmdInfo.service === 'gimg' && Array.isArray(result)) {
        for (const img of result.slice(0, 3)) {
          const imgRes = await axios.get(img.url, { responseType: 'arraybuffer', timeout: 30000 });
          await Matrix.sendMessage(m.from, {
            image: Buffer.from(imgRes.data),
            caption: `📸 By: ${img.author}`
          }, { quoted: m });
        }
        return;
      }

      // YTS Movies
      if (cmdInfo.service === 'yts' && Array.isArray(result)) {
        let msg = `🎬 *YTS Movies - ${text}*\n\n`;
        for (const movie of result) {
          msg += `📽️ *${movie.title}* (${movie.year})\n⭐ ${movie.rating}/10\n🎭 ${movie.genres}\n📦 ${movie.torrents?.join(', ')}\n🔗 ${movie.url}\n\n`;
        }
        return Matrix.sendMessage(m.from, { text: msg }, { quoted: m });
      }

      // News
      if (cmdInfo.service === 'news' && Array.isArray(result)) {
        let msg = `📰 *News - ${text}*\n\n`;
        for (const article of result) {
          msg += `📌 *${article.title}*\n🗞️ ${article.source}\n📝 ${article.description}\n🔗 ${article.url}\n\n`;
        }
        return Matrix.sendMessage(m.from, { text: msg }, { quoted: m });
      }

      // Generic search result
      return Matrix.sendMessage(m.from, {
        text: `🔍 *${cmdInfo.name}*\n\nResults for: *${text}*\n\n${JSON.stringify(result, null, 2)}`
      }, { quoted: m });
    }

  } catch (error) {
    console.error(`${cmd} error:`, error.message);
    await m.React("❌");
    return Matrix.sendMessage(m.from, {
      text: `❌ *Error*\n\n${error.message}`
    }, { quoted: m });
  }
};

export default downloadSearch;