"""
dbt_run — runs dbt models daily after ingestion lands, then runs dbt tests.
Triggers after the daily ACLED + GDELT ingestion window (4 AM UTC).

Pipeline:
  dbt_deps → dbt_seed → dbt_run_staging → dbt_run_intermediate → dbt_run_marts → dbt_test
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from airflow.decorators import dag, task
from airflow.operators.bash import BashOperator

DBT_DIR = str(Path(__file__).parents[3] / "dbt")
DBT_PROFILES_DIR = DBT_DIR
DBT_TARGET = os.getenv("DBT_TARGET", "dev")

DBT_ENV = {
    "DBT_HOST":     "{{ var.value.dbt_host }}",
    "DBT_USER":     "{{ var.value.dbt_user }}",
    "DBT_PASSWORD": "{{ var.value.dbt_password }}",
    "DBT_DBNAME":   "{{ var.value.dbt_dbname }}",
}

DBT_CMD = (
    f"cd {DBT_DIR} && "
    f"DBT_PROFILES_DIR={DBT_PROFILES_DIR} "
    "dbt {command} --target " + DBT_TARGET
)

default_args = {
    "owner": "conflict-tracker",
    "retries": 1,
    "retry_delay": timedelta(minutes=10),
    "email_on_failure": False,
}


@dag(
    dag_id="dbt_run",
    description="Run dbt models and tests after nightly ingestion",
    schedule="0 4 * * *",
    start_date=datetime(2024, 1, 1, tzinfo=timezone.utc),
    catchup=False,
    default_args=default_args,
    tags=["dbt", "transformation"],
)
def dbt_run():

    deps = BashOperator(
        task_id="dbt_deps",
        bash_command=DBT_CMD.format(command="deps"),
        env=DBT_ENV,
    )

    seed = BashOperator(
        task_id="dbt_seed",
        bash_command=DBT_CMD.format(command="seed"),
        env=DBT_ENV,
    )

    run_staging = BashOperator(
        task_id="dbt_run_staging",
        bash_command=DBT_CMD.format(command="run --select staging"),
        env=DBT_ENV,
    )

    run_intermediate = BashOperator(
        task_id="dbt_run_intermediate",
        bash_command=DBT_CMD.format(command="run --select intermediate"),
        env=DBT_ENV,
    )

    run_marts = BashOperator(
        task_id="dbt_run_marts",
        bash_command=DBT_CMD.format(command="run --select marts"),
        env=DBT_ENV,
    )

    test = BashOperator(
        task_id="dbt_test",
        bash_command=DBT_CMD.format(command="test"),
        env=DBT_ENV,
    )

    deps >> seed >> run_staging >> run_intermediate >> run_marts >> test


dbt_run()
