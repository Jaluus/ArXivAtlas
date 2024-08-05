import os
from typing import Literal

import cohere


class Cohere_Reranker:
    def __init__(
        self,
        api_key: str | None = None,
        rerank_model: Literal[
            "rerank-english-v2.0",  # this seems to be worse than the multilingual model, even on English queries
            "rerank-english-v3.0",
            "rerank-multilingual-v2.0",
            "rerank-multilingual-v3.0",
        ] = "rerank-multilingual-v3.0",
    ) -> None:
        if api_key is None:
            api_key = os.environ.get("COHERE_API_KEY", None)

        if api_key is None:
            raise ValueError(
                "api_key must be provided as an argument or in the environment variable COHERE_API_KEY"
            )
        self.client = cohere.Client(api_key=api_key)
        self.rerank_model = rerank_model

    def __call__(
        self,
        query: str,
        documents: list[str],
    ) -> list[float]:
        if len(documents) < 2:
            return [1.0 for _ in documents]

        response = self.client.rerank(
            model=self.rerank_model,
            query=query,
            documents=documents,
            return_documents=False,
        )
        scores = [0.0] * len(documents)
        for res in response.results:
            scores[res.index] = res.relevance_score

        return scores
