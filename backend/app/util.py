import httpx
import random
import string
import logging
from typing import Annotated

logger = logging.getLogger(__name__)

async def get_random_pixel_avatar(timeout=10.0) -> Annotated[bytes, "JPEG"]:
    avatar_seed = "".join(random.choices(string.ascii_letters + string.digits, k=16))
    background_color = random.choice(["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"])
    
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            res = await client.get(f"https://api.dicebear.com/9.x/pixel-art/jpeg", params={
                "seed": avatar_seed,
                "backgroundColor": background_color
            })
            res.raise_for_status()
            avatar_bytes = res.content
        except httpx.HTTPError as e:
            logger.warning(
                f"Failed to retrieve avatar from DiceBear with error { str(e) }, falling back to default..."
                )
            with open("static/images/default-avatar.jpg", "wb") as f:
                avatar_bytes = f.read()

    return avatar_bytes