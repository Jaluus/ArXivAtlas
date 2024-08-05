import os

import numpy as np
import pandas as pd

from utils.etc_functions import load_env_vars
from wrappers.openai_wrappers import OpenAI_Embedding

load_env_vars()

CATEGORY = "cs"

FILE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_ROOT = os.path.join(FILE_DIR, "data", CATEGORY)
DATA_PATH = os.path.join(DATA_ROOT, "arxiv_metadata.pkl")

if __name__ == "__main__":
    df: pd.DataFrame = pd.read_pickle(DATA_PATH)

    embedding_fn = OpenAI_Embedding(
        embedding_model="text-embedding-3-large",
        max_chunks_per_call=2048,
        dim=256,
    )

    abstracts = df["abstract"].tolist()
    embeddings = embedding_fn(abstracts)

    # Convert embeddings to np.float16 to save space, they should not loose too much information
    # But if you want to be sure, you can use np.float32, but its twice the space requirement
    embeddings = [np.array(e, dtype=np.float16) for e in embeddings]
    df["abstract_embedding"] = embeddings

    df.to_pickle(os.path.join(DATA_ROOT, "arxiv_metadata_with_embeddings.pkl"))
