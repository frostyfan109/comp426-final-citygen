from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from advanced_alchemy.service import SQLAlchemyAsyncRepositoryService

from app.models import AvatarModel

class AvatarRepository(SQLAlchemyAsyncRepository[AvatarModel]):
    model_type = AvatarModel


class AvatarService(SQLAlchemyAsyncRepositoryService[AvatarModel]):
    repository_type = AvatarRepository