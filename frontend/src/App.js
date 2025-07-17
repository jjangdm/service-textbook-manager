import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import AdminPage from './AdminPage';
import { apiCall, testApiConnection, API_URL } from './api';

function StudentLookup() {
  const [studentCode, setStudentCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('connected'); // checking, connected, error

  // 컴포넌트 마운트 시 API 연결 테스트
  /*
  useEffect(() => {
    const checkApiConnection = async () => {
      console.log('🚀 StudentLookup 컴포넌트 시작');
      const isConnected = await testApiConnection();
      setApiStatus(isConnected ? 'connected' : 'error');
    };
    
    checkApiConnection();
  }, []);
  */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStudentInfo(null);
    setLoading(true);

    // 입력값 검증
    const trimmedName = studentName.trim();
    const trimmedCode = studentCode.trim();

    if (!trimmedName || !trimmedCode) {
      setError('이름과 고유번호를 모두 입력해주세요.');
      setLoading(false);
      return;
    }

    if (trimmedName.length < 2) {
      setError('이름은 2자 이상 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      console.log(`🔍 학생 조회 시작: ${trimmedName} (${trimmedCode})`);
      
      const data = await apiCall(
        `/api/student-info?student_code=${encodeURIComponent(trimmedCode)}&name=${encodeURIComponent(trimmedName)}`
      );

      if (data.error) {
        setError(data.message || '학생 정보를 찾을 수 없습니다.');
      } else {
        console.log('✅ 학생 정보 조회 성공:', data);
        setStudentInfo({
          ...data,
          studentCode: trimmedCode
        });
      }
    } catch (err) {
      console.error('💥 학생 조회 실패:', err);
      
      // 에러 메시지 개선
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else if (err.message.includes('404')) {
        setError('학생 정보를 찾을 수 없습니다. 이름과 고유번호를 다시 확인해주세요.');
      } else if (err.message.includes('500')) {
        setError('서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError(`오류가 발생했습니다: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    console.log('🔄 새로 조회하기');
    setStudentInfo(null);
    setStudentCode('');
    setStudentName('');
    setError('');
  };

  return (
    <div className="app-container">
      <div className="header">
        <div className="logo">
          <span className="logo-icon">📚</span>
        </div>
        <h1 className="title">교재 조회 시스템</h1>
        <p className="subtitle">미납/납부 내역을 확인하세요</p>
        
        {/* API 연결 상태 표시 */}
      </div>

      {/* 학생 정보가 없을 때만 조회 폼 표시 */}
      {!studentInfo && (
        <div className="card">
          <form onSubmit={handleSubmit} className="student-form">
            <div className="form-group">
              <label className="form-label">학생 이름</label>
              <input
                type="text"
                className="form-input"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="이름을 입력하세요"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">고유번호</label>
              <input
                type="text"
                className="form-input"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="고유번호를 입력하세요"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="submit-btn" 
              disabled={loading || apiStatus !== 'connected'}
            >
              {loading ? '조회 중...' : 
               apiStatus !== 'connected' ? '서버 연결 대기 중...' : '조회하기'}
            </button>
          </form>
          
          {/* 디버깅 정보 (개발 환경에서만) */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#666'
            }}>
              <h4>디버깅 정보:</h4>
              <p>API URL: {API_URL}</p>
              <p>환경: {process.env.NODE_ENV || 'development'}</p>
              <p>호스트: {window.location.hostname}</p>
              <button 
                type="button"
                onClick={testApiConnection}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  backgroundColor: '#99cc00',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                API 연결 테스트
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          {error.includes('서버에 연결할 수 없습니다') && (
            <div style={{ marginTop: '10px', fontSize: '12px' }}>
              <p>💡 해결 방법:</p>
              <ul style={{ textAlign: 'left', marginTop: '5px' }}>
                <li>네트워크 연결을 확인해주세요</li>
                <li>잠시 후 다시 시도해주세요</li>
                <li>문제가 지속되면 관리자에게 문의하세요</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 학생 정보가 있을 때 도서 목록과 새로 조회하기 버튼 표시 */}
      {studentInfo && (
        <div className="student-info">
          <div className="student-header">
            <div className="student-name">{studentInfo.studentName} 학생</div>
            <div className="unpaid-total">{studentInfo.totalUnpaidAmount?.toLocaleString() || '0'}원</div>
            <div className="unpaid-label">미납 총액</div>
            
            {/* 새로 조회하기 버튼 */}
            <button 
              onClick={handleNewSearch}
              className="new-search-btn"
            >
              🔄 새로 조회하기
            </button>
          </div>
          
          <div className="book-sections-container">
            {studentInfo.unpaidBooks && studentInfo.unpaidBooks.length > 0 && (
              <div className="book-section">
                <div className="section-title">❌ 미납 도서 ({studentInfo.unpaidBooks.length}권)</div>
                <div className="book-list">
                  {studentInfo.unpaidBooks.map((book) => (
                    <div key={book.id} className="book-item">
                      <span className="book-name">{book.book_name}</span>
                      <span className="book-price">{book.price?.toLocaleString() || '0'}원</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {studentInfo.paidBooks && studentInfo.paidBooks.length > 0 && (
              <div className="book-section">
                <div className="section-title">✅ 납부완료 도서 ({studentInfo.paidBooks.length}권)</div>
                <div className="book-list">
                  {studentInfo.paidBooks.map((book) => (
                    <div key={book.id} className="book-item paid-book">
                      <span className="book-name">{book.book_name}</span>
                      <span className="book-price">{book.price?.toLocaleString() || '0'}원</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 도서가 하나도 없는 경우 */}
            {(!studentInfo.unpaidBooks || studentInfo.unpaidBooks.length === 0) && 
             (!studentInfo.paidBooks || studentInfo.paidBooks.length === 0) && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#7f8c8d',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px'
              }}>
                <p>📚 등록된 교재가 없습니다.</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  관리자에게 문의하여 교재를 등록해주세요.
                </p>
              </div>
            )}
          </div>
          
          <div className="account-info">
            <h3>💳 납부 계좌 안내</h3>
            <div className="account-details">
              {studentInfo.accountInfo || '신한은행 110-247-214359 장동민(엠클래스수학과학전문학원)'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  useEffect(() => {
    console.log('🚀 App 컴포넌트 시작');
    console.log('🌐 현재 URL:', window.location.href);
    console.log('📊 환경 변수:', {
      NODE_ENV: process.env.NODE_ENV,
      REACT_APP_API_URL: process.env.REACT_APP_API_URL,
      hostname: window.location.hostname,
      protocol: window.location.protocol
    });
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<StudentLookup />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;
