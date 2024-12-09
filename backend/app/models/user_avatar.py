import sqlalchemy as sa
from advanced_alchemy.base import UUIDAuditBase
from sqlalchemy import orm, func

class AvatarModel(UUIDAuditBase):
    __tablename__ = "user_avatars"

    data: orm.Mapped[bytes] = orm.mapped_column(sa.LargeBinary, nullable=False)
    mimetype: orm.Mapped[str] = orm.mapped_column(sa.String, nullable=False)

    user_id: orm.Mapped[int] = orm.mapped_column(sa.ForeignKey("users.id", ondelete="cascade"), nullable=False)