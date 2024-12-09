from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from advanced_alchemy.service import SQLAlchemyAsyncRepositoryService

from app.models import MapModel

class MapRepository(SQLAlchemyAsyncRepository[MapModel]):
    model_type = MapModel


class MapService(SQLAlchemyAsyncRepositoryService[MapModel]):
    repository_type = MapRepository