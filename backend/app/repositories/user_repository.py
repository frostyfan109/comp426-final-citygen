from typing import Any
from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from advanced_alchemy.service import SQLAlchemyAsyncRepositoryService

from app.models import UserModel
from app.exceptions.user import UserDoesNotExistException, UnauthorizedException, BadRequestException

class UserRepository(SQLAlchemyAsyncRepository[UserModel]):
    model_type = UserModel


class UserService(SQLAlchemyAsyncRepositoryService[UserModel]):
    repository_type = UserRepository

    def __init__(self, **repo_kwargs: Any) -> None:
        self.repository: UserRepository = self.repository_type(**repo_kwargs)
        self.model_type = self.repository.model_type

    async def get_user_by_username(self, username: str, **get_kwargs) -> UserModel:
        user = await self.repository.get_one_or_none(username=username, **get_kwargs)
        if user is None:
            raise UserDoesNotExistException
        return user