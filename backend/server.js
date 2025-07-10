const express = require('express');
const { Op } = require('sequelize');
const sequelize = require('./config/database');
const Student = require('./models/student');
const Book = require('./models/book');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// CORS 설정 추가 (프론트엔드에서 PUT/POST 요청을 위해)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Database synchronization
sequelize.sync().then(() => {
  console.log('Database & tables created!');
});

app.get('/', (req, res) => {
    res.send('Hello from Backend!');
});

// Temporary API endpoint to list all students for debugging
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.findAll();
    res.json(students);
  } catch (error) {
    console.error('Error fetching all students:', error);
    res.status(500).json({ message: 'Server error fetching students.' });
  }
});

// API endpoint to get student's book and payment info
app.get('/api/student-info', async (req, res) => {
  const { student_code, name } = req.query;

  if (!student_code || !name) {
    return res.status(400).json({ 
      error: 'Student code and name are required.',
      message: 'Student code and name are required.' 
    });
  }

  try {
    console.log(`🔍 학생 정보 조회: ${name} (${student_code})`);
    
    const student = await Student.findOne({
      where: { student_code, name },
      include: [{ 
        model: Book,
        order: [['input_date', 'DESC']]
      }],
    });

    if (!student) {
      console.log(`❌ 학생을 찾을 수 없음: ${name} (${student_code})`);
      return res.status(404).json({ 
        error: 'Student not found.',
        message: 'Student not found.' 
      });
    }

    // checking 필드와 payment_date 모두 고려하여 납부 여부 판단
    const unpaidBooks = student.Books.filter(book => 
      (book.checking === false || book.checking === 0 || book.checking === null) && 
      (!book.payment_date || book.payment_date === null || book.payment_date === '')
    );
    
    const paidBooks = student.Books.filter(book => 
      (book.checking === true || book.checking === 1) || 
      (book.payment_date && book.payment_date !== null && book.payment_date !== '')
    );
    
    const totalUnpaidAmount = unpaidBooks.reduce((sum, book) => sum + book.price, 0);

    console.log(`📊 ${name}: 미납 ${unpaidBooks.length}권(${totalUnpaidAmount.toLocaleString()}원), 납부 ${paidBooks.length}권`);

    res.json({
      studentName: student.name,
      studentCode: student.student_code,
      unpaidBooks: unpaidBooks.map(book => ({
        id: book.id,
        book_name: book.book_name,
        price: book.price,
        input_date: book.input_date,
        checking: book.checking,
        payment_date: book.payment_date
      })),
      paidBooks: paidBooks.map(book => ({
        id: book.id,
        book_name: book.book_name,
        price: book.price,
        input_date: book.input_date,
        checking: book.checking,
        payment_date: book.payment_date
      })),
      totalUnpaidAmount,
      accountInfo: '신한은행 110-247-214359 장동민(엠클래스수학과학전문학원)'
    });

  } catch (error) {
    console.error(`💥 학생 정보 조회 오류 (${name}):`, error);
    res.status(500).json({ 
      error: 'Server error.',
      message: 'Server error.' 
    });
  }
});

// API endpoint to get total unpaid amount from all students
app.get('/api/admin/total-unpaid', async (req, res) => {
  try {
    console.log('📊 총 미납액 계산 시작...');
    
    // 미납 도서의 총 금액 계산
    // checking이 false이고 payment_date가 null인 경우를 미납으로 간주
    const totalUnpaid = await Book.sum('price', {
      where: {
        [Op.and]: [
          { checking: { [Op.or]: [false, 0, null] } },
          { payment_date: { [Op.or]: [null, ''] } }
        ]
      }
    });

    const actualTotal = totalUnpaid || 0;
    console.log(`💰 계산된 총 미납액: ${actualTotal.toLocaleString()}원`);

    // 추가 정보: 미납 도서 수와 미납 학생 수도 함께 제공
    const unpaidBooksCount = await Book.count({
      where: {
        [Op.and]: [
          { checking: { [Op.or]: [false, 0, null] } },
          { payment_date: { [Op.or]: [null, ''] } }
        ]
      }
    });

    const studentsWithUnpaidBooks = await Student.count({
      include: [{
        model: Book,
        where: {
          [Op.and]: [
            { checking: { [Op.or]: [false, 0, null] } },
            { payment_date: { [Op.or]: [null, ''] } }
          ]
        },
        required: true // INNER JOIN to only count students with unpaid books
      }]
    });

    res.json({
      success: true,
      totalUnpaidAmount: actualTotal,
      unpaidBooksCount: unpaidBooksCount,
      studentsWithUnpaidBooks: studentsWithUnpaidBooks,
      message: `총 ${studentsWithUnpaidBooks}명의 학생이 ${unpaidBooksCount}권의 미납 도서를 보유하고 있습니다.`
    });

  } catch (error) {
    console.error('💥 총 미납액 계산 오류:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      totalUnpaidAmount: 0,
      unpaidBooksCount: 0,
      studentsWithUnpaidBooks: 0
    });
  }
});

// API endpoint to get all students (for admin dashboard)
app.get('/api/admin/students/all', async (req, res) => {
  try {
    console.log('👥 전체 학생 목록 조회...');
    
    const students = await Student.findAll({
      attributes: ['id', 'name', 'student_code'],
      order: [['name', 'ASC']]
    });

    console.log(`📋 총 ${students.length}명의 학생 조회 완료`);

    res.json({
      success: true,
      students: students,
      totalCount: students.length
    });

  } catch (error) {
    console.error('💥 학생 목록 조회 오류:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      students: [],
      totalCount: 0
    });
  }
});

// API endpoint to delete student and all their books
app.delete('/api/admin/students/:id', async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`🗑️ 학생 삭제 요청: ID ${id}`);
    
    // 학생 정보 먼저 조회
    const student = await Student.findByPk(id, {
      include: [{ model: Book }]
    });

    if (!student) {
      console.log(`❌ 삭제할 학생을 찾을 수 없음: ID ${id}`);
      return res.status(404).json({ 
        success: false,
        message: 'Student not found.' 
      });
    }

    const studentName = student.name;
    const studentCode = student.student_code;
    const booksCount = student.Books.length;

    // 먼저 해당 학생의 모든 도서 삭제
    await Book.destroy({
      where: { studentId: id }
    });

    // 그 다음 학생 삭제
    await student.destroy();

    console.log(`✅ 학생 삭제 완료: ${studentName} (${studentCode}) - ${booksCount}권의 도서도 함께 삭제됨`);

    res.json({
      success: true,
      message: `학생 "${studentName}" (${studentCode})과 관련된 ${booksCount}권의 도서가 모두 삭제되었습니다.`,
      deleted: true,
      deletedStudent: {
        id: id,
        name: studentName,
        student_code: studentCode
      },
      deletedBooksCount: booksCount
    });

  } catch (error) {
    console.error(`💥 학생 삭제 오류 (ID: ${id}):`, error);
    res.status(500).json({ 
      success: false,
      deleted: false,
      error: error.message,
      message: 'Server error deleting student.' 
    });
  }
});

// API endpoint to update book payment status
app.put('/api/books/:id/payment', async (req, res) => {
  const { id } = req.params;
  const { payment_date, checking } = req.body;

  try {
    const book = await Book.findByPk(id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    // 납부 상태 업데이트
    book.payment_date = payment_date;
    book.checking = checking;
    await book.save();

    res.json({ 
      message: 'Payment status updated successfully.',
      book: {
        id: book.id,
        book_name: book.book_name,
        price: book.price,
        checking: book.checking,
        payment_date: book.payment_date
      }
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Server error updating payment status.' });
  }
});

// API endpoint to add new book to student
app.post('/api/students/:studentCode/books', async (req, res) => {
  const { studentCode } = req.params;
  const { book_name, price, input_date } = req.body;

  try {
    const student = await Student.findOne({ where: { student_code: studentCode } });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const newBook = await Book.create({
      input_date: input_date || new Date().toISOString().split('T')[0],
      book_name,
      price: parseInt(price),
      checking: false,
      payment_date: null,
      studentId: student.id
    });

    res.json({ 
      message: 'Book added successfully.',
      book: {
        id: newBook.id,
        book_name: newBook.book_name,
        price: newBook.price,
        checking: newBook.checking,
        payment_date: newBook.payment_date,
        input_date: newBook.input_date
      }
    });

  } catch (error) {
    console.error('Error adding new book:', error);
    res.status(500).json({ message: 'Server error adding new book.' });
  }
});

// API endpoint to delete book
app.delete('/api/books/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const book = await Book.findByPk(id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    await book.destroy();
    res.json({ message: 'Book deleted successfully.' });

  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Server error deleting book.' });
  }
});

// Admin authentication endpoint
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  
  // 간단한 비밀번호 인증 (실제 운영시에는 더 복잡한 인증 필요)
  const adminPassword = 'admin123'; // 나중에 환경변수로 관리
  
  if (password === adminPassword) {
    res.json({ 
      success: true, 
      message: 'Authentication successful',
      token: 'admin-token-' + Date.now() // 간단한 토큰
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid password' 
    });
  }
});

// API endpoint to search students
app.get('/api/admin/students/search', async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.length < 2) {
    return res.status(400).json({ message: 'Search query must be at least 2 characters.' });
  }

  try {
    const students = await Student.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { student_code: { [Op.like]: `%${query}%` } }
        ]
      },
      limit: 20
    });

    res.json(students);
  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({ message: 'Server error searching students.' });
  }
});

// API endpoint to get book price history
app.get('/api/admin/books/price-history', async (req, res) => {
  const { book_name } = req.query;
  
  if (!book_name) {
    return res.status(400).json({ message: 'Book name is required.' });
  }

  try {
    // 해당 교재의 가장 최근 가격 조회
    const recentBook = await Book.findOne({
      where: { 
        book_name: { [Op.like]: `%${book_name}%` }
      },
      order: [['input_date', 'DESC']]
    });

    if (recentBook) {
      res.json({ 
        book_name: recentBook.book_name,
        recent_price: recentBook.price,
        input_date: recentBook.input_date
      });
    } else {
      res.json({ 
        book_name: book_name,
        recent_price: null,
        input_date: null
      });
    }
  } catch (error) {
    console.error('Error fetching book price history:', error);
    res.status(500).json({ message: 'Server error fetching price history.' });
  }
});

// API endpoint to search book names for autocomplete
app.get('/api/admin/books/search', async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.length < 2) {
    return res.json([]);
  }

  try {
    const books = await Book.findAll({
      attributes: ['book_name', 'price'],
      where: {
        book_name: { [Op.like]: `%${query}%` }
      },
      group: ['book_name'],
      order: [['input_date', 'DESC']],
      limit: 10
    });

    const uniqueBooks = books.map(book => ({
      book_name: book.book_name,
      recent_price: book.price
    }));

    res.json(uniqueBooks);
  } catch (error) {
    console.error('Error searching books:', error);
    res.status(500).json({ message: 'Server error searching books.' });
  }
});

// API endpoint to add new student
app.post('/api/admin/students', async (req, res) => {
  const { name, student_code } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Student name is required.' });
  }

  try {
    let finalStudentCode = student_code;
    
    // 학생 코드가 제공되지 않은 경우 자동 생성
    if (!finalStudentCode) {
      // 현재 시간 기반으로 8자리 고유번호 생성
      const timestamp = Date.now().toString();
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      finalStudentCode = (timestamp.slice(-5) + randomNum).slice(0, 8);
      
      // 중복 검사 및 재생성
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const existing = await Student.findOne({ where: { student_code: finalStudentCode } });
        if (!existing) {
          isUnique = true;
        } else {
          const newRandomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          finalStudentCode = (timestamp.slice(-4) + newRandomNum).slice(0, 8);
          attempts++;
        }
      }
    } else {
      // 제공된 학생 코드 중복 확인
      const existingStudent = await Student.findOne({
        where: { student_code: finalStudentCode }
      });

      if (existingStudent) {
        return res.status(400).json({ message: 'Student with this code already exists.' });
      }
    }

    // 새 학생 생성
    const newStudent = await Student.create({
      name,
      student_code: finalStudentCode
    });

    res.json({
      success: true,
      message: `Student ${name} (${finalStudentCode}) has been added successfully.`,
      student: newStudent
    });
  } catch (error) {
    console.error('Error adding new student:', error);
    res.status(500).json({ message: 'Server error adding new student.' });
  }
});

// API endpoint to mark book as paid
app.put('/api/books/:id/mark-paid', async (req, res) => {
  const { id } = req.params;
  const { payment_date } = req.body;

  try {
    const book = await Book.findByPk(id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    // 납부 완료로 처리
    book.payment_date = payment_date || new Date().toISOString().split('T')[0];
    book.checking = true;
    await book.save();

    res.json({ 
      message: 'Book marked as paid successfully.',
      book: {
        id: book.id,
        book_name: book.book_name,
        price: book.price,
        checking: book.checking,
        payment_date: book.payment_date
      }
    });

  } catch (error) {
    console.error('Error marking book as paid:', error);
    res.status(500).json({ message: 'Server error marking book as paid.' });
  }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});