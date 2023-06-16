import "reflect-metadata";

import { Client } from "discord.js";
import { BlueProtocolBot } from "./bot/Bot.js";
import { ConfigService } from "./config/ConfigService.js";
import { DataProvider, TempStore } from "@ikasoba000/tempstore";
import { JSONProvider } from "@ikasoba000/tempstore/JSONProvider";
import { BotConfig } from "./config/BotConfig.js";
import { NewsService } from "./news/NewsWorker.js";
import { NewsConfig } from "./news/NewsConfig.js";

const client = new Client({
  intents: ["GuildMessages", "Guilds"],
});

const configService = new ConfigService(
  new TempStore<BotConfig>(
    (await JSONProvider.create(
      "./.saves/botConfig.json"
    )) as any as DataProvider<BotConfig>
  )
);

const newsService = new NewsService(
  new TempStore<NewsConfig>(
    (await JSONProvider.create(
      "./.saves/newsConfig.json"
    )) as any as DataProvider<NewsConfig>
  )
);

const bot = new BlueProtocolBot(client, configService, newsService);

await client.login(process.env.TOKEN);

await bot.start();
