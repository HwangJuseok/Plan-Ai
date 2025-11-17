// frontend/src/App.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { Plane, Utensils, Coffee, MapPin, ShoppingCart, Sun, Hotel, Clock } from 'lucide-react';

// ----------------------------------------------------
// 0. 백엔드 API 주소 (엔드포인트까지 포함!)
// ----------------------------------------------------
const API_URL = 'https://plan-ai-f9kt.onrender.com/plan-ai';

// ----------------------------------------------------
// 1. 백엔드로 보낼 JSON 데이터의 '초기 빈 껍데기'
// ----------------------------------------------------
const initialFormData = {
  destination: "부산",
  duration_days: 3, 
  party_size: 2,    
  accommodation: {
    address_name: "해운대구 우동",
    latitude: 35.16,
    longitude: 129.1636
  },
  budget_krw: 500000, 
  transportation: {
    main_mode: "public_transport", 
    preferences: ["subway", "taxi_if_late_night"]
  },
  style: {
    pace: "relaxed",
    atmosphere: "quiet", 
    walking: "dislike",
    interests: ["카페", "해변", "야경", "쇼핑"], 
    food_restrictions: ["갑각류", "매운 음식"] 
  }
};

// ----------------------------------------------------
// 2. App.css 내용을 인라인 스타일 문자열로 삽입
// ----------------------------------------------------
const AppCssStyles = `
.plan-ai-container {
  width: 100%;
  max-width: 800px;
  min-height: 400px;
  padding: 2rem;
  background-color: #1a1a1a;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.welcome-screen { text-align: center; }
.welcome-screen h1 {
  font-size: 2.5rem; font-weight: 700; color: #58a6ff; margin-bottom: 1rem;
}
.welcome-screen p { font-size: 1.1rem; color: #c9d1d9; margin-bottom: 2rem; }
.form-step { display: flex; flex-direction: column; }
.step-title { font-size: 1.8rem; font-weight: 600; margin-bottom: 1.5rem; color: #c9d1d9; }
.form-label { font-size: 0.9rem; color: #8b949e; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
.form-input, select.form-input {
  width: 100%; padding: 0.75rem 1rem; font-size: 1.1rem; background-color: #2c2c2c; border: 1px solid #444; border-radius: 8px; color: #c9d1d9; margin-bottom: 1.5rem; transition: border-color 0.2s, box-shadow 0.2s; appearance: none;
}
select.form-input {
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238b949e%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-13%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2013l128%20128c3.6%203.6%207.8%205.4%2013%205.4s9.4-1.8%2013-5.4l128-128c3.6-3.6%205.4-7.8%205.4-13%200-4.9-1.8-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat; background-position: right 1rem center; background-size: 0.8em; padding-right: 2.5rem;
}
.form-input:focus, select.form-input:focus { outline: none; border-color: #58a6ff; box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3); }
.navigation-buttons { display: flex; justify-content: space-between; margin-top: 1rem; }
.btn { padding: 0.75rem 1.5rem; font-size: 1rem; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.2s, transform 0.1s; }
.btn:active { transform: scale(0.98); }
.btn-primary { background-color: #58a6ff; color: #1a1a1a; }
.btn-primary:hover { background-color: #79b8ff; }
.btn-secondary { background-color: #333; color: #c9d1d9; }
.btn-secondary:hover { background-color: #444; }
.btn-center { margin-top: 1rem; width: 100%; padding: 1rem; font-size: 1.1rem; }
.result-container { width: 100%; margin-top: 1rem; display: flex; flex-direction: column; gap: 1.5rem; max-height: 500px; overflow-y: auto; padding-right: 10px; }
.day-card { background-color: #222; border-radius: 10px; padding: 1.5rem; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); border-left: 5px solid #58a6ff; }
.day-card h3 { font-size: 1.3rem; color: #58a6ff; border-bottom: 2px solid #333; padding-bottom: 0.5rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }
.schedule-item { display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px dashed #333; }
.schedule-item:last-child { border-bottom: none; }
.schedule-icon { flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; background-color: #333; display: flex; justify-content: center; align-items: center; color: #58a6ff; }
.schedule-details { flex-grow: 1; }
.schedule-details h4 { font-size: 1rem; font-weight: 600; color: #fff; margin-bottom: 0.2rem; }
.schedule-details p { font-size: 0.9rem; color: #8b949e; line-height: 1.4; }
.schedule-time { font-weight: bold; color: #79b8ff; width: 60px; flex-shrink: 0; }
.schedule-cost { font-size: 0.85rem; color: #ffaa44; font-weight: 500; margin-top: 0.5rem; }
.summary-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.95rem; background-color: #2c2c2c; border-radius: 8px; overflow: hidden; }
.summary-table th, .summary-table td { padding: 0.8rem; text-align: left; }
.summary-table th { background-color: #333; color: #c9d1d9; width: 35%; }
.summary-table td { background-color: #222; color: #fff; }
.summary-table tr:nth-child(even) td { background-color: #2c2c2c; }
.summary-group-title { font-weight: bold; color: #58a6ff; margin-top: 1rem; margin-bottom: 0.5rem; border-bottom: 1px solid #444; padding-bottom: 0.3rem; }
`;

// ----------------------------------------------------
// 3. 아이콘 선택
// ----------------------------------------------------
const getIconForType = (type) => {
  switch (type) {
    case 'food': return <Utensils size={16} />;
    case 'cafe': return <Coffee size={16} />;
    case 'accommodation': return <Hotel size={16} />;
    case 'activity': return <Sun size={16} />;
    case 'shopping': return <ShoppingCart size={16} />;
    case 'travel': return <Plane size={16} />;
    case 'sightseeing': return <MapPin size={16} />;
    case 'etc':
    default: return <Clock size={16} />;
  }
};

// ----------------------------------------------------
// 4. 결과 카드 렌더
// ----------------------------------------------------
const renderPlanCard = (planArray) => {
  return (
    <div className="result-container">
      {planArray.map((dayPlan, index) => (
        <div key={index} className="day-card">
          <h3>
            <span>Day {dayPlan.day}. {dayPlan.theme}</span>
          </h3>
          <div className="schedule-list">
            {dayPlan.schedule.map((item, itemIndex) => (
              <div key={itemIndex} className="schedule-item">
                <span className="schedule-time">{item.time}</span>
                <div className="schedule-icon">{getIconForType(item.type)}</div>
                <div className="schedule-details">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <div className="schedule-cost">
                    {item.cost_krw > 0 ? `예상 비용: ${item.cost_krw.toLocaleString()} KRW` : '비용 없음'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ----------------------------------------------------
// 5. 최종 요약 화면 렌더
// ----------------------------------------------------
const renderFinalSummary = (data) => {
  const paceMap = { relaxed: '여유롭게', packed: '빡빡하게' };
  const atmosphereMap = { quiet: '조용하고 한적한 곳', crowded: '시끌벅적한 곳' };
  const walkingMap = { dislike: '걷기 싫음', neutral: '적당히', like: '걷기 좋음' };
  const mainModeMap = { public_transport: '대중교통', rental_car: '렌트카', own_car: '자차' };

  return (
    <div className="summary-container">
      <h4 className="summary-group-title">기본 정보</h4>
      <table className="summary-table">
        <tbody>
          <tr><th>여행지</th><td>{data.destination}</td></tr>
          <tr><th>기간 / 인원</th><td>{data.duration_days}일 / {data.party_size}명</td></tr>
          <tr><th>숙소 위치</th><td>{data.accommodation.address_name}</td></tr>
          <tr><th>총 경비 (제외)</th><td>{data.budget_krw.toLocaleString()} KRW</td></tr>
        </tbody>
      </table>

      <h4 className="summary-group-title">교통 및 동선</h4>
      <table className="summary-table">
        <tbody>
          <tr><th>주요 수단</th><td>{mainModeMap[data.transportation.main_mode]}</td></tr>
          <tr><th>선호 보조 수단</th><td>{data.transportation.preferences.join(', ')}</td></tr>
          <tr><th>걷기 선호도</th><td>{walkingMap[data.style.walking]}</td></tr>
        </tbody>
      </table>

      <h4 className="summary-group-title">취향 및 제약 조건</h4>
      <table className="summary-table">
        <tbody>
          <tr><th>여행 페이스</th><td>{paceMap[data.style.pace]}</td></tr>
          <tr><th>선호 분위기</th><td>{atmosphereMap[data.style.atmosphere]}</td></tr>
          <tr><th>주요 관심사</th><td>{data.style.interests.join(', ')}</td></tr>
          <tr><th>식사 제한</th><td>{data.style.food_restrictions.join(', ') || '없음'}</td></tr>
        </tbody>
      </table>
    </div>
  );
};

function App() {
  // ----------------------------------------------------
  // 6. State
  // ----------------------------------------------------
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const totalSteps = 10;

  // ----------------------------------------------------
  // 7. Handlers
  // ----------------------------------------------------
  const handleNext = () => setStep((prev) => prev + 1);
  const handlePrev = () => setStep((prev) => prev - 1);
  const handleStartOver = () => {
    setStep(0);
    setFormData(initialFormData);
    setResult(null);
    setError(null);
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleNestedChange = (e, parentKey, childKey) => {
    const { name, value, type } = e.target;
    const keyToUpdate = childKey || name;
    const finalValue = type === 'number' ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [parentKey]: { ...prev[parentKey], [keyToUpdate]: finalValue } }));
  };

  const handleArrayChange = (e, key) => {
    const value = e.target.value;
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    setFormData((prev) => ({ ...prev, style: { ...prev.style, [key]: arrayValue } }));
  };

  // 백엔드 호출
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(API_URL, formData, { timeout: 60000 });
      setResult(response.data);
    } catch (err) {
      console.error("API 호출 중 오류:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("계획 생성에 실패했습니다. 백엔드 서버를 확인해 주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 구글폼 링크 열기 (자동 프리필)
  const openFeedbackForm = () => {
    const formBase = "https://docs.google.com/forms/d/e/1FAIpQLSdtPQlZCXsSOsfwbXwaZwCjTS24ASiy01neJdN0DqC-a6ttkA/viewform";
    const params = new URLSearchParams({
      "entry.622080725": formData.destination,                // 여행지
      "entry.2110377133": String(formData.duration_days),     // 기간(일수)
      "entry.2118362544": String(formData.party_size),        // 인원수
    });
    const url = `${formBase}?${params.toString()}`;
    window.open(url, "_blank");
  };

  // ----------------------------------------------------
  // 8. 렌더링
  // ----------------------------------------------------
  const renderStep = () => {
    if (loading) {
      return (
        <div className="form-step" style={{textAlign: 'center'}}>
          <h2 className="step-title">AI가 여행 계획을 생성 중입니다...</h2>
          <p>잠시만 기다려 주세요 (약 10~20초 소요)</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="form-step" style={{textAlign: 'center'}}>
          <h2 className="step-title" style={{color: '#ff6b6b'}}>오류 발생</h2>
          <p style={{color: '#ffc1c1', marginBottom: '2rem'}}>{error}</p>
          <button className="btn btn-primary" onClick={handleStartOver}>처음부터 다시하기</button>
        </div>
      );
    }

    // 결과 화면
    if (result) {
      return (
        <div className="form-step">
          <h2 className="step-title">{result.trip_title}</h2>
          <p style={{marginBottom: '1.5rem', lineHeight: '1.6', color: '#c9d1d9'}}>{result.overall_summary}</p>

          {renderPlanCard(result.plan)}

          {/* 후기 버튼 추가 */}
          <button className="btn btn-secondary btn-center" onClick={openFeedbackForm} style={{marginTop: '1rem'}}>
            후기 남기기 (1분)
          </button>

          <button className="btn btn-primary btn-center" onClick={handleStartOver} style={{marginTop: '1rem'}}>
            새로운 계획 만들기
          </button>
        </div>
      );
    }

    // 단계별 폼
    switch (step) {
      case 0:
        return (
          <div className="welcome-screen">
            <h1>Plan-AI</h1>
            <p>AI와 함께 당신만의 완벽한 여행을 계획하세요.</p>
            <button className="btn btn-primary btn-center" onClick={handleNext}>여행 계획 시작하기</button>
          </div>
        );
      case 1:
        return (
          <div className="form-step">
            <h2 className="step-title">(1/{totalSteps-1}) 어디로 떠나시나요?</h2>
            <label className="form-label" htmlFor="destination">도시 이름</label>
            <input type="text" id="destination" name="destination" className="form-input"
                   value={formData.destination} onChange={handleInputChange}/>
            <div className="navigation-buttons">
              <button className="btn btn-secondary" onClick={handlePrev}>이전</button>
              <button className="btn btn-primary" onClick={handleNext}>다음</button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="form-step">
            <h2 className="step-title">(2/{totalSteps-1}) 여행 기간이 어떻게 되나요?</h2>
            <label className="form-label" htmlFor="duration_days">여행 일수</label>
            <input type="number" id="duration_days" name="duration_days" className="form-input"
                   value={formData.duration_days} onChange={handleInputChange} min="1"/>
            <div className="navigation-buttons">
              <button className="btn btn-secondary" onClick={handlePrev}>이전</button>
              <button className="btn btn-primary" onClick={handleNext}>다음</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="form-step">
            <h2 className="step-title">(3/{totalSteps-1}) 몇 명이서 여행하나요?</h2>
            <label className="form-label" htmlFor="party_size">인원수</label>
            <input type="number" id="party_size" name="party_size" className="form-input"
                   value={formData.party_size} onChange={handleInputChange} min="1"/>
            <div className="navigation-buttons">
              <button className="btn btn-secondary" onClick={handlePrev}>이전</button>
              <button className="btn btn-primary" onClick={handleNext}>다음</button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="form-step">
            <h2 className="step-title">(4/{totalSteps-1}) 숙소는 어디쯤인가요?</h2>
            <label className="form-label" htmlFor="address_name">숙소 주소 (예: 해운대구 우동)</label>
            <input type="text" id="address_name" name="address_name" className="form-input"
                   value={formData.accommodation.address_name}
                   onChange={(e) => handleNestedChange(e, 'accommodation', 'address_name')}/>
            <div className="navigation-buttons">
              <button className="btn btn-secondary" onClick={handlePrev}>이전</button>
              <button className="btn btn-primary" onClick={handleNext}>다음</button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="form-step">
            <h2 className="step-title">(5/{totalSteps-1}) 총 여행 경비는 얼마인가요?</h2>
            <label className="form-label" htmlFor="budget_krw">(숙소/항공권 제외) 1인당 아니고 '총' 경비</label>
            <input type="number" id="budget_krw" name="budget_krw" className="form-input"
                   value={formData.budget_krw} onChange={handleInputChange} min="0" step="10000"/>
            <div className="navigation-buttons">
              <button className="btn btn-secondary" onClick={handlePrev}>이전</button>
              <button className="btn btn-primary" onClick={handleNext}>다음</button>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="form-step">
            <h2 className="step-title">(6/{totalSteps-1}) 주요 교통수단은 무엇인가요?</h2>
            <label className="form-label" htmlFor="main_mode">교통수단 선택</label>
            <select id="main_mode" name="main_mode" className="form-input"
                    value={formData.transportation.main_mode}
                    onChange={(e) => handleNestedChange(e, 'transportation', 'main_mode')}>
              <option value="public_transport">대중교통 (지하철/버스)</option>
              <option value="rental_car">렌트카</option>
              <option value="own_car">자차</option>
            </select>
            <div className="navigation-buttons">
              <button className="btn btn-secondary" onClick={handlePrev}>이전</button>
              <button className="btn btn-primary" onClick={handleNext}>다음</button>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="form-step">
            <h2 className="step-title">(7/{totalSteps-1}) 여행 페이스와 걷기 선호도</h2>
            <label className="form-label" htmlFor="pace">여행 페이스</label>
            <select id="pace" name="pace" className="form-input"
                    value={formData.style.pace}
                    onChange={(e) => handleNestedChange(e, 'style', 'pace')}>
              <option value="relaxed">여유롭게 (Relaxed)</option>
              <option value="packed">빡빡하게 (Packed)</option>
            </select>

            <label className="form-label" htmlFor="walking">걷기 선호도</label>
            <select id="walking" name="walking" className="form-input"
                    value={formData.style.walking}
                    onChange={(e) => handleNestedChange(e, 'style', 'walking')}>
              <option value="dislike">걷기 싫음 (Dislike)</option>
              <option value="neutral">적당히 (Neutral)</option>
              <option value="like">걷기 좋음 (Like)</option>
            </select>
            <div className="navigation-buttons">
              <button className="btn btn-secondary" onClick={handlePrev}>이전</button>
              <button className="btn btn-primary" onClick={handleNext}>다음</button>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="form-step">
            <h2 className="step-title">(8/{totalSteps-1}) 선호하는 여행 분위기</h2>
            <label className="form-label" htmlFor="atmosphere">분위기 선택</label>
            <select id="atmosphere" name="atmosphere" className="form-input"
                    value={formData.style.atmosphere}
                    onChange={(e) => handleNestedChange(e, 'style', 'atmosphere')}>
              <option value="quiet">조용하고 한적한 곳</option>
              <option value="crowded">사람이 많고 시끌벅적한 곳</option>
            </select>
            <div className="navigation-buttons">
              <button className="btn btn-secondary" onClick={handlePrev}>이전</button>
              <button className="btn btn-primary" onClick={handleNext}>다음</button>
            </div>
          </div>
        );
      case 9:
        return (
          <div className="form-step">
            <h2 className="step-title">(9/{totalSteps-1}) 관심사 및 식사 제한</h2>
            <label className="form-label" htmlFor="interests">여행 관심사 (콤마로 구분, 예: 카페, 해변, 야경, 쇼핑)</label>
            <input type="text" id="interests" name="interests" className="form-input"
                   value={formData.style.interests.join(', ')}
                   onChange={(e) => handleArrayChange(e, 'interests')}/>

            <label className="form-label" htmlFor="food_restrictions">못 먹는 음식 (콤마로 구분, 예: 갑각류, 매운 음식, 돼지고기)</label>
            <input type="text" id="food_restrictions" name="food_restrictions" className="form-input"
                   value={formData.style.food_restrictions.join(', ')}
                   onChange={(e) => handleArrayChange(e, 'food_restrictions')}/>
            <div className="navigation-buttons">
              <button className="btn btn-secondary" onClick={handlePrev}>이전</button>
              <button className="btn btn-primary" onClick={handleNext}>최종 확인</button>
            </div>
          </div>
        );
      case 10:
        return (
          <div className="form-step">
            <h2 className="step-title">({totalSteps-1}/{totalSteps-1}) AI 계획을 생성할까요?</h2>
            <p style={{marginBottom: '1rem', color: '#c9d1d9'}}>
              아래는 입력하신 내용을 요약한 것입니다. 내용을 확인하신 후 'AI 계획 생성하기' 버튼을 눌러주세요.
            </p>
            {renderFinalSummary(formData)}
            <div className="navigation-buttons">
              <button className="btn btn-secondary" onClick={handlePrev}>이전 (수정)</button>
              <button className="btn btn-primary" onClick={handleSubmit}>AI 계획 생성하기</button>
            </div>
          </div>
        );
      default:
        return <button onClick={handleStartOver}>처음으로</button>;
    }
  };

  return (
    <div className="plan-ai-container">
      <style>{AppCssStyles}</style>
      {renderStep()}
    </div>
  );
}

export default App;
