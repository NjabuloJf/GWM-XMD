import axios from 'axios';
import config from '../config.cjs';

const POLL_TEXT = 'https://text.pollinations.ai';
const POLL_IMAGE = 'https://image.pollinations.ai/prompt';

const callAI = async (persona, prompt) => {
  try {
    const res = await axios.post(POLL_TEXT, {
      messages: [{ role: 'system', content: persona }, { role: 'user', content: prompt }],
      model: 'openai', jsonMode: false
    }, { timeout: 30000 });
    return res.data?.choices?.[0]?.message?.content?.trim() || res.data?.trim() || null;
  } catch {
    try {
      const r = await axios.get(`${POLL_TEXT}/${encodeURIComponent(prompt)}?system=${encodeURIComponent(persona)}`, { timeout: 30000 });
      return typeof r.data === 'string' ? r.data.trim() : null;
    } catch { return null; }
  }
};

const genImage = async (prompt) => {
  try {
    const res = await axios.get(
      `${POLL_IMAGE}/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true`,
      { timeout: 60000, responseType: 'arraybuffer' }
    );
    if (res.data?.byteLength > 1000) return Buffer.from(res.data);
  } catch { return null; }
  return null;
};

const COLOR_AIS = {
  // ── Palette Generators ─────────────────────────────────────────
  khroma: {
    name: 'Khroma',
    info: '🎨 *Khroma*\nAI color palette generator trained on your taste.',
    persona: "You are Khroma AI, a color palette generator. When given a mood, theme, or keywords, generate beautiful color palettes with hex codes, RGB values, and names. Explain why each color works together.",
    type: 'palette'
  },
  coolors: {
    name: 'Coolors AI',
    info: '🌈 *Coolors AI*\nFastest color palette generator, lock + tweak colors.',
    persona: "You are Coolors AI. Generate stunning color palettes with hex codes, names, and usage tips. Suggest which colors to use for backgrounds, text, buttons, and accents.",
    type: 'palette'
  },
  colorhunt: {
    name: 'Color Hunt AI',
    info: '🦊 *Color Hunt AI*\nCurated color palettes for designers and artists.',
    persona: "You are Color Hunt AI. Curate beautiful color palettes for designers. Give hex codes, color names, and suggest use cases like UI, branding, interior design, or fashion.",
    type: 'palette'
  },
  paletton: {
    name: 'Paletton AI',
    info: '🔵 *Paletton AI*\nColor scheme designer with complementary/triadic/split colors.',
    persona: "You are Paletton AI. Create color schemes including complementary, triadic, split-complementary, and analogous palettes. Provide hex codes and color theory explanations.",
    type: 'palette'
  },
  adobe_color: {
    name: 'Adobe Color AI',
    info: '🔴 *Adobe Color AI*\nCreate color themes from images, trends, moods.',
    persona: "You are Adobe Color AI. Extract and generate color themes from descriptions. Provide HEX, RGB, HSL, and CMYK values. Explain color harmony rules used.",
    type: 'palette'
  },
  colormind: {
    name: 'Colormind',
    info: '🧠 *Colormind*\nAI palette generator trained on movies, art, and popular design.',
    persona: "You are Colormind AI. Generate color palettes inspired by movies, art, and popular design trends. Give hex codes and explain the mood each palette creates.",
    type: 'palette'
  },
  huemint: {
    name: 'Huemint',
    info: '🌿 *Huemint*\nAI color palette for brand, website, and illustration.',
    persona: "You are Huemint AI. Generate color palettes specifically for brands, websites, and illustrations. Provide hex codes and show which colors go where in a layout.",
    type: 'palette'
  },
  paletter: {
    name: 'Paletter AI',
    info: '🖼️ *Paletter AI*\nExtract color palettes from any image description.',
    persona: "You are Paletter AI. Extract dominant color palettes from image descriptions. Give hex codes, color names, and percentage of dominance for each color.",
    type: 'palette'
  },
  colorffy: {
    name: 'Colorffy',
    info: '✨ *Colorffy*\nAI gradient and solid color palette generator.',
    persona: "You are Colorffy AI. Generate beautiful gradient and solid color palettes. Provide CSS gradient code, hex codes, and suggest what designs they suit.",
    type: 'palette'
  },
  muzli_color: {
    name: 'Muzli Colors',
    info: '🎯 *Muzli Colors*\nDesign inspiration + AI color matching.',
    persona: "You are Muzli Colors AI. Match and suggest colors for design projects. Provide hex codes, contrast ratios, and accessibility ratings (WCAG AA/AAA).",
    type: 'palette'
  },

  // ── Color Theory & Education ───────────────────────────────────
  colortheory: {
    name: 'Color Theory AI',
    info: '📚 *Color Theory AI*\nLearn color theory — warm/cool, complementary, tints, shades.',
    persona: "You are a Color Theory expert AI. Explain color theory concepts clearly: primary/secondary/tertiary colors, warm vs cool, complementary, analogous, triadic, tints, shades, tones, and color psychology. Give practical examples.",
    type: 'text'
  },
  colorpsych: {
    name: 'Color Psychology AI',
    info: '🧠 *Color Psychology AI*\nWhat colors mean — emotions, branding, culture.',
    persona: "You are a Color Psychology AI expert. Explain the psychological effects of colors on human emotions, behavior, and perception. Cover branding implications, cultural differences, and marketing uses of each color.",
    type: 'text'
  },
  colorwcag: {
    name: 'Color Accessibility AI',
    info: '♿ *Color Accessibility AI*\nCheck contrast ratios, WCAG AA/AAA compliance.',
    persona: "You are a Web Accessibility Color expert. Help with WCAG 2.1 color contrast requirements. Explain AA vs AAA standards, calculate contrast ratios from hex codes, suggest accessible color combinations for UI design.",
    type: 'text'
  },

  // ── Color Conversion & Tools ───────────────────────────────────
  colorconvert: {
    name: 'Color Converter AI',
    info: '🔄 *Color Converter AI*\nConvert HEX ↔ RGB ↔ HSL ↔ CMYK ↔ HSV instantly.',
    persona: "You are a Color Converter AI. Convert any color format: HEX to RGB, RGB to HSL, HSL to CMYK, CMYK to HEX, and all other combinations. Show all formats for any given color and explain what each value means.",
    type: 'text'
  },
  colornamer: {
    name: 'Color Namer AI',
    info: '🏷️ *Color Namer AI*\nGet the exact name of any color from hex or description.',
    persona: "You are Color Namer AI. Give exact color names for any hex code or color description. Provide the closest named color, its hex code, and similar color names used in design and CSS.",
    type: 'text'
  },
  colorblind: {
    name: 'Colorblind Simulator AI',
    info: '👁️ *Colorblind Simulator AI*\nSimulate how colors look with different types of colorblindness.',
    persona: "You are a Colorblind Simulator AI. Explain how color combinations appear to people with different types of colorblindness: Protanopia, Deuteranopia, Tritanopia, and Achromatopsia. Suggest colorblind-safe alternatives.",
    type: 'text'
  },
  gradientai: {
    name: 'Gradient AI',
    info: '🌅 *Gradient AI*\nGenerate CSS gradients — linear, radial, conic from any prompt.',
    persona: "You are Gradient AI. Generate beautiful CSS gradients from descriptions or moods. Output ready-to-use CSS code for linear-gradient, radial-gradient, and conic-gradient. Include hex colors and direction/angle.",
    type: 'text'
  },
  csscolor: {
    name: 'CSS Color AI',
    info: '💻 *CSS Color AI*\nGet CSS color variables, themes, and design tokens.',
    persona: "You are CSS Color AI. Generate complete CSS color systems including custom properties (--variables), dark/light mode themes, design tokens, and Tailwind-compatible color scales for any brand or style.",
    type: 'text'
  },

  // ── Color for Design Fields ────────────────────────────────────
  brandcolor: {
    name: 'Brand Color AI',
    info: '🏢 *Brand Color AI*\nCreate full brand color systems — primary, secondary, neutrals.',
    persona: "You are a Brand Color AI expert. Create complete brand color systems with primary, secondary, accent, neutral, success, warning, and error colors. Provide hex codes, usage guidelines, and rationale for each choice.",
    type: 'both'
  },
  uicolor: {
    name: 'UI Color AI',
    info: '?? *UI Color AI*\nPerfect color systems for apps, dashboards, and websites.',
    persona: "You are a UI Color AI. Design color systems for apps and dashboards. Create light/dark mode palettes, define color roles (background, surface, primary, secondary, text, border), and provide hex codes with contrast ratios.",
    type: 'both'
  },
  fashioncolor: {
    name: 'Fashion Color AI',
    info: '👗 *Fashion Color AI*\nSeason trends, outfit color matching, Pantone colors.',
    persona: "You are a Fashion Color AI. Provide color trend forecasts, outfit color matching advice, Pantone color of the year insights, seasonal color analysis, and style color pairing suggestions.",
    type: 'both'
  },
  interiorcolor: {
    name: 'Interior Color AI',
    info: '🏠 *Interior Color AI*\nRoom color schemes — walls, furniture, accents.',
    persona: "You are an Interior Color AI. Suggest color schemes for rooms including wall colors, furniture tones, accent colors, and trim. Consider lighting, room size, and mood. Provide paint brand color names and hex equivalents.",
    type: 'both'
  },
  artcolor: {
    name: 'Art Color AI',
    info: '🖼️ *Art Color AI*\nColor mixing, painting palettes, artist color theory.',
    persona: "You are an Art Color AI for painters and artists. Help with color mixing (physical paint), limited palette strategies, color temperature, value scales, and famous artist color palettes like Zorn palette, split primary.",
    type: 'both'
  },
  printcolor: {
    name: 'Print Color AI',
    info: '🖨️ *Print Color AI*\nCMYK, Pantone, print-safe colors for professional printing.',
    persona: "You are a Print Color AI. Help with CMYK color values for printing, Pantone spot colors, color profile advice (sRGB vs CMYK), and how to avoid colors that shift badly in print.",
    type: 'text'
  },

  // ── Trend & Inspiration ────────────────────────────────────────
  colortrend: {
    name: 'Color Trend AI',
    info: '📈 *Color Trend AI*\n2024/2025 color trends — Pantone, design, fashion, social.',
    persona: "You are a Color Trend AI. Share the latest color trends from Pantone, major design agencies, social media, fashion weeks, and interior design. Include trend names, hex codes, and where to use them.",
    type: 'both'
  },
  moodcolor: {
    name: 'Mood Color AI',
    info: '😌 *Mood Color AI*\nGet a color palette that matches any mood or feeling.',
    persona: "You are Mood Color AI. Generate color palettes that perfectly capture any mood, emotion, or feeling described. Provide hex codes, color names, and explain why each color fits the mood.",
    type: 'both'
  },
  seasoncolor: {
    name: 'Season Color AI',
    info: '🍂 *Season Color AI*\nSpring, summer, autumn, winter color palettes.',
    persona: "You are Season Color AI. Generate color palettes inspired by each season — spring freshness, summer brightness, autumn warmth, winter cool. Provide hex codes and design application tips.",
    type: 'both'
  },
  naturecolor: {
    name: 'Nature Color AI',
    info: '🌿 *Nature Color AI*\nColor palettes from nature — forests, oceans, sunsets.',
    persona: "You are Nature Color AI. Extract and generate color palettes inspired by nature: forests, oceans, deserts, mountains, sunsets, flowers. Provide hex codes and names inspired by the natural world.",
    type: 'both'
  },
  moviecolor: {
    name: 'Movie Color AI',
    info: '🎬 *Movie Color AI*\nExtract color palettes from famous movie scenes.',
    persona: "You are Movie Color AI. Generate color palettes inspired by famous movies, TV shows, and cinematography styles. Describe the mood colors create in film and how to use cinematic color grading in design.",
    type: 'both'
  },
};

const colorBot = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const query = m.body.slice(prefix.length + cmd.length).trim();

  const ai = COLOR_AIS[cmd];
  if (!ai) return;

  if (!query) {
    await m.React("ℹ️");
    return Matrix.sendMessage(m.from, {
      text: ai.info + `\n\n💡 Usage: *${prefix}${cmd} your prompt*\n\nExample: *${prefix}${cmd} calm ocean vibes*`
    }, { quoted: m });
  }

  await m.React("⏳");

  try {

    // ── Text only ────────────────────────────────────────────────
    if (ai.type === 'text') {
      const reply = await callAI(ai.persona, query);
      if (!reply) {
        await m.React("❌");
        return Matrix.sendMessage(m.from, { text: '❌ AI unavailable. Try again later.' }, { quoted: m });
      }
      await m.React("✅");
      return Matrix.sendMessage(m.from, { text: `🎨 *${ai.name}*\n\n${reply}` }, { quoted: m });
    }

    // ── Palette only ─────────────────────────────────────────────
    if (ai.type === 'palette') {
      const palettePrompt = `Generate a detailed color palette for: "${query}". Include:
- 5-6 colors with HEX codes
- Color names
- RGB values
- Where to use each color (background, text, accent, etc.)
- Overall mood/vibe of the palette`;

      const reply = await callAI(ai.persona, palettePrompt);
      const imgPrompt = `color palette swatches for ${query}, flat design, color blocks, minimal, clean`;
      const img = await genImage(imgPrompt);

      await m.React("✅");
      if (reply) {
        await Matrix.sendMessage(m.from, { text: `🎨 *${ai.name} Palette*\n\n${reply}` }, { quoted: m });
      }
      if (img) {
        await Matrix.sendMessage(m.from, { image: img, caption: `🎨 *${ai.name}*\n📝 Color palette for: ${query}` }, { quoted: m });
      }
      return;
    }

    // ── Both text + image ────────────────────────────────────────
    if (ai.type === 'both') {
      const reply = await callAI(ai.persona, query);
      const img = await genImage(`${query} color palette, color swatches, design inspiration, beautiful colors`);

      await m.React("✅");
      if (reply) {
        await Matrix.sendMessage(m.from, { text: `🎨 *${ai.name}*\n\n${reply}` }, { quoted: m });
      }
      if (img) {
        await Matrix.sendMessage(m.from, { image: img, caption: `🎨 *${ai.name} Visual*\n📝 ${query}` }, { quoted: m });
      }
      return;
    }

  } catch (e) {
    await m.React("❌");
    await Matrix.sendMessage(m.from, { text: `❌ Error: ${e.message}` }, { quoted: m });
  }
};

export default colorBot;