import typing

import sqlalchemy as sa
from advanced_alchemy.base import UUIDAuditBase
from sqlalchemy import orm, func
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime

class MapModel(UUIDAuditBase):
    __tablename__ = "maps"

    name: orm.Mapped[str] = orm.mapped_column(sa.String, nullable=False)
    private: orm.Mapped[bool] = orm.mapped_column(sa.Boolean, nullable=False)
    data: orm.Mapped[dict] = orm.mapped_column(sa.JSON, nullable=False)
    last_played_at: orm.Mapped[datetime] = orm.mapped_column(sa.DateTime, nullable=True)

    user_id: orm.Mapped[int] = orm.mapped_column(sa.ForeignKey("users.id", ondelete="cascade"), nullable=False)
    
    user: orm.Mapped["UserModel"] = orm.relationship("UserModel", back_populates="maps", lazy="noload")
    thumbnail: orm.Mapped["ThumbnailModel"] = orm.relationship("ThumbnailModel", uselist=False, backref="maps", lazy="noload")