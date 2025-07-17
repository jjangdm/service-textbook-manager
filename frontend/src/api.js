// API 기본 URL 설정
export const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? window.location.origin  // 프로덕션에서는 같은 도메인 사용
    : 'http://localhost:8080'  // 개발 환경용 (로컬 백엔드 서버)
  );

console.log('🌐 API URL 설정:', API_URL);

// 공통 API 호출 함수
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  try {
    console.log('📡 API 호출:', url);
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ API 응답 성공:', data);
    return data;
  } catch (error) {
    console.error('💥 API 호출 실패:', error);
    throw error;
  }
};

// API 연결 테스트 함수
export const testApiConnection = async () => {
  try {
    console.log('🔍 API 연결 테스트 시작...');
    const response = await fetch(`${API_URL}/health`);
    const isConnected = response.ok;
    console.log(isConnected ? '✅ API 연결 성공' : '❌ API 연결 실패');
    return isConnected;
  } catch (error) {
    console.error('💥 API 연결 테스트 실패:', error);
    return false;
  }
};
