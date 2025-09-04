import { Telegraf, Markup } from "telegraf";
import fetch from "node-fetch";

// Bot Token (Render पर ENV में डालो: BOT_TOKEN)
const bot = new Telegraf(process.env.BOT_TOKEN);

// Start Command
bot.start(async (ctx) => {
  try {
    await ctx.replyWithPhoto(
      "https://i.ibb.co/8DJn3ZWv/0dc34489-f0ab-49a3-aec1-e3a8f706dba4.jpg",
      {
        caption: `✨ Welcome to Instagram Reels Downloader Bot ✨  

I can help you to download any Reels / Post / Story directly from Instagram 🚀  

📌 Just send me any Instagram link and I’ll fetch it for you.  

👨‍💻 Owner: @dark_zozy`,
        ...Markup.inlineKeyboard([
          [Markup.button.url("➕ Add Me in Any Group", "https://t.me/" + ctx.botInfo.username + "?startgroup=true")],
          [
            Markup.button.url("📂 Source Code", "https://t.me/dark_zozy"),
            Markup.button.url("📞 Contact", "https://t.me/dark_zozy"),
          ],
        ]),
      }
    );
  } catch (err) {
    console.error("Start command error:", err);
    ctx.reply("⚠️ Something went wrong. Please try again later.");
  }
});

// Instagram Downloader Function with API fallback
async function getInstagramMedia(url) {
  const apis = [
    `https://www.save-insta.com/api/?url=${url}`,
    `https://igram.world/api/ig?url=${url}`,
    `https://snapinsta.app/api/?url=${url}`,
  ];

  for (let api of apis) {
    try {
      const res = await fetch(api);
      const data = await res.json();

      if (data && (data.media || data.url || data.links)) {
        return data;
      }
    } catch (err) {
      console.log(`❌ API failed: ${api}`);
    }
  }

  return null;
}

// Handle Instagram Links
bot.on("text", async (ctx) => {
  const url = ctx.message.text;

  if (!url.includes("instagram.com")) {
    return ctx.reply("⚠️ Please send a valid Instagram link.");
  }

  await ctx.reply("⏳ Fetching your Instagram media... Please wait.");

  const media = await getInstagramMedia(url);

  if (!media) {
    return ctx.reply("⚠️ Something went wrong. Please try again later.");
  }

  try {
    if (media.media) {
      for (let item of media.media) {
        if (item.includes(".mp4")) {
          await ctx.replyWithVideo(item);
        } else {
          await ctx.replyWithPhoto(item);
        }
      }
    } else if (media.url) {
      if (media.url.includes(".mp4")) {
        await ctx.replyWithVideo(media.url);
      } else {
        await ctx.replyWithPhoto(media.url);
      }
    } else if (media.links) {
      for (let link of media.links) {
        if (link.includes(".mp4")) {
          await ctx.replyWithVideo(link);
        } else {
          await ctx.replyWithPhoto(link);
        }
      }
    }
  } catch (err) {
    console.error("Send media error:", err);
    ctx.reply("⚠️ Failed to send media. Please try again later.");
  }
});

// Launch Bot
bot.launch();
console.log("🤖 Bot is running...");
