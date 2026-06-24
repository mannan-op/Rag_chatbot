import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRagPrompt,
  createCitations,
  getSystemPrompt,
  type RetrievedChunk,
} from "./ragService.js";

const chunks: RetrievedChunk[] = [
  {
    id: "chunk-1",
    content: "  Revenue increased by 18 percent.\nThis was driven by enterprise demand.  ",
    page_number: 4,
    chunk_index: 2,
    similarity: 0.91,
  },
];

test("buildRagPrompt labels retrieved context with page and chunk numbers", () => {
  const prompt = buildRagPrompt("What changed?", chunks);

  assert.match(prompt, /\[Source 1, page 4, chunk 2\]/);
  assert.match(prompt, /What changed\?/);
  assert.match(prompt, /Revenue increased by 18 percent/);
});

test("createCitations normalizes source snippets", () => {
  assert.deepEqual(createCitations(chunks), [
    {
      pageNumber: 4,
      chunkIndex: 2,
      snippet: "Revenue increased by 18 percent. This was driven by enterprise demand.",
    },
  ]);
});

test("Socratic mode challenges claims with one grounded follow-up", () => {
  const prompt = getSystemPrompt("socratic");

  assert.match(prompt, /distinguish document evidence/i);
  assert.match(prompt, /strongest document-grounded objection/i);
  assert.match(prompt, /exactly one focused question/i);
  assert.match(prompt, /Do not use outside knowledge/i);
});
