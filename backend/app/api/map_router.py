import base64
from typing import Any, Union
from fastapi import APIRouter, Depends, Header, Response
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.auth import get_current_user, get_current_user_or_none
from app.db import create_session
from app.models import UserModel, MapModel
from app.repositories import MapRepository, MapService, MapFavoriteService, ThumbnailService
from app.schemas import MapFavoritedBody, MapCreateBody, MapCreate, MapRead, MapReadWithData, ThumbnailRead, ThumbnailCreate

router = APIRouter(prefix="/maps")

@router.get("/", response_model=list[MapRead])
async def get_public_maps(
    *,
    session: AsyncSession = Depends(create_session),
    user: UserModel = Depends(get_current_user_or_none),
    include_self: bool = False
):
    map_repository = MapRepository(session=session)
    map_favorite_service = MapFavoriteService(session=session)

    if user is not None and not include_self:
        maps = await map_repository.list(
            MapModel.private == False,
            MapModel.user_id != user.id,
            load=MapModel.user
        )
    else:
        maps = await map_repository.list(MapModel.private == False, load=MapModel.user)
    for map in maps:
        if user is not None: map.favorited = await map_favorite_service.is_map_favorited(map.id, user.id)
        else: map.favorited = False
    return maps

@router.get("/self", response_model=list[MapRead])
async def get_my_maps(
    *,
    session: AsyncSession = Depends(create_session),
    user: UserModel = Depends(get_current_user),
):
    map_repository = MapRepository(session=session)
    map_favorite_service = MapFavoriteService(session=session)

    maps = await map_repository.list(MapModel.user_id == user.id)
    for map in maps: map.favorited = await map_favorite_service.is_map_favorited(map.id, user.id)
    return maps

@router.get("/{map_id}", response_model=Union[MapReadWithData, MapRead])
async def get_map_endpoint(
    *,
    session: AsyncSession = Depends(create_session),
    user: UserModel = Depends(get_current_user_or_none),
    map_id: UUID,
    include_data: bool = False
):
    map_service = MapService(session=session)
    map_favorite_service = MapFavoriteService(session=session)

    map = await map_service.get_map(map_id, user, load=MapModel.user)
        
    if user is not None: map.favorited = await map_favorite_service.is_map_favorited(map_id, user.id)
    else: map.favorited = False
        
    if include_data:
        return MapReadWithData.model_validate(map)
    return MapRead.model_validate(map)

@router.get("/{map_id}/thumbnail", responses={
    200: {
        "content": {
            "application/json": {"schema": {"$ref": "#/components/schemas/ThumbnailRead"}},
            "image/jpeg": {},
        }
    }
}, description="NOTE: The Accept header is overwritten by Swagger UI and will always send application/json")
async def get_map_thumbnail(
    *,
    session: AsyncSession = Depends(create_session),
    user: UserModel = Depends(get_current_user_or_none),
    accept: str = Header("image/jpeg"),
    map_id: UUID
):
    map_service = MapService(session=session)

    map = await map_service.get_map(map_id, user, load=MapModel.thumbnail)
    
    if accept == "application/json": return ThumbnailRead.model_validate(map.thumbnail)
    return Response(
        content=map.thumbnail.data,
        media_type=map.thumbnail.mimetype
    )

@router.post("/{map_id}/favorite", status_code=204)
async def set_map_favorited(
    *,
    session: AsyncSession = Depends(create_session),
    user: UserModel = Depends(get_current_user),
    map_id: UUID,
    favorited_body: MapFavoritedBody
):
    map_service = MapService(session=session)
    map_favorite_service = MapFavoriteService(session=session)

    # Verify that the map exists and the authenticated user can access it.
    map = await map_service.get_map(map_id, user)
    await map_favorite_service.set_map_favorited(map_id, user.id, favorited_body.favorited)

@router.post("/", response_model=MapRead)
async def create_map(
    *,
    session: AsyncSession = Depends(create_session),
    user: UserModel = Depends(get_current_user),
    map_create: MapCreateBody
):
    map_service = MapService(session=session)
    thumbnail_service = ThumbnailService(session=session)
    
    map = await map_service.create(MapCreate(
        **map_create.model_dump(),
        user_id=user.id
    ))
    map.favorited = False

    thumbnail = await thumbnail_service.create(ThumbnailCreate(
        map_id=map.id,
        data=base64.b64decode(map_create.thumbnail_base64),
        mimetype="image/jpeg"
    ))

    await session.commit()
    
    return map