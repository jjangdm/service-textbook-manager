import React, { useState, useEffect } from 'react';
import './AdminPage.css';

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 학생 검색 관련
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // 새 학생 추가 관련
  const [newStudent, setNewStudent] = useState({
    name: '',
    student_code: ''
  });
  const [showAddStudent, setShowAddStudent] = useState(false);
  
  // 교재 추가 관련
  const [newBook, setNewBook] = useState({
    book_name: '',
    price: '',
    input_date: new Date().toISOString().split('T')[0]
  });
  const [bookSuggestions, setBookSuggestions] = useState([]);
  const [message, setMessage] = useState('');

  // 관리자 인증
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('adminToken', data.token);
      } else {
        setAuthError(data.message || '인증에 실패했습니다.');
      }
    } catch (error) {
      setAuthError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 학생 검색
  const handleStudentSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/admin/students/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data);
      }
    } catch (error) {
      console.error('학생 검색 오류:', error);
    }
  };

  // 학생 선택
  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setSearchQuery(`${student.name} (${student.student_code})`);
    setSearchResults([]);
    
    // 선택된 학생의 상세 정보 조회
    try {
      const response = await fetch(`/api/student-info?student_code=${student.student_code}&name=${student.name}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedStudent({
          ...student,
          ...data
        });
      }
    } catch (error) {
      console.error('학생 정보 조회 오류:', error);
    }
  };

  // 교재명 자동완성 검색
  const handleBookNameChange = async (value) => {
    setNewBook({ ...newBook, book_name: value });
    
    if (value.length < 2) {
      setBookSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/admin/books/search?query=${encodeURIComponent(value)}`);
      const data = await response.json();
      
      if (response.ok) {
        setBookSuggestions(data);
      }
    } catch (error) {
      console.error('교재 검색 오류:', error);
    }
  };

  // 교재 선택 시 가격 자동 채우기
  const handleBookSelect = async (book) => {
    setNewBook({
      ...newBook,
      book_name: book.book_name,
      price: book.recent_price || ''
    });
    setBookSuggestions([]);

    // 최신 가격 정보 조회
    try {
      const response = await fetch(`/api/admin/books/price-history?book_name=${encodeURIComponent(book.book_name)}`);
      const data = await response.json();
      
      if (response.ok && data.recent_price) {
        setNewBook(prev => ({
          ...prev,
          price: data.recent_price
        }));
      }
    } catch (error) {
      console.error('가격 히스토리 조회 오류:', error);
    }
  };

  // 교재 추가
  const handleAddBook = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      setMessage('학생을 먼저 선택해주세요.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/students/${selectedStudent.student_code}/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBook)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`교재 "${newBook.book_name}"이(가) ${selectedStudent.name} 학생에게 추가되었습니다.`);
        setNewBook({
          book_name: '',
          price: '',
          input_date: new Date().toISOString().split('T')[0]
        });
        
        // 학생 정보 새로고침
        handleStudentSelect(selectedStudent);
      } else {
        setMessage(`오류: ${data.message}`);
      }
    } catch (error) {
      setMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새 학생 추가
  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    if (!newStudent.name || !newStudent.student_code) {
      setMessage('학생 이름과 고유번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStudent)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`학생 "${newStudent.name}" (${newStudent.student_code})이(가) 성공적으로 추가되었습니다.`);
        setNewStudent({
          name: '',
          student_code: ''
        });
        setShowAddStudent(false);
      } else {
        setMessage(`오류: ${data.message}`);
      }
    } catch (error) {
      setMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    localStorage.removeItem('adminToken');
  };

  // 페이지 로드 시 토큰 확인
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // 인증되지 않은 경우 로그인 폼 표시
  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="login-container">
          <div className="login-form">
            <h2>관리자 로그인</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>관리자 비밀번호:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>
              {authError && <div className="error-message">{authError}</div>}
              <button type="submit" disabled={loading} className="login-button">
                {loading ? '인증 중...' : '로그인'}
              </button>
            </form>
            <div className="login-info">
              <p>💡 기본 비밀번호: admin123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 인증된 경우 관리자 페이지 표시
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>📚 교재 관리 시스템 - 관리자 페이지</h1>
        <button onClick={handleLogout} className="logout-button">로그아웃</button>
      </div>

      <div className="admin-content">
        {/* 학생 검색 섹션 */}
        <div className="admin-section">
          <h2>🔍 학생 검색</h2>
          <div className="search-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleStudentSearch(e.target.value)}
              placeholder="학생 이름 또는 코드를 입력하세요"
              className="search-input"
            />
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(student => (
                  <div
                    key={student.id}
                    className="search-result-item"
                    onClick={() => handleStudentSelect(student)}
                  >
                    <span className="student-name">{student.name}</span>
                    <span className="student-code">({student.student_code})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 새 학생 추가 섹션 */}
        <div className="admin-section">
          <div className="section-header">
            <h2>👤 새 학생 추가</h2>
            <button 
              onClick={() => setShowAddStudent(!showAddStudent)}
              className="toggle-button"
            >
              {showAddStudent ? '닫기' : '학생 추가'}
            </button>
          </div>
          
          {showAddStudent && (
            <form onSubmit={handleAddStudent} className="add-student-form">
              <div className="form-row">
                <div className="form-group">
                  <label>학생 이름:</label>
                  <input
                    type="text"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    placeholder="학생 이름을 입력하세요"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>학생 고유번호:</label>
                  <input
                    type="text"
                    value={newStudent.student_code}
                    onChange={(e) => setNewStudent({...newStudent, student_code: e.target.value})}
                    placeholder="학생 고유번호를 입력하세요"
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="add-student-button"
                >
                  {loading ? '추가 중...' : '학생 추가'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 선택된 학생 정보 */}
        {selectedStudent && (
          <div className="admin-section">
            <h2>👤 선택된 학생: {selectedStudent.name}</h2>
            <div className="student-summary">
              <div className="summary-item">
                <label>학생 코드:</label>
                <span>{selectedStudent.student_code}</span>
              </div>
              {selectedStudent.unpaidBooks && (
                <>
                  <div className="summary-item unpaid">
                    <label>미납 금액:</label>
                    <span>{selectedStudent.totalUnpaidAmount?.toLocaleString()}원</span>
                  </div>
                  <div className="summary-item">
                    <label>미납 교재:</label>
                    <span>{selectedStudent.unpaidBooks.length}권</span>
                  </div>
                  <div className="summary-item">
                    <label>납부 교재:</label>
                    <span>{selectedStudent.paidBooks.length}권</span>
                  </div>
                </>
              )}
            </div>

            {/* 미납 도서 상세 목록 */}
            {selectedStudent.unpaidBooks && selectedStudent.unpaidBooks.length > 0 && (
              <div className="books-section">
                <h3>📋 미납 도서 목록 ({selectedStudent.unpaidBooks.length}권)</h3>
                <div className="books-list">
                  {selectedStudent.unpaidBooks.map((book, index) => (
                    <div key={index} className="book-item unpaid-book">
                      <div className="book-info">
                        <div className="book-title">{book.book_name}</div>
                        <div className="book-details">
                          <span className="book-price">{book.price?.toLocaleString()}원</span>
                          <span className="book-date">지급일: {book.input_date}</span>
                          {book.checking && (
                            <span className="book-status checking">확인됨</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 납부 도서 상세 목록 */}
            {selectedStudent.paidBooks && selectedStudent.paidBooks.length > 0 && (
              <div className="books-section">
                <h3>✅ 납부 완료 도서 목록 ({selectedStudent.paidBooks.length}권)</h3>
                <div className="books-list">
                  {selectedStudent.paidBooks.map((book, index) => (
                    <div key={index} className="book-item paid-book">
                      <div className="book-info">
                        <div className="book-title">{book.book_name}</div>
                        <div className="book-details">
                          <span className="book-price">{book.price?.toLocaleString()}원</span>
                          <span className="book-date">지급일: {book.input_date}</span>
                          {book.payment_date && (
                            <span className="book-payment">납부일: {book.payment_date}</span>
                          )}
                          {book.checking && (
                            <span className="book-status checking">확인됨</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 교재 추가 섹션 */}
        <div className="admin-section">
          <h2>➕ 새 교재 추가</h2>
          {!selectedStudent && (
            <div className="info-message">
              학생을 먼저 선택해주세요.
            </div>
          )}
          
          <form onSubmit={handleAddBook} className="add-book-form">
            <div className="form-row">
              <div className="form-group">
                <label>교재명:</label>
                <div className="autocomplete-container">
                  <input
                    type="text"
                    value={newBook.book_name}
                    onChange={(e) => handleBookNameChange(e.target.value)}
                    placeholder="교재명을 입력하세요 (자동완성)"
                    required
                    disabled={!selectedStudent}
                  />
                  {bookSuggestions.length > 0 && (
                    <div className="autocomplete-results">
                      {bookSuggestions.map((book, index) => (
                        <div
                          key={index}
                          className="autocomplete-item"
                          onClick={() => handleBookSelect(book)}
                        >
                          <span className="book-title">{book.book_name}</span>
                          <span className="book-price">최근가격: {book.recent_price?.toLocaleString()}원</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label>가격:</label>
                <input
                  type="number"
                  value={newBook.price}
                  onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                  placeholder="가격을 입력하세요"
                  required
                  disabled={!selectedStudent}
                />
              </div>
              
              <div className="form-group">
                <label>지급일:</label>
                <input
                  type="date"
                  value={newBook.input_date}
                  onChange={(e) => setNewBook({...newBook, input_date: e.target.value})}
                  required
                  disabled={!selectedStudent}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !selectedStudent} 
              className="add-book-button"
            >
              {loading ? '추가 중...' : '교재 추가'}
            </button>
          </form>

          {message && (
            <div className={`admin-message ${message.includes('오류') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
