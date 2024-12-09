import asyncio

from app.db import *
from app.models import *
from app.repositories import *

async def main():
    async with AsyncSessionFactory() as session:
        map_repository = MapRepository(session=session)
        map = await map_repository.get_one_or_none(id="e8d7c1f3-98e9-4ca3-85ed-b9f0a8a529d9", load=MapModel.thumbnail)
        print("13fj30192jf13920fjfj1209fj239",map.thumbnail)
asyncio.run(main())