import { ClientEvent, DiscordBot, SlashCommand } from "@ikasoba000/distroub";
import { ConfigService } from "../config/ConfigService.js";
import {
  APIEmbedField,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Client,
  Guild,
  time,
} from "discord.js";
import {
  BotConfigDefault,
  BotConfigKeys,
  isBotConfigKey,
} from "../config/BotConfig.js";
import * as T from "../util/TypeCheck.js";
import { Emojis } from "../util/Emojis.js";
import ms from "ms";
import { NewsService } from "../news/NewsWorker.js";
import { NewsConfigKeys, isNewsConfigKeys } from "../news/NewsConfig.js";
import { NewsItem, newsContentsToMarkdown } from "../news/NewsItem.js";
import { MappedQueue } from "../mappedQueue/MappedQueue.js";
import { Reminder } from "../Reminder/Reminder.js";

export class BlueProtocolBot extends DiscordBot {
  private newsQueue = new MappedQueue<NewsItem>();
  private newsReminder = new Reminder<{ guildId: string }>();

  constructor(
    client: Client,
    private configService: ConfigService,
    private newsService: NewsService
  ) {
    super(client);

    newsService.on("NewNews", (news) => {
      this.newsQueue.pushToAll(news);
    });

    this.newsReminder.on("Remind", async ({ guildId }) => {
      const news = this.newsQueue.pop(guildId);
      const guild = await this.client.guilds.fetch(guildId);
      const config = await this.configService.get(guildId);

      if (news && config["news.channel"]) {
        const channel = await guild.channels.fetch(config["news.channel"]);

        if (channel?.isTextBased()) {
          await channel.send({
            embeds: [
              {
                title: `【${news.newsCategory.displayName}】${news.title}`,
                description:
                  newsContentsToMarkdown(news.content.slice(0, 15)) +
                  `\n\n[続きを読む](https://blue-protocol.com/news/${news.newsId})`,
                url: `https://blue-protocol.com/news/${news.newsId}`,
                timestamp: news.createdAt,
              },
            ],
          });
        }
      }

      this.newsReminder.remind(
        new Date().getTime() + config["news.sendInterval"],
        { guildId }
      );
    });
  }

  public async start() {
    const guildCollection = await this.client.guilds.fetch();

    for (const guild of guildCollection.values()) {
      const config = await this.configService.get(guild.id);

      console.log("set reminder");
      this.newsReminder.remind(
        new Date().getTime() + config["news.sendInterval"],
        { guildId: guild.id }
      );
    }

    this.newsReminder.start();
    this.newsService.start();
  }

  @ClientEvent("guildCreate")
  async onGuildCreate(guild: Guild) {
    const config = await this.configService.get(guild.id);

    this.newsReminder.remind(
      new Date().getTime() + config["news.sendInterval"],
      { guildId: guild.id }
    );
  }

  @SlashCommand("set-config", "設定を変更します", [
    {
      type: ApplicationCommandOptionType.String,
      name: "path",
      description: "設定のパス",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "value",
      description: "設定の値です。JSONで書いてね",
      required: true,
    },
  ])
  async setConfig(
    interaction: ChatInputCommandInteraction,
    path: string,
    _value: string
  ) {
    await interaction.deferReply({ ephemeral: true });

    if (!(interaction.guildId && interaction.guild)) {
      await interaction.editReply(
        `${Emojis.warning}予期せぬエラーが起こりました。`
      );
      return;
    }

    if (!interaction.memberPermissions?.has("Administrator")) {
      await interaction.editReply(
        `${Emojis.warning}あなたは管理者ではないため、設定の変更はできません。`
      );
      return;
    }

    if (!isBotConfigKey(path)) {
      await interaction.editReply(
        `${Emojis.warning}不正なパスです。現在利用可能なパスは以下の通りです。\n` +
          "```\n" +
          BotConfigKeys.map((x) => `・${x}`).join("\n") +
          "\n" +
          "```"
      );
      return;
    }

    const value = JSON.parse(_value) as unknown;

    const config =
      (await this.configService.get(interaction.guildId)) ?? BotConfigDefault;

    if (path == "news.channel") {
      if (!T.string(value)) {
        await interaction.editReply(
          `${Emojis.warning}代入可能な値は文字列のみです。`
        );
        return;
      }
      config[path] = value;
    } else if (path == "news.sendInterval") {
      if (!T.string(value)) {
        await interaction.editReply(
          `${Emojis.warning}代入可能な値は文字列のみです。`
        );
        return;
      }

      config[path] = ms(path);
    }

    interaction.editReply(`${Emojis.CheckMark}値の変更が完了しました。`);

    this.configService.set(interaction.guildId, config);
  }

  @SlashCommand("show-config", "設定を表示します", [])
  async showConfig(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    if (!(interaction.guildId && interaction.guild)) {
      await interaction.editReply(
        `${Emojis.warning}予期せぬエラーが起こりました。`
      );
      return;
    }

    const config =
      (await this.configService.get(interaction.guildId)) ?? BotConfigDefault;

    await interaction.editReply({
      embeds: [
        {
          fields: BotConfigKeys.map((k) => ({
            name: k,
            value: JSON.stringify(config[k]),
          })),
        },
      ],
    });
  }

  @SlashCommand(
    "set-news-service-config",
    "ニュースサービスの設定を変更します",
    [
      {
        type: ApplicationCommandOptionType.String,
        name: "path",
        description: "設定のパス",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "value",
        description: "設定の値です。JSONで書いてね",
        required: true,
      },
    ]
  )
  async setNewsConfig(
    interaction: ChatInputCommandInteraction,
    path: string,
    _value: string
  ) {
    await interaction.deferReply({ ephemeral: true });

    if (interaction.user.id != process.env.ADMIN_ID) {
      await interaction.editReply(
        `${Emojis.warning}あなたはこのBOTの管理者ではないため、設定の変更はできません。`
      );
      return;
    }

    if (!isNewsConfigKeys(path)) {
      await interaction.editReply(
        `${Emojis.warning}不正なパスです。現在利用可能なパスは以下の通りです。\n` +
          "```\n" +
          NewsConfigKeys.map((x) => `・${x}`).join("\n") +
          "\n" +
          "```"
      );
      return;
    }

    const config = await this.newsService.getConfig();

    const value = JSON.parse(_value) as unknown;

    if (path == "fetchInterval") {
      if (!T.string(value)) {
        await interaction.editReply(
          `${Emojis.warning}代入可能な値は文字列のみです。`
        );
        return;
      }
      config[path] = ms(value);
    }

    interaction.editReply(`${Emojis.CheckMark}値の変更が完了しました。`);

    await this.newsService.setConfig(config);
    await this.newsService.stop();
    await this.newsService.start();
  }
}
