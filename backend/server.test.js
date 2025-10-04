const request = require('supertest');
const app = require('./server');
const sequelize = require('./config/database');
const Student = require('./models/student');
const Book = require('./models/book');

describe('Admin API', () => {
    beforeAll(async () => {
        // Switch to a test database environment
        process.env.NODE_ENV = 'test';
        await sequelize.sync({ force: true });
    });

    beforeEach(async () => {
        await Book.destroy({ where: {} });
        await Student.destroy({ where: {} });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('GET /api/admin/books/search', () => {
        it('should return the most recent price for a book when multiple entries exist', async () => {
            // 1. Create a student to associate books with
            const student = await Student.create({ name: 'Test Student', student_code: 'TS001' });

            // 2. Create multiple book entries for the same book with different prices and dates
            await Book.create({
                book_name: 'Advanced Math',
                price: 15000,
                input_date: '2023-01-01',
                studentId: student.id,
            });

            // This is the most recent entry and should be the one returned
            await Book.create({
                book_name: 'Advanced Math',
                price: 20000,
                input_date: '2023-02-01',
                studentId: student.id,
            });

            await Book.create({
                book_name: 'Advanced Math',
                price: 18000,
                input_date: '2023-01-15',
                studentId: student.id,
            });

            await Book.create({
                book_name: 'Basic Science',
                price: 12000,
                input_date: '2023-03-01',
                studentId: student.id,
            });

            // 3. Make the API call to search for the book
            const response = await request(app)
                .get('/api/admin/books/search?query=Advanced');

            // 4. Assert the response is correct
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].book_name).toBe('Advanced Math');
            expect(response.body[0].recent_price).toBe(20000);
        });

        it('should return an empty array if no books match the query', async () => {
            const response = await request(app)
                .get('/api/admin/books/search?query=NonExistent');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('should return an empty array if query is too short', async () => {
            const response = await request(app)
                .get('/api/admin/books/search?query=a');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });
    });
});