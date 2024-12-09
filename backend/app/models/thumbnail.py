import sqlalchemy as sa
from advanced_alchemy.base import UUIDAuditBase
from sqlalchemy import orm, func
from sqlalchemy.ext.hybrid import hybrid_property
from uuid import UUID
from datetime import datetime

class ThumbnailModel(UUIDAuditBase):
    __tablename__ = "thumbnails"

    data: orm.Mapped[bytes] = orm.mapped_column(sa.LargeBinary, nullable=False)
    mimetype: orm.Mapped[str] = orm.mapped_column(sa.String, nullable=False)

    map_id: orm.Mapped[UUID] = orm.mapped_column(sa.ForeignKey("maps.id", ondelete="cascade"), nullable=False)