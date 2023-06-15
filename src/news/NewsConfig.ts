import ms from "ms";

export const NewsConfigKeys: (keyof NewsConfig)[] = [
  "fetchInterval",
  "lastNewsEpoch",
];

export interface NewsConfig {
  fetchInterval: number;
  lastNewsEpoch: number | null;
}

export const DefaultNewsConfig: NewsConfig = {
  fetchInterval: ms("50m"),
  lastNewsEpoch: new Date().getTime(),
};

export const isNewsConfigKeys = (s: string): s is keyof NewsConfig =>
  NewsConfigKeys.some((x) => s == x);
