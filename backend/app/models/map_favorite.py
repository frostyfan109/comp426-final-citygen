import sqlalchemy as sa
from advanced_alchemy.base import BigIntAuditBase
from sqlalchemy import orm
from uuid import UUID

class MapFavoriteModel(BigIntAuditBase):
    __tablename__ = "map_favorites"

    user_id: orm.Mapped[int] = orm.mapped_column(sa.ForeignKey("users.id", ondelete="cascade"), nullable=False)
    map_id: orm.Mapped[UUID] = orm.mapped_column(sa.ForeignKey("maps.id", ondelete="cascade"), nullable=False)