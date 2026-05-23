"""
Shared Kafka producer logic used by all pipeline producers.

Phase 1 (no KAFKA_BOOTSTRAP_SERVERS set): appends to data/<topic>.jsonl.
Phase 2 (Confluent Cloud creds in env):   publishes to real Kafka topic.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from pydantic import BaseModel


def produce(topic: str, messages: list[BaseModel], key_field: str = "") -> int:
    bootstrap = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "")
    if bootstrap:
        return _produce_kafka(topic, messages, key_field, bootstrap)
    return _produce_local(topic, messages)


def _produce_kafka(
    topic: str, messages: list[BaseModel], key_field: str, bootstrap: str
) -> int:
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
            print(f"[kafka] delivery error: {err}")
        else:
            delivered += 1

    for msg in messages:
        data = msg.model_dump()
        key = str(data.get(key_field, "")) if key_field else None
        producer.produce(
            topic,
            key=key,
            value=json.dumps(data),
            on_delivery=acked,
        )

    producer.flush()
    print(f"[kafka] delivered {delivered}/{len(messages)} → {topic}")
    return delivered


def _produce_local(topic: str, messages: list[BaseModel]) -> int:
    out_dir = Path(__file__).parents[2] / "airflow" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{topic}.jsonl"

    with out_file.open("a") as f:
        for msg in messages:
            f.write(msg.model_dump_json() + "\n")

    print(f"[local] wrote {len(messages)} messages → {out_file}")
    return len(messages)
