from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from advanced_alchemy.service import SQLAlchemyAsyncRepositoryService

from app.models import UserModel

class UserRepository(SQLAlchemyAsyncRepository[UserModel]):
    model_type = UserModel


class UserService(SQLAlchemyAsyncRepositoryService[UserModel]):
    repository_type = UserRepository