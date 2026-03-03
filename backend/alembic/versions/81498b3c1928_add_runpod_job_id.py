"""Add runpod_job_id to jobs table

Revision ID: 81498b3c1928
Revises: 79384a2c0919
Create Date: 2026-03-03 17:21:15.123456

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '81498b3c1928'
down_revision = '79384a2c0919'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use IF NOT EXISTS so this is safe to run on an already-provisioned DB.
    op.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS runpod_job_id VARCHAR")
    op.execute("CREATE INDEX IF NOT EXISTS ix_jobs_runpod_job_id ON jobs (runpod_job_id)")


def downgrade() -> None:
    op.drop_index(op.f('ix_jobs_runpod_job_id'), table_name='jobs')
    op.drop_column('jobs', 'runpod_job_id')
