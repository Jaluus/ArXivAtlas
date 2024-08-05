import pandas as pd


def rerank_results(
    query: str,
    documents: pd.DataFrame,
    reranker,
) -> pd.DataFrame:
    contents = documents["content"].tolist()
    scores = reranker(query, contents)
    documents["rerank_score"] = scores
    return documents


def process_results(
    documents: pd.DataFrame,
    top_n: int = 5,
    rerank_score_threshold: float = 0.0,
) -> pd.DataFrame:

    # rename the score column to distance, as the "score" is typically the return value of the vector search
    # this is often the L2 or cosine distance
    documents = documents.rename(columns={"score": "distance"})

    if "rerank_score" in documents.columns:
        documents = (
            documents.sort_values(by=["rerank_score"], ascending=False)
            .query(f"rerank_score > {rerank_score_threshold}")
            .reset_index(drop=True)
            .head(top_n)
        )
        # rename the rerank_score column to score as this is the actual score we want to return
        # the score should always be a value between 0 and 1 and a high score indicates a high relevance
        documents = documents.rename(columns={"rerank_score": "score"})

    else:
        documents = (
            documents.sort_values(by=["distance"], ascending=True)
            .reset_index(drop=True)
            .sort_values(by=["distance"], ascending=True)
            .head(top_n)
        )

        # if the documents do not have a rerank_score, we can use the similarity score as the score
        # distance can be between 0 and infinity, so we need to normalize it to a score between 0 and 1
        # if distance is 0, the score will be 1, if distance is infinity, the score will be 0
        documents["score"] = documents["distance"].apply(lambda x: 1 / (1 + x))

    return documents
