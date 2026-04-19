
import axios from "axios";
import config from '../config.cjs';

const repo = async (m, gss) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";
  
  if (["repo", "sc", "script", "info"].includes(cmd)) {
    try {
      const response = await axios.get(`https://api.github.com/repos/NjabuloJ/Njabulo-Jb`);
      const data = response.data;
      const msg = `
*Repo Name:* ${data.name}
*Stars:* ${data.stargazers_count}
*Forks:* ${data.forks_count}
*Description:* ${data.description}
      `;
      await gss.sendMessage(m.from, { text: msg });
    } catch (error) {
      console.error(error);
      await gss.sendMessage(m.from, { text: "Error fetching repo info 😕" });
    }
  }
}

export default repo;

