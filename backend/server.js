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
    return res.status(400).json({ message: 'Student code and name are required.' });
  }

  try {
    const student = await Student.findOne({
      where: { student_code, name },
      include: [{ model: Book }],
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // checking 필드와 payment_date 모두 고려하여 납부 여부 판단
    const unpaidBooks = student.Books.filter(book => 
      (book.checking === false || book.checking === 0) && 
      (!book.payment_date || book.payment_date === null)
    );
    const paidBooks = student.Books.filter(book => 
      (book.checking === true || book.checking === 1) || 
      (book.payment_date && book.payment_date !== null)
    );
    const totalUnpaidAmount = unpaidBooks.reduce((sum, book) => sum + book.price, 0);

    res.json({
      studentName: student.name,
      unpaidBooks,
      paidBooks,
      totalUnpaidAmount,
      accountInfo: '국민은행 123-456789-01-234 (예금주: 홍길동)' // Example account info
    });

  } catch (error) {
    console.error('Error fetching student info:', error);
    res.status(500).json({ message: 'Server error.' });
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
  
  if (!name || !student_code) {
    return res.status(400).json({ message: 'Student name and code are required.' });
  }

  try {
    // 중복 학생 코드 확인
    const existingStudent = await Student.findOne({
      where: { student_code }
    });

    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this code already exists.' });
    }

    // 새 학생 생성
    const newStudent = await Student.create({
      name,
      student_code
    });

    res.json({
      success: true,
      message: `Student ${name} (${student_code}) has been added successfully.`,
      student: newStudent
    });
  } catch (error) {
    console.error('Error adding new student:', error);
    res.status(500).json({ message: 'Server error adding new student.' });
  }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});