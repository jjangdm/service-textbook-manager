const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./student');

const Book = sequelize.define('Book', {
  input_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  book_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  checking: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
}, {
  tableName: 'books',
  timestamps: false,
});

Book.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(Book, { foreignKey: 'studentId' });

module.exports = Book;
