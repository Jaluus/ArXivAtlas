import os

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import umap

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

# UMAP parameters
N_NEIGHBORS = 100
N_EPOCHS = 200

if __name__ == "__main__":
    for subset in SUBSETS:
        data_path = os.path.join(
            DATA_ROOT,
            subset,
            "arxiv_metadata_with_embeddings.pkl",
        )
        save_dir = os.path.join(DATA_ROOT, subset, "projections")
        os.makedirs(save_dir, exist_ok=True)

        df = pd.read_pickle(data_path)
        embeddings = np.array(df["abstract_embedding"].tolist(), dtype=np.float16)
        embeddings /= np.linalg.norm(embeddings, axis=1).reshape(-1, 1)

        reducer = umap.UMAP(
            n_neighbors=N_NEIGHBORS,
            min_dist=0.2,
            n_components=2,
            local_connectivity=1,
            n_epochs=N_EPOCHS,
            metric="euclidean",
            output_metric="euclidean",
            transform_seed=42,
            verbose=True,
        )

        X_transformed = reducer.fit_transform(embeddings)

        # normalize the UMAP projection to [0, 1]
        x_trafo = X_transformed[:, 0]
        y_trafo = X_transformed[:, 1]
        x_trafo = (x_trafo - x_trafo.min()) / (x_trafo.max() - x_trafo.min())
        y_trafo = (y_trafo - y_trafo.min()) / (y_trafo.max() - y_trafo.min())
        X_transformed = np.stack([x_trafo, y_trafo], axis=1)

        np.save(
            os.path.join(
                save_dir,
                f"UMAP_{N_NEIGHBORS}N_{N_EPOCHS}E.npy",
            ),
            X_transformed,
        )

        df["x_umap"] = x_trafo
        df["y_umap"] = y_trafo

        df.to_pickle(
            os.path.join(
                DATA_ROOT,
                subset,
                "arxiv_metadata_with_embeddings.pkl",
            ),
        )

        # Plot the UMAP projection for inspection
        plt.scatter(X_transformed[:, 0], X_transformed[:, 1], s=1)
        plt.savefig(
            os.path.join(
                save_dir,
                f"UMAP_{N_NEIGHBORS}N_{N_EPOCHS}E.png",
            ),
        )
        plt.close()
