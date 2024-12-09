import typing

import sqlalchemy as sa
from advanced_alchemy.base import DefaultBase
from fastapi_users_db_sqlalchemy.access_token import SQLAlchemyBaseAccessTokenTable
from sqlalchemy import orm, func
from sqlalchemy.ext.declarative import declared_attr
from datetime import datetime

class AccessTokenModel(SQLAlchemyBaseAccessTokenTable[int], DefaultBase):
    __tablename__ = "access_token"

    @declared_attr
    def user_id(cls):
        return sa.Column(sa.Integer, sa.ForeignKey("users.id", ondelete="cascade"), nullable=False)