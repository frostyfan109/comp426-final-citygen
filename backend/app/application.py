from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.settings import settings, DevPhase
from app.exceptions import CustomException

application = FastAPI(
    title=settings.project_name,
    debug=settings.dev_phase == DevPhase.DEV,
)

application.include_router(api_router)

application.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@application.exception_handler(CustomException)
async def custom_exception_handler(request: Request, exc: CustomException):
    content = { "detail": exc.error_code, "message": exc.message }
    if settings.dev_phase == DevPhase.DEV:
        content["stack"] = exc.stack
    return JSONResponse(
        status_code=exc.code,
        content=content,
    )