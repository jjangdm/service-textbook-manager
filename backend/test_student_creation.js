const sequelize = require('./config/database');
const Student = require('./models/student');
const Book = require('./models/book');

async function testStudentCreation() {
  try {
    // 데이터베이스 연결
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 현재 학생 수 확인
    const studentCountBefore = await Student.count();
    console.log(`📊 현재 학생 수: ${studentCountBefore}명`);

    // 새 학생 추가 테스트
    const timestamp = Date.now().toString();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const testStudentCode = (timestamp.slice(-5) + randomNum).slice(0, 8);
    
    console.log(`🧪 테스트 학생 추가: 테스트학생 (${testStudentCode})`);
    
    const newStudent = await Student.create({
      name: '테스트학생',
      student_code: testStudentCode
    });

    console.log(`✅ 학생 추가 성공:`, {
      id: newStudent.id,
      name: newStudent.name,
      student_code: newStudent.student_code,
      createdAt: newStudent.createdAt
    });

    // 추가 후 학생 수 확인
    const studentCountAfter = await Student.count();
    console.log(`📊 추가 후 학생 수: ${studentCountAfter}명`);

    // 방금 추가한 학생 조회 테스트
    const foundStudent = await Student.findOne({
      where: { student_code: testStudentCode }
    });

    if (foundStudent) {
      console.log('✅ 학생 조회 성공: 데이터베이스에 정상 저장됨');
    } else {
      console.log('❌ 학생 조회 실패: 저장되지 않음');
    }

    // 최근 5명 학생 목록 조회
    const recentStudents = await Student.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    console.log('\n📋 최근 추가된 학생 5명:');
    recentStudents.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name} (${student.student_code}) - ${student.createdAt}`);
    });

    // 테스트 학생 삭제 (정리)
    await newStudent.destroy();
    console.log(`🧹 테스트 학생 삭제 완료`);

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await sequelize.close();
    console.log('📴 데이터베이스 연결 종료');
  }
}

testStudentCreation();
