
import axios from 'axios';
import config from '../config.cjs';

const imageCommand = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const query = m.body.slice(prefix.length + cmd.length).trim();
  const validCommands = ['image', 'img', 'gimage'];

  if (validCommands.includes(cmd)) {
    if (!query) return Matrix.sendMessage(m.from, { text: 'Please provide a search query' });

    try {
      await Matrix.sendMessage(m.from, { text: '*⏳ Searching for images...*' });

      const res = await axios.get(`https://apiskeith.vercel.app/search/images?query=${encodeURIComponent(query)}`);
      const images = res.data.result;

      if (!images.length) return Matrix.sendMessage(m.from, { text: 'No images found' });

      for (const [i, image] of images.slice(0, 5).entries()) {
        const caption = `📸 Image ${i + 1}\n🔍 Search: ${query}\nSize: ${image.size || 'Unknown'}\nView Original: ${image.url}`;
        await Matrix.sendMessage(m.from, { image: { url: image.url }, caption });
      }

      await m.React("✅");
    } catch (error) {
      console.error(error);
      Matrix.sendMessage(m.from, { text: `Error searching images: ${error.message}` });
    }
  }
};

export default imageCommand;

