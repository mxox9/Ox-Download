// index.js (Single file bot)
// Requirements: node >= 16
// Usage: npm install && node index.js

import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import { Telegraf } from 'telegraf';

// ----------------- CONFIG (from .env) -----------------
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID || 0);
const OWNER_USERNAME = process.env.OWNER_USERNAME || '@Dark_zozy';
const WELCOME_PHOTO = process.env.WELCOME_PHOTO || 'https://picsum.photos/1000/600';
const JOIN_TEAM_LINK = process.env.JOIN_TEAM_LINK || 'https://t.me/mixy_ox';
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN is missing in .env file');
  process.exit(1);
}

// ----------------- Helpers -----------------
const IG_LINK_REGEX = /(https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_\-./?=]+|https?:\/\/instagr\.am\/[A-Za-z0-9_\-./?=]+)/i;

function buildStartCaption(firstName) {
  return (
    `✨ *Welcome ${firstName}*\n\n` +
    `I am the *Most Advanced Instagram Reels/Post/Story Downloader Bot* ⚡️\n` +
    `My Owner is ${OWNER_USERNAME} 🛠️\n\n` +
    `🔹 Just paste any Instagram link (Reel/Post/Story) and I will download it for you! 📥\n\n` +
    `_Note: If used in groups, make sure to disable Bot Privacy in @BotFather settings._`
  );
}

function mainMenuKeyboard(botUsername) {
  return {
    inline_keyboard: [
      [{ text: "➕ Add Me to Any Group", url: `https://t.me/${botUsername}?startgroup=true` }],
      [{ text: "📂 Source Code", url: `https://t.me/dark_zozy` }],
      [{ text: "📞 Contact", url: `https://t.me/dark_zozy` }]
    ]
  };
}

function joinTeamKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🚀 Join Team", url: JOIN_TEAM_LINK }]
    ]
  };
}

// ----------------- Express (health) -----------------
const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('OK'));
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

// ----------------- Bot -----------------
const bot = new Telegraf(BOT_TOKEN);

let BOT_USERNAME = null;
(async () => {
  try {
    const me = await bot.telegram.getMe();
    BOT_USERNAME = me.username;
    console.log('Bot started as @' + BOT_USERNAME);
  } catch (e) {
    console.warn('getMe failed', e.message);
  }
})();

// /start handler
bot.start(async (ctx) => {
  try {
    const firstName = ctx.from?.first_name || 'Friend';
    const botUsername = BOT_USERNAME || (await bot.telegram.getMe()).username;

    await ctx.replyWithPhoto(
      { url: WELCOME_PHOTO },
      {
        caption: buildStartCaption(firstName),
        parse_mode: 'Markdown',
        reply_markup: mainMenuKeyboard(botUsername)
      }
    );
  } catch (err) {
    console.error('/start error', err);
    await ctx.reply('⚠️ Something went wrong. Please try again later.');
  }
});

// Admin broadcast command (limited)
bot.command('broadcast', async (ctx) => {
  if (!ctx.from) return;
  if (ctx.from.id !== ADMIN_ID) return ctx.reply('❌ You are not authorized to use this command.');

  const text = ctx.message.text || '';
  const parts = text.split(' ').slice(1);
  if (parts.length < 2) return ctx.reply('Usage: /broadcast <chat_id> <message>');

  const chatId = parts[0];
  const message = parts.slice(1).join(' ');

  try {
    await bot.telegram.sendMessage(chatId, `📢 Broadcast from Admin:\n\n${message}`);
    await ctx.reply('✅ Message sent successfully.');
  } catch (e) {
    console.error('broadcast error', e.message);
    await ctx.reply('❌ Failed to send: ' + e.message);
  }
});

// /help
bot.command('help', (ctx) => {
  return ctx.replyWithMarkdown(
    `*How to Use*\n\n` +
    `• Send me any Instagram Reel/Post/Story link — I will download it for you.\n` +
    `• /broadcast <chat_id> <message> — For Admin only.\n` +
    `• Use the Contact/Source Code buttons to reach ${OWNER_USERNAME}.`
  );
});

// Call API
async function fetchFromInstaApi(mediaUrl) {
  const apiBase = 'https://anujxyz.shop/api/instaapi.php?url=';
  const full = apiBase + encodeURIComponent(mediaUrl);
  const resp = await axios.get(full, { timeout: 30000 });
  return resp.data;
}

// Text handler for Instagram links
bot.on('text', async (ctx) => {
  try {
    const text = (ctx.message && ctx.message.text) ? ctx.message.text.trim() : '';
    const match = text.match(IG_LINK_REGEX);
    if (!match) return;

    const url = match[0];
    await ctx.reply('⏳ Fetching and downloading, please wait...');

    let data;
    try {
      data = await fetchFromInstaApi(url);
    } catch (e) {
      console.error('API error', e.message || e);
      return ctx.reply('❌ Failed to fetch data from API. Please check the link or try later.');
    }

    const videos = Array.isArray(data.videos) ? data.videos : [];
    const images = Array.isArray(data.images) ? data.images : [];

    if (videos.length === 0 && images.length === 0) {
      return ctx.reply('⚠️ No media found — maybe the post is private or API returned empty.');
    }

    // Send videos
    for (const v of videos) {
      const fileUrl = (typeof v === 'string') ? v : (v.url || v.link || v.src);
      if (!fileUrl) continue;
      try {
        await ctx.replyWithVideo({ url: fileUrl }, { reply_markup: joinTeamKeyboard() });
      } catch (e) {
        console.warn('video send failed', e.message);
        try {
          await ctx.replyWithDocument({ url: fileUrl }, { caption: 'Video', reply_markup: joinTeamKeyboard() });
        } catch (er) {
          await ctx.reply('❌ Failed to send video (might be too large).');
        }
      }
    }

    // Send images
    for (const im of images) {
      const fileUrl = (typeof im === 'string') ? im : (im.url || im.link || im.src);
      if (!fileUrl) continue;
      try {
        await ctx.replyWithPhoto({ url: fileUrl }, { reply_markup: joinTeamKeyboard() });
      } catch (e) {
        console.error('photo send failed', e.message);
        try {
          await ctx.replyWithDocument({ url: fileUrl }, { caption: 'Image', reply_markup: joinTeamKeyboard() });
        } catch (er) {
          console.error('send image/document failed', er.message);
        }
      }
    }

  } catch (err) {
    console.error('text handler error', err);
    try { await ctx.reply('❌ Something went wrong. Please try again later.'); } catch {}
  }
});

// Error logging
bot.catch((err, ctx) => {
  console.error('Bot error for', ctx.updateType, err);
});

// Launch
bot.launch()
  .then(() => console.log('Bot launched'))
  .catch((e) => {
    console.error('Bot launch failed:', e.message);
    process.exit(1);
  });

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
