# 🏫 Service Textbook Manager

교재 미납/납부 조회 시스템 - Student Textbook Payment Management System

## 📋 프로젝트 개요

학생들의 교재 구매 미납금액과 납부 내역을 효율적으로 관리할 수 있는 웹 기반 시스템입니다.

### 🚀 주요 기능
- ✅ 학생별 미납/납부 교재 실시간 조회
- ✅ 관리자 모드를 통한 데이터 관리
- ✅ 납부 상태 즉시 업데이트
- ✅ 교재 추가/삭제 기능
- ✅ 직관적이고 반응형 UI

### 🛠 기술 스택
- **Frontend**: React.js, CSS3
- **Backend**: Node.js, Express.js
- **Database**: SQLite, Sequelize ORM
- **Data Processing**: Python

### 📊 주요 해결 문제
- 기존 데이터의 `checking` 필드와 `payment_date` 불일치 문제 해결
- 358건의 잘못 분류된 교재를 정확하게 재분류
- 실시간 데이터 동기화 구현

### 🎯 대상 사용자
- 학원, 교육기관의 교재 관리 담당자
- 학생/학부모 (납부 현황 조회)
- 관리자 (데이터 관리)

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/YOUR_USERNAME/service-textbook-manager.git
cd service-textbook-manager
```

### 2. 의존성 설치
```bash
# 백엔드
cd backend
npm install

# 프론트엔드
cd ../frontend
npm install
```

### 3. 데이터 설정
```bash
# 루트 디렉토리에서
python extract_data.py  # 기존 데이터 추출
cd backend
node import_data.js     # 데이터베이스 생성 및 임포트
```

### 4. 서버 실행
```bash
# 자동 실행 (Windows)
start_servers.bat

# 또는 수동 실행
# 터미널 1: 백엔드
cd backend && node server.js

# 터미널 2: 프론트엔드  
cd frontend && npm start
```

### 5. 접속
- **웹 애플리케이션**: http://localhost:3000
- **API 서버**: http://localhost:5000

## 📱 사용법

### 일반 사용자
1. 학생 고유 코드와 이름 입력
2. "조회" 버튼 클릭
3. 미납/납부 내역 확인

### 관리자
1. 학생 조회 후 "관리자 모드" 버튼 클릭
2. 납부 상태 변경, 교재 추가/삭제
3. 변경사항 실시간 반영

## 🔧 API 엔드포인트

### 조회 API
- `GET /api/students` - 전체 학생 목록
- `GET /api/student-info` - 특정 학생 정보

### 관리 API
- `PUT /api/books/:id/payment` - 납부 상태 업데이트
- `POST /api/students/:studentCode/books` - 새 교재 추가
- `DELETE /api/books/:id` - 교재 삭제

## 📁 프로젝트 구조

```
service-textbook-manager/
├── backend/              # Express.js 백엔드
│   ├── config/          # 데이터베이스 설정
│   ├── models/          # Sequelize 모델
│   └── server.js        # 메인 서버
├── frontend/            # React 프론트엔드
│   ├── src/
│   │   ├── App.js      # 메인 컴포넌트
│   │   ├── AdminPanel.js # 관리자 패널
│   │   └── *.css       # 스타일시트
│   └── public/
├── extract_data.py      # 데이터 추출 스크립트
├── README.md           # 프로젝트 문서
└── start_servers.bat   # 실행 스크립트
```

## 🧪 테스트 데이터

시스템 테스트를 위한 샘플 학생 정보:
- **이찬**: 코드 `23546699` (미납 5권, 납부 11권)
- **안도연**: 코드 `76315666` (납부 완료)
- **안지완**: 코드 `95878705` (미납 1권)

## 🛡 보안 고려사항

- 민감한 정보는 `.gitignore`에 등록
- 데이터베이스 파일은 로컬에만 저장
- API 엔드포인트 검증 구현

## 🤝 기여 방법

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📜 라이선스

MIT License

## 👨‍💻 개발자

- **개발**: AI Assistant (GitHub Copilot)
- **기획**: 교재 관리 시스템 요구사항 분석 및 구현

---

⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!
