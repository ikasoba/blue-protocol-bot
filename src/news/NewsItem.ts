export interface NewsItem {
  newsId: number;
  newsCategory: {
    newsCategoryId: number;
    name: string;
    displayName: string;
  };
  priority: number;
  title: string;
  content: NewsContents;
  url: "";
  createdAt: string;
}

export type NewsContents = (
  | NewsContentParagraph
  | NewsContentList
  | NewsContentDelimiter
  | NewsContentBLink
  | NewsContent
)[];

export interface NewsContent {
  type?: undefined;
}

export interface NewsContentParagraph {
  type: "paragraph";
  data: {
    text: string;
    level: number;
  };
}

export interface NewsContentList {
  type: "list";
  data: {
    style: string;
    items: string[];
  };
}

export interface NewsContentDelimiter {
  type: "delimiter";
  data: {};
}

export interface NewsContentBLink {
  type: "b_link";
  data: {
    content: {
      data: [
        {
          url: string;
          text: string;
        }
      ];
    };
  };
}

export const newsContentsToMarkdown = (contents: NewsContents) => {
  return contents
    .map((x) => {
      if (x?.type == "paragraph") {
        return x.data.text;
      } else if (x?.type == "b_link") {
        return `[${x.data.content.data[0].text}](${x.data.content.data[0].url})`;
      } else if (x?.type == "delimiter") {
        return "----";
      } else if (x?.type == "list") {
        return x?.data.items.map((item) => `・${item}<br>`);
      }

      return "";
    })
    .join("")
    .replace(/(<br>)+/g, "\n");
};
