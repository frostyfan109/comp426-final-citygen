from typing import Optional
from fastapi import Depends, Request, Response
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi_users import FastAPIUsers, BaseUserManager, IntegerIDMixin
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from fastapi_users_db_sqlalchemy.access_token import SQLAlchemyAccessTokenDatabase
from fastapi_users.authentication import AuthenticationBackend, CookieTransport
from fastapi_users.authentication.strategy.db import DatabaseStrategy

from app.db import AsyncSessionFactory
from app.repositories import UserService
from app.models import UserModel, AccessTokenModel
from app.schemas import UserCreate, UserRead
from app.exceptions.user import (
    EmailDoesNotExistException, InvalidCredentialsException,
    UsernameAlreadyExistsException, EmailAlreadyExistsException, PasswordTooShortException
)
from app.settings import settings, DevPhase
from app.mail import send_reset_password_email

class AuthenticationBackendWithResponses(AuthenticationBackend):
    async def login(self, strategy, user) -> Response:
        token = await strategy.write_token(user)
        return await self.transport.get_login_response(user, token)

class CookieTransportWithResponses(CookieTransport):
    async def get_login_response(self, user, token):
        response = JSONResponse(jsonable_encoder(UserRead.model_validate(user)))
        return self._set_login_cookie(response, token)
    
    @staticmethod
    def get_openapi_login_responses_success():
        return {
            200: { "model": UserRead }
        }

class UserManager(IntegerIDMixin, BaseUserManager[UserModel, int]):
    reset_password_token_secret = settings.secret_key
    verification_token_secret = settings.secret_key

    async def create(self, user_create: UserCreate, safe: bool=False, request: Optional[Request]=None):
        user_service = UserService(session=self.user_db.session)

        if len(user_create.password) < 4:
            raise PasswordTooShortException

        existing_username = await user_service.get_one_or_none(username=user_create.username)
        if existing_username is not None:
            raise UsernameAlreadyExistsException
        
        existing_email = await user_service.get_one_or_none(email=user_create.email)
        if existing_email is not None:
            raise EmailAlreadyExistsException
        
        return await super().create(user_create, safe, request)
    
    async def authenticate(self, credentials):
        user_service = UserService(session=self.user_db.session)
        
        user = await user_service.get_one_or_none(email=credentials.username)
        if user is None:
            # Run the hasher to mitigate timing attack
            self.password_helper.hash(credentials.password)
            raise EmailDoesNotExistException
        
        verified, updated_password_hash = self.password_helper.verify_and_update(
            credentials.password, user.hashed_password
        )
        if not verified:
            raise InvalidCredentialsException
        
        # Update password hash to a more robust one if needed
        if updated_password_hash is not None:
            await self.user_db.update(user, {"hashed_password": updated_password_hash})

        return user
    
    async def on_after_forgot_password(self, user, token, request = None):
        await send_reset_password_email(user, token, request)

async def get_user_db():
    async with AsyncSessionFactory() as session:
        yield SQLAlchemyUserDatabase(session, UserModel)

async def get_access_token_db(
):  
    async with AsyncSessionFactory() as session:
        yield SQLAlchemyAccessTokenDatabase(session, AccessTokenModel)

async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)

def get_db_strategy(access_token_db: SQLAlchemyAccessTokenDatabase = Depends(get_access_token_db)) -> DatabaseStrategy:
    return DatabaseStrategy(access_token_db, lifetime_seconds=settings.access_token_lifetime_seconds)

cookie_transport = CookieTransportWithResponses(cookie_secure=settings.dev_phase == DevPhase.PROD)
auth_backend = AuthenticationBackendWithResponses(name="cookie", transport=cookie_transport, get_strategy=get_db_strategy)
fastapi_users = FastAPIUsers[UserModel, int](get_user_manager, [auth_backend])
get_current_user = fastapi_users.current_user(active=True)
get_current_user_or_none = fastapi_users.current_user(active=True, optional=True)