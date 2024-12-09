from pydantic import BaseModel
from fastapi import APIRouter, Request, Response, Body, Depends
from fastapi_users.authentication.strategy.db import DatabaseStrategy
from fastapi_users import exceptions
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    auth_backend, fastapi_users, cookie_transport,
    UserManager, get_user_manager, get_db_strategy,
    get_current_user
)
from app.db import create_session
from app.util import get_random_pixel_avatar
from app.repositories import AvatarService
from app.models import UserModel
from app.schemas import UserRead, UserCreate, AvatarCreate

class ResetPasswordBody(BaseModel):
    password: str

router = APIRouter(prefix="/auth")
router.include_router(
    fastapi_users.get_auth_router(auth_backend)
)

@router.post(
    "/register",
    response_model=UserRead,
    status_code=201,
    name="register:register",
)
async def register(
    request: Request,
    response: Response,
    user_create: UserCreate,  # type: ignore
    user_manager: UserManager = Depends(get_user_manager),
    strategy: DatabaseStrategy = Depends(get_db_strategy),
    session: AsyncSession = Depends(create_session)
):
    created_user = await user_manager.create(
        user_create, safe=True, request=request
    )
    token = await strategy.write_token(created_user)
    cookie_transport._set_login_cookie(response, token)

    avatar_bytes = await get_random_pixel_avatar()

    avatar_service = AvatarService(session=session)
    await avatar_service.create(AvatarCreate(
        user_id=created_user.id,
        data=avatar_bytes,
        mimetype="image/jpeg"
    ))

    await session.commit()

    return created_user

@router.post(
    "/reset-password",
    name="reset:reset_password",
    status_code=204,
)
async def reset_password(
    *,
    request: Request,
    user: UserModel = Depends(get_current_user),
    user_manager: UserManager = Depends(get_user_manager),
    reset_password_body: ResetPasswordBody,
):
    if not user.is_active:
        raise exceptions.UserInactive()

    await user_manager._update(user, {"password": reset_password_body.password})
    await user_manager.on_after_reset_password(user, request)
    
# router.include_router(
#     fastapi_users.get_reset_password_router(),
#     tags=["auth"],
# )