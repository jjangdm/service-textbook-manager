import React, { useState, useEffect } from 'react';
import './AdminPage.css';

// API URL 설정
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 전체 시스템 상태
  const [totalUnpaidAmount, setTotalUnpaidAmount] = useState(0);
  
  // 학생 검색 관련
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // 교재 추가 관련
  const [newBook, setNewBook] = useState({
    book_name: '',
    price: '',
    input_date: new Date().toISOString().split('T')[0]
  });
  const [bookSuggestions, setBookSuggestions] = useState([]);
  const [showBookSuggestions, setShowBookSuggestions] = useState(false);
  
  // 메시지
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

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
        await fetchTotalUnpaidAmount();
      } else {
        setAuthError(data.message || '인증에 실패했습니다.');
      }
    } catch (error) {
      setAuthError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 전체 미납액 조회 (실제 백엔드 API 사용)
  const fetchTotalUnpaidAmount = async () => {
    console.log('📊 실제 데이터베이스에서 미납액 조회 시작...');
    
    try {
      const response = await fetch(`${API_URL}/api/admin/total-unpaid`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 백엔드 API 응답:', data);
        
        if (data.success) {
          console.log(`💰 총 미납액: ${data.totalUnpaidAmount.toLocaleString()}원`);
          console.log(`📚 미납 도서: ${data.unpaidBooksCount}권`);
          console.log(`👥 미납 학생: ${data.studentsWithUnpaidBooks}명`);
          
          setTotalUnpaidAmount(data.totalUnpaidAmount);
          return;
        }
      }
      
      console.log('❌ API 응답 실패, 상태:', response.status);
      throw new Error(`API 응답 실패: ${response.status}`);
      
    } catch (error) {
      console.log('💥 백엔드 연결 실패:', error.message);
      console.log('🔄 백엔드 서버가 실행 중인지 확인하세요 (API URL)');
      
      showMessage('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.', 'error');
      setTotalUnpaidAmount(0);
    }
  };

  // 학생 검색 (실제 백엔드 API 사용)
  const handleStudentSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    console.log(`🔍 "${query}" 검색 중... (백엔드 API)`);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/students/search?query=${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const students = await response.json();
        console.log(`📋 검색 결과: ${students.length}명`);
        
        setSearchResults(students);
        setShowSearchResults(true);
      } else {
        console.log(`❌ 학생 검색 실패: ${response.status}`);
        setSearchResults([]);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('💥 학생 검색 오류:', error);
      setSearchResults([]);
      setShowSearchResults(true);
    }
  };

  // 학생 선택
  const handleStudentSelect = async (student) => {
    console.log(`👤 "${student.name}" 학생 선택됨`);
    
    setSelectedStudent(null);
    setSearchQuery(`${student.name} (${student.student_code})`);
    setShowSearchResults(false);
    
    try {
      const response = await fetch(`${API_URL}/api/student-info?student_code=${student.student_code}&name=${student.name}`);
      const data = await response.json();
      
      if (response.ok && !data.error) {
        const studentData = {
          ...student,
          ...data
        };
        setSelectedStudent(studentData);
        
        console.log(`💰 ${student.name} 미납액: ${data.totalUnpaidAmount?.toLocaleString() || 0}원`);
        
      } else {
        console.log(`❌ 학생 정보 조회 실패:`, data.error || data.message);
        showMessage(`학생 "${student.name}"의 정보를 찾을 수 없습니다.`, 'error');
      }
    } catch (error) {
      console.error('💥 학생 정보 조회 오류:', error);
      showMessage('학생 정보를 불러오는데 실패했습니다.', 'error');
    }
  };

  // 학생 삭제
  const handleDeleteStudent = async (studentId, studentName) => {
    // 이중 확인 프롬프트
    const firstConfirm = window.confirm(
      `⚠️ 정말로 "${studentName}" 학생을 삭제하시겠습니까?\n\n` +
      `이 작업은 되돌릴 수 없으며, 해당 학생의 모든 교재 정보도 함께 삭제됩니다.`
    );

    if (!firstConfirm) {
      return;
    }

    const secondConfirm = window.confirm(
      `🚨 최종 확인\n\n` +
      `"${studentName}" 학생과 모든 관련 데이터를 영구적으로 삭제합니다.\n` +
      `정말 진행하시겠습니까?`
    );

    if (!secondConfirm) {
      return;
    }

    setLoading(true);

    try {
      console.log(`🗑️ 학생 삭제 시도: ${studentName} (ID: ${studentId})`);

      const response = await fetch(`${API_URL}/api/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(`📡 삭제 API 응답 상태: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`📊 삭제 API 응답 데이터:`, data);

        // 성공 여부를 다양한 방법으로 확인
        const isSuccess = data.success === true || 
                         data.deleted === true || 
                         response.status === 200 ||
                         data.message?.includes('deleted successfully') ||
                         data.message?.includes('삭제되었습니다');

        if (isSuccess) {
          console.log(`✅ 학생 삭제 성공: ${studentName}`);
          
          showMessage(
            `학생 "${studentName}"이 성공적으로 삭제되었습니다.${data.deletedBooksCount ? ` (${data.deletedBooksCount}권의 교재도 함께 삭제됨)` : ''}`, 
            'success'
          );

          // 현재 선택된 학생이 삭제된 학생이면 선택 해제
          if (selectedStudent && (selectedStudent.id === studentId || selectedStudent.id === String(studentId))) {
            setSelectedStudent(null);
            setSearchQuery('');
          }

          // 검색 결과에서도 제거
          setSearchResults(prev => prev.filter(student => student.id !== studentId && student.id !== String(studentId)));

          // 총 미납액 새로고침
          await fetchTotalUnpaidAmount();

        } else {
          console.log(`❌ 학생 삭제 실패:`, data);
          showMessage(`삭제 실패: ${data.message || '알 수 없는 오류가 발생했습니다.'}`, 'error');
        }

      } else {
        console.log(`❌ HTTP 에러: ${response.status}`);
        const errorData = await response.json().catch(() => ({}));
        showMessage(`삭제 실패: HTTP ${response.status} - ${errorData.message || '서버 오류'}`, 'error');
      }

    } catch (error) {
      console.error(`💥 학생 삭제 오류:`, error);
      showMessage('네트워크 오류가 발생했습니다. 서버 연결을 확인해주세요.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 새 학생 추가 (실제 백엔드 API 사용)
  const handleAddNewStudent = async (studentName) => {
    setLoading(true);

    try {
      console.log(`👤 새 학생 "${studentName}" 추가 중...`);
      
      const response = await fetch(`${API_URL}/api/admin/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: studentName })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ 학생 추가 성공: ${data.student.name} (${data.student.student_code})`);
        showMessage(`학생 "${studentName}" (${data.student.student_code})이 추가되었습니다.`, 'success');
        
        // 새로 추가된 학생을 자동 선택
        await handleStudentSelect(data.student);
        setSearchQuery('');
        setShowSearchResults(false);
        
        // 총 미납액 새로고침
        await fetchTotalUnpaidAmount();
        
      } else {
        console.log(`❌ 학생 추가 실패:`, data.message);
        showMessage(`오류: ${data.message}`, 'error');
      }
    } catch (error) {
      console.log(`💥 학생 추가 에러:`, error.message);
      showMessage('네트워크 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 교재명 자동완성
  const handleBookNameChange = async (value) => {
    setNewBook({ ...newBook, book_name: value });
    
    if (value.length < 2) {
      setBookSuggestions([]);
      setShowBookSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/books/search?query=${encodeURIComponent(value)}`);
      const data = await response.json();
      
      if (response.ok) {
        setBookSuggestions(data);
        setShowBookSuggestions(true);
      }
    } catch (error) {
      console.error('교재 검색 오류:', error);
    }
  };

  // 교재 선택 시 최근 가격 자동 채우기
  const handleBookSelect = async (book) => {
    setNewBook({
      ...newBook,
      book_name: book.book_name,
      price: book.recent_price || ''
    });
    setShowBookSuggestions(false);

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
      showMessage('학생을 먼저 선택해주세요.', 'error');
      return;
    }

    if (!newBook.book_name.trim() || !newBook.price || !newBook.input_date) {
      showMessage('모든 필드를 입력해주세요.', 'error');
      return;
    }

    setLoading(true);

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
        showMessage(`교재 "${newBook.book_name}"이 추가되었습니다.`, 'success');
        setNewBook({
          book_name: '',
          price: '',
          input_date: new Date().toISOString().split('T')[0]
        });
        
        // 학생 정보 새로고침
        await handleStudentSelect(selectedStudent);
        await fetchTotalUnpaidAmount();
      } else {
        showMessage(`오류: ${data.message}`, 'error');
      }
    } catch (error) {
      showMessage('네트워크 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 납부 처리
  const handleMarkAsPaid = async (bookId, paymentDate) => {
    if (!paymentDate) {
      showMessage('납부일을 선택해주세요.', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/books/${bookId}/mark-paid`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_date: paymentDate })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('납부 처리가 완료되었습니다.', 'success');
        // 학생 정보 새로고침
        if (selectedStudent) {
          await handleStudentSelect(selectedStudent);
        }
        await fetchTotalUnpaidAmount();
      } else {
        showMessage(`오류: ${data.message}`, 'error');
      }
    } catch (error) {
      showMessage('네트워크 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 메시지 표시
  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // 로그아웃
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setSelectedStudent(null);
    setSearchQuery('');
    localStorage.removeItem('adminToken');
  };

  // 페이지 로드 시 토큰 확인
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      // 인증 후 미납액 조회
      fetchTotalUnpaidAmount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 인증 상태 변경시 미납액 조회
  useEffect(() => {
    if (isAuthenticated) {
      fetchTotalUnpaidAmount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // 검색 결과 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
      if (!e.target.closest('.book-name-container')) {
        setShowBookSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 인증되지 않은 경우 로그인 폼
  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-login-card">
            <div className="admin-logo">
              <span className="admin-logo-icon">🔐</span>
            </div>
            <h1 className="admin-login-title">관리자 로그인</h1>
            <p className="admin-login-subtitle">교재 관리 시스템에 접근하려면 인증이 필요합니다</p>
            
            <form onSubmit={handleLogin} className="admin-login-form">
              <div className="form-group">
                <label className="form-label">관리자 비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="form-input"
                  required
                />
              </div>
              
              {authError && <div className="error-message">{authError}</div>}
              
              <button type="submit" disabled={loading} className="admin-login-btn">
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

  // 관리자 대시보드
  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* 헤더 */}
        <div className="admin-header">
          <div className="admin-header-content">
            <div>
              <h1 className="admin-title">📚 교재 관리 시스템</h1>
              <div className="total-unpaid">
                총 미납액: <span className="amount">
                  {totalUnpaidAmount === 0 ? 
                    '조회 중...' : 
                    `${totalUnpaidAmount.toLocaleString()}원`
                  }
                </span>
              </div>
              <div style={{fontSize: '12px', color: '#888', marginTop: '5px'}}>
                학생을 검색하면 미납액이 자동 계산됩니다
              </div>
            </div>
            <div style={{display: 'flex', gap: '10px'}}>
              <button 
                onClick={fetchTotalUnpaidAmount} 
                style={{
                  background: '#99cc00', 
                  color: 'white', 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                새로고침
              </button>
              <button onClick={handleLogout} className="logout-btn">로그아웃</button>
            </div>
          </div>
        </div>

        {/* 메시지 */}
        {message && (
          <div className={`admin-message ${messageType}`}>
            {message}
          </div>
        )}

        {/* 학생 검색 */}
        <div className="admin-card">
          <h2 className="section-title">🔍 학생 검색</h2>
          <div className="search-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleStudentSearch(e.target.value)}
              placeholder="학생 이름 또는 코드를 입력하세요"
              className="search-input"
            />
            
            {showSearchResults && searchQuery.length >= 2 && (
              <div className="search-results">
                {searchResults.length > 0 ? (
                  searchResults.map(student => (
                    <div
                      key={student.id}
                      className="search-result-item"
                      style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                    >
                      <div 
                        className="student-info"
                        onClick={() => handleStudentSelect(student)}
                        style={{cursor: 'pointer', flex: 1}}
                      >
                        <span className="student-name">{student.name}</span>
                        <span className="student-code">({student.student_code})</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStudent(student.id, student.name);
                        }}
                        disabled={loading}
                        style={{
                          background: '#e74c3c',
                          color: 'white',
                          padding: '6px 10px',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginLeft: '10px',
                          opacity: loading ? 0.6 : 1
                        }}
                        title="학생 삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    <div className="no-results-text">
                      "{searchQuery}" 검색 결과가 없습니다.
                    </div>
                    <button
                      className="add-student-btn"
                      onClick={() => handleAddNewStudent(searchQuery)}
                      disabled={loading}
                    >
                      "{searchQuery}" 학생 추가하기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 선택된 학생 정보 */}
        {selectedStudent && (
          <div className="admin-card">
            <div className="student-header">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px'}}>
                <h2 className="section-title">👤 {selectedStudent.name} 학생</h2>
                <button 
                  onClick={() => handleDeleteStudent(selectedStudent.id, selectedStudent.name)}
                  disabled={loading}
                  style={{
                    background: '#e74c3c',
                    color: 'white',
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseOver={(e) => e.target.style.background = '#c0392b'}
                  onMouseOut={(e) => e.target.style.background = '#e74c3c'}
                >
                  🗑️ 학생 삭제
                </button>
              </div>
              <div className="student-summary">
                <div className="summary-item unpaid">
                  <label>미납 금액</label>
                  <span>{selectedStudent.totalUnpaidAmount?.toLocaleString() || 0}원</span>
                </div>
                <div className="summary-item">
                  <label>미납 교재</label>
                  <span>{selectedStudent.unpaidBooks?.length || 0}권</span>
                </div>
                <div className="summary-item">
                  <label>납부 교재</label>
                  <span>{selectedStudent.paidBooks?.length || 0}권</span>
                </div>
              </div>
            </div>

            {/* 교재 지급 섹션 */}
            <div className="book-add-section">
              <h3 className="subsection-title">➕ 새 교재 지급</h3>
              <form onSubmit={handleAddBook} className="book-form">
                <div className="book-form-row">
                  <div className="form-group book-name-container">
                    <label className="form-label">교재명</label>
                    <input
                      type="text"
                      value={newBook.book_name}
                      onChange={(e) => handleBookNameChange(e.target.value)}
                      placeholder="교재명을 입력하세요"
                      className="form-input"
                      required
                    />
                    {showBookSuggestions && bookSuggestions.length > 0 && (
                      <div className="book-suggestions">
                        {bookSuggestions.map((book, index) => (
                          <div
                            key={index}
                            className="book-suggestion-item"
                            onClick={() => handleBookSelect(book)}
                          >
                            <span className="book-title">{book.book_name}</span>
                            <span className="recent-price">
                              최근가격: {book.recent_price?.toLocaleString()}원
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">가격</label>
                    <input
                      type="number"
                      value={newBook.price}
                      onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                      placeholder="가격을 입력하세요"
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">지급일</label>
                    <input
                      type="date"
                      value={newBook.input_date}
                      onChange={(e) => setNewBook({...newBook, input_date: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                
                <button type="submit" disabled={loading} className="add-book-btn">
                  {loading ? '추가 중...' : '교재 추가'}
                </button>
              </form>
            </div>

            {/* 미납 도서 목록 */}
            {selectedStudent.unpaidBooks && selectedStudent.unpaidBooks.length > 0 && (
              <div className="books-section unpaid-section">
                <h3 className="subsection-title">❌ 미납 도서 목록 ({selectedStudent.unpaidBooks.length}권)</h3>
                <div className="books-list">
                  {selectedStudent.unpaidBooks.map((book, index) => (
                    <div key={index} className="book-item unpaid-book">
                      <div className="book-main-info">
                        <div className="book-title">{book.book_name}</div>
                        <div className="book-details">
                          <span className="book-price">{book.price?.toLocaleString()}원</span>
                          <span className="book-date">지급일: {book.input_date}</span>
                        </div>
                      </div>
                      <div className="payment-controls">
                        <input
                          type="date"
                          defaultValue={new Date().toISOString().split('T')[0]}
                          className="payment-date-input"
                          id={`payment-date-${book.id}`}
                        />
                        <button
                          className="mark-paid-btn"
                          onClick={() => {
                            const paymentDate = document.getElementById(`payment-date-${book.id}`).value;
                            handleMarkAsPaid(book.id, paymentDate);
                          }}
                          disabled={loading}
                        >
                          납부완료
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 납부완료 도서 목록 */}
            {selectedStudent.paidBooks && selectedStudent.paidBooks.length > 0 && (
              <div className="books-section paid-section">
                <h3 className="subsection-title">✅ 납부완료 도서 목록 ({selectedStudent.paidBooks.length}권)</h3>
                <div className="books-list">
                  {selectedStudent.paidBooks.map((book, index) => (
                    <div key={index} className="book-item paid-book">
                      <div className="book-main-info">
                        <div className="book-title">{book.book_name}</div>
                        <div className="book-details">
                          <span className="book-price paid">{book.price?.toLocaleString()}원</span>
                          <span className="book-date">지급일: {book.input_date}</span>
                          {book.payment_date && (
                            <span className="payment-date">납부일: {book.payment_date}</span>
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
      </div>
    </div>
  );
}

export default AdminPage;