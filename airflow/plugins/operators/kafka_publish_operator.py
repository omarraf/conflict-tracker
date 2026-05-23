"""
Custom Airflow operator that publishes a batch of messages to a Confluent Kafka topic.

Phase 1: writes messages to a local JSON file (data/<topic>.jsonl) so the DAG
         runs end-to-end without requiring Confluent Cloud credentials.
Phase 2: set KAFKA_BOOTSTRAP_SERVERS / KAFKA_API_KEY / KAFKA_API_SECRET in the
         Airflow connection (conn_id='kafka_default') to switch to real Kafka.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from airflow.models import BaseOperator


class KafkaPublishOperator(BaseOperator):
    """
    Publish a list of dicts to a Kafka topic.

    Args:
        topic: Kafka topic name.
        messages_callable: callable that returns list[dict] — receives context kwargs.
        kafka_conn_id: Airflow connection with Kafka credentials (optional in Phase 1).
        key_field: field in each message to use as the Kafka partition key.
    """

    template_fields = ("topic",)

    def __init__(
        self,
        topic: str,
        messages_callable: Any,
        kafka_conn_id: str = "kafka_default",
        key_field: str | None = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(**kwargs)
        self.topic = topic
        self.messages_callable = messages_callable
        self.kafka_conn_id = kafka_conn_id
        self.key_field = key_field

    def execute(self, context: dict) -> int:
        messages: list[dict] = self.messages_callable(**context)
        self.log.info("Publishing %d messages to topic '%s'", len(messages), self.topic)

        bootstrap = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "")
        if bootstrap:
            return self._publish_kafka(messages, bootstrap)
        else:
            return self._publish_local(messages)

    def _publish_kafka(self, messages: list[dict], bootstrap: str) -> int:
        from confluent_kafka import Producer

        conf = {
            "bootstrap.servers": bootstrap,
            "security.protocol": "SASL_SSL",
            "sasl.mechanisms": "PLAIN",
            "sasl.username": os.environ["KAFKA_API_KEY"],
            "sasl.password": os.environ["KAFKA_API_SECRET"],
        }
        producer = Producer(conf)
        delivered = 0

        def acked(err, msg):
            nonlocal delivered
            if err:
                self.log.error("Delivery failed: %s", err)
            else:
                delivered += 1

        for msg in messages:
            key = str(msg.get(self.key_field, "")) if self.key_field else None
            producer.produce(
                self.topic,
                key=key,
                value=json.dumps(msg),
                on_delivery=acked,
            )

        producer.flush()
        self.log.info("Delivered %d/%d messages to Kafka", delivered, len(messages))
        return delivered

    def _publish_local(self, messages: list[dict]) -> int:
        """Phase 1 fallback: append to a local JSONL file."""
        out_dir = Path("/opt/airflow/data")
        out_dir.mkdir(exist_ok=True)
        out_file = out_dir / f"{self.topic}.jsonl"

        with out_file.open("a") as f:
            for msg in messages:
                f.write(json.dumps(msg) + "\n")

        self.log.info(
            "Kafka not configured — wrote %d messages to %s", len(messages), out_file
        )
        return len(messages)
