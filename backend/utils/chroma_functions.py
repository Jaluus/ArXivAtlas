from typing import List

import chromadb
import pandas as pd


def query_chroma_collection(
    queries: List[str],
    collection: chromadb.Collection,
    top_k: int = 25,
) -> pd.DataFrame:

    rows = []

    results = collection.query(
        query_texts=queries,
        n_results=top_k,
        include=["distances", "metadatas", "documents"],
    )

    for (
        query_ids,
        query_metadatas,
        query_documents,
        query_distances,
    ) in zip(
        results["ids"],
        results["metadatas"],
        results["documents"],
        results["distances"],
    ):
        for result_idx in range(top_k):
            row = {
                "id": query_ids[result_idx],
                "score": query_distances[result_idx],
                "content": query_documents[result_idx],
            }
            ## Merge the metadata directly into the row dictionary
            row.update(query_metadatas[result_idx])
            rows.append(row)

    final_df = pd.DataFrame(rows)
    final_df = final_df.drop_duplicates(subset=["id"])
    return final_df
