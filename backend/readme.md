# ArXiv Atlas Backend

This it the backend of the ArXiv Atlas Project.  
It is build using Python 3.11, [FastAPI](https://fastapi.tiangolo.com/) for the API, [Pandas](https://pandas.pydata.org/docs/index.html) for data handling, [Torch](https://pytorch.org/) for Dot Product speedup and [Chroma](https://www.trychroma.com/) for the database.

## Getting Started

Download Python 3.11 or higher and run the following command to install the necessary packages:

```bash
pip install -r requirements.txt
```

There are loads of good tutorials on how to install Python and pip, so I will not go into detail here.

You will also need to have a `.env` file in the root directory of the project. This file should contain the following variables:

```env
OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
COHERE_API_KEY="YOUR_COHERE_API_KEY"
```

You only need the `OPENAI_API_KEY` if you want to use the `add_embeddings_to_df.py` script and my wrapper for the OpenAI API.
Also the `COHERE_API_KEY` is only needed if you want to use the Cohere Reranking API.

## Available Scripts

| Script                            | Description                                                                                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `crawl_arxiv_category_for_ids.py` | Crawls the ArXiv for papers in a specific category and saves the IDs to a file.                                                                                         |
| `crawl_arxiv_api_with_ids.py`     | Crawls the ArXiv API for papers with specific IDs and saves all information to a pandas DataFrame.                                                                      |
| `add_embeddings_to_df.py`         | Takes a DataFrame with papers and adds embeddings to it. Currently uses the `text-embeddings-3-large` model from Openai. But you can change this to any model you like. |
| `project_embeddings_to_2D.py`     | Runs UMAP on the embeddings to project them to 2D. Adds a column to the Dataframe.                                                                                      |
| `generate_similarity_list.py`     | Calculates the Similaries between all papers in teh dataset and stores them in 2 files file.                                                                            |
| `generate_frontend_files.py`      | Generates the necessary files for the frontend. Taks a Dataframe and transforms it to a `.tsv` file .                                                                   |
| `create_chroma_collection.py`     | Adds all embeddings and abstracts from the Dataframe to a queryable [chroma](https://www.trychroma.com/) database.                                                      |
| `main.py`                         | Starts the FastAPI server.                                                                                                                                              |

## Starting the Backend

To start the backend, run the following command:

```bash
uvicorn main:app --reload --port 7000
```
