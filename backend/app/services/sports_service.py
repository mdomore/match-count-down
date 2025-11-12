from __future__ import annotations

from typing import List, Optional

from app.models.sport import Sport


class SportsService:
    def __init__(self) -> None:
        self._sports: List[Sport] = [
            Sport(
                id="football",
                name="Football",
                defaultDuration=2700,
                periods=2,
                description="Association football with two 45-minute periods",
            ),
            Sport(
                id="football-u10",
                name="Football U10",
                defaultDuration=1500,
                periods=2,
                description="Youth football with two 25-minute periods",
            ),
            Sport(
                id="football-u11",
                name="Football U11",
                defaultDuration=1500,
                periods=2,
                description="Youth football U11 with two 25-minute periods",
            ),
            Sport(
                id="football-u12",
                name="Football U12",
                defaultDuration=1800,
                periods=2,
                description="Youth football U12 with two 30-minute periods",
            ),
            Sport(
                id="football-u13",
                name="Football U13",
                defaultDuration=1800,
                periods=2,
                description="Youth football U13 with two 30-minute periods",
            ),
            Sport(
                id="basketball",
                name="Basketball",
                defaultDuration=1200,
                periods=4,
                description="Basketball with four 12-minute quarters",
            ),
            Sport(
                id="tennis",
                name="Tennis",
                defaultDuration=1800,
                periods=3,
                description="Tennis with three 30-minute sets",
            ),
            Sport(
                id="volleyball",
                name="Volleyball",
                defaultDuration=1800,
                periods=5,
                description="Volleyball with five 30-minute sets",
            ),
            Sport(
                id="horseball",
                name="Horseball",
                defaultDuration=600,
                periods=2,
                description="Horseball with two 10-minute periods",
            ),
            Sport(
                id="custom",
                name="Custom",
                defaultDuration=1800,
                periods=1,
                description="Custom timer with configurable duration",
            ),
        ]

    def get_all_sports(self) -> List[Sport]:
        return self._sports

    def get_sport_by_id(self, sport_id: str) -> Optional[Sport]:
        return next((sport for sport in self._sports if sport.id == sport_id), None)

