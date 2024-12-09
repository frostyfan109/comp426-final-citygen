from typing import Any
from uuid import UUID
from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from advanced_alchemy.service import SQLAlchemyAsyncRepositoryService

from app.models import MapFavoriteModel

class MapFavoriteRepository(SQLAlchemyAsyncRepository[MapFavoriteModel]):
    model_type = MapFavoriteModel


class MapFavoriteService(SQLAlchemyAsyncRepositoryService[MapFavoriteModel]):
    repository_type = MapFavoriteRepository

    def __init__(self, **repo_kwargs: Any) -> None:
        self.repository: MapFavoriteRepository = self.repository_type(**repo_kwargs)
        self.model_type = self.repository.model_type

    async def is_map_favorited(self, map_id: UUID, user_id: int) -> bool:
        map_favorited = await self.repository.get_one_or_none(
            map_id=map_id,
            user_id=user_id
        )
        return map_favorited is not None
    
    async def set_map_favorited(self, map_id: UUID, user_id: int, favorited: bool):
        # Don't bother if state already matches requested state
        if favorited == await self.is_map_favorited(map_id, user_id): return

        if favorited:
            await self.repository.add(MapFavoriteModel(user_id=user_id, map_id=map_id))
        else:
            await self.repository.delete_where(
                map_id=map_id,
                user_id=user_id
            )
        
        await self.repository.session.commit()