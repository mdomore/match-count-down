from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class CountdownMode(str, Enum):
    COUNTDOWN = "countdown"
    COUNTUP = "countup"


class CountdownState(str, Enum):
    STOPPED = "stopped"
    RUNNING = "running"
    PAUSED = "paused"


class Countdown(BaseModel):
    id: str
    sport_id: str
    mode: CountdownMode
    state: CountdownState
    time_left: int  # seconds
    elapsed_time: int  # seconds
    team1_name: str
    team2_name: str
    team1_score: int
    team2_score: int
    admin_password_hash: str  # bcrypt hash of admin password
    created_at: datetime
    updated_at: datetime
