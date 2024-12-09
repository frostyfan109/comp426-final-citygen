from pydantic import EmailStr
from fastapi_users.schemas import CreateUpdateDictModel
from datetime import datetime

from .base import Base

class UserCreate(Base, CreateUpdateDictModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    password: str

class UserReadPublic(Base):
    username: str

class UserRead(UserReadPublic):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    is_active: bool
    is_verified: bool
    is_superuser: bool
    created_at: datetime
    