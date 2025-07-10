const fs = require('fs');
const path = require('path');
const sequelize = require('./config/database');
const Student = require('./models/student');
const Book = require('./models/book');

async function importData() {
  try {
    // Ensure tables are created (and potentially cleared if force: true is used in server.js)
    await sequelize.sync({ force: true }); 
    console.log('Database & tables created/synced!');

    const dataPath = path.join(__dirname, '..', 'extracted_data.json');
    const rawData = fs.readFileSync(dataPath);
    const data = JSON.parse(rawData);

    console.log('Importing students...');
    const studentMap = {}; // Map student_code to new Sequelize student ID
    for (const studentData of data.students) {
      const newStudent = await Student.create({
        name: studentData.name,
        student_code: studentData.student_code,
      });
      studentMap[studentData.student_code] = newStudent.id;
    }
    console.log('Students imported.');

    console.log('Importing books...');
    for (const bookData of data.books) {
      if (studentMap[bookData.student_code]) {
        await Book.create({
          input_date: bookData.input_date,
          book_name: bookData.book_name,
          price: bookData.price,
          checking: bookData.checking,
          payment_date: bookData.payment_date,
          studentId: studentMap[bookData.student_code], // Link to new student ID
        });
      } else {
        console.warn(`Skipping book '${bookData.book_name}' for unknown student_code: ${bookData.student_code}`);
      }
    }
    console.log('Books imported.');

    console.log('Data import complete!');
  } catch (error) {
    console.error('Error during data import:', error);
  } finally {
    await sequelize.close();
  }
}

importData();
