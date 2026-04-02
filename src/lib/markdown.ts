import { marked } from "marked";

function slugifyHeading(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z0-9#]+;/gi, "")
    .replace(/[\s\W]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

marked.setOptions({
  breaks: true,
  gfm: true
});

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const html = this.parser.parseInline(tokens);
      const id = slugifyHeading(html) || "section";
      return `<h${depth} id="${id}">${html}</h${depth}>`;
    }
  }
});

export function renderMarkdown(content: string) {
  return marked.parse(content) as string;
}
