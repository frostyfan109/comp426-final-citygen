from uuid import UUID

from .base import Base

class ThumbnailCreate(Base):
    map_id: UUID
    data: bytes
    mimetype: str
    
class ThumbnailRead(Base):
    id: UUID
    map_id: UUID
    data: str # base64-encoded
    mimetype: str