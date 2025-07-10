import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import AdminPage from './AdminPage';

function StudentLookup() {
  const [studentCode, setStudentCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStudentInfo(null);
    setLoading(true);

    // 폼 검증
    if (!studentName.trim() || !studentCode.trim()) {
      setError('이름과 고유번호를 모두 입력해주세요.');
      setLoading(false);
      return;
    }

    if (studentName.trim().length < 2) {
      setError('이름은 2자 이상 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/student-info?student_code=${studentCode}&name=${studentName}`);
      const data = await response.json();

      if (response.ok) {
        setStudentInfo({
          ...data,
          studentCode: studentCode
        });
      } else {
        setError(data.message || '학생 정보를 찾을 수 없습니다. 이름과 고유번호를 다시 확인해주세요.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('네트워크 오류가 발생했거나 서버가 실행되지 않았습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <div className="logo">
          <span className="logo-icon">📚</span>
        </div>
        <h1 className="title">교재 조회 시스템</h1>
        <p className="subtitle">미납/납부 내역을 확인하세요</p>
      </div>

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
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '조회 중...' : '조회하기'}
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {studentInfo && (
        <div className="student-info">
          <div className="student-header">
            <div className="student-name">{studentInfo.studentName} 학생</div>
            <div className="unpaid-total">{studentInfo.totalUnpaidAmount.toLocaleString()}원</div>
            <div className="unpaid-label">미납 총액</div>
          </div>
          
          <div className="book-sections-container">
            {studentInfo.unpaidBooks.length > 0 && (
              <div className="book-section">
                <div className="section-title">❌ 미납 도서 ({studentInfo.unpaidBooks.length}권)</div>
                <div className="book-list">
                  {studentInfo.unpaidBooks.map((book) => (
                    <div key={book.id} className="book-item">
                      <span className="book-name">{book.book_name}</span>
                      <span className="book-price">{book.price.toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {studentInfo.paidBooks.length > 0 && (
              <div className="book-section">
                <div className="section-title">✅ 납부완료 도서 ({studentInfo.paidBooks.length}권)</div>
                <div className="book-list">
                  {studentInfo.paidBooks.map((book) => (
                    <div key={book.id} className="book-item paid-book">
                      <span className="book-name">{book.book_name}</span>
                      <span className="book-price">{book.price.toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="account-info">
            <h3>💳 납부 계좌 안내</h3>
            <div className="account-details">{studentInfo.accountInfo}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
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