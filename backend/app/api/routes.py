import json
from datetime import datetime
from functools import lru_cache

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse

from app.models.countdown import Countdown, CountdownMode
from app.models.sport import Sport
from app.services.countdown_service import get_countdown_service, CountdownService
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


@router.post("/countdowns")
async def create_countdown(
    request: Request,
    countdown_service: CountdownService = Depends(get_countdown_service),
    sports_service: SportsService = Depends(get_sports_service),
) -> JSONResponse:
    body = await request.json()
    sport_id = body.get("sport_id", "football")
    mode_str = body.get("mode", "countdown")
    team1_name = body.get("team1_name", "Team 1")
    team2_name = body.get("team2_name", "Team 2")
    admin_password = body.get("admin_password", "")

    sport = sports_service.get_sport_by_id(sport_id)
    if not sport:
        return JSONResponse(
            {"error": "Invalid sport_id"}, status_code=400
        )

    mode = CountdownMode.COUNTDOWN if mode_str == "countdown" else CountdownMode.COUNTUP
    countdown = await countdown_service.create_countdown(
        sport_id=sport_id,
        mode=mode,
        default_duration=sport.defaultDuration,
        team1_name=team1_name,
        team2_name=team2_name,
        admin_password=admin_password,
    )

    return JSONResponse({
        "id": countdown.id,
        "sport_id": countdown.sport_id,
        "mode": countdown.mode,
        "state": countdown.state,
        "time_left": countdown.time_left,
        "elapsed_time": countdown.elapsed_time,
        "team1_name": countdown.team1_name,
        "team2_name": countdown.team2_name,
        "team1_score": countdown.team1_score,
        "team2_score": countdown.team2_score,
    })


@router.get("/countdowns/{countdown_id}")
async def get_countdown(
    countdown_id: str,
    countdown_service: CountdownService = Depends(get_countdown_service),
) -> JSONResponse:
    countdown = await countdown_service.get_countdown(countdown_id)
    if not countdown:
        return JSONResponse(
            {"error": "Countdown not found"}, status_code=404
        )

    return JSONResponse({
        "id": countdown.id,
        "sport_id": countdown.sport_id,
        "mode": countdown.mode,
        "state": countdown.state,
        "time_left": countdown.time_left,
        "elapsed_time": countdown.elapsed_time,
        "team1_name": countdown.team1_name,
        "team2_name": countdown.team2_name,
        "team1_score": countdown.team1_score,
        "team2_score": countdown.team2_score,
    })


@router.post("/countdowns/{countdown_id}/start")
async def start_countdown(
    countdown_id: str,
    countdown_service: CountdownService = Depends(get_countdown_service),
) -> JSONResponse:
    success = await countdown_service.start_countdown(countdown_id)
    if not success:
        return JSONResponse(
            {"error": "Failed to start countdown"}, status_code=400
        )
    return JSONResponse({"status": "started"})


@router.post("/countdowns/{countdown_id}/pause")
async def pause_countdown(
    countdown_id: str,
    countdown_service: CountdownService = Depends(get_countdown_service),
) -> JSONResponse:
    success = await countdown_service.pause_countdown(countdown_id)
    if not success:
        return JSONResponse(
            {"error": "Failed to pause countdown"}, status_code=400
        )
    return JSONResponse({"status": "paused"})


@router.post("/countdowns/{countdown_id}/reset")
async def reset_countdown(
    countdown_id: str,
    request: Request,
    countdown_service: CountdownService = Depends(get_countdown_service),
    sports_service: SportsService = Depends(get_sports_service),
) -> JSONResponse:
    countdown = await countdown_service.get_countdown(countdown_id)
    if not countdown:
        return JSONResponse(
            {"error": "Countdown not found"}, status_code=404
        )

    sport = sports_service.get_sport_by_id(countdown.sport_id)
    if not sport:
        return JSONResponse(
            {"error": "Sport not found"}, status_code=404
        )

    success = await countdown_service.reset_countdown(
        countdown_id, sport.defaultDuration
    )
    if not success:
        return JSONResponse(
            {"error": "Failed to reset countdown"}, status_code=400
        )
    return JSONResponse({"status": "reset"})


@router.post("/countdowns/{countdown_id}/score")
async def update_score(
    countdown_id: str,
    request: Request,
    countdown_service: CountdownService = Depends(get_countdown_service),
) -> JSONResponse:
    body = await request.json()
    team = body.get("team")
    score = body.get("score")
    if team not in ["team1", "team2"] or not isinstance(score, int):
        return JSONResponse(
            {"error": "Invalid request"}, status_code=400
        )

    success = await countdown_service.update_score(countdown_id, team, score)
    if not success:
        return JSONResponse(
            {"error": "Failed to update score"}, status_code=400
        )
    return JSONResponse({"status": "updated"})


@router.post("/countdowns/{countdown_id}/team-name")
async def update_team_name(
    countdown_id: str,
    request: Request,
    countdown_service: CountdownService = Depends(get_countdown_service),
) -> JSONResponse:
    body = await request.json()
    team = body.get("team")
    name = body.get("name")
    if team not in ["team1", "team2"] or not name:
        return JSONResponse(
            {"error": "Invalid request"}, status_code=400
        )

    success = await countdown_service.update_team_name(countdown_id, team, name)
    if not success:
        return JSONResponse(
            {"error": "Failed to update team name"}, status_code=400
        )
    return JSONResponse({"status": "updated"})


@router.post("/countdowns/{countdown_id}/verify-admin")
async def verify_admin(
    countdown_id: str,
    request: Request,
    countdown_service: CountdownService = Depends(get_countdown_service),
) -> JSONResponse:
    body = await request.json()
    password = body.get("password", "")
    
    is_admin = await countdown_service.verify_admin_password(countdown_id, password)
    if not is_admin:
        return JSONResponse(
            {"error": "Invalid password"}, status_code=401
        )
    
    return JSONResponse({"status": "verified", "is_admin": True})


@router.websocket("/ws/countdowns/{countdown_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    countdown_id: str,
    countdown_service: CountdownService = Depends(get_countdown_service),
):
    await websocket.accept()
    await countdown_service.register_websocket(countdown_id, websocket)

    try:
        while True:
            data = await websocket.receive_text()
            # Handle client messages if needed
            try:
                message = json.loads(data)
                if message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        await countdown_service.unregister_websocket(countdown_id, websocket)

