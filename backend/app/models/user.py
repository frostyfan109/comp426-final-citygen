import typing

import sqlalchemy as sa
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTable
from advanced_alchemy.base import BigIntAuditBase
from sqlalchemy import orm, func
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime

class UserModel(SQLAlchemyBaseUserTable[int], BigIntAuditBase):
    __tablename__ = "users"

    username: orm.Mapped[str] = orm.mapped_column(sa.String, unique=True, nullable=False)
    first_name: orm.Mapped[str] = orm.mapped_column(sa.String, nullable=False)
    last_name: orm.Mapped[str] = orm.mapped_column(sa.String, nullable=False)

    maps: orm.Mapped[list["MapModel"]] = orm.relationship("MapModel", back_populates="user", lazy="noload")
    avatar: orm.Mapped["AvatarModel"] = orm.relationship("AvatarModel", uselist=False, backref="users", lazy="noload")
    
    @hybrid_property
    def full_name(self):
        return f"{ self.first_name } { self.last_name }"