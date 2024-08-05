import os
import time

import numpy as np
import pandas as pd
import torch

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

NEIGHBORS = 100
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

if __name__ == "__main__":
    for subset in SUBSETS:
        dataframe_path = os.path.join(
            DATA_ROOT,
            subset,
            "arxiv_metadata_with_embeddings.pkl",
        )
        df = pd.read_pickle(dataframe_path)

        embeddings = np.array(
            df["abstract_embedding"].tolist(),
            dtype=np.float16,
        )
        arxiv_ids = np.array(
            df["arxiv_id"].tolist(),
            dtype=str,
        )

        # remove the dataframe to save memory
        del df

        embeddings = torch.tensor(embeddings, dtype=torch.float16).to(DEVICE)

        # normalize embeddings, as we are using the cosine similarity under the hood
        # redo this just in case
        embeddings = embeddings / torch.norm(embeddings, dim=1).reshape(-1, 1)

        best_idxs = torch.zeros(
            (embeddings.shape[0], NEIGHBORS),
            dtype=torch.int32,
        ).to(DEVICE)
        best_scores = torch.zeros(
            (embeddings.shape[0], NEIGHBORS),
            dtype=torch.float16,
        ).to(DEVICE)

        start = time.time()
        print("Start")

        for i in range(embeddings.shape[0]):
            print(f"{i / embeddings.shape[0]:.4%}", end="\r")
            # compute the cosine similarity between the current embedding and all other embeddings
            # as the embeddings are normalized, this is equivalent to the dot product
            # if you are really dareing you can use torch.matmul(embeddings, embeddings.T) to compute all similarities at once
            # But this will quite literally eat all your memory and, if your kernel has a bad day, crash your system
            scores = torch.matmul(embeddings, embeddings[i])
            idxs = torch.argsort(scores, descending=True, dim=0)
            best_idxs[i] = idxs[1 : NEIGHBORS + 1]
            best_scores[i] = scores[idxs[1 : NEIGHBORS + 1]]

        end = time.time()
        print("Time taken:", end - start)

        best_idxs = best_idxs.cpu().numpy().astype(np.int32)
        best_scores = best_scores.cpu().numpy().astype(np.float16)

        np.save(os.path.join(DATA_ROOT, subset, "best_idxs.npy"), best_idxs)
        np.save(os.path.join(DATA_ROOT, subset, "best_scores.npy"), best_scores)
