import { TempStore } from "@ikasoba000/tempstore";
import EventEmitter from "node:events";
import { DefaultNewsConfig, NewsConfig } from "./NewsConfig.js";
import fetch from "node-fetch";
import { NewsItem } from "./NewsItem.js";

export class NewsService extends EventEmitter {
  public isRunning: boolean = false;
  public currentTimeout: NodeJS.Timeout | null = null;

  constructor(private tempstore: TempStore<NewsConfig>) {
    super();
  }

  on(eventName: "NewNews", listener: (news: NewsItem) => void): this;
  on(eventName: string | symbol, listener: (...args: any[]) => void): this {
    super.on(eventName, listener);
    return this;
  }

  public async getConfig() {
    let config = await this.tempstore.get("_");
    if (config == null) {
      config = DefaultNewsConfig;
      await this.tempstore.set("_", config);
    }
    return config;
  }

  public async setConfig(config: NewsConfig) {
    await this.tempstore.set("_", config);
  }

  private async tick() {
    const newsList: NewsItem[] = (await (
      await fetch("https://object-web.blue-protocol.com/news.json")
    ).json()) as any;

    newsList.splice(100);

    const toEpoch = (s: string) => new Date(s).getTime();

    const config = await this.getConfig();

    // 新しいニュースを取得して昇順にソートする
    const newNewsList = newsList
      .filter((news) => toEpoch(news.createdAt) > (config.lastNewsEpoch ?? 0))
      .map((news) => ({ ...news, $createdAt: toEpoch(news.createdAt) }))
      .sort((a, b) => a.$createdAt - b.$createdAt);

    for (const news of newNewsList) {
      this.emit("NewNews", news);
    }

    if (this.isRunning) {
      this.currentTimeout = setTimeout(
        () => this.tick(),
        (await this.getConfig()).fetchInterval
      );
    }
  }

  public start() {
    this.isRunning = true;
    this.tick();
  }

  public stop() {
    this.isRunning = false;
    if (this.currentTimeout) clearTimeout(this.currentTimeout);
  }
}
