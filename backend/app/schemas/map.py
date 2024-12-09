from typing import Optional
from uuid import UUID
from datetime import datetime

from .base import Base
from .user import UserReadPublic

class MapFavoritedBody(Base):
    favorited: bool

class MapCreateBody(Base):
    name: str
    private: bool
    thumbnail_base64: str
    data: dict

class MapCreate(MapCreateBody):
    user_id: int

class MapRead(Base):
    id: UUID
    name: str
    private: bool
    favorited: bool
    last_played_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    user: Optional[UserReadPublic] = None

class MapReadWithData(MapRead):
    data: dict