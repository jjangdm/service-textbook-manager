import React, { useState } from 'react';
import './App.css';
import AdminPanel from './AdminPanel';

function App() {
  const [studentCode, setStudentCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStudentInfo(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/student-info?student_code=${studentCode}&name=${studentName}`);
      const data = await response.json();

      if (response.ok) {
        setStudentInfo({
          ...data,
          studentCode: studentCode // 관리자 패널에서 사용하기 위해 추가
        });
      } else {
        setError(data.message || 'Failed to fetch student information.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('네트워크 오류가 발생했거나 서버가 실행되지 않았습니다.');
    } finally {
      setLoading(false);
    }
  };

  const refreshStudentInfo = async () => {
    if (studentCode && studentName) {
      setLoading(true);
      try {
        const response = await fetch(`/api/student-info?student_code=${studentCode}&name=${studentName}`);
        const data = await response.json();
        if (response.ok) {
          setStudentInfo({
            ...data,
            studentCode: studentCode
          });
        }
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>교재 미납/납부 조회</h1>
      </header>
      <main className="App-main">
        <form onSubmit={handleSubmit} className="student-form">
          <div className="form-group">
            <label htmlFor="studentCode">개인 고유 코드:</label>
            <input
              type="text"
              id="studentCode"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="studentName">이름:</label>
            <input
              type="text"
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? '조회 중...' : '조회'}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        {studentInfo && (
          <div className="student-info-card">
            <div className="student-header">
              <h2>{studentInfo.studentName} 학생 정보</h2>
              <button 
                onClick={() => setShowAdminPanel(true)}
                className="admin-button"
              >
                관리자 모드
              </button>
            </div>
            <div className="info-section">
              <h3>미납 금액: <span className="unpaid-amount">{studentInfo.totalUnpaidAmount.toLocaleString()}원</span></h3>
            </div>

            <div className="info-section">
              <h3>미납 도서 목록:</h3>
              {studentInfo.unpaidBooks.length > 0 ? (
                <ul className="book-list">
                  {studentInfo.unpaidBooks.map((book) => (
                    <li key={book.id}>{book.book_name} ({book.price.toLocaleString()}원)</li>
                  ))}
                </ul>
              ) : (
                <p>미납 도서가 없습니다.</p>
              )}
            </div>

            <div className="info-section">
              <h3>납부 도서 목록:</h3>
              {studentInfo.paidBooks.length > 0 ? (
                <ul className="book-list">
                  {studentInfo.paidBooks.map((book) => (
                    <li key={book.id}>{book.book_name} ({book.price.toLocaleString()}원) - 수납일: {book.payment_date}</li>
                  ))}
                </ul>
              ) : (
                <p>납부한 도서가 없습니다.</p>
              )}
            </div>

            <div className="info-section account-info">
              <h3>납부 계좌 안내:</h3>
              <p>{studentInfo.accountInfo}</p>
            </div>
          </div>
        )}
      </main>

      {showAdminPanel && studentInfo && (
        <AdminPanel
          studentInfo={studentInfo}
          onUpdate={refreshStudentInfo}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </div>
  );
}

export default App;