import assert from "node:assert/strict";
import test from "node:test";
import { chunkPages } from "./chunkingService.js";

test("chunkPages preserves page numbers and assigns global indexes", () => {
  const chunks = chunkPages(
    [
      { pageNumber: 1, text: "Alpha beta gamma delta epsilon." },
      { pageNumber: 2, text: "Zeta eta theta iota kappa." },
    ],
    18,
    4,
  );

  assert.ok(chunks.length >= 4);
  assert.equal(chunks[0].pageNumber, 1);
  assert.equal(chunks.at(-1)?.pageNumber, 2);
  assert.deepEqual(
    chunks.map((chunk) => chunk.chunkIndex),
    chunks.map((_, index) => index),
  );
});

test("chunkPages keeps semantic blocks intact when they fit", () => {
  const chunks = chunkPages(
    [
      {
        pageNumber: 3,
        text: [
          "Security Controls",
          "",
          "Authentication is required for every private route.",
          "",
          "- Validate access tokens",
          "- Enforce document ownership",
          "- Reject expired sessions",
        ].join("\n"),
      },
    ],
    500,
    50,
  );

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].sectionTitle, "Security Controls");
  assert.match(chunks[0].content, /^Security Controls/);
  assert.match(
    chunks[0].content,
    /- Validate access tokens\n- Enforce document ownership\n- Reject expired sessions/,
  );
});

test("chunkPages repeats section context across chunks", () => {
  const chunks = chunkPages(
    [
      {
        pageNumber: 1,
        text: [
          "Architecture",
          "",
          "The ingestion service extracts and normalizes PDF text for indexing.",
          "",
          "The retrieval service searches document vectors and returns cited evidence.",
          "",
          "The answer service uses only retrieved evidence when generating a response.",
        ].join("\n"),
      },
    ],
    115,
    20,
  );

  assert.ok(chunks.length >= 2);
  assert.ok(chunks.every((chunk) => chunk.sectionTitle === "Architecture"));
  assert.ok(chunks.every((chunk) => chunk.content.startsWith("Architecture")));
});

test("chunkPages starts a new context when a heading changes", () => {
  const chunks = chunkPages(
    [
      {
        pageNumber: 1,
        text: "Introduction\n\nOverview text.\n\nLimitations\n\nKnown limitations are listed here.",
      },
    ],
    500,
    50,
  );

  assert.deepEqual(
    chunks.map((chunk) => chunk.sectionTitle),
    ["Introduction", "Limitations"],
  );
});

test("chunkPages rejects overlap that cannot advance the cursor", () => {
  assert.throws(
    () => chunkPages([{ pageNumber: 1, text: "content" }], 100, 100),
    /invalid/,
  );
});

test("chunkPages omits pages without extractable text", () => {
  assert.deepEqual(
    chunkPages([
      { pageNumber: 1, text: "   \n\t " },
      { pageNumber: 2, text: "Useful content." },
    ]),
    [
      {
        content: "Useful content.",
        pageNumber: 2,
        chunkIndex: 0,
        sectionTitle: null,
      },
    ],
  );
});
