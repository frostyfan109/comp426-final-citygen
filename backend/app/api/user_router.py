from typing import Any
from fastapi import APIRouter, Depends, Header, Response, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import create_session
from app.models import UserModel
from app.auth import get_current_user, get_current_user_or_none
from app.repositories import UserService, AvatarService
from app.schemas import UserRead, UserReadPublic, AvatarRead, AvatarCreate
from app.exceptions import UnauthorizedException, BadRequestException
from app.util import get_random_pixel_avatar

router = APIRouter(prefix="/users")

@router.get("/self", response_model=UserRead)
async def get_my_user(
    *,
    user: UserModel = Depends(get_current_user)
):
    return UserRead.model_validate(user)

@router.get("/{username}", response_model=UserReadPublic)
async def get_user(
    *,
    session: AsyncSession = Depends(create_session),
    username: str
):
    user_service = UserService(session=session)
    return await user_service.get_user_by_username(username)

@router.get("/{username}/avatar", responses={
    200: {
        "content": {
            "application/json": {"schema": {"$ref": "#/components/schemas/AvatarRead"}},
            "image/jpeg": {},
        }
    }
}, description="NOTE: The Accept header is overwritten by Swagger UI and will always send application/json")
async def get_user_avatar(
    *,
    session: AsyncSession = Depends(create_session),
    accept: str = Header("image/jpeg"),
    username: str
):
    user_service = UserService(session=session)
    user = await user_service.get_user_by_username(username=username, load=UserModel.avatar)    
    if accept == "application/json": return AvatarRead.model_validate(user.avatar)
    return Response(
        content=user.avatar.data,
        media_type="image/jpeg"
    )

@router.put("/{username}/avatar", status_code=201)
async def upload_user_avatar(
    *,
    session: AsyncSession = Depends(create_session),
    authenticated_user: UserModel = Depends(get_current_user),
    username: str,
    file: UploadFile
):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise BadRequestException("Only jpeg and png formats are supported")
    
    if authenticated_user.username != username and not authenticated_user.is_superuser:
        raise UnauthorizedException("You do not have permission to change this user's avatar")
    
    user_service = UserService(session=session)
    user = await user_service.get_user_by_username(username=username, load=UserModel.avatar)
    
    image_bytes = await file.read()
    avatar_service = AvatarService(session=session)
    await avatar_service.update(
        item_id=user.avatar.id,
        data=AvatarCreate(
            user_id=user.id,
            data=image_bytes,
            mimetype=file.content_type
        )
    )
    await session.commit()

@router.put("/{username}/avatar/random", status_code=201)
async def randomize_user_avatar(
    *,
    session: AsyncSession = Depends(create_session),
    authenticated_user: UserModel = Depends(get_current_user),
    username: str
):
    if authenticated_user.username != username and not authenticated_user.is_superuser:
        raise UnauthorizedException("You do not have permission to change this user's avatar")
    
    user_service = UserService(session=session)
    user = await user_service.get_user_by_username(username=username, load=UserModel.avatar)
    
    image_bytes = await get_random_pixel_avatar()
    avatar_service = AvatarService(session=session)
    await avatar_service.update(
        item_id=user.avatar.id,
        data=AvatarCreate(
            user_id=user.id,
            data=image_bytes,
            mimetype="image/jpeg"
        )
    )
    await session.commit()