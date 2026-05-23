"""
Pydantic schemas for Kafka messages on the conflict-articles topic.
These are the canonical message contracts shared by all producers and
validated by the Node.js consumer on the other side.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_validator


class ArticleRef(BaseModel):
    url: str
    title: str
    domain: str = ""
    seen_at: str = ""


class ConflictArticleMessage(BaseModel):
    """
    One Kafka message on the 'conflict-articles' topic.
    Represents a country-grouped cluster of news articles about conflict.
    """

    source: Literal["gdelt", "acled", "rss"]
    country_code: str
    country: str
    region: str
    severity: Literal["low", "medium", "high", "critical"]
    avg_tone: float
    article_count: int
    articles: list[ArticleRef]
    ingested_at: str

    @field_validator("country_code")
    @classmethod
    def upper_cc(cls, v: str) -> str:
        return v.upper()

    def kafka_key(self) -> str:
        return self.country_code
