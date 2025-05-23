"""Add firebase_uid to User model and make password_hash nullable

Revision ID: fb4133b9be65
Revises: fd2111f2473a
Create Date: 2025-05-18 23:56:51.598907

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "fb4133b9be65"
down_revision = "fd2111f2473a"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("firebase_uid", sa.String(length=128), nullable=True)
        )
        batch_op.alter_column(
            "password_hash", existing_type=sa.VARCHAR(length=128), nullable=True
        )
        batch_op.create_index(
            batch_op.f("ix_user_firebase_uid"), ["firebase_uid"], unique=True
        )

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_user_firebase_uid"))
        batch_op.alter_column(
            "password_hash", existing_type=sa.VARCHAR(length=128), nullable=False
        )
        batch_op.drop_column("firebase_uid")

    # ### end Alembic commands ###
