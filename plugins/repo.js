import axios from "axios";
import config from '../config.cjs';

const repo = async (m, gss) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";

  if (["repo", "sc", "script", "info"].includes(cmd)) {
    const githubRepoURL = "https://github.com/NjabuloJ/Njabulo-Jb";

    try {
      // Extract username and repo name from the URL
      const urlMatch = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);
      
      if (!urlMatch) {
        throw new Error("Invalid GitHub URL format.");
      }
      
      const [, username, repoName] = urlMatch;

      // Fetch repository details using GitHub API
      const response = await axios.get(
        `https://api.github.com/repos/${username}/${repoName}`,
        {
          headers: {
            'User-Agent': 'Njabulo-Jb', // GitHub API requires a user-agent
            'Accept': 'application/vnd.github.v3+json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.status !== 200 || !response.data) {
        throw new Error("GitHub API request failed.");
      }

      const repoData = response.data;

      // Format the repository information
      const formattedInfo = ` *══════════════*
*GWM-XMD REPOSITORY INFO* 
*Total* Stars: ${repoData.stargazers_count}
*Total* Forks: ${repoData.forks_count}
*Owner: njabulojb.co*
*Updated:* ${new Date(repoData.updated_at).toLocaleDateString()}
*CREATED:* ${new Date(repoData.created_at).toLocaleDateString()}
*¦═══════════════*

*______________________*
 Reply with a number to choose an action:
1️⃣ Open GitHub Repo 
2️⃣ Open WhatsApp Channel 
3️⃣ Ping Bot 
4️⃣ Repo Alive Audio 
*_____________________*
*¦════════¦*
*⿻│①◦ Get more bot for GWM-XMD*
*⿻│②◦ Visit njabulobot.vercel.app*
*════════>*
`;

      
      // Send image with repo info
      await gss.sendMessage(
        m.from,
        {
         document: { url: repoData.html_url },
         mimetype: 'application/pdf',
         fileName:  `⭐ ${repoData.stargazers_count} Stars | 🍴 ${repoData.forks_count} Forks`,       
         caption: formattedInfo,
         contextInfo: {
         mentionedJid: [m.sender],
         isForwarded: true,
          forwardedNewsletterMessageInfo: {
          newsletterJid: config.ID_CHANNEL,
          newsletterName: "╭••➤GWM-XMD",
          serverMessageId: 143,
         },
          forwardingScore: 999,
          externalAdReply: {
            title: `${repoData.name} Repository`,
            mediaType: 1,
            previewType: 0,
            thumbnailUrl: repoData.owner.avatar_url,
            renderLargerThumbnail: true,
          },
        },
        }, { quoted: m });

      
    } catch (error) {
      console.error("Error in repo command:", error);
      
      // More specific error messages
      let errorMessage = "Sorry, something went wrong while fetching the repository information.";
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. The GitHub API is taking too long to respond.";
      } else if (error.response?.status === 404) {
        errorMessage = "Repository not found. It may have been moved or deleted.";
      } else if (error.response?.status === 403) {
        errorMessage = "API rate limit exceeded. Please try again later.";
      } else if (error.message.includes("Invalid GitHub URL")) {
        errorMessage = "Invalid repository URL configured.";
      }
      
      await m.reply(errorMessage);
    }
  }
};

export default repo;
