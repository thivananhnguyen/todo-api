import os
from typing import Dict

import psycopg2
from fastapi import FastAPI, HTTPException

app = FastAPI()

# Keep status values aligned with the Node.js API validation rules.
KNOWN_STATUSES = ["todo", "in-progress", "done"]
TABLE_NAME = "tasks"
STATUS_COLUMN = "status"


def get_connection():
    return psycopg2.connect(
        host=os.environ["DB_HOST"],
        port=os.environ.get("DB_PORT", "5432"),
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        connect_timeout=3,
    )


@app.get("/health")
def health() -> Dict[str, str]:
    # Health endpoint stays independent from DB checks for clearer diagnostics.
    return {"status": "ok"}


@app.get("/stats")
def get_stats() -> Dict[str, int]:
    counts: Dict[str, int] = {status: 0 for status in KNOWN_STATUSES}

    try:
        conn = get_connection()
    except psycopg2.OperationalError as error:
        raise HTTPException(
            status_code=503,
            detail="stats-api cannot connect to PostgreSQL",
        ) from error

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                f"SELECT {STATUS_COLUMN}, COUNT(*) FROM {TABLE_NAME} GROUP BY {STATUS_COLUMN}"
            )
            for status, count in cursor.fetchall():
                counts[str(status)] = int(count)
    except psycopg2.Error as error:
        raise HTTPException(
            status_code=500,
            detail="stats-api failed to aggregate task statistics",
        ) from error
    finally:
        conn.close()

    return counts
