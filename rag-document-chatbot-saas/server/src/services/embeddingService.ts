import { env } from "../config/env.js";
import { openAi } from "../config/openai.js";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const EMBEDDING_BATCH_SIZE = 50;

type EmbeddingBatchResult = {
  embeddings: number[][];
  tokensUsed: number;
};

let localFallbackLogged = false;

function hashFeature(feature: string) {
  let hash = 2166136261;

  for (let index = 0; index < feature.length; index += 1) {
    hash ^= feature.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createLocalEmbedding(input: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const tokens = input.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const features = [
    ...tokens,
    ...tokens.slice(0, -1).map((token, index) => `${token}_${tokens[index + 1]}`),
  ];

  for (const feature of features) {
    const hash = hashFeature(feature);
    const dimension = hash % EMBEDDING_DIMENSIONS;
    const sign = (hash & 1) === 0 ? 1 : -1;
    vector[dimension] += sign;
  }

  const magnitude = Math.sqrt(
    vector.reduce((total, value) => total + value * value, 0),
  );

  return magnitude > 0
    ? vector.map((value) => value / magnitude)
    : vector;
}

function localEmbeddingBatch(inputs: string[]): EmbeddingBatchResult {
  if (!localFallbackLogged) {
    console.warn(
      "Using local feature-hash embeddings. Set EMBEDDING_PROVIDER=openai with a valid OPENAI_API_KEY for semantic retrieval.",
    );
    localFallbackLogged = true;
  }

  return {
    embeddings: inputs.map(createLocalEmbedding),
    tokensUsed: 0,
  };
}

function shouldUseLocalEmbeddings() {
  return env.embeddingProvider === "local" ||
    (env.embeddingProvider === "auto" && !openAi);
}

async function createOpenAiEmbeddingBatch(
  inputs: string[],
): Promise<EmbeddingBatchResult> {
  if (!openAi) {
    throw new Error(
      "OpenAI embeddings are not configured. Set a valid OPENAI_API_KEY or use EMBEDDING_PROVIDER=local.",
    );
  }

  const embeddings: number[][] = [];
  let tokensUsed = 0;

  for (let index = 0; index < inputs.length; index += EMBEDDING_BATCH_SIZE) {
    const batch = inputs.slice(index, index + EMBEDDING_BATCH_SIZE);
    const response = await openAi.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      dimensions: EMBEDDING_DIMENSIONS,
      encoding_format: "float",
    });

    const ordered = [...response.data]
      .sort((left, right) => left.index - right.index)
      .map((item) => item.embedding);

    if (
      ordered.length !== batch.length ||
      ordered.some((embedding) => embedding.length !== EMBEDDING_DIMENSIONS)
    ) {
      throw new Error("The embeddings provider returned an unexpected response.");
    }

    embeddings.push(...ordered);
    tokensUsed += response.usage.total_tokens;
  }

  return { embeddings, tokensUsed };
}

async function createEmbeddingBatch(inputs: string[]): Promise<EmbeddingBatchResult> {
  if (shouldUseLocalEmbeddings()) {
    return localEmbeddingBatch(inputs);
  }

  try {
    return await createOpenAiEmbeddingBatch(inputs);
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? error.status
        : undefined;

    if (env.embeddingProvider === "auto" && status === 401) {
      console.warn("OpenAI embedding authentication failed; falling back to local embeddings.");
      return localEmbeddingBatch(inputs);
    }

    throw error;
  }
}

export async function createEmbeddings(inputs: string[]): Promise<number[][]> {
  const result = await createEmbeddingBatch(inputs);
  return result.embeddings;
}

export async function createQuestionEmbedding(input: string) {
  const result = await createEmbeddingBatch([input]);

  return {
    embedding: result.embeddings[0],
    tokensUsed: result.tokensUsed,
  };
}
