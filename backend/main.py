import os

import chromadb
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from utils.app_dataclasses import Document, Query
from utils.chroma_functions import query_chroma_collection
from utils.etc_functions import load_env_vars
from utils.query_functions import process_results, rerank_results
from wrappers.cohere_wrappers import Cohere_Reranker
from wrappers.openai_wrappers import OpenAI_Embedding

load_env_vars()

# Apply CORS to all routes
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://atlas.uslu.tech"],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)

FILE_PATH = os.path.dirname(os.path.realpath(__file__))
CHROMA_PATH = os.path.join(FILE_PATH, "data", "chroma")

reranker = Cohere_Reranker()
embedding_fn = OpenAI_Embedding(dim=256, verbose=False)
chroma_client = chromadb.PersistentClient(CHROMA_PATH)


@app.post("/query")
def run_query(query: Query):
    try:
        collection = chroma_client.get_collection(
            name="arxiv_" + query.category,
            embedding_function=embedding_fn,
        )
    except ValueError:
        raise HTTPException(
            status_code=404,
            detail="Collection not found, please rebuild the database",
        )

    documents: pd.DataFrame = query_chroma_collection(
        collection=collection,
        queries=[query.query],
        top_k=query.top_k,
    )

    if query.use_rerank:
        documents: pd.DataFrame = rerank_results(
            query=query.query,
            documents=documents,
            reranker=reranker,
        )

    documents: pd.DataFrame = process_results(
        documents=documents,
        top_n=query.top_n,
        rerank_score_threshold=query.rerank_score_threshold,
    )

    return [Document(**doc) for doc in documents.to_dict(orient="records")]


@app.get("/abstract/{category}/{document_id}")
def run_query(category: str, document_id: str):
    try:
        collection = chroma_client.get_collection(
            name="arxiv_" + category,
            embedding_function=embedding_fn,
        )
    except ValueError:
        raise HTTPException(
            status_code=404,
            detail="Collection not found, please rebuild the database",
        )

    document = collection.get(document_id, include=["documents"])["documents"]
    if len(document) == 0:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )
    return {"abstract": document[0]}
