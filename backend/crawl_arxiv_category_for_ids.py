import os
import time

import bs4
import numpy as np
import requests


def fetch_arxiv_ids(
    category: str,
    year: int,
    month: int,
    link_template: str,
    curr_page: int = 0,
    entries_per_page: int = 2000,
) -> list[str]:
    link = link_template.format(
        category=category,
        year=year,
        month=str(month).zfill(2),
        skip=curr_page * entries_per_page,
        show=entries_per_page,
    )
    response = requests.get(link)
    soup = bs4.BeautifulSoup(response.text, "html.parser")
    anchors = soup.find_all("a", title="Abstract")
    return [a["id"] for a in anchors]


FILE_DIR = os.path.dirname(os.path.abspath(__file__))
# For an overview of the arXiv categories, see https://arxiv.org/archive
CATEGORY = "cs"
ENTRIES_PER_PAGE = 2000
START_YEAR = 2013
END_YEAR = 2021
LINK_TEMPLATE = (
    "https://arxiv.org/list/{category}/{year}-{month}?skip={skip}&show={show}"
)
SAVE_DIR = os.path.join(FILE_DIR, "data", CATEGORY)

if __name__ == "__main__":
    os.makedirs(SAVE_DIR, exist_ok=True)

    arxiv_ids = []
    try:
        for year in range(START_YEAR, END_YEAR + 1):
            for month in range(1, 13):
                curr_page = 0

                # always sleep for a few seconds to avoid getting blocked
                # Play nice and keep this at 5 seconds or higher
                # The ArXiv Team is working hard to provide this service for free
                time.sleep(5)
                ids = fetch_arxiv_ids(
                    CATEGORY,
                    year,
                    month,
                    LINK_TEMPLATE,
                    curr_page,
                    ENTRIES_PER_PAGE,
                )
                arxiv_ids.extend(ids)

                print(f"{year}-{str(month).zfill(2)}: {len(ids)}")

                if len(ids) == 0:
                    break

                # we check if there are more pages to fetch from
                # this a very crude way to do this, but it works
                while len(ids) == ENTRIES_PER_PAGE:
                    curr_page += 1

                    time.sleep(5)
                    ids = fetch_arxiv_ids(
                        CATEGORY,
                        year,
                        month,
                        LINK_TEMPLATE,
                        curr_page,
                        ENTRIES_PER_PAGE,
                    )
                    arxiv_ids.extend(ids)

                    print(f"{year}-{str(month).zfill(2)}: {len(ids)}")

    except Exception as e:
        print(e)
    finally:
        np.savetxt(
            os.path.join(
                SAVE_DIR,
                "arxiv_ids.txt",
            ),
            arxiv_ids,
            fmt="%s",
        )
