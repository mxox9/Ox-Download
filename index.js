// ==========================
// Instagram Reels/Post/Story Downloader Bot
// Single File Version (with HTML parse_mode)
// ==========================

import { Telegraf } from "telegraf";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// ==========================
// ENV Variables
// ==========================
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID || "6052975324"; // optional
const OWNER_USERNAME = process.env.OWNER_USERNAME || "dark_zozy";
const WELCOME_PHOTO =
  process.env.WELCOME_PHOTO ||
  "https://placekitten.com/400/300"; // replace with your welcome image
const JOIN_TEAM_LINK =
  process.env.JOIN_TEAM_LINK || "https://t.me/mixy_ox";

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is missing in environment variables.");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ==========================
// /start Command
// ==========================
bot.start(async (ctx) => {
  try {
    await ctx.replyWithPhoto(
      { url: WELCOME_PHOTO },
      {
        caption: `✨ <b>Welcome ${ctx.from.first_name}</b> ✨\n\nI am the <b>Most Advanced Instagram Reels/Post/Story Downloader Bot</b> ⚡️\n\nMy Owner is <a href="https://t.me/${OWNER_USERNAME}">@${OWNER_USERNAME}</a> 🛠\n\n📌 Just paste any Instagram link (Reel/Post/Story) and I will download it for you! 🎉\n\n<i>Note: If used in groups, make sure to disable Bot Privacy in BotFather settings.</i>`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "➕ Add Me in Any Group",
                url: `https://t.me/${ctx.botInfo.username}?startgroup=true`,
              },
            ],
            [
              {
                text: "📂 Source Code",
                url: `https://t.me/${OWNER_USERNAME}`,
              },
              {
                text: "📞 Contact",
                url: `https://t.me/${OWNER_USERNAME}`,
              },
            ],
          ],
        },
      }
    );
  } catch (err) {
    console.error("❌ /start error:", err.message);
    ctx.reply("⚠️ Something went wrong. Please try again later.");
  }
});

// ==========================
// Handle Instagram Links
// ==========================
bot.on("message", async (ctx) => {
  try {
    const text = ctx.message.text;
    if (!text) return;

    // check if it contains Instagram link
    if (
      text.includes("instagram.com/reel/") ||
      text.includes("instagram.com/p/") ||
      text.includes("instagram.com/stories/")
    ) {
      await ctx.reply("⏳ Fetching your Instagram media... Please wait.");

      const apiUrl = `https://anujxyz.shop/api/instaapi.php?url=${encodeURIComponent(
        text
      )}`;

      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data.error) {
        return ctx.reply("❌ Failed to fetch the media. Please check the link.");
      }

      if (data.videos && data.videos.length > 0) {
        for (const video of data.videos) {
          await ctx.replyWithVideo(
            { url: video.url },
            {
              caption: `🎥 <b>${data.title || "Instagram Video"}</b>\n\n👉 <a href="${JOIN_TEAM_LINK}">Join Team</a>`,
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "👉 Join Team",
                      url: JOIN_TEAM_LINK,
                    },
                  ],
                ],
              },
            }
          );
        }
      } else if (data.images && data.images.length > 0) {
        for (const image of data.images) {
          await ctx.replyWithPhoto(
            { url: image },
            {
              caption: `🖼 <b>${data.title || "Instagram Image"}</b>\n\n👉 <a href="${JOIN_TEAM_LINK}">Join Team</a>`,
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "👉 Join Team",
                      url: JOIN_TEAM_LINK,
                    },
                  ],
                ],
              },
            }
          );
        }
      } else {
        ctx.reply("⚠️ No media found in this link.");
      }
    }
  } catch (err) {
    console.error("❌ Message handler error:", err.message);
    ctx.reply("⚠️ Something went wrong. Please try again later.");
  }
});

// ==========================
// Start Bot
// ==========================
bot.launch();
console.log("🤖 Bot is running...");

// Graceful Stop (for Render/Heroku)
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
