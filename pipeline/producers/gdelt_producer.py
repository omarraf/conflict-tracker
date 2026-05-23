"""
GDELT producer — fetches conflict articles from the GDELT DOC API and
publishes ConflictArticleMessage records to the 'conflict-articles' topic.

Can be run standalone or imported by the Airflow DAG.

Usage:
    python -m pipeline.producers.gdelt_producer --hours-back 1
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone

import requests

from pipeline.producers.base_producer import produce
from pipeline.schemas.conflict_article import ArticleRef, ConflictArticleMessage

GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
QUERY = "conflict OR war OR violence OR attack OR terrorism OR military"
TOPIC = "conflict-articles"

COUNTRY_CODES: dict[str, str] = {
    "US": "United States", "UA": "Ukraine", "RU": "Russia",
    "IL": "Israel", "PS": "Palestine", "SY": "Syria", "IQ": "Iraq",
    "AF": "Afghanistan", "YE": "Yemen", "SO": "Somalia", "SD": "Sudan",
    "MM": "Myanmar", "CN": "China", "IN": "India", "PK": "Pakistan",
    "NG": "Nigeria", "ET": "Ethiopia", "VE": "Venezuela",
    "CO": "Colombia", "MX": "Mexico",
}

REGION_MAP: dict[str, str] = {
    "United States": "North America", "Mexico": "Central America",
    "Ukraine": "Eastern Europe", "Russia": "Eastern Europe",
    "Israel": "Middle East", "Palestine": "Middle East",
    "Syria": "Middle East", "Iraq": "Middle East", "Yemen": "Middle East",
    "Afghanistan": "Central Asia", "Pakistan": "South Asia",
    "India": "South Asia", "China": "East Asia", "Myanmar": "Southeast Asia",
    "Somalia": "East Africa", "Ethiopia": "East Africa",
    "Sudan": "North Africa", "Nigeria": "West Africa",
    "Colombia": "South America", "Venezuela": "South America",
}


def fetch_articles(hours_back: int = 1) -> list[dict]:
    params = {
        "query": QUERY,
        "mode": "ArtList",
        "maxrecords": "250",
        "format": "json",
        "timespan": f"{hours_back}h",
    }
    resp = requests.get(GDELT_URL, params=params, timeout=30)
    resp.raise_for_status()
    articles = resp.json().get("articles", [])
    print(f"[gdelt] fetched {len(articles)} articles")
    return articles


def transform(articles: list[dict]) -> list[ConflictArticleMessage]:
    grouped: dict[str, list[dict]] = {}
    for article in articles:
        cc = (article.get("seencc") or "").split(",")[0].strip().upper()
        grouped.setdefault(cc, []).append(article)

    messages: list[ConflictArticleMessage] = []
    for cc, group in grouped.items():
        country = COUNTRY_CODES.get(cc)
        if not country:
            continue

        tones = [float(a["tone"]) for a in group if a.get("tone")]
        avg_tone = sum(tones) / len(tones) if tones else 0.0
        volume = len(group)

        if avg_tone < -5 or volume > 50:
            severity = "critical"
        elif avg_tone < -2 or volume > 20:
            severity = "high"
        elif avg_tone < 0 or volume > 10:
            severity = "medium"
        else:
            severity = "low"

        messages.append(
            ConflictArticleMessage(
                source="gdelt",
                country_code=cc,
                country=country,
                region=REGION_MAP.get(country, "Other"),
                severity=severity,
                avg_tone=round(avg_tone, 2),
                article_count=volume,
                articles=[
                    ArticleRef(
                        url=a.get("url", ""),
                        title=a.get("title", ""),
                        domain=a.get("domain", ""),
                        seen_at=a.get("seendatetime", ""),
                    )
                    for a in group[:5]
                ],
                ingested_at=datetime.now(timezone.utc).isoformat(),
            )
        )

    print(f"[gdelt] transformed → {len(messages)} country groups")
    return messages


def run(hours_back: int = 1) -> int:
    articles = fetch_articles(hours_back)
    messages = transform(articles)
    return produce(TOPIC, messages, key_field="country_code")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hours-back", type=int, default=1)
    args = parser.parse_args()
    run(args.hours_back)
