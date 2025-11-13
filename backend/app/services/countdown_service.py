import asyncio
import uuid
import bcrypt
from datetime import datetime
from typing import Dict, Set

from app.models.countdown import Countdown, CountdownMode, CountdownState


class CountdownService:
    def __init__(self):
        self._countdowns: Dict[str, Countdown] = {}
        self._tasks: Dict[str, asyncio.Task] = {}
        self._websockets: Dict[str, Set] = {}  # countdown_id -> set of websockets
        self._lock = asyncio.Lock()

    async def create_countdown(
        self,
        sport_id: str,
        mode: CountdownMode,
        default_duration: int,
        team1_name: str = "Team 1",
        team2_name: str = "Team 2",
        admin_password: str = "",
    ) -> Countdown:
        countdown_id = str(uuid.uuid4())
        # Hash the admin password
        password_hash = ""
        if admin_password:
            password_hash = bcrypt.hashpw(
                admin_password.encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')
        
        countdown = Countdown(
            id=countdown_id,
            sport_id=sport_id,
            mode=mode,
            state=CountdownState.STOPPED,
            time_left=default_duration,
            elapsed_time=0,
            team1_name=team1_name,
            team2_name=team2_name,
            team1_score=0,
            team2_score=0,
            admin_password_hash=password_hash,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        async with self._lock:
            self._countdowns[countdown_id] = countdown
            self._websockets[countdown_id] = set()
        return countdown
    
    async def verify_admin_password(self, countdown_id: str, password: str) -> bool:
        async with self._lock:
            countdown = self._countdowns.get(countdown_id)
            if not countdown or not countdown.admin_password_hash:
                return False
            return bcrypt.checkpw(
                password.encode('utf-8'),
                countdown.admin_password_hash.encode('utf-8')
            )

    async def get_countdown(self, countdown_id: str) -> Countdown | None:
        async with self._lock:
            return self._countdowns.get(countdown_id)

    async def start_countdown(self, countdown_id: str) -> bool:
        async with self._lock:
            countdown = self._countdowns.get(countdown_id)
            if not countdown:
                return False
            # Can start from STOPPED or PAUSED state
            if countdown.state == CountdownState.RUNNING:
                return False
            countdown.state = CountdownState.RUNNING
            countdown.updated_at = datetime.utcnow()

        # Broadcast state change immediately
        await self._broadcast_update(countdown_id)

        # Start or restart the timer task
        if countdown_id in self._tasks:
            # Cancel existing task if it's still running
            if not self._tasks[countdown_id].done():
                self._tasks[countdown_id].cancel()
                try:
                    await self._tasks[countdown_id]
                except asyncio.CancelledError:
                    pass
        
        # Create new timer task
        self._tasks[countdown_id] = asyncio.create_task(
            self._run_timer(countdown_id)
        )
        return True

    async def pause_countdown(self, countdown_id: str) -> bool:
        async with self._lock:
            countdown = self._countdowns.get(countdown_id)
            if not countdown:
                return False
            # Can only pause if currently running
            if countdown.state != CountdownState.RUNNING:
                return False
            countdown.state = CountdownState.PAUSED
            countdown.updated_at = datetime.utcnow()
        
        # The timer task will detect the state change and exit on next iteration
        # No need to cancel it explicitly - it checks state each second
        await self._broadcast_update(countdown_id)
        return True

    async def reset_countdown(self, countdown_id: str, default_duration: int) -> bool:
        async with self._lock:
            countdown = self._countdowns.get(countdown_id)
            if not countdown:
                return False
            countdown.state = CountdownState.STOPPED
            countdown.time_left = default_duration
            countdown.elapsed_time = 0
            countdown.updated_at = datetime.utcnow()

        if countdown_id in self._tasks:
            self._tasks[countdown_id].cancel()
            try:
                await self._tasks[countdown_id]
            except asyncio.CancelledError:
                pass
            del self._tasks[countdown_id]
        return True

    async def update_score(
        self, countdown_id: str, team: str, score: int
    ) -> bool:
        async with self._lock:
            countdown = self._countdowns.get(countdown_id)
            if not countdown:
                return False
            if team == "team1":
                countdown.team1_score = max(0, score)
            elif team == "team2":
                countdown.team2_score = max(0, score)
            else:
                return False
            countdown.updated_at = datetime.utcnow()
        await self._broadcast_update(countdown_id)
        return True

    async def update_team_name(
        self, countdown_id: str, team: str, name: str
    ) -> bool:
        async with self._lock:
            countdown = self._countdowns.get(countdown_id)
            if not countdown:
                return False
            if team == "team1":
                countdown.team1_name = name
            elif team == "team2":
                countdown.team2_name = name
            else:
                return False
            countdown.updated_at = datetime.utcnow()
        await self._broadcast_update(countdown_id)
        return True

    async def register_websocket(self, countdown_id: str, websocket):
        async with self._lock:
            if countdown_id not in self._websockets:
                self._websockets[countdown_id] = set()
            self._websockets[countdown_id].add(websocket)
        # Send initial state
        countdown = await self.get_countdown(countdown_id)
        if countdown:
            await self._send_update(websocket, countdown)

    async def unregister_websocket(self, countdown_id: str, websocket):
        async with self._lock:
            if countdown_id in self._websockets:
                self._websockets[countdown_id].discard(websocket)

    async def _run_timer(self, countdown_id: str):
        try:
            while True:
                await asyncio.sleep(1)
                async with self._lock:
                    countdown = self._countdowns.get(countdown_id)
                    if not countdown:
                        break
                    if countdown.state != CountdownState.RUNNING:
                        break

                    if countdown.mode == CountdownMode.COUNTUP:
                        countdown.elapsed_time += 1
                    else:
                        if countdown.time_left <= 1:
                            countdown.time_left = 0
                            countdown.state = CountdownState.STOPPED
                            countdown.updated_at = datetime.utcnow()
                            await self._broadcast_update(countdown_id)
                            break
                        countdown.time_left -= 1

                    countdown.updated_at = datetime.utcnow()

                # Broadcast update outside the lock to avoid blocking
                await self._broadcast_update(countdown_id)
        except asyncio.CancelledError:
            pass

    async def _broadcast_update(self, countdown_id: str):
        async with self._lock:
            countdown = self._countdowns.get(countdown_id)
            if not countdown:
                return
            websockets = self._websockets.get(countdown_id, set()).copy()

        for ws in websockets:
            try:
                await self._send_update(ws, countdown)
            except Exception:
                # Remove dead websockets
                async with self._lock:
                    if countdown_id in self._websockets:
                        self._websockets[countdown_id].discard(ws)

    async def _send_update(self, websocket, countdown: Countdown):
        await websocket.send_json({
            "type": "update",
            "data": {
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
            },
        })


# Global instance
_countdown_service: CountdownService | None = None


def get_countdown_service() -> CountdownService:
    global _countdown_service
    if _countdown_service is None:
        _countdown_service = CountdownService()
    return _countdown_service
