import os
import time
from typing import Literal

import chromadb
from openai import OpenAI


class OpenAI_Embedding(chromadb.EmbeddingFunction):
    def __init__(
        self,
        api_key: str | None = None,
        embedding_model: Literal[
            "text-embedding-3-small",
            "text-embedding-3-large",
        ] = "text-embedding-3-large",
        max_chunks_per_call: int = 2048,
        dim: int = -1,
        verbose: bool = True,
    ):
        if api_key is None:
            api_key = os.environ.get("OPENAI_API_KEY", None)

        if api_key is None:
            raise ValueError(
                "api_key must be provided as an argument or in the environment variable OPENAI_API_KEY"
            )

        self.client = OpenAI(api_key=api_key)
        self.embedding_model = embedding_model
        self.dim = dim
        self.verbose = verbose
        if max_chunks_per_call > 2048:
            raise ValueError(
                f"max_chunks_per_call must be <= 2048, got {max_chunks_per_call}, OpenAI will only accept up to 2048 inputs per chunk."
            )
        self.max_chunks_per_call = max_chunks_per_call

    def __call__(
        self,
        input_list: list[str],
        sleep_time: int = 0,
    ) -> chromadb.Embeddings:
        embeddings = []
        for i in range(0, len(input_list), self.max_chunks_per_call):
            if i + self.max_chunks_per_call > len(input_list):
                if self.verbose:
                    print(f"Processing chunk {i} to {len(input_list)} (last chunk)")
                chunk = input_list[i:]
            else:
                if self.verbose:
                    print(
                        f"Processing chunk {i} to {i + self.max_chunks_per_call} of {len(input_list)}"
                    )
                chunk = input_list[i : i + self.max_chunks_per_call]
            embedding = self.client.embeddings.create(
                input=chunk,
                model=self.embedding_model,
            )
            embeddings.extend(
                [
                    (
                        embedding.data[i].embedding[: self.dim]
                        if self.dim > 0
                        else embedding.data[i].embedding
                    )
                    for i in range(len(embedding.data))
                ]
            )
            if i + self.max_chunks_per_call < len(input_list):
                time.sleep(sleep_time)
        return embeddings
