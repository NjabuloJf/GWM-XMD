import axios from 'axios';
import config from '../config.cjs';

// ── Download APIs with fallbacks ──────────────────────────────────
const DOWNLOAD_APIS = {
  // TikTok APIs
  tiktok: [
    (url) => `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
    (url) => `https://api.tioxy.id/api/tiktok?url=${encodeURIComponent(url)}`,
    (url) => `https://api.tikwm.com/api/feed/list?url=${encodeURIComponent(url)}`,
  ],
  // Instagram APIs
  instagram: [
    (url) => `https://api.saveig.app/api/download?url=${encodeURIComponent(url)}`,
    (url) => `https://api.downloadgram.org/media?url=${encodeURIComponent(url)}`,
    (url) => `https://api.insta-downloader.com/download?url=${encodeURIComponent(url)}`,
  ],
  // Facebook APIs
  facebook: [
    (url) => `https://api.fdownloader.net/api/ajaxSearch?url=${encodeURIComponent(url)}`,
    (url) => `https://api.savefrom.net/download?url=${encodeURIComponent(url)}`,
    (url) => `https://api.getfbvideo.com/download?url=${encodeURIComponent(url)}`,
  ],
};

// ── Detect platform from URL ──────────────────────────────────────
const detectPlatform = (url) => {
  const lower = url.toLowerCase();
  
  if (lower.includes('tiktok.com') || lower.includes('vm.tiktok.com') || lower.includes('vt.tiktok.com')) {
    return 'tiktok';
  }
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    return 'instagram';
  }
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) {
    return 'facebook';
  }
  
  return null;
};

// ── Validate URL ──────────────────────────────────────────────────
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

// ── Download from TikTok ──────────────────────────────────────────
const downloadTikTok = async (url) => {
  for (const apiFunc of DOWNLOAD_APIS.tiktok) {
    try {
      const apiUrl = apiFunc(url);
      const res = await axios.get(apiUrl, { timeout: 30000 });
      
      // Try different response formats
      const data = res.data;
      
      // Format 1: Direct video URL
      if (data.video || data.videoUrl || data.url) {
        const videoUrl = data.video || data.videoUrl || data.url;
        return {
          video: videoUrl,
          audio: data.audio || data.music || null,
          title: data.title || data.description || 'TikTok Video',
          thumbnail: data.thumbnail || data.cover || null,
          author: data.author || data.username || 'Unknown'
        };
      }
      
      // Format 2: Nested data
      if (data.data) {
        const d = data.data;
        return {
          video: d.play || d.wmplay || d.hdplay || d.video,
          audio: d.music || d.audio || null,
          title: d.title || d.desc || 'TikTok Video',
          thumbnail: d.cover || d.origin_cover || null,
          author: d.author?.nickname || d.author?.unique_id || 'Unknown'
        };
      }
      
      // Format 3: Result array
      if (data.result && Array.isArray(data.result) && data.result.length > 0) {
        const r = data.result[0];
        return {
          video: r.url || r.video,
          audio: r.audio || null,
          title: r.title || 'TikTok Video',
          thumbnail: r.thumbnail || null,
          author: r.author || 'Unknown'
        };
      }
      
    } catch (error) {
      console.error(`TikTok API failed: ${error.message}`);
      continue;
    }
  }
  return null;
};

// ── Download from Instagram ───────────────────────────────────────
const downloadInstagram = async (url) => {
  for (const apiFunc of DOWNLOAD_APIS.instagram) {
    try {
      const apiUrl = apiFunc(url);
      const res = await axios.get(apiUrl, { timeout: 30000 });
      const data = res.data;
      
      // Format 1: Direct URLs
      if (data.video_url || data.url || data.downloadUrl) {
        return {
          video: data.video_url || data.url || data.downloadUrl,
          thumbnail: data.thumbnail || data.thumb || null,
          title: data.title || data.caption || 'Instagram Media',
          author: data.username || data.owner || 'Unknown'
        };
      }
      
      // Format 2: Nested data
      if (data.data) {
        const d = data.data;
        return {
          video: d.video_url || d.url || (Array.isArray(d) ? d[0]?.url : null),
          thumbnail: d.thumbnail_url || d.thumb,
          title: d.caption || 'Instagram Media',
          author: d.username || 'Unknown'
        };
      }
      
      // Format 3: Media array
      if (data.media && Array.isArray(data.media) && data.media.length > 0) {
        const m = data.media[0];
        return {
          video: m.url || m.video_url,
          thumbnail: m.thumbnail,
          title: data.caption || 'Instagram Media',
          author: data.username || 'Unknown'
        };
      }
      
    } catch (error) {
      console.error(`Instagram API failed: ${error.message}`);
      continue;
    }
  }
  return null;
};

// ── Download from Facebook ────────────────────────────────────────
const downloadFacebook = async (url) => {
  for (const apiFunc of DOWNLOAD_APIS.facebook) {
    try {
      const apiUrl = apiFunc(url);
      const res = await axios.get(apiUrl, { timeout: 30000 });
      const data = res.data;
      
      // Format 1: Direct links
      if (data.links || data.url || data.video) {
        const links = data.links || [{ url: data.url || data.video }];
        const hdLink = links.find(l => l.quality === 'HD' || l.quality === 'hd') || links[0];
        
        return {
          video: hdLink?.url || hdLink?.link || data.url || data.video,
          title: data.title || data.description || 'Facebook Video',
          thumbnail: data.thumbnail || data.thumb || null,
          author: data.author || data.uploader || 'Unknown'
        };
      }
      
      // Format 2: Nested data
      if (data.data) {
        const d = data.data;
        return {
          video: d.hd || d.sd || d.url || d.video,
          title: d.title || 'Facebook Video',
          thumbnail: d.thumbnail || null,
          author: d.author || 'Unknown'
        };
      }
      
      // Format 3: Result object
      if (data.result) {
        const r = data.result;
        return {
          video: r.hd || r.sd || r.url,
          title: r.title || 'Facebook Video',
          thumbnail: r.thumbnail || null,
          author: r.owner || 'Unknown'
        };
      }
      
    } catch (error) {
      console.error(`Facebook API failed: ${error.message}`);
      continue;
    }
  }
  return null;
};

// ── Main downloader function ──────────────────────────────────────
const downloadMedia = async (url, platform) => {
  switch (platform) {
    case 'tiktok':
      return await downloadTikTok(url);
    case 'instagram':
      return await downloadInstagram(url);
    case 'facebook':
      return await downloadFacebook(url);
    default:
      return null;
  }
};

// ── Main command handler ──────────────────────────────────────────
const downloader = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  const commands = {
    // TikTok
    tiktok: 'tiktok',
    tt: 'tiktok',
    ttdl: 'tiktok',
    tiktokdl: 'tiktok',
    
    // Instagram
    ig: 'instagram',
    insta: 'instagram',
    instagram: 'instagram',
    igdl: 'instagram',
    
    // Facebook
    fb: 'facebook',
    facebook: 'facebook',
    fbdl: 'facebook',
    
    // Auto-detect
    download: 'auto',
    dl: 'auto',
    get: 'auto',
  };

  const platform = commands[cmd];
  if (!platform) return;

  // ── No URL provided ───────────────────────────────────────────
  if (!text) {
    await m.React("ℹ️");
    const examples = {
      tiktok: `📱 *TikTok Downloader*\n\n💡 Usage:\n*${prefix}${cmd} [TikTok URL]*\n\n📌 Example:\n*${prefix}${cmd} https://vt.tiktok.com/ZSj...*\n\n✨ Downloads video without watermark + audio`,
      instagram: `📸 *Instagram Downloader*\n\n💡 Usage:\n*${prefix}${cmd} [Instagram URL]*\n\n📌 Example:\n*${prefix}${cmd} https://instagram.com/p/...*\n\n✨ Downloads reels, posts, IGTV, stories`,
      facebook: `📘 *Facebook Downloader*\n\n💡 Usage:\n*${prefix}${cmd} [Facebook URL]*\n\n📌 Example:\n*${prefix}${cmd} https://fb.watch/...*\n\n✨ Downloads videos in HD quality`,
      auto: `🤖 *Auto Downloader*\n\n💡 Usage:\n*${prefix}${cmd} [URL]*\n\n📌 Supports:\n• TikTok\n• Instagram\n• Facebook\n\n✨ Just paste any URL and I'll detect it!`
    };
    
    return Matrix.sendMessage(m.from, { text: examples[platform] || examples.auto }, { quoted: m });
  }

  // ── Validate URL ──────────────────────────────────────────────
  if (!isValidUrl(text)) {
    await m.React("❌");
    return Matrix.sendMessage(m.from, {
      text: `❌ *Invalid URL*\n\n💡 Please provide a valid URL\n\n📌 Example:\n*${prefix}${cmd} https://tiktok.com/...*`
    }, { quoted: m });
  }

  // ── Auto-detect platform ──────────────────────────────────────
  let detectedPlatform = platform;
  if (platform === 'auto') {
    detectedPlatform = detectPlatform(text);
    if (!detectedPlatform) {
      await m.React("❌");
      return Matrix.sendMessage(m.from, {
        text: `❌ *Unsupported Platform*\n\n✅ Supported:\n• TikTok\n• Instagram\n• Facebook\n\n💡 Please use a supported platform URL`
      }, { quoted: m });
    }
  }

  await m.React("⏳");

  try {
    // ── Download media ────────────────────────────────────────
    const result = await downloadMedia(text, detectedPlatform);

    if (!result || !result.video) {
      await m.React("❌");
      return Matrix.sendMessage(m.from, {
        text: `❌ *Download Failed*\n\n⚠️ Could not fetch media from this URL\n\n💡 Possible reasons:\n• Private account\n• Deleted content\n• Invalid URL\n• Server temporarily down\n\n🔄 Please try again or use a different URL`
      }, { quoted: m });
    }

    // ── Send caption with info ────────────────────────────────
    const platformEmoji = {
      tiktok: '📱',
      instagram: '📸',
      facebook: '📘'
    };

    const caption = `${platformEmoji[detectedPlatform]} *${detectedPlatform.toUpperCase()} DOWNLOADER*

📝 *Title:* ${result.title || 'No title'}
👤 *Author:* ${result.author || 'Unknown'}

✅ Downloaded successfully!`;

    // ── Download and send video ───────────────────────────────
    const videoResponse = await axios.get(result.video, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const videoBuffer = Buffer.from(videoResponse.data);

    await m.React("✅");

    // Send video
    await Matrix.sendMessage(m.from, {
      video: videoBuffer,
      caption: caption,
      mimetype: 'video/mp4'
    }, { quoted: m });

    // ── Send audio if available (TikTok) ──────────────────────
    if (result.audio && detectedPlatform === 'tiktok') {
      try {
        const audioResponse = await axios.get(result.audio, {
          responseType: 'arraybuffer',
          timeout: 60000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const audioBuffer = Buffer.from(audioResponse.data);

        await Matrix.sendMessage(m.from, {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          ptt: false
        }, { quoted: m });

      } catch (audioError) {
        console.error('Audio download failed:', audioError.message);
      }
    }

  } catch (error) {
    console.error(`Download error [${detectedPlatform}]:`, error.message);
    await m.React("❌");
    
    return Matrix.sendMessage(m.from, {
      text: `❌ *Download Error*\n\n⚠️ ${error.message}\n\n🔄 Please try again\n\n💡 If issue persists:\n• Check if the link is valid\n• Try a different ${detectedPlatform} link\n• The video might be private or deleted`
    }, { quoted: m });
  }
};

export default downloader;