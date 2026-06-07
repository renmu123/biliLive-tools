export type MarkdownBlock =
  | {
      type: "heading";
      level: number;
      text: string;
    }
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "bullet";
      text: string;
    }
  | {
      type: "ordered";
      text: string;
    }
  | {
      type: "divider";
    };

export function stripMarkdownInline(text: string) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function markdownLineToBlock(line: string): MarkdownBlock | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (/^---+$/.test(trimmed)) {
    return { type: "divider" };
  }

  const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
  if (heading) {
    return {
      type: "heading",
      level: Math.min(heading[1].length, 6),
      text: stripMarkdownInline(heading[2]),
    };
  }

  const bullet = trimmed.match(/^[-*+]\s+(.+)$/);
  if (bullet) {
    return {
      type: "bullet",
      text: stripMarkdownInline(bullet[1]),
    };
  }

  const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
  if (ordered) {
    return {
      type: "ordered",
      text: stripMarkdownInline(ordered[1]),
    };
  }

  return {
    type: "paragraph",
    text: stripMarkdownInline(trimmed),
  };
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({
      type: "paragraph",
      text: stripMarkdownInline(paragraph.join("\n")),
    });
    paragraph = [];
  };

  for (const line of markdown.split(/\r?\n/)) {
    const block = markdownLineToBlock(line);
    if (!block) {
      flushParagraph();
      continue;
    }

    if (block.type === "paragraph") {
      paragraph.push(line.trim());
      continue;
    }

    flushParagraph();
    blocks.push(block);
  }
  flushParagraph();

  return blocks.filter((block) => block.type === "divider" || block.text);
}

export function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
