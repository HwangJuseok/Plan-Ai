# backend/app/models.py
# (4.A, 4.B: 입/출력 JSON 모델 정의)

from pydantic import BaseModel, Field
from typing import List, Literal, Optional

# --- 4.A: 입력 모델 (React -> Python) ---

class Accommodation(BaseModel):
    address_name: str
    latitude: float
    longitude: float

class Transportation(BaseModel):
    main_mode: Literal['own_car', 'rental_car', 'public_transport']
    preferences: List[str]

class Style(BaseModel):
    pace: Literal['relaxed', 'packed']
    atmosphere: Literal['quiet', 'crowded']
    walking: Literal['dislike', 'neutral', 'like']
    interests: List[str]
    food_restrictions: List[str]

# React가 보낼 최종 입력 JSON 형태
class TripRequest(BaseModel):
    destination: str
    duration_days: int
    party_size: int
    accommodation: Accommodation
    budget_krw: int
    transportation: Transportation
    style: Style

# --- 4.B: 출력 모델 (Python/AI -> React) ---

class Location(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float

class ScheduleItem(BaseModel):
    time: str
    type: Literal['accommodation', 'cafe', 'food', 'activity', 'travel', 'etc']
    title: str
    description: str
    location: Location
    cost_krw: Optional[int] = Field(default=0, description="해당 일정의 예상 비용")

class DailyPlan(BaseModel):
    day: int
    theme: str
    schedule: List[ScheduleItem]

# React로 보낼 최종 출력 JSON 형태
class TripResponse(BaseModel):
    trip_title: str
    overall_summary: str
    plan: List[DailyPlan]