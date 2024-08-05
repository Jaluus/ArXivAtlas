import os

import chromadb
import numpy as np
import pandas as pd

from utils.etc_functions import load_env_vars
from wrappers.openai_wrappers import OpenAI_Embedding

load_env_vars()

SUBSETS = [
    "astro-ph",
    "cond-mat",
    "cs",
    "hep",
    "physics",
    "quant-ph",
]

INSERTIONS_PER_CALL = 1000
FILE_PATH = os.path.dirname(os.path.realpath(__file__))
CHROMA_ROOT = os.path.join(FILE_PATH, "data", "chroma")

if __name__ == "__main__":
    EMBEDDING_FN = OpenAI_Embedding(dim=256)
    CHROMA_CLIENT = chromadb.PersistentClient(CHROMA_ROOT)

    for subset in SUBSETS:
        data_path = os.path.join(
            FILE_PATH,
            "data",
            subset,
            "arxiv_metadata_with_embeddings.pkl",
        )

        paper_context_collection = CHROMA_CLIENT.get_or_create_collection(
            name="arxiv_" + subset,
            embedding_function=EMBEDDING_FN,
        )

        df: pd.DataFrame = pd.read_pickle(data_path)
        df = df.drop_duplicates(subset=["arxiv_id"])
        embeddings = np.array(df["abstract_embedding"].tolist(), dtype=np.float16)

        # normalize embeddings, as we are using the cosine similarity under the hood
        embeddings /= np.linalg.norm(embeddings, axis=1, keepdims=True)

        metadatas = []
        for i, row in df.iterrows():
            metadatas.append(
                {
                    "title": row["title"],
                    "year": row["published"].year,
                    "month": row["published"].month,
                    "day": row["published"].day,
                    "authors": ";".join(row["authors"]),
                    "journal_ref": (
                        row["journal_ref"] if str(row["journal_ref"]) != "<NA>" else "-"
                    ),
                    "doi": row["doi"] if str(row["doi"]) != "<NA>" else "-",
                    "categories": ";".join(row["categories"]),
                    "main_category": row["main_category"],
                }
            )

        ids = df["arxiv_id"].tolist()
        documents = df["abstract"].tolist()

        for i in range(0, len(ids), INSERTIONS_PER_CALL):

            if i + INSERTIONS_PER_CALL < len(ids):
                print(f"Adding papers {i} to {i + INSERTIONS_PER_CALL}...")
                id_batch = ids[i : i + INSERTIONS_PER_CALL]
                embeddding_batch = embeddings[i : i + INSERTIONS_PER_CALL]
                document_batch = documents[i : i + INSERTIONS_PER_CALL]
                metadata_batch = metadatas[i : i + INSERTIONS_PER_CALL]
            else:
                print(f"Adding papers {i} to {len(ids)}...")
                id_batch = ids[i:]
                embeddding_batch = embeddings[i:]
                document_batch = documents[i:]
                metadata_batch = metadatas[i:]

            paper_context_collection.upsert(
                ids=id_batch,
                embeddings=embeddding_batch,
                documents=document_batch,
                metadatas=metadata_batch,
            )

        print(f"Collection count: {paper_context_collection.count()}")
