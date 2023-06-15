import { TempStore } from "@ikasoba000/tempstore";
import { BotConfig, BotConfigDefault } from "./BotConfig.js";
import { JSONProvider } from "@ikasoba000/tempstore/JSONProvider";

export class ConfigService {
  constructor(private tempstore: TempStore<BotConfig>) {}

  async set(guildId: string, config: BotConfig) {
    await this.tempstore.set(guildId, config);
  }

  async get(guildId: string) {
    return (await this.tempstore.get(guildId)) ?? BotConfigDefault;
  }

  async keys() {
    return await this.tempstore.keys();
  }
}
