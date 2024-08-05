import datetime
import os
import re
import time

import pandas as pd
import requests
import xmltodict


def lint_text(string: str) -> str:
    string = string.replace("\r\n", " ")
    string = string.replace("\xa0", " ")
    string = string.replace("\n", " ")
    string = string.replace("—", "-")
    string = string.replace("–", "-")
    string = string.replace("…", "...")
    string = string.replace("’", "'")
    string = string.replace("”", "'")
    string = string.replace("“", "'")

    string = re.sub(r"\b([A-Za-z0-9]+) \{\}", r"{\1}", string)
    string = string.replace("{}", "")
    string = string.encode("utf-8", "ignore").decode("utf-8")
    string = string.replace("\\sim", "~")
    string = string.replace("\\times", "x")
    string = string.replace(" .", ".")
    string = string.replace(" ,", ",")

    string = re.sub(r"\\label{.*?}", "", string)
    string = re.sub(r"\\begin{equation}", "$", string)
    string = re.sub(r"\\end{equation}", "$", string)
    string = re.sub(r"\\begin{equation\*}", "$", string)
    string = re.sub(r"\\end{equation\*}", "$", string)
    string = re.sub(r"\\FLP", "", string)
    string = re.sub(r"\\\\\[.*?]", "", string)
    string = re.sub(r"\\biggl", " ", string)
    string = re.sub(r"\\biggr", " ", string)
    string = re.sub(r"\\Biggl", " ", string)
    string = re.sub(r"\\Biggr", " ", string)
    string = re.sub(r"\\tfrac", r"\\frac", string)
    string = re.sub(r"\\notag", "", string)
    string = re.sub(r"\\\\", " ", string)

    string = re.sub(r"\\;", " ", string)
    string = re.sub(r"\\,", " ", string)
    string = re.sub(r"\\:", " ", string)
    string = re.sub(r"\\!", " ", string)
    string = re.sub(r"\\quad", " ", string)

    string = re.sub(r"\\([a-zA-Z])op", r"\\hat{\1}", string)
    string = re.sub(r"\\([a-zA-Z])dotop", r"\\hat{\\dot{\1}}", string)

    string = re.sub(r"\\expval{(.*?)}", r"\\braket{\1}", string)
    string = re.sub(r"\\av{(.*?)}", r"\\bar{\1}", string)
    string = re.sub(r"\\abs{(.*?)}", r"|\1|", string)

    string = re.sub(r"\\ketsl{(.*?)}", r"\\ket{\1}", string)
    string = re.sub(r"\\barsl{(.*?)}", r"\\bar{\1}", string)
    string = re.sub(r"\\slOne", "1", string)
    string = re.sub(r"\\slTwo", "2", string)

    # find all \\ddp{SOMETEXT}{TEXT} and replace them with \\frac{\\partial SOMETEXT}{\\partial TEXT}
    string = re.sub(
        r"\\ddp{(.*?)}{(.*?)}", r"\\frac{\\partial \1}{\\partial \2}", string
    )
    string = re.sub(
        r"\\ddpl{(.*?)}{(.*?)}", r"\\frac{\\partial \1}{\\partial \2}", string
    )
    string = re.sub(r"\\ddt{(.*?)}{(.*?)}", r"\\frac{d \1}{d \2}", string)
    string = re.sub(r"\\ddtl{(.*?)}{(.*?)}", r"\\frac{d \1}{d \2}", string)

    # condense all whitespace to a single space
    string = re.sub(r"\s+", " ", string)

    return string


def format_response(documents: list[dict]) -> pd.DataFrame:
    # each doc as the following format
    # url: The URL to the arXiv page, may end with v1, v2, etc. Helps to see if the paper has been updated.
    # title: The title of the paper.
    # arxiv_id: The arXiv ID of the paper. without the version number.
    # published: The date the paper was published.
    # updated: The date the paper was last updated.
    # abstact: The abstract of the paper.
    # main_category: The main category of the paper.
    # categories: The categories of the paper.
    # authors: a list of authors of the paper.
    # journal_ref: The journal reference of the paper if available.
    # doi: The DOI of the paper if available.
    # arxiv_Comment: The comment of the paper if available.
    # arxiv_DOI: The DOI used by DataCite if available.
    formatted_docs = []

    for document in documents:
        try:
            formatted_doc = {}
            # strip the version number from the id
            # TODO: Handle revision over 9
            formatted_doc["title"] = lint_text(document["title"])
            formatted_doc["arxiv_id"] = document["id"].split("/")[-1].split("v")[0]
            formatted_doc["abstract"] = lint_text(document["summary"])
            formatted_doc["main_category"] = document["arxiv:primary_category"]["@term"]
            formatted_doc["revision"] = int(
                document["id"].split("/")[-1].split("v")[-1]
            )
            formatted_doc["published"] = datetime.datetime.strptime(
                document["published"],
                "%Y-%m-%dT%H:%M:%SZ",
            )
            formatted_doc["updated"] = datetime.datetime.strptime(
                document["updated"],
                "%Y-%m-%dT%H:%M:%SZ",
            )

            # handle the case where there is only one category
            cat = document["category"]
            if type(cat) == dict:
                cat = [cat]

            formatted_doc["categories"] = [category["@term"] for category in cat]

            # format the author list as First Letter of the first name. Last name
            if type(document["author"]) == dict:
                document["author"] = [document["author"]]
            formatted_doc["authors"] = [author["name"] for author in document["author"]]
            formatted_doc["authors"] = [
                author.split(" ")[0][0] + ". " + author.split(" ")[-1]
                for author in formatted_doc["authors"]
            ]

            formatted_doc["journal_ref"] = document.get("arxiv:journal_ref", None)
            if formatted_doc["journal_ref"]:
                formatted_doc["journal_ref"] = formatted_doc["journal_ref"]["#text"]
            formatted_doc["doi"] = document.get("arxiv:doi", None)
            if formatted_doc["doi"]:
                formatted_doc["doi"] = formatted_doc["doi"]["#text"]
            formatted_doc["arxiv_comment"] = document.get("arxiv:comment", None)
            if formatted_doc["arxiv_comment"]:
                formatted_doc["arxiv_comment"] = formatted_doc["arxiv_comment"]["#text"]
            formatted_doc["arxiv_DOI"] = document.get("arxiv:doi", None)
            if formatted_doc["arxiv_DOI"]:
                formatted_doc["arxiv_DOI"] = formatted_doc["arxiv_DOI"]["#text"]

            formatted_docs.append(formatted_doc)
        except Exception as e:
            print(e)
            continue

    df = pd.DataFrame(formatted_docs)
    return df


def query_arxiv_with_id_chunk(
    id_chunk: list,
    arxiv_template: str,
) -> pd.DataFrame | None:
    get_url = arxiv_template.format(
        id_list=",".join(id_chunk), max_results=len(id_chunk)
    )
    res = requests.get(get_url)
    res_dict = xmltodict.parse(res.text)
    if "entry" not in res_dict["feed"]:
        return None

    documents = res_dict["feed"]["entry"]
    if not isinstance(documents, list):
        documents = [documents]

    return format_response(documents)


def query_arxiv_with_ids(
    arxiv_ids: list,
    chunk_size: int = 400,
    link_template: str = "https://export.arxiv.org/api/query?id_list={id_list}&max_results={max_results}",
) -> pd.DataFrame:
    df = pd.DataFrame(
        columns=[
            "title",
            "arxiv_id",
            "published",
            "updated",
            "abstract",
            "main_category",
            "categories",
            "authors",
            "journal_ref",
            "doi",
            "arxiv_comment",
            "arxiv_DOI",
        ]
    )
    try:
        for idx in range(0, len(arxiv_ids), chunk_size):
            time.sleep(3)
            print(
                f"Querying arXiv for {idx:7} to {idx+chunk_size:7} out of {len(arxiv_ids):7} | {len(df)} entries found",
                end="\r",
            )
            id_chunk = arxiv_ids[idx : idx + chunk_size]
            id_df = query_arxiv_with_id_chunk(id_chunk, link_template)
            if id_df is not None:
                if len(df) == 0:
                    df = id_df
                else:
                    df = pd.concat([df, id_df])
                df = df.drop_duplicates(subset=["arxiv_id"])
    except Exception as e:
        print(e)
        df.to_pickle("error.pkl")
    finally:
        return df


CATEGORY = "cs"
FILE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_ROOT = os.path.join(FILE_DIR, "data", CATEGORY)
FULL_SAVE_PATH = os.path.join(DATA_ROOT, "arxiv_metadata_with_crosspostings.pkl")
SAVE_PATH = os.path.join(DATA_ROOT, "arxiv_metadata.pkl")

if __name__ == "__main__":
    with open(os.path.join(DATA_ROOT, "arxiv_ids.txt"), "r") as f:
        arxiv_ids = f.readlines()
        arxiv_ids = [id.strip() for id in arxiv_ids]

    df = query_arxiv_with_ids(arxiv_ids, chunk_size=400)
    df.to_pickle(FULL_SAVE_PATH)

    # Filter out papers that are not in the desired category
    df = df[df["main_category"].str.startswith(CATEGORY)]
    df = df.reset_index(drop=True)
    df.to_pickle(SAVE_PATH)
