import React, { useState } from 'react';
import './AdminPanel.css';

function AdminPanel({ studentInfo, onUpdate, onClose }) {
  const [newBook, setNewBook] = useState({
    book_name: '',
    price: '',
    input_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePaymentToggle = async (bookId, currentStatus, currentPaymentDate) => {
    setLoading(true);
    setMessage('');

    try {
      const newStatus = !currentStatus;
      const newPaymentDate = newStatus ? new Date().toISOString().split('T')[0] : null;

      const response = await fetch(`/api/books/${bookId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checking: newStatus,
          payment_date: newPaymentDate
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`납부 상태가 ${newStatus ? '납부완료' : '미납'}로 변경되었습니다.`);
        onUpdate(); // 부모 컴포넌트의 데이터 새로고침
      } else {
        setMessage(`오류: ${data.message}`);
      }
    } catch (error) {
      setMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/students/${studentInfo.studentCode}/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBook)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('새 도서가 추가되었습니다.');
        setNewBook({
          book_name: '',
          price: '',
          input_date: new Date().toISOString().split('T')[0]
        });
        onUpdate(); // 부모 컴포넌트의 데이터 새로고침
      } else {
        setMessage(`오류: ${data.message}`);
      }
    } catch (error) {
      setMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('정말로 이 도서를 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('도서가 삭제되었습니다.');
        onUpdate(); // 부모 컴포넌트의 데이터 새로고침
      } else {
        setMessage(`오류: ${data.message}`);
      }
    } catch (error) {
      setMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const isPaid = (book) => {
    return (book.checking === true || book.checking === 1) || 
           (book.payment_date && book.payment_date !== null);
  };

  return (
    <div className="admin-panel-overlay">
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>관리자 패널 - {studentInfo.studentName}</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {message && (
          <div className={`admin-message ${message.includes('오류') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="admin-section">
          <h3>도서 목록 관리</h3>
          <div className="books-management">
            {[...studentInfo.unpaidBooks, ...studentInfo.paidBooks].map(book => (
              <div key={book.id} className={`book-item ${isPaid(book) ? 'paid' : 'unpaid'}`}>
                <div className="book-info">
                  <span className="book-name">{book.book_name}</span>
                  <span className="book-price">{book.price.toLocaleString()}원</span>
                  <span className={`book-status ${isPaid(book) ? 'paid' : 'unpaid'}`}>
                    {isPaid(book) ? '납부완료' : '미납'}
                  </span>
                  {book.payment_date && (
                    <span className="payment-date">수납일: {book.payment_date}</span>
                  )}
                </div>
                <div className="book-actions">
                  <button
                    onClick={() => handlePaymentToggle(book.id, isPaid(book), book.payment_date)}
                    disabled={loading}
                    className={`toggle-payment ${isPaid(book) ? 'mark-unpaid' : 'mark-paid'}`}
                  >
                    {isPaid(book) ? '미납으로 변경' : '납부완료로 변경'}
                  </button>
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    disabled={loading}
                    className="delete-book"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-section">
          <h3>새 도서 추가</h3>
          <form onSubmit={handleAddBook} className="add-book-form">
            <div className="form-group">
              <label>도서명:</label>
              <input
                type="text"
                value={newBook.book_name}
                onChange={(e) => setNewBook({...newBook, book_name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>가격:</label>
              <input
                type="number"
                value={newBook.price}
                onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>입력일:</label>
              <input
                type="date"
                value={newBook.input_date}
                onChange={(e) => setNewBook({...newBook, input_date: e.target.value})}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="add-book-button">
              {loading ? '추가 중...' : '도서 추가'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
