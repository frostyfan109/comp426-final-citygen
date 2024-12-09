import logging
import typing

from sqlalchemy.pool import AsyncAdaptedQueuePool
from sqlalchemy.ext import asyncio as sa

from app.settings import settings, DevPhase


logger = logging.getLogger(__name__)

async def create_sa_engine():
    logger.info("Initializing SQLAlchemy engine")
    engine = sa.create_async_engine(
        url=settings.db_dsn,
        echo=settings.dev_phase == DevPhase.DEV,
        echo_pool=settings.dev_phase == DevPhase.DEV,
        pool_size=settings.db_pool_size,
        pool_pre_ping=settings.db_pool_pre_ping,
        poolclass=AsyncAdaptedQueuePool,
        max_overflow=settings.db_max_overflow,
    )
    logger.info("SQLAlchemy engine has been initialized")
    try:
        yield engine
    finally:
        await engine.dispose()
        logger.info("SQLAlchemy engine has been cleaned up")


class CustomAsyncSession(sa.AsyncSession):
    async def close(self) -> None:
        if isinstance(self.bind, sa.AsyncConnection):
            return self.expunge_all()

        return await super().close()

engine = sa.create_async_engine(
    url=settings.db_dsn,
    echo=settings.dev_phase == DevPhase.DEV,
    echo_pool=settings.dev_phase == DevPhase.DEV,
    pool_size=settings.db_pool_size,
    pool_pre_ping=settings.db_pool_pre_ping,
    poolclass=AsyncAdaptedQueuePool,
    max_overflow=settings.db_max_overflow,
)
AsyncSessionFactory = sa.async_sessionmaker(engine, expire_on_commit=False, autoflush=False)

async def create_session() -> sa.AsyncSession:
    async with AsyncSessionFactory() as session:
        logger.info("session created")
        yield session
        logger.info("session closed")