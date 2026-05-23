"""
gdelt_ingest — hourly DAG that fetches GDELT conflict articles and publishes
them to the 'conflict-articles' Kafka topic (or local JSONL in Phase 1).

Pipeline:
  check_availability → extract_articles → transform_articles → publish_to_kafka
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any

import requests
from airflow.decorators import dag, task
from airflow.providers.http.sensors.http import HttpSensor

from operators.kafka_publish_operator import KafkaPublishOperator

GDELT_BASE_URL = os.getenv(
    "GDELT_API_URL", "https://api.gdeltproject.org/api/v2/doc/doc"
)
QUERY = "conflict OR war OR violence OR attack OR terrorism OR military"
MAX_RECORDS = 250
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


default_args = {
    "owner": "conflict-tracker",
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "email_on_failure": False,
}


@dag(
    dag_id="gdelt_ingest",
    description="Fetch GDELT conflict articles and publish to Kafka",
    schedule="@hourly",
    start_date=datetime(2024, 1, 1, tzinfo=timezone.utc),
    catchup=False,
    default_args=default_args,
    tags=["ingestion", "gdelt"],
)
def gdelt_ingest():

    # --- Sensor: wait for GDELT API to be reachable ---
    check_availability = HttpSensor(
        task_id="check_availability",
        http_conn_id="gdelt_api",
        endpoint="",
        request_params={
            "query": "test",
            "mode": "ArtList",
            "maxrecords": "1",
            "format": "json",
            "timespan": "1h",
        },
        response_check=lambda resp: resp.status_code == 200,
        poke_interval=30,
        timeout=120,
        mode="reschedule",
    )

    @task(task_id="extract_articles")
    def extract_articles(**context: Any) -> list[dict]:
        """Fetch raw articles from GDELT DOC API."""
        params = {
            "query": QUERY,
            "mode": "ArtList",
            "maxrecords": str(MAX_RECORDS),
            "format": "json",
            "timespan": "1h",
        }
        resp = requests.get(GDELT_BASE_URL, params=params, timeout=30)
        resp.raise_for_status()

        articles: list[dict] = resp.json().get("articles", [])
        print(f"Extracted {len(articles)} articles from GDELT")

        # Push record count via XCom for downstream logging
        context["ti"].xcom_push(key="raw_count", value=len(articles))
        return articles

    @task(task_id="transform_articles")
    def transform_articles(articles: list[dict], **context: Any) -> list[dict]:
        """
        Group articles by country, calculate severity, and return
        structured message dicts ready for Kafka.
        """
        grouped: dict[str, list[dict]] = {}
        for article in articles:
            country_codes = (article.get("seencc") or "").split(",")
            key = country_codes[0].strip().upper() if country_codes else "XX"
            grouped.setdefault(key, []).append(article)

        messages: list[dict] = []
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

            messages.append({
                "source": "gdelt",
                "country_code": cc,
                "country": country,
                "region": REGION_MAP.get(country, "Other"),
                "severity": severity,
                "avg_tone": round(avg_tone, 2),
                "article_count": volume,
                "articles": [
                    {
                        "url": a.get("url", ""),
                        "title": a.get("title", ""),
                        "domain": a.get("domain", ""),
                        "seen_at": a.get("seendatetime", ""),
                    }
                    for a in group[:5]
                ],
                "ingested_at": datetime.now(timezone.utc).isoformat(),
            })

        print(f"Transformed {len(articles)} articles → {len(messages)} country groups")
        context["ti"].xcom_push(key="message_count", value=len(messages))
        return messages

    def _get_messages(**context: Any) -> list[dict]:
        return context["ti"].xcom_pull(task_ids="transform_articles")

    publish = KafkaPublishOperator(
        task_id="publish_to_kafka",
        topic=TOPIC,
        messages_callable=_get_messages,
        key_field="country_code",
    )

    # --- Wire up the DAG ---
    raw = extract_articles()
    transformed = transform_articles(raw)
    check_availability >> raw >> transformed >> publish


gdelt_ingest()
