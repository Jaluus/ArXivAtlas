import os

import brotli
import numpy as np
import pandas as pd


def normalize_embeddings(embeddings):
    x_trafo = embeddings[:, 0]
    y_trafo = embeddings[:, 1]
    x_trafo = (x_trafo - np.min(x_trafo)) / (np.max(x_trafo) - np.min(x_trafo))
    y_trafo = (y_trafo - np.min(y_trafo)) / (np.max(y_trafo) - np.min(y_trafo))
    return np.array([x_trafo, y_trafo]).T


def generate_formatted_data(
    data: pd.DataFrame,
    columns: list[str] = [
        "arxiv_id",
        "authors",
        "title",
        "main_category",
        "journal_ref",
    ],
) -> list[list]:
    def format_list(l: list) -> str:
        return (
            ";".join(l)
            .replace(":. :;", "")
            .replace(" ", "")
            .replace("\n", " ")
            .replace("\t", " ")
        )

    def format_string(s: str | None) -> str:
        if s is None:
            return "-"
        fs = s.replace("\n", " ").replace("\t", " ")
        if fs == "None" or fs == "nan" or fs == "N/A":
            fs = "-"
        return fs

    formatted_data = []
    for _, data_point in data.iterrows():

        formatted_list = []

        for column in columns:
            value = data_point[column]
            if isinstance(value, list):
                formatted_list.append(format_list(value))
            elif isinstance(value, str):
                formatted_list.append(format_string(value))
            else:
                formatted_list.append(value)

        formatted_list.append(round(data_point["x_umap"], 5))
        formatted_list.append(round(data_point["y_umap"], 5))

        formatted_data.append(formatted_list)
    return formatted_data


def generate_formatted_similarities(
    similarity_values: np.ndarray,
    similarity_idxs: np.ndarray,
) -> str:
    out_strs = []
    for node_idx in range(similarity_idxs.shape[0]):
        node_vals = similarity_values[node_idx][1 : NUM_BEST_SIMS + 1]
        node_conns = similarity_idxs[node_idx][1 : NUM_BEST_SIMS + 1]
        out_strs.append(
            ";".join(
                [
                    f"{node_conn},{round(node_val,2) * 100:.0f}"
                    for node_val, node_conn in zip(node_vals, node_conns)
                ]
            )
        )
    return "\n".join(out_strs)


def save_data(
    data: list[list],
    path: str,
    columns: list[str],
) -> None:
    with open(path, "w", encoding="utf-8") as file:
        file.write("\t".join(columns + ["x", "y"]) + "\n")
        for line in data:
            write_str = "\t".join(
                [str(x).replace("\n", " ").replace("\t", " ") for x in line]
            )
            file.write(write_str + "\n")


def save_similarities(similarities, path):
    with open(path, "w") as f:
        f.write(similarities)


def compress_file(path):
    with open(path, "rb") as f:
        compressed = brotli.compress(f.read(), mode=brotli.MODE_TEXT)
        with open(path + ".br", "wb") as f2:
            f2.write(compressed)


SUBSETS = [
    "cond-mat",
    "hep",
    "astro-ph",
    "quant-ph",
    "cs",
    "physics",
]
FILE_DIR = os.path.dirname(os.path.realpath(__file__))
DATA_ROOT = os.path.join(FILE_DIR, "data")
NUM_BEST_SIMS = 10
COLUMNS = [
    "arxiv_id",
    "authors",
    "title",
    "main_category",
    "journal_ref",
]

if __name__ == "__main__":
    for subset in SUBSETS:
        print(f"Processing {subset}...")
        data_path = os.path.join(
            DATA_ROOT, subset, "arxiv_metadata_with_embeddings.pkl"
        )
        sim_val = os.path.join(DATA_ROOT, subset, "best_scores.npy")
        sim_idx = os.path.join(DATA_ROOT, subset, "best_idxs.npy")
        data_save_path = os.path.join(DATA_ROOT, f"{subset}.tsv")
        sim_save_path = os.path.join(DATA_ROOT, f"{subset}.txt")

        print("Loading data...")
        data = pd.read_pickle(data_path)
        similarity_values = np.load(sim_val)
        similarity_idxs = np.load(sim_idx)

        print("Generating formatted data...")
        formatted_data = generate_formatted_data(
            data,
            COLUMNS,
        )

        print("Saving data...")
        save_data(
            formatted_data,
            data_save_path,
            COLUMNS,
        )

        print("Generating formatted similarities...")
        formatted_similarities = generate_formatted_similarities(
            similarity_values,
            similarity_idxs,
        )

        print("Saving similarities...")
        save_similarities(
            formatted_similarities,
            sim_save_path,
        )

        print("Compressing files...")
        compress_file(data_save_path)
        compress_file(sim_save_path)
