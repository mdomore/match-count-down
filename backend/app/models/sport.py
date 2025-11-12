from pydantic import BaseModel


class Sport(BaseModel):
    id: str
    name: str
    defaultDuration: int
    periods: int
    description: str

