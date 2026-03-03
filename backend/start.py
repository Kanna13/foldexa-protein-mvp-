#!/usr/bin/env python3
"""
Smart database migration startup script.

- If the DB is FRESH (no jobs table): runs `alembic upgrade head` normally.
- If the DB schema ALREADY EXISTS but Alembic has no version recorded:
  stamps head to mark DB as current, skips re-running old migrations.
- If Alembic version IS recorded: runs `alembic upgrade head` for any new incremental migrations.
"""
import os
import subprocess
import sys

import sqlalchemy as sa


def get_sync_db_url() -> str:
    url = os.environ.get("DATABASE_URL", "")
    # asyncpg driver can't be used for sync inspection; swap to psycopg2/pg8000 style
    return (
        url.replace("postgresql+asyncpg://", "postgresql://")
           .replace("postgres://", "postgresql://")
    )


def main():
    db_url = get_sync_db_url()
    if not db_url:
        print("[start] ERROR: DATABASE_URL not set. Cannot start.")
        sys.exit(1)

    try:
        engine = sa.create_engine(db_url)
        with engine.connect() as conn:
            # Check if alembic_version table exists and has a revision stamped
            version_table_exists = conn.execute(sa.text(
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'alembic_version'"
            )).scalar()

            stamped = False
            if version_table_exists:
                stamped_revision = conn.execute(
                    sa.text("SELECT version_num FROM alembic_version LIMIT 1")
                ).scalar()
                stamped = bool(stamped_revision)

            # Check if our core schema (jobs table) already exists
            jobs_exists = conn.execute(sa.text(
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'jobs'"
            )).scalar()

        engine.dispose()

    except Exception as e:
        print(f"[start] WARNING: Could not inspect DB schema: {e}. Proceeding with alembic upgrade head.")
        stamped = True  # Default: try upgrade head
        jobs_exists = False

    if jobs_exists and not stamped:
        # Schema exists but Alembic doesn't know about it — stamp head to align version history.
        print("[start] Schema exists but Alembic version not recorded. Stamping head...")
        result = subprocess.run(["alembic", "stamp", "head"], check=True)
        print("[start] Alembic stamped to head. Future migrations will apply incrementally.")
    else:
        # Fresh DB or already stamped — run upgrade head normally.
        print("[start] Running alembic upgrade head...")
        result = subprocess.run(["alembic", "upgrade", "head"], check=True)
        print("[start] Alembic migrations applied.")

    # Start the application
    print("[start] Starting application...")
    os.execvp("python", ["python", "-m", "app.main"])


if __name__ == "__main__":
    main()
