#!/usr/bin/env python3
"""
Smart database startup script.

Logic:
  - If 'jobs' table EXISTS but no Alembic version recorded:
      → alembic stamp head  (marks existing schema as current, no migrations run)
  - Otherwise (fresh DB or already stamped):
      → alembic upgrade head  (creates tables / applies new incremental migrations)

Uses asyncpg (already a project dependency) for the DB inspection.
"""
import os
import subprocess
import asyncio


async def _check_db() -> tuple[bool, bool]:
    """Returns (jobs_exists, stamped)."""
    import asyncpg

    db_url = os.environ.get("DATABASE_URL", "")
    # asyncpg accepts postgres:// and postgresql:// natively; strip +asyncpg driver
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

    try:
        conn = await asyncpg.connect(db_url)

        jobs_exists: bool = await conn.fetchval(
            "SELECT EXISTS("
            "  SELECT 1 FROM information_schema.tables"
            "  WHERE table_schema = 'public' AND table_name = 'jobs'"
            ")"
        )

        try:
            version = await conn.fetchval(
                "SELECT version_num FROM alembic_version LIMIT 1"
            )
            stamped = bool(version)
        except asyncpg.exceptions.UndefinedTableError:
            stamped = False

        await conn.close()
        return bool(jobs_exists), stamped

    except Exception as exc:
        print(f"[start] WARNING: DB check failed — {exc}")
        # Safe default: try stamp path (won't hurt if schema is current)
        return True, False


def main() -> None:
    jobs_exists, stamped = asyncio.run(_check_db())

    if jobs_exists and not stamped:
        print("[start] Existing schema detected without Alembic version — stamping head...")
        subprocess.run(["alembic", "stamp", "head"], check=True)
        print("[start] Stamped. No migrations will re-run.")
    else:
        print("[start] Running alembic upgrade head (fresh DB or incremental migrations)...")
        subprocess.run(["alembic", "upgrade", "head"], check=True)
        print("[start] Migrations applied.")

    print("[start] Starting application...")
    os.execvp("python", ["python", "-m", "app.main"])


if __name__ == "__main__":
    main()
