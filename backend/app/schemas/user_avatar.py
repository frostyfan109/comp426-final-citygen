from uuid import UUID

from .base import Base

class AvatarCreate(Base):
    user_id: int
    data: bytes
    mimetype: str
    
class AvatarRead(Base):
    id: UUID
    user_id: int
    data: str # base64-encoded
    mimetype: str