from typing import Self

from pydantic import BaseModel, ValidationError, model_validator


class Query(BaseModel):
    query: str
    category: str
    top_k: int = 200
    top_n: int = 5
    rerank_score_threshold: float = 0.1
    use_rerank: bool = False

    @model_validator(mode="after")
    def custom_validation(self) -> Self:

        if self.top_k < self.top_n:
            raise ValueError("top_k must be greater than or equal to top_n")

        if self.rerank_score_threshold < 0 or self.rerank_score_threshold > 1:
            raise ValueError("rerank_score_threshold must be between 0 and 1")

        if self.top_k > 400:
            raise ValueError("top_k must be less than or equal to 400")

        if self.top_n > 10:
            raise ValueError("top_n must be less than or equal to 10")

        return self


class Document(BaseModel):
    id: str
    title: str
    content: str
    authors: str
    categories: str
    main_category: str
    distance: float
    score: float
    day: int
    month: int
    year: int
    doi: str = "-"
    journal_ref: str = "-"
