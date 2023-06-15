import ms from "ms";

export const BotConfigKeys: (keyof BotConfig)[] = [
  "news.channel",
  "news.sendInterval",
];

export interface BotConfig {
  "news.sendInterval": number;
  "news.channel": string | null;
}

export const BotConfigDefault: BotConfig = {
  "news.sendInterval": ms("5m"),
  "news.channel": null,
};

export const isBotConfigKey = (s: string): s is keyof BotConfig =>
  BotConfigKeys.some((x) => s == x);
