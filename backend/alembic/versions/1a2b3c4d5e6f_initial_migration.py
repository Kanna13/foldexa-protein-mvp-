"""Initial migration

Revision ID: 1a2b3c4d5e6f
Revises: 
Create Date: 2024-01-24 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the jobstatus enum only if it doesn't already exist.
    # Uses pg_type catalog — works on ALL PostgreSQL versions.
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jobstatus') THEN
                CREATE TYPE jobstatus AS ENUM (
                    'CREATED',
                    'UPLOADED',
                    'QUEUED',
                    'PROVISIONING',
                    'RUNNING',
                    'POST_PROCESSING',
                    'COMPLETED',
                    'FAILED',
                    'CANCELLED'
                );
            END IF;
        END$$;
    """)

    connection = op.get_bind()
    inspector = sa.inspect(connection)
    existing_tables = inspector.get_table_names()

    if 'jobs' not in existing_tables:
        op.create_table('jobs',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('user_id', sa.String(), nullable=True),
            sa.Column('status', sa.Enum(
                'CREATED', 'UPLOADED', 'QUEUED', 'PROVISIONING', 'RUNNING',
                'POST_PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED',
                name='jobstatus', create_type=False
            ), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('started_at', sa.DateTime(), nullable=True),
            sa.Column('finished_at', sa.DateTime(), nullable=True),
            sa.Column('pipeline_type', sa.String(), nullable=False),
            sa.Column('config', sa.JSON(), nullable=True),
            sa.Column('input_s3_key', sa.String(), nullable=True),
            sa.Column('error_message', sa.Text(), nullable=True),
            sa.Column('retry_count', sa.Integer(), nullable=True),
            sa.Column('celery_task_id', sa.String(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_jobs_celery_task_id'), 'jobs', ['celery_task_id'], unique=False)
        op.create_index(op.f('ix_jobs_status'), 'jobs', ['status'], unique=False)

    if 'artifacts' not in existing_tables:
        op.create_table('artifacts',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('job_id', sa.String(), nullable=False),
            sa.Column('artifact_type', sa.String(), nullable=False),
            sa.Column('s3_key', sa.String(), nullable=False),
            sa.Column('size_bytes', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_artifacts_job_id'), 'artifacts', ['job_id'], unique=False)

    if 'metrics' not in existing_tables:
        op.create_table('metrics',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('job_id', sa.String(), nullable=False),
            sa.Column('metric_name', sa.String(), nullable=False),
            sa.Column('metric_value', sa.Float(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_metrics_job_id'), 'metrics', ['job_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_metrics_job_id'), table_name='metrics')
    op.drop_table('metrics')
    op.drop_index(op.f('ix_artifacts_job_id'), table_name='artifacts')
    op.drop_table('artifacts')
    op.drop_index(op.f('ix_jobs_status'), table_name='jobs')
    op.drop_index(op.f('ix_jobs_celery_task_id'), table_name='jobs')
    op.drop_table('jobs')
    sa.Enum(name='jobstatus').drop(op.get_bind())
