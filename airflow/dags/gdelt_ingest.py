"""
gdelt_ingest — hourly DAG that fetches GDELT conflict articles and publishes
them to the 'conflict-articles' Kafka topic (or local JSONL in Phase 1).

Pipeline:
  check_availability → extract_articles → transform_articles → publish_to_kafka
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Any

from airflow.decorators import dag, task
from airflow.providers.http.sensors.http import HttpSensor

# Make pipeline/ importable inside the container.
# The repo root is mounted at /opt/airflow; adjust if your volume differs.
_REPO_ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "..")
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from operators.kafka_publish_operator import KafkaPublishOperator
from pipeline.producers.gdelt_producer import fetch_articles, transform

TOPIC = "conflict-articles"

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
        articles = fetch_articles(hours_back=1)
        context["ti"].xcom_push(key="raw_count", value=len(articles))
        return articles

    @task(task_id="transform_articles")
    def transform_articles(articles: list[dict], **context: Any) -> list[dict]:
        messages = transform(articles)
        serialized = [m.model_dump() for m in messages]
        context["ti"].xcom_push(key="message_count", value=len(serialized))
        return serialized

    def _get_messages(**context: Any) -> list[dict]:
        from pydantic import TypeAdapter
        from pipeline.schemas.conflict_article import ConflictArticleMessage

        raw = context["ti"].xcom_pull(task_ids="transform_articles")
        ta = TypeAdapter(list[ConflictArticleMessage])
        return ta.validate_python(raw)

    publish = KafkaPublishOperator(
        task_id="publish_to_kafka",
        topic=TOPIC,
        messages_callable=_get_messages,
        key_field="country_code",
    )

    raw = extract_articles()
    transformed = transform_articles(raw)
    check_availability >> raw >> transformed >> publish


gdelt_ingest()
