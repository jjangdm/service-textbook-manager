const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.NODE_ENV === 'test') {
  sequelize = new Sequelize('sqlite::memory:', { logging: false });
} else {
  // __dirname은 현재 파일(database.js)이 있는 디렉토리(config)를 가리킵니다.
  // path.join을 사용하여 한 단계 상위 디렉토리(backend)에 있는 db.sqlite3 파일의 절대 경로를 생성합니다.
  const storagePath = path.join(__dirname, '..', 'db.sqlite3');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: process.env.NODE_ENV === 'development' // 개발 환경에서만 로그 활성화
  });
}

module.exports = sequelize;