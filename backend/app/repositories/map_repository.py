from typing import Any
from uuid import UUID
from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from advanced_alchemy.service import SQLAlchemyAsyncRepositoryService

from app.models import MapModel, UserModel
from app.exceptions.map import MapDoesNotExistException, MapNotPublicException

class MapRepository(SQLAlchemyAsyncRepository[MapModel]):
    model_type = MapModel


class MapService(SQLAlchemyAsyncRepositoryService[MapModel]):
    repository_type = MapRepository

    def __init__(self, **repo_kwargs: Any) -> None:
        self.repository: MapRepository = self.repository_type(**repo_kwargs)
        self.model_type = self.repository.model_type

    async def get_map(
        self,
        map_id: UUID,
        user: UserModel | None,
        **get_kwargs
    ) -> MapModel:
        map = await self.repository.get_one_or_none(id=map_id, **get_kwargs)

        if map is None:
            raise MapDoesNotExistException
        if map.private:
            if user is None or user.id != map.user_id:
                raise MapNotPublicException
            
        return map