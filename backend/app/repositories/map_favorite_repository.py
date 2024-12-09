from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from advanced_alchemy.service import SQLAlchemyAsyncRepositoryService

from app.models import MapFavoriteModel

class MapFavoriteRepository(SQLAlchemyAsyncRepository[MapFavoriteModel]):
    model_type = MapFavoriteModel


class MapFavoriteService(SQLAlchemyAsyncRepositoryService[MapFavoriteModel]):
    repository_type = MapFavoriteRepository