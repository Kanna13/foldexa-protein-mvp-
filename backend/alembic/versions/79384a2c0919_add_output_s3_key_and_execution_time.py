"""Add output_s3_key and execution_time to jobs table

Revision ID: 79384a2c0919
Revises: 1a2b3c4d5e6f
Create Date: 2026-03-03 16:42:15.123456

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '79384a2c0919'
down_revision = '1a2b3c4d5e6f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use IF NOT EXISTS so this is safe to run on an already-provisioned DB.
    op.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS output_s3_key VARCHAR")
    op.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS execution_time FLOAT")


def downgrade() -> None:
    op.drop_column('jobs', 'execution_time')
    op.drop_column('jobs', 'output_s3_key')
