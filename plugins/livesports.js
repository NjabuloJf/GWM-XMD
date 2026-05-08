import axios from 'axios';
import config from '../config.cjs';

const POLL_TEXT = 'https://text.pollinations.ai';

// ── AI Analysis for Betting Predictions ───────────────────────────
const aiPredict = async (matchData, context) => {
  try {
    const res = await axios.post(POLL_TEXT, {
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: matchData }
      ],
      model: 'openai',
      jsonMode: false
    }, { timeout: 30000 });
    return res.data?.choices?.[0]?.message?.content?.trim() || res.data?.trim() || null;
  } catch {
    try {
      const r = await axios.get(`${POLL_TEXT}/${encodeURIComponent(matchData)}?system=${encodeURIComponent(context)}`, { timeout: 30000 });
      return typeof r.data === 'string' ? r.data.trim() : null;
    } catch { return null; }
  }
};

// ── Sports APIs ───────────────────────────────────────────────────
const SPORTS_APIS = {
  // Live Scores
  livescores: async (sport = 'football') => {
    const apis = [
      `https://api.sofascore.com/api/v1/sport/${sport}/events/live`,
      `https://api.livescore.com/v1/live/${sport}`,
      `https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all`
    ];
    
    for (const api of apis) {
      try {
        const res = await axios.get(api, { timeout: 20000 });
        if (res.data?.events || res.data?.matches || res.data?.response) {
          return res.data.events || res.data.matches || res.data.response;
        }
      } catch { continue; }
    }
    return null;
  },

  // Team Search
  teamSearch: async (teamName) => {
    const apis = [
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`,
      `https://api-football-v1.p.rapidapi.com/v3/teams?search=${encodeURIComponent(teamName)}`
    ];
    
    for (const api of apis) {
      try {
        const res = await axios.get(api, { timeout: 20000 });
        if (res.data?.teams || res.data?.response) {
          return res.data.teams || res.data.response;
        }
      } catch { continue; }
    }
    return null;
  },

  // Fixtures
  fixtures: async (league = 'premier-league') => {
    const apis = [
      `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${league}`,
      `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${league}&next=10`
    ];
    
    for (const api of apis) {
      try {
        const res = await axios.get(api, { timeout: 20000 });
        if (res.data?.events || res.data?.response) {
          return res.data.events || res.data.response;
        }
      } catch { continue; }
    }
    return null;
  },

  // Standings
  standings: async (league = '39') => {
    const apis = [
      `https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=${league}`,
      `https://api-football-v1.p.rapidapi.com/v3/standings?league=${league}&season=2024`
    ];
    
    for (const api of apis) {
      try {
        const res = await axios.get(api, { timeout: 20000 });
        if (res.data?.table || res.data?.response) {
          return res.data.table || res.data.response;
        }
      } catch { continue; }
    }
    return null;
  },

  // Top Scorers
  topscorers: async (league = '39') => {
    const apis = [
      `https://api-football-v1.p.rapidapi.com/v3/players/topscorers?league=${league}&season=2024`,
      `https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=${league}`
    ];
    
    for (const api of apis) {
      try {
        const res = await axios.get(api, { timeout: 20000 });
        if (res.data?.response || res.data?.scorers) {
          return res.data.response || res.data.scorers;
        }
      } catch { continue; }
    }
    return null;
  },

  // Player Search
  playerSearch: async (playerName) => {
    const apis = [
      `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(playerName)}`,
      `https://api-football-v1.p.rapidapi.com/v3/players?search=${encodeURIComponent(playerName)}`
    ];
    
    for (const api of apis) {
      try {
        const res = await axios.get(api, { timeout: 20000 });
        if (res.data?.player || res.data?.response) {
          return res.data.player || res.data.response;
        }
      } catch { continue; }
    }
    return null;
  },

  // Live TV Streams
  liveTV: async () => {
    return {
      channels: [
        { name: 'Sky Sports Football', url: 'https://stream.skysports.com/football', category: 'Football' },
        { name: 'BT Sport 1', url: 'https://stream.btsport.com/1', category: 'Multi-Sport' },
        { name: 'ESPN', url: 'https://stream.espn.com/live', category: 'Multi-Sport' },
        { name: 'beIN Sports', url: 'https://stream.beinsports.com/live', category: 'Football' },
        { name: 'SuperSport', url: 'https://stream.supersport.com/live', category: 'Multi-Sport' },
        { name: 'DAZN', url: 'https://stream.dazn.com/live', category: 'Multi-Sport' },
        { name: 'NBC Sports', url: 'https://stream.nbcsports.com/live', category: 'Multi-Sport' },
        { name: 'TNT Sports', url: 'https://stream.tntsports.com/live', category: 'Multi-Sport' }
      ]
    };
  }
};

// ── Main Sports Command Handler ───────────────────────────────────
const sportsBetway = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  const commands = {
    // Live Sports
    livesports: { name: 'Live Sports', desc: 'All live sports matches right now' },
    sportscats: { name: 'Sports Categories', desc: 'Browse sports by category' },
    flive: { name: 'Football Live', desc: 'Live football matches' },
    flive2: { name: 'Football Live 2', desc: 'Alternative live football feed' },
    livescore: { name: 'Live Scores', desc: 'Current live scores all sports' },
    
    // Predictions & Analysis
    predictions: { name: 'Match Predictions', desc: 'AI predictions for upcoming matches' },
    betpredict: { name: 'Betting Predictions', desc: 'Which team will win - AI analysis' },
    betanalysis: { name: 'Bet Analysis', desc: 'Deep betting analysis with odds' },
    
    // News & Updates
    fstream: { name: 'Football Streams', desc: 'Live football streaming links' },
    fnews: { name: 'Football News', desc: 'Latest football news' },
    sportnews: { name: 'Sports News', desc: 'Latest sports news all categories' },
    
    // Team & Player Info
    team: { name: 'Team Info', desc: 'Search any team details' },
    player: { name: 'Player Info', desc: 'Search player stats and info' },
    stadium: { name: 'Stadium Info', desc: 'Stadium details and capacity' },
    
    // Standings & Stats
    standings: { name: 'League Standings', desc: 'Current league table' },
    topscorers: { name: 'Top Scorers', desc: 'Leading goal scorers' },
    fixtures: { name: 'Fixtures', desc: 'Upcoming matches schedule' },
    gamehistory: { name: 'Game History', desc: 'Head-to-head match history' },
    
    // Live TV
    livetv: { name: 'Live TV', desc: 'Sports TV channels streaming' },
    watchlive: { name: 'Watch Live', desc: 'Stream live sports on WhatsApp' },
    tvguide: { name: 'TV Guide', desc: 'What\'s on sports TV now' },
    skysports: { name: 'Sky Sports Live', desc: 'Sky Sports streams' },
    btsport: { name: 'BT Sport Live', desc: 'BT Sport streams' },
    espn: { name: 'ESPN Live', desc: 'ESPN streams' },
    bein: { name: 'beIN Sports Live', desc: 'beIN Sports streams' },
    supersport: { name: 'SuperSport Live', desc: 'SuperSport streams' },
    dazn: { name: 'DAZN Live', desc: 'DAZN streams' },
    
    // Basketball
    blive: { name: 'Basketball Live', desc: 'Live NBA/basketball matches' },
  };

  const cmdInfo = commands[cmd];
  if (!cmdInfo) return;

  await m.React("⏳");

  try {
    // ──────────────────────────────────────────────────────────────
    // LIVE SPORTS & SCORES
    // ──────────────────────────────────────────────────────────────
    if (cmd === 'livesports' || cmd === 'flive' || cmd === 'flive2' || cmd === 'livescore') {
      const liveMatches = await SPORTS_APIS.livescores('football');
      
      if (!liveMatches || liveMatches.length === 0) {
        await m.React("ℹ️");
        return Matrix.sendMessage(m.from, {
          text: '📺 *No Live Matches Currently*\n\n⚽ No football matches are live right now.\n\n💡 Try:\n*${prefix}fixtures* - Upcoming matches\n*${prefix}predictions* - Match predictions'
        }, { quoted: m });
      }

      let msg = `⚽ *LIVE FOOTBALL MATCHES* 🔴\n\n`;
      
      for (const match of liveMatches.slice(0, 10)) {
        const home = match.homeTeam?.name || match.home || 'Home Team';
        const away = match.awayTeam?.name || match.away || 'Away Team';
        const score = match.score || `${match.homeScore || 0} - ${match.awayScore || 0}`;
        const time = match.status?.elapsed || match.minute || 'LIVE';
        const league = match.league?.name || match.competition || '';
        
        msg += `🏆 *${league}*\n`;
        msg += `⚽ ${home} *${score}* ${away}\n`;
        msg += `⏱️ ${time}'\n\n`;
      }
      
      msg += `\n💡 *Commands:*\n`;
      msg += `*${prefix}predictions* - AI predictions\n`;
      msg += `*${prefix}watchlive* - Stream live\n`;
      msg += `*${prefix}team <name>* - Team details`;

      await m.React("✅");
      return Matrix.sendMessage(m.from, { text: msg }, { quoted: m });
    }

    // ──────────────────────────────────────────────────────────────
    // PREDICTIONS & BETTING ANALYSIS
    // ──────────────────────────────────────────────────────────────
    if (cmd === 'predictions' || cmd === 'betpredict' || cmd === 'betanalysis') {
      const upcomingMatches = await SPORTS_APIS.fixtures();
      
      if (!upcomingMatches || upcomingMatches.length === 0) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: '❌ No upcoming matches found'
        }, { quoted: m });
      }

      const match = upcomingMatches[0];
      const home = match.homeTeam || match.strHomeTeam || 'Home Team';
      const away = match.awayTeam || match.strAwayTeam || 'Away Team';
      const league = match.league || match.strLeague || 'League';
      const date = match.dateEvent || match.date || 'TBD';

      const aiContext = `You are a professional sports betting analyst. Analyze this upcoming football match and provide:
1. Win probability for each team (percentage)
2. Recommended bet (1X2)
3. Over/Under 2.5 goals prediction
4. Both teams to score (Yes/No)
5. Key factors influencing the prediction
6. Risk level (Low/Medium/High)

Format your response clearly with emojis and betting odds.`;

      const matchInfo = `Match: ${home} vs ${away}\nLeague: ${league}\nDate: ${date}`;
      
      const prediction = await aiPredict(matchInfo, aiContext);

      if (!prediction) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: '❌ Failed to generate prediction'
        }, { quoted: m });
      }

      const msg = `🎯 *BETTING PREDICTION*\n\n⚽ *${home}* vs *${away}*\n🏆 ${league}\n📅 ${date}\n\n━━━━━━━━━━━━━━━\n\n${prediction}\n\n━━━━━━━━━━━━━━━\n\n⚠️ *Disclaimer:* Predictions are AI-generated. Always bet responsibly!\n\n💡 *Powered by NjabuloAI*`;

      await m.React("✅");
      return Matrix.sendMessage(m.from, { text: msg }, { quoted: m });
    }

    // ──────────────────────────────────────────────────────────────
    // TEAM SEARCH & INFO
    // ──────────────────────────────────────────────────────────────
    if (cmd === 'team') {
      if (!text) {
        await m.React("ℹ️");
        return Matrix.sendMessage(m.from, {
          text: `🔍 *Team Search*\n\n💡 Usage:\n*${prefix}team Manchester United*\n*${prefix}team Barcelona*\n*${prefix}team Real Madrid*`
        }, { quoted: m });
      }

      const teams = await SPORTS_APIS.teamSearch(text);
      
      if (!teams || teams.length === 0) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: `❌ No team found for: *${text}*`
        }, { quoted: m });
      }

      const team = Array.isArray(teams) ? teams[0] : teams;
      
      // AI analysis of the team
      const teamContext = `You are a football analyst. Provide detailed information about this team including:
1. Current form and recent performance
2. Key players and star performers
3. Manager and tactics
4. Strengths and weaknesses
5. Betting tips when they play
6. Expected performance this season

Be specific and helpful for betting purposes.`;

      const teamInfo = `Team: ${team.strTeam || text}
League: ${team.strLeague || 'Unknown'}
Stadium: ${team.strStadium || 'Unknown'}`;

      const analysis = await aiPredict(teamInfo, teamContext);

      let msg = `⚽ *TEAM INFO: ${team.strTeam || text}*\n\n`;
      msg += `🏆 *League:* ${team.strLeague || 'N/A'}\n`;
      msg += `🏟️ *Stadium:* ${team.strStadium || 'N/A'}\n`;
      msg += `📍 *Location:* ${team.strCountry || 'N/A'}\n`;
      msg += `👕 *Founded:* ${team.intFormedYear || 'N/A'}\n\n`;
      msg += `━━━━━━━━━━━━━━━\n\n`;
      
      if (analysis) {
        msg += `📊 *AI ANALYSIS*\n\n${analysis}\n\n`;
      }
      
      msg += `💡 *Commands:*\n`;
      msg += `*${prefix}fixtures* - Upcoming matches\n`;
      msg += `*${prefix}predictions* - Match predictions`;

      await m.React("✅");
      return Matrix.sendMessage(m.from, { text: msg }, { quoted: m });
    }

    // ──────────────────────────────────────────────────────────────
    // PLAYER SEARCH & INFO
    // ──────────────────────────────────────────────────────────────
    if (cmd === 'player') {
      if (!text) {
        await m.React("ℹ️");
        return Matrix.sendMessage(m.from, {
          text: `🔍 *Player Search*\n\n💡 Usage:\n*${prefix}player Cristiano Ronaldo*\n*${prefix}player Lionel Messi*\n*${prefix}player Erling Haaland*`
        }, { quoted: m });
      }

      const players = await SPORTS_APIS.playerSearch(text);
      
      if (!players || players.length === 0) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: `❌ No player found for: *${text}*`
        }, { quoted: m });
      }

      const player = Array.isArray(players) ? players[0] : players;

      let msg = `👤 *PLAYER INFO: ${player.strPlayer || text}*\n\n`;
      msg += `⚽ *Position:* ${player.strPosition || 'N/A'}\n`;
      msg += `🏆 *Team:* ${player.strTeam || 'N/A'}\n`;
      msg += `🎂 *Age:* ${player.intAge || 'N/A'}\n`;
      msg += `🌍 *Nationality:* ${player.strNationality || 'N/A'}\n`;
      msg += `👕 *Number:* ${player.strNumber || 'N/A'}\n`;
      msg += `⚖️ *Height:* ${player.strHeight || 'N/A'}\n`;
      msg += `⚡ *Weight:* ${player.strWeight || 'N/A'}\n\n`;
      msg += `📝 *Description:*\n${player.strDescriptionEN?.substring(0, 200) || 'No description available'}...`;

      await m.React("✅");
      return Matrix.sendMessage(m.from, { text: msg }, { quoted: m });
    }

    // ──────────────────────────────────────────────────────────────
    // STANDINGS
    // ──────────────────────────────────────────────────────────────
    if (cmd === 'standings') {
      const league = text || '39'; // Default: Premier League
      const standings = await SPORTS_APIS.standings(league);
      
      if (!standings || standings.length === 0) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: '❌ No standings found'
        }, { quoted: m });
      }

      let msg = `📊 *LEAGUE STANDINGS*\n\n`;
      
      standings.slice(0, 10).forEach((team, idx) => {
        const name = team.strTeam || team.team?.name || 'Team';
        const played = team.intPlayed || team.all?.played || 0;
        const points = team.intPoints || team.points || 0;
        const gd = team.intGoalDifference || team.goalsDiff || 0;
        
        const position = idx + 1;
        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
        
        msg += `${medal} *${name}* - ${points}pts (${played}P, GD: ${gd > 0 ? '+' : ''}${gd})\n`;
      });

      await m.React("✅");
      return Matrix.sendMessage(m.from, { text: msg }, { quoted: m });
    }

    // ──────────────────────────────────────────────────────────────
    // TOP SCORERS
    // ──────────────────────────────────────────────────────────────
    if (cmd === 'topscorers') {
      const league = text || '39';
      const scorers = await SPORTS_APIS.topscorers(league);
      
      if (!scorers || scorers.length === 0) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: '❌ No top scorers data found'
        }, { quoted: m });
      }

      let msg = `⚽ *TOP SCORERS*\n\n`;
      
      scorers.slice(0, 10).forEach((scorer, idx) => {
        const name = scorer.player?.name || scorer.strPlayer || 'Player';
        const team = scorer.statistics?.[0]?.team?.name || scorer.strTeam || 'Team';
        const goals = scorer.statistics?.[0]?.goals?.total || scorer.intGoals || 0;
        
        const position = idx + 1;
        const medal = position === 1 ? '👑' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
        
        msg += `${medal} *${name}* (${team}) - ⚽ ${goals} goals\n`;
      });

      await m.React("✅");
      return Matrix.sendMessage(m.from, { text: msg }, { quoted: m });
    }

    // ──────────────────────────────────────────────────────────────
    // FIXTURES
    // ──────────────────────────────────────────────────────────────
    if (cmd === 'fixtures') {
      const league = text || 'premier-league';
      const fixtures = await SPORTS_APIS.fixtures(league);
      
      if (!fixtures || fixtures.length === 0) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: '❌ No upcoming fixtures found'
        }, { quoted: m });
      }

      let msg = `📅 *UPCOMING FIXTURES*\n\n`;
      
      fixtures.slice(0, 10).forEach(match => {
        const home = match.homeTeam || match.strHomeTeam || 'Home';
        const away = match.awayTeam || match.strAwayTeam || 'Away';
        const date = match.dateEvent || match.date || 'TBD';
        const time = match.strTime || match.time || '';
        
        msg += `⚽ *${home}* vs *${away}*\n`;
        msg += `📅 ${date} ${time}\n\n`;
      });
      
      msg += `\n💡 Use *${prefix}predictions* for AI match predictions`;

      await m.React("✅");
      return Matrix.sendMessage(m.from, { text: msg }, { quoted: m });
    }

    // ──────────────────────────────────────────────────────────────
    // LIVE TV STREAMS
    // ──────────────────────────────────────────────────────────────
    if (cmd === 'livetv' || cmd === 'watchlive' || cmd === 'skysports' || 
        cmd === 'btsport' || cmd === 'espn' || cmd === 'bein' || 
        cmd === 'supersport' || cmd === 'dazn' || cmd === 'tvguide') {
      
      const tvData = await SPORTS_APIS.liveTV();
      
      let msg = `📺 *LIVE SPORTS TV CHANNELS*\n\n`;
      msg += `🔴 *Now Streaming:*\n\n`;
      
      tvData.channels.forEach((channel, idx) => {
        msg += `${idx + 1}. 📡 *${channel.name}*\n`;
        msg += `   🏆 ${channel.category}\n`;
        msg += `   🔗 ${channel.url}\n\n`;
      });
      
      msg += `\n━━━━━━━━━━━━━━━\n\n`;
      msg += `⚠️ *How to Watch:*\n`;
      msg += `1. Copy the stream URL\n`;
      msg += `2. Open in your browser\n`;
      msg += `3. Or use a streaming app\n\n`;
      msg += `💡 Some streams may require VPN or subscription\n\n`;
      msg += `🤖 *Powered by NjabuloAI*`;

      await m.React("✅");
      return Matrix.sendMessage(m.from, { text: msg }, { quoted: m });
    }

    // ──────────────────────────────────────────────────────────────
    // SPORTS NEWS
    // ──────────────────────────────────────────────────────────────
    if (cmd === 'fnews' || cmd === 'sportnews') {
      const sport = cmd === 'fnews' ? 'football' : text || 'sports';
      
      const newsContext = `You are a sports news reporter. Provide the latest ${sport} news headlines and summaries. Include:
1. Top 5 breaking news stories
2. Transfer rumors and updates
3. Injury news
4. Upcoming big matches
5. League updates

Format with emojis and make it engaging.`;

      const news = await aiPredict(`Latest ${sport} news`, newsContext);

      if (!news) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, {
          text: '❌ Failed to fetch news'
        }, { quoted: m });
      }

      const msg = `📰 *LATEST ${sport.toUpperCase()} NEWS*\n\n${news}\n\n🤖 *AI-Generated by NjabuloAI*`;

      await m.React("✅");
      return Matrix.sendMessage(m.from, { text: msg }, { quoted: m });
    }

    // ──────────────────────────────────────────────────────────────
    // BASKETBALL LIVE
    // ──────────────────────────────────────────────────────────────
    if (cmd === 'blive') {
      const liveMatches = await SPORTS_APIS.livescores('basketball');
      
      if (!liveMatches || liveMatches.length === 0) {
        await m.React("ℹ️");
        return Matrix.sendMessage(m.from, {
          text: '🏀 *No Live Basketball Matches*\n\nNo games currently live.'
        }, { quoted: m });
      }

      let msg = `🏀 *LIVE BASKETBALL* 🔴\n\n`;
      
      liveMatches.slice(0, 5).forEach(match => {
        const home = match.homeTeam?.name || 'Home';
        const away = match.awayTeam?.name || 'Away';
        const score = `${match.homeScore || 0} - ${match.awayScore || 0}`;
        
        msg += `🏀 *${home}* ${score} *${away}*\n`;
        msg += `⏱️ LIVE\n\n`;
      });

      await m.React("✅");
      return Matrix.sendMessage(m.from, { text: msg }, { quoted: m });
    }

    // ──────────────────────────────────────────────────────────────
    // SPORTS CATEGORIES
    // ──────────────────────────────────────────────────────────────
    if (cmd === 'sportscats') {
      const msg = `🏆 *SPORTS CATEGORIES*\n\n` +
        `⚽ *Football*\n` +
        `*${prefix}flive* - Live matches\n` +
        `*${prefix}predictions* - Match predictions\n` +
        `*${prefix}standings* - League tables\n\n` +
        `🏀 *Basketball*\n` +
        `*${prefix}blive* - Live NBA/Basketball\n\n` +
        `📺 *Live TV*\n` +
        `*${prefix}livetv* - All sports channels\n` +
        `*${prefix}watchlive* - Stream live\n\n` +
        `🔍 *Search*\n` +
        `*${prefix}team <name>* - Team info\n` +
        `*${prefix}player <name>* - Player stats\n\n` +
        `📰 *News*\n` +
        `*${prefix}fnews* - Football news\n` +
        `*${prefix}sportnews* - All sports news`;

      await m.React("✅");
      return Matrix.sendMessage(m.from, { text: msg }, { quoted: m });
    }

  } catch (error) {
    console.error(`${cmd} error:`, error.message);
    await m.React("❌");
    return Matrix.sendMessage(m.from, {
      text: `❌ *Error*\n\n${error.message}\n\n🔄 Please try again later`
    }, { quoted: m });
  }
};

export default sportsBetway;