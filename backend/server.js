const express = require('express');
const { Op } = require('sequelize');
const sequelize = require('./config/database');
const Student = require('./models/student');
const Book = require('./models/book');

const app = express();
const PORT = process.env.PORT || 8080;

// 환경별 설정
const isDevelopment = process.env.NODE_ENV !== 'production';
const allowedOrigins = [
  'http://localhost:3000',
  'https://mclass.store',
  'https://www.mclass.store',
  process.env.FRONTEND_URL, // 환경변수에서 가져온 URL
].filter(Boolean); // undefined 제거

console.log('🚀 서버 시작 정보:');
console.log('📊 환경:', process.env.NODE_ENV || 'development');
console.log('🔌 포트:', PORT);
console.log('🌐 허용된 도메인:', allowedOrigins);

app.use(express.json());

// 개선된 CORS 설정
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // 개발 환경에서는 모든 도메인 허용
  if (isDevelopment) {
    res.header('Access-Control-Allow-Origin', '*');
  } else {
    // 프로덕션에서는 허용된 도메인만
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Database synchronization
sequelize.sync().then(() => {
  console.log('✅ 데이터베이스 연결 성공!');
}).catch(err => {
  console.error('❌ 데이터베이스 연결 실패:', err);
});

// 기본 라우트 - 서버 상태 확인
app.get('/', (req, res) => {
  res.json({
    message: '🎓 교재 관리 시스템 백엔드',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// API 상태 확인 엔드포인트
app.get('/api/status', (req, res) => {
  res.json({
    api: 'running',
    database: 'connected',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// 전체 학생 목록 조회 (디버깅용)
app.get('/api/students', async (req, res) => {
  try {
    console.log('📋 전체 학생 목록 조회 요청');
    const students = await Student.findAll();
    console.log(`📊 총 ${students.length}명의 학생 찾음`);
    res.json(students);
  } catch (error) {
    console.error('💥 학생 목록 조회 오류:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      details: '학생 목록을 가져올 수 없습니다.'
    });
  }
});

// 학생 정보 및 도서 조회
app.get('/api/student-info', async (req, res) => {
  const { student_code, name } = req.query;

  console.log(`🔍 학생 정보 조회: ${name} (${student_code})`);

  if (!student_code || !name) {
    console.log('❌ 필수 파라미터 누락');
    return res.status(400).json({ 
      error: 'Missing parameters',
      message: '학생 코드와 이름이 필요합니다.',
      required: ['student_code', 'name']
    });
  }

  try {
    const student = await Student.findOne({
      where: { 
        student_code: student_code.trim(), 
        name: name.trim() 
      },
      include: [{ 
        model: Book,
        order: [['input_date', 'DESC']]
      }],
    });

    if (!student) {
      console.log(`❌ 학생을 찾을 수 없음: ${name} (${student_code})`);
      return res.status(404).json({ 
        error: 'Student not found',
        message: '학생 정보를 찾을 수 없습니다. 이름과 코드를 다시 확인해주세요.',
        searched: { name, student_code }
      });
    }

    // 납부 상태 판별 로직
    const unpaidBooks = student.Books.filter(book => 
      (book.checking === false || book.checking === 0 || book.checking === null) && 
      (!book.payment_date || book.payment_date === null || book.payment_date === '')
    );
    
    const paidBooks = student.Books.filter(book => 
      (book.checking === true || book.checking === 1) || 
      (book.payment_date && book.payment_date !== null && book.payment_date !== '')
    );
    
    const totalUnpaidAmount = unpaidBooks.reduce((sum, book) => sum + (book.price || 0), 0);

    console.log(`📊 ${name}: 미납 ${unpaidBooks.length}권(${totalUnpaidAmount.toLocaleString()}원), 납부 ${paidBooks.length}권`);

    const result = {
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
    };

    res.json(result);

  } catch (error) {
    console.error(`💥 학생 정보 조회 오류 (${name}):`, error);
    res.status(500).json({ 
      error: 'Server error',
      message: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 총 미납액 조회
app.get('/api/admin/total-unpaid', async (req, res) => {
  try {
    console.log('📊 총 미납액 계산 시작...');
    
    const totalUnpaid = await Book.sum('price', {
      where: {
        [Op.and]: [
          { checking: { [Op.or]: [false, 0, null] } },
          { payment_date: { [Op.or]: [null, ''] } }
        ]
      }
    });

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
        required: true
      }]
    });

    const actualTotal = totalUnpaid || 0;
    console.log(`💰 계산된 총 미납액: ${actualTotal.toLocaleString()}원`);

    res.json({
      success: true,
      totalUnpaidAmount: actualTotal,
      unpaidBooksCount: unpaidBooksCount,
      studentsWithUnpaidBooks: studentsWithUnpaidBooks,
      message: `총 ${studentsWithUnpaidBooks}명의 학생이 ${unpaidBooksCount}권의 미납 도서를 보유하고 있습니다.`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 총 미납액 계산 오류:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      totalUnpaidAmount: 0,
      unpaidBooksCount: 0,
      studentsWithUnpaidBooks: 0,
      timestamp: new Date().toISOString()
    });
  }
});

// 관리자 인증
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  
  console.log('🔐 관리자 로그인 시도');
  
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (password === adminPassword || password === 'mclass0104') {
    console.log('✅ 관리자 인증 성공');
    res.json({ 
      success: true, 
      message: 'Authentication successful',
      token: 'admin-token-' + Date.now()
    });
  } else {
    console.log('❌ 관리자 인증 실패');
    res.status(401).json({ 
      success: false, 
      message: 'Invalid password' 
    });
  }
});

// 학생 검색
app.get('/api/admin/students/search', async (req, res) => {
  const { query } = req.query;
  
  console.log(`🔍 학생 검색: "${query}"`);
  
  if (!query || query.length < 2) {
    return res.status(400).json({ 
      message: 'Search query must be at least 2 characters.',
      provided: query 
    });
  }

  try {
    const students = await Student.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { student_code: { [Op.like]: `%${query}%` } }
        ]
      },
      limit: 20,
      order: [['name', 'ASC']]
    });

    console.log(`📋 검색 결과: ${students.length}명`);
    res.json(students);
  } catch (error) {
    console.error('💥 학생 검색 오류:', error);
    res.status(500).json({ 
      message: 'Server error searching students.',
      error: error.message 
    });
  }
});

// 학생 추가
app.post('/api/admin/students', async (req, res) => {
  const { name, student_code } = req.body;
  
  console.log(`👤 새 학생 추가: ${name}`);
  
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ 
      success: false,
      message: '학생 이름은 2자 이상이어야 합니다.' 
    });
  }

  try {
    let finalStudentCode = student_code;
    
    if (!finalStudentCode) {
      const timestamp = Date.now().toString();
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      finalStudentCode = (timestamp.slice(-5) + randomNum).slice(0, 8);
      
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
      const existingStudent = await Student.findOne({
        where: { student_code: finalStudentCode }
      });

      if (existingStudent) {
        return res.status(400).json({ 
          success: false,
          message: '이미 존재하는 학생 코드입니다.' 
        });
      }
    }

    const newStudent = await Student.create({
      name: name.trim(),
      student_code: finalStudentCode
    });

    console.log(`✅ 학생 추가 성공: ${newStudent.name} (${newStudent.student_code})`);

    res.json({
      success: true,
      message: `학생 ${name} (${finalStudentCode})이 성공적으로 추가되었습니다.`,
      student: newStudent
    });
  } catch (error) {
    console.error('💥 학생 추가 오류:', error);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

// 학생 삭제
app.delete('/api/admin/students/:id', async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`🗑️ 학생 삭제 요청: ID ${id}`);
    
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

    await Book.destroy({ where: { studentId: id } });
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

// 교재 추가
app.post('/api/students/:studentCode/books', async (req, res) => {
  const { studentCode } = req.params;
  const { book_name, price, input_date } = req.body;

  console.log(`📚 교재 추가: ${book_name} → 학생 ${studentCode}`);

  try {
    const student = await Student.findOne({ where: { student_code: studentCode } });
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found.' 
      });
    }

    const newBook = await Book.create({
      input_date: input_date || new Date().toISOString().split('T')[0],
      book_name: book_name.trim(),
      price: parseInt(price),
      checking: false,
      payment_date: null,
      studentId: student.id
    });

    console.log(`✅ 교재 추가 성공: ${book_name}`);

    res.json({ 
      success: true,
      message: `교재 "${book_name}"이 추가되었습니다.`,
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
    console.error('💥 교재 추가 오류:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error adding new book.',
      error: error.message 
    });
  }
});

// 납부 처리
app.put('/api/books/:id/mark-paid', async (req, res) => {
  const { id } = req.params;
  const { payment_date } = req.body;

  console.log(`💰 납부 처리: 도서 ID ${id}`);

  try {
    const book = await Book.findByPk(id);
    
    if (!book) {
      return res.status(404).json({ 
        success: false,
        message: 'Book not found.' 
      });
    }

    book.payment_date = payment_date || new Date().toISOString().split('T')[0];
    book.checking = true;
    await book.save();

    console.log(`✅ 납부 처리 완료: ${book.book_name}`);

    res.json({ 
      success: true,
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
    console.error('💥 납부 처리 오류:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error marking book as paid.',
      error: error.message 
    });
  }
});

// 교재 검색 (자동완성)
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
    console.error('💥 교재 검색 오류:', error);
    res.status(500).json({ 
      message: 'Server error searching books.',
      error: error.message 
    });
  }
});

// 글로벌 에러 핸들러
app.use((error, req, res, next) => {
  console.error('💥 전역 에러:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: '서버에서 오류가 발생했습니다.',
    timestamp: new Date().toISOString()
  });
});

// 404 핸들러
app.use((req, res) => {
  console.log(`❓ 404 - 경로를 찾을 수 없음: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Not Found',
    message: `경로를 찾을 수 없습니다: ${req.method} ${req.path}`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/status',
      'GET /api/student-info',
      'GET /api/admin/total-unpaid',
      'POST /api/admin/login'
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다!`);
  console.log(`🌐 환경: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 URL: http://0.0.0.0:${PORT}`);
});
