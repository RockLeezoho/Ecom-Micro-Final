import os
import sys

TRAIN_AI_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "train-ai"))
SCRIPT_PATH = os.path.join(TRAIN_AI_DIR, "create_kb_graph.py")


def main() -> None:
    if not os.path.exists(SCRIPT_PATH):
        raise FileNotFoundError(f"Missing script: {SCRIPT_PATH}")

    sys.path.insert(0, TRAIN_AI_DIR)
    from create_kb_graph import main as run_import

    run_import()


if __name__ == "__main__":
    main()