from __future__ import annotations

import argparse
import asyncio
import json
import os
import statistics
import sys
from pathlib import Path
from typing import Any
from uuid import UUID

METRIC_NAMES = (
    "faithfulness",
    "answer_relevancy",
    "context_precision",
    "context_recall",
)


class DatasetValidationError(ValueError):
    pass


def _required_text(record: dict[str, Any], key: str, index: int) -> str:
    value = record.get(key)
    if not isinstance(value, str) or not value.strip():
        raise DatasetValidationError(
            f"Sample {index}: '{key}' must be a non-empty string."
        )
    return value.strip()


def validate_sample(record: Any, index: int) -> dict[str, Any]:
    if not isinstance(record, dict):
        raise DatasetValidationError(f"Sample {index}: expected a JSON object.")

    document_id = record.get("document_id")
    if document_id is not None:
        if not isinstance(document_id, str):
            raise DatasetValidationError(
                f"Sample {index}: 'document_id' must be a UUID string or null."
            )
        try:
            document_id = str(UUID(document_id))
        except ValueError as error:
            raise DatasetValidationError(
                f"Sample {index}: 'document_id' must be a valid UUID."
            ) from error

    contexts = record.get("contexts")
    if (
        not isinstance(contexts, list)
        or not contexts
        or any(not isinstance(context, str) or not context.strip() for context in contexts)
    ):
        raise DatasetValidationError(
            f"Sample {index}: 'contexts' must be a non-empty list of strings."
        )

    return {
        "document_id": document_id,
        "question": _required_text(record, "question", index),
        "answer": _required_text(record, "answer", index),
        "contexts": [context.strip() for context in contexts],
        "ground_truth": _required_text(record, "ground_truth", index),
    }


def load_dataset(path: Path) -> list[dict[str, Any]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise DatasetValidationError(f"Dataset not found: {path}") from error
    except json.JSONDecodeError as error:
        raise DatasetValidationError(
            f"Dataset contains invalid JSON at line {error.lineno}."
        ) from error

    records = payload.get("samples") if isinstance(payload, dict) else payload
    if not isinstance(records, list) or not records:
        raise DatasetValidationError(
            "Dataset must be a non-empty JSON array or an object with a 'samples' array."
        )

    return [validate_sample(record, index) for index, record in enumerate(records)]


def summarize_results(results: list[dict[str, Any]]) -> dict[str, float]:
    if not results:
        return {}

    return {
        metric: statistics.fmean(float(result[metric]) for result in results)
        for metric in METRIC_NAMES
    }


def _load_evaluation_dependencies():
    try:
        from dotenv import load_dotenv
        from openai import AsyncOpenAI
        from ragas.embeddings.base import embedding_factory
        from ragas.llms import llm_factory
        from ragas.metrics.collections import (
            AnswerRelevancy,
            ContextPrecision,
            ContextRecall,
            Faithfulness,
        )
    except ImportError as error:
        raise RuntimeError(
            "Evaluation dependencies are missing. Run: "
            "python -m pip install -r requirements.txt"
        ) from error

    return {
        "load_dotenv": load_dotenv,
        "AsyncOpenAI": AsyncOpenAI,
        "embedding_factory": embedding_factory,
        "llm_factory": llm_factory,
        "AnswerRelevancy": AnswerRelevancy,
        "ContextPrecision": ContextPrecision,
        "ContextRecall": ContextRecall,
        "Faithfulness": Faithfulness,
    }


def create_scorers():
    dependencies = _load_evaluation_dependencies()
    dependencies["load_dotenv"]()

    api_key = os.getenv("RAGAS_OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Set RAGAS_OPENAI_API_KEY or OPENAI_API_KEY.")

    client_options: dict[str, Any] = {"api_key": api_key}
    base_url = os.getenv("RAGAS_OPENAI_BASE_URL")
    if base_url:
        client_options["base_url"] = base_url

    client = dependencies["AsyncOpenAI"](**client_options)
    llm_model = os.getenv("RAGAS_LLM_MODEL", "gpt-4o-mini")
    embedding_model = os.getenv(
        "RAGAS_EMBEDDING_MODEL", "text-embedding-3-small"
    )
    llm = dependencies["llm_factory"](llm_model, client=client)
    embeddings = dependencies["embedding_factory"](
        "openai",
        model=embedding_model,
        client=client,
    )

    return {
        "faithfulness": dependencies["Faithfulness"](llm=llm),
        "answer_relevancy": dependencies["AnswerRelevancy"](
            llm=llm, embeddings=embeddings
        ),
        "context_precision": dependencies["ContextPrecision"](llm=llm),
        "context_recall": dependencies["ContextRecall"](llm=llm),
    }


async def evaluate_sample(
    sample: dict[str, Any],
    scorers: dict[str, Any],
) -> dict[str, Any]:
    common = {
        "user_input": sample["question"],
        "retrieved_contexts": sample["contexts"],
    }
    faithfulness = await scorers["faithfulness"].ascore(
        **common,
        response=sample["answer"],
    )
    answer_relevancy = await scorers["answer_relevancy"].ascore(
        user_input=sample["question"],
        response=sample["answer"],
    )
    context_precision = await scorers["context_precision"].ascore(
        **common,
        reference=sample["ground_truth"],
    )
    context_recall = await scorers["context_recall"].ascore(
        **common,
        reference=sample["ground_truth"],
    )

    return {
        **sample,
        "faithfulness": float(faithfulness.value),
        "answer_relevancy": float(answer_relevancy.value),
        "context_precision": float(context_precision.value),
        "context_recall": float(context_recall.value),
    }


async def evaluate_dataset(samples: list[dict[str, Any]]) -> list[dict[str, Any]]:
    scorers = create_scorers()
    results = []

    for index, sample in enumerate(samples, start=1):
        print(f"Evaluating sample {index}/{len(samples)}...", flush=True)
        results.append(await evaluate_sample(sample, scorers))

    return results


def store_results(results: list[dict[str, Any]]) -> None:
    try:
        from supabase import create_client
    except ImportError as error:
        raise RuntimeError(
            "Supabase dependency is missing. Run: "
            "python -m pip install -r requirements.txt"
        ) from error

    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_role_key:
        raise RuntimeError(
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to store results."
        )

    client = create_client(supabase_url, service_role_key)
    rows = [
        {
            "document_id": result["document_id"],
            "question": result["question"],
            "answer": result["answer"],
            "contexts": result["contexts"],
            "faithfulness": result["faithfulness"],
            "answer_relevancy": result["answer_relevancy"],
            "context_precision": result["context_precision"],
            "context_recall": result["context_recall"],
        }
        for result in results
    ]
    client.table("rag_evaluations").insert(rows).execute()


def print_report(results: list[dict[str, Any]]) -> None:
    for index, result in enumerate(results, start=1):
        scores = ", ".join(
            f"{metric}={result[metric]:.4f}" for metric in METRIC_NAMES
        )
        print(f"Sample {index}: {scores}")

    aggregate = summarize_results(results)
    print(
        "Aggregate: "
        + ", ".join(f"{metric}={aggregate[metric]:.4f}" for metric in METRIC_NAMES)
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate RAG answers with RAGAS.")
    parser.add_argument(
        "--dataset",
        type=Path,
        default=Path(__file__).with_name("dataset.json"),
        help="Path to the evaluation dataset.",
    )
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Validate the dataset without calling external services.",
    )
    parser.add_argument(
        "--no-store",
        action="store_true",
        help="Evaluate without inserting results into Supabase.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        samples = load_dataset(args.dataset)
        print(f"Validated {len(samples)} evaluation sample(s).")

        if args.validate_only:
            return 0

        results = asyncio.run(evaluate_dataset(samples))
        print_report(results)

        if not args.no_store:
            store_results(results)
            print(f"Stored {len(results)} result(s) in Supabase.")
        return 0
    except (DatasetValidationError, RuntimeError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
