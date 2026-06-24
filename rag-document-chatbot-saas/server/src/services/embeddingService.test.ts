import assert from "node:assert/strict";
import test from "node:test";
import { createLocalEmbedding } from "./embeddingService.js";

test("local embeddings are deterministic and pgvector compatible", () => {
  const first = createLocalEmbedding("Revenue increased in the enterprise segment.");
  const second = createLocalEmbedding("Revenue increased in the enterprise segment.");

  assert.equal(first.length, 1536);
  assert.deepEqual(first, second);
  assert.ok(first.some((value) => value !== 0));
});

test("local embeddings normalize non-empty input", () => {
  const embedding = createLocalEmbedding("security review procurement");
  const magnitude = Math.sqrt(
    embedding.reduce((total, value) => total + value * value, 0),
  );

  assert.ok(Math.abs(magnitude - 1) < 1e-10);
});
