const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.NODE_ENV === 'test') {
  sequelize = new Sequelize('sqlite::memory:', { logging: false });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db.sqlite3',
    logging: false
  });
}

module.exports = sequelize;