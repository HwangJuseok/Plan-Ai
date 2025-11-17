# backend/app/main.py

import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError
from typing import List, Literal, Optional

# ⬇️ [추가] AI 라이브러리 및 .env 로더
import google.generativeai as genai
from dotenv import load_dotenv

# ----------------------------------------------------
# 1. 모델 정의 (models.py 내용을 여기에 포함)
# ----------------------------------------------------

# --- 4.A: 입력 모델 (React -> Python) ---
class Accommodation(BaseModel):
    address_name: str
    latitude: float = Field(default=35.16, description="위도")
    longitude: float = Field(default=129.1636, description="경도")

class Transportation(BaseModel):
    main_mode: Literal['own_car', 'rental_car', 'public_transport']
    preferences: List[str]

class Style(BaseModel):
    pace: Literal['relaxed', 'packed']
    atmosphere: Literal['quiet', 'crowded']
    walking: Literal['dislike', 'neutral', 'like']
    interests: List[str]
    food_restrictions: List[str]

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
    # ⬇️ [수정]: AI가 사용한 'shopping'과 'sightseeing'을 허용 목록에 추가
    type: Literal['accommodation', 'cafe', 'food', 'activity', 'travel', 'etc', 'shopping', 'sightseeing']
    title: str
    description: str
    location: Location
    cost_krw: Optional[int] = Field(default=0)

class DailyPlan(BaseModel):
    day: int
    theme: str
    schedule: List[ScheduleItem]

class TripResponse(BaseModel):
    trip_title: str
    overall_summary: str
    plan: List[DailyPlan]

# ----------------------------------------------------
# 2. .env 로드 및 Gemini AI 설정
# ----------------------------------------------------
load_dotenv() 
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise ValueError("GOOGLE_API_KEY가 .env 파일에 설정되지 않았습니다.")

genai.configure(api_key=API_KEY)

ai_model = genai.GenerativeModel(
    'gemini-flash-latest', 
    generation_config={
        "response_mime_type": "application/json",
    }
)

# ----------------------------------------------------
# 3. FastAPI 앱 생성 및 CORS 설정
# ----------------------------------------------------
app = FastAPI(
    title="Plan-AI API",
    description="React 프론트엔드와 통신하는 Plan-AI의 백엔드 API입니다."
)

origins = [
    "http://localhost:5173",  
    "http://127.0.0.1:5173",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)

# -----------------------------------------------------------------
# 4. (BE <-> AI) AI에게 보낼 프롬프트를 생성하는 헬퍼 함수
# -----------------------------------------------------------------
def _build_ai_prompt(request: TripRequest) -> str:
    
    # ⬇️ [수정]: 프롬프트의 OUTPUT_JSON_SCHEMA 부분도 변경된 Literal 값으로 업데이트
    system_prompt = f"""
당신은 "Plan-AI"이며, 사용자가 제공한 JSON 입력을 기반으로 맞춤형 여행 계획을 생성하는 JSON 출력 전문 AI입니다.

**[최우선 규칙]**
1. 당신의 응답은 **반드시** 아래 [OUTPUT_JSON_SCHEMA]에 정의된 JSON 구조를 **문자 그대로** 따라야 합니다.
2. 필드 이름(`trip_title`, `plan`, `day`, `schedule`, `type` 등)을 **절대로 바꾸거나 임의로 추가하지 마십시오.** (예: 'plan_name'이나 'itinerary' 사용 금지)
3. 'type' 필드에는 **오직** 'accommodation', 'cafe', 'food', 'activity', 'travel', 'etc', 'shopping', 'sightseeing' 중 하나만 사용해야 합니다.
4. 모든 여행 제약 조건(예산, 음식 제한, 걷기 선호도)을 충족해야 합니다.

**[OUTPUT_JSON_SCHEMA]**
```json
{{
  "trip_title": "string (여행 제목)",
  "overall_summary": "string (계획 요약)",
  "plan": [
    {{
      "day": "int (1부터 시작)",
      "theme": "string (그날의 테마)",
      "schedule": [
        {{
          "time": "string (예: 14:00)",
          # ⬇️ [업데이트]: 허용된 타입 목록 수정
          "type": "string ('accommodation', 'food', 'shopping', 'sightseeing' 등)",
          "title": "string (일정 제목)",
          "description": "string (상세 설명)",
          "location": {{
            "name": "string (장소 이름)",
            "address": "string (장소 주소)",
            "latitude": "float",
            "longitude": "float"
          }},
          "cost_krw": "int (이 일정의 예상 비용)"
        }}
      ]
    }}
  ]
}}
```
"""

    user_request_json = request.model_dump_json(indent=2)

    final_prompt = f"""
{system_prompt}

**[사용자 요청 (USER_REQUEST_INPUT)]**
요청 JSON:
{user_request_json}

위 요청에 따라, **반드시 OUTPUT_JSON_SCHEMA에 맞는 JSON 객체만** 반환하십시오.
"""
    
    return final_prompt


# ----------------------------------------------------
# 5. API 엔드포인트
# ----------------------------------------------------
@app.post("/api/v1/plan", response_model=TripResponse)
async def create_travel_plan(request: TripRequest):
    
    print("--- 11. React로부터 요청 받음 ---")
    
    ai_prompt = _build_ai_prompt(request)
    
    print("--- 12. AI에게 보낼 최종 프롬프트 (터미널 확인용) ---")
    print("-" * 50)

    # -----------------------------------------------------------------
    # 13. '진짜' AI 호출
    # -----------------------------------------------------------------
    
    try:
        print("--- 13. AI에게 계획 생성 요청 시작 ---")
        response = await ai_model.generate_content_async(ai_prompt)
        
        ai_response_text = response.text
        print("--- 13. AI로부터 JSON 응답 받음 (터미널 확인용) ---")
        print("-" * 50)

        # AI가 보낸 JSON 텍스트를 Python 딕셔너리로 파싱
        if ai_response_text.strip().startswith("```"):
            ai_response_text = ai_response_text.split("```")[1].replace("json", "").strip()
        
        try:
            ai_response_dict = json.loads(ai_response_text)
        except json.JSONDecodeError as e:
             print(f"!!! JSON 파싱 실패 (AI가 이상한 문자열을 보냄): {e}")
             raise Exception("AI가 유효한 JSON을 반환하지 않았습니다.")


        # [핵심] Pydantic 모델(TripResponse)을 사용해 AI의 응답을 검증!
        final_response = TripResponse(**ai_response_dict)
        
        print("--- 13. AI 응답 검증(Pydantic) 성공! React로 반환 ---")
        return final_response

    # [예외 처리]
    except ValidationError as e:
        # 이 에러가 발생하면, AI가 아직도 잘못된 type을 쓰고 있다는 뜻이야.
        print(f"!!! AI 응답 '검증(Validation)' 실패: {e}")
        raise HTTPException(
            status_code=500, 
            detail="AI가 응답 형식을 잘못 생성했습니다. (5.A) - 상세 오류는 터미널을 확인하세요."
        )
    except Exception as e:
        print(f"!!! 최종 AI API 호출 또는 처리 오류: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"AI 계획 생성에 실패했습니다. 잠시 후 다시 시도해 주세요. (오류: {e})"
        )