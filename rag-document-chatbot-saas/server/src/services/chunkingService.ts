import type { ExtractedPage } from "./pdfService.js";

export type DocumentChunk = {
  content: string;
  pageNumber: number;
  chunkIndex: number;
  sectionTitle: string | null;
};

type SemanticBlock = {
  text: string;
  kind: "heading" | "paragraph" | "list";
};

const DEFAULT_CHUNK_SIZE = 3500;
const DEFAULT_OVERLAP = 400;
const MIN_HEADING_LENGTH = 3;
const MAX_HEADING_LENGTH = 120;

function normalizeLine(line: string) {
  return line.replace(/[ \t]+/g, " ").trim();
}

function isListItem(line: string) {
  return /^(?:[-*+\u2022]\s+|\d{1,3}[.)]\s+)/.test(line);
}

function isHeading(line: string) {
  const value = line.replace(/^#{1,6}\s+/, "").trim();

  if (value.length < MIN_HEADING_LENGTH || value.length > MAX_HEADING_LENGTH) {
    return false;
  }

  if (/^#{1,6}\s+\S/.test(line)) {
    return true;
  }

  if (/^\d+(?:\.\d+)*[.)]?\s+[A-Z][^\n.!?]*$/.test(value)) {
    return true;
  }

  const letters = value.replace(/[^A-Za-z]/g, "");
  if (letters.length >= MIN_HEADING_LENGTH && value === value.toUpperCase()) {
    return true;
  }

  const words = value.split(/\s+/);
  const titleCaseWords = words.filter((word) => /^[A-Z][A-Za-z0-9'/-]*$/.test(word));
  return (
    words.length <= 10 &&
    !/[.!?;:]$/.test(value) &&
    titleCaseWords.length / words.length >= 0.75
  );
}

function createSemanticBlocks(text: string): SemanticBlock[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: SemanticBlock[] = [];
  let pending: string[] = [];
  let pendingKind: "paragraph" | "list" = "paragraph";

  const flush = () => {
    if (pending.length === 0) {
      return;
    }

    blocks.push({
      text: pending.join(pendingKind === "list" ? "\n" : " ").trim(),
      kind: pendingKind,
    });
    pending = [];
  };

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);

    if (!line) {
      flush();
      continue;
    }

    if (isHeading(line)) {
      flush();
      blocks.push({
        text: line.replace(/^#{1,6}\s+/, "").trim(),
        kind: "heading",
      });
      continue;
    }

    const kind = isListItem(line) ? "list" : "paragraph";
    if (pending.length > 0 && kind !== pendingKind) {
      flush();
    }

    pendingKind = kind;
    pending.push(line);
  }

  flush();
  return blocks;
}

function findNaturalEnd(text: string, start: number, targetEnd: number) {
  if (targetEnd >= text.length) {
    return text.length;
  }

  const minimumEnd = start + Math.floor((targetEnd - start) * 0.65);
  const sentenceEnd = Math.max(
    text.lastIndexOf(". ", targetEnd),
    text.lastIndexOf("? ", targetEnd),
    text.lastIndexOf("! ", targetEnd),
    text.lastIndexOf("; ", targetEnd),
  );

  if (sentenceEnd >= minimumEnd) {
    return sentenceEnd + 1;
  }

  const wordEnd = text.lastIndexOf(" ", targetEnd);
  return wordEnd >= minimumEnd ? wordEnd : targetEnd;
}

function splitOversizedBlock(text: string, maxLength: number) {
  const parts: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = findNaturalEnd(text, start, Math.min(start + maxLength, text.length));
    const part = text.slice(start, end).trim();
    if (part) {
      parts.push(part);
    }
    start = Math.max(end, start + 1);
  }

  return parts;
}

function joinedLength(blocks: string[]) {
  return blocks.join("\n\n").length;
}

function trailingContext(blocks: string[], overlap: number, heading: string | null) {
  const context: string[] = [];

  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const candidate = blocks[index];
    if (candidate === heading || joinedLength([candidate, ...context]) > overlap) {
      continue;
    }
    context.unshift(candidate);
  }

  return context;
}

export function chunkPages(
  pages: ExtractedPage[],
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_OVERLAP,
): DocumentChunk[] {
  if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize) {
    throw new Error("Chunk size and overlap configuration is invalid.");
  }

  const chunks: DocumentChunk[] = [];

  for (const page of pages) {
    const semanticBlocks = createSemanticBlocks(page.text);
    let sectionTitle: string | null = null;
    let current: string[] = [];

    const emit = () => {
      const content = current.join("\n\n").trim();
      if (content) {
        chunks.push({
          content,
          pageNumber: page.pageNumber,
          chunkIndex: chunks.length,
          sectionTitle,
        });
      }
    };

    for (const block of semanticBlocks) {
      if (block.kind === "heading") {
        if (current.length > 0) {
          emit();
        }
        sectionTitle = block.text;
        current = [block.text];
        continue;
      }

      const headingPrefix = sectionTitle ? [sectionTitle] : [];
      const availableLength = Math.max(
        1,
        chunkSize - joinedLength(headingPrefix) - (headingPrefix.length ? 2 : 0),
      );
      const parts = splitOversizedBlock(block.text, availableLength);

      for (const part of parts) {
        if (current.length === 0 && sectionTitle) {
          current = [sectionTitle];
        }

        if (joinedLength([...current, part]) <= chunkSize) {
          current.push(part);
          continue;
        }

        const context = trailingContext(current, overlap, sectionTitle);
        emit();
        current = [...headingPrefix, ...context];

        if (joinedLength([...current, part]) > chunkSize) {
          current = [...headingPrefix, part];
        } else {
          current.push(part);
        }
      }
    }

    if (current.length > 0) {
      emit();
    }
  }

  return chunks;
}
