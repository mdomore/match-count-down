from datetime import datetime
from functools import lru_cache

from fastapi import APIRouter, Depends

from app.models.sport import Sport
from app.services.sports_service import SportsService

router = APIRouter()


@lru_cache
def get_sports_service() -> SportsService:
    return SportsService()


@router.get("/", response_model=str)
async def get_root() -> str:
    return "Match Count Down API is running!"


@router.get("/health")
async def get_health() -> dict[str, str]:
    timestamp = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    return {"status": "ok", "timestamp": timestamp}


@router.get("/sports", response_model=list[Sport])
async def get_all_sports(
    sports_service: SportsService = Depends(get_sports_service),
) -> list[Sport]:
    return sports_service.get_all_sports()

