from fastapi import APIRouter
from . import map_router, user_router, auth_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(map_router.router, tags=["maps"])
api_router.include_router(user_router.router, tags=["users"])
api_router.include_router(auth_router.router, tags=["auth"])