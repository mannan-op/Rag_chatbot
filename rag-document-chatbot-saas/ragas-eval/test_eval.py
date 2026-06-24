import importlib.util
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("eval.py")
SPEC = importlib.util.spec_from_file_location("ragas_eval", MODULE_PATH)
assert SPEC and SPEC.loader
ragas_eval = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ragas_eval)


class EvaluationDatasetTests(unittest.TestCase):
    def test_validate_sample_normalizes_valid_samples(self):
        sample = ragas_eval.validate_sample(
            {
                "document_id": None,
                "question": " Question? ",
                "answer": " Answer. ",
                "contexts": [" Context. "],
                "ground_truth": " Reference. ",
            },
            0,
        )

        self.assertEqual(sample["question"], "Question?")
        self.assertEqual(sample["contexts"], ["Context."])

    def test_validate_sample_rejects_empty_contexts(self):
        with self.assertRaises(ragas_eval.DatasetValidationError):
            ragas_eval.validate_sample(
                {
                    "document_id": None,
                    "question": "Question?",
                    "answer": "Answer.",
                    "contexts": [],
                    "ground_truth": "Reference.",
                },
                0,
            )

    def test_summarize_results_averages_each_metric(self):
        results = [
            {metric: 0.25 for metric in ragas_eval.METRIC_NAMES},
            {metric: 0.75 for metric in ragas_eval.METRIC_NAMES},
        ]

        self.assertEqual(
            ragas_eval.summarize_results(results),
            {metric: 0.5 for metric in ragas_eval.METRIC_NAMES},
        )


if __name__ == "__main__":
    unittest.main()
