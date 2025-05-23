"""Add PasswordResetRequest table

Revision ID: 34da18a9da64
Revises: d7b09e8316b4
Create Date: 2025-05-08 09:39:32.430622

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "34da18a9da64"
down_revision = "d7b09e8316b4"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "password_reset_request",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token", sa.String(length=128), nullable=False),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("handled_by_admin_id", sa.Integer(), nullable=True),
        sa.Column("handled_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["handled_by_admin_id"],
            ["user.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["user.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("password_reset_request", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_password_reset_request_status"), ["status"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_password_reset_request_token"), ["token"], unique=True
        )
        batch_op.create_index(
            batch_op.f("ix_password_reset_request_user_id"), ["user_id"], unique=False
        )

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("password_reset_request", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_password_reset_request_user_id"))
        batch_op.drop_index(batch_op.f("ix_password_reset_request_token"))
        batch_op.drop_index(batch_op.f("ix_password_reset_request_status"))

    op.drop_table("password_reset_request")
    # ### end Alembic commands ###
