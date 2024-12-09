from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from advanced_alchemy.service import SQLAlchemyAsyncRepositoryService

from app.models import ThumbnailModel

class ThumbnailRepository(SQLAlchemyAsyncRepository[ThumbnailModel]):
    model_type = ThumbnailModel


class ThumbnailService(SQLAlchemyAsyncRepositoryService[ThumbnailModel]):
    repository_type = ThumbnailRepository